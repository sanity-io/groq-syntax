import {useState} from 'react'
import {ShikiPanel} from './engines/ShikiPanel'
import {CodeMirrorPanel} from './engines/CodeMirrorPanel'
import {TreeSitterPanel} from './engines/TreeSitterPanel'
import {PrismPanel} from './engines/PrismPanel'
import {FixturePicker} from './components/FixturePicker'
import {useFormattedQuery} from './useFormattedQuery'
import {findFixture, fixtureKey, fixtures, type Fixture} from './fixtures'
import './App.css'

const DEFAULT_FIXTURE = 'real-world/default'

function getInitialState(): {query: string; fixtureId: string} {
  const hash = location.hash.slice(1)
  const key = hash ? decodeURIComponent(hash) : DEFAULT_FIXTURE
  const fixture = findFixture(key)
  if (fixture) {
    return {query: fixture.content, fixtureId: fixtureKey(fixture)}
  }
  return {query: fixtures[0]?.content ?? '', fixtureId: ''}
}

export function App() {
  const [initial] = useState(getInitialState)
  const [query, setQuery] = useState(initial.query)
  const [selectedFixture, setSelectedFixture] = useState(initial.fixtureId)
  const {formattedQuery, panelRef} = useFormattedQuery(query)

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
          <div className="panel-content" ref={panelRef}>
            <ShikiPanel query={formattedQuery} />
          </div>
        </div>
        <div className="panel">
          <h2>Lezer (CodeMirror)</h2>
          <div className="panel-content">
            <CodeMirrorPanel query={formattedQuery} />
          </div>
        </div>
        <div className="panel">
          <h2>Tree-sitter (WASM)</h2>
          <div className="panel-content">
            <TreeSitterPanel query={formattedQuery} />
          </div>
        </div>
        <div className="panel">
          <h2>Prism (Refractor)</h2>
          <div className="panel-content">
            <PrismPanel query={formattedQuery} />
          </div>
        </div>
      </div>
    </div>
  )
}
