# tree-sitter-groq

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries).

Provides syntax highlighting, code navigation, and incremental parsing for editors that support tree-sitter: Neovim, Zed, Helix, Emacs 29+, and (coming) VS Code.

## Highlight queries

Standard highlight queries are at `queries/highlights.scm` using the capture names expected by tree-sitter-aware editors (`@function.call`, `@variable`, `@string`, `@keyword.operator`, etc.).

## JavaScript/TypeScript injection

Injection queries for detecting GROQ inside JS/TS template literals are at `injections/javascript.scm`:

```ts
const query1 = groq`*[_type == "post"]`
const query2 = defineQuery(`*[_type == "post"]`)
```

## Development

```bash
pnpm install

# Generate the parser from grammar.js
npx tree-sitter generate

# Run the native test corpus (35 tests)
npx tree-sitter test

# Parse a file
echo '*[_type == "post"]{title}' > test.groq
npx tree-sitter parse test.groq

# Build WASM (requires Docker)
npx tree-sitter build --wasm
```

## Grammar

The grammar is defined in `grammar.js` using tree-sitter's JavaScript DSL. It covers the full practical GROQ surface:

- Everything selector (`*`), filters, projections, pipes
- All operators with correct precedence
- Function calls and namespaced calls (`math::sum()`, `pt::text()`)
- String literals with escape sequences
- Keyword operators (`in`, `match`, `asc`, `desc`)
- Spread, ranges, pairs, dereferences, dot access, array traversal

The generated C parser is committed at `src/` (standard tree-sitter practice).

## License

MIT
