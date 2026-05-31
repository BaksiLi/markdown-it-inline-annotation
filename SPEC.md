# Markdown Inline Annotation Extension

A syntax specification for ruby, furigana, bouten, and text decorations.

> **Version: v2.** v2 is almost a superset of v1 — it makes decoration marks
> symmetric, reclassifies space alignment as a rendering enhancement, and stops
> silently dropping over-capacity input. Reference implementations:
> `markdown-it-inline-annotation` `0.2.0+` and `logseq-furigana-ruby` `0.6.0+`.
> `0.1.x` / `0.5.x` implement v1, archived at [`docs/SPEC-v1.md`](./docs/SPEC-v1.md).

Inline Annotation is the shared syntax family behind the Logseq Furigana Ruby
plugin, the markdown-it implementation, the Obsidian and VS Code adapters, and
later remark/unified support. Every implementation emits the canonical `ia-*`
HTML class contract, so one stylesheet family works across hosts.

## Operators

Two position-assignment operators on a two-slot system (over / under):

- `^^` assigns the **over** slot.
- `^_` assigns the **under** slot.

Bracketed form (use for multi-word or complex bases):

```markdown
[base]^^(annotation)
[base]^_(annotation)
```

Abbreviated form (base stops at whitespace or Markdown structural delimiters):

```markdown
base^^(annotation)
base^_(annotation)
```

An operator is only recognized when immediately followed by `(`. `^^` or `^_`
not followed by `(` is literal text.

## Slots

Each base has two slots. Pipe notation and mixed chaining are equivalent:

```markdown
[a]^^(x|y)
[a]^^(x)^_(y)
[a]^_(y)^^(x)
```

- Capacity is two slots (over + under).
- Same-operator chaining is not merged: `[a]^^(x)^^(y)` is two separate
  expressions.
- **Over-capacity input renders through as text.** When pipe notation already
  fills both slots, a following chained operator is shown as literal text so the
  author sees it (e.g. the `^_(z)` in `[a]^^(x|y)^_(z)`), rather than being
  silently dropped. Tooling may warn.

## Decoration Marks

A slot value is a **mark** when its entire content matches one of the patterns
below; otherwise it is ruby text. The slot determines the side; the glyph
determines the mark. Marks are symmetric across slots:

| Glyph | `^^` (over) | `^_` (under) |
| --- | --- | --- |
| `..` | bouten dots above | bouten dots below |
| `.-` | overline (solid) | underline (solid) |
| `.~` | wavy overline | wavy underline |
| `.=` | double overline | double underline |

```markdown
[重要]^^(..)            bouten above
[重要語句]^^(じゅうようごく|.-)   ruby above + underline below
[強調]^^(..)^_(.~)       bouten above + wavy underline below
[title]^^(.-)            overline above
```

To use a mark glyph as literal ruby text, escape the leading dot: `[x]^^(\.-)`
renders ruby text ".-" above `x`.

## Alignment

Space alignment is a **rendering enhancement**, not part of the structural
contract. It never changes meaning — only layout — so a renderer may apply it or
not, and both results are conformant. Implementations may expose it as a
rendering policy (`spaceAlignment`: `"always"`, `"auto"`, or `"off"`).

When enabled and a slot annotation is space-separated with a part count equal to
the base character count, the renderer splits the base into per-character ruby:

```markdown
[春夏秋冬]^^(はる なつ あき ふゆ)
```

If an annotation part is identical to the base character, that annotation is
hidden while ruby spacing is preserved (`[振り仮名]^^(ふ り が な)`, り→り
omitted). Two-level per-character ruby is valid when both slots align:

```markdown
[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)
```

Alignment falls back to group ruby when it would discard nested inline
annotation markup. Because alignment is non-semantic, the same source may render
as per-character ruby in one host and group ruby in another (e.g. an academic
note configuration that prefers multi-word glosses); the base↔annotation
association and `ia-*` classes stay identical.

An `"auto"` policy should be conservative. For example,
`[取り返す]^^(と り かえ す)` is a good candidate for per-character layout, while
`[真值]^^(Truth Value)` should usually remain group ruby.

## Nested Spans

Bracketed bases may contain another Inline Annotation expression, for partially
overlapping ruby. The base is parsed recursively; annotation slot contents are
plain text in v2 (not parsed as Markdown).

```markdown
[[護]^^(まも)れ]^_(プロテゴ)
[初音ミク^^(偉大なる|世界一姫様)]^_(Vocaloid)
```

## Escapes

Backslash escapes are honored inside bases and annotations. Escaped pipe is
literal text, not a slot separator:

```markdown
[A|B]^^(a\|b)
[x]^^(a\)b)
[x]^^(\.-)
```

## Degenerate Behavior

| Input | Result |
| --- | --- |
| `^^()` (empty slot) | not matched; literal text |
| `^^` not followed by `(` | not matched; literal text |
| unclosed `[` or `(` | not matched |
| newline inside `[...]` or `(...)` | not matched |
| `\^^(...)` (escaped operator) | literal text |
| `[a]^^(x)^^(y)` (same-operator chain) | first matched; `^^(y)` literal |
| `[a]^^(x|y)^_(z)` (over capacity) | x, y render; `^_(z)` renders as text |

## Class Contract

Canonical HTML classes (default prefix `ia-`), shared by every implementation:

| Construct | Classes |
| --- | --- |
| Ruby | `ia-ruby`, plus `ia-ruby-over` or `ia-ruby-under` |
| Nested two-level ruby | outer ruby also carries `ia-ruby-double` |
| Ruby + decoration | ruby also carries `ia-ruby-mixed` plus the decoration class |
| Bouten | `ia-bouten`, plus `ia-bouten-over` and/or `ia-bouten-under` |
| Underline (under slot) | `ia-underline`, plus `ia-underline-wavy` or `ia-underline-double` |
| Overline (over slot) | `ia-overline`, plus `ia-overline-wavy` or `ia-overline-double` |

`ruby-position` must be declared explicitly on **both** the over and under slots
(inline style or stylesheet). It is a CSS inherited property, so a nested
over-ruby inside an under-ruby would otherwise inherit `under` and render both
annotations below the base. The reference stylesheet ships at
`markdown-it-inline-annotation/styles.css`.

CSS applies one `text-decoration-style` to all decoration lines on a single
element. Implementations may merge overline + underline on one span when their
styles are compatible; if an author combines different line styles on the two
sides, renderers may choose the most visible shared style or use nested spans.
Both are conformant when the side classes and line presence are preserved.

## Markdown Compatibility

Implementations should avoid parsing Inline Annotation inside code spans, links,
raw HTML, and entities. Emphasis and other inline constructs should continue to
be parsed by the host Markdown engine. Implementations must escape user-provided
base and annotation text before producing HTML.

## Conformance Fixtures

The shared host-neutral fixture corpus lives in `fixtures/html-render.json`.
Adapters should run this corpus before adding host-specific tests. Fixtures
assert semantic fragments and substring counts rather than exact serialized
HTML, so markdown-it, Logseq, Obsidian, and future unified adapters can differ
in wrapper markup or attribute ordering while preserving the same syntax
behavior. Host-specific behavior (Logseq slash-command conversion, parser
conflicts) is tested outside this corpus.

## Appendix: Operator Properties

`^^` and `^_` are position-assignment operators on a 2-slot system (over /
under). Marks (`..`, `.-`, `.~`, `.=`) switch a slot from ruby text to CSS
decoration on that side.

**Commutativity** — chain order doesn't matter; position comes from the operator:
- `[a]^^(x)^_(y)` ≡ `[a]^_(y)^^(x)`

**Pipe equivalence** — pipe is compact notation for cross-operator chaining:
- `[a]^^(x|y)` ≡ `[a]^^(x)^_(y)` ≡ `[a]^_(y)^^(x)`
- `[漢字]^^(かんじ|.-)` ≡ `[漢字]^^(かんじ)^_(.-)` — ruby above + underline below

**Side symmetry** — a mark means the same decoration on whichever side its slot
selects:
- `[t]^^(.-)` overline · `[t]^_(.-)` underline

**Idempotency of position** — same-operator chaining is rejected (each slot is
claimed once):
- `[a]^^(x)^^(y)` — not chained; two separate expressions

**Capacity** — max 2 levels (over + under) per base. Over-capacity input renders
through as text (changed from v1, which silently dropped it).

## Changes from v1

v1 is archived at [`docs/SPEC-v1.md`](./docs/SPEC-v1.md). Rationale, migration
notes, and the core layering plan are in [`docs/v2-rationale.md`](./docs/v2-rationale.md).
Summary:

1. **Symmetric marks** — `.-`, `.~`, `.=` in the over slot are now overline
   styles instead of literal ruby text. (Only breaking case; escape with `\` for
   the old literal behavior.)
2. **Alignment is a rendering enhancement**, not a structural/parse contract.
3. **Over-capacity input renders through as text** instead of being silently
   dropped.
