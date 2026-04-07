import {Parser, Language, type Node} from 'web-tree-sitter'
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import type {HighlightToken, CanonicalToken} from './canonical.js'

let initPromise: Promise<Parser> | undefined

async function getParser(): Promise<Parser> {
  if (!initPromise) {
    initPromise = initParser()
  }
  return initPromise
}

async function initParser(): Promise<Parser> {
  // web-tree-sitter needs its own WASM runtime loaded first.
  // In Node.js it typically resolves this from the package directory,
  // but we pass locateFile to be explicit.
  const webTreeSitterWasm = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'node_modules',
    'web-tree-sitter',
    'tree-sitter.wasm'
  )
  await Parser.init({
    locateFile: (scriptName: string) => {
      if (scriptName === 'tree-sitter.wasm') return webTreeSitterWasm
      return scriptName
    },
  })

  const parser = new Parser()

  const wasmPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'tree-sitter-groq',
    'tree-sitter-groq.wasm'
  )
  const wasmBytes = await readFile(wasmPath)
  const language = await Language.load(wasmBytes)
  parser.setLanguage(language)
  return parser
}

/**
 * Named leaf node type -> canonical token mapping.
 * These are nodes that are leaves in the CST (no children), identified by their
 * tree-sitter node type name.
 */
const NAMED_LEAF_MAP: Record<string, CanonicalToken> = {
  comment: 'comment',
  string_content: 'string',
  escape_sequence: 'string.escape',
  number: 'number',
  true: 'keyword',
  false: 'keyword',
  null: 'keyword',
  this: 'variable.special',
  parent: 'variable.special',
  parameter: 'variable',
}

/**
 * Named nodes that wrap a single anonymous child and should be mapped
 * as a whole to a canonical token. `everything` contains anonymous `*`.
 */
const NAMED_WRAPPER_MAP: Record<string, CanonicalToken> = {
  everything: 'wildcard',
}

/**
 * Anonymous node text -> canonical token mapping.
 * Anonymous nodes are operators, punctuation, and keywords that appear
 * as literal strings in the grammar rules.
 */
const ANON_MAP: Record<string, CanonicalToken> = {
  '==': 'operator',
  '!=': 'operator',
  '<': 'operator',
  '>': 'operator',
  '<=': 'operator',
  '>=': 'operator',
  '&&': 'operator',
  '||': 'operator',
  '!': 'operator',
  '+': 'operator',
  '-': 'operator',
  '*': 'operator',
  '/': 'operator',
  '%': 'operator',
  '**': 'operator',
  '|': 'operator.pipe',
  '=>': 'operator.arrow',
  '->': 'accessor',
  '..': 'operator.range',
  '...': 'operator.spread',
  in: 'operator.keyword',
  match: 'operator.keyword',
  asc: 'operator.keyword',
  desc: 'operator.keyword',
  '::': 'punctuation.namespace',
  '.': 'accessor',
  '(': 'punctuation.bracket',
  ')': 'punctuation.bracket',
  '[': 'punctuation.bracket',
  ']': 'punctuation.bracket',
  '{': 'punctuation.bracket',
  '}': 'punctuation.bracket',
  ',': 'punctuation.delimiter',
  ':': 'punctuation.delimiter',
  '"': 'string',
  "'": 'string',
}

/**
 * Determine the canonical token type for an identifier based on its
 * structural position in the tree (function name, namespace, property, etc.).
 */
function classifyIdentifier(node: Node): CanonicalToken {
  const parent = node.parent
  if (!parent) return 'identifier'

  if (parent.type === 'function_call') {
    const funcField = parent.childForFieldName('function')
    if (funcField && funcField.id === node.id) return 'identifier.function'
    return 'identifier'
  }

  if (parent.type === 'namespaced_call') {
    const nsField = parent.childForFieldName('namespace')
    if (nsField && nsField.id === node.id) return 'identifier.namespace'
    const funcField = parent.childForFieldName('function')
    if (funcField && funcField.id === node.id) return 'identifier.function'
    return 'identifier'
  }

  return 'identifier'
}

/**
 * Emit tokens for a string node (double_string / single_string).
 * These nodes contain anonymous quote children (`"` or `'`) plus named
 * `string_content` and `escape_sequence` children. We walk all children
 * in order, emitting each with its appropriate token type.
 */
function emitStringTokens(node: Node, tokens: HighlightToken[]) {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (!child) continue
    const text = child.text
    if (!text) continue

    if (child.type === 'escape_sequence') {
      tokens.push({
        text,
        token: 'string.escape',
        start: child.startIndex,
        end: child.endIndex,
      })
    } else {
      // Quote characters and string_content are both emitted as 'string'
      tokens.push({
        text,
        token: 'string',
        start: child.startIndex,
        end: child.endIndex,
      })
    }
  }
}

/**
 * Tokenize GROQ source using the tree-sitter parser (via web-tree-sitter WASM).
 * Returns canonical tokens with whitespace omitted.
 *
 * The walk strategy:
 * 1. For named wrapper nodes (e.g., `everything`), emit the whole node as one token.
 * 2. For string container nodes (`double_string`/`single_string`), emit their children
 *    individually (quotes as 'string', content as 'string', escapes as 'string.escape').
 * 3. For other structural nodes, recurse into children.
 * 4. For named leaf nodes (no children), look up in NAMED_LEAF_MAP.
 * 5. For anonymous leaf nodes, look up text in ANON_MAP.
 */
export async function tokenizeTreeSitter(source: string): Promise<HighlightToken[]> {
  const parser = await getParser()
  const tree = parser.parse(source)
  const tokens: HighlightToken[] = []

  function walk(node: Node) {
    // 1. Named wrapper nodes - emit as a single token covering the whole span
    if (node.isNamed && node.type in NAMED_WRAPPER_MAP) {
      const text = node.text
      if (text && !/^\s+$/.test(text)) {
        tokens.push({
          text,
          token: NAMED_WRAPPER_MAP[node.type],
          start: node.startIndex,
          end: node.endIndex,
        })
      }
      return
    }

    // 2. String container nodes - emit children individually
    if (node.type === 'double_string' || node.type === 'single_string') {
      emitStringTokens(node, tokens)
      return
    }

    // 3. Skip the intermediate `string` node (wraps double_string/single_string)
    //    Just recurse into it to reach the actual string container.
    if (node.type === 'string') {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (child) walk(child)
      }
      return
    }

    // 4. Leaf nodes (no children)
    if (node.childCount === 0) {
      const text = node.text
      if (!text || /^\s+$/.test(text)) return

      if (node.isNamed) {
        // Named leaf: look up in leaf map or classify identifier
        let canonical: CanonicalToken | undefined = NAMED_LEAF_MAP[node.type]
        if (!canonical && node.type === 'identifier') {
          canonical = classifyIdentifier(node)
        }
        if (canonical) {
          tokens.push({
            text,
            token: canonical,
            start: node.startIndex,
            end: node.endIndex,
          })
        }
      } else {
        // Anonymous leaf: look up by text
        const canonical = ANON_MAP[text]
        if (canonical) {
          tokens.push({
            text,
            token: canonical,
            start: node.startIndex,
            end: node.endIndex,
          })
        }
      }
      return
    }

    // 5. Structural node with children - recurse
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)
      if (child) walk(child)
    }
  }

  if (!tree) throw new Error('tree-sitter parse returned null')
  walk(tree.rootNode)
  return tokens
}
