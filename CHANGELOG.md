# Changelog

## 

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
