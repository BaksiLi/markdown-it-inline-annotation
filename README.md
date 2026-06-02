# markdown-it-inline-annotation

`markdown-it` support for **Inline Annotation**.

Inline Annotation is a Markdown extension for ruby/furigana, bouten emphasis dots, over/under line marks, and two-slot text annotations:

```markdown
[漢字]^^(かんじ)
[base]^^(over)^_(under)
[重要]^^(..)^_(.~)
```

It implements the syntax proposed in [Ruby (Furigana) Syntax in Markdown](https://blog.baksili.codes/markdown-ruby), with the older Logseq plugin treated as the reference implementation for the first compatibility target.

- **[SPEC.md](./SPEC.md)** — the v2 syntax, class contract, normative requirements, and non-normative guidance.
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** — implementation roadmap and adapter boundary decisions.
- **[docs/DIAGNOSTICS.md](./docs/DIAGNOSTICS.md)** — reserved lint/editor diagnostic ids for future tooling.
- **[docs/v2-rationale.md](./docs/v2-rationale.md)** — why v2 differs from v1, migration notes, and core layering.
- **[docs/SPEC-v1.md](./docs/SPEC-v1.md)** — the archived v1 syntax (implemented by `0.1.x`).
- **[examples/playground.html](./examples/playground.html)** — a minimal core renderer playground.
- **[examples/before-after.html](./examples/before-after.html)** — a small visual before/after page.

## Ports and Implementations

| Project | Status | Notes |
| --- | --- | --- |
| `markdown-it-inline-annotation` | Current package | Portable markdown-it adapter backed by the shared Inline Annotation core. |
| [logseq-furigana-ruby](https://github.com/BaksiLi/logseq-furigana-ruby) | Published | Mature Logseq plugin; includes macros and conversion commands for Logseq-specific parser conflicts. |
| [vscode-inline-annotation](https://marketplace.visualstudio.com/items?itemName=baksili.vscode-inline-annotation) | Published | Preview-only adapter; uses VS Code's `extendMarkdownIt` hook with no extra scripts or external resources. |
| [obsidian-inline-annotation](https://github.com/BaksiLi/obsidian-inline-annotation) | Prototype | Reading-view postprocessor plus early Live Preview replacement widgets using the shared core model. |
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

Editor integrations can use the model API when source ranges matter:

```js
const {
  findInlineAnnotationModel,
  renderInlineAnnotationModelToHtml,
} = require("markdown-it-inline-annotation/core");

const model = findInlineAnnotationModel("before [漢字]^^(かんじ)");
if (model) {
  console.log(model.base.raw); // "漢字"
  console.log(model.slots[0].position); // "over"
  console.log(renderInlineAnnotationModelToHtml(model));
}
```

The model keeps absolute ranges for the expression, base, and positioned slots.
That lets Live Preview adapters build editor decorations from the semantic
structure instead of reparsing generated HTML.

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
| `[base]^_(.-)` | solid underline (under slot) |
| `[base]^_(.~)` | wavy underline |
| `[base]^_(.=)` | double underline |
| `[title]^^(.-)` | overline (over slot) |
| `[重要語句]^^(じゅうようごく\|.-)` | ruby above plus underline below |

With the default renderer policy, per-character annotation is enabled when
space-separated annotation parts match the number of base characters:

```markdown
[春夏秋冬]^^(はる なつ あき ふゆ)
```

## Options

```js
md.use(inlineAnnotationPlugin, {
  classPrefix: "ia",
  enableAbbreviated: true,
  spaceAlignment: "always",
  inlineStyles: true,
  fallbackParens: "()",
});
```

Set `spaceAlignment: "off"` if multi-word glosses such as `[真值]^^(Truth Value)`
should always render as group ruby instead of being auto-aligned by spaces. Use
`spaceAlignment: "auto"` for conservative per-character layout: phonetic
readings such as `[取り返す]^^(と り かえ す)` align, while plain ASCII glosses
stay grouped. The default, `"always"`, preserves the original behavior.

The older `enableSpaceAlignment` boolean is still supported for compatibility.

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

`npm test` builds the package and runs the shared conformance corpus from
[`fixtures/html-render.json`](./fixtures/html-render.json), plus
markdown-it-specific integration cases. The corpus labels assertions as
`semantic`, `rendering-policy`, or `host-skip` so host adapters can preserve the
portable contract while documenting renderer-policy choices or host limitations.
Host adapters should run the shared corpus first, then add adapter or workflow
tests separately.

Run `npm run build:examples` to regenerate the static examples from the current
parser, stylesheet, and shared fixture corpus.

Run `npm run check:release` before publishing. It runs tests, regenerates
examples, verifies package subpath exports, checks whitespace, and performs an
`npm pack --dry-run` using a local temp cache.

## Compatibility Notes

This package uses a `markdown-it` inline rule instead of replacing rendered text, so it can handle escaped pipes and multiple annotations in one paragraph. It deliberately stops before host-owned Markdown constructs such as code spans, links, raw HTML, and entities so markdown-it can parse them normally.

The Logseq plugin remains the reference for the current feature set, but Logseq has host-parser limitations around multiple `^^()` forms in one bullet. Those limitations are not part of the Inline Annotation spec.

Markdown syntax is not part of Inline Annotation semantics. The core decides only the annotation model: base range, over/under slots, pipes/chains, marks, escapes, and overflow. Annotation slot contents are plain text. Complex Markdown inside the annotated base should use explicit brackets when plain text is enough, or be handled in a future AST-level adapter as a rendering policy that preserves the same annotation model.

## Design Intent

Inline Annotation is meant to be a small cross-editor syntax, not a Logseq-only workaround. The stable surface is the source syntax, the two-slot model, escaping rules, rendering modifiers, and compatibility fixtures. HTML output is the first renderer, not the entire standard.

## License

MIT
