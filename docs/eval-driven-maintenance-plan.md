# Eval-driven skill maintenance plan

## Reader and post-read action

This plan is for future maintainers, maintainer agents, and harness implementers. After reading it,
they should be able to evolve Mermaid.js for Agents from upstream-evidence review into a simple,
repeatable behavioral fitness loop for the create/repair skill.

## The grain of the wood

This repository already has the right primitives:

- one canonical Mermaid skill;
- human-readable references and repair playbooks;
- Tessl-style eval scenario directories;
- deterministic upstream evidence;
- parser-backed Mermaid validation;
- package scripts and CI;
- GitHub Agentic Workflows for PR-producing maintenance;
- Pi as an optional local orchestration layer.

The maintenance loop should use those primitives instead of inventing a second platform. JSON is for
small generated indexes and machine gates. Markdown remains the source of explanation, judgment, and
maintainer context.

The same applies to external tooling: use the platform features first, then add the smallest missing
piece. Do not build a custom PR writer, model router, firewall, loop runner, or eval service while
GitHub Agentic Workflows, Pi, Ralph, Claude Code, Tessl, and the existing package scripts already
cover most of that ground.

## External capabilities to lean on

| Need                              | Use                                                                                                                                                                                                                             | Thin repo work                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario format and skill scoring | Tessl evals already use `capability.txt`, `task.md`, and `criteria.json`; Tessl can generate scenarios, run agents with and without the skill, and expose result JSON.                                                          | Keep local eval metadata small enough for discovery. Use Tessl for published scorekeeping, not for every adversarial harness detail.          |
| Mermaid syntax checks             | Existing parser-backed validation already uses Mermaid and jsdom.                                                                                                                                                               | Reuse it as the deterministic syntax leg of the judge. Add `--stdin` or file inputs where needed rather than writing another parser wrapper.  |
| Scheduled maintenance PRs         | GitHub Agentic Workflows already provide custom agents, tool allowlists, network policy, timeouts, read-only permissions, safe-output PR creation, protected-file handling, and audit artifacts.                                | Feed the workflow a generated backlog and require PR summaries to cite backlog IDs. Do not hand-roll PR creation.                             |
| No-web / no-upstream-docs runs    | GitHub Agentic Workflows can omit web tools and set `network: {}` or a narrow allowlist. Claude Code has permission rules and hooks. Pi extensions can block tool calls or sandbox bash.                                        | Configure the runner first. Add a tiny project-local guard only if the existing controls cannot express the rule.                             |
| Role orchestration                | Pi subagents support fresh contexts, chains, per-role model overrides, output files, async runs, control events, and worktree isolation.                                                                                        | Define small project agents or chains for Challenger, skill-only Consumer, Judge, and Maintainer instead of writing a controller service.     |
| Iteration loop                    | Ralph/Wiggum already provides context-reset loops, max iterations, completion markers, progress files, hooks, logs, and ACP adapters for supported CLIs. Claude's Ralph plugin provides a Stop-hook version inside Claude Code. | Use Ralph where it fits. If the first gauntlet is single-shot, use a Pi chain first and avoid loop machinery until a loop is actually needed. |
| Model routing                     | Pi supports custom OpenAI-compatible providers and per-agent model overrides. GitHub Agentic Workflows/Copilot can use BYOK endpoints after validation.                                                                         | Treat DeepSeek or other cheap providers as configurable runners, not product dependencies.                                                    |
| Audit trail                       | GitHub Agentic Workflows upload agent, activation, firewall, detection, and safe-output artifacts. Ralph can write logs. Pi subagents can save output files.                                                                    | Store only the human-readable evidence needed for review; avoid duplicating platform logs.                                                    |

## What remains custom

Only four pieces are truly repo-specific:

1. Discovering Mermaid-specific coverage gaps from upstream evidence, coverage notes, eval metadata,
   and skill claims.
2. Turning one gap into one good create/repair/caveat scenario.
3. Judging Mermaid-specific semantics: diagram type fit, required entities and edges, renderer
   caveats, safety, and claim discipline.
4. Patching durable skill knowledge when a weak-agent failure reveals a missing move.

Everything else should be delegated to existing tools unless there is evidence that the tool cannot
express the need.

## Problem

The current maintenance model can refresh upstream evidence and ask a maintainer agent to review
changes, but it does not define the next behavioral frontier. That leaves the agent with vague work:
“review Mermaid changes,” “improve parity,” or “update evals if needed.”

The real maintenance question is sharper:

> What Mermaid create/repair scenario would an ordinary downstream agent fail today, and what
> durable skill knowledge would make it pass tomorrow?

## Principle

Use upstream Mermaid as raw material, but let eval failures define what the skill must teach.

The target is not perfect documentation parity. The target is measurable create/repair capability:
low-context agents using only this skill should pass an expanding Mermaid scenario frontier.

## Non-goals

- Do not mirror the full Mermaid documentation tree.
- Do not create a large custom eval platform before the first loop works.
- Do not treat parser validity as sufficient semantic success.
- Do not let one agent invent, weaken, and pass its own tests.
- Do not couple the loop to one model vendor.
- Do not duplicate platform controls that GitHub Agentic Workflows, Pi, Claude Code, Ralph, or Tessl
  already provide.

## The loop

```text
find a gap
  → turn it into one scenario
  → run a constrained weak agent using only the skill
  → judge syntax, semantics, renderer caveats, safety, and claim discipline
  → patch durable skill knowledge
  → rerun until it passes or is explicitly deferred
```

Every failure should become one of:

- a reference improvement;
- a repair-playbook entry;
- a creation pattern;
- a renderer or safety caveat;
- a router change;
- a new or improved eval.

If a failure does not produce durable knowledge, the loop is just benchmarking.

## Minimal artifacts

Keep artifacts small enough that a maintainer can read them in a PR.

### 1. Eval metadata lives with existing evals

Do not create a separate registry if the scenario already has a directory. Add a small metadata
block to each scenario's existing criteria file or a sibling metadata file.

Useful fields:

- diagram type;
- task mode: create, repair, choose, caveat, validate, or safety;
- risk area: syntax, semantics, renderer support, security, beta syntax, or overclaiming;
- renderer target when relevant;
- difficulty.

This metadata is not the eval. It is just enough for discovery to know what is already covered.

### 2. Eval opportunities are a generated backlog

The discovery script should produce:

- a compact machine-readable backlog;
- a human-readable Markdown backlog.

Each opportunity only needs enough structure to rank and act:

```json
{
  "id": "flowchart-repair-labeled-edge",
  "priority": "P1",
  "gap": "Core flowchart repair lacks coverage for labeled edge syntax.",
  "evidence": ["upstream:flowchart", "evals:flowchart-create-only"],
  "next": "Add one repair scenario for mislabeled or malformed flowchart edges."
}
```

That is enough. The backlog is generated evidence, not a new source of truth.

Priority rules:

- `P0`: the create/repair promise is unsupported or contradicted.
- `P1`: a core diagram type lacks create or repair coverage.
- `P2`: beta, renderer-sensitive, or security-sensitive behavior lacks caveat coverage.
- `P3`: release note, issue, or skill claim deserves coverage but is not urgent.

### 3. Weak-agent runs are ordinary files

A local gauntlet run should produce a small directory of human-readable evidence:

```text
gauntlet-runs/<run-id>/
  task.md
  answer.md
  judge.md
  validation.log
  manifest.json
```

Only `manifest.json` needs to be machine-readable. It can stay tiny:

```json
{
  "opportunity": "flowchart-repair-labeled-edge",
  "scenario": "repair-labeled-edge-flowchart",
  "status": "fail",
  "rerunRequired": true
}
```

The important evidence is in `answer.md`, `judge.md`, and `validation.log`. A maintainer should not
need to decode a large JSON blob to understand what failed.

When the run happens inside GitHub Agentic Workflows, prefer workflow artifacts and the PR body over
committing bulky run output. When the run happens locally through Pi or Ralph, keep artifacts local
unless they explain a PR.

## Judge contract

The judge does not need a complex data model. It needs a clear burden of proof.

A scenario passes only when the judge can point to evidence that:

- the Mermaid block parses, when parser validation is expected;
- the required entities, relationships, labels, and states are present;
- the diagram type fits the user intent;
- renderer caveats or fallbacks are stated when relevant;
- security-sensitive claims are conservative;
- validation claims are backed by current tool output;
- the final answer would help a downstream coding agent.

Allowed outcomes:

- `pass`: all blocking criteria passed with evidence;
- `fail`: at least one blocking criterion failed;
- `inconclusive`: the judge cannot decide, and this does not count as pass;
- `deferred`: an explicit product decision explains why the scenario is not being pursued now.

Deterministic checks win over LLM judgment. An LLM judge may assess semantics, but it cannot bless a
parser failure unless the scenario is explicitly about unsupported syntax and the answer gives the
right caveat.

## Role separation

Keep the roles separate even if the first implementation runs them manually. Ralph is not one of
these roles; Ralph/Wiggum is an optional loop runner or plugin that can re-invoke the consumer.

- **Challenger** selects a gap and frames one hard scenario.
- **Skill-only consumer** attempts the scenario using only the skill.
- **Judge** evaluates the answer against parser output and scenario criteria.
- **Maintainer** patches durable skill knowledge, then reruns the scenario.

The maintainer may decide a scenario is wrong, but that decision must be visible in the PR. Failed
attempts should be preserved until the fix is reviewed.

## Anti-cheat strategy

Anti-cheat should be layered configuration, not a bespoke security system.

Start with the cheapest controls:

1. **Tool shape:** give the weak consumer no edit/write tools and no web tools. Let it write only an
   answer artifact if the runner supports output files.
2. **Fresh context:** run the weak consumer in a fresh Pi subagent, Ralph iteration, or isolated
   Claude session so it does not inherit maintainer research.
3. **Network boundary:** for GitHub Agentic Workflows, use `network: {}` or a narrow allowlist. For
   Pi, use a sandboxed bash extension or no bash at all. For Claude Code, use permissions and hooks.
4. **Filesystem boundary:** use read-only skill input where the runner supports it. Otherwise block
   edits to skill, reference, eval, workflow, and configuration directories with a Pi extension or
   Claude hook.
5. **Budget boundary:** set max iterations, tool timeouts, and workflow timeouts at the runner
   level.

Only add a custom guard after those controls are insufficient. If a custom guard is needed, make it
a small project-local adapter around the runner's native mechanism:

- Pi: `tool_call` blocker, protected-path extension, or sandbox config.
- Claude Code: permission rules plus `PreToolUse` or `Stop` hooks.
- GitHub Agentic Workflows: tools allowlist, network policy, safe outputs, and artifact audit.
- Ralph: max iterations, completion marker, progress files, lifecycle hooks, and adapter
  permissions.

The weak consumer should not need upstream Mermaid docs. It should receive the task, the criteria,
and the installed skill package. The judge and maintainer may use upstream evidence, but their
outputs must distinguish evidence from instructions.

## GitHub, Pi, Ralph, and Tessl boundary

The committed repo stays the source of truth.

- **GitHub Agentic Workflows** run scheduled maintenance, open PRs, enforce read-only agent
  permissions plus safe outputs, and leave audit trails.
- **Pi** runs richer local or optional CI gauntlets with subagents, fresh contexts, per-role models,
  output files, and optional guard extensions.
- **Ralph/Wiggum** runs longer context-reset loops when repeated iterations are useful. It should
  not be required for the first single-scenario gauntlet.
- **Claude Code hooks and permissions** are useful when validating the Claude plugin path or using
  the Claude Ralph plugin.
- **Tessl** remains the public skill-eval and scenario-scoring lane. It measures whether the skill
  improves agent performance, but it does not replace local anti-cheat controls.

Anything needed for review must be committed, uploaded as a workflow artifact, or summarized in the
PR. Hidden local runner state does not count as evidence.

## Model strategy

Keep the model policy boring:

- cheap OpenAI-compatible or BYOK models for discovery and weak-agent attempts;
- stronger models for difficult semantic judging or maintainer synthesis;
- deterministic tools for parser and packaging checks;
- fallback to the default GitHub-hosted model until any custom provider is proven.

DeepSeek V4 Pro or Flash is a good candidate because the public API is OpenAI/Anthropic compatible,
supports tool calls and streaming, and is cost-attractive for repeated maintenance loops. Treat it
as a candidate provider, not a product dependency. Validate it manually before making it the
scheduled default.

## Phased implementation

### M-1: capability proof before custom code

- Confirm which runner will own the first local gauntlet: Pi chain, Ralph CLI, Claude plugin, or
  GitHub Agentic Workflow.
- Prove the runner can restrict tools, network, writes, outputs, and iteration limits well enough
  for one weak-agent attempt.
- Record the command/configuration in docs before implementing any new guard.

Exit criterion: the project knows which platform controls it will reuse and what small gap, if any,
requires custom code.

### M0: metadata and backlog

- Add small metadata to current evals.
- Add deterministic eval-opportunity discovery.
- Generate the compact JSON backlog and Markdown backlog.
- Validate with tests and formatting.

Exit criterion: maintainers can see the next missing coverage items without asking an agent to
invent them.

### M1: maintainer consumes the backlog

- Update maintainer instructions to read the backlog first.
- Require PR summaries to cite backlog IDs or explain why no backlog item changed.
- Add a `fitness frontier update` impact classification.

Exit criterion: scheduled maintenance PRs are tied to explicit frontier movement.

### M2: one weak-agent gauntlet path

- Start with the lightest runner that can enforce the needed constraints.
- Save `task.md`, `answer.md`, `judge.md`, `validation.log`, and a tiny manifest only when those
  files add review value.
- Use existing Mermaid parser validation and package scripts for deterministic evidence.
- Require a rerun after maintainer patches.

Exit criterion: one failing scenario can be reproduced, patched, and rerun with evidence.

### M3: Tessl and marketplace fitness lane

- Run Tessl lint/review/eval once the local scenario set is meaningful.
- Use Tessl scenario generation as candidate input, not as an unquestioned source of truth.
- Compare baseline and with-skill results when publishing or preparing marketplace submissions.

Exit criterion: the public tile has external skill-eval evidence in addition to local gauntlet
evidence.

### M4: cost optimization

- Validate one cheap BYOK or OpenAI-compatible model in a manual run.
- Keep stronger fallback for judging and maintainer synthesis.
- Add budget caps and documented failure behavior.

Exit criterion: routine gauntlet runs are cheap enough to run regularly without weakening the judge.

## Success criteria

This maintenance plan is working when:

- every upstream diagram type has an explicit eval status;
- core diagram types have create and repair coverage;
- beta and renderer-sensitive diagrams have caveat or fallback scenarios;
- release highlights become evals, references, or explicit no-op decisions;
- maintainer PRs cite eval-opportunity IDs;
- weak-agent failures are preserved before fixes when they explain a PR;
- judge output includes syntax, semantics, renderer, safety, and claim-discipline evidence;
- platform controls enforce the boring parts, and custom code stays Mermaid-specific;
- ordinary agents fail less because the skill taught the missing move.
