# Mermaid skill gauntlet

The gauntlet is the lightweight M2 runner for the eval-driven maintenance plan. It uses Pi subagents
and existing package scripts instead of a custom eval service.

## Roles

- `mermaid-skill-only-consumer`: a tool-limited, fresh-context consumer. It receives the scenario,
  criteria, and selected skill package context in the prompt. It should not read the repo, use web
  docs, or edit files.
- `mermaid-gauntlet-judge`: a review-only judge. It may read run artifacts and run deterministic
  Mermaid validation, but it must not edit files.

Ralph/Wiggum is not a role here. If used later, it should wrap or re-invoke the skill-only consumer.

## Local run shape

Use `gauntlet-runs/<run-id>/` for local artifacts. The directory is intentionally gitignored unless
a run is important enough to summarize in a PR.

```text
gauntlet-runs/<run-id>/
  task.md
  answer.md
  validation.log
  judge.md
  manifest.json
```

## Manual Pi procedure

1. Pick one scenario from `docs/eval-backlog.md` or an existing `evals/<scenario>/` directory.
2. Create `gauntlet-runs/<run-id>/task.md` with:
   - the user task;
   - the scenario criteria;
   - the relevant skill package context from `skills/mermaid-diagrams/`.
3. Run the consumer in a fresh context and save only its answer:

   ```text
   /run mermaid-skill-only-consumer[output=gauntlet-runs/<run-id>/answer.md] @gauntlet-runs/<run-id>/task.md
   ```

4. Run deterministic syntax validation when a Mermaid block should parse:

   ```bash
   node scripts/validate-mermaid-examples.mjs --file gauntlet-runs/<run-id>/answer.md --parse \
     > gauntlet-runs/<run-id>/validation.log 2>&1
   ```

5. Run the judge and save its report:

   ```text
   /run mermaid-gauntlet-judge[output=gauntlet-runs/<run-id>/judge.md] \
     "Judge gauntlet-runs/<run-id>/task.md, answer.md, and validation.log."
   ```

6. If the judge fails the answer, patch durable skill knowledge first: a focused reference, repair
   playbook entry, creation pattern, renderer caveat, router change, or eval scenario. Then rerun
   the same scenario.

## Anti-cheat controls used now

- The consumer agent uses `inheritProjectContext: false`, `inheritSkills: false`,
  `defaultContext: fresh`, `maxSubagentDepth: 0`, and only the harmless `contact_supervisor` tool.
- The judge is read/bash only and review-only by prompt.
- Local run artifacts stay outside git by default.

If this proves insufficient, add a tiny project-local Pi extension to block forbidden tool calls or
paths. Do not build a larger harness until these native controls fail in practice.

## Initial proof run

The first local proof used `evals/class-package-model` to close the `class-create-coverage` backlog
item.

- Consumer: `mermaid-skill-only-consumer` with only the `contact_supervisor` tool.
- Judge: `mermaid-gauntlet-judge` with `read`, `bash`, and `contact_supervisor`.
- Local run directory: `gauntlet-runs/class-package-model-local/`.
- Parser evidence: `Mermaid example validation passed (1 example, parser enabled).`
- Judge result: `pass`; syntax, semantics, renderer/safety, and claim discipline all passed.

The local run artifacts are gitignored. This repository commits the scenario, agent definitions, and
run procedure; PRs should summarize local run evidence when it matters for review.
