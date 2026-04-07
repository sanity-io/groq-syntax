# tree-sitter-groq

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [GROQ](https://www.sanity.io/docs/groq) (Graph-Relational Object Queries).

Provides syntax highlighting, code navigation, and incremental parsing for editors that support tree-sitter: Neovim, Zed, Helix, Emacs 29+, and (coming) VS Code.

## Editor setup

### Neovim

Register the parser in your Neovim config and install it with `:TSInstall groq`:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()

parser_config.groq = {
  install_info = {
    url = "https://github.com/sanity-io/groq-syntax",
    files = { "src/parser.c" },
    location = "packages/tree-sitter-groq",
    branch = "main",
  },
  filetype = "groq",
}

vim.filetype.add({ extension = { groq = "groq" } })
```

Copy the query files into your Neovim runtime:

```sh
mkdir -p ~/.config/nvim/after/queries/groq
cp queries/highlights.scm ~/.config/nvim/after/queries/groq/highlights.scm
```

For GROQ-in-JS/TS injection (`` groq`...` `` tagged templates):

```sh
cp injections/javascript.scm ~/.config/nvim/after/queries/javascript/injections.scm
```

### Helix

Add to `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "groq"
scope = "source.groq"
file-types = ["groq"]
comment-tokens = ["//"]
indent = { tab-width = 2, unit = "  " }

[[grammar]]
name = "groq"
source = { git = "https://github.com/sanity-io/groq-syntax", rev = "main", subpath = "packages/tree-sitter-groq" }
```

Then fetch and build:

```sh
hx --grammar fetch
hx --grammar build
mkdir -p ~/.config/helix/runtime/queries/groq
cp queries/highlights.scm ~/.config/helix/runtime/queries/groq/highlights.scm
```

### Emacs 29+

```elisp
(add-to-list 'treesit-language-source-alist
  '(groq "https://github.com/sanity-io/groq-syntax"
         "main"
         "packages/tree-sitter-groq/src"))
```

Then run `M-x treesit-install-language-grammar RET groq RET`.

Note: Emacs uses `treesit-font-lock-rules` in Elisp rather than `.scm` query files, so the highlight queries would need to be translated to a `groq-ts-mode` major mode.

### Zed

Zed uses extensions for language support. A GROQ extension would reference this grammar:

```toml
# extension.toml
[grammars.groq]
repository = "https://github.com/sanity-io/groq-syntax"
path = "packages/tree-sitter-groq"
```

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
