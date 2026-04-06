import {refractor} from 'refractor/core'
import type {Element, Text} from 'hast'
import groqGrammar from '../../prism-groq/groq.js'
import type {HighlightToken, CanonicalToken} from './canonical.js'

// Register GROQ with refractor
const groqSyntax = Object.assign(
  (prism: {languages: Record<string, unknown>}) => {
    prism.languages.groq = groqGrammar
  },
  {displayName: 'groq', aliases: [] as string[]},
)
refractor.register(groqSyntax)

/** Map Prism token class names to canonical token types. */
const TOKEN_MAP: Record<string, CanonicalToken> = {
  comment: 'comment',
  string: 'string',
  escape: 'string.escape',
  number: 'number',
  boolean: 'keyword',
  null: 'keyword',
  'keyword-operator': 'operator.keyword',
  function: 'identifier.function',
  namespace: 'identifier.namespace',
  'namespace-separator': 'punctuation.namespace',
  'namespaced-function': 'identifier.function',
  variable: 'variable',
  'special-variable': 'variable.special',
  wildcard: 'wildcard',
  spread: 'operator.spread',
  dereference: 'accessor',
  pipe: 'operator.pipe',
  operator: 'operator',
  punctuation: 'punctuation.delimiter',
  accessor: 'accessor',
  identifier: 'identifier',
}

/** Map Prism alias class names to canonical token types (fallback). */
const ALIAS_MAP: Record<string, CanonicalToken> = {
  'class-name': 'identifier.namespace',
}

/** Bracket characters that should be punctuation.bracket instead of punctuation.delimiter. */
const BRACKETS = new Set(['[', ']', '{', '}', '(', ')'])

function classToCanonical(classes: string[]): CanonicalToken | undefined {
  // Check direct token classes first (skip 'token' which is always present)
  for (const cls of classes) {
    if (cls === 'token') continue
    if (cls in TOKEN_MAP) return TOKEN_MAP[cls]
  }
  // Check aliases
  for (const cls of classes) {
    if (cls in ALIAS_MAP) return ALIAS_MAP[cls]
  }
  return undefined
}

/**
 * Tokenize GROQ source using refractor (Prism.js).
 * Walks the HAST tree produced by refractor and maps token classes to canonical types.
 */
export function tokenizePrism(source: string): HighlightToken[] {
  const tree = refractor.highlight(source, 'groq')
  const tokens: HighlightToken[] = []
  let offset = 0

  function walk(node: Element | Text, parentClasses: string[]) {
    if (node.type === 'text') {
      const text = node.value
      if (/^\s+$/.test(text)) {
        offset += text.length
        return
      }

      const canonical = classToCanonical(parentClasses)
      if (canonical) {
        // Distinguish brackets from other punctuation
        const token =
          canonical === 'punctuation.delimiter' && BRACKETS.has(text)
            ? 'punctuation.bracket' as CanonicalToken
            : canonical

        tokens.push({
          text,
          token,
          start: offset,
          end: offset + text.length,
        })
      }
      offset += text.length
      return
    }

    // Element node - extract classes and recurse
    const classes = (node.properties?.className ?? []) as string[]
    const mergedClasses = classes.length > 0 ? classes : parentClasses

    for (const child of node.children) {
      walk(child as Element | Text, mergedClasses)
    }
  }

  for (const child of tree.children) {
    walk(child as Element | Text, [])
  }

  return tokens
}
