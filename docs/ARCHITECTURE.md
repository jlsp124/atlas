# Architecture

## V2 presentation

[UX.md](UX.md) is the design authority. Course → Unit → Learn / Classwork. Astro renders static routes; React islands manage the persistent shell, onboarding, contextual definitions, ordered Learn, questions, classwork, Calendar and account controls. Semantic relationships support the engine and backlinks; the old graph renderer and coach marks are removed.

`src/content/workspaces.ts` maps existing stable content into unit/material-set workspaces, ordered assignment learning plans, useful search groups and plain event copy. It does not modify the catalog. `definitions.ts` adds short original definitions referencing real concept IDs. No server or stored-event schema change is required.

Learn presents model → representation → worked example → checks. The unchanged prerequisite engine selects a small foundation probe/repair. Assignment learning runs in a focused dialog, retaining the document DOM, reading position and task state. A contextual desktop inspector becomes a mobile sheet. Practice preserves its original queue/seed during a repair and retries the same question.

Search uses the catalog/aliases and joins matching concepts to work and assessments, available offline. Pagefind still builds the static index. V2 keeps legacy concepts/course-section deep links functional. New canonical learning routes are `learn/:id`; unit routes are `courses/:course/units/:unit`.

## Engine and persistence boundaries

- TypeScript/Zod models courses, editions, concepts, semantic edges, questions, coverage, assignments, schedules and sources. Edition metadata never enters shared concept identity. Personal periods remain historical data and are never rendered in student UI.
- Deterministic questions and evidence rules retain recognition/construction/transfer, spacing, diagnostic selection and long-tail coverage. A self-report is not mastery. Preview prerequisites do not block core learning.
- UUID-addressed learner events retain the existing `atlas:v1:*` guest/account format. No migration or reset is needed. Checklist task IDs, choices, answers, source IDs and all concepts remain unchanged.
- Optional backend accepts validated idempotent events and paginated sequence cursors. Offline account work queues separately from guest data.
- Fastify/SQLite WAL, versioned migrations, Argon2id, opaque hashed sessions, HttpOnly cookies, CSRF/origin checks, throttling and server-side roles remain unchanged.
- Generated versioned PWA precaches static routes/fonts/math/assets, never API responses. Waiting updates remain actionable after navigation. Offline deep links remain covered by browser tests.
- Admin retains dense operational views. Backend, ingestion, deployment and server operations are outside this presentation redesign.

## Content authority

Read-only source snapshot: `jlsp124/obsidian-vaults@01c9644647ee197de2a4e06f004a5d1c77535f28`, checked October 5, 2026. Raw/private source stays outside this repository. Original companions remain distinct from restricted teacher handouts. All 61 concepts, 198 questions, 76 coverage items and four companions are retained. Chapter 19 lessons and unknown assessment dates/scopes remain explicitly unfinished.

## Runtime and deployment

CI/Docker pin Node 24.21.0; local checks use installed Node 24.11.1. Static GitHub project Pages keeps the `/atlas/` base. The optional API is configured through PUBLIC_API_URL; an absent value preserves local functionality and accurately disables online account/request actions. This redesign does not configure or replace the separately operated server.

See [DEPLOYMENT.md](DEPLOYMENT.md), [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md), [CONTENT.md](CONTENT.md), [SECURITY.md](SECURITY.md), and [SPEC.md](SPEC.md).
