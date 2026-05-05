# Product intent

This document is the alignment contract for the repository.

## User-facing promise

Mermaid.js for Agents teaches AI coding agents to **create and repair Mermaid.js diagrams**.

Everything in the package should serve that promise:

- choosing the right Mermaid diagram type for a user's communication goal;
- drafting valid, readable Mermaid syntax;
- repairing broken Mermaid diagrams while preserving user intent;
- handling diverse real-world diagram contexts, renderers, and compatibility constraints.

Validation, explanation, and reference lookup are supporting behaviors. They are useful only insofar
as they help agents create or repair diagrams better.

## Repository self-maintenance promise

The repository is self-maintaining. GitHub Agentic Workflows run maintainer agents that keep the
skill fit for purpose.

Maintainer agents are responsible for:

- tracking upstream Mermaid releases, docs, and diagram syntax changes;
- deciding whether the skill still covers what coding agents need to know;
- updating focused references, examples, rules, and eval scenarios;
- keeping cross-harness packaging working for Tessl, Pi, Claude Code, Codex, and generic Agent
  Skills consumers;
- proposing safe pull requests with validation evidence.

## Non-goals

- The user-facing skill is not a general Mermaid project maintainer.
- The package should not teach agents to maintain arbitrary user diagrams over time unless the
  immediate task is creation or repair.
- The package should not become a Mermaid renderer, editor, or CLI replacement.
- Harness-specific packaging should not fork the skill content into divergent copies.

## Design guardrail

If a change does not improve diagram creation, diagram repair, or the maintainer agents' ability to
keep those capabilities current, it probably does not belong in this repository.
