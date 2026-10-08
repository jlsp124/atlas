# Architecture

## V3 presentation

The October 7, 2026 assignment-native product brief is the current design authority;
[V3.md](V3.md) records its implementation. Course → unit → material → actual
numbered question → controlled explanation → student work. Home, course and unit
pages lead with schoolwork. All 50 materials use overview/focus, preserving all
353 checkpoint IDs. Concepts and optional practice remain secondary detail routes.

`src/core/guide.ts` compiles reviewed question/notes data into typed steps.
`src/core/equation.ts` provides an expression tree and stable equation token IDs.
Teaching components use bounded FLIP/Web Animations and progressive SVG scenes;
reduced motion renders the same states instantly. Focus mounts one checkpoint.
Source/reference sheets preserve the distinction between permitted companions
and private teacher originals. Independent Chemistry hand-ins have no guide.

`checkpoint_saved` and `material_completed` extend the existing event protocol;
the SQLite schema, storage scopes and previous event identities remain intact.
Drafts flush at navigation boundaries; sync batches budget UTF-8 bytes within the
existing request limit. Explicit completion is distinct from mastery. An exact
additional-origin allowlist supports a coordinated custom-domain transition,
while secure HttpOnly cookies, CSRF and existing production defaults remain.

## Historical V2 presentation (superseded where it conflicts)

[UX.md](UX.md) records the earlier design authority. Course → Unit → Learn / Classwork was its primary model. Astro renders static routes; React islands manage the persistent shell, onboarding, contextual definitions, questions, Calendar and account controls. Semantic relationships support the engine and backlinks; the old graph renderer and coach marks remain removed.

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
- Admin retains dense operational views. Ingestion and source authority remain intact; backend changes are limited to additive V3 event validation and the exact origin allowlist.

## Content authority

The October 6 source intake and canonical private registry remain authoritative:
306 archived files, 50 published materials and 353 checkpoints. V3 changes no
ingested question bodies, teacher profiles, registry or raw-source hashes. Raw/private
sources stay outside this repository. Original companions remain distinct from
restricted teacher handouts. All 61 concepts, 198 optional question archetypes and
76 coverage items remain. Chapter 19 content and unknown assessment dates/scopes
remain explicitly unfinished. The private vault records October 7's superseding
product decision in its existing Atlas Intake authority note.

## Runtime and deployment

CI/Docker pin Node 24.21.0; local checks use installed Node 24.11.1. GitHub project
Pages keeps `/atlas/` until the coordinated domain cutover. The prepared build
variables support `https://atlas.jovanpahal.com/` at root. `PUBLIC_API_URL` configures
the API; an absent value preserves guest functionality and disables online
account/request actions. A static `release.json` and API `/health` expose the
immutable deployed SHA for verification. See the deployment runbook for pending
Cloudflare sign-in, server identity check and nested-hostname certificate coverage.

See [DEPLOYMENT.md](DEPLOYMENT.md), [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md), [CONTENT.md](CONTENT.md), [SECURITY.md](SECURITY.md), and [SPEC.md](SPEC.md).
