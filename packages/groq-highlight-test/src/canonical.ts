/**
 * Canonical token types shared across all highlighting engines.
 * Each engine maps its native token types to these canonical types.
 */
export type CanonicalToken =
  // Literals
  | 'keyword'
  | 'string'
  | 'string.escape'
  | 'number'
  | 'comment'
  // Operators
  | 'operator'
  | 'operator.keyword'
  | 'operator.spread'
  | 'operator.arrow'
  | 'operator.pipe'
  | 'operator.range'
  // Access
  | 'accessor'
  // Identifiers
  | 'identifier'
  | 'identifier.function'
  | 'identifier.namespace'
  // Variables
  | 'variable'
  | 'variable.special'
  | 'wildcard'
  // Punctuation
  | 'punctuation.bracket'
  | 'punctuation.delimiter'
  | 'punctuation.namespace'

/**
 * A single highlighted token with its canonical type and source position.
 */
export interface HighlightToken {
  text: string
  token: CanonicalToken
  start: number
  end: number
}
