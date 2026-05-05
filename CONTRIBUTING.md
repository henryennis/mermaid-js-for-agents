# Contributing

Thanks for improving Mermaid.js for Agents.

## Development setup

```bash
npm install
npm run check
```

## Commit style

Use Conventional Commits with one of the configured scopes, for example:

```text
feat(skill): add packet diagram guidance
fix(mermaid): repair sequence example validation
chore(ci): tighten workflow permissions
```

Commit messages are checked locally with Husky and in CI for pull requests.

## Pull request checklist

- Keep changes focused on one behavior or maintenance update.
- Update docs when installation, packaging, or public behavior changes.
- Add or update eval scenarios for new agent behavior.
- Run `npm run check` before requesting review.
- Add a Changeset for user-visible package changes.

## Updating Mermaid skill fitness

Run:

```bash
npm run generate
npm run check
```

If the generated upstream snapshot or repository feedback reveals a create/repair skill gap, update
the focused references or evals first. Change the main skill router only when activation or
high-level behavior changes.
