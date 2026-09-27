# Inline Annotation Roadmap

Inline Annotation is a portable Markdown extension for ruby/furigana,
over/under glosses, bouten, and line marks. Its durable center is the syntax,
semantic model, fixtures, and `ia-*` class contract. Host workarounds stay in
host adapters.

## Current Implementations

| Project | Role | Current line |
| --- | --- | --- |
| `markdown-it-inline-annotation` | canonical spec, parser/model, HTML renderer, markdown-it adapter | `0.3.4` |
| `logseq-furigana-ruby` | independent parser, macros, conversions, Logseq renderer | `0.6.2` |
| `obsidian-inline-annotation` | Reading view and Live Preview | `0.3.10` |
| `vscode-inline-annotation` | thin built-in Markdown preview adapter | `0.3.3` |
| `satteri-inline-annotation` | two-phase Sätteri Markdown adapter | local `0.1.0` pilot |
| remark/unified | AST adapter | deferred until a real pipeline needs it |

Inline Annotation v2 is implemented across the active adapters. Core `0.3.x`
adds source ranges and multi-model scanning for editor integrations.

## Contracts

The stable [v2 spec](../SPEC.md) owns:

- bracketed and abbreviated source syntax;
- over/under slot assignment, pipe and chain behavior;
- decoration marks, escaping, nesting, and visible overflow;
- source ranges and the `ia-*` semantic class contract;
- source-segment and rich-text boundary requirements.

The core may parse source, produce models and ranges, escape user text, render
canonical HTML, and export fixtures. It does not own Logseq parser conflicts,
Obsidian editor behavior, markdown-it rule ordering, or future mdast policy.

Adapters decide where parsing is allowed. They must preserve host-owned links,
code, raw HTML, and semantic rich-text boundaries.

## Boundary Policy

The core receives one contiguous source string. A rich-text or DOM adapter:

1. must render a complete valid expression contained in one host-eligible
   source run;
2. may join adjacent runs only when their split is semantically transparent;
3. must not join across formatting, highlight, link, code, or another semantic
   boundary if replacement would discard or reinterpret it;
4. may conservatively leave a transparent split unrendered.

An outer formatted run containing the entire expression is valid; crossing in
or out of a differently decorated run is not. The canonical cases live in
`fixtures/segment-boundaries.json`.

## Testing

Conformance has four layers:

1. `fixtures/models.json`: exact parser models and UTF-16 source ranges.
2. `fixtures/html-render.json`: portable semantic HTML behavior.
3. `fixtures/segment-boundaries.json`: contiguous source and rich-text run policy.
4. Adapter tests: markdown-it composition, Obsidian DOM/Live Preview, Logseq
   conversion and parser conflicts, and VS Code preview wiring.

Rendering-policy fixtures may differ by declared options such as
`spaceAlignment`. Host skips must be explicit; adapters must not silently weaken
semantic cases.

Desktop automation remains a release smoke test for plugin loading and visible
output, not the primary correctness suite.

## Release Sequence

### Released: 0.3.3 core

- Make `markdown-it` an optional peer so `/core` consumers do not install it.
- Preserve markdown-it escapes, strikethrough, and extension marker boundaries.
- Publish the shared segment-boundary corpus.
- Verify a packed `/core` install with no `markdown-it` present.

The adapter lockfiles have been refreshed and the corresponding VS Code,
Obsidian, and Logseq releases are complete. VS Code remains thin; Obsidian and
Logseq keep their host-specific boundary tests.

### 0.3.4 stable contract release

- Mark v2 stable and freeze its syntax, model, range, and class contracts.
- Publish exact model fixtures with UTF-16 source-range invariants.
- Add adapter ownership, integration profiles, and a port checklist.

### Sätteri adapter pilot

Cogitatum is the first concrete consumer. The adapter lives in the independent
`satteri-inline-annotation` sibling repository because Sätteri versioning,
host-boundary tests, and releases are separate from the syntax/core package.
This does not require moving the other adapters or extracting the neutral core:
the existing `markdown-it-inline-annotation/core` export is already the right
runtime boundary.

Sätteri parses Markdown before its MDAST plugins run, and its emphasis parser
can split the v2 `^_` chain operator. The adapter therefore has two phases:

1. an MDAST phase reads the original source range, applies the core parser, and
   reparses the surrounding Markdown with inert markers in place of complete
   annotations;
2. a HAST phase replaces those markers with the core's escaped canonical HTML.

This keeps slot semantics, escaping, overflow, nesting, ranges, and classes in
the shared core. It also keeps outer Markdown formatting while leaving links,
code, images, and raw-HTML islands host-owned. The pilot runs the shared HTML
fixture corpus plus Sätteri-specific precedence tests.

The initial scope is plain Markdown in paragraphs and headings, including list
items and blockquotes. MDX and GFM table cells remain preserved but unrendered:
MDX needs a safe literal-insertion contract, while table-cell positions include
row delimiters and need a separate inline-container strategy. The adapter suite
passes against both Cogitatum's Sätteri `0.9.5` and current `0.10.5`; a real
Cogitatum production build remains the final pre-publication integration check.

### 0.4 neutral core boundary

External core-only production use now proves that the parser/model is a real
integration boundary. Prepare `@inline-annotation/core` as a dependency-free
package while preserving `markdown-it-inline-annotation/core` as a compatibility
re-export.

The public model names and UTF-16, zero-based, end-exclusive range invariants
are now fixed in v2 and covered by model fixtures. Before extraction:

- decide whether fixtures live with the neutral core or in a small conformance
  package;
- automate release tags and adapter update checks.

The markdown-it package should then become a small adapter depending on the
neutral core.

### remark/unified

Build `micromark-extension-inline-annotation`, `mdast-util-inline-annotation`,
and `remark-inline-annotation` only when a concrete unified/MDX pipeline needs
them. Source ranges and model fixtures should make that port mechanical.

AST adapters are the right place to experiment with rich Markdown children in
the base. Annotation slots remain plain text unless a later spec version defines
a separate rich-slot contract.

See [ADAPTERS.md](./ADAPTERS.md) for the integration profiles and port
checklist. A new host should choose a profile explicitly instead of copying a
different parser's rule-order workaround.

## Host Notes

- **Logseq:** multiple `^^()` forms may collide with highlight parsing. Macros
  and conversion commands are the reliable workflow.
- **Obsidian:** Reading view sees rendered DOM; Live Preview sees CodeMirror
  source. Both share the core model but keep separate host policies.
- **VS Code:** use `extendMarkdownIt`; no scripts, webviews, or editor features
  until real demand justifies them.
- **Sätteri:** install both phases of the adapter preset. Run its MDAST phase
  before plugins that derive heading or paragraph data. Plain Markdown is the
  pilot contract; MDX and table cells are explicit follow-up work.

## Project Shape

The current workspace is a set of independent sibling Git repositories, not a
monorepo. The sibling checkout is convenient for local integration, but each
host adapter owns its dependencies, tests, version, and release cadence.

The spec currently lives in this repository because the package, parser,
fixtures, and examples are released together. A neutral repository or monorepo
becomes worthwhile when `@inline-annotation/core` is extracted:

```text
spec/  packages/core/  packages/markdown-it/  packages/remark/
plugins/obsidian/  plugins/logseq/  plugins/vscode/  examples/
```

Brand: **Inline Annotation**. Host listings may use **Inline Ruby Annotation**
for discoverability. Canonical spelling: `bouten`.
