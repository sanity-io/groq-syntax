# @sanity/highlightjs-groq

[highlight.js](https://highlightjs.org/) language definition for [GROQ](https://www.sanity.io/docs/groq) syntax highlighting.

## Install

```bash
npm install @sanity/highlightjs-groq
```

## Usage with react-lowlight

```tsx
import Lowlight from 'react-lowlight'
import groq from '@sanity/highlightjs-groq'

// Register the language (do this once, e.g. in your app entry)
Lowlight.registerLanguage('groq', groq)

// In your component:
function CodeBlock({query}: {query: string}) {
  return <Lowlight language="groq" value={query} markers={[]} />
}
```

## Usage with highlight.js

```js
import hljs from 'highlight.js/lib/core'
import groq from '@sanity/highlightjs-groq'

hljs.registerLanguage('groq', groq)

const result = hljs.highlight('*[_type == "post"]{title}', {language: 'groq'})
console.log(result.value)
```

## Usage with lowlight

```js
import {createLowlight} from 'lowlight'
import groq from '@sanity/highlightjs-groq'

const lowlight = createLowlight()
lowlight.register('groq', groq)

const tree = lowlight.highlight('groq', '*[_type == "post"]')
```

## License

MIT
