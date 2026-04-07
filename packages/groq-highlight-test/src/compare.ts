import type {HighlightToken, CanonicalToken} from './canonical.js'

/**
 * Sets of token types considered compatible in cross-engine comparison.
 * These represent cases where engines may reasonably disagree on granularity.
 */
const compatibleSets: CanonicalToken[][] = [
  ['operator.spread', 'operator.range'],
  ['identifier', 'identifier.function'],
  // TextMate can't distinguish wildcard `*` from multiplication `*` in all contexts
  ['wildcard', 'operator'],
  ['wildcard', 'variable.special'],
  // TextMate matches keywords like `in`, `match`, `asc`, `desc` regardless of context,
  // while tree-sitter/Lezer can distinguish identifier position from operator position
  ['operator.keyword', 'identifier'],
]

/** Token types that should be merged when adjacent and contiguous. */
const MERGEABLE_TYPES: ReadonlySet<CanonicalToken> = new Set([
  'string',
  'string.escape',
  'variable.special', // TextMate matches ^+ as one token, Lezer emits each ^ separately
])

/** The canonical type to use after merging tokens of a given type. */
function mergedType(token: CanonicalToken): CanonicalToken {
  if (token === 'string' || token === 'string.escape') return 'string'
  return token
}

/**
 * Merge adjacent tokens that belong to the same merge group into single spans.
 * This normalizes boundary differences between engines:
 * - TextMate splits strings into quote, content, and escape tokens; Lezer emits whole strings
 * - TextMate matches ^+ as one token; Lezer emits each ^ separately
 */
export function mergeAdjacentTokens(tokens: HighlightToken[]): HighlightToken[] {
  const result: HighlightToken[] = []
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]
    if (!MERGEABLE_TYPES.has(token.token)) {
      result.push(token)
      i++
      continue
    }

    const targetType = mergedType(token.token)
    let end = token.end
    let text = token.text
    let j = i + 1

    while (j < tokens.length) {
      const next = tokens[j]
      if (
        MERGEABLE_TYPES.has(next.token) &&
        mergedType(next.token) === targetType &&
        next.start === end
      ) {
        end = next.end
        text += next.text
        j++
      } else {
        break
      }
    }

    result.push({text, token: targetType, start: token.start, end})
    i = j
  }

  return result
}

/**
 * Check whether two canonical token types are compatible.
 * Tokens are compatible if they are equal or belong to the same compatibility set.
 */
export function areTokensCompatible(a: CanonicalToken, b: CanonicalToken): boolean {
  if (a === b) return true
  return compatibleSets.some((set) => set.includes(a) && set.includes(b))
}

export interface ComparisonResult {
  fixture: string
  matches: number
  compatible: number
  mismatches: Array<{
    position: number
    textA: string
    textB: string
    tokenA: CanonicalToken
    tokenB: CanonicalToken
  }>
  missingInA: number
  missingInB: number
}

/**
 * Compare two token arrays by aligning on source positions.
 * Before comparison, adjacent string-family tokens are merged so that
 * engines with different string splitting strategies (e.g., TextMate splits
 * quotes and escapes, Lezer emits whole strings) produce comparable spans.
 *
 * Tokens at the same [start, end) range are compared for type equality/compatibility.
 * Tokens present in one but not the other are counted as missing.
 */
export function compareTokens(
  fixture: string,
  rawTokensA: HighlightToken[],
  rawTokensB: HighlightToken[]
): ComparisonResult {
  const tokensA = mergeAdjacentTokens(rawTokensA)
  const tokensB = mergeAdjacentTokens(rawTokensB)

  const result: ComparisonResult = {
    fixture,
    matches: 0,
    compatible: 0,
    mismatches: [],
    missingInA: 0,
    missingInB: 0,
  }

  let ai = 0
  let bi = 0

  while (ai < tokensA.length && bi < tokensB.length) {
    const a = tokensA[ai]
    const b = tokensB[bi]

    if (a.start === b.start && a.end === b.end) {
      // Same span - compare types
      if (a.token === b.token) {
        result.matches++
      } else if (areTokensCompatible(a.token, b.token)) {
        result.compatible++
      } else {
        result.mismatches.push({
          position: a.start,
          textA: a.text,
          textB: b.text,
          tokenA: a.token,
          tokenB: b.token,
        })
      }
      ai++
      bi++
    } else if (a.start < b.start || (a.start === b.start && a.end < b.end)) {
      // Token A starts earlier or is shorter - it has no match in B
      result.missingInB++
      ai++
    } else {
      // Token B starts earlier or is shorter - it has no match in A
      result.missingInA++
      bi++
    }
  }

  // Count remaining unmatched tokens
  result.missingInB += tokensA.length - ai
  result.missingInA += tokensB.length - bi

  return result
}
