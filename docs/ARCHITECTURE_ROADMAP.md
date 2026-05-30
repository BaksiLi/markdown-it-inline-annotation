# Inline Annotation Architecture Roadmap

## Goal

Build **Inline Annotation** as a portable Markdown extension for ruby, furigana,
bouten, underline, and two-slot text annotations.

The project should be portable without pretending every Markdown host behaves the
same. The durable center is the syntax, semantic model, fixtures, and HTML class
contract. Each host adapter is allowed to handle its own parser timing,
selection APIs, escaping quirks, and editor workflow.

Current status:

- `markdown-it-inline-annotation` `0.1.2` has shipped on npm.
- The markdown-it package currently hosts the canonical `SPEC.md`, parser,
  architecture roadmap, markdown-it adapter, stylesheet, examples, and
  compatibility tests.
- Logseq `0.5.1` emits the same canonical `ia-*` HTML class contract.
- `vscode-inline-annotation` is a preview-only downstream adapter.
- `obsidian-inline-annotation` is a reading-view prototype with DOM fixture
  coverage and a local vault installer.

## Architecture Principles

1. Spec first, shared runtime later.
   Shared fixtures and a clear spec are more valuable than premature code reuse.
   A shared package should only be extracted after at least two non-identical
   adapters prove the boundary.

2. Keep the core narrow.
   The reusable core may parse source text, produce source ranges, expose a
   neutral annotation model, escape user text, and render canonical HTML. It must
   not contain Logseq, Obsidian, markdown-it, or remark workarounds.

3. Host adapters own host behavior.
   Logseq parser conflicts, Obsidian reading-view timing, markdown-it tokenizer
   rules, and future micromark state machines belong outside the core.

4. Document unavoidable conflicts instead of hiding them.
   Some host parsers run before plugins. In those cases the right product
   decision is a reliable workflow, not a fragile illusion of full Markdown
   control.

5. The public contract is source syntax plus semantic HTML.
   The canonical output classes are `ia-*`. Raw HTML strings may differ by
   adapter, but slot meaning, escaping, and class semantics should not.

## Layer Boundaries

### Spec

Defines:

- source syntax: `[base]^^(annotation)`, `[base]^_(annotation)`, abbreviated
  forms, pipe notation, mixed chaining
- two-slot model: over and under
- rendering modifiers: bouten `..`, underline `.-`, `.~`, `.=`
- escaping rules
- source range expectations
- safety model
- canonical `ia-*` class contract
- space alignment as a rendering policy that implementations may expose as an
  option, not a mandatory parse rule

Does not define:

- how a host editor intercepts Markdown
- selection or conversion commands
- DOM mutation timing
- exact whitespace produced by every renderer

### Core

Allowed responsibilities:

- parse Inline Annotation source into a neutral model
- preserve source ranges
- escape base and annotation text by default
- render portable HTML for class-mode and inline-style mode
- expose reusable fixtures for adapters

Disallowed responsibilities:

- Logseq macro syntax
- Logseq highlight or italic conflict workarounds
- Obsidian Live Preview behavior
- markdown-it inline rule ordering
- remark or micromark tokenizer state
- UI commands

### Adapters

Adapters translate host capabilities into the spec model:

- markdown-it: real inline tokenizer before `text`
- Logseq: DOM rendering plus slash-command conversion workflows
- VS Code: preview-only markdown-it extension through `extendMarkdownIt`
- Obsidian: reading-view postprocessor first, editor support later
- remark/unified: micromark/mdast integration only when there is a concrete
  consuming pipeline

## Host Compatibility Policy

Compatibility means "the best reliable behavior in that host", not "all hosts
must accept every source string in the same editing context".

Logseq is the clearest example. Logseq parses its own Markdown before plugins
run, so multiple inline `^^()` / `^_()` forms in one block can conflict with
Logseq highlight or italic syntax before this plugin sees the original source.
The core cannot fix that. The Logseq adapter should instead provide:

- clear documentation
- selected-block conversion commands
- macro output for editable Logseq-native content
- HTML output for fixed visual content
- tests that preserve code spans and known conversion edge cases

This policy should also apply to future hosts. If a host has a parser conflict,
the adapter documents it and offers the least surprising workaround.

VS Code is the opposite end of the adapter spectrum. Its built-in Markdown
preview exposes a markdown-it hook, so the first adapter should be a thin shell
around the existing markdown-it plugin. Do not add preview scripts, custom
webviews, editor decorations, hover, completion, or diagnostics until the
preview-only package has proven real demand. Those features would move the work
from "syntax preview adapter" into "full editor extension".

## Testing Strategy

Use three fixture layers:

1. Spec fixtures
   Shared by all implementations. Cover basic over/under ruby, abbreviated
   syntax, pipes, chaining, per-character alignment, auto-hide, nesting,
   decorations, escaping, multiple annotations, and XSS escaping.
   The canonical corpus now lives in
   `markdown-it-inline-annotation/fixtures/html-render.json`; Logseq keeps a
   copy at `src/shared-html-render-fixtures.json` with a thin TypeScript wrapper
   in `src/spec-fixtures.ts`. These cases must stay host-neutral and avoid exact
   HTML serialization when class semantics are enough.

   The copy is a transition mechanism, not the final architecture. Keep it
   checked in while Logseq and markdown-it are separate packages. After a second
   non-Logseq adapter exists, prefer importing fixtures from
   `markdown-it-inline-annotation/fixtures/html-render.json`, or move the spec
   and fixtures into a neutral package or monorepo if adapter work justifies
   that structure.

2. Adapter fixtures
   Verify integration behavior such as markdown-it inline parsing, Obsidian
   reading-view DOM replacement, or remark AST output.

3. Host workflow fixtures
   Capture host-specific behavior such as Logseq macro conversion, selected
   blocks, code protection, and known parser conflicts.
   These remain in `src/parser.test.ts` because they exercise Logseq-specific
   conversion and DOM behavior, not the portable grammar.

Use Computer Use or app-level manual smoke tests only for release checks:

- plugin loads
- commands appear
- selected block conversion works
- rendered output appears after reload
- no obvious editor breakage

Do not rely on desktop UI automation as the main correctness test suite. It is
too slow and too environment-dependent.

## Spec Ownership

Short term:

- `markdown-it-inline-annotation/SPEC.md` is the canonical spec home.
- Logseq, demos, and future plugins link to that file.

Why:

- the package is already published
- the repo is more neutral than the Logseq plugin
- the current parser and examples live there

Long term:

- move the spec to a neutral `inline-annotation` repo or org when a second
  non-Logseq adapter ships
- possible future monorepo shape:

```text
spec/
packages/core/
packages/markdown-it/
packages/remark/
plugins/obsidian/
plugins/logseq/
apps/demo/
```

Do not move the spec yet. Moving before the adapter boundary is proven would add
process without reducing risk.

## Phase 1: markdown-it Package

Status: **complete for v0.1.2**.

Acceptance:

- [x] `npm test` passes for core and markdown-it integration cases
- [x] `npm run build` exits successfully
- [x] escaped pipe handling works
- [x] multiple annotations in one paragraph work without Logseq workarounds
- [x] canonical stylesheet is published
- [x] generated example page exists
- [x] shared fixture corpus is exported
- [x] `enableSpaceAlignment` allows hosts to opt out of automatic
      space-based per-character alignment

Published package:

- npm package: `markdown-it-inline-annotation`
- current dist tag: `latest` -> `0.1.2`

Maintenance:

- keep `SPEC.md`, README examples, and generated examples aligned
- add new parser fixtures here first when the behavior is host-neutral
- avoid syntax expansion until Obsidian reading-view behavior has been tested

## Phase 2: Logseq Stabilization

Status: **stable for current Logseq scope**.

Purpose:

Make Logseq reliable and understandable instead of forcing it to behave like a
normal Markdown postprocessor.

Priorities:

- keep current rendering stable
- document Logseq host-parser limitations plainly
- make `/Ruby → markup`, `/Ruby → macro`, and `/Ruby → HTML (one-way)`
  reliable on selected blocks and current block
- use macro conversion as the recommended workaround for editable multi-ruby
  Logseq content
- use HTML conversion as the recommended workaround for fixed visual output
- keep expanding host workflow fixtures for conversion, code protection, and
  mixed rendered/raw blocks

Initial fixtures now cover:

- multiple annotations converted to macros in one block
- mixed macro and markup converted to HTML while preserving inline code
- fenced code block protection
- raw markup rendered beside existing rendered ruby in the same block
- shared escape behavior for pipes, right parens, brackets, and HTML text
- safer conversion back to markup/macro, including delimiter escaping and mixed
  ruby chains converted to macro pipe levels

Non-goals:

- do not chase full parity with markdown-it inside Logseq block rendering
- do not move Logseq host quirks into the shared parser
- do not extract `@inline-annotation/core` just to reduce duplication

Decision:

Keep Logseq code independent for now. Share behavior through spec and fixtures.
Consider adopting a shared core only after Obsidian proves the boundary.

## Phase 2.5: Online Demo

Status: **started in markdown-it package**.

Build a small online renderer for the website using the published
`markdown-it-inline-annotation` package.

Features:

- source textarea
- rendered preview
- HTML output
- examples menu
- class-mode toggle
- examples loaded from the shared fixture corpus
- no dependency on Logseq behavior

Why this comes before remark:

- it makes the spec visible
- it helps users understand the syntax quickly
- it gives the project a public compatibility target
- it makes the fixture corpus visible as product behavior, not just test data

Scope:

- keep the first version deliberately plain
- use the core renderer directly
- load examples from the shared fixture corpus where possible
- avoid site-specific layout work until it is integrated into the real website

## Phase 3: Obsidian Adapter

Status: **started after Logseq stabilization, demo, and VS Code preview
adapter**.

First version:

- reading-view postprocessor
- canonical `ia-*` CSS
- use the markdown-it/core parser if it remains clean enough
- no Live Preview guarantee
- optional command to convert selected source to HTML if Obsidian parser
  conflicts appear in real use

Later:

- Live Preview support through CodeMirror decorations if the API path is clean
- editor commands only after reading-view behavior is stable
- app-level smoke tests with Computer Use or manual checklist before release

Non-goal for v1:

- do not promise editor-mode parity with reading view

## Phase 3A: VS Code Preview Adapter

Status: **preview-only adapter published/validated**.

Why this comes before Obsidian:

- VS Code's Markdown preview can consume a markdown-it plugin directly.
- It tests whether Inline Annotation can travel as a normal Markdown extension
  without DOM postprocessing.
- It gives the spec a developer-facing surface with less host-specific behavior
  than Obsidian or Logseq.

First version:

- contribute only `markdown.markdownItPlugins`
- return `md.use(markdownItInlineAnnotation)` from `extendMarkdownIt`
- no `markdown.previewScripts`
- no custom webview
- no editor-side behavior
- run the shared HTML fixture corpus through VS Code's adapter entrypoint

CI expectation:

- one package-level CI is enough for preview-only v1 if it covers TypeScript
  build, manifest checks, shared fixture rendering, package contents, and
  markdown-it/core release checks
- add VS Code extension-host smoke tests only when we add UI/editor behavior or
  preview resources
- keep manual app testing as a release checklist until the adapter has behavior
  that cannot be tested through markdown-it alone

Safety policy:

- no scripts in the preview
- no network resources
- keep user-authored text escaped in the core renderer
- do not broaden VS Code preview security assumptions

Current outcome:

- `vscode-inline-annotation` can consume the published
  `markdown-it-inline-annotation` package
- the adapter entrypoint passes the shared HTML fixture corpus
- a locally packaged VSIX can render in Windsurf/VS Code-compatible preview
- Marketplace publishing is operational work, not a syntax or core blocker

## Phase 3B: Obsidian Reading-View Adapter

Status: **reading-view prototype installed and DOM fixture tests passing**.

First implementation boundary:

- `src/main.ts` only registers an Obsidian Markdown postprocessor
- `src/postprocessor.ts` owns DOM text-node replacement
- shared core owns detection, escaping, and HTML rendering
- existing links, code, preformatted blocks, ruby, scripts, styles, textareas,
  and `data-inline-annotation-ignore` subtrees are skipped

Validation completed:

- fixture-based DOM postprocessor tests using `happy-dom`
- shared HTML fixture corpus passes through the Obsidian postprocessor
- host skip behavior covers links, code, preformatted blocks, existing ruby,
  scripts, styles, textareas, and `data-inline-annotation-ignore`
- package audit currently reports zero vulnerabilities
- `styles.css` ships the canonical `ia-*` visual contract for Obsidian reading
  view instead of relying only on inline styles
- `npm run install:vault -- <vault> --clean --enable --examples` installs only runtime files:
  `main.js`, `manifest.json`, `versions.json`, and `styles.css`
- markdown-it `0.1.2` adds `enableSpaceAlignment`, which lets future Obsidian
  settings prioritize multi-word glosses over automatic per-character ruby
- Obsidian now consumes `markdown-it-inline-annotation@0.1.2` and disables
  space alignment by default for reading-view academic notes
- `examples/obsidian-smoke.md` provides a focused Reading view smoke note

Validation still needed before release:

- manual Obsidian reading-view smoke test
- repository publication and release packaging
- consider adding a user-facing setting if readers want to re-enable
  per-character space alignment in Obsidian

## Phase 4: Shared Core Package

Status: **defer**.

Extract `@inline-annotation/core` only when all are true:

- markdown-it and Obsidian both use the same semantic parser successfully
- Logseq can either adopt it cleanly or remain a documented host adapter
- fixtures are split into spec, adapter, and host workflow layers
- the public API is stable enough to support future remark work

Potential API shape:

```ts
parseInlineAnnotation(input, options) -> AnnotationMatch[]
renderAnnotationHtml(model, options) -> string
renderInlineAnnotationsToHtml(input, options) -> string
```

The API must expose source ranges and avoid host assumptions.

## Phase 5: remark/unified

Status: **defer until there is a concrete consuming pipeline**.

Future package family:

- `micromark-extension-inline-annotation`
- `mdast-util-inline-annotation`
- `remark-inline-annotation`

How this differs from current routes:

- markdown-it works at inline-tokenizer/render time and can emit HTML directly.
- Logseq works as a host adapter with DOM rendering and slash-command
  conversion because Logseq parses Markdown before plugins run.
- remark/unified needs a tokenizer plus AST utilities: micromark recognizes the
  source ranges, mdast stores semantic nodes, and remark/rehype render those
  nodes later.

Prepare now by:

- keeping source ranges available
- separating parse semantics from HTML rendering
- avoiding syntax that cannot be expressed as a real inline tokenizer
- making fixtures independent of markdown-it-specific output formatting

Do not build this before the demo and Obsidian reading-view adapter unless a real
site or MDX workflow needs it.

## Tooling Policy

Current decision:

- keep strict TypeScript builds as the primary static check
- keep shared fixture corpus validation in tests
- do not add ESLint yet

Why:

- both repos are small and already compile under `strict`
- adding ESLint now would introduce config and dependency churn without catching
  the parser/adapter risks that matter most
- lint becomes more valuable when the project moves to a monorepo or adds a
  second TypeScript adapter with shared source files

Revisit lint when:

- shared runtime code is extracted
- Obsidian or demo code adds more frontend surface
- CI needs consistent style checks across multiple packages

## Safety Model

Default behavior:

- base and annotation text are plain text in v1
- renderers must escape user-controlled text
- annotation content does not parse arbitrary Markdown
- raw HTML handling is adapter-specific

Future AST adapters may support richer base content, but that must be explicit
and separately tested.

## Naming

- Brand: **Inline Annotation**
- Current package: `markdown-it-inline-annotation`
- Future shared package, if justified: `@inline-annotation/core`
- Canonical spelling: `bouten`
