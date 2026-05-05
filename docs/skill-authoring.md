# Skill authoring notes

This package borrows the durable patterns used by Agent Skills and skill-creator style guidance, but
keeps one product promise: help agents create and repair Mermaid.js diagrams.

## Patterns used

- **Required frontmatter**: every skill has a clear `name` and trigger-rich `description`.
- **Router body**: the skill body stays concise and routes agents to focused references.
- **Progressive disclosure**: syntax tables, repair workflows, and upstream evidence notes are
  separate files.
- **XML sections**: major behavioral contracts use explicit tags so agents can scan reliably.
- **Executable helpers**: repeatable maintenance and validation live in scripts instead of prose.
- **Eval scenarios**: the tile includes initial Tessl-compatible scenarios so create/repair quality
  can be measured.

## When to edit the skill body

Edit the skill body when activation behavior or high-level workflow changes. For ordinary Mermaid
syntax changes, update references first.

## When to add a reference

Add a new reference when guidance is too detailed for the router or when a diagram family needs more
than a short table row.

## Review rule

A skill update is not complete until:

- skill lint passes;
- Mermaid examples validate;
- docs explain any new installation or maintenance behavior;
- the update has a Changeset if users should notice it.
