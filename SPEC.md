# Markdown Inline Annotation Extension

A syntax specification for ruby, text emphasis, and complex text decorations.

Inline Annotation is the shared syntax family behind the original Logseq Furigana Ruby plugin, the markdown-it implementation, the planned Obsidian plugin, and later remark/unified support.

## Operators

Inline Annotation uses two position-assignment operators:

- `^^` assigns the over slot.
- `^_` assigns the under slot.

The bracketed form is:

```markdown
[base]^^(annotation)
[base]^_(annotation)
```

The abbreviated form is:

```markdown
base^^(annotation)
base^_(annotation)
```

Abbreviated bases stop at whitespace or Markdown structural delimiters. Use brackets for multi-word or complex bases.

## Slots

Each base has two slots: over and under.

Pipe notation and mixed chaining are equivalent:

```markdown
[a]^^(x|y)
[a]^^(x)^_(y)
[a]^_(y)^^(x)
```

v1 capacity is two slots. Extra pipe levels are ignored.

When pipe notation already fills both slots, a following chained opposite operator is consumed but has no rendering effect:

```markdown
[a]^^(x|y)^_(z)
```

Same-operator chaining is not merged:

```markdown
[a]^^(x)^^(y)
```

## Rendering Modifiers

Most slot content renders as ruby annotation. Special slot values render as text decoration:

| Slot value | Meaning |
| --- | --- |
| `..` | bouten / emphasis dots |
| `.-` | solid underline |
| `.~` | wavy underline |
| `.=` | double underline |

Underline modifiers only apply to the under slot. In the over slot they are plain ruby text.

Rendering modifiers can combine with ruby annotations:

```markdown
[重要語句]^^(じゅうようごく|.-)
[強調]^^(..)^_(.~)
```

## Alignment

If a slot annotation is space-separated and the part count matches the base character count, the renderer may split the base into per-character ruby.

If an annotation part is identical to the base character, the renderer may hide that annotation while preserving ruby spacing.

Two-level per-character ruby is valid when both slots can align to the same base:

```markdown
[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)
```

Implementations should fall back to group ruby when alignment would discard nested inline annotation markup.

## Nested Spans

Bracketed bases may contain another Inline Annotation expression. This supports partially overlapping ruby:

```markdown
[[護]^^(まも)れ]^_(プロテゴ)
[初音ミク^^(偉大なる|世界一姫様)]^_(Vocaloid)
```

The base text is parsed recursively as Inline Annotation. Annotation slot contents are plain text for v1; they are not parsed as Markdown.

## Escapes

Backslash escapes are honored inside bases and annotations:

```markdown
[A|B]^^(a\|b)
[x]^^(a\)b)
```

Escaped pipe is literal text, not a slot separator.

## Logseq Compatibility Baseline

The markdown-it implementation is expected to cover the old Logseq demo feature set:

| Feature | Example |
| --- | --- |
| Over ruby | `[漢字]^^(かんじ)` |
| Under ruby | `cat^_(/kæt/)` |
| Pipe two-level ruby | `[北京]^^(Beijing\|PKG)` |
| Chained two-level ruby | `[base]^^(over)^_(under)` |
| Per-character alignment | `[春夏秋冬]^^(はる なつ あき ふゆ)` |
| Auto-hidden identical character | `[振り仮名]^^(ふ り が な)` |
| Bouten over / under | `[重要]^^(..)`, `[注意]^_(..)` |
| Solid / wavy / double underline | `[solid]^_(.-)`, `[wavy]^_(.~)`, `[double]^_(.=)` |
| Ruby plus decoration | `[重要語句]^^(じゅうようごく)^_(.-)` |
| Bouten plus underline | `[強調]^^(..)^_(.~)` |
| Nested / partially overlapping ruby | `[[護]^^(まも)れ]^_(プロテゴ)` |
| Multilingual text | `[Москва]^^(Moskva\|Moscow)`, `[café]^^(ka.ˈfe\|coffee)` |

## Class Contract

The canonical HTML class contract (default prefix `ia-`) is shared by every implementation so a single stylesheet works across hosts:

| Construct | Classes |
| --- | --- |
| Ruby | `ia-ruby`, plus `ia-ruby-over` or `ia-ruby-under` |
| Nested two-level ruby | outer ruby also carries `ia-ruby-double` |
| Ruby + decoration | ruby also carries `ia-ruby-mixed` plus the decoration class |
| Bouten | `ia-bouten`, plus `ia-bouten-over` and/or `ia-bouten-under` |
| Underline | `ia-underline`, plus `ia-underline-wavy` or `ia-underline-double` |

`ruby-position` must be declared explicitly on **both** the over and under slots (inline style or stylesheet). It is a CSS inherited property, so a nested over-ruby inside an under-ruby would otherwise inherit `under` and render both annotations below the base. The reference stylesheet ships at `markdown-it-inline-annotation/styles.css`.

## Markdown Compatibility

Implementations should avoid parsing Inline Annotation inside code spans, links, raw HTML, and entities. Emphasis and other inline constructs should continue to be parsed by the host Markdown engine.

Implementations must escape user-provided base and annotation text before producing HTML.
