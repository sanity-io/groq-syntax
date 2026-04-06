import {useEffect, useRef} from 'react'
import {EditorView} from '@codemirror/view'
import {EditorState} from '@codemirror/state'
import {oneDark} from '@codemirror/theme-one-dark'
import {syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language'
import {groq} from '@sanity/lezer-groq'

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
          oneDark,
          syntaxHighlighting(defaultHighlightStyle),
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
