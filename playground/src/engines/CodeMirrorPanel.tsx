import {useEffect, useRef} from 'react'
import {EditorView} from '@codemirror/view'
import {EditorState} from '@codemirror/state'
import {
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language'
import {tags as t} from '@lezer/highlight'
import {groq} from '@sanity/lezer-groq'

// Custom highlight style matching One Dark Pro's colors for our TextMate scopes.
// This ensures both panels use identical colors for each token type.
const oneDarkProStyle = HighlightStyle.define([
  // Comments - gray italic
  {tag: t.lineComment, color: '#5c6370', fontStyle: 'italic'},
  // Strings - green
  {tag: t.string, color: '#98c379'},
  // Numbers - orange
  {tag: t.number, color: '#d19a66'},
  // Booleans and null - orange (same as numbers in One Dark Pro)
  {tag: [t.bool, t.null], color: '#d19a66'},
  // Functions - blue
  {tag: t.function(t.variableName), color: '#61afef'},
  // Identifiers / variable names - red
  {tag: t.variableName, color: '#e06c75'},
  // Property names - red (same as identifiers)
  {tag: t.propertyName, color: '#e06c75'},
  // Namespace - yellow
  {tag: t.namespace, color: '#e5c07b'},
  // Special variables ($param, *, @, ^) - red
  {tag: t.special(t.variableName), color: '#e06c75'},
  {tag: t.self, color: '#e06c75'},
  // Keyword operators (in, match, asc, desc) - purple
  {tag: t.operatorKeyword, color: '#c678dd'},
  // Comparison operators (==, !=, <, >, <=, >=) - cyan
  {tag: t.compareOperator, color: '#56b6c2'},
  // Arithmetic operators (+, -, *, /, %, **) - cyan
  {tag: t.arithmeticOperator, color: '#56b6c2'},
  // Logical operators (&&, ||, !) - cyan
  {tag: t.logicOperator, color: '#56b6c2'},
  // Pipe, arrow, deref - cyan
  {tag: [t.controlOperator, t.definitionOperator, t.derefOperator], color: '#56b6c2'},
  // Punctuation (brackets, separators) - default
  {tag: [t.paren, t.squareBracket, t.brace, t.separator, t.punctuation], color: '#abb2bf'},
])

// Minimal base theme - transparent background, no gutter
const baseTheme = EditorView.theme({
  '&': {backgroundColor: 'transparent'},
  '.cm-gutters': {display: 'none'},
  '.cm-content': {caretColor: '#528bff'},
  '.cm-cursor': {borderLeftColor: '#528bff'},
  '.cm-activeLine': {backgroundColor: 'transparent'},
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#3e4451',
  },
})

export function CodeMirrorPanel({query}: {query: string}) {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: query,
        extensions: [
          groq(),
          baseTheme,
          syntaxHighlighting(oneDarkProStyle),
          EditorView.editable.of(false),
          EditorView.lineWrapping,
        ],
      }),
      parent: ref.current,
    })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (currentDoc !== query) {
      view.dispatch({
        changes: {from: 0, to: currentDoc.length, insert: query},
      })
    }
  }, [query])

  return <div ref={ref} className="codemirror-output" />
}
