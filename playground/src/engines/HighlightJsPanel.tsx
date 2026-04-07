import {useMemo} from 'react'
import Lowlight from 'react-lowlight'
import groqDef from '@sanity/highlightjs-groq'
import {colors} from '../theme'

Lowlight.registerLanguage('groq', groqDef)

export function HighlightJsPanel({query}: {query: string}) {
  const element = useMemo(() => <Lowlight language="groq" value={query} markers={[]} />, [query])

  return (
    <div className="hljs-output">
      <style>{hljsStyles}</style>
      {element}
    </div>
  )
}

// Map highlight.js scope classes (hljs-*) to our shared palette
const hljsStyles = `
.hljs-output pre {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: ${colors.fg};
  background: transparent;
}
.hljs-output code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
  padding: 0;
}
.hljs-output .hljs-comment { color: ${colors.gray}; font-style: italic; }
.hljs-output .hljs-string { color: ${colors.green}; }
.hljs-output .hljs-char_escape { color: ${colors.cyan}; }
.hljs-output .hljs-number { color: ${colors.orange}; }
.hljs-output .hljs-literal { color: ${colors.orange}; }
.hljs-output .hljs-keyword { color: ${colors.purple}; }
.hljs-output .hljs-title.function_.invoke__ { color: ${colors.blue}; }
.hljs-output .hljs-title.class_ { color: ${colors.yellow}; }
.hljs-output .hljs-variable { color: ${colors.red}; }
.hljs-output .hljs-variable.language_ { color: ${colors.red}; }
.hljs-output .hljs-operator { color: ${colors.cyan}; }
.hljs-output .hljs-punctuation { color: ${colors.fg}; }
`
