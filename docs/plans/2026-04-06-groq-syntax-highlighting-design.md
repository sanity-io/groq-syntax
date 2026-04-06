# GROQ Syntax Highlighting - Design Document

Date: 2026-04-06

## Summary

A unified pnpm monorepo for GROQ syntax highlighting grammars targeting TextMate (VS Code, Shiki, Linguist), Lezer (CodeMirror 6), and tree-sitter (Neovim, Zed, Emacs 29+). Shared test fixtures and a visual comparison playground catch cross-engine divergences.

## Decisions

- **Build order**: TextMate + test harness first (phase 1), then Lezer + playground (phase 2), then tree-sitter (phase 3).
- **Function highlighting**: Hybrid - known functions from a curated list, plus generic `namespace::method()` pattern matching. Bare `identifier(` only highlights for known functions.
- **Package names**: `tree-sitter-groq` (unscoped, ecosystem convention), `@sanity/lezer-groq`, `@sanity/textmate-groq`.
- **Playground**: Local-only (`pnpm dev`), no deployment until grammars are mature.
- **Token map**: Inline in the test harness package, extract later if needed.
- **Snapshots**: JSON format with vitest snapshot testing.
- **GROQ scope**: Practical surface first (everything a Sanity user encounters), exotic spec features (custom function defs) in a later pass.
- **TextMate nesting**: Recursive repository rules to handle nested brackets.
- **Known function list**: Hardcoded per grammar, test fixtures catch drift.

## Repo structure

```
groq-syntax/
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.workspace.ts
│
├── packages/
│   ├── textmate-groq/            # Phase 1
│   │   ├── package.json          # @sanity/textmate-groq
│   │   ├── syntaxes/
│   │   │   └── groq.tmLanguage.json
│   │   └── test/
│   │       └── snapshot.test.ts
│   │
│   ├── lezer-groq/               # Phase 2
│   │   ├── package.json          # @sanity/lezer-groq
│   │   ├── src/
│   │   │   ├── groq.grammar
│   │   │   ├── highlight.ts
│   │   │   └── index.ts
│   │   └── test/
│   │
│   ├── tree-sitter-groq/         # Phase 3
│   │   ├── package.json          # tree-sitter-groq
│   │   ├── grammar.js
│   │   ├── queries/highlights.scm
│   │   ├── src/                  # Generated C parser (committed)
│   │   ├── bindings/
│   │   └── test/corpus/
│   │
│   └── groq-highlight-test/      # Phase 1
│       ├── package.json
│       ├── fixtures/             # Shared .groq files
│       │   ├── basics/
│       │   ├── functions/
│       │   ├── operators/
│       │   ├── pipes/
│       │   ├── edge-cases/
│       │   └── real-world/
│       ├── snapshots/
│       ├── src/
│       │   ├── canonical.ts
│       │   ├── map-textmate.ts
│       │   ├── tokenize-textmate.ts
│       │   └── compare.ts
│       └── vitest.config.ts
│
├── playground/                   # Phase 2+
│   ├── package.json
│   ├── index.html
│   └── src/
│
└── docs/
    └── plans/
```

## Canonical token taxonomy

```typescript
type CanonicalToken =
  // Literals
  | 'keyword'              // true, false, null
  | 'string'               // "..." and '...'
  | 'string.escape'        // \n, \uXXXX, etc.
  | 'number'               // 42, 3.14, 1e10
  | 'comment'              // // ...

  // Operators
  | 'operator'             // ==, !=, <, >, <=, >=, &&, ||, !, +, -, /, %, **
  | 'operator.keyword'     // in, match, asc, desc
  | 'operator.spread'      // ...
  | 'operator.arrow'       // =>
  | 'operator.pipe'        // |
  | 'operator.range'       // .., ...

  // Access
  | 'accessor'             // ->, .

  // Identifiers
  | 'identifier'           // field names: title, _type
  | 'identifier.function'  // known functions: count, defined, boost
  | 'identifier.namespace' // math, string, pt, geo (before ::)

  // Variables and special
  | 'variable'             // $param
  | 'variable.special'     // @, ^, ^^
  | 'wildcard'             // * (everything selector)

  // Punctuation
  | 'punctuation.bracket'  // [ ] ( ) { }
  | 'punctuation.delimiter'// , : ;
  | 'punctuation.namespace'// ::
```

## TextMate grammar architecture

Recursive repository rules for nested bracket handling.

**Scope naming** (`.groq` suffix):
- `keyword.constant.groq` - true, false, null
- `keyword.operator.groq` - in, match
- `keyword.operator.sort.groq` - asc, desc
- `string.quoted.double.groq`, `string.quoted.single.groq`
- `constant.numeric.groq`
- `comment.line.double-slash.groq`
- `variable.parameter.groq` - $param
- `variable.language.groq` - @, ^
- `variable.language.wildcard.groq` - * at expression start
- `support.function.groq` - known functions
- `entity.name.namespace.groq` - math, pt, etc.
- `punctuation.separator.namespace.groq` - ::
- `keyword.operator.dereference.groq` - ->
- `keyword.operator.pipe.groq` - |
- `keyword.operator.pair.groq` - =>
- `keyword.operator.spread.groq` - ...
- `keyword.operator.range.groq` - ..

**Repository rule hierarchy:**
```
#expression          - top-level, includes all sub-rules
  #comment           - // to end of line
  #string-double     - begin/end ", includes #string-escape
  #string-single     - begin/end ', includes #string-escape
  #string-escape     - \n, \t, \uXXXX, \u{...}, etc.
  #number            - integers, floats, scientific notation
  #keyword           - true, false, null
  #variable          - $identifier
  #variable-special  - @, ^
  #wildcard          - * at expression-start positions
  #function-call     - known functions followed by (
  #namespace-call    - identifier :: identifier (
  #operator-keyword  - in, match, asc, desc (word-bounded)
  #operator          - ==, !=, <=, >=, &&, ||, =>, ->, .., ..., etc.
  #accessor          - . (dot access)
  #pipe              - |
  #filter            - begin [ / end ] - RECURSIVE (includes #expression)
  #projection        - begin { / end } - RECURSIVE (includes #expression)
  #group             - begin ( / end ) - RECURSIVE (includes #expression)
  #punctuation       - , : ;
  #identifier        - fallback for unmatched names
```

**Ambiguity heuristics:**
- `*` as wildcard: matched when preceded by start-of-line, `[`, `(`, `|`, `,`, or whitespace before `[`/`{`. Multiplication falls through to operator rule.
- `...` matched before `..` (longer match first).
- `|` always scoped as pipe (GROQ has no bitwise OR).

**Known TextMate limitations:**
- `identifier.function` vs `identifier` only works when followed by `(`.
- `*` wildcard vs multiply is heuristic-based.
- `...` as spread vs range gets the same scope regardless of context.

## Test fixtures

```
fixtures/
  basics/           filter, projection, slice, dereference, ordering, scoring, parent-ref
  functions/        global, namespaced, unknown-namespace
  operators/        comparison, logical, arithmetic, keyword-ops, spread, range, pair
  pipes/            order, score, chained
  edge-cases/       nested-brackets, string-escapes, keywords-as-fields,
                    wildcard-vs-multiply, empty-array-traversal, negative-index, variables
  real-world/       blog-query, e-commerce, content-lake
```

**Snapshot format** - JSON array per fixture per engine:
```json
[
  {"text": "*", "token": "wildcard", "start": 0, "end": 1},
  {"text": "[", "token": "punctuation.bracket", "start": 1, "end": 2}
]
```

Whitespace tokens omitted.

**Comparison tolerance levels:**
- **strict** - exact match (strings, numbers, comments, keywords, unambiguous operators)
- **compatible** - acceptable alternatives (operator.spread/operator.range for `...`, identifier/identifier.function)
- **skip** - present in one engine but not another

## Known functions list

Global: `coalesce`, `count`, `dateTime`, `defined`, `length`, `now`, `references`, `round`, `select`, `string`, `lower`, `upper`, `boost`, `after`, `before`, `identity`, `path`

Pipe functions: `order`, `score`

Namespaced (highlighted generically via `namespace::method()` pattern, but also recognized individually):
- `array::` - join, compact, unique, intersects
- `dateTime::` - now
- `delta::` - changedAny, changedOnly, operation
- `diff::` - changedAny, changedOnly
- `documents::` - get, incomingGlobalDocumentReferenceCount
- `geo::` - latLng, contains, intersects, distance
- `math::` - sum, avg, min, max
- `pt::` - text
- `sanity::` - projectId, dataset
- `string::` - split, startsWith

Any `identifier::identifier(` pattern is highlighted as a namespace call even if not in the known list.

## Phase plan

**Phase 1: TextMate + test harness**
1. Scaffold pnpm workspace
2. Create groq-highlight-test with canonical types, fixtures, TextMate tokenizer
3. Build textmate-groq grammar iteratively against fixtures
4. Cover all fixture categories, snapshot test
5. Document known limitations

Deliverable: shippable TextMate grammar for Shiki/Linguist.

**Phase 2: Lezer + playground**
1. Add lezer-groq with grammar, highlight tags, language support
2. Add Lezer tokenizer and mapper to test harness
3. Cross-engine comparison tests (TextMate vs Lezer)
4. Scaffold playground with Shiki + CodeMirror panels
5. Token inspector component

Deliverable: CodeMirror 6 language package, local playground.

**Phase 3: Tree-sitter**
1. Add tree-sitter-groq with grammar.js and highlights.scm
2. Build and commit C parser + WASM bindings
3. Add tree-sitter tokenizer and mapper to test harness
4. Three-way cross-engine comparison
5. Tree-sitter panel in playground
6. Native test corpus

Deliverable: tree-sitter grammar for Neovim/Zed, complete three-engine comparison.

**Phase 4: Polish and publish**
1. Exotic spec features (custom function definitions)
2. divergences.md documentation
3. npm publish prep
4. Linguist submission prep

## Out of scope

- VS Code extension (separate repo)
- Autocompletion, folding, or CodeMirror features beyond highlighting
- Linguist submission itself (requires GROQ usage threshold on GitHub)
- Playground deployment
