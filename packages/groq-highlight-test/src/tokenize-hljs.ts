import {createLowlight} from 'lowlight'
import type {Element, Text} from 'hast'
import groqDef from '../../highlightjs-groq/groq.js'
import type {HighlightToken, CanonicalToken} from './canonical.js'

const lowlight = createLowlight()
lowlight.register('groq', groqDef)

/** Map highlight.js scope class names (hljs-*) to canonical tokens. */
const SCOPE_MAP: Record<string, CanonicalToken> = {
  comment: 'comment',
  string: 'string',
  'char.escape': 'string.escape',
  number: 'number',
  literal: 'keyword',
  keyword: 'operator.keyword',
  'title.function.invoke': 'identifier.function',
  'title.class': 'identifier.namespace',
  variable: 'variable',
  'variable.language': 'variable.special',
  operator: 'operator',
  punctuation: 'punctuation.delimiter',
}

/** Bracket characters. */
const BRACKETS = new Set(['[', ']', '{', '}', '(', ')'])

function scopeToCanonical(scope: string): CanonicalToken | undefined {
  // hljs classes are like 'hljs-comment', 'hljs-title function_ invoke'
  // lowlight/hast gives them as className arrays: ['hljs-comment'] or ['hljs-title', 'hljs-title_function_invoke']
  // The scope string we receive has dots: 'title.function.invoke'
  return SCOPE_MAP[scope]
}

/**
 * Tokenize GROQ source using lowlight (highlight.js).
 * Walks the HAST tree and maps hljs scopes to canonical token types.
 */
export function tokenizeHljs(source: string): HighlightToken[] {
  const tree = lowlight.highlight('groq', source)
  const tokens: HighlightToken[] = []
  let offset = 0

  function walk(node: Element | Text, scope: string | undefined) {
    if (node.type === 'text') {
      const text = node.value
      if (/^\s+$/.test(text)) {
        offset += text.length
        return
      }

      if (scope) {
        let canonical = scopeToCanonical(scope)

        // Distinguish brackets from other punctuation
        if (canonical === 'punctuation.delimiter' && BRACKETS.has(text)) {
          canonical = 'punctuation.bracket'
        }

        // Wildcard * uses 'literal' scope
        if (scope === 'literal' && text === '*') {
          canonical = 'wildcard'
        }

        // -> is accessor, not generic operator
        if (scope === 'operator' && text === '->') {
          canonical = 'accessor'
        }

        // | is pipe, not generic operator
        if (scope === 'operator' && text === '|') {
          canonical = 'operator.pipe'
        }

        // . is accessor
        if (scope === 'punctuation' && text === '.') {
          canonical = 'accessor'
        }

        // :: is namespace separator
        if (scope === 'punctuation' && text === '::') {
          canonical = 'punctuation.namespace'
        }

        // ... is spread
        if (scope === 'operator' && text === '...') {
          canonical = 'operator.spread'
        }

        // .. is range
        if (scope === 'operator' && text === '..') {
          canonical = 'operator.range'
        }

        // => is arrow
        if (scope === 'operator' && text === '=>') {
          canonical = 'operator.arrow'
        }

        // ^ is variable.special, not plain variable
        if (canonical === 'variable' && /^\^+$/.test(text)) {
          canonical = 'variable.special'
        }

        // Plain identifiers (not $param, not @, not ^) should be 'identifier'
        if (canonical === 'variable' && /^[a-zA-Z_]\w*$/.test(text)) {
          canonical = 'identifier'
        }

        if (canonical) {
          tokens.push({
            text,
            token: canonical,
            start: offset,
            end: offset + text.length,
          })
        }
      }

      offset += text.length
      return
    }

    // Element node - extract scope from className
    const classes = (node.properties?.className ?? []) as string[]
    // hljs uses two patterns:
    //   Single class: ['hljs-comment']
    //   Compound: ['hljs-variable', 'language_'] -> 'variable.language'
    //   Dotted: ['hljs-title', 'hljs-title_function_invoke'] -> 'title.function.invoke'
    let nodeScope = scope
    let base = ''
    const modifiers: string[] = []
    for (const cls of classes) {
      if (cls.startsWith('hljs-')) {
        base = cls.slice(5).replace(/_/g, '.')
      } else {
        // Modifier class like 'language_' -> 'language'
        modifiers.push(cls.replace(/_$/, ''))
      }
    }
    if (base) {
      nodeScope = modifiers.length > 0 ? `${base}.${modifiers.join('.')}` : base
    }

    for (const child of node.children) {
      walk(child as Element | Text, nodeScope)
    }
  }

  for (const child of tree.children) {
    walk(child as Element | Text, undefined)
  }

  return tokens
}
