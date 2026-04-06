import {useEffect, useRef} from 'react'
import {EditorView} from '@codemirror/view'
import {EditorState} from '@codemirror/state'
import {syntaxHighlighting, HighlightStyle} from '@codemirror/language'
import {tags as t} from '@lezer/highlight'
import {groq} from '@sanity/lezer-groq'
import {colors} from '../theme'

const highlightStyle = HighlightStyle.define([
  {tag: t.lineComment, color: colors.gray, fontStyle: 'italic'},
  {tag: t.string, color: colors.green},
  {tag: t.escape, color: colors.cyan},
  {tag: t.number, color: colors.orange},
  {tag: [t.bool, t.null, t.atom], color: colors.orange},
  {tag: t.function(t.variableName), color: colors.blue},
  {tag: t.variableName, color: colors.red},
  {tag: t.propertyName, color: colors.red},
  {tag: t.namespace, color: colors.yellow},
  {tag: t.special(t.variableName), color: colors.red},
  {tag: t.self, color: colors.red},
  {tag: t.operatorKeyword, color: colors.purple},
  {tag: [t.compareOperator, t.arithmeticOperator, t.logicOperator, t.operator], color: colors.cyan},
  {tag: [t.controlOperator, t.definitionOperator, t.derefOperator], color: colors.cyan},
  {tag: [t.paren, t.squareBracket, t.brace, t.separator, t.punctuation], color: colors.fg},
])

const baseTheme = EditorView.theme({
  '&': {backgroundColor: 'transparent'},
  '.cm-gutters': {display: 'none'},
  '.cm-content': {caretColor: colors.blue},
  '.cm-line': {padding: '0'},
  '.cm-cursor': {borderLeftColor: colors.blue},
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
          syntaxHighlighting(highlightStyle),
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
