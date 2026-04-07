import {useMemo} from 'react'
import {Refractor, registerLanguage} from 'react-refractor'
import {refractorGroq} from '@sanity/prism-groq'
import {colors} from '../theme'

registerLanguage(refractorGroq)

export function PrismPanel({query}: {query: string}) {
  const element = useMemo(() => <Refractor language="groq" value={query} />, [query])

  return (
    <div className="prism-output">
      <style>{prismStyles}</style>
      {element}
    </div>
  )
}

// Map Prism token classes to our shared color palette
const prismStyles = `
.prism-output pre {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: ${colors.fg};
  background: transparent;
}
.prism-output pre code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}
.prism-output .token.comment { color: ${colors.gray}; font-style: italic; }
.prism-output .token.string { color: ${colors.green}; }
.prism-output .token.escape { color: ${colors.cyan}; }
.prism-output .token.number { color: ${colors.orange}; }
.prism-output .token.boolean { color: ${colors.orange}; }
.prism-output .token.null { color: ${colors.orange}; }
.prism-output .token.keyword-operator { color: ${colors.purple}; }
.prism-output .token.function { color: ${colors.blue}; }
.prism-output .token.namespace,
.prism-output .token.class-name { color: ${colors.yellow}; }
.prism-output .token.variable { color: ${colors.red}; }
.prism-output .token.wildcard { color: ${colors.orange}; }
.prism-output .token.spread { color: ${colors.cyan}; }
.prism-output .token.dereference { color: ${colors.cyan}; }
.prism-output .token.pipe { color: ${colors.cyan}; }
.prism-output .token.operator { color: ${colors.cyan}; }
.prism-output .token.punctuation { color: ${colors.fg}; }
.prism-output .token.accessor { color: ${colors.cyan}; }
.prism-output .token.identifier { color: ${colors.red}; }
`
