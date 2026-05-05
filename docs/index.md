# Mermaid.js for Agents documentation

Mermaid.js for Agents is a portable context package that teaches AI coding agents to create and
repair Mermaid.js diagrams. It ships one canonical Agent Skill, Tessl tile metadata, Claude and
Codex plugin metadata, Pi package metadata, quality rules, eval scenarios, and self-maintenance
automation.

## What a fresh user can do after reading

Install the package into their preferred agent harness, ask for a Mermaid diagram or repair, and
understand how maintainer agents keep the skill fit for purpose.

## Installation paths

- Tessl: publish or install the root tile after replacing the placeholder Tessl workspace in
  `tile.json` with a workspace you control.
- Pi: install this repo as a Pi package, or use the included project settings during local
  development.
- Claude Code: load the repo as a plugin or copy the skill directory into a Claude skills location.
- Codex: load the repo as a plugin marketplace entry or copy the skill directory into a Codex skills
  location.

See `docs/install.md` for command examples.

## Maintenance model

The deterministic updater reads Mermaid's GitHub release and source tree metadata, refreshes the
upstream evidence reference, and validates Mermaid examples. GitHub Actions handles routine checks.
GitHub Agentic Workflows provide the semantic maintenance layer: maintainer agents inspect upstream
changes and repository feedback, then propose skill/reference/eval updates that improve Mermaid
creation and repair.

See `docs/maintenance.md`, `docs/agentic-workflows.md`, `docs/eval-driven-maintenance-plan.md`, and
`docs/gauntlet.md` for details.
