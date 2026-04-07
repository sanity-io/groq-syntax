import {parser} from '@sanity/lezer-groq'
import type {SyntaxNode, TreeCursor} from '@lezer/common'
import type {HighlightToken, CanonicalToken} from './canonical.js'

/**
 * Direct node name -> canonical token mapping for named Lezer nodes.
 */
const STRING_NODES = new Set(['DoubleString', 'SingleString'])

const NODE_MAP: Record<string, CanonicalToken> = {
  LineComment: 'comment',
  StringEscape: 'string.escape',
  Number: 'number',
  True: 'keyword',
  False: 'keyword',
  Null: 'keyword',
  Everything: 'wildcard',
  This: 'variable.special',
  Parent: 'variable.special',
  Parameter: 'variable',
  EqualityOp: 'operator',
  CompareOp: 'operator',
  AddOp: 'operator',
  MulOp: 'operator',
  Exp: 'operator',
  And: 'operator',
  Or: 'operator',
  Not: 'operator',
  In: 'operator.keyword',
  Match: 'operator.keyword',
  Asc: 'operator.keyword',
  Desc: 'operator.keyword',
  Pipe: 'operator.pipe',
  Arrow: 'operator.arrow',
  Deref: 'accessor',
  Ellipsis: 'operator.spread',
  InclusiveRange: 'operator.range',
  NamespaceSep: 'punctuation.namespace',
}

/**
 * Literal token names (Lezer stores these as the character(s) themselves)
 * -> canonical token mapping.
 */
const LITERAL_MAP: Record<string, CanonicalToken> = {
  '[': 'punctuation.bracket',
  ']': 'punctuation.bracket',
  '{': 'punctuation.bracket',
  '}': 'punctuation.bracket',
  '(': 'punctuation.bracket',
  ')': 'punctuation.bracket',
  ',': 'punctuation.delimiter',
  ':': 'punctuation.delimiter',
  '.': 'accessor',
}

/**
 * Determine the canonical token for an Identifier node based on its
 * position within the parent node.
 *
 * - FunctionCall: first child Identifier = function name
 * - NamespacedCall: first child = namespace, child after NamespaceSep = function name
 * - DotAccess / DerefAccess / PropertyPair: plain identifier (property)
 * - Anything else: plain identifier
 */
function classifyIdentifier(node: SyntaxNode): CanonicalToken {
  const parent = node.parent
  if (!parent) return 'identifier'

  const parentName = parent.type.name

  if (parentName === 'FunctionCall') {
    // First Identifier child is the function name; others are arguments
    const firstChild = parent.firstChild
    if (firstChild && firstChild.from === node.from && firstChild.to === node.to) {
      return 'identifier.function'
    }
    return 'identifier'
  }

  if (parentName === 'NamespacedCall') {
    // Fallback for old grammar structure
    const firstChild = parent.firstChild
    if (firstChild && firstChild.from === node.from && firstChild.to === node.to) {
      return 'identifier.namespace'
    }
    const prev = node.prevSibling
    if (prev && prev.type.name === 'NamespaceSep') {
      return 'identifier.function'
    }
    return 'identifier'
  }

  // Identifier wrapped in Namespace or FunctionName nodes
  if (parentName === 'Namespace') {
    return 'identifier.namespace'
  }
  if (parentName === 'FunctionName') {
    return 'identifier.function'
  }

  return 'identifier'
}

/**
 * Map a single leaf node to its canonical token type.
 * Returns undefined for nodes that should be skipped (whitespace, errors, unmapped).
 */
function getCanonicalToken(node: SyntaxNode): CanonicalToken | undefined {
  const name = node.type.name

  // Skip error nodes
  if (node.type.isError) return undefined

  // Check the direct node map first
  if (name in NODE_MAP) {
    return NODE_MAP[name]
  }

  // Identifier needs context-dependent classification
  if (name === 'Identifier') {
    return classifyIdentifier(node)
  }

  // Literal token nodes (brackets, delimiters, dot)
  if (name in LITERAL_MAP) {
    return LITERAL_MAP[name]
  }

  return undefined
}

/**
 * Emit tokens for a string node (DoubleString/SingleString).
 * Named children (StringEscape, closing quote) are emitted with their types.
 * Gaps between named children are the invisible @else content - emitted as 'string'.
 */
function emitStringTokens(node: SyntaxNode, source: string, tokens: HighlightToken[]) {
  let pos = node.from
  for (let child = node.firstChild; child; child = child.nextSibling) {
    // Emit gap before this child as string content
    if (child.from > pos) {
      const gapText = source.slice(pos, child.from)
      if (gapText) {
        tokens.push({
          text: gapText,
          token: 'string',
          start: pos,
          end: child.from,
        })
      }
    }
    // Emit the child
    const childText = source.slice(child.from, child.to)
    if (childText) {
      const token =
        child.type.name === 'StringEscape' ? ('string.escape' as const) : ('string' as const)
      tokens.push({text: childText, token, start: child.from, end: child.to})
    }
    pos = child.to
  }
  // Emit any trailing gap
  if (pos < node.to) {
    const gapText = source.slice(pos, node.to)
    if (gapText) {
      tokens.push({text: gapText, token: 'string', start: pos, end: node.to})
    }
  }
}

/**
 * Check whether a tree cursor is positioned at a leaf node (no children).
 * Uses firstChild() and immediately backs out with parent() to avoid
 * permanently changing cursor position.
 */
function isLeaf(cursor: TreeCursor): boolean {
  if (cursor.firstChild()) {
    cursor.parent()
    return false
  }
  return true
}

/**
 * Tokenize GROQ source using the Lezer parser.
 * Walks the syntax tree collecting leaf nodes and mapping them to canonical token types.
 * Whitespace and error nodes are skipped.
 */
export function tokenizeLezer(source: string): HighlightToken[] {
  const tree = parser.parse(source)
  const tokens: HighlightToken[] = []
  const cursor = tree.cursor()

  // Track ranges we've already emitted tokens for (string nodes)
  const emittedRanges: Array<[number, number]> = []

  do {
    const name = cursor.node.type.name

    // Handle string nodes specially - walk their children to emit content + escapes
    if (STRING_NODES.has(name)) {
      emitStringTokens(cursor.node, source, tokens)
      emittedRanges.push([cursor.from, cursor.to])
      // Let cursor.next() descend naturally; we'll skip children below
      continue
    }

    // Only process leaf nodes (those with no children)
    if (!isLeaf(cursor)) continue

    // Skip leaves inside already-processed string nodes
    if (emittedRanges.some(([from, to]) => cursor.from >= from && cursor.to <= to)) continue

    const text = source.slice(cursor.from, cursor.to)

    // Skip whitespace-only and empty tokens
    if (!text || /^\s+$/.test(text)) continue

    const node = cursor.node
    const canonical = getCanonicalToken(node)
    if (canonical) {
      tokens.push({
        text,
        token: canonical,
        start: cursor.from,
        end: cursor.to,
      })
    }
  } while (cursor.next())

  return tokens
}
