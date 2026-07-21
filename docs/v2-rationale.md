# Inline Annotation v2 — Rationale & Migration

The normative v2 syntax is in [`../SPEC.md`](../SPEC.md). This document explains
*why* v2 differs from v1, how to migrate, and the core layering it assumes. v1
is archived at [`SPEC-v1.md`](./SPEC-v1.md).

## Why v2

v1 was internally consistent and had a shared conformance corpus, but three
points were not clean. v2 changes only these; it adds no new author-facing
sigil, so it is *simpler* than v1, not larger.

### 1. Decoration marks flipped meaning by slot

v1: `.-` meant "solid underline" in the under slot but rendered as the literal
ruby text ".-" in the over slot (`SPEC-v1.md`, "Rendering Modifiers"). Same
token, different classification by position. This broke the otherwise clean rule
"the slot says *where*, the value says *what*."

v2: marks are symmetric. `^^(.-)` is an overline, `^_(.-)` an underline.
`overline` / `text-decoration-line: overline` (and its `wavy`/`double` styles)
are real CSS, so over-slot line marks render. A slot value is a mark **iff** its
whole content matches a glyph; literal text uses `\` (`^^(\.-)`).

### 2. Alignment was ambiguous and host-dependent

v1: space-separated annotations might split into per-character ruby when the
part count matched the base character count, gated by the host option
`enableSpaceAlignment`. The *same source* could produce *structurally different
DOM* across hosts, with no defined structural contract.

v2: alignment is reclassified as a **non-semantic rendering enhancement**.
Per-character vs. group ruby does not change meaning ("annotation X applies to
base Y"); it is presentation, like font choice. So the conformance contract is
defined at the semantic level (base↔annotation association + `ia-*` classes) and
does **not** assert per-character DOM. Both renderings are conformant, and the
option becomes a presentation preference. A renderer may choose an `"always"`
policy for compatibility, an `"off"` policy for prose-heavy notes, or a
conservative `"auto"` policy that aligns phonetic readings such as
`[取り返す]^^(と り かえ す)` while leaving plain ASCII glosses such as
`[真值]^^(Truth Value)` grouped. This dissolves "same source, different meaning"
because alignment was never meaning.

**Rejected alternative:** a `^^(=Truth Value)` opt-out to force a grouped gloss.
It patches an already-implicit behavior (space being load-bearing) and adds a
sigil a first-time reader must learn. Treating alignment as pure rendering
latitude needs nothing new.

### 3. Pipe saturation silently swallowed input

v1: `[a]^^(x|y)^_(z)` consumed `z` with no effect — invisible data loss.

v2: over-capacity input **renders through as literal text** so the author sees
it; tooling (lint) may warn. Same-operator chaining `[a]^^(x)^^(y)` keeps v1
behavior (not merged).

## Core layering (implementation note)

v2 assumes the core is split so alignment never leaks into parsing:

```
parse:   source -> AnnotationModel { base, slots: [{ position, kind, value }] }
                   (kind = "ruby" | "mark"; no alignment, no layout)
render:  AnnotationModel + options -> HTML
           - align(base, annotation) is an isolated, deterministic function
           - applied only when kind === "ruby" and the renderer's alignment
             policy allows it
           - marks render via the symmetric glyph table
```

Benefits: the branchy `renderAnnotation` in `src/core.ts` collapses (mark vs
ruby is decided once by the glyph table; alignment is one isolated pass); source
ranges and the neutral model become reusable by the future
`@inline-annotation/core` and remark/mdast adapters without copying layout.

## Migration

- **Backward compatible** for all ruby, bouten, under-slot lines, pipes,
  chaining, nesting, and escaping.
- **Only breaking case:** `^^(.-)`, `^^(.~)`, `^^(.=)` previously rendered as
  literal over-slot ruby text; v2 renders them as over-side lines. Authors who
  want the literal text escape it (`^^(\.-)`). Expected to affect ~no real
  content.
- Pipe-saturated chains that previously vanished now render the overflow as
  text.

## Class contract additions

Over-slot line marks add an over-side line contract; `ia-underline*` is retained
unchanged:

| Construct | Classes |
| --- | --- |
| Line (under) | `ia-underline`, plus `ia-underline-wavy` / `ia-underline-double` |
| Line (over) | `ia-overline`, plus `ia-overline-wavy` / `ia-overline-double` |

## Resolved decisions

- `ia-overline*` is the canonical over-side class family.
- Pipe overflow stays visible in rendered text and may also produce a diagnostic.
- Since `0.3.2`, mixed overline/underline styles use nested spans because
  CSS exposes only one `text-decoration-style` per element.

## Host compatibility

v2 adds no new syntax, so the host-conflict surface is identical to v0.x: Logseq
still pre-parses `^^x^^` / `_x_` (handled at the adapter via macro/HTML
conversion); Obsidian and VS Code still rely on the mandatory `(` after the
operator. See [`ROADMAP.md`](./ROADMAP.md) under Boundary Policy and Host Notes.

## Markdown field boundaries

Inline Annotation follows Markdown's field-boundary pattern rather than treating
every nested substring as general Markdown. Links and images are precedent: link
labels, destinations, titles, and image alt text each have a specific parsing
contract. Inline Annotation does the same with base text, annotation slots,
marks, and pipes.

The v2 model therefore keeps Markdown syntax out of annotation semantics.
`**bold**`, links, raw HTML, or Live Preview tokens may exist around an
annotation because the host Markdown engine owns those constructs, but they do
not decide slot assignment, mark classification, pipe overflow, or diagnostics.
Annotation slot contents are plain text in v2.

Future AST-level adapters may render richer annotated bases, for example
emphasis or links inside the base span. That is a rendering/adapter feature, not
a core semantic rule, and it should preserve the same plain annotation model and
source ranges.
