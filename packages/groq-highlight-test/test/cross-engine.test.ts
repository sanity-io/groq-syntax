import {describe, it, expect} from 'vitest'
import {readFile, readdir} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {tokenizeTextmate} from '../src/tokenize-textmate.js'
import {tokenizeLezer} from '../src/tokenize-lezer.js'
import {compareTokens} from '../src/compare.js'

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

describe('Cross-engine comparison (TextMate vs Lezer)', () => {
  for (const category of categories) {
    describe(category, () => {
      it(`agrees on all ${category} fixtures within tolerance`, async () => {
        const fixtures = await getFixtures(category)
        for (const fixture of fixtures) {
          const source = await loadFixture(fixture)
          const tmTokens = await tokenizeTextmate(source)
          const lezerTokens = tokenizeLezer(source)

          const result = compareTokens(fixture, tmTokens, lezerTokens)
          const totalTmTokens = tmTokens.length

          // Allow up to 5% mismatches. The only remaining boundary difference is
          // negative numbers (TextMate: "-1" as one number, Lezer: "-" + "1").
          const maxMismatches = Math.ceil(totalTmTokens * 0.05)
          const mismatchDesc = result.mismatches
            .map((m) => `${m.textA}(${m.tokenA}!=${m.tokenB})`)
            .join(', ')

          expect(
            result.mismatches.length,
            `${fixture}: ${result.mismatches.length} mismatches [${mismatchDesc}]`,
          ).toBeLessThanOrEqual(maxMismatches)
        }
      })
    })
  }
})
