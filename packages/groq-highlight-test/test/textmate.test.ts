import {describe, it, expect} from 'vitest'
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {tokenizeTextmate} from '../src/tokenize-textmate.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

async function loadFixture(path: string): Promise<string> {
  return readFile(join(fixturesDir, path), 'utf-8').then((s) => s.trimEnd())
}

describe('TextMate tokenizer', () => {
  it('tokenizes basic filter', async () => {
    const source = await loadFixture('basics/filter.groq')
    const tokens = await tokenizeTextmate(source)
    expect(tokens).toMatchSnapshot()
  })

  it('tokenizes literals', async () => {
    const source = await loadFixture('basics/literals.groq')
    const tokens = await tokenizeTextmate(source)
    expect(tokens).toMatchSnapshot()
  })
})
