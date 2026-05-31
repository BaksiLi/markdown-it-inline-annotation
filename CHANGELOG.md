# Changelog

## 0.3.0

- Add a reusable annotation model API for editor adapters:
  `findInlineAnnotationModel`, `findInlineAnnotationModelBeforeMarkdown`, and
  `renderInlineAnnotationModelToHtml`.
- Expose source ranges for the whole expression, base, and positioned slots, so
  hosts such as Obsidian Live Preview can build decorations without reparsing
  generated HTML.
- Surface extra pipe levels as visible overflow text instead of silently
  dropping them (`[a]^^(x|y|z)` renders `x`, `y`, and visible `|z`).
- Classify shared fixtures as `semantic`, `rendering-policy`, or `host-skip`,
  and keep semantic capacity cases independent from space-alignment policy.
- Add fixture schema metadata, non-normative diagnostic IDs, and explicit
  checklist coverage for extra pipe overflow (`[a]^^(x|y|z)`).
- Keep the existing HTML renderer and markdown-it plugin backed by the same
  model path.

## 0.2.1

- Add `spaceAlignment` rendering policy: `"always"` keeps the existing
  per-character behavior, `"off"` always renders group ruby, and `"auto"` keeps
  plain ASCII glosses grouped while preserving phonetic per-character readings
  such as `[取り返す]^^(と り かえ す)`.
- Keep the older `enableSpaceAlignment` boolean as a compatibility alias.

## 0.2.0

Implements Inline Annotation **v2** (see `SPEC.md`; rationale and migration in
`docs/v2-rationale.md`, archived v1 in `docs/SPEC-v1.md`). v2 is almost a superset
of v1.

- **Symmetric line marks.** `.-`, `.~`, `.=` now render as an overline in the over
  slot (`[title]^^(.-)`, classes `ia-overline` / `ia-overline-wavy` / `ia-overline-double`)
  and an underline in the under slot, instead of being literal ruby text over the
  base. The only breaking change: escape the leading dot (`[x]^^(\.-)`) for the old
  literal-text behavior. Over + under line marks combine into a single
  `text-decoration-line` declaration so both lines render.
- **Pipe overflow renders as text.** A chained operator after a pipe-saturated
  annotation (`[a]^^(x|y)^_(z)`) is left in the stream and rendered as literal text
  instead of being silently dropped.
- **Alignment is a rendering enhancement.** Documented as non-semantic; the
  conformance corpus asserts semantics, not per-character DOM, so hosts may render
  group or per-character ruby and stay conformant.
- Fix ruby-plus-line mixed rendering placing the ruby on the wrong side
  (`[語]^^(よみ|.-)` now correctly renders ruby above + underline below).
- Internal: `renderAnnotation` resolves an expression into positioned slots and
  classifies each (`ruby` / `bouten` / `line`) before rendering, replacing the
  branchy decoration handling.

## 0.1.2

- Add `enableSpaceAlignment` to let integrations disable automatic per-character ruby alignment for space-separated annotations.
- Document that space alignment is a rendering policy, not a mandatory parse rule.
- Update implementation status for the VS Code preview adapter.

## 0.1.1

- Add a shared host-neutral conformance fixture corpus at `fixtures/html-render.json` and export it as `markdown-it-inline-annotation/fixtures/html-render.json`.
- Add the `markdown-it-inline-annotation/core` subpath export for integrations that only need the parser/HTML renderer.
- Add a minimal generated playground at `examples/playground.html`, backed by the core renderer and shared fixtures.
- Add `npm run check:release` to run tests, regenerate examples, verify package self-reference exports, check whitespace, and dry-run package contents before publishing.
- Harden playground fixture embedding so safety test data such as `</script>` cannot break the generated module script.
- Fix nested double ruby rendering: the over slot now sets `ruby-position:over` explicitly, so a nested over-ruby inside an under-ruby no longer inherits `under` and drops both annotations below the base (e.g. `[[護]^^(まも)れ]^_(プロテゴ)`, `[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)`).
- Add a canonical reference stylesheet at `markdown-it-inline-annotation/styles.css` for class-mode (`inlineStyles: false`) rendering.
- `examples/before-after.html` is now generated from live parser output via `npm run build:examples` instead of being hand-authored.

## 0.1.0

Initial public preview of `markdown-it-inline-annotation`.

- Adds bracketed and abbreviated Inline Annotation syntax.
- Supports over/under ruby, two-slot pipe notation, mixed chaining, nested spans, per-character alignment, and auto-hidden matching characters.
- Supports bouten (`..`) and underline modifiers (`.-`, `.~`, `.=`), including mixed ruby plus decoration cases.
- Adds escaped pipe and escaped close-paren handling.
- Provides CommonJS, ESM, and TypeScript declaration outputs.
- Documents the shared Inline Annotation spec and Logseq compatibility baseline.
