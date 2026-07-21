# Inline Annotation Fixtures

The package ships two shared conformance corpora:

- `html-render.json` covers host-neutral parsing and semantic HTML rendering.
- `segment-boundaries.json` defines when a rich-text or DOM host may join text
  runs before parsing Inline Annotation.

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

Schema rules are also carried in `fixtureSchema` inside the JSON file:

| `assertionType` | Required fields | Forbidden fields | Assertion requirement |
| --- | --- | --- | --- |
| `semantic` | common fields | `options`, `hostSkip` | at least one of `contains`, `notContains`, `counts` |
| `rendering-policy` | common fields, `options` | `hostSkip` | at least one of `contains`, `notContains`, `counts` |
| `host-skip` | common fields, `hostSkip` | `options` | none; copied adapter suites may keep assertions for context but must not run the case |

Common fields are `id`, `category`, `name`, `assertionType`, and `input`.

Semantic fixtures should avoid asserting inline style strings unless the style
itself is the behavior under test. Prefer canonical `ia-*` classes and visible
text fragments so adapters can choose inline styles, stylesheets, or host DOM
wrappers independently. They should also avoid inputs where default rendering
policy changes the asserted structure; put those cases under `rendering-policy`
with explicit `options` instead.

These files are canonical in the markdown-it package until the core and
conformance data move to a neutral package or monorepo.

## Sync Policy

Npm-based adapters import published fixture exports when available. The new
segment corpus is checked into adapters while `0.3.3` is unreleased; switch
those copies to the package export when their core lockfiles advance. Logseq
keeps a checked-in copy because its parser is intentionally independent.

Long term, a neutral core/conformance package or monorepo should provide one
fixture source to every adapter.

Add host-neutral cases here first. If a case depends on a host parser, command
workflow, DOM timing, or editor-specific escaping behavior, keep it in that
adapter's own tests. If a host copies this corpus and temporarily cannot run a
case because of a known host limitation, mark that copied case as `host-skip`
with a `hostSkip` note instead of deleting or silently weakening it.

## Segment Boundary Policy

The core parses a contiguous source string. Rich-text runs and DOM nodes belong
to host adapters, so `segment-boundaries.json` separates three obligations:

- `must-render`: the complete expression is in one host-eligible run and must
  render.
- `may-render`: the expression crosses only semantically transparent splits;
  an adapter may join those runs or conservatively preserve them.
- `must-preserve`: joining would cross formatting, link, code, highlight, or
  another semantic boundary, so the adapter must leave source and decoration
  intact.

A semantic wrapper around the whole expression is not a crossing. For example,
an entire expression inside one strong-emphasis run may render while retaining
the outer emphasis. Hosts may still reserve contexts such as links and code.
The forbidden operation is concatenating differently decorated runs and
silently discarding their boundary.
