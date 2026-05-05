# Eval suite

These scenarios measure whether agents can create and repair Mermaid.js diagrams while staying
honest about renderer support, parser validation, and security-sensitive rendering requests.

## Public-readiness target

Before public marketplace submission, run Tessl evals and record results. Target:

- overall score at least 0.85;
- no critical create/repair/security scenario below 0.75;
- no scenario may pass by switching to an unrelated diagram type unless the task explicitly asks for
  a fallback.

## Scenario groups

- Creation: `flowchart-readme`, `choose-diagram-type`, `er-schema-cardinality`.
- Repair: `repair-broken-sequence`, `state-lifecycle-repair`, `parser-validation-advice`.
- Renderer compatibility: `renderer-fallback`.
- Security: `unsafe-rendering-strict`.

Add new scenarios when upstream Mermaid releases introduce diagram types or syntax that change how
agents should create or repair diagrams.
