declare module '*.groq.js' {
  const grammar: Record<string, unknown>
  export default grammar
}

declare module '@sanity/prism-groq' {
  const groq: Record<string, unknown>
  export default groq
}

declare module '@sanity/highlightjs-groq' {
  const groq: (hljs: unknown) => unknown
  export default groq
}
