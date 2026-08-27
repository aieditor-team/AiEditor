# Contributing to AiEditor

## Before you start

Use Node.js 22.12 or newer. Node.js 22.14, as recorded in `.nvmrc`, is the recommended development version.

For significant API, schema, or architecture changes, open an issue before implementation so the compatibility impact can be agreed on first. Security vulnerabilities must follow `SECURITY.md` and must not be reported publicly.

## Development workflow

```bash
npm ci
npm run test:run
npm run build
npm run build:demo
```

Use `npm run test` only for local watch mode. Do not commit `node_modules`, `dist`, `demo-dist`, `coverage`, credentials, or generated local artifacts.

## Pull requests

- Keep each pull request focused on one concern.
- Add or update tests for behavioral changes.
- Update the public entry point and documentation when changing public APIs.
- Document breaking changes in `MIGRATION.md` and user-visible changes in `CHANGELOG.md`.
- Preserve the existing sanitization, upload validation, and cancellation boundaries.
- Run `npm run ci` and `git diff --check` before submitting.

By contributing, you agree that your contribution is licensed under the repository's LGPL-2.1-only license.
