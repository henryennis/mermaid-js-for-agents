# Remediation plan after stakeholder audit

Date: 2026-05-05 Input: `docs/stakeholder-audit.md` Planning method: five fresh-context subagents
produced lane-specific plans for installer/harness integration, upstream automation, Mermaid
validation/evals, OSS/security/marketplace readiness, and sequencing risk. This document is the
parent-agent synthesis.

## Goal

Move `mermaid.js-for-agents` from private beta/pre-release candidate to credible public package by
fixing the audit blockers before adding more market-facing polish.

Primary rule: **do not strengthen public claims until the evidence exists**. Installer safety,
harness proof, parser validation, immutable upstream evidence, and runnable self-maintenance come
first.

## Execution model

### Parent/orchestrator responsibilities

The parent agent owns sequencing, final edits to shared docs/metadata, validation, and merge
decisions. Subagents should be used for focused work only.

Use subagents in three ways:

1. **Planner/research subagents** for unclear external schemas such as Claude plugin fields, Tessl
   tile metadata, GitHub Agentic Workflow compilation, and Mermaid upstream internals.
2. **Worker subagents** only when file ownership is non-overlapping and the requested changes are
   implementation-ready.
3. **Reviewer subagents** after each lane lands to perform adversarial checks against the original
   audit items.

This repository is currently not a git repository, so `subagent(..., worktree: true)` is not
available yet. Until git is initialized and clean, avoid multiple writer subagents touching the same
checkout. If parallel implementation is desired, initialize git first and use isolated worktrees for
writer lanes.

## Decision gate: answer before public-readiness work

These decisions block final metadata and release docs:

1. Final GitHub owner/repo.
2. Final npm package name/scope.
3. Final Tessl workspace/package identity.
4. Real CODEOWNERS users/teams.
5. Security contact and vulnerability SLA.
6. Claude plugin strategy: verified manifest skill pointer vs self-contained
   `.claude-plugin/skills/` copy.
7. GitHub Agentic Workflow strategy: compile and commit runnable artifact now, or soften claims
   until platform setup is available.
8. Automation token strategy: GitHub App/PAT for bot PRs vs documented `GITHUB_TOKEN` limitations.

Safe default while decisions are pending: keep README/docs positioned as **private beta /
pre-release candidate**.

## P0: blockers before public announcement

### Lane A — Installer and harness safety

Audit items: A1, A2, A14

Owner: one worker subagent or parent as sole writer.

Files owned by this lane:

- `scripts/install-local.mjs`
- `tests/install-local.test.mjs` (new)
- `scripts/validate-harness-manifests.mjs` (new)
- `tests/validate-harness-manifests.test.mjs` (new)
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`
- `.pi/settings.json` only if path conventions change

Tasks:

1. Refactor installer to resolve package root from `import.meta.url`, not `process.cwd()`.
2. Require explicit `--target <dir>` for local installation.
3. Add `--force` and `--help`.
4. Only replace owned symlinks by default; refuse to clobber real files/directories or foreign
   symlinks.
5. Merge `.pi/settings.json` instead of overwriting it.
6. Add deterministic backup behavior for `--force`.
7. Add tempdir tests for all destructive cases.
8. Add manifest/pack smoke validator for Pi, Claude, Codex, Tessl tile, and generic package paths.
9. Validate or correct Claude and Codex skill path resolution.

Validation gate:

```bash
npm test -- tests/install-local.test.mjs
npm test -- tests/validate-harness-manifests.test.mjs
node scripts/validate-harness-manifests.mjs
node scripts/validate-harness-manifests.mjs --pack
npm run check
```

Stop conditions:

- Stop if Claude plugin schema cannot be verified. Do not invent unsupported manifest fields.
- Stop if `npm pack --dry-run` omits required dot-directory plugin files.
- Do not run the installer against real user projects until tempdir safety tests pass.

### Lane B — Upstream evidence and self-maintenance integrity

Audit items: A3, A4, A8, A10, A11

Owner: one worker subagent for updater code; one workflow/security worker after updater schema
stabilizes.

Files owned by this lane:

- `scripts/update-mermaid-reference.mjs`
- `tests/update-mermaid-reference.test.mjs` (new)
- `data/mermaid-upstream.json`
- `skills/mermaid-diagrams/references/upstream-evidence.md`
- `docs/maintenance.md`
- `docs/agentic-workflows.md`
- `.github/workflows/mermaid-skill-maintenance.md`
- `.github/agents/mermaid-skill-maintainer.md`
- `.github/workflows/upstream-sync.yml`
- `THIRD_PARTY_NOTICES.md` (new)

Tasks:

1. Stop using `/releases/latest` blindly. Select the latest stable tag matching `^mermaid@x.y.z$`.
2. Resolve that release tag to an immutable tag/commit SHA.
3. Fetch docs/diagram metadata from the immutable release ref, not `develop`.
4. If canary tracking is kept, write it as a separate “develop/canary evidence” section and label it
   unreleased.
5. Regenerate data/Markdown with release evidence, canary evidence, snapshot hash, and attribution.
6. Add no-network unit tests for release selection, ref resolution, Markdown rendering, and no
   `develop` release mixing.
7. Add `THIRD_PARTY_NOTICES.md` for Mermaid upstream docs/release excerpts.
8. Harden agentic workflow source with prompt-injection warnings and required PR audit metadata.
9. Compile and commit the GitHub Agentic Workflow artifact, or soften all “self-maintaining” claims
   to “workflow source included.”
10. Split upstream-sync permissions so install/check runs read-only and PR creation runs separately.

Validation gate:

```bash
npm run generate
npm run generate # second run should be no-op
npm test -- tests/update-mermaid-reference.test.mjs
npm run lint:workflows
npm run check
```

If compiling workflow artifacts:

```bash
gh extension install github/gh-aw
npm run agentic:compile
git diff --exit-code -- .github/workflows
```

Stop conditions:

- Stop if `gh aw compile` tooling is unavailable; soften claims instead of pretending the workflow
  runs.
- Stop if release tag dereference cannot be made deterministic.

### Lane C — Parser validation, coverage matrix, and evals

Audit items: A5, A6, eval portions of A7

Owner: one worker subagent after Lane B’s release evidence model is stable.

Files owned by this lane:

- `scripts/validate-mermaid-examples.mjs`
- `tests/validate-mermaid-examples.test.mjs`
- `skills/mermaid-diagrams/SKILL.md`
- `skills/mermaid-diagrams/references/coverage-matrix.md` (new)
- `skills/mermaid-diagrams/references/diagram-types.md`
- `skills/mermaid-diagrams/references/syntax-cheatsheet.md`
- `skills/mermaid-diagrams/workflows/create-diagram.md`
- `skills/mermaid-diagrams/workflows/repair-diagram.md`
- `evals/**`
- `package.json` / `package-lock.json` for Mermaid parser dependency and scripts

Tasks:

1. Add parser-backed validation. Preferred: dev dependency on the tracked Mermaid release, e.g.
   exact `mermaid@11.14.0`, if audit is clean.
2. Split commands into static and parser modes:
   - `validate:mermaid:static`
   - `validate:mermaid:parse`
   - `validate:mermaid` as parser-backed CI mode
3. Extend validator with `--stdin` and repeatable `--file <path>`.
4. Add tests for valid/invalid parser cases, Markdown fences, `.mmd` files, stdin, and static
   starter failures.
5. Create a diagram-type coverage matrix covering every advertised type and every upstream diagram
   source directory.
6. Mark each type as `supported`, `beta`, `fallback only`, `needs research`, or
   `internal/not user-facing`.
7. Add one minimal parser-verified snippet per supported/beta type.
8. Add evals for stable major types, repair traps, renderer fallback, beta caveats, unsafe
   rendering, and validation honesty.
9. Update docs so package example validation is not confused with validating arbitrary generated
   diagrams.

Validation gate:

```bash
npm ci
npm run validate:mermaid:static
npm run validate:mermaid:parse
printf 'flowchart TD\nA-->B\n' | node scripts/validate-mermaid-examples.mjs --stdin --parse
npm test -- tests/validate-mermaid-examples.test.mjs
npm run check
```

Stop conditions:

- Stop if adding `mermaid` reintroduces known audit vulnerabilities; either pin a safe version or
  document parser validation as optional until upstream fixes are available.
- Do not claim support for diagram types whose syntax is not parser-verified.

### Lane D — Release, supply chain, and security hardening

Audit items: A8, A9, A12, A13, A15

Owner: one workflow/security worker, but serialize with Lane B because both touch
`.github/workflows/*`.

Files owned by this lane:

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/upstream-sync.yml`
- `.github/dependabot.yml`
- `.github/CODEOWNERS`
- `SECURITY.md`
- `SUPPORT.md`
- `.github/ISSUE_TEMPLATE/config.yml` (new)
- `package.json`
- `scripts/prepare-husky.mjs` (new)
- `commitlint.config.mjs`
- `CONTRIBUTING.md`

Tasks:

1. Split workflow permissions by job: read-only checkout/install/check first, write/OIDC only in
   publish/PR jobs.
2. Pin GitHub Actions to full commit SHAs and keep Dependabot action updates enabled.
3. Add SBOM generation, preferably CycloneDX or SPDX.
4. Upload SBOM in CI/release and add dependency review/audit gates.
5. Add concrete vulnerability reporting channel and SLA.
6. Replace placeholder CODEOWNERS after user provides owner/team.
7. Expand commitlint scopes to match real repo areas.
8. Replace `husky || true` with deterministic prepare script.

Validation gate:

```bash
npm run check
npm run sbom
npm run audit:ci
printf 'chore(security): update policy\n' | npx commitlint
npm pack --dry-run
```

Stop conditions:

- Stop before setting CODEOWNERS without real GitHub users/teams.
- Stop before enabling blocking audit gates if the current dependency tree has unresolved
  advisories.

## P1: marketplace and docs reconciliation

Run this only after P0 lanes pass. It should be one serial docs/metadata pass to avoid conflicts.

Owner: parent or one docs worker subagent.

Files likely touched:

- `README.md`
- `docs/index.md`
- `docs/install.md`
- `docs/architecture.md`
- `docs/product-intent.md`
- `tile.json`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`
- `evals/README.md` (new)

Tasks:

1. Align public posture with evidence: private beta until P0, public-ready only after gates pass.
2. Add consumer-first Tessl install/enable/use docs.
3. Add final namespace/package metadata once user decides identity.
4. Add marketplace assets/examples if supported by Tessl schema.
5. Replace seed-eval language with a coverage/threshold story after eval expansion.
6. Document validated harness versions and smoke-test results.

Validation gate:

```bash
npm run check
tessl skill lint .
tessl skill review .
tessl eval run .
```

If Tessl CLI is unavailable, document that as a launch blocker rather than claiming Tessl
validation.

## P2: enterprise readiness

Run after P0/P1, or in parallel as design-only work.

Tasks:

1. Protected release environment and trusted publishing configuration.
2. GitHub App automation token setup for bot PRs that need CI.
3. Branch protection/CODEOWNER review requirements.
4. Dependency review policy and vulnerability baseline.
5. Agentic workflow PR checklist enforcement.
6. Release attestation/SBOM publication.

Validation gate:

- Successful CI on a bot-generated PR.
- Release dry run or Changesets version PR without publishing.
- SBOM artifact present in workflow output.
- Security policy reviewed by human maintainer.

## Safe parallelization plan

### Can run in parallel now as planning/research only

- Claude plugin schema research.
- Tessl tile/marketplace metadata research.
- GitHub Agentic Workflow compile research.
- Mermaid parser dependency/audit research.
- SBOM tooling comparison.

### Can run in parallel as implementation after git/worktree setup

Only after `git init` and a clean baseline commit, use isolated worktrees for:

1. Lane A installer/harness implementation.
2. Lane B upstream evidence implementation.
3. Lane C validation implementation, but only after Lane B defines the release evidence schema.
4. Lane D release/security implementation, but not concurrently with Lane B workflow edits.

### Do not parallelize

- `README.md` and `docs/install.md` edits across multiple lanes.
- `package.json` / `package-lock.json` edits across multiple lanes.
- `.github/workflows/*` edits across Lane B and Lane D.
- Coverage/eval expansion before upstream evidence is release-grounded.
- Public marketplace copy before installer, validation, and harness proof exist.

## Recommended subagent staffing

### Phase 1: research and implementation briefs

Run in parallel:

- `researcher`: Claude plugin schema and tested skill packaging path.
- `researcher`: Tessl tile/package marketplace metadata and eval requirements.
- `researcher`: GitHub Agentic Workflow compile artifact shape and CLI commands.
- `researcher`: Mermaid parser validation APIs and dependency security posture.
- `researcher`: SBOM tooling for npm packages.

### Phase 2: P0 implementation

If git/worktrees are available:

- `worker` in worktree A: installer + harness validator.
- `worker` in worktree B: upstream release evidence updater + tests.
- `worker` in worktree C: parser validation + tests, after B’s schema is known.
- `worker` in worktree D: workflow/security hardening, serialized with B for workflow files.

If git/worktrees are not available:

- Use only one writer at a time.
- Use subagents as reviewers/planners, not concurrent writers.

### Phase 3: review

After each lane:

- `reviewer`: adversarially check that lane against the matching audit items.
- `security-review`: review workflow permissions, installer safety, and supply-chain changes.
- `test` or parent: run targeted validation and full `npm run check`.

## Milestone checklist

### M1: Safe private beta

- [ ] Installer cannot clobber user files/config.
- [ ] Harness manifests validate from package/tarball.
- [ ] README/docs say private beta unless claims are proven.
- [ ] `npm run check` passes.

### M2: Upstream-aligned beta

- [ ] Upstream evidence uses immutable release refs.
- [ ] Canary/develop evidence is separate or absent.
- [ ] Third-party notices are present.
- [ ] Agentic workflow is compiled or claims are softened.
- [ ] Upstream sync is idempotent and least-privilege.

### M3: Public marketplace candidate

- [ ] Parser-backed Mermaid validation runs in CI.
- [ ] Coverage matrix accounts for all advertised/upstream diagram types.
- [ ] Expanded eval suite exists with documented thresholds.
- [ ] Tessl consumer install/use docs are present.
- [ ] Final package identity and CODEOWNERS are set.

### M4: Enterprise-ready release candidate

- [ ] Workflow actions are SHA-pinned.
- [ ] SBOM and dependency review are in CI/release.
- [ ] SECURITY.md has concrete contact/SLA.
- [ ] Release workflow uses protected/trusted publishing path.
- [ ] Bot PR CI behavior is proven.

## Next recommended action

Before editing implementation files, initialize a git repository and commit the current audited
baseline. Then run the Phase 1 research subagents in parallel for the four uncertain external
interfaces: Claude plugin schema, Tessl metadata/evals, GitHub Agentic Workflow compile output, and
Mermaid parser validation/security.
