import {createGroqHighlightRules} from '../../ace-groq/groq.js'
import type {HighlightToken, CanonicalToken} from './canonical.js'

/** Map Ace token types to canonical token types. */
const TOKEN_MAP: Record<string, CanonicalToken> = {
  'comment.line': 'comment',
  'string.quoted.double': 'string',
  'string.quoted.single': 'string',
  'constant.character.escape': 'string.escape',
  'constant.numeric': 'number',
  'constant.language': 'keyword',
  'constant.language.wildcard': 'wildcard',
  'keyword.operator': 'operator',
  'keyword.control': 'operator.keyword',
  'keyword.operator.spread': 'operator.spread',
  'keyword.operator.dereference': 'accessor',
  'keyword.operator.range': 'operator.range',
  'keyword.operator.pipe': 'operator.pipe',
  'keyword.operator.arrow': 'operator.arrow',
  'support.function': 'identifier.function',
  'entity.name.tag': 'identifier.namespace',
  variable: 'variable',
  'variable.language': 'variable.special',
  'punctuation.accessor': 'accessor',
  'punctuation.namespace': 'punctuation.namespace',
  punctuation: 'punctuation.delimiter',
  'paren.lparen': 'punctuation.bracket',
  'paren.rparen': 'punctuation.bracket',
  identifier: 'identifier',
}

function tokenToCanonical(aceToken: string): CanonicalToken | undefined {
  return TOKEN_MAP[aceToken]
}

interface AceRule {
  token: string | string[]
  regex: RegExp | string
  next?: string
  defaultToken?: string
}

/**
 * Minimal Ace-compatible tokenizer that works in Node.js without a DOM.
 * Processes rules in the same order as Ace: first match wins, supports state
 * transitions via `next` and `defaultToken` for catch-all states.
 */
function tokenizeLine(
  line: string,
  state: string,
  rules: Record<string, AceRule[]>,
): {tokens: Array<{type: string; value: string}>; state: string} {
  const tokens: Array<{type: string; value: string}> = []
  let pos = 0

  while (pos < line.length) {
    const stateRules = rules[state]
    if (!stateRules) break

    let matched = false

    for (const rule of stateRules) {
      if (rule.defaultToken !== undefined) continue

      const re = rule.regex instanceof RegExp ? rule.regex : new RegExp(rule.regex)
      // Ace tokenizer always matches from current position
      const sticky = new RegExp(re.source, re.flags.includes('y') ? re.flags : re.flags + 'y')
      sticky.lastIndex = pos

      const match = sticky.exec(line)
      if (!match || match.index !== pos) continue

      const fullMatch = match[0]
      if (fullMatch.length === 0) continue

      if (Array.isArray(rule.token)) {
        // Grouped capture - each token corresponds to a capture group
        for (let i = 0; i < rule.token.length; i++) {
          const groupText = match[i + 1]
          if (groupText) {
            tokens.push({type: rule.token[i], value: groupText})
          }
        }
      } else {
        tokens.push({type: rule.token, value: fullMatch})
      }

      pos += fullMatch.length
      if (rule.next) {
        state = rule.next
      }
      matched = true
      break
    }

    if (!matched) {
      // Check for defaultToken
      const defaultRule = stateRules.find((r) => r.defaultToken !== undefined)
      if (defaultRule) {
        // Consume one character with the default token
        tokens.push({type: defaultRule.defaultToken!, value: line[pos]})
        pos += 1
      } else {
        // No match, consume one character as text
        tokens.push({type: 'text', value: line[pos]})
        pos += 1
      }
    }
  }

  return {tokens, state}
}

/**
 * Tokenize GROQ source using our GROQ highlight rules in Ace format.
 * Uses a minimal Ace-compatible tokenizer that works in Node.js.
 * Maps Ace token types to canonical types for cross-engine comparison.
 */
export function tokenizeAce(source: string): HighlightToken[] {
  const rules = createGroqHighlightRules() as Record<string, AceRule[]>

  const tokens: HighlightToken[] = []
  let offset = 0
  let state = 'start'

  for (const line of source.split('\n')) {
    const result = tokenizeLine(line, state, rules)

    for (const aceToken of result.tokens) {
      const text = aceToken.value

      if (/^\s+$/.test(text)) {
        offset += text.length
        continue
      }

      const canonical = tokenToCanonical(aceToken.type)
      if (canonical) {
        tokens.push({
          text,
          token: canonical,
          start: offset,
          end: offset + text.length,
        })
      }

      offset += text.length
    }

    state = result.state
    offset += 1 // newline character
  }

  return tokens
}
