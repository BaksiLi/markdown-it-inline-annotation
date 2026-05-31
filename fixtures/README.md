# Inline Annotation Fixtures

`html-render.json` is the shared conformance corpus for host-neutral Inline
Annotation HTML rendering.

The corpus intentionally checks semantic HTML fragments and counts instead of
full serialized HTML. Different adapters may emit attributes in different
orders, add inline styles, or render inside a host-specific wrapper. They should
still agree on slot meaning, escaping, decoration classes, and rejection cases.

Fixture fields:

- `id`: stable identifier used by every adapter test.
- `category`: broad behavior group, such as `ruby`, `slots`, `alignment`,
  `decoration`, `escaping`, `safety`, or `rejection`.
- `assertionType`: how portable the assertion is:
  - `semantic`: host-neutral syntax and class-contract behavior that every
    adapter should preserve.
  - `rendering-policy`: output that depends on declared renderer options, such
    as `spaceAlignment: "always"`.
  - `host-skip`: reserved for copied adapter suites when a documented host
    parser limitation prevents a host from running an otherwise shared case.
- `input`: Inline Annotation source.
- `options`: renderer options required by a `rendering-policy` case.
- `contains`: fragments that must appear in rendered HTML.
- `notContains`: fragments that must not appear.
- `counts`: exact substring counts for portable structural assertions.

Semantic fixtures should avoid asserting inline style strings unless the style
itself is the behavior under test. Prefer canonical `ia-*` classes and visible
text fragments so adapters can choose inline styles, stylesheets, or host DOM
wrappers independently. They should also avoid inputs where default rendering
policy changes the asserted structure; put those cases under `rendering-policy`
with explicit `options` instead.

This file is currently canonical in the markdown-it package. Host adapters can
copy it until the project moves fixtures into a neutral package or monorepo.

## Sync Policy

The current cross-repo copy is intentional but temporary:

1. Short term: adapters keep a checked-in copy and run it in their own test
   suites. This keeps each package self-contained and avoids a shared package
   before the adapter boundary is proven.
2. Middle term: once a second non-Logseq adapter exists, host adapters should
   import the fixture corpus from the published package instead of copying it.
   The corpus is already included in the npm `files` list and exported as
   `markdown-it-inline-annotation/fixtures/html-render.json`.
3. Long term: if the project becomes a monorepo or a neutral `inline-annotation`
   package, move the corpus next to the spec and make every adapter consume that
   single source.

Add host-neutral cases here first. If a case depends on a host parser, command
workflow, DOM timing, or editor-specific escaping behavior, keep it in that
adapter's own tests. If a host copies this corpus and temporarily cannot run a
case because of a known host limitation, mark that copied case as `host-skip`
with a `hostSkip` note instead of deleting or silently weakening it.
