import {useEffect, useRef, useState} from 'react'
import {Parser, Language, type Node} from 'web-tree-sitter'
import {colors} from '../theme'

let initPromise: Promise<{parser: Parser}> | undefined

function getParser() {
  if (!initPromise) {
    initPromise = (async () => {
      await Parser.init({
        locateFile: (file: string) => `/${file}`,
      })
      const parser = new Parser()
      const language = await Language.load('/tree-sitter-groq.wasm')
      parser.setLanguage(language)
      return {parser}
    })()
  }
  return initPromise
}

function getColor(node: Node): string {
  if (node.isNamed) {
    switch (node.type) {
      case 'comment':
        return colors.gray
      case 'string_content':
        return colors.green
      case 'escape_sequence':
        return colors.cyan
      case 'number':
        return colors.orange
      case 'true':
      case 'false':
      case 'null':
        return colors.orange
      case 'everything':
        return colors.orange
      case 'this':
      case 'parent':
        return colors.red
      case 'parameter':
        return colors.red
      case 'identifier':
        return classifyIdentifier(node)
    }
  } else {
    const text = node.text
    // * inside everything node is the wildcard, not multiplication
    if (text === '*' && node.parent?.type === 'everything') return colors.orange
    if (['in', 'match', 'asc', 'desc'].includes(text)) return colors.purple
    if (
      [
        '==',
        '!=',
        '<',
        '>',
        '<=',
        '>=',
        '&&',
        '||',
        '!',
        '+',
        '-',
        '*',
        '/',
        '%',
        '**',
        '|',
        '->',
        '=>',
        '..',
        '...',
      ].includes(text)
    )
      return colors.cyan
    if (text === '.' || text === '::') return colors.cyan
    if (['(', ')', '{', '}', '[', ']', ',', ':'].includes(text)) return colors.fg
    if (text === '"' || text === "'") return colors.green
  }
  return colors.fg
}

function classifyIdentifier(node: Node): string {
  const parent = node.parent
  if (!parent) return colors.red

  if (parent.type === 'function_call') {
    const fn = parent.childForFieldName('function')
    if (fn && fn.id === node.id) return colors.blue
  }

  if (parent.type === 'namespaced_call') {
    const ns = parent.childForFieldName('namespace')
    if (ns && ns.id === node.id) return colors.yellow
    const fn = parent.childForFieldName('function')
    if (fn && fn.id === node.id) return colors.blue
  }

  return colors.red
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTree(root: Node, source: string): string {
  const spans: string[] = []
  let pos = 0

  function walk(node: Node) {
    if (node.childCount === 0) {
      // Emit any gap (whitespace/comments skipped by extras) before this node
      if (node.startIndex > pos) {
        spans.push(escapeHtml(source.slice(pos, node.startIndex)))
      }
      const text = node.text
      if (text) {
        const color = getColor(node)
        spans.push(`<span style="color:${color}">${escapeHtml(text)}</span>`)
      }
      pos = node.endIndex
    } else {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (child) walk(child)
      }
    }
  }

  walk(root)
  // Emit any trailing text
  if (pos < source.length) {
    spans.push(escapeHtml(source.slice(pos)))
  }
  return spans.join('')
}

export function TreeSitterPanel({query}: {query: string}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getParser().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !ref.current) return
    const el = ref.current
    getParser().then(({parser}) => {
      const tree = parser.parse(query)
      if (!tree) return
      const html = renderTree(tree.rootNode, query)
      el.innerHTML = `<pre style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;line-height:1.5;margin:0;white-space:pre-wrap">${html}</pre>`
      tree.delete()
    })
  }, [query, ready])

  return <div ref={ref} className="treesitter-output" />
}
