# Mermaid diagram type router

Use this as the first stop when choosing a diagram type. The tracked upstream release is recorded in
`upstream-evidence.md`.

## Stable high-confidence types

| User intent                      | Mermaid starter                  | Use when                                                    | Avoid when                                            |
| -------------------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Process, decisions, dependencies | `flowchart TD` or `flowchart LR` | Showing how work moves, branches, or depends on other work. | You need exact time ordering between named actors.    |
| Interactions over time           | `sequenceDiagram`                | API calls, conversations, handshakes, async messages.       | The important structure is a static dependency graph. |
| Domain/API structure             | `classDiagram`                   | Classes, interfaces, inheritance, composition, attributes.  | You need relational cardinality and database tables.  |
| Entity relationships             | `erDiagram`                      | Database-ish entities, cardinality, ownership.              | You need methods/inheritance or runtime states.       |
| States and transitions           | `stateDiagram-v2`                | Lifecycle, modes, transitions, guards.                      | You only need a linear sequence of steps.             |
| Plans and schedules              | `gantt`                          | Dates, milestones, task dependencies.                       | You do not have dates or durations.                   |
| Branch history                   | `gitGraph`                       | Git branching/release stories.                              | You need arbitrary dependency nodes.                  |
| User journeys                    | `journey`                        | User steps with satisfaction scores.                        | You need system-to-system messages.                   |
| Requirements                     | `requirementDiagram`             | Requirements, test cases, traceability.                     | You need general prose requirements.                  |
| Pie shares                       | `pie title ...`                  | Simple proportions adding up conceptually to a whole.       | More than ~7 slices or comparisons over time.         |
| Mind map                         | `mindmap`                        | Brainstorming, hierarchy, concept decomposition.            | You need precise dependencies or ordering.            |
| Timeline                         | `timeline`                       | Chronological milestones without task durations.            | You need dependencies or date math.                   |
| Quadrants                        | `quadrantChart`                  | 2x2 prioritization or classification.                       | The axes are not meaningful.                          |
| C4 architecture                  | `C4Context`, `C4Container`, etc. | C4-style software system context/container/component views. | You need generic cloud icons or arbitrary topology.   |

## Newer and beta-capability types

Use beta types when they fit better than a stable type, but mention that renderer support may vary
outside current Mermaid releases.

| User intent               | Mermaid starter     | Notes                                                             |
| ------------------------- | ------------------- | ----------------------------------------------------------------- |
| Architecture topology     | `architecture-beta` | Best for services, groups, and directional relationships.         |
| Block layouts             | `block-beta`        | Best for manually arranged blocks or nested layout diagrams.      |
| Kanban boards             | `kanban`            | Good for work status snapshots.                                   |
| Packets and binary layout | `packet-beta`       | Good for protocol/header diagrams.                                |
| Sankey flows              | `sankey-beta`       | Good for weighted flows between stages.                           |
| XY charts                 | `xychart-beta`      | Good for simple bar/line charts in Mermaid.                       |
| Treemaps                  | `treemap-beta`      | Good for hierarchical quantities.                                 |
| Radar charts              | `radar-beta`        | Good for multivariate score comparisons when supported.           |
| ZenUML                    | `zenuml`            | Good for sequence-like service interactions with ZenUML syntax.   |
| Wardley maps              | `wardley-beta`      | Added in Mermaid 11.14.0 for value-chain/evolution strategy maps. |

## Selection heuristics

- Prefer `flowchart` for unknown structural diagrams. It is the most widely supported and easiest to
  repair.
- Prefer `sequenceDiagram` whenever the order of communication is the main point.
- Prefer `stateDiagram-v2` for lifecycle diagrams even if the user says "flow".
- Prefer `erDiagram` for database schemas and `classDiagram` for code-level type models.
- Use `architecture-beta` for cloud/system topology only when Mermaid renderer support is known.
- Use C4 when the user explicitly asks for C4 or system context/container views.

## GitHub Markdown compatibility

GitHub supports Mermaid code fences, but renderer support can lag the newest Mermaid release. For
broad README compatibility, favor flowchart, sequence, class, state, ER, Gantt, pie, journey, and
gitGraph unless the user accepts newer syntax.
