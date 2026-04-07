/**
 * highlight.js language definition for GROQ.
 *
 * Usage:
 *   import hljs from 'highlight.js/lib/core'
 *   import groq from '@sanity/highlightjs-groq'
 *   hljs.registerLanguage('groq', groq)
 */

/** @param {import('highlight.js').HLJSApi} hljs */
export default function groq(hljs) {
  const KNOWN_FUNCTIONS =
    'after|before|boost|coalesce|count|dateTime|defined|identity|length|lower|now|order|path|references|round|score|select|string|upper'

  const NAMESPACED_CALL = {
    scope: 'title.class',
    match: /\b[a-zA-Z_]\w*(?=\s*::)/,
  }

  const NAMESPACE_SEP = {
    match: /::/,
    scope: 'punctuation',
  }

  const FUNCTION_CALL = {
    scope: 'title.function.invoke',
    match: new RegExp(`\\b(?:${KNOWN_FUNCTIONS})\\b(?=\\s*\\()`),
  }

  const NAMESPACED_FUNCTION = {
    scope: 'title.function.invoke',
    begin: /(?<=::)\s*[a-zA-Z_]\w*(?=\s*\()/,
  }

  const VARIABLE = {
    scope: 'variable',
    match: /\$[a-zA-Z_]\w*/,
  }

  const SPECIAL_VARIABLE = {
    scope: 'variable.language',
    match: /@|\^+/,
  }

  const WILDCARD = {
    scope: 'literal',
    match: /\*(?=\s*[\[{|)\],}]|\s*$)/,
  }

  const SPREAD = {
    scope: 'operator',
    match: /\.\.\./,
  }

  const DEREFERENCE = {
    scope: 'operator',
    match: /->/,
  }

  const PIPE = {
    scope: 'operator',
    match: /\|(?!\|)/,
  }

  const OPERATOR = {
    scope: 'operator',
    match: /=>|[!=<>]=|&&|\|\||[!+\-*/%]|\*\*|\.\.(?!\.)/,
  }

  const PUNCTUATION = {
    scope: 'punctuation',
    match: /[[\]{}(),:;.]/,
  }

  const STRING = {
    scope: 'string',
    variants: [
      {begin: '"', end: '"'},
      {begin: "'", end: "'"},
    ],
    contains: [
      {
        scope: 'char.escape',
        match: /\\(?:[\\/"'bfnrt]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\})/,
      },
    ],
  }

  const NUMBER = {
    scope: 'number',
    match: /(?<!\w)-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?!\w)/,
    relevance: 0,
  }

  return {
    name: 'GROQ',
    aliases: ['groq'],
    case_insensitive: false,
    keywords: {
      literal: ['true', 'false', 'null'],
      keyword: ['in', 'match', 'asc', 'desc'],
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      STRING,
      NUMBER,
      NAMESPACED_CALL,
      NAMESPACE_SEP,
      NAMESPACED_FUNCTION,
      FUNCTION_CALL,
      VARIABLE,
      SPECIAL_VARIABLE,
      WILDCARD,
      SPREAD,
      DEREFERENCE,
      PIPE,
      OPERATOR,
      PUNCTUATION,
      {
        scope: 'property',
        match: /\b(?!true\b|false\b|null\b|in\b|match\b|asc\b|desc\b)[a-zA-Z_]\w*\b/,
      },
    ],
  }
}
