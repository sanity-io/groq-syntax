# Phase 1: TextMate Grammar + Test Harness - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a snapshot-tested TextMate grammar for GROQ syntax highlighting, ready for Shiki consumption and Linguist submission prep.

**Architecture:** A pnpm workspace with two packages - `textmate-groq` (the grammar JSON) and `groq-highlight-test` (canonical token types, fixtures, tokenizer wrapper, snapshot tests). The test harness uses `vscode-textmate` and `vscode-oniguruma` to tokenize GROQ fixtures against the grammar, maps TextMate scopes to canonical tokens, and snapshots the results.

**Tech Stack:** pnpm workspace, TypeScript, vitest, vscode-textmate, vscode-oniguruma

---

### Task 1: Scaffold pnpm workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

**Step 1: Create root package.json**

```json
{
  "name": "groq-syntax",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20",
    "pnpm": ">=10"
  },
  "packageManager": "pnpm@10.28.2",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - packages/*
```

**Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

**Step 5: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, node_modules populated

**Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore pnpm-lock.yaml
git commit -m "scaffold: pnpm workspace with typescript and vitest"
```

---

### Task 2: Create textmate-groq package skeleton

**Files:**
- Create: `packages/textmate-groq/package.json`
- Create: `packages/textmate-groq/syntaxes/groq.tmLanguage.json` (minimal stub)

**Step 1: Create package.json**

```json
{
  "name": "@sanity/textmate-groq",
  "version": "0.0.0",
  "description": "TextMate grammar for GROQ query language",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": "./syntaxes/groq.tmLanguage.json"
  },
  "files": [
    "syntaxes"
  ]
}
```

**Step 2: Create minimal grammar stub**

Create `packages/textmate-groq/syntaxes/groq.tmLanguage.json` with a minimal valid TextMate grammar that only handles comments:

```json
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "GROQ",
  "scopeName": "source.groq",
  "patterns": [
    { "include": "#expression" }
  ],
  "repository": {
    "expression": {
      "patterns": [
        { "include": "#comment" }
      ]
    },
    "comment": {
      "match": "//.*$",
      "name": "comment.line.double-slash.groq"
    }
  }
}
```

This stub will grow incrementally in later tasks.

**Step 3: Commit**

```bash
git add packages/textmate-groq/
git commit -m "scaffold: textmate-groq package with minimal grammar stub"
```

---

### Task 3: Create groq-highlight-test package with canonical types

**Files:**
- Create: `packages/groq-highlight-test/package.json`
- Create: `packages/groq-highlight-test/tsconfig.json`
- Create: `packages/groq-highlight-test/vitest.config.ts`
- Create: `packages/groq-highlight-test/src/canonical.ts`

**Step 1: Create package.json**

```json
{
  "name": "groq-highlight-test",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:update": "vitest run --update"
  },
  "devDependencies": {
    "vscode-textmate": "^9.2.0",
    "vscode-oniguruma": "^2.0.1",
    "vitest": "^3.1.0",
    "typescript": "^5.8.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*", "test/**/*"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
})
```

**Step 4: Create canonical.ts**

```typescript
/**
 * Canonical token types shared across all highlighting engines.
 * Each engine maps its native token types to these canonical types.
 */
export type CanonicalToken =
  // Literals
  | 'keyword'
  | 'string'
  | 'string.escape'
  | 'number'
  | 'comment'
  // Operators
  | 'operator'
  | 'operator.keyword'
  | 'operator.spread'
  | 'operator.arrow'
  | 'operator.pipe'
  | 'operator.range'
  // Access
  | 'accessor'
  // Identifiers
  | 'identifier'
  | 'identifier.function'
  | 'identifier.namespace'
  // Variables
  | 'variable'
  | 'variable.special'
  | 'wildcard'
  // Punctuation
  | 'punctuation.bracket'
  | 'punctuation.delimiter'
  | 'punctuation.namespace'

/**
 * A single highlighted token with its canonical type and source position.
 */
export interface HighlightToken {
  text: string
  token: CanonicalToken
  start: number
  end: number
}
```

**Step 5: Install dependencies**

Run: `pnpm install`
Expected: vscode-textmate and vscode-oniguruma installed in groq-highlight-test

**Step 6: Commit**

```bash
git add packages/groq-highlight-test/
git commit -m "scaffold: groq-highlight-test package with canonical token types"
```

---

### Task 4: Build TextMate tokenizer wrapper

**Files:**
- Create: `packages/groq-highlight-test/src/map-textmate.ts`
- Create: `packages/groq-highlight-test/src/tokenize-textmate.ts`

**Step 1: Create map-textmate.ts**

This maps TextMate scope names to canonical tokens. The mapping checks scopes from most specific to least specific (TextMate scopes are hierarchical).

```typescript
import type {CanonicalToken} from './canonical.js'

/**
 * Maps a TextMate scope stack to a canonical token type.
 * Scopes are ordered most-specific-first by vscode-textmate.
 * Returns undefined for scopes we don't map (e.g. source.groq itself).
 */
export function mapTextmateScope(scopes: string[]): CanonicalToken | undefined {
  // Walk scopes from most specific to least specific
  for (const scope of scopes) {
    // Comments
    if (scope.startsWith('comment.')) return 'comment'

    // Strings
    if (scope.startsWith('constant.character.escape.')) return 'string.escape'
    if (scope.startsWith('string.')) return 'string'

    // Numbers
    if (scope.startsWith('constant.numeric.')) return 'number'

    // Keywords (true, false, null)
    if (scope.startsWith('keyword.constant.')) return 'keyword'

    // Operator keywords (in, match, asc, desc)
    if (scope.startsWith('keyword.operator.sort.')) return 'operator.keyword'
    if (scope === 'keyword.operator.logical.in.groq') return 'operator.keyword'
    if (scope === 'keyword.operator.match.groq') return 'operator.keyword'

    // Specific operators
    if (scope.startsWith('keyword.operator.spread.')) return 'operator.spread'
    if (scope.startsWith('keyword.operator.pair.')) return 'operator.arrow'
    if (scope.startsWith('keyword.operator.pipe.')) return 'operator.pipe'
    if (scope.startsWith('keyword.operator.range.')) return 'operator.range'
    if (scope.startsWith('keyword.operator.dereference.')) return 'accessor'
    if (scope.startsWith('keyword.operator.')) return 'operator'

    // Accessor (dot)
    if (scope.startsWith('punctuation.accessor.')) return 'accessor'

    // Variables
    if (scope.startsWith('variable.parameter.')) return 'variable'
    if (scope.startsWith('variable.language.wildcard.')) return 'wildcard'
    if (scope.startsWith('variable.language.')) return 'variable.special'

    // Functions and namespaces
    if (scope.startsWith('support.function.')) return 'identifier.function'
    if (scope.startsWith('entity.name.namespace.')) return 'identifier.namespace'
    if (scope.startsWith('punctuation.separator.namespace.')) return 'punctuation.namespace'

    // Punctuation
    if (scope.startsWith('punctuation.definition.bracket.') ||
        scope.startsWith('punctuation.section.')) return 'punctuation.bracket'
    if (scope.startsWith('punctuation.separator.') &&
        !scope.startsWith('punctuation.separator.namespace.')) return 'punctuation.delimiter'

    // Identifiers (entity.name covers field names)
    if (scope.startsWith('entity.name.tag.')) return 'identifier'
  }

  return undefined
}
```

**Step 2: Create tokenize-textmate.ts**

This loads the TextMate grammar, tokenizes GROQ source, and returns canonical tokens.

```typescript
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  createOnigScanner,
  createOnigString,
  loadWASM,
} from 'vscode-oniguruma'
import {
  Registry,
  parseRawGrammar,
  type IGrammar,
  INITIAL,
} from 'vscode-textmate'
import type {HighlightToken} from './canonical.js'
import {mapTextmateScope} from './map-textmate.js'

let registry: Registry | undefined
let grammar: IGrammar | undefined

async function getGrammar(): Promise<IGrammar> {
  if (grammar) return grammar

  // Load oniguruma WASM
  const onigWasmPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'node_modules',
    'vscode-oniguruma',
    'release',
    'onig.wasm',
  )
  const wasmBin = await readFile(onigWasmPath)
  await loadWASM({data: wasmBin})

  // Load grammar JSON
  const grammarPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'textmate-groq',
    'syntaxes',
    'groq.tmLanguage.json',
  )
  const grammarContent = await readFile(grammarPath, 'utf-8')
  const rawGrammar = parseRawGrammar(grammarContent, grammarPath)

  registry = new Registry({
    onigLib: Promise.resolve({createOnigScanner, createOnigString}),
    loadGrammar: async () => rawGrammar,
  })

  const loaded = await registry.loadGrammar('source.groq')
  if (!loaded) throw new Error('Failed to load GROQ grammar')
  grammar = loaded
  return grammar
}

/**
 * Tokenize GROQ source using the TextMate grammar.
 * Returns canonical tokens with whitespace omitted.
 */
export async function tokenizeTextmate(source: string): Promise<HighlightToken[]> {
  const g = await getGrammar()
  const lines = source.split('\n')
  const tokens: HighlightToken[] = []
  let ruleStack = INITIAL
  let offset = 0

  for (const line of lines) {
    const result = g.tokenizeLine(line, ruleStack)

    for (const token of result.tokens) {
      const text = line.substring(token.startIndex, token.endIndex)

      // Skip pure whitespace
      if (/^\s*$/.test(text)) continue

      const canonicalToken = mapTextmateScope(token.scopes)
      if (canonicalToken) {
        tokens.push({
          text,
          token: canonicalToken,
          start: offset + token.startIndex,
          end: offset + token.endIndex,
        })
      }
    }

    ruleStack = result.ruleStack
    offset += line.length + 1 // +1 for newline
  }

  return tokens
}
```

**Step 3: Commit**

```bash
git add packages/groq-highlight-test/src/
git commit -m "feat: textmate tokenizer wrapper with scope-to-canonical mapping"
```

---

### Task 5: Write initial test fixtures and first snapshot test

**Files:**
- Create: `packages/groq-highlight-test/fixtures/basics/filter.groq`
- Create: `packages/groq-highlight-test/test/textmate.test.ts`

**Step 1: Create the simplest fixture**

Create `packages/groq-highlight-test/fixtures/basics/filter.groq`:

```groq
*[_type == "post"]
```

**Step 2: Write the snapshot test**

Create `packages/groq-highlight-test/test/textmate.test.ts`:

```typescript
import {describe, it, expect} from 'vitest'
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {tokenizeTextmate} from '../src/tokenize-textmate.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

async function loadFixture(path: string): Promise<string> {
  return readFile(join(fixturesDir, path), 'utf-8').then((s) => s.trimEnd())
}

describe('TextMate tokenizer', () => {
  it('tokenizes basic filter', async () => {
    const source = await loadFixture('basics/filter.groq')
    const tokens = await tokenizeTextmate(source)
    expect(tokens).toMatchSnapshot()
  })
})
```

**Step 3: Run the test to see it work (will produce a minimal snapshot from the stub grammar)**

Run: `cd packages/groq-highlight-test && pnpm test -- --update`
Expected: test passes, snapshot file created. The snapshot will be sparse since the grammar only handles comments so far.

**Step 4: Commit**

```bash
git add packages/groq-highlight-test/fixtures/ packages/groq-highlight-test/test/
git commit -m "test: initial fixture and snapshot test for textmate tokenizer"
```

---

### Task 6: Build TextMate grammar - comments, strings, numbers, keywords

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`

Expand the grammar stub to handle the foundational token types: comments, strings (double and single quoted with escapes), numbers (int, float, scientific), and keyword constants (true, false, null).

**Step 1: Update the grammar**

Replace the entire `groq.tmLanguage.json` with the patterns for comments, strings, numbers, and keywords. The `#expression` repository rule includes all sub-rules. Key patterns:

- `#comment`: `//.*$` scoped as `comment.line.double-slash.groq`
- `#string-double`: begin `"`, end `"`, with `#string-escape` inside
- `#string-single`: begin `'`, end `'`, with `#string-escape` inside
- `#string-escape`: `\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\})` scoped as `constant.character.escape.groq`
- `#number`: `(?<![\\w.])-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?(?![\\w.])` scoped as `constant.numeric.groq`
- `#keyword`: `\\b(?:true|false|null)\\b` scoped as `keyword.constant.groq`

**Step 2: Add fixtures for these types**

Create `packages/groq-highlight-test/fixtures/basics/literals.groq`:
```groq
true
false
null
42
3.14
1e10
2.5E-3
"hello world"
'single quoted'
"escape: \n \t \\ \u0041 \u{1F600}"
// this is a comment
```

**Step 3: Add test case**

Add to `test/textmate.test.ts`:
```typescript
it('tokenizes literals', async () => {
  const source = await loadFixture('basics/literals.groq')
  const tokens = await tokenizeTextmate(source)
  expect(tokens).toMatchSnapshot()
})
```

**Step 4: Run tests, inspect the snapshot, iterate on grammar until literals tokenize correctly**

Run: `pnpm test -- --update`
Expected: snapshot shows correct canonical tokens for all literal types.

**Step 5: Commit**

```bash
git add packages/textmate-groq/syntaxes/ packages/groq-highlight-test/
git commit -m "feat: textmate grammar - comments, strings, numbers, keywords"
```

---

### Task 7: Build TextMate grammar - variables and wildcard

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/variables.groq`

**Step 1: Add grammar rules**

Add these repository rules to the grammar:

- `#variable`: `\\$[a-zA-Z_][a-zA-Z0-9_]*` scoped as `variable.parameter.groq`
- `#variable-special`: `@|\\^+` scoped as `variable.language.groq`
- `#wildcard`: `\\*` scoped as `variable.language.wildcard.groq`. This rule should be ordered carefully - it matches `*` that appears at expression-start positions. For now, match any `*` that is NOT preceded by a digit or letter (using a lookbehind: `(?<![\\w)])\\*(?![\\w])`). This is the wildcard heuristic. When `*` appears between operands it will fall through to the operator rule (added next task).

**Step 2: Create fixture**

`packages/groq-highlight-test/fixtures/edge-cases/variables.groq`:
```groq
$type
$userId
@
^
^^
*
```

**Step 3: Add test, run, update snapshot**

Run: `pnpm test -- --update`
Expected: variables, specials, and wildcard tokenize correctly.

**Step 4: Commit**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "feat: textmate grammar - variables, specials, wildcard"
```

---

### Task 8: Build TextMate grammar - operators

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`
- Create: `packages/groq-highlight-test/fixtures/operators/comparison.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/logical.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/arithmetic.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/keyword-ops.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/spread.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/range.groq`
- Create: `packages/groq-highlight-test/fixtures/operators/pair.groq`

**Step 1: Add grammar rules for all operator types**

Add these repository rules (order matters - longer matches first):

- `#operator-keyword`: `\\b(?:in|match)\\b` scoped as `keyword.operator.logical.in.groq` / `keyword.operator.match.groq` (use alternation with captures). Also `\\b(?:asc|desc)\\b` scoped as `keyword.operator.sort.groq`.
- `#operator`: A set of match patterns for:
  - `==|!=` scoped `keyword.operator.comparison.groq`
  - `<=|>=|<|>` scoped `keyword.operator.comparison.groq`
  - `&&` scoped `keyword.operator.logical.and.groq`
  - `\\|\\|` scoped `keyword.operator.logical.or.groq`
  - `!` scoped `keyword.operator.logical.not.groq`
  - `\\*\\*` scoped `keyword.operator.arithmetic.groq` (exponentiation, before single `*`)
  - `[+\\-*/%]` scoped `keyword.operator.arithmetic.groq` (but `*` only when preceded by word/paren - use `(?<=[\\w)\\]])\\*` to distinguish from wildcard)
  - `\\.\\.\\.` scoped `keyword.operator.spread.groq` (before `..`)
  - `\\.\\.` scoped `keyword.operator.range.groq`
  - `=>` scoped `keyword.operator.pair.groq`
  - `->` scoped `keyword.operator.dereference.groq`
- `#pipe`: `\\|(?!\\|)` scoped `keyword.operator.pipe.groq` (single pipe, not `||`)
- `#accessor`: `\\.(?!\\.)` scoped `punctuation.accessor.dot.groq` (dot not followed by another dot)

Important ordering: `...` before `..`, `->` and `=>` before single `-` and `=`, `**` before `*`, `||` before `|`.

**Step 2: Create operator fixtures**

Each fixture exercises one operator category with minimal GROQ context:

`operators/comparison.groq`:
```groq
*[score == 100]
*[score != 0]
*[age > 18]
*[age < 65]
*[age >= 21]
*[age <= 99]
```

`operators/logical.groq`:
```groq
*[a && b]
*[a || b]
*[!published]
```

`operators/arithmetic.groq`:
```groq
price + tax
price - discount
count * 2
total / items
index % 2
base ** exponent
```

`operators/keyword-ops.groq`:
```groq
*[_type in ["post", "article"]]
*[title match "hello*"]
```

`operators/spread.groq`:
```groq
{..., "extra": true}
```

`operators/range.groq`:
```groq
*[_type == "post"][0..5]
*[_type == "post"][0...10]
*[age in 18..65]
```

`operators/pair.groq`:
```groq
select(_type == "post" => "blog", "other")
```

**Step 3: Add tests for all operator fixtures, run, update snapshots**

Run: `pnpm test -- --update`
Expected: all operator types tokenize with correct scopes.

**Step 4: Commit**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "feat: textmate grammar - all operator types"
```

---

### Task 9: Build TextMate grammar - recursive brackets (filter, projection, group)

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`
- Create: `packages/groq-highlight-test/fixtures/basics/projection.groq`
- Create: `packages/groq-highlight-test/fixtures/basics/slice.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/nested-brackets.groq`

**Step 1: Add recursive bracket rules**

Add these begin/end repository rules that include `#expression` recursively:

- `#filter`: begin `\\[`, end `\\]`, beginCaptures/endCaptures scoped as `punctuation.definition.bracket.square.begin.groq` / `punctuation.definition.bracket.square.end.groq`, patterns include `#expression`
- `#projection`: begin `\\{`, end `\\}`, beginCaptures/endCaptures scoped as `punctuation.definition.bracket.curly.begin.groq` / `punctuation.definition.bracket.curly.end.groq`, patterns include `#expression`
- `#group`: begin `\\(`, end `\\)`, beginCaptures/endCaptures scoped as `punctuation.definition.bracket.round.begin.groq` / `punctuation.definition.bracket.round.end.groq`, patterns include `#expression`

These rules are the core of the recursive grammar. Because each includes `#expression`, and `#expression` includes them, nested brackets of arbitrary depth are handled.

**Step 2: Add punctuation rule**

- `#punctuation`: `[,:]` scoped as `punctuation.separator.groq`. Semicolons: `;` scoped as `punctuation.separator.semicolon.groq`.

**Step 3: Create fixtures**

`basics/projection.groq`:
```groq
*[_type == "post"]{title, body, "author": author->name}
```

`basics/slice.groq`:
```groq
*[_type == "post"][0...10]
```

`edge-cases/nested-brackets.groq`:
```groq
*[_type == "post" && references(*[_type == "author"]._id)]
*[_type == "category"]{name, "products": *[_type == "product" && references(^._id)]}
```

**Step 4: Add tests, run, update snapshots. Verify nested brackets tokenize correctly.**

Run: `pnpm test -- --update`
Expected: nested brackets resolve recursively. Inner `*[_type == "author"]` gets full highlighting inside the outer filter.

**Step 5: Commit**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "feat: textmate grammar - recursive bracket rules for filters, projections, groups"
```

---

### Task 10: Build TextMate grammar - functions (known list + namespaced)

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`
- Create: `packages/groq-highlight-test/fixtures/functions/global.groq`
- Create: `packages/groq-highlight-test/fixtures/functions/namespaced.groq`
- Create: `packages/groq-highlight-test/fixtures/functions/unknown-namespace.groq`

**Step 1: Add function-call rule**

`#function-call`: match known function names followed by `(`. Use a lookahead so the `(` is not consumed (it will be matched by `#group`):

```
\\b(coalesce|count|dateTime|defined|length|now|references|round|select|string|lower|upper|boost|after|before|identity|path|order|score)(?=\\s*\\()
```

Scoped as `support.function.groq`.

**Step 2: Add namespace-call rule**

`#namespace-call`: match `identifier::identifier(` pattern. Use captures:

```
\\b([a-zA-Z_][a-zA-Z0-9_]*)(::)([a-zA-Z_][a-zA-Z0-9_]*)(?=\\s*\\()
```

Captures:
- 1: `entity.name.namespace.groq`
- 2: `punctuation.separator.namespace.groq`
- 3: `support.function.groq`

This matches any `namespace::function(` pattern, handling both known and unknown namespaces.

**Step 3: Add identifier fallback rule**

`#identifier`: `\\b[a-zA-Z_][a-zA-Z0-9_]*\\b` scoped as `entity.name.tag.groq`. This is the last rule in `#expression` - anything that isn't matched by a more specific rule becomes a plain identifier.

**Step 4: Ensure rule ordering in #expression**

The order of includes in `#expression.patterns` matters. More specific rules must come before less specific ones:

1. `#comment`
2. `#string-double`
3. `#string-single`
4. `#number`
5. `#keyword`
6. `#namespace-call` (before #function-call and #identifier since it's more specific)
7. `#function-call` (before #identifier)
8. `#operator-keyword` (before #identifier since `in`/`match`/`asc`/`desc` are words)
9. `#variable`
10. `#variable-special`
11. `#wildcard`
12. `#operator` (multi-char operators)
13. `#pipe`
14. `#accessor`
15. `#filter`
16. `#projection`
17. `#group`
18. `#punctuation`
19. `#identifier` (fallback, last)

**Step 5: Create fixtures**

`functions/global.groq`:
```groq
count(*[_type == "post"])
defined(title)
coalesce(subtitle, "Untitled")
select(_type == "post" => title, name)
round(price, 2)
length(items)
lower(title)
upper(name)
now()
references(^._id)
boost(title match $q, 3)
```

`functions/namespaced.groq`:
```groq
math::sum(prices)
math::avg(scores)
math::min(values)
math::max(values)
string::split(tags, ",")
string::startsWith(title, "Draft")
array::join(items, ", ")
array::compact(list)
array::unique(ids)
pt::text(body)
geo::distance(location, $point)
dateTime::now()
delta::operation()
sanity::projectId()
```

`functions/unknown-namespace.groq`:
```groq
custom::doSomething(arg)
myPlugin::transform(data)
```

**Step 6: Add tests, run, update snapshots**

Run: `pnpm test -- --update`
Expected: known functions get `identifier.function`, namespaces get `identifier.namespace`, unknown `custom::doSomething()` still highlights as namespace + function. Plain identifiers like field names get `identifier`.

**Step 7: Commit**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "feat: textmate grammar - known functions and namespaced function calls"
```

---

### Task 11: Add remaining fixture categories

**Files:**
- Create: `packages/groq-highlight-test/fixtures/basics/dereference.groq`
- Create: `packages/groq-highlight-test/fixtures/basics/ordering.groq`
- Create: `packages/groq-highlight-test/fixtures/basics/scoring.groq`
- Create: `packages/groq-highlight-test/fixtures/basics/parent-ref.groq`
- Create: `packages/groq-highlight-test/fixtures/pipes/order.groq`
- Create: `packages/groq-highlight-test/fixtures/pipes/score.groq`
- Create: `packages/groq-highlight-test/fixtures/pipes/chained.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/string-escapes.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/keywords-as-fields.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/wildcard-vs-multiply.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/empty-array-traversal.groq`
- Create: `packages/groq-highlight-test/fixtures/edge-cases/negative-index.groq`

**Step 1: Create all remaining fixtures**

`basics/dereference.groq`:
```groq
*[_type == "post"]{"author": author->name}
author->
author->name->title
```

`basics/ordering.groq`:
```groq
*[_type == "post"] | order(publishedAt desc)
*[_type == "post"] | order(_type asc, publishedAt desc)
```

`basics/scoring.groq`:
```groq
*[_type == "post"] | score(boost(title match $q, 3), body match $q)
```

`basics/parent-ref.groq`:
```groq
*[_type == "post"]{..., "related": *[_type == "post" && references(^._id)]}
```

`pipes/order.groq`:
```groq
| order(title asc)
| order(publishedAt desc, _createdAt desc)
```

`pipes/score.groq`:
```groq
| score(title match $query, boost(body match $query, 0.5))
```

`pipes/chained.groq`:
```groq
*[_type == "post"] | order(publishedAt desc) [0...10] {title, slug}
```

`edge-cases/string-escapes.groq`:
```groq
"hello\nworld"
"tab\there"
"quote\"inside"
'single\'quote'
"unicode \u0041"
"emoji \u{1F600}"
"slash \/ backslash \\"
```

`edge-cases/keywords-as-fields.groq`:
```groq
*[_type == "post"]{match, in, desc, asc, true, false, null, order, score}
```

`edge-cases/wildcard-vs-multiply.groq`:
```groq
*
*[_type == "post"]
count * 2
2 * 3
*[count * price > 100]
```

`edge-cases/empty-array-traversal.groq`:
```groq
items[]
*[_type == "post"].tags[]
```

`edge-cases/negative-index.groq`:
```groq
items[-1]
*[_type == "post"] | order(publishedAt desc) [0]
```

**Step 2: Add test cases for all new fixtures**

Extend `test/textmate.test.ts` to load and snapshot each fixture. Use a pattern that auto-discovers fixtures to reduce boilerplate:

```typescript
import {readdirSync, statSync} from 'node:fs'

function getFixtures(dir: string): string[] {
  const entries: string[] = []
  for (const entry of readdirSync(join(fixturesDir, dir))) {
    const full = join(fixturesDir, dir, entry)
    if (statSync(full).isDirectory()) {
      for (const sub of readdirSync(full)) {
        if (sub.endsWith('.groq')) entries.push(`${dir}/${entry}/${sub}`)
      }
    } else if (entry.endsWith('.groq')) {
      entries.push(`${dir}/${entry}`)
    }
  }
  return entries
}

// Replace individual tests with auto-discovery
describe('TextMate tokenizer', () => {
  const categories = ['basics', 'functions', 'operators', 'pipes', 'edge-cases']

  for (const category of categories) {
    describe(category, () => {
      const fixtures = getFixtures(category)
      for (const fixture of fixtures) {
        it(`tokenizes ${fixture}`, async () => {
          const source = await loadFixture(fixture)
          const tokens = await tokenizeTextmate(source)
          expect(tokens).toMatchSnapshot()
        })
      }
    })
  }
})
```

**Step 3: Run all tests, update snapshots**

Run: `pnpm test -- --update`
Expected: all fixtures tokenize and snapshot. Review snapshots carefully for correctness.

**Step 4: Commit**

```bash
git add packages/groq-highlight-test/
git commit -m "test: complete fixture set across all categories"
```

---

### Task 12: Add real-world fixtures

**Files:**
- Create: `packages/groq-highlight-test/fixtures/real-world/blog-query.groq`
- Create: `packages/groq-highlight-test/fixtures/real-world/e-commerce.groq`
- Create: `packages/groq-highlight-test/fixtures/real-world/content-lake.groq`

**Step 1: Create realistic multi-line queries**

`real-world/blog-query.groq`:
```groq
*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...10] {
  title,
  slug,
  publishedAt,
  "excerpt": pt::text(body[0..1]),
  "author": author-> {
    name,
    "avatar": image.asset->url
  },
  "categories": categories[]-> {
    title,
    slug
  }
}
```

`real-world/e-commerce.groq`:
```groq
*[_type == "product" && defined(price) && count(variants) > 0] {
  title,
  "slug": slug.current,
  price,
  "salePrice": select(
    onSale == true => round(price * 0.8, 2),
    price
  ),
  "inStock": count(variants[stock > 0]) > 0,
  "categories": categories[]-> {
    title,
    "productCount": count(*[_type == "product" && references(^._id)])
  },
  "relatedProducts": *[
    _type == "product" &&
    _id != ^._id &&
    count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0
  ] [0...4] {
    title,
    price,
    "thumbnail": images[0].asset->url
  }
}
```

`real-world/content-lake.groq`:
```groq
{
  "posts": *[_type == "post"] | order(publishedAt desc) [0...5] {
    title,
    "author": author->name
  },
  "authors": *[_type == "author"] {
    name,
    "postCount": count(*[_type == "post" && references(^._id)])
  },
  "tags": array::unique(*[_type == "post"].tags[])
}
```

**Step 2: Run tests, update snapshots. Review real-world snapshots carefully - these are the most important quality check.**

Run: `pnpm test -- --update`
Expected: multi-line queries tokenize correctly, nested projections resolve, all functions and operators highlight.

**Step 3: Commit**

```bash
git add packages/groq-highlight-test/
git commit -m "test: real-world GROQ query fixtures"
```

---

### Task 13: Grammar refinement pass

This is an iteration task. After reviewing all snapshots from tasks 11-12, fix any issues.

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`
- Modify: `packages/groq-highlight-test/src/map-textmate.ts` (if scope names need adjusting)

**Step 1: Review all snapshots for correctness**

Read through the committed snapshots and check for:
- Keywords (`true`, `false`, `null`) that are being matched as identifiers
- `in`, `match` being matched as identifiers when used as operators
- `asc`, `desc` being matched as identifiers vs operator keywords
- `*` incorrectly classified (wildcard vs operator)
- `...` and `..` in wrong contexts
- Namespaced function calls with wrong token splits
- Missing tokens (things falling through with no canonical mapping)
- `keywords-as-fields.groq` - when `match`, `in`, etc. appear as field names in projections, they should ideally be identifiers, not operator keywords. This is a known TextMate limitation since it's context-free. Document it.

**Step 2: Fix any grammar issues found**

Iterate: fix grammar -> run tests -> review snapshots.

**Step 3: Update snapshots after fixes**

Run: `pnpm test -- --update`

**Step 4: Commit**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "fix: textmate grammar refinements from snapshot review"
```

---

### Task 14: Wildcard heuristic refinement

The `*` wildcard vs multiplication operator is the hardest TextMate disambiguation. This task specifically tests and refines the heuristic.

**Files:**
- Modify: `packages/textmate-groq/syntaxes/groq.tmLanguage.json`

**Step 1: Review the `wildcard-vs-multiply.groq` snapshot**

Check these cases:
- `*` alone on a line -> wildcard
- `*[_type == "post"]` -> wildcard (followed by `[`)
- `count * 2` -> operator (between operands)
- `2 * 3` -> operator
- `*[count * price > 100]` -> outer `*` is wildcard, inner `*` is operator

**Step 2: Refine the wildcard regex**

The heuristic: `*` is a wildcard when it appears at a position where an expression could start. In TextMate terms, this means `*` NOT preceded by an identifier character, closing bracket, or digit.

Negative lookbehind: `(?<![\\w)\\]\\}])\\*`

And the multiplication `*`: `(?<=[\\w)\\]\\}])\\*` scoped as `keyword.operator.arithmetic.groq`

The wildcard rule must come BEFORE the general operator rule.

**Step 3: Run tests, verify the wildcard fixture snapshot is correct**

Run: `pnpm test -- --update`

**Step 4: Commit (if changes were needed)**

```bash
git add packages/textmate-groq/ packages/groq-highlight-test/
git commit -m "fix: refine wildcard vs multiplication heuristic"
```

---

### Task 15: Final snapshot review and phase 1 completion

**Files:**
- Possibly modify: any file from earlier tasks

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: all tests pass.

**Step 2: Review every snapshot file**

Read through all snapshot files in `packages/groq-highlight-test/test/__snapshots__/`. Check that:
- Every token in every fixture has a reasonable canonical type
- No obvious mis-classifications
- Real-world queries look good end-to-end

**Step 3: Quick Shiki smoke test**

To verify the grammar works with Shiki (the primary consumer besides VS Code), create a quick one-off test:

```typescript
// In test/shiki-smoke.test.ts
import {describe, it, expect} from 'vitest'
import {createHighlighter} from 'shiki'
import {readFile} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

describe('Shiki smoke test', () => {
  it('highlights GROQ with the textmate grammar', async () => {
    const grammarPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '..', '..', 'textmate-groq', 'syntaxes', 'groq.tmLanguage.json',
    )
    const grammar = JSON.parse(await readFile(grammarPath, 'utf-8'))

    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [{...grammar, name: 'groq'}],
    })

    const html = highlighter.codeToHtml('*[_type == "post"]{title}', {
      lang: 'groq',
      theme: 'github-dark',
    })

    expect(html).toContain('<span')
    expect(html).toContain('post')
    highlighter.dispose()
  })
})
```

Add `shiki` as a dev dependency to `groq-highlight-test`.

**Step 4: Run full suite including Shiki smoke test**

Run: `pnpm test`
Expected: all pass, including the Shiki smoke test.

**Step 5: Commit**

```bash
git add packages/groq-highlight-test/
git commit -m "test: shiki smoke test and final snapshot review"
```

Phase 1 is complete at this point - we have a working TextMate grammar with comprehensive test coverage.
