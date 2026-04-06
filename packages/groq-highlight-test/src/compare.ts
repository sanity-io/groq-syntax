import type {HighlightToken, CanonicalToken} from './canonical.js'

/**
 * Sets of token types considered compatible in cross-engine comparison.
 * These represent cases where engines may reasonably disagree on granularity.
 */
const compatibleSets: CanonicalToken[][] = [
  ['operator.spread', 'operator.range'],
  ['identifier', 'identifier.function'],
]

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
 * Tokens at the same [start, end) range are compared for type equality/compatibility.
 * Tokens present in one but not the other are counted as missing.
 */
export function compareTokens(
  fixture: string,
  tokensA: HighlightToken[],
  tokensB: HighlightToken[],
): ComparisonResult {
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
