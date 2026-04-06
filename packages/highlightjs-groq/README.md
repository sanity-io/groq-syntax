# @sanity/highlightjs-groq

[highlight.js](https://highlightjs.org/) language definition for [GROQ](https://www.sanity.io/docs/groq) syntax highlighting.

## Install

```bash
npm install @sanity/highlightjs-groq
```

## Usage with highlight.js

```js
import hljs from 'highlight.js/lib/core'
import groq from '@sanity/highlightjs-groq'

hljs.registerLanguage('groq', groq)
const result = hljs.highlight('*[_type == "post"]{title}', {language: 'groq'})
console.log(result.value)
```

## Usage with lowlight / react-lowlight

```js
import Lowlight from 'react-lowlight'
import groq from '@sanity/highlightjs-groq'

Lowlight.registerLanguage('groq', groq)

// In your component:
<Lowlight language="groq" value={query} />
```

## License

MIT
