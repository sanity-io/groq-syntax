# GROQ Syntax Highlighting

Syntax highlighting grammars for [GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries) targeting the major editor and platform ecosystems.

## Packages

| Package | Format | Used by |
|---|---|---|
| [`tree-sitter-groq`](packages/tree-sitter-groq/) | Tree-sitter grammar (`grammar.js`) | Neovim, Zed, Helix, Emacs 29+ |
| [`@sanity/textmate-groq`](packages/textmate-groq/) | TextMate grammar (`.tmLanguage.json`) | VS Code, Shiki, Sublime Text, GitHub/Linguist |
| [`@sanity/lezer-groq`](packages/lezer-groq/) | Lezer grammar (`.grammar`) | CodeMirror 6 |
| [`@sanity/prism-groq`](packages/prism-groq/) | Prism.js language definition | react-refractor, rehype-prism, MDX |
| [`@sanity/highlightjs-groq`](packages/highlightjs-groq/) | highlight.js language definition | react-lowlight, lowlight, markdown renderers |
| [`@sanity/ace-groq`](packages/ace-groq/) | Ace editor mode | Ace-based editors |

## Why a single repo?

A shared test suite catches divergences between engines early. When a language feature is added, we update fixtures once and verify all six grammars handle it. A [visual playground](#playground) makes it easy to spot differences.

## Development

```bash
pnpm install

# Run all tests (74 tests across 8 test suites)
pnpm test

# Typecheck
pnpm typecheck

# Format
pnpm format

# Run tree-sitter native tests
cd packages/tree-sitter-groq && npx tree-sitter test

# Start the visual comparison playground
pnpm dev
```

### Playground

A local Vite + React app that renders six panels in a grid, each highlighting the same GROQ query through a different engine: TextMate (Shiki), Lezer (CodeMirror), tree-sitter (WASM), Prism (Refractor), highlight.js (Lowlight), and Ace. All panels share a single color palette for accurate comparison. Queries are auto-formatted with [prettier-plugin-groq](https://github.com/sanity-labs/sanity-lint) to fit the panel width.

### Adding a fixture

Test fixtures live in `packages/groq-highlight-test/fixtures/`. Each `.groq` file contains a single valid GROQ expression. Add a file, run `pnpm test` to generate snapshots for all engines, and review the output.

### Cross-engine comparison

The test harness maps each engine's native token types to a shared [canonical token taxonomy](packages/groq-highlight-test/src/canonical.ts), then compares them pairwise with tolerance for known engine limitations:

- TextMate can't distinguish `identifier` from `identifier.function` without parse context
- Prism and highlight.js (regex-based) have similar limitations to TextMate
- Tree-sitter and Lezer (real parsers) can distinguish context-dependent tokens like keywords used as field names

The cross-engine tests compare TextMate against each other engine, flagging mismatches above a 5% tolerance threshold.

### JS/TS injection

The TextMate package includes injection grammars for highlighting GROQ inside JavaScript/TypeScript (tagged template literals, `defineQuery()` calls) and markdown fenced code blocks. See the [@sanity/textmate-groq README](packages/textmate-groq/) for VS Code extension wiring.

## License

MIT - see [LICENSE](LICENSE).
