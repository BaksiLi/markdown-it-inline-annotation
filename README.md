# markdown-it-inline-annotation

Reference parser, HTML renderer, and `markdown-it` adapter for **Inline
Annotation**: visible ruby/furigana, over/under glosses, bouten, overlines, and
underlines in Markdown.

```markdown
[漢字]^^(かんじ)
[base]^^(over)^_(under)
[重要]^^(..)^_(.~)
```

The syntax began with [Ruby (Furigana) Syntax in
Markdown](https://blog.baksili.codes/markdown-ruby) and is now shared across
markdown-it, Obsidian, VS Code, and Logseq.

## Install

For the markdown-it plugin, install both the host parser and this adapter:

```bash
npm install markdown-it markdown-it-inline-annotation
```

```js
const MarkdownIt = require("markdown-it");
const { inlineAnnotationPlugin } = require("markdown-it-inline-annotation");

const md = new MarkdownIt().use(inlineAnnotationPlugin);
md.render("[漢字]^^(かんじ)");
```

For the dependency-free parser/model and HTML renderer, install only this
package and import the `/core` entry:

```bash
npm install markdown-it-inline-annotation
```

```js
const {
  findInlineAnnotationModels,
  renderInlineAnnotationsToHtml,
} = require("markdown-it-inline-annotation/core");

const models = findInlineAnnotationModels("[漢字]^^(かんじ)");
const html = renderInlineAnnotationsToHtml("[漢字]^^(かんじ)");
```

`markdown-it` is an optional peer dependency. Core-only consumers do not
install it; markdown-it integrations continue to provide their own compatible
instance.

## Syntax

| Input | Meaning |
| --- | --- |
| `[base]^^(ruby)` | annotation above |
| `[base]^_(gloss)` | annotation below |
| `base^^(ruby)` | abbreviated single-token base |
| `[base]^^(over\|under)` | two-slot annotation |
| `[base]^^(over)^_(under)` | chained two-slot annotation |
| `[[護]^^(まも)れ]^_(プロテゴ)` | nested or overlapping annotation |
| `[漢字]^^(..)` | bouten above |
| `[base]^_(.-)` | solid underline |
| `[base]^_(.~)` | wavy underline |
| `[base]^_(.=)` | double underline |
| `[title]^^(.-)` | solid overline |

Space-separated readings can align per character:

```markdown
[春夏秋冬]^^(はる なつ あき ふゆ)
```

See [SPEC.md](./SPEC.md) for the complete grammar, escapes, overflow behavior,
class contract, and host-boundary requirements.

## Options

```js
md.use(inlineAnnotationPlugin, {
  classPrefix: "ia",
  enableAbbreviated: true,
  spaceAlignment: "always", // "always", "auto", or "off"
  inlineStyles: true,
  fallbackParens: "()",
});
```

`spaceAlignment: "auto"` aligns phonetic readings conservatively while keeping
plain multi-word glosses grouped. `enableSpaceAlignment` remains available as a
compatibility alias.

With `inlineStyles: false`, include the canonical stylesheet:

```js
import "markdown-it-inline-annotation/styles.css";
```

## Host Integration

The core parses contiguous source strings. DOM and rich-text adapters may join
only semantically transparent runs; they must preserve expressions that cross
formatting, links, code, highlights, or other semantic boundaries. The shared
policy corpus is exported as:

```js
require("markdown-it-inline-annotation/fixtures/segment-boundaries.json");
```

The HTML conformance corpus is available at
`markdown-it-inline-annotation/fixtures/html-render.json`. Adapter-specific
workarounds remain outside the core.

## Implementations

| Project | Integration |
| --- | --- |
| [`markdown-it-inline-annotation`](https://www.npmjs.com/package/markdown-it-inline-annotation) | parser/model, HTML renderer, markdown-it plugin |
| [Inline Ruby Annotation for Obsidian](https://community.obsidian.md/plugins/inline-annotation) | Reading view and Live Preview |
| [Inline Annotation for VS Code](https://marketplace.visualstudio.com/items?itemName=baksili.vscode-inline-annotation) | built-in Markdown preview |
| [`logseq-furigana-ruby`](https://github.com/BaksiLi/logseq-furigana-ruby) | Logseq renderer, macros, and conversion commands |
| remark/unified | planned when an AST pipeline needs it |

## Development

```bash
npm test
npm run build:examples
npm run check:release
```

`check:release` runs tests, regenerates examples, checks exports and whitespace,
packs the tarball, and verifies that `/core` installs and runs without
`markdown-it`.

Project documents:

- [SPEC.md](./SPEC.md): normative syntax and compatibility contract.
- [docs/ROADMAP.md](./docs/ROADMAP.md): architecture and release direction.
- [CHANGELOG.md](./CHANGELOG.md): package history.
- [examples/playground.html](./examples/playground.html): generated core demo.
- [examples/before-after.html](./examples/before-after.html): visual examples.

## License

MIT
