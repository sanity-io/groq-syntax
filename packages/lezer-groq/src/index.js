import {parser} from "./parser.js"
import {LRLanguage, LanguageSupport, foldNodeProp, foldInside, indentNodeProp, continuedIndent} from "@codemirror/language"

export {parser}

export const groqLanguage = LRLanguage.define({
  name: "groq",
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Projection: continuedIndent({except: /^\s*\}/}),
        ArrayLiteral: continuedIndent({except: /^\s*\]/}),
        ObjectLiteral: continuedIndent({except: /^\s*\}/}),
      }),
      foldNodeProp.add({
        "Projection ObjectLiteral ArrayLiteral Filter": foldInside,
      }),
    ],
  }),
  languageData: {
    closeBrackets: {brackets: ["[", "{", "(", '"', "'"]},
    commentTokens: {line: "//"},
  },
})

export function groq() {
  return new LanguageSupport(groqLanguage)
}
