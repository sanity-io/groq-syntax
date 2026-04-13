import {useEffect, useState} from 'react'
import {ShikiPanel} from './engines/ShikiPanel'
import {CodeMirrorPanel} from './engines/CodeMirrorPanel'
import {TreeSitterPanel} from './engines/TreeSitterPanel'
import {PrismPanel} from './engines/PrismPanel'
import {HighlightJsPanel} from './engines/HighlightJsPanel'
import {AcePanel} from './engines/AcePanel'
import {FixturePicker, CUSTOM} from './components/FixturePicker'
import {useFormattedQuery} from './useFormattedQuery'
import {findFixture, fixtureKey, fixtures, type Fixture} from './fixtures'
import './App.css'

const DEFAULT_FIXTURE = 'real-world/default'

function encodeQuery(query: string): string {
  const bytes = new TextEncoder().encode(query)
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeQuery(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function parseHash(): {query: string; fixtureId: string} {
  const hash = location.hash.slice(1)
  if (!hash) {
    const fixture = findFixture(DEFAULT_FIXTURE)
    return fixture
      ? {query: fixture.content, fixtureId: fixtureKey(fixture)}
      : {query: fixtures[0]?.content ?? '', fixtureId: ''}
  }

  if (hash.startsWith('q:')) {
    try {
      return {query: decodeQuery(hash.slice(2)), fixtureId: CUSTOM}
    } catch {
      // Fall through to default on invalid encoding
    }
  }

  if (hash.startsWith('fixture:')) {
    const key = decodeURIComponent(hash.slice(8))
    const fixture = findFixture(key)
    if (fixture) {
      return {query: fixture.content, fixtureId: fixtureKey(fixture)}
    }
  }

  // Default fallback
  const fixture = findFixture(DEFAULT_FIXTURE)
  return fixture
    ? {query: fixture.content, fixtureId: fixtureKey(fixture)}
    : {query: fixtures[0]?.content ?? '', fixtureId: ''}
}

export function App() {
  const [initial] = useState(parseHash)
  const [query, setQuery] = useState(initial.query)
  const [selectedFixture, setSelectedFixture] = useState(initial.fixtureId)
  const {formattedQuery, panelRef} = useFormattedQuery(query)
  const isCustom = selectedFixture === CUSTOM

  useEffect(() => {
    function onHashChange() {
      const state = parseHash()
      setQuery(state.query)
      setSelectedFixture(state.fixtureId)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function selectFixture(fixture: Fixture) {
    const key = fixtureKey(fixture)
    setQuery(fixture.content)
    setSelectedFixture(key)
    history.replaceState(null, '', `#fixture:${encodeURIComponent(key)}`)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelectedFixture(CUSTOM)
    history.replaceState(null, '', `#q:${encodeQuery(value)}`)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>GROQ Syntax Playground</h1>
        <FixturePicker selected={selectedFixture} onSelect={selectFixture} />
      </header>
      <div className={`editor${isCustom ? ' editor-custom' : ''}`}>
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
        <div className="panel">
          <h2>highlight.js (Lowlight)</h2>
          <div className="panel-content">
            <HighlightJsPanel query={formattedQuery} />
          </div>
        </div>
        <div className="panel">
          <h2>Ace Editor</h2>
          <div className="panel-content">
            <AcePanel query={formattedQuery} />
          </div>
        </div>
      </div>
    </div>
  )
}
