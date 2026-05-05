# Install Mermaid.js for Agents

This guide is for maintainers who want the Mermaid skill available in a local agent harness or
published as a reusable package.

## Prerequisites

- Node.js 20.18 or newer.
- A checked-out copy of this package.
- The target agent CLI if you want harness-specific installation.
- Tessl CLI and access to the `henry` Tessl workspace if you want to publish the Tessl tile.

## Local development

```bash
npm install
npm run install:local -- --target .
npm run check
```

`install:local` requires an explicit target directory. It creates project-local authoring links for
harnesses that scan Agent Skills directories and merges a Pi project settings file that loads the
package skill. It does not mutate global Pi, Claude, or Codex settings. Existing user-owned files
are left untouched unless you pass `--force`, which backs them up before replacing them.

## Tessl tile

1. Validate the skill and tile against the `henry` Tessl workspace.
2. Publish privately first, then make it public once evals are meaningful.

```bash
tessl skill lint .
tessl skill review skills/mermaid-diagrams
tessl scenario generate . --count=5 --workspace=henry
tessl scenario download --last
tessl eval run .
tessl skill publish . --workspace henry
```

## Pi

During local development, Pi can load the project skill through the included project settings. To
install into the current project instead of global Pi settings, prefer:

```bash
pi install ./ -l
```

For a published npm package:

```bash
pi install npm:mermaid-js-for-agents
```

## Claude Code

During plugin development, test from a clean checkout or package tarball:

```bash
claude --plugin-dir .
```

The Claude plugin manifest is metadata; the portable skill lives at package-root
`skills/mermaid-diagrams/SKILL.md`. Before public launch, record the tested Claude Code version and
confirm that the skill is discovered from this layout.

## Codex

Codex can consume the skill directly from Agent Skills locations or as a plugin. The included plugin
manifest points Codex at the package skill directory.

For repo-local marketplace testing, use the included marketplace entry from the package root and
restart Codex so it rescans plugin sources. The Codex manifest currently treats `skills` as
package-root relative; `npm run lint:harnesses` checks that the referenced path exists.

## Verification

After installing in any harness, ask:

```text
Use the Mermaid diagrams skill to create a flowchart for a docs update moving from draft to review to publish.
```

The response should include a fenced Mermaid block and a brief assumptions note.
