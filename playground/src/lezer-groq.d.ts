declare module '@sanity/lezer-groq' {
  import {LRParser} from '@lezer/lr'
  import {LRLanguage, LanguageSupport} from '@codemirror/language'

  export const parser: LRParser
  export const groqLanguage: LRLanguage
  export function groq(): LanguageSupport
}
