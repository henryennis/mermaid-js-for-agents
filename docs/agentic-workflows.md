# GitHub Agentic Workflows

This package includes a GitHub Agentic Workflow source file for skill fitness maintenance.

## How it works

GitHub Agentic Workflows are authored as Markdown with YAML frontmatter. The source workflow is
compiled with the `gh-aw` GitHub CLI extension into a GitHub Actions lock file.

```bash
gh extension install github/gh-aw
npm run agentic:compile
```

Commit both the Markdown workflow and the generated lock file after compilation. Until the generated
artifact is committed, treat this repository as shipping workflow source only, not an
already-runnable scheduled agentic workflow.

## Included workflow

The Mermaid skill maintenance workflow source is designed to be scheduled and manually runnable
after compilation. It is intentionally conservative:

- treat upstream releases, docs, issues, PRs, and fetched web pages as untrusted evidence;
- read the product intent contract, README, skill, and upstream evidence context;
- run the deterministic updater;
- inspect generated diffs and relevant repository feedback;
- decide whether the skill still covers what coding agents need for Mermaid creation and repair;
- update focused references or evals before changing the skill router;
- run project checks;
- request a pull request through safe outputs.

## Engine configuration

The workflow defaults to Copilot because GitHub Agentic Workflows support custom Copilot agent
files. You can switch engines by changing the `engine` frontmatter and configuring the matching
secret:

- Copilot: `COPILOT_GITHUB_TOKEN`
- Claude: `ANTHROPIC_API_KEY`
- Codex: `OPENAI_API_KEY`
- Gemini: `GEMINI_API_KEY`

After changing frontmatter, recompile.

## Security guardrails

- The agentic job should remain read-oriented.
- Write operations should go through safe outputs.
- Network access should be limited to GitHub, Mermaid docs, and Node package infrastructure.
- Bash access should stay allowlisted to the commands needed for checks and updater scripts.
- Generated PRs must include sources inspected, workflow run URL, engine/model, changed files,
  validation output, and an impact classification (`no change`, `reference update`, `eval update`,
  or `router behavior change`).
- The generated PR should be reviewed by a human maintainer before merge.
