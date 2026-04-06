import {useEffect, useRef} from 'react'
import {createHighlighter, type Highlighter} from 'shiki'

// Load grammar - Vite handles JSON import
import groqGrammar from '../../../packages/textmate-groq/syntaxes/groq.tmLanguage.json'

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [{...groqGrammar, name: 'groq'} as Parameters<typeof createHighlighter>[0]['langs'][number]],
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
        theme: 'github-dark',
      })
    })
    return () => {
      cancelled = true
    }
  }, [query])

  return <div ref={ref} className="highlight-output" />
}
