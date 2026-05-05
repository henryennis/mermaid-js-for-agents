# Maintenance model

Mermaid.js for Agents is self-maintaining so the create/repair skill does not rot. It separates
deterministic upstream tracking from semantic maintainer-agent review.

## Sources of truth

- Mermaid release metadata comes from stable GitHub releases matching `mermaid@x.y.z`.
- Mermaid documentation structure comes from the upstream docs tree at the immutable release commit.
- Mermaid diagram implementation structure comes from the upstream diagram source tree at the
  immutable release commit.
- The canonical agent-facing router lives in the Agent Skill.
- Detailed guidance lives in focused reference files loaded on demand.

## Deterministic updaters

Run:

```bash
npm run generate
npm run discover:evals
```

The upstream evidence updater records:

- latest stable Mermaid release tag, date, and commit;
- release highlights extracted from the release body;
- upstream docs directories at that release commit;
- upstream diagram implementation directories at that release commit.

It updates the generated upstream evidence reference and a machine-readable JSON snapshot. This
gives maintainers a small diff to review when Mermaid changes.

The eval discovery updater reads upstream evidence, the coverage matrix, and eval metadata. It
updates `data/eval-opportunities.json` and `docs/eval-backlog.md` so maintainers can start from a
ranked create/repair fitness backlog instead of inventing work from scratch.

## Semantic maintainer-agent loop

Some changes require judgment. Examples:

- A new diagram type needs routing guidance.
- A beta syntax graduates to stable.
- Renderer behavior changes break existing repair advice.
- A security or rendering note changes how agents should respond.

For those changes, use the GitHub Agentic Workflow. The maintainer agent reviews the deterministic
diff and `docs/eval-backlog.md`, inspects upstream context and repository feedback, decides whether
agents need new create/repair guidance, edits references or evals, runs validation, and proposes a
PR. Meaningful PRs should cite the eval opportunity IDs they address or explain why no backlog item
applies.

## Validation gates

Before merging maintenance changes:

```bash
npm run check
npm run discover:evals:check
npm run validate:mermaid
npm run smoke:pack
```

When Tessl is configured:

```bash
tessl skill lint .
tessl skill review .
tessl eval run .
```

## Version policy

- Patch: reference refreshes, typo fixes, docs-only improvements.
- Minor: new diagram type guidance, new harness support, new eval scenarios.
- Major: breaking package layout or changed skill activation behavior.
