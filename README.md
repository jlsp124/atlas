# atlas

A student-built course companion by Jovan Pahal. The assignment is the lesson. Course → Unit → Real material → Real question → Guided reasoning → Your work.

[Open atlas](https://jlsp124.github.io/atlas/) · [Source](https://github.com/jlsp124/atlas) · [Linux deployment](docs/DEPLOYMENT.md)

The public app is static. Assignment overview/focus, controlled visual explanations, notes, calendar, search and guest progress work without an account or a running server. An optional Node/SQLite service adds secure accounts, event sync, a request inbox and aggregate analytics.

## Development

Requires Node 24.11+ and npm for local development. Production CI and the container use Node 24.21.0 LTS.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/atlas/`. `npm run check` validates formatting, lint, types, content, unit/integration tests, the production build and browser/accessibility flows. Install the test browser once with `npx playwright install chromium`.

## Courses

- Physics 11 · Mr. Wadson
- Life Sciences 11 · J. Bleecker
- Introductory Japanese 11 · McNeill-sensei
- Chemistry 11 · Mrs. Cote

Shared concepts belong to a course; assignments, pacing and dates belong to a Fall 2026 edition. Original explanations and question families are curated derivatives of source evidence, never a public copy of the private vault.

The current catalog contains 61 concepts, 198 optional question archetypes, 76 coverage items and 50 materials with 353 checkpoints tied to actual supplied work. Every material uses the V3 assignment shell. Reusable teaching primitives highlight wording, extract facts, move equation tokens and progressively build diagrams, then stop for the student. Contextual help returns to the same question and draft. Assignment completion is separate from concept mastery. See the [V3 architecture](docs/V3.md) and preserved [classwork engine milestone](docs/CLASSWORK_MILESTONE.md).

Accounts, synced progress, the private request inbox and administrator data use the optional API configured for the Pages build. The API's HTTPS health endpoint was verified on October 6; guest learning remains available offline. [Server operations](docs/SERVER_OPERATIONS.md) and [deployment guidance](docs/DEPLOYMENT.md) explain operation, cookie compatibility, bootstrap and backups.

## Documentation

- [Current V3 product and architecture](docs/V3.md)
- [Historical V2 design](docs/UX.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md)
- [Architecture and decisions](docs/ARCHITECTURE.md)
- [Linux deployment](docs/DEPLOYMENT.md)
- [Content and source updates](docs/CONTENT.md)
- [Put this in Atlas / Update atlas](docs/INTAKE.md)
- [Privacy and security](docs/SECURITY.md)
- [Verification evidence](docs/QA.md)
- [Release report](docs/RELEASE_REPORT.md)
- [Contributing](CONTRIBUTING.md)

Student-made and unofficial. Verify important deadlines with the teacher. Source snapshots are dated; unfinished and uncertain material is labeled.

Original atlas code and content are MIT licensed. Linked teacher and external materials keep their own rights; see [NOTICE](NOTICE.md). The repository began private and was made public after a tracked-history privacy review because the account's plan does not support private-repository Pages.
