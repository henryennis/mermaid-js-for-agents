# Adversarial stakeholder audit

Date: 2026-05-05 Scope: current repository state for `mermaid.js-for-agents`. Method: six
fresh-context Pi subagents simulated adversarial stakeholders and performed review-only audits.
Personas covered Claude/Claude Code adoption, Tessl marketplace review, Pi/Codex harness
integration, Mermaid upstream alignment, OSS release engineering, and enterprise
security/compliance.

## Executive verdict

The package has a strong foundation, clear product intent, useful Mermaid creation/repair guidance,
and passing local checks. It is **not yet ready to market as production-grade or public
marketplace-ready**.

The strongest concerns are not about the core skill concept. They are about launch-readiness claims,
installer safety, unproven harness integration, shallow Mermaid validation, incomplete upstream
tracking, and missing operational hardening for self-maintaining GitHub Agentic Workflows.

Recommended public-readiness label today: **private beta / pre-release candidate**.

## Simulated stakeholder verdicts

| Stakeholder                      | Verdict                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Claude/Claude Code skill adopter | Promising, but not adoptable tomorrow without validated Claude install and stronger diagram validation.                  |
| Tessl marketplace reviewer       | Not ready for public marketplace submission; identity, consumer docs, evals, and marketplace metadata need work.         |
| Pi/Codex harness integrator      | Core files are healthy, but local installer and manifest path assumptions are too risky for broad use.                   |
| Mermaid upstream maintainer      | Current approach is metadata sampling plus manual review, not trustworthy release parity.                                |
| OSS release engineer             | Checks pass, but ownership, release, CI, and package-publishing hardening are incomplete.                                |
| Enterprise security reviewer     | Suitable only for controlled internal evaluation until workflow permissions, SBOM, and agentic guardrails are tightened. |

## Blockers before public launch

### A1. Local installer can clobber user project state

Severity: **Critical**

Evidence:

- `scripts/install-local.mjs` removes existing `.agents/skills/mermaid-diagrams` and
  `.claude/skills/mermaid-diagrams` paths.
- It overwrites `.pi/settings.json` instead of merging settings.
- It uses `process.cwd()` as the root, so running it from the wrong directory could mutate the wrong
  project.

Concern: a package marketed to agent harness users must not delete or overwrite unrelated local
configuration.

Smallest fix:

- Resolve package root from `import.meta.url`.
- Accept an explicit target project directory.
- Only replace existing paths if they are owned symlinks pointing to this package.
- Merge `.pi/settings.json` instead of overwriting it.
- Add a `--force` mode with backup/confirmation behavior.
- Add tempdir tests for installer safety.

### A2. Claude/Claude Code plugin exposure is not proven

Severity: **Critical**

Evidence:

- `.claude-plugin/plugin.json` is metadata-only and does not declare a skill path.
- README says `claude --plugin-dir .` exposes the skill, but the package does not currently prove
  that path from a clean checkout/tarball.
- Codex has a `skills` pointer; Claude does not.

Concern: Claude-like agents are a primary target audience, so unverified Claude installation
undermines the product promise.

Smallest fix:

- Add a Claude-validated skill pointer or package a self-contained Claude plugin skill directory.
- Document the tested Claude Code/plugin version.
- Add a clean-tarball smoke test or manual validation transcript.

### A3. Self-maintaining Agentic Workflow is not actually runnable as checked in

Severity: **Critical**

Evidence:

- Docs say the GitHub Agentic Workflow Markdown source must be compiled and the generated
  lock/action artifact committed.
- The repo currently contains `.github/workflows/mermaid-skill-maintenance.md`, but no compiled
  workflow/lock artifact.

Concern: README claims maintainer agents run to keep the skill fit for purpose, but the checked-in
repo only contains source instructions for that future automation.

Smallest fix:

- Run the appropriate `gh aw compile`/agentic workflow compile step.
- Commit the generated artifact.
- Add CI that fails when the source and compiled artifact are out of sync.
- Until then, rephrase public claims as “workflow source included; compile/configure before use.”

### A4. Upstream evidence mixes latest release metadata with Mermaid `develop`

Severity: **Critical**

Evidence:

- `scripts/update-mermaid-reference.mjs` fetches the latest release, then fetches docs/diagram
  directories from `ref=develop`.
- The generated evidence presents both as one snapshot: a tracked release plus source branch
  `develop`.

Concern: this can report a released version while sampling unreleased docs/diagram changes, creating
false confidence about upstream parity.

Smallest fix:

- Fetch docs/diagram metadata from the release tag or immutable release commit.
- If canary tracking is desired, separate it into a distinct “develop/head evidence” section.
- Select the latest stable `mermaid@...` release explicitly instead of relying on `/releases/latest`
  in a monorepo.

### A5. Mermaid validation is mostly static, not parser-backed

Severity: **Critical**

Evidence:

- `npm run validate:mermaid` checks starter lines by default.
- Parser validation is optional and requires `mermaid`, which is not installed as a dev dependency.
- The skill currently suggests running package example validation before claiming diagrams are
  valid, but that command does not validate arbitrary generated diagrams.

Concern: the package teaches agents to create diagrams, but CI does not prove examples or generated
outputs parse as Mermaid.

Smallest fix:

- Rename the current mode to “static example scan,” or keep it as a fast precheck.
- Add `--stdin`/`--file` validation for agent-generated diagrams.
- Add Mermaid parser validation to CI, or provide an explicit optional parser profile.
- Add tests with known valid and invalid diagrams.

## High-priority findings

### A6. Mermaid type coverage lags the advertised scope

Severity: **High**

Evidence:

- Upstream evidence lists diagram directories such as `treeView`, `eventmodeling`, `ishikawa`, and
  `venn`.
- The skill router and syntax references do not provide explicit guidance for several of these.
- The skill advertises many diagram families, but examples are uneven across those families.

Concern: users may ask for a supported Mermaid diagram type and get no concrete syntax guidance.

Smallest fix:

- Add a coverage matrix for every advertised diagram type.
- For each type, include status: `supported`, `beta`, `fallback only`, or `needs research`.
- Add one minimal verified snippet per supported type.
- Add eval cases for newly added or high-risk types.

### A7. Tessl marketplace readiness is incomplete

Severity: **High**

Evidence:

- `tile.json` exists, but final Tessl workspace/package identity is still a launch TODO.
- Docs focus on maintainer commands more than consumer installation/use.
- Marketplace metadata and visual assets are thin.
- Evals are explicitly seed scenarios.

Concern: a marketplace reviewer would see a credible prototype, not a polished package listing.

Smallest fix:

- Finalize Tessl namespace and align it across all manifests.
- Add a consumer-oriented Tessl install/enable/usage section.
- Add badges, preview examples, screenshots/assets where supported.
- Add meaningful Tessl eval results and thresholds.

### A8. Automation PRs and release workflows need hardening

Severity: **High**

Evidence:

- Bot PRs created with `GITHUB_TOKEN` may not trigger normal CI workflows.
- Release/upstream workflows grant write/OIDC permissions before install and validation steps.
- Actions are pinned by version tags rather than full commit SHAs.

Concern: self-maintaining automation needs stronger safety boundaries than a normal package repo.

Smallest fix:

- Split validation and publish/write jobs with job-level permissions.
- Use read-only permissions during `npm ci` and checks.
- Use GitHub App/PAT automation token if bot PRs need CI.
- Pin actions to commit SHAs and let Dependabot update them.

### A9. Public ownership and package identity are unresolved

Severity: **High**

Evidence:

- README still calls out final npm scope, Tessl workspace, GitHub owner, and maintainer policy as
  launch tasks.
- CODEOWNERS is placeholder-only.

Concern: this blocks OSS acceptance and undermines trust in release/security ownership.

Smallest fix:

- Choose final GitHub org/repo, npm scope, Tessl workspace, and package name.
- Add real CODEOWNERS.
- Update package metadata, docs, badges, and publish instructions.

## Medium-priority findings

### A10. Agentic workflow prompt-injection and audit controls are underspecified

Severity: **Medium**

Evidence:

- The maintainer workflow can read issues, PRs, web pages, and upstream release content.
- It can edit files and open PRs.
- Docs say human review should happen, but required audit metadata is not fully specified.

Concern: agentic workflows ingest untrusted text and should assume prompt injection.

Smallest fix:

- Document that upstream docs/issues/PRs are untrusted input.
- Require agent-generated PRs to include sources inspected, run URL, model, changed files,
  validation output, and impact classification.
- Ensure the workflow runs without secrets where possible.
- Require CODEOWNER review before merge.

### A11. Upstream attribution/NOTICE is too thin

Severity: **Medium**

Evidence:

- Generated upstream evidence includes Mermaid release-note prose and links.
- The repo has a project license but no third-party attribution/NOTICE entry for Mermaid
  docs/release excerpts.

Concern: generated references should clearly attribute upstream Mermaid content.

Smallest fix:

- Add `NOTICE` or `THIRD_PARTY_NOTICES.md` referencing Mermaid.js, its license, and source URLs.
- Mark generated upstream excerpts as evidence, not original project prose.

### A12. Supply-chain artifacts are incomplete for enterprise adoption

Severity: **Medium**

Evidence:

- npm provenance is configured, but no SBOM/license report artifact is generated.
- Dependency review/audit gating is minimal.

Concern: enterprise consumers increasingly expect SBOM and dependency review artifacts even for
skill/plugin packages.

Smallest fix:

- Generate CycloneDX or SPDX SBOM in CI/release.
- Upload SBOM as a release artifact.
- Add dependency-review and audit checks.

### A13. Security policy needs concrete reporting and SLA details

Severity: **Medium**

Evidence:

- `SECURITY.md` references private vulnerability reporting “if enabled” or maintainer contact, but
  does not give a concrete channel or SLA.

Concern: public OSS packages need clear vulnerability reporting and remediation expectations.

Smallest fix:

- Enable GitHub private vulnerability reporting.
- Add a security contact.
- Define triage, fix, disclosure, and supported-version policy.

### A14. Harness manifest path assumptions need smoke tests

Severity: **Medium**

Evidence:

- Codex plugin uses `"skills": "./skills/"`, while the manifest lives under `.codex-plugin/`.
- Marketplace manifest uses `"path": "./"` without documenting the base directory.
- Tests do not exercise packaging/install path resolution.

Concern: paths may work in one harness and fail in another depending on resolution semantics.

Smallest fix:

- Add smoke tests using `npm pack --dry-run` contents and manifest path resolution assumptions.
- Document each harness path base explicitly.
- Prefer self-contained plugin directories if a harness resolves paths relative to the manifest.

### A15. Commit/release DX is good, but contributor policy may be too narrow

Severity: **Medium**

Evidence:

- Commitlint scopes are strict and omit common contributor scopes such as tests, scripts, deps,
  harnesses, or CI subareas.
- `prepare` runs Husky with `|| true`, masking failures and producing noise in pack contexts.

Concern: strict DX should guide contributors without creating confusing false failures or silent
bypasses.

Smallest fix:

- Expand or relax commitlint scope enforcement.
- Make Husky installation conditional on `.git` and non-CI rather than swallowing all failures.

## Recommended remediation plan

### P0: Fix before any public announcement

1. Make `scripts/install-local.mjs` safe and tested.
2. Validate Claude/Codex/Pi install paths from a clean checkout or package tarball.
3. Compile and commit the GitHub Agentic Workflow artifact, or soften the self-maintaining claim.
4. Change upstream evidence generation to use immutable release refs, with canary tracking
   separated.
5. Add parser-backed Mermaid validation or clearly label static validation as limited.
6. Finalize org/package/Tessl identity and CODEOWNERS.

### P1: Fix before marketplace submission

1. Add Tessl consumer install/use docs and marketplace metadata/assets.
2. Add a diagram-type coverage matrix and snippets for every advertised supported type.
3. Expand evals to cover major stable types, repair cases, renderer compatibility, and unsafe syntax
   rejection.
4. Add agentic PR audit checklist and prompt-injection guardrails.
5. Add third-party notices for Mermaid upstream evidence.

### P2: Fix before enterprise positioning

1. Split workflow permissions by job and pin actions to SHAs.
2. Add SBOM generation and dependency-review checks.
3. Harden release gates with protected environments/trusted publishing where possible.
4. Add concrete vulnerability reporting and SLA details.

## Final assessment

The concept is strong and the repo is much further than a toy scaffold. The adversarial stakeholders
found a consistent pattern: **the core skill is useful, but the surrounding launch, automation, and
validation claims are ahead of the evidence**.

The next best move is not adding more Mermaid prose. It is making the package safe to install,
proving harness compatibility, grounding upstream evidence in immutable releases, and converting the
self-maintenance promise into a runnable, auditable workflow.
