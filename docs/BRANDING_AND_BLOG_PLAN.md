# Branding and Blog Plan

Inline Annotation is the name of the cross-editor syntax and model. Host-facing
plugins should use more concrete names when discoverability matters:

- **Inline Ruby Annotation** for Obsidian and VS Code listings.
- **logseq-furigana-ruby** remains the historical Logseq package name.
- **markdown-it-inline-annotation** remains the npm/core package name.

The first-screen message should always include the source syntax:

```markdown
[漢字]^^(かんじ)
[base]^^(over)^_(under)
```

This distinguishes the project from popup/comment annotation tools. The project
is not about hiding comments behind a click; it is about visible inline
typography encoded directly in Markdown source: ruby/furigana, phonetic guides,
interlinear glosses, bouten, overlines, and underlines.

## Positioning

Short form:

> Inline Annotation is a tiny Markdown extension for visible over/under text:
> `[base]^^(ruby)` and `[base]^_(under)`.

Medium form:

> Inline Annotation brings ruby/furigana, interlinear glosses, emphasis dots,
> overlines, and underlines to ordinary Markdown with a small source syntax and
> portable fixtures across markdown-it, Obsidian, VS Code, and Logseq.

Avoid:

- "annotation" by itself when speaking to plugin users.
- "comments", "popup notes", or "hidden notes".
- claims that the syntax is a standard today. It is a proposal plus working
  implementations.

## Blog Shape

Working title:

> A Tiny Markdown Syntax for Ruby, Furigana, and Inline Glosses

Alternate titles:

- Markdown Needs a Small Inline Annotation Syntax
- Ruby/Furigana in Markdown: From Logseq Plugin to Portable Syntax
- `[base]^^(ruby)`: A Cross-Editor Inline Annotation Proposal

Core argument:

1. Markdown has a gap: visible inline over/under annotation is common in CJK,
   language learning, philology, translation notes, and study material, but
   Markdown has no small portable source form for it.
2. HTML `<ruby>` exists, but raw HTML is too verbose for daily notes and does
   not compose well across Markdown editors.
3. Inline Annotation proposes two position operators, `^^` and `^_`, plus a
   small two-slot model.
4. The syntax is deliberately not a generic comment system. It is typography
   and glossing, not hidden metadata.
5. The project is implementation-led: Logseq proved the workflow, markdown-it
   defines the portable parser/core, Obsidian and VS Code test host boundaries.
6. Host adapters may differ in rendering policy, but the model and shared
   fixtures keep the portable contract honest.

## Demo

The minimal web demo should be core-only:

- A textarea with source Markdown.
- A rendered preview using `markdown-it-inline-annotation`.
- A small preset list: furigana, two-slot gloss, bouten, underline, nested.
- No account, no editor simulation, no marketing shell.

Later, this can move into the personal site as the interactive section of the
blog post. The standalone demo should stay boring and inspectable.

## Immediate Cleanup

- Keep repo descriptions concrete and syntax-forward.
- Link every adapter README back to the core spec and to the other published
  adapters.
- Put Obsidian Community and VS Code Marketplace links in the core README.
- Use **Inline Ruby Annotation** for public plugin listings where "Inline
  Annotation" is too generic.
