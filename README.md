# atlas

A student-built course companion by Jovan Pahal. Real course knowledge, upcoming work, original practice and an explainable map of what to learn next.

[Open atlas](https://jlsp124.github.io/atlas/) · [Source](https://github.com/jlsp124/atlas) · [Linux deployment](docs/DEPLOYMENT.md)

The public app is static. Lessons, assignments, graphs, search and guest progress work without an account or a running server. An optional Node/SQLite service adds secure accounts, event sync, a request inbox and aggregate analytics.

## Development

Requires Node 24.11+ and npm for local development. Production CI and the container use Node 24.21.0 LTS.

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

The initial bank contains 61 concepts, 198 question archetypes, 76 coverage items and four assignment companions. It covers current classroom scope rather than the full syllabus. Practice follows recognition → construction → transfer, repairs one missing prerequisite at a time, and tracks coverage separately from correct answers.

Accounts, synced progress, the private request inbox and administrator data require the optional API. The published Pages build initially supports guest learning; no home server or support email has been connected. [Deployment guidance](docs/DEPLOYMENT.md) explains HTTPS, cookie compatibility, bootstrap and backups.

## Documentation

- [Implementation status](docs/IMPLEMENTATION_STATUS.md)
- [Architecture and decisions](docs/ARCHITECTURE.md)
- [Linux deployment](docs/DEPLOYMENT.md)
- [Content and source updates](docs/CONTENT.md)
- [Privacy and security](docs/SECURITY.md)
- [Verification evidence](docs/QA.md)
- [Release report](docs/RELEASE_REPORT.md)
- [Contributing](CONTRIBUTING.md)

Student-made and unofficial. Verify important deadlines with the teacher. Source snapshots are dated; unfinished and uncertain material is labeled.

Original atlas code and content are MIT licensed. Linked teacher and external materials keep their own rights; see [NOTICE](NOTICE.md). The repository began private and was made public after a tracked-history privacy review because the account's plan does not support private-repository Pages.
