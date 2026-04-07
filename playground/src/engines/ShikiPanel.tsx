import {useEffect, useRef} from 'react'
import {createHighlighterCore, type HighlighterCore} from 'shiki/core'
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript'
import {shikiTheme} from '../theme'

import groqGrammar from '../../../packages/textmate-groq/syntaxes/groq.tmLanguage.json'

let highlighterPromise: Promise<HighlighterCore> | undefined

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [shikiTheme],
      langs: [groqGrammar],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

export function ShikiPanel({query}: {query: string}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((highlighter) => {
      if (cancelled || !ref.current) return
      ref.current.innerHTML = highlighter.codeToHtml(query, {
        lang: 'groq',
        theme: 'groq-compare',
      })
    })
    return () => {
      cancelled = true
    }
  }, [query])

  return <div ref={ref} className="highlight-output" />
}
