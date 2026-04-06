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

function walk(node: Node, spans: string[]) {
  if (node.childCount === 0) {
    const text = node.text
    if (!text) return
    const color = getColor(node)
    spans.push(`<span style="color:${color}">${escapeHtml(text)}</span>`)
  } else {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)
      if (child) walk(child, spans)
    }
  }
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
      const spans: string[] = []
      walk(tree.rootNode, spans)
      el.innerHTML = `<pre style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;line-height:1.5;margin:0;white-space:pre-wrap">${spans.join('')}</pre>`
      tree.delete()
    })
  }, [query, ready])

  return <div ref={ref} className="treesitter-output" />
}
