import type {CanonicalToken} from './canonical.js'

/**
 * Maps a TextMate scope stack to a canonical token type.
 * Scopes from vscode-textmate are ordered least-specific-first (root -> leaf),
 * so we iterate in reverse to check the most specific scope first.
 * Returns undefined for scopes we don't map (e.g. source.groq itself).
 */
export function mapTextmateScope(scopes: string[]): CanonicalToken | undefined {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (scope.startsWith('comment.')) return 'comment'
    if (scope.startsWith('constant.character.escape.')) return 'string.escape'
    if (scope.startsWith('string.')) return 'string'
    if (scope.startsWith('constant.numeric.')) return 'number'
    if (scope.startsWith('keyword.constant.')) return 'keyword'
    if (scope.startsWith('keyword.operator.sort.')) return 'operator.keyword'
    if (scope === 'keyword.operator.logical.in.groq') return 'operator.keyword'
    if (scope === 'keyword.operator.match.groq') return 'operator.keyword'
    if (scope.startsWith('keyword.operator.spread.')) return 'operator.spread'
    if (scope.startsWith('keyword.operator.pair.')) return 'operator.arrow'
    if (scope.startsWith('keyword.operator.pipe.')) return 'operator.pipe'
    if (scope.startsWith('keyword.operator.range.')) return 'operator.range'
    if (scope.startsWith('keyword.operator.dereference.')) return 'accessor'
    if (scope.startsWith('keyword.operator.')) return 'operator'
    if (scope.startsWith('punctuation.accessor.')) return 'accessor'
    if (scope.startsWith('variable.parameter.')) return 'variable'
    if (scope.startsWith('variable.language.wildcard.')) return 'wildcard'
    if (scope.startsWith('variable.language.')) return 'variable.special'
    if (scope.startsWith('support.function.')) return 'identifier.function'
    if (scope.startsWith('entity.name.namespace.')) return 'identifier.namespace'
    if (scope.startsWith('punctuation.separator.namespace.')) return 'punctuation.namespace'
    if (
      scope.startsWith('punctuation.definition.bracket.') ||
      scope.startsWith('punctuation.section.')
    )
      return 'punctuation.bracket'
    if (
      scope.startsWith('punctuation.separator.') &&
      !scope.startsWith('punctuation.separator.namespace.')
    )
      return 'punctuation.delimiter'
    if (scope.startsWith('entity.name.tag.')) return 'identifier'
  }
  return undefined
}
