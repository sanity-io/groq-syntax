import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createOnigScanner, createOnigString, loadWASM} from 'vscode-oniguruma'
import {Registry, parseRawGrammar, INITIAL} from 'vscode-textmate'
import type {IGrammar} from 'vscode-textmate'
import type {HighlightToken} from './canonical.js'
import {mapTextmateScope} from './map-textmate.js'

let initPromise: Promise<IGrammar> | undefined

async function getGrammar(): Promise<IGrammar> {
  if (!initPromise) {
    initPromise = initGrammar()
  }
  return initPromise
}

async function initGrammar(): Promise<IGrammar> {
  const onigWasmPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'node_modules',
    'vscode-oniguruma',
    'release',
    'onig.wasm'
  )
  const wasmBin = await readFile(onigWasmPath)
  await loadWASM({data: wasmBin})

  const grammarPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'textmate-groq',
    'syntaxes',
    'groq.tmLanguage.json'
  )
  const grammarContent = await readFile(grammarPath, 'utf-8')
  const rawGrammar = parseRawGrammar(grammarContent, grammarPath)

  const registry = new Registry({
    onigLib: Promise.resolve({createOnigScanner, createOnigString}),
    loadGrammar: async () => rawGrammar,
  })

  const loaded = await registry.loadGrammar('source.groq')
  if (!loaded) throw new Error('Failed to load GROQ grammar')
  return loaded
}

/**
 * Tokenize GROQ source using the TextMate grammar.
 * Returns canonical tokens with whitespace omitted.
 */
export async function tokenizeTextmate(source: string): Promise<HighlightToken[]> {
  const g = await getGrammar()
  const lines = source.split('\n')
  const tokens: HighlightToken[] = []
  let ruleStack = INITIAL
  let offset = 0

  for (const line of lines) {
    const result = g.tokenizeLine(line, ruleStack)

    for (const token of result.tokens) {
      const text = line.substring(token.startIndex, token.endIndex)
      if (!text) continue

      const canonicalToken = mapTextmateScope(token.scopes)
      if (!canonicalToken) continue

      // Skip whitespace-only tokens unless they're inside a string
      // (where whitespace is meaningful content)
      if (/^\s+$/.test(text) && canonicalToken !== 'string' && canonicalToken !== 'string.escape') {
        continue
      }

      tokens.push({
        text,
        token: canonicalToken,
        start: offset + token.startIndex,
        end: offset + token.endIndex,
      })
    }

    ruleStack = result.ruleStack
    offset += line.length + 1
  }

  return tokens
}
