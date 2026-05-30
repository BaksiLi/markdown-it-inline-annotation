# Inline Annotation Roadmap

Portable Markdown extension for ruby, furigana, bouten, over/under line marks,
and two-slot text annotations.

The durable center is the **syntax, semantic model, fixtures, and `ia-*` HTML
class contract** — not shared code. Each host adapter owns its own parser
timing, selection APIs, escaping quirks, and editor workflow.

Specs:

- [`../SPEC.md`](../SPEC.md) — canonical syntax (v2, shipped by `0.2.0`).
- [`v2-rationale.md`](./v2-rationale.md) — why v2 differs from v1 + core layering.
- [`SPEC-v1.md`](./SPEC-v1.md) — archived v1 (shipped by `0.1.x` / Logseq `0.5.x`).

## Status

| Project | Role | Status |
| --- | --- | --- |
| `markdown-it-inline-annotation` | Core spec + parser + markdown-it adapter | npm `0.2.0` (v2) |
| `logseq-furigana-ruby` | Reference plugin (independent parser) | `0.5.1` (v1), emits canonical `ia-*` |
| `vscode-inline-annotation` | Preview-only adapter via `extendMarkdownIt` | `0.1.x` (tracks markdown-it) |
| `obsidian-inline-annotation` | Reading-view DOM postprocessor | `0.1.0` prototype (v1) |
| remark/unified | AST adapter | deferred |

Phase detail lives in `CHANGELOG.md`. This file keeps the durable decisions.

v2 changes (symmetric over/under line marks, alignment as a rendering
enhancement, pipe-overflow rendered as text) ship first in the markdown-it
package. Other adapters migrate from v1 to v2 after the implementation blog post;
they stay conformant in the meantime because v2 is almost a superset of v1.

## Architecture Principles

1. **Spec first, shared runtime later.** Shared fixtures and a clear spec beat
   premature code reuse. Extract a shared package only after two non-identical
   adapters prove the boundary.
2. **Keep the core narrow.** The reusable core may parse source, produce source
   ranges, expose a neutral model, escape user text, and render canonical HTML.
   It must not contain host workarounds.
3. **Host adapters own host behavior.** Logseq parser conflicts, Obsidian
   reading-view timing, markdown-it rule ordering, future micromark state — all
   outside the core.
4. **Document unavoidable conflicts instead of hiding them.** When a host parses
   before plugins, the right answer is a reliable workflow, not a fragile
   illusion of full control.
5. **The public contract is source syntax plus semantic HTML.** Canonical output
   classes are `ia-*`. Raw HTML may differ by adapter; slot meaning, escaping,
   and class semantics must not.

## Layer Boundaries

**Spec defines:** source syntax (bracketed/abbreviated, pipe, chaining),
two-slot model, decoration marks, escaping, source ranges, safety, the `ia-*`
class contract, and alignment as a non-semantic rendering enhancement.

**Spec does not define:** how a host intercepts Markdown, selection/conversion
commands, DOM mutation timing, or exact whitespace.

**Core may:** parse to a neutral model, preserve source ranges, escape text,
render class-mode and inline-style HTML, expose fixtures.

**Core may not:** hold Logseq macro/conflict workarounds, Obsidian Live Preview
behavior, markdown-it rule ordering, remark/micromark state, or UI commands.

**Adapters** translate host capabilities into the spec model (markdown-it inline
tokenizer; Logseq DOM + slash-command conversion; VS Code preview-only;
Obsidian reading-view postprocessor; remark/mdast when a pipeline needs it).

## Host Compatibility Policy

Compatibility means "the best reliable behavior in that host," not "every host
accepts every source string in the same editing context."

- **Logseq** parses its own Markdown before plugins run, so multiple inline
  `^^()` / `^_()` forms in one block can collide with Logseq highlight/italic.
  The core cannot fix this. The adapter provides documentation, selected-block
  conversion commands, macro output for editable content, HTML output for fixed
  content, and code-span-preserving tests.
- **VS Code** is the opposite end: its preview exposes a markdown-it hook, so the
  adapter is a thin shell around the existing plugin. No preview scripts, custom
  webviews, decorations, hover, completion, or diagnostics until proven demand.

This policy applies to future hosts: document the conflict, offer the least
surprising workaround.

## Testing Strategy

Three fixture layers:

1. **Spec fixtures** — host-neutral, shared by all implementations. Canonical
   corpus: `fixtures/html-render.json`. Logseq keeps a checked-in copy
   (`src/shared-html-render-fixtures.json`) as a transition mechanism until a
   second non-Logseq adapter justifies importing or a monorepo. These assert
   semantic fragments / counts, not exact serialized HTML.
2. **Adapter fixtures** — integration behavior (markdown-it parsing, Obsidian
   DOM replacement, remark AST).
3. **Host workflow fixtures** — host-specific behavior (Logseq macro conversion,
   code protection, known parser conflicts) — kept in `src/parser.test.ts`.

App-level manual / Computer Use smoke tests are for release checks only (plugin
loads, commands appear, conversion works, rendered output appears after reload).
Do not use desktop UI automation as the main correctness suite.

## Spec Ownership

Short term: `markdown-it-inline-annotation/SPEC.md` is canonical (the package is
published, the repo is neutral, the parser and examples live here). Other
plugins link to it.

Long term: move the spec to a neutral `inline-annotation` repo/org when a second
non-Logseq adapter ships. Possible monorepo shape:

```text
spec/  packages/core/  packages/markdown-it/  packages/remark/
plugins/obsidian/  plugins/logseq/  apps/demo/
```

Do not move the spec before the adapter boundary is proven.

## Future Work

### Adapter migration to v2 (after the blog post)

markdown-it ships v2 first. Then migrate, in order of cost:

- **VS Code** — thin `extendMarkdownIt` wrapper, so bumping the
  `markdown-it-inline-annotation` dependency adopts v2 with no code change; it
  already runs the shared corpus from the npm package.
- **Obsidian** — reading-view postprocessor on the shared core; gains overline
  marks and pipe-overflow text for free, re-run the shared corpus (its
  alignment-policy skip list stays valid since alignment is non-semantic).
- **Logseq** — independent parser; needs the symmetric-mark and pipe-overflow
  changes ported, and its vendored corpus copy refreshed (or replaced by the
  monorepo's shared fixtures).

### Online demo (shipped, iterate later)

`examples/playground.html` is generated from the core renderer and the shared
fixture corpus (source textarea, live preview, HTML output, fixture menu,
class-mode toggle). It stays a single generated artifact — no separate website
dataset to maintain. Fold it into the real site when the blog post lands.

### Phase 4 — shared core package (deferred)

Extract `@inline-annotation/core` only when all hold: markdown-it and Obsidian
use the same semantic parser successfully; Logseq adopts it cleanly or stays a
documented adapter; fixtures are split into spec/adapter/host layers; the public
API is stable enough for remark. Likely API:

```ts
parseInlineAnnotation(input, options) -> AnnotationMatch[]
renderAnnotationHtml(model, options) -> string
renderInlineAnnotationsToHtml(input, options) -> string
```

The API must expose source ranges and avoid host assumptions.

### Phase 5 — remark/unified (deferred)

`micromark-extension-inline-annotation`, `mdast-util-inline-annotation`,
`remark-inline-annotation`, once a concrete site or MDX pipeline needs it.
Prepare now by keeping source ranges available, separating parse semantics from
HTML rendering, and avoiding syntax that cannot be expressed as a real inline
tokenizer.

### Obsidian Live Preview — deferred

Reading-view is v1. Live Preview via CodeMirror 6 decorations is the boundary
between "preview" and "real editor": it needs `ViewPlugin` + replace/widget
decorations, cursor-enter source restoration, IME, and undo/redo handling. Large
surface, easy to break. Document as deferred; revisit as a dedicated phase after
the demo and reading-view release ship.

## Tooling Policy

No ESLint yet — both repos are small and compile under `strict`; lint would add
config churn without catching the parser/adapter risks that matter. Strict
TypeScript builds plus shared fixture validation are the primary static checks.
Revisit when shared runtime is extracted, frontend surface grows, or CI needs
consistent style across multiple packages (i.e. with the monorepo).

## Safety Model

- Base and annotation text are plain text; renderers must escape
  user-controlled text.
- Annotation content does not parse arbitrary Markdown.
- Raw HTML handling is adapter-specific.

Future AST adapters may support richer base content, but only explicitly and
with separate tests.

## Naming

- Brand: **Inline Annotation**
- Current package: `markdown-it-inline-annotation`
- Future shared package, if justified: `@inline-annotation/core`
- Canonical spelling: `bouten`
