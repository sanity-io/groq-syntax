import {useState} from 'react'
import {ShikiPanel} from './engines/ShikiPanel'
import {CodeMirrorPanel} from './engines/CodeMirrorPanel'
import {FixturePicker} from './components/FixturePicker'
import {findFixture, fixtureKey, type Fixture} from './fixtures'
import './App.css'

const defaultQuery = `*[_type == "post"] | order(publishedAt desc) [0...10] {
  "title": coalesce(title.es, title.en)
  slug,
  "bodyText": pt::text(body),
  "author": author->name,
  "categories": categories[]-> {
    title,
    slug
  }
}`

function getInitialState(): {query: string; fixtureId: string} {
  const hash = location.hash.slice(1)
  if (hash) {
    const fixture = findFixture(decodeURIComponent(hash))
    if (fixture) {
      return {query: fixture.content, fixtureId: fixtureKey(fixture)}
    }
  }
  return {query: defaultQuery, fixtureId: ''}
}

export function App() {
  const [initial] = useState(getInitialState)
  const [query, setQuery] = useState(initial.query)
  const [selectedFixture, setSelectedFixture] = useState(initial.fixtureId)

  function selectFixture(fixture: Fixture) {
    const key = fixtureKey(fixture)
    setQuery(fixture.content)
    setSelectedFixture(key)
    history.replaceState(null, '', `#${encodeURIComponent(key)}`)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelectedFixture('')
    history.replaceState(null, '', location.pathname)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>GROQ Syntax Playground</h1>
        <FixturePicker selected={selectedFixture} onSelect={selectFixture} />
      </header>
      <div className="editor">
        <textarea
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
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
