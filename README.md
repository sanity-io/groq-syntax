# GROQ Syntax Highlighting

Syntax highlighting grammars for [GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries) targeting the major editor and platform ecosystems.

## Packages

| Package | Format | Used by |
|---|---|---|
| [`@sanity/textmate-groq`](packages/textmate-groq/) | TextMate grammar (`.tmLanguage.json`) | VS Code, Shiki, Sublime Text, GitHub/Linguist |
| [`@sanity/lezer-groq`](packages/lezer-groq/) | Lezer grammar (`.grammar`) | CodeMirror 6 |
| [`tree-sitter-groq`](packages/tree-sitter-groq/) | Tree-sitter grammar (`grammar.js`) | Neovim, Zed, Emacs 29+ |
| [`@sanity/prism-groq`](packages/prism-groq/) | Prism.js language definition | Documentation sites, MDX, markdown renderers |
| [`@sanity/highlightjs-groq`](packages/highlightjs-groq/) | highlight.js language definition | Documentation sites, blogs, CMS platforms |

## Why a single repo?

A shared test suite catches divergences between engines early - when a language feature is added, we update fixtures once and verify all three grammars handle it.

## Development

```bash
pnpm install

# Run all tests (TextMate, Lezer, tree-sitter snapshots + cross-engine comparison)
pnpm test

# Run tree-sitter native tests
cd packages/tree-sitter-groq && npx tree-sitter test

# Start the visual comparison playground
cd playground && pnpm dev
```

### Playground

A local Vite + React app that renders three panels side by side, each highlighting the same GROQ query through a different engine. Queries are auto-formatted with [prettier-plugin-groq](https://github.com/sanity-labs/sanity-lint) to fit the panel width.

### Adding a fixture

Test fixtures live in `packages/groq-highlight-test/fixtures/`. Each `.groq` file contains a single GROQ query. Add a file, run `pnpm test` to generate snapshots for all three engines, and review the output.

### Cross-engine comparison

The test harness maps each engine's native token types to a shared canonical taxonomy, then compares them with tolerance for known engine limitations (e.g. TextMate can't distinguish `identifier` from `identifier.function` without parse context).

## License

MIT - see [LICENSE](LICENSE).
