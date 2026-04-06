import {useState} from 'react'
import {ShikiPanel} from './engines/ShikiPanel'
import {CodeMirrorPanel} from './engines/CodeMirrorPanel'
import {FixturePicker} from './components/FixturePicker'
import './App.css'

const defaultQuery = `*[_type == "post"] | order(publishedAt desc) [0...10] {
  title,
  slug,
  "author": author->name,
  "categories": categories[]-> {
    title,
    slug
  }
}`

export function App() {
  const [query, setQuery] = useState(defaultQuery)

  return (
    <div className="app">
      <header className="header">
        <h1>GROQ Syntax Playground</h1>
        <FixturePicker onSelect={setQuery} />
      </header>
      <div className="editor">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="panels">
        <div className="panel">
          <h2>TextMate (Shiki)</h2>
          <div className="panel-content">
            <ShikiPanel query={query} />
          </div>
        </div>
        <div className="panel">
          <h2>Lezer (CodeMirror)</h2>
          <div className="panel-content">
            <CodeMirrorPanel query={query} />
          </div>
        </div>
      </div>
    </div>
  )
}
