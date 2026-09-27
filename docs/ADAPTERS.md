# Adapter Guide

Inline Annotation v2 is stable. A host port should reuse its syntax and model;
the adapter's job is to decide where parsing is allowed and how the resulting
model becomes host output without destroying host-owned structure.

## Ownership

| Concern | Owner |
| --- | --- |
| Grammar, slots, escaping, overflow, ranges | Inline Annotation core/spec |
| Semantic HTML and `ia-*` classes | Core renderer/class contract |
| Links, code, raw HTML, MDX, table structure | Host parser and adapter |
| Eligible source runs and transparent boundaries | Adapter |
| Editor transactions, decorations, lifecycle | Host plugin |
| Space alignment and equivalent layout choices | Renderer policy |

Annotation slots are plain text in v2. An adapter may support richer base
rendering only when it preserves the same model, ranges, and source ownership.
Rich slot content needs a later specification version rather than a local
interpretation presented as portable behavior.

## Integration Profiles

Choose the profile that matches the host's real parsing boundary.

### Source-first inline rule

Use this when the host exposes the original inline source before conflicting
Markdown rules consume it. The markdown-it plugin is the reference profile.
Run the Inline Annotation rule at a deliberate precedence, stop at host-owned
constructs, and let the host parse surrounding Markdown normally.

### Source-backed AST rewrite

Use this when an AST retains trustworthy positions but tokenization has already
split Inline Annotation punctuation. The Sätteri adapter is the reference
profile: its MDAST phase reads exact source slices and substitutes inert
markers, then its HAST phase restores core-rendered HTML. Markers must be
collision-safe, and both phases must be installed as one preset.

### Rich-run or DOM adapter

Use this when the host exposes formatted runs or rendered DOM rather than one
source string, as in Obsidian. Apply the segment-boundary policy: render a full
expression inside one eligible run, optionally join only transparent splits,
and preserve any expression crossing a semantic boundary. Never flatten DOM
text and then replace it without restoring node ownership.

### Independent parser

Use this only when the host language or runtime cannot consume the shared core,
as in Logseq. Run the portable model and rendering corpora, document host parser
conflicts, and keep any vendored fixtures traceable to their core release.

### Thin delegation

Use this when a host already exposes a compatible parser extension point. The
VS Code extension delegates to the markdown-it adapter instead of maintaining a
second parser. Prefer delegation whenever it preserves host lifecycle and
security constraints.

## Source Positions

The portable contract is zero-based, end-exclusive UTF-16 offsets into the
exact original source string. Hosts may use a different coordinate system
internally, but adapters must convert at the core boundary and verify every
`source` and `raw` field against the original slice.

Do not infer the encoding from a version number alone. Check known line/column
positions against the supplied source, then convert when required. This is
necessary for Sätteri: 0.9 position offsets are UTF-8 bytes, while 0.10 offsets
are JavaScript UTF-16 code units. Astral characters and non-ASCII text must be
present in offset tests; ASCII-only tests cannot expose the difference.

## Port Checklist

1. Identify the earliest trustworthy source boundary and the host constructs
   that remain ineligible: at minimum code, links, raw HTML, and entities.
2. Choose one integration profile and state its precedence and ownership rules.
3. Preserve exact source slices through model construction; normalize positions
   to the UTF-16 contract before exposing them.
4. Run `fixtures/html-render.json`. An independent parser must also run
   `fixtures/models.json`; a shared-core adapter instead tests its source-slice
   and offset conversion around the locked core. Rich-run or DOM hosts also run
   `fixtures/segment-boundaries.json`.
5. Add host tests for rule ordering, skipped contexts, lifecycle, and any
   collision or marker strategy. Host limitations stay explicit.
6. Use the canonical stylesheet or equivalent `ia-*` classes, including
   explicit `ruby-position` on both sides and separate line wrappers when styles
   differ.
7. Verify a real consumer build. A unit suite proves the adapter contract; it
   does not prove packaging, plugin loading, or production pipeline order.

The syntax core should not gain host flags to make a port convenient. If an
integration cannot preserve v2 semantics, keep the source unchanged and record
the host limitation until its boundary is understood.
