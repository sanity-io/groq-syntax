/**
 * GROQ language mode for the Ace editor.
 *
 * Usage:
 *   import ace from 'ace-builds'
 *   import '@sanity/ace-groq'
 *   const editor = ace.edit(element)
 *   editor.session.setMode('ace/mode/groq')
 *
 * Usage (manual registration):
 *   import ace from 'ace-builds'
 *   import {Mode} from '@sanity/ace-groq'
 *   const editor = ace.edit(element)
 *   editor.session.setMode(new Mode())
 */

const KNOWN_FUNCTIONS =
  'after|before|boost|coalesce|count|dateTime|defined|identity|length|lower|now|order|path|references|round|score|select|string|upper'

const KEYWORD_OPERATORS = 'in|match|asc|desc'

/**
 * Creates GROQ highlight rules for Ace.
 *
 * Returns the rules object directly (no Ace dependency needed) so it
 * can be used both for the Ace mode registration and for standalone
 * tokenization in the test harness.
 */
export function createGroqHighlightRules() {
  return {
    start: [
      // Line comments
      {token: 'comment.line', regex: /\/\/.*$/},

      // Strings (double-quoted)
      {token: 'string.quoted.double', regex: /"/, next: 'string_double'},

      // Strings (single-quoted)
      {token: 'string.quoted.single', regex: /'/, next: 'string_single'},

      // Numbers (integer, decimal, scientific)
      {token: 'constant.numeric', regex: /(?<!\w)-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?!\w)/},

      // Boolean and null literals
      {token: 'constant.language', regex: /\b(?:true|false|null)\b/},

      // Keyword operators
      {token: 'keyword.control', regex: new RegExp(`\\b(?:${KEYWORD_OPERATORS})\\b`)},

      // Namespaced function calls: namespace::fn()
      {
        token: ['entity.name.tag', 'punctuation.namespace', 'support.function'],
        regex: /(\b[a-zA-Z_]\w*)(::)([a-zA-Z_]\w*(?=\s*\())/,
      },

      // Known function calls
      {token: 'support.function', regex: new RegExp(`\\b(?:${KNOWN_FUNCTIONS})\\b(?=\\s*\\()`)},

      // Parameter variables ($name)
      {token: 'variable', regex: /\$[a-zA-Z_]\w*/},

      // Special variables (@ and ^)
      {token: 'variable.language', regex: /@|\^+/},

      // Wildcard *
      {token: 'constant.language.wildcard', regex: /\*(?=\s*[\[{|)\],}]|\s*$)/},

      // Spread operator
      {token: 'keyword.operator.spread', regex: /\.\.\./},

      // Dereference operator
      {token: 'keyword.operator.dereference', regex: /->/},

      // Range operator
      {token: 'keyword.operator.range', regex: /\.\.(?!\.)/},

      // Pipe operator
      {token: 'keyword.operator.pipe', regex: /\|(?!\|)/},

      // Arrow / pair operator
      {token: 'keyword.operator.arrow', regex: /=>/},

      // Comparison and logical operators
      {token: 'keyword.operator', regex: /[!=<>]=|&&|\|\||[!+\-*/%]|\*\*/},

      // Dot accessor
      {token: 'punctuation.accessor', regex: /\.(?!\.)/},

      // Brackets
      {token: 'paren.lparen', regex: /[\[{(]/},
      {token: 'paren.rparen', regex: /[\]})]/},

      // Punctuation (comma, colon, semicolon)
      {token: 'punctuation', regex: /[,:;]/},

      // Identifiers
      {token: 'identifier', regex: /[a-zA-Z_]\w*/},
    ],

    string_double: [
      {token: 'constant.character.escape', regex: /\\(?:[\\/"'bfnrt]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\})/},
      {token: 'string.quoted.double', regex: /"/, next: 'start'},
      {defaultToken: 'string.quoted.double'},
    ],

    string_single: [
      {token: 'constant.character.escape', regex: /\\(?:[\\/"'bfnrt]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\})/},
      {token: 'string.quoted.single', regex: /'/, next: 'start'},
      {defaultToken: 'string.quoted.single'},
    ],
  }
}

// -- Ace mode class ----------------------------------------------------------

export class GroqHighlightRules {
  constructor() {
    this.$rules = createGroqHighlightRules()
  }
}

export class Mode {
  constructor() {
    this.HighlightRules = GroqHighlightRules
    this.lineCommentStart = '//'
    this.$id = 'ace/mode/groq'
    this.$behaviour = undefined
  }

  getCompletions() {
    return []
  }
}

// -- Auto-registration with Ace if available ---------------------------------

/** @type {any} */
const g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : undefined

if (g?.ace?.define) {
  g.ace.define('ace/mode/groq_highlight_rules', ['require', 'exports', 'module'], function (_req, exports) {
    const oop = _req('../lib/oop')
    const TextHighlightRules = _req('./text_highlight_rules').TextHighlightRules

    function AceGroqHighlightRules() {
      this.$rules = createGroqHighlightRules()
    }
    oop.inherits(AceGroqHighlightRules, TextHighlightRules)
    exports.GroqHighlightRules = AceGroqHighlightRules
  })

  g.ace.define('ace/mode/groq', ['require', 'exports', 'module'], function (_req, exports) {
    const oop = _req('../lib/oop')
    const TextMode = _req('./text').Mode
    const GroqHighlightRules = _req('./groq_highlight_rules').GroqHighlightRules

    function AceGroqMode() {
      this.HighlightRules = GroqHighlightRules
      this.lineCommentStart = '//'
      this.$id = 'ace/mode/groq'
    }
    oop.inherits(AceGroqMode, TextMode)
    exports.Mode = AceGroqMode
  })
}
