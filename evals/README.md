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

- Creation: `flowchart-readme`, `choose-diagram-type`, `er-schema-cardinality`,
  `class-package-model`, `sequence-login-handshake`, `gantt-release-plan`.
- Repair: `repair-broken-sequence`, `state-lifecycle-repair`, `parser-validation-advice`,
  `class-relationship-repair`, `er-cardinality-repair`.
- Renderer compatibility: `renderer-fallback`.
- Security: `unsafe-rendering-strict`.

Each scenario's `criteria.json` includes compact `metadata` describing diagram types, task modes,
risk areas, renderer targets, and difficulty. That metadata feeds `npm run discover:evals`, which
writes `data/eval-opportunities.json` and `docs/eval-backlog.md`.

Add new scenarios when upstream Mermaid releases introduce diagram types or syntax that change how
agents should create or repair diagrams. When a scenario closes a backlog item, use the opportunity
ID in the PR summary.
