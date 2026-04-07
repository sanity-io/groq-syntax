import {useEffect, useRef} from 'react'
import ace from 'ace-builds'
import '@sanity/ace-groq'
import {colors} from '../theme'

export function AcePanel({query}: {query: string}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ace.Ace.Editor | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const editor = ace.edit(containerRef.current, {
      readOnly: true,
      showGutter: false,
      showPrintMargin: false,
      highlightActiveLine: false,
      highlightGutterLine: false,
      highlightSelectedWord: false,
      wrap: true,
      useWorker: false,
      fontSize: 14,
      fontFamily: "'SF Mono', Menlo, Consolas, monospace",
    })

    editor.renderer.setScrollMargin(0, 0, 0, 0)
    editor.renderer.setPadding(0)
    editor.session.setMode('ace/mode/groq')
    editor.setBehavioursEnabled(false)
    editorRef.current = editor

    return () => {
      editor.destroy()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(query, -1)
    }
  }, [query])

  return (
    <div className="ace-output" style={{height: '100%'}}>
      <style>{aceStyles}</style>
      <div ref={containerRef} style={{width: '100%', height: '100%'}} />
    </div>
  )
}

// Map Ace token classes to our shared color palette
const aceStyles = `
.ace-output .ace_editor {
  background: transparent !important;
  font-family: 'SF Mono', Menlo, Consolas, monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  color: ${colors.fg} !important;
}
.ace-output .ace_scroller {
  background: transparent !important;
}
.ace-output .ace_content {
  background: transparent !important;
}
.ace-output .ace_cursor {
  display: none !important;
}
.ace-output .ace_bracket {
  display: none !important;
}
.ace-output .ace_comment { color: ${colors.gray} !important; font-style: italic; }
.ace-output .ace_string { color: ${colors.green} !important; }
.ace-output .ace_constant.ace_character.ace_escape { color: ${colors.cyan} !important; }
.ace-output .ace_constant.ace_numeric { color: ${colors.orange} !important; }
.ace-output .ace_constant.ace_language { color: ${colors.orange} !important; }
.ace-output .ace_constant.ace_language.ace_wildcard { color: ${colors.orange} !important; }
.ace-output .ace_keyword.ace_operator { color: ${colors.cyan} !important; }
.ace-output .ace_keyword.ace_control { color: ${colors.purple} !important; }
.ace-output .ace_keyword.ace_operator.ace_spread,
.ace-output .ace_keyword.ace_operator.ace_dereference,
.ace-output .ace_keyword.ace_operator.ace_range,
.ace-output .ace_keyword.ace_operator.ace_pipe,
.ace-output .ace_keyword.ace_operator.ace_arrow { color: ${colors.cyan} !important; }
.ace-output .ace_support.ace_function { color: ${colors.blue} !important; }
.ace-output .ace_entity.ace_name.ace_tag { color: ${colors.yellow} !important; }
.ace-output .ace_variable { color: ${colors.red} !important; }
.ace-output .ace_variable.ace_language { color: ${colors.red} !important; }
.ace-output .ace_punctuation { color: ${colors.fg} !important; }
.ace-output .ace_punctuation.ace_accessor { color: ${colors.cyan} !important; }
.ace-output .ace_punctuation.ace_namespace { color: ${colors.fg} !important; }
.ace-output .ace_paren { color: ${colors.fg} !important; }
.ace-output .ace_identifier { color: ${colors.red} !important; }
`
