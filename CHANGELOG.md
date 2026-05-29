# Changelog

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
