# atlas

A student-built course companion by Jovan Pahal. Real course knowledge, upcoming work, original practice and an explainable map of what to learn next.

The public app is static. Lessons, assignments, graphs, search and guest progress work without an account or a running server. An optional Node/SQLite service adds secure accounts, event sync, a request inbox and aggregate analytics.

## Development

Requires Node 24.11+ and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/atlas/`. `npm run check` validates formatting, lint, types, content, unit/integration tests, the production build and browser/accessibility flows. Install the test browser once with `npx playwright install chromium`.

## Courses

- P1 Physics 11 · Mr. Wadson
- P2 Life Sciences 11 · J. Bleecker
- P3 Introductory Japanese 11 · McNeill-sensei
- P4 Chemistry 11 · Mrs. Cote

Shared concepts belong to a course; assignments, pacing and dates belong to a Fall 2026 edition. Original explanations and question families are curated derivatives of source evidence, never a public copy of the private vault.

## Documentation

- [Implementation status](docs/IMPLEMENTATION_STATUS.md)
- [Architecture and decisions](docs/ARCHITECTURE.md)
- [Linux deployment](docs/DEPLOYMENT.md)
- [Content and source updates](docs/CONTENT.md)
- [Privacy and security](docs/SECURITY.md)
- [Contributing](CONTRIBUTING.md)

Student-made and unofficial. Verify important deadlines with the teacher. Source snapshots are dated; unfinished and uncertain material is labeled.
