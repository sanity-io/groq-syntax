/**
 * Shared color palette for GROQ syntax highlighting.
 * Used by both the Shiki (TextMate) and CodeMirror (Lezer) panels
 * to ensure identical colors for comparison.
 */
export const colors = {
  bg: '#282c34',
  fg: '#abb2bf',
  red: '#e06c75', // variables ($param, @, ^)
  green: '#98c379', // strings
  yellow: '#e5c07b', // namespaces
  blue: '#61afef', // functions
  purple: '#c678dd', // keyword operators (in, match, asc, desc)
  cyan: '#56b6c2', // operators, pipe, dereference, accessor
  orange: '#d19a66', // numbers, booleans, null, wildcard *
  gray: '#5c6370', // comments
} as const

/**
 * Custom Shiki theme using the shared palette.
 * Maps TextMate scopes to our colors.
 */
export const shikiTheme = {
  name: 'groq-compare',
  type: 'dark' as const,
  colors: {
    'editor.background': 'transparent',
    'editor.foreground': colors.fg,
  },
  tokenColors: [
    {
      scope: 'comment',
      settings: {foreground: colors.gray, fontStyle: 'italic'},
    },
    {scope: 'string', settings: {foreground: colors.green}},
    {
      scope: 'constant.character.escape',
      settings: {foreground: colors.cyan},
    },
    {scope: 'constant.numeric', settings: {foreground: colors.orange}},
    {scope: 'keyword.constant', settings: {foreground: colors.orange}},
    {scope: 'support.function', settings: {foreground: colors.blue}},
    {scope: 'entity.name.namespace', settings: {foreground: colors.yellow}},
    {
      scope: 'punctuation.separator.namespace',
      settings: {foreground: colors.fg},
    },
    {scope: 'variable.other.property', settings: {foreground: colors.fg}},
    {scope: 'variable.parameter', settings: {foreground: colors.red}},
    {
      scope: 'variable.language.wildcard',
      settings: {foreground: colors.orange},
    },
    {scope: 'variable.language', settings: {foreground: colors.red}},
    {scope: 'keyword.operator.sort', settings: {foreground: colors.purple}},
    {
      scope: 'keyword.operator.logical.in',
      settings: {foreground: colors.purple},
    },
    {
      scope: 'keyword.operator.match',
      settings: {foreground: colors.purple},
    },
    {scope: 'keyword.operator', settings: {foreground: colors.cyan}},
    {scope: 'punctuation.accessor', settings: {foreground: colors.cyan}},
    {
      scope: 'punctuation.definition.bracket',
      settings: {foreground: colors.fg},
    },
    {scope: 'punctuation.separator', settings: {foreground: colors.fg}},
  ],
}
