# Inline Annotation Diagnostics

This is a non-normative taxonomy for future lint, editor diagnostics, and quick
fixes. It reserves diagnostic identifiers only; it does not require any current
implementation to emit diagnostics.

## Diagnostic IDs

| ID | Severity | Condition | Suggested action |
| --- | --- | --- | --- |
| `IA001_UNCLOSED_BRACKET_BASE` | error | A `[` starts a bracketed base but no matching `]` is found before a newline or parse boundary. | Close the bracket or escape the literal `[`. |
| `IA002_UNCLOSED_ANNOTATION` | error | An operator is followed by `(` but no matching unescaped `)` is found before a newline or parse boundary. | Close the annotation or escape the literal operator. |
| `IA003_EMPTY_ANNOTATION` | warning | An annotation slot is empty, such as `[a]^^()`. | Add annotation text or remove the operator. |
| `IA004_SAME_OPERATOR_CHAIN` | warning | A matched expression is immediately followed by the same operator, such as `[a]^^(x)^^(y)`. | Use the opposite operator or rewrite as separate annotations. |
| `IA005_SLOT_OVERFLOW_CHAIN` | warning | A pipe-saturated expression is followed by another chained operator, such as `[a]^^(x|y)^_(z)`. | Remove the extra slot or split the expression. |
| `IA006_SLOT_OVERFLOW_PIPE` | warning | A pipe annotation has more than two slot levels, such as `[a]^^(x|y|z)`. | Keep two slots and move extra text outside the expression. |
| `IA007_MARK_ESCAPING_AMBIGUITY` | info | A slot exactly matches a decoration mark (`..`, `.-`, `.~`, `.=`) where literal ruby text may have been intended. | Escape the leading dot for literal text, such as `[x]^^(\.-)`. |
| `IA008_RENDER_POLICY_ALIGNMENT` | info | A space-separated annotation could render differently under `spaceAlignment` policies. | Choose an adapter policy or configure `spaceAlignment` explicitly. |
| `IA009_HOST_SKIP_CONTEXT` | info | Inline Annotation syntax appears inside a host-owned token stream such as a link, code span, raw HTML, or Live Preview token that the adapter does not parse. | Leave it literal or use a host-supported workflow. |

## Checklist Coverage

Fixture and adapter checklists should include both capacity-overflow forms:

- `[a]^^(x|y)^_(z)` for chained slot overflow (`IA005_SLOT_OVERFLOW_CHAIN`).
- `[a]^^(x|y|z)` for extra pipe overflow (`IA006_SLOT_OVERFLOW_PIPE`).

Diagnostics should never reinterpret host-owned Markdown tokens just to produce
more warnings. Host adapters may report `IA009_HOST_SKIP_CONTEXT` only when they
can do so without breaking the host parser or editor state.
