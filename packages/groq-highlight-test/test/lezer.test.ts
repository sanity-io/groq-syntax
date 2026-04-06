import {describe, it, expect} from 'vitest'
import {readFile, readdir} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {tokenizeLezer} from '../src/tokenize-lezer.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

async function loadFixture(path: string): Promise<string> {
  return readFile(join(fixturesDir, path), 'utf-8').then((s) => s.trimEnd())
}

async function getFixtures(category: string): Promise<string[]> {
  const categoryDir = join(fixturesDir, category)
  const entries = await readdir(categoryDir)
  return entries
    .filter((e) => e.endsWith('.groq'))
    .sort()
    .map((e) => `${category}/${e}`)
}

const categories = ['basics', 'functions', 'operators', 'pipes', 'edge-cases', 'real-world']

describe('Lezer tokenizer', () => {
  for (const category of categories) {
    describe(category, () => {
      it(`tokenizes all ${category} fixtures`, async () => {
        const fixtures = await getFixtures(category)
        for (const fixture of fixtures) {
          const source = await loadFixture(fixture)
          const tokens = tokenizeLezer(source)
          expect(tokens).toMatchSnapshot(fixture)
        }
      })
    })
  }
})
