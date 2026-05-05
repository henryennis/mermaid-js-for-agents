# Mermaid syntax cheatsheet for agents

These examples are intentionally small and diff-friendly. Expand them only when the user's context
requires it.

## Flowchart

```mermaid
flowchart TD
  request[Receive request] --> classify{Known diagram type?}
  classify -->|yes| draft[Draft Mermaid]
  classify -->|no| ask[Ask one clarifying question]
  draft --> validate[Validate syntax and readability]
```

Tips:

- Use `TD` for processes and `LR` for pipelines or dependencies.
- Use stable IDs (`request`) plus readable labels (`[Receive request]`).
- Quote complicated labels: `node["Label with /, :, or ( )"]`.
- Keep one edge per line.

## Sequence diagram

```mermaid
sequenceDiagram
  participant User
  participant Agent
  participant Renderer
  User->>Agent: Ask for a diagram
  Agent->>Renderer: Validate Mermaid text
  Renderer-->>Agent: Syntax result
  Agent-->>User: Diagram and assumptions
```

Tips:

- Prefer explicit `participant` declarations for stable names.
- Use `->>` for calls, `-->>` for responses, and `-)` for async sends when supported.
- Use `alt`, `opt`, `loop`, and `par` blocks sparingly.

## Class diagram

```mermaid
classDiagram
  class Skill {
    +string name
    +string description
    +run(task)
  }
  class Reference
  Skill "1" *-- "many" Reference : loads on demand
```

Tips:

- Use class diagrams for type/API shape, not database schema.
- Escape or simplify generic type syntax if a renderer rejects it.

## ER diagram

```mermaid
erDiagram
  SKILL ||--o{ REFERENCE : includes
  SKILL {
    string name
    string description
  }
  REFERENCE {
    string path
    string topic
  }
```

Tips:

- Use ER for entities and cardinality.
- Keep relationship labels short and verb-like.

## State diagram

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Validating: run checks
  Validating --> Published: checks pass
  Validating --> Draft: fix issues
  Published --> [*]
```

Tips:

- Use state diagrams for lifecycle, status, and mode changes.
- If a state has many internals, split into another diagram.

## Gantt

```mermaid
gantt
  title Agent Skill Release Plan
  dateFormat  YYYY-MM-DD
  section Package
  Draft skill           :a1, 2026-05-04, 2d
  Validate examples     :after a1, 1d
  Publish release       :milestone, after a1, 0d
```

Tips:

- Include `dateFormat` before dated tasks.
- Prefer explicit IDs for dependencies.

## Git graph

```mermaid
gitGraph
  commit id: "skill"
  branch upstream-sync
  checkout upstream-sync
  commit id: "refresh refs"
  checkout main
  merge upstream-sync tag: "release"
```

## Mindmap

```mermaid
mindmap
  root((Mermaid skill))
    Create
      Flowchart
      Sequence
    Repair
      Parse errors
      Renderer gaps
    Maintain
      Upstream release scan
      Eval scenarios
```

## Pie

```mermaid
pie title Diagram requests by type
  "Flowchart" : 45
  "Sequence" : 25
  "Class/ER" : 20
  "Other" : 10
```

## Architecture beta

```mermaid
architecture-beta
  group app(cloud)[Application]
  service agent(server)[Agent] in app
  service skill(disk)[Skill package] in app
  service renderer(internet)[Mermaid renderer]
  agent:R --> L:skill
  agent:B --> T:renderer
```

Use only when the target renderer supports `architecture-beta`.

## Wardley beta

```mermaid
wardley-beta
  title Agent Skill Value Chain
  anchor Agent [0.95, 0.35]
  component Mermaid guidance [0.75, 0.35]
  component Upstream docs [0.55, 0.65]
  Agent -> Mermaid guidance
  Mermaid guidance -> Upstream docs
```

Use for strategy/evolution maps. Mention beta renderer support when sharing outside this package.
