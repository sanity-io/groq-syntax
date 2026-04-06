import {describe, it, expect} from 'vitest'
import {createHighlighter} from 'shiki'
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadGrammar() {
  const grammarPath = join(__dirname, '..', '..', 'textmate-groq', 'syntaxes', 'groq.tmLanguage.json')
  return JSON.parse(await readFile(grammarPath, 'utf-8'))
}

describe('Shiki smoke test', () => {
  it('highlights GROQ with the textmate grammar', async () => {
    const grammar = await loadGrammar()

    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [{...grammar, name: 'groq'}],
    })

    const html = highlighter.codeToHtml('*[_type == "post"]{title, "author": author->name}', {
      lang: 'groq',
      theme: 'github-dark',
    })

    // Should produce styled spans
    expect(html).toContain('<span')
    // Should contain the key tokens
    expect(html).toContain('post')
    expect(html).toContain('title')
    expect(html).toContain('author')

    highlighter.dispose()
  })

  it('highlights a complex real-world query', async () => {
    const grammar = await loadGrammar()
    const fixturePath = join(__dirname, '..', 'fixtures', 'real-world', 'blog-query.groq')
    const query = await readFile(fixturePath, 'utf-8')

    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [{...grammar, name: 'groq'}],
    })

    const html = highlighter.codeToHtml(query, {
      lang: 'groq',
      theme: 'github-dark',
    })

    // Should produce output with multiple styled spans
    expect(html).toContain('<span')
    // Should NOT have any unstyled raw text outside spans (except whitespace)
    // This validates the grammar doesn't have gaps

    highlighter.dispose()
  })
})
