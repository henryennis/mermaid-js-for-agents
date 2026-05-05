# Security Policy

## Supported versions

Security fixes are accepted for the latest released minor version. Pre-1.0 releases may receive
security fixes as patch releases when the package layout remains compatible.

## Reporting a vulnerability

Do not file public issues for vulnerabilities. Use GitHub private vulnerability reporting once
enabled for the public repository. Until that is enabled, treat the package as private beta and
report vulnerabilities privately to repository owner `@henryennis`.

Expected response targets after public launch:

- acknowledge within 3 business days;
- triage severity within 7 business days;
- publish a fix or mitigation timeline for confirmed high/critical issues within 14 days;
- coordinate disclosure after a fix or documented mitigation is available.

Include:

- affected package version or commit;
- harness involved, if any;
- reproduction steps;
- expected and actual behavior;
- potential impact.

## Security model

This project ships agent instructions and optional scripts. Treat installed skills and plugins as
trusted code:

- Review skill content before installing globally.
- Keep write operations in GitHub Agentic Workflows behind safe outputs.
- Do not include secrets in Mermaid diagrams or eval fixtures.
- Keep package scripts deterministic and auditable.
