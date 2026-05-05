---
name: mermaid-diagrams
description:
  Create and repair Mermaid.js diagrams. Use when the user asks for Mermaid, flowcharts, sequence
  diagrams, class diagrams, ERDs, state diagrams, Gantt charts, Git graphs, C4, architecture
  diagrams, mindmaps, timelines, pie charts, quadrants, Sankey, XY charts, packet, kanban, treemap,
  Wardley maps, diagrams-as-code, Markdown diagram blocks, or help fixing Mermaid syntax/rendering
  failures.
license: MIT
compatibility:
  Portable Agent Skills format for Pi, Claude Code, Codex, Tessl tiles, and similar coding-agent
  harnesses. Optional validation scripts require Node.js 20+.
metadata:
  source: https://github.com/mermaid-js/mermaid
  mermaid-version: "11.14.0"
  generated-reference: references/upstream-evidence.md
---

<objective>
Help agents create and repair Mermaid.js diagrams that are correct, readable, maintainable, and aligned with the currently tracked Mermaid release. Prefer small, valid diagrams over clever syntax. When asked to repair a diagram, preserve the user's intent and change only what is needed. Validation and explanation are supporting actions, not the primary product promise.
</objective>

<quick_start>

1. Identify the diagram purpose and choose the closest Mermaid diagram type.
2. Draft a fenced Markdown block using ```mermaid unless the user asks for raw Mermaid.
3. Keep labels human-readable and IDs stable, short, and ASCII-friendly.
4. Avoid experimental or beta syntax unless it directly matches the user's need.
5. For non-trivial diagrams, read the focused reference before finalizing:
   - Diagram choice: `references/diagram-types.md`
   - Coverage matrix: `references/coverage-matrix.md`
   - Creation patterns: `references/creation-patterns.md`
   - Repair playbook: `references/repair-playbook.md`
   - Syntax patterns: `references/syntax-cheatsheet.md`
   - Safety/rendering: `references/security-and-rendering.md`
   - Upstream evidence status: `references/upstream-evidence.md`
6. If scripts are available, validate generated diagrams with
   `node scripts/validate-mermaid-examples.mjs --file <diagram-or-doc> --parse` or pipe raw Mermaid
   to `node scripts/validate-mermaid-examples.mjs --stdin --parse` before claiming that specific
   diagram is parser-valid. </quick_start>

<decision_router> Use the user's real communication goal, not the first diagram type they mention:

- Process, routing, dependency, or decision flow → flowchart.
- Ordered interactions between actors/systems → sequence diagram.
- Object model, APIs, inheritance, or domain entities → class diagram.
- Lifecycle, modes, transitions, or finite-state behavior → state diagram.
- Database tables or entity relationships → ER diagram.
- Project schedule, milestones, critical path → Gantt.
- Branching, commits, release trains → gitGraph.
- Architecture boundaries, deployment, cloud components → architecture or C4.
- Strategy/value-chain evolution → wardley-beta.
- Hierarchy or concept map → mindmap, treeView-beta, block, or treemap.
- User activities and sentiment over steps → journey.
- Metrics over categories/time → pie, quadrantChart, xychart-beta, radar-beta, or sankey-beta.
- Requirements traceability → requirementDiagram.
- If the user only asks to "make a diagram", ask one concise clarifying question unless the
  surrounding context already names the structure. </decision_router>

<creation_workflow>

1. Restate the intended diagram in one sentence if the request is broad.
2. Pick the simplest Mermaid type that represents the relationship accurately.
3. For diverse or high-stakes scenarios, consult `references/creation-patterns.md` before drafting.
4. Create a minimal first version with 3-9 meaningful nodes/actors/items.
5. Add direction, grouping, styling, or configuration only if it improves comprehension.
6. Check for syntax traps: unmatched brackets, unescaped colons in risky labels, reserved words as
   IDs, edge labels with pipes, and beta prefixes.
7. Return the diagram first, then a short note explaining assumptions or editable extension points.
   </creation_workflow>

<repair_workflow>

1. Preserve semantics before aesthetics.
2. Read `references/repair-playbook.md` for common failures if the cause is not obvious.
3. Identify the first likely parse failure and fix that before rewriting the whole diagram.
4. Normalize to the modern syntax in `references/syntax-cheatsheet.md` when old syntax is ambiguous.
5. If multiple repairs are plausible, show the smallest repair and mention the assumption.
6. Do not silently change diagram type unless the requested semantics cannot be represented in the
   current type or the target renderer lacks support. </repair_workflow>

<quality_gates>

- Use `securityLevel: strict` assumptions unless the user explicitly needs HTML or loose rendering.
- Prefer quoted labels when they contain punctuation, parentheses, slashes, or Markdown-sensitive
  characters.
- Avoid huge diagrams; split when a diagram exceeds roughly 20 nodes or three nested clusters.
- Keep visual styling semantic: use classes for status/risk/ownership, not decoration.
- Make diagrams diff-friendly: stable ordering, one relationship per line, no generated noise.
- For GitHub Markdown, return fenced `mermaid` blocks and avoid unsupported renderer-only features
  unless noted. </quality_gates>

<reference_policy> Read references only when needed. The SKILL.md body is intentionally a router;
the deeper files are the maintained knowledge base. When updating the skill for a new Mermaid
release, update `references/upstream-evidence.md`, review changed diagram docs under Mermaid's
upstream docs, and adjust examples/tests before changing this router. </reference_policy>

<success_criteria>

- The chosen diagram type matches the user's communication goal.
- The output is syntactically plausible Mermaid for the tracked version.
- The diagram is readable in Markdown and maintainable in source control.
- Any assumptions, beta features, or validation gaps are stated briefly.
- If repairing, the fix is minimal and preserves the user's original intent. </success_criteria>
