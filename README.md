# markdown-it-inline-annotation

`markdown-it` support for **Inline Annotation**.

Inline Annotation is a Markdown extension for ruby/furigana, bouten emphasis dots, underline marks, and two-slot text annotations:

```markdown
[漢字]^^(かんじ)
[base]^^(over)^_(under)
[重要]^^(..)^_(.~)
```

It implements the syntax proposed in [Ruby (Furigana) Syntax in Markdown](https://blog.baksili.codes/markdown-ruby), with the older Logseq plugin treated as the reference implementation for the first compatibility target.

- **[SPEC.md](./SPEC.md)** — the normative grammar, class contract, and compatibility notes.
- **[examples/playground.html](./examples/playground.html)** — a minimal core renderer playground.
- **[examples/before-after.html](./examples/before-after.html)** — a small visual before/after page.

## Ports and Implementations

| Project | Status | Notes |
| --- | --- | --- |
| [logseq-furigana-ruby](https://github.com/BaksiLi/logseq-furigana-ruby) | Reference implementation | Mature Logseq plugin; includes macros and conversion commands for Logseq-specific parser conflicts. |
| `markdown-it-inline-annotation` | Current package | Portable markdown-it adapter backed by the shared Inline Annotation core. |
| [vscode-inline-annotation](https://github.com/BaksiLi/vscode-inline-annotation) | Published | Preview-only adapter on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=baksili.vscode-inline-annotation); uses VS Code's `extendMarkdownIt` hook with no extra scripts or external resources. |
| Obsidian plugin | Planned | Expected to start with a reading-view postprocessor using the same core. |
| remark/unified adapter | Planned later | Should use the spec and shared fixtures once the syntax is stable across markdown-it and Obsidian. |

## Install

```bash
npm install markdown-it-inline-annotation
```

## Usage

```js
const MarkdownIt = require("markdown-it");
const { inlineAnnotationPlugin } = require("markdown-it-inline-annotation");

const md = new MarkdownIt().use(inlineAnnotationPlugin);
md.render("[漢字]^^(かんじ)");
```

For integrations that only need the parser/HTML renderer and not markdown-it:

```js
const { renderInlineAnnotationsToHtml } = require("markdown-it-inline-annotation/core");

renderInlineAnnotationsToHtml("[漢字]^^(かんじ)");
```

## Supported Syntax

| Input | Meaning |
| --- | --- |
| `[base]^^(ruby)` | annotation above |
| `[base]^_(ruby)` | annotation below |
| `base^^(ruby)` | abbreviated single-token base |
| `[base]^^(over\|under)` | two-slot annotation |
| `[base]^^(over)^_(under)` | chained two-slot annotation |
| `[[護]^^(まも)れ]^_(プロテゴ)` | nested / partially overlapping annotation |
| `[漢字]^^(..)` | bouten/emphasis dots above |
| `[base]^_(.-)` | solid underline |
| `[base]^_(.~)` | wavy underline |
| `[base]^_(.=)` | double underline |
| `[重要語句]^^(じゅうようごく\|.-)` | ruby plus underline |

Per-character annotation is enabled when space-separated annotation parts match the number of base characters:

```markdown
[春夏秋冬]^^(はる なつ あき ふゆ)
```

## Options

```js
md.use(inlineAnnotationPlugin, {
  classPrefix: "ia",
  enableAbbreviated: true,
  enableSpaceAlignment: true,
  inlineStyles: true,
  fallbackParens: "()",
});
```

Set `enableSpaceAlignment: false` if multi-word glosses such as
`[真值]^^(Truth Value)` should always render as group ruby instead of being
auto-aligned by spaces. The default keeps per-character ruby enabled.

## Styling

By default (`inlineStyles: true`) the renderer emits inline styles, so output is self-contained and needs no stylesheet.

If you set `inlineStyles: false` and render with semantic classes only, ship the canonical stylesheet:

```js
import "markdown-it-inline-annotation/styles.css";
```

The stylesheet declares `ruby-position` explicitly on **both** the over and under slots. This is required because `ruby-position` is a CSS *inherited* property: a nested over-ruby placed inside an under-ruby (for example `[[護]^^(まも)れ]^_(プロテゴ)` or per-character double ruby) would otherwise inherit `under` and render both annotations below the base. The default inline-style output sets the same explicit positions for the same reason.

## Verify Locally

```bash
npm test
node -e "const MarkdownIt = require('markdown-it'); const { inlineAnnotationPlugin } = require('./dist/index.js'); console.log(new MarkdownIt().use(inlineAnnotationPlugin).render('[漢字]^^(かんじ)'))"
```

`npm test` builds the package and runs the shared host-neutral conformance corpus
from [`fixtures/html-render.json`](./fixtures/html-render.json), plus
markdown-it-specific integration cases. Host adapters should run the shared
corpus first, then add adapter or workflow tests separately.

Run `npm run build:examples` to regenerate the static examples from the current
parser, stylesheet, and shared fixture corpus.

Run `npm run check:release` before publishing. It runs tests, regenerates
examples, verifies package subpath exports, checks whitespace, and performs an
`npm pack --dry-run` using a local temp cache.

## Compatibility Notes

This package uses a `markdown-it` inline rule instead of replacing rendered text, so it can handle escaped pipes and multiple annotations in one paragraph. It deliberately stops before Markdown constructs such as code spans, links, emphasis, raw HTML, and entities so markdown-it can parse them normally.

The Logseq plugin remains the reference for the current feature set, but Logseq has host-parser limitations around multiple `^^()` forms in one bullet. Those limitations are not part of the Inline Annotation spec.

Annotation slot contents are plain text in v1. Complex Markdown inside the annotated base should use explicit brackets or be handled in a future AST-level adapter.

## Design Intent

Inline Annotation is meant to be a small cross-editor syntax, not a Logseq-only workaround. The stable surface is the source syntax, the two-slot model, escaping rules, rendering modifiers, and compatibility fixtures. HTML output is the first renderer, not the entire standard.

## License

MIT
