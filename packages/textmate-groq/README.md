# @sanity/textmate-groq

TextMate grammar for [GROQ](https://www.sanity.io/docs/groq) syntax highlighting.

Used by VS Code extensions, [Shiki](https://shiki.style/) (static syntax highlighting for documentation), Sublime Text, and [GitHub/Linguist](https://github.com/github-linguist/linguist).

## Install

```bash
npm install @sanity/textmate-groq
```

## Usage with Shiki

```ts
import {createHighlighterCore} from 'shiki/core'
import {createJavaScriptRegExpEngine} from 'shiki/engine/javascript'
import groqGrammar from '@sanity/textmate-groq'

const highlighter = await createHighlighterCore({
  themes: [import('shiki/themes/github-dark.mjs')],
  langs: [{...groqGrammar, name: 'groq'}],
  engine: createJavaScriptRegExpEngine(),
})

const html = highlighter.codeToHtml('*[_type == "post"]{title}', {
  lang: 'groq',
  theme: 'github-dark',
})
```

## JavaScript/TypeScript injection

An injection grammar for highlighting GROQ inside JS/TS template literals is included:

```ts
// All of these patterns are recognized:
const query1 = groq`*[_type == "post"]`
const query2 = /* groq */ `*[_type == "post"]`
const query3 = defineQuery(`*[_type == "post"]`)
```

The injection grammar is at `injections/javascript.tmLanguage.json` and can be bundled in a VS Code extension alongside the main grammar.

## Exports

- `@sanity/textmate-groq` - the main grammar (`syntaxes/groq.tmLanguage.json`)
- `@sanity/textmate-groq/injections/javascript` - JS/TS injection grammar

## License

MIT
