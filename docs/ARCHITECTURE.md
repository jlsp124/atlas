# Architecture

## Assignment-first presentation

[UX.md](UX.md) is the design authority. Course → Unit → Material → Whole assignment → Question. Astro renders static routes; React islands manage the persistent shell, onboarding, contextual definitions, assignment working, Japanese recall, optional reference learning, Calendar and account controls. Semantic relationships support the engine and backlinks; the old graph renderer and coach marks stay removed.

`src/content/workspaces.ts` maps existing stable content into unit/material-set workspaces, useful search groups and plain event copy. It does not modify the catalog. `definitions.ts` adds short original definitions referencing real concept IDs. `MaterialUnit` and `AssignmentWorkspace` replace the primary Learn/Classwork fork while keeping canonical routes and IDs.

`core/walkthrough.ts` composes pacing from existing reviewed companion steps and explicit public derivative guides. Supported physics calculations are checked against the reviewed answer before a numerical model is used; unknown inputs are not guessed. `walkthrough-values.ts` records reviewed quantities and related-part context. Configurations and conversions keep explicit electron budgets/factors. Unspecified textbook structures use clearly labelled examples. Every other allowed question retains its asking, hints, evidence and response criteria.

`QuestionWalkthrough` retains a prompt and working canvas across Next/Back. `client/motion.ts` uses native Web Animations to move actual values from source rectangles, cancelling in-flight animation on rapid changes. Persistent SVG electrons and process elements use transform transitions. Reduced motion removes animation. Normal Astro routes use native cross-document transitions where available and a delayed loading mark without changing router or service-worker behavior.

`client/feedback.ts` captures public navigation identifiers and visible step titles, excluding inputs and arbitrary query parameters. The feedback sheet sends a bounded context-prefixed message to the existing requests endpoint, so no inbox database migration is needed. Unsent drafts use per-account/per-page tab session storage. Product contact is centralized in `content/product.ts`.

Learn presents model → representation → worked example → checks. The unchanged prerequisite engine selects a small foundation probe/repair. Assignment learning runs in a focused dialog, retaining the document DOM, reading position and task state. A contextual desktop inspector becomes a mobile sheet. Practice preserves its original queue/seed during a repair and retries the same question.

Search uses the catalog/aliases and joins matching concepts to work and assessments, available offline. Pagefind still builds the static index. V2 keeps legacy concepts/course-section deep links functional. New canonical learning routes are `learn/:id`; unit routes are `courses/:course/units/:unit`.

## Engine and persistence boundaries

- TypeScript/Zod models courses, editions, concepts, semantic edges, questions, coverage, assignments, schedules and sources. Edition metadata never enters shared concept identity. Personal periods remain historical data and are never rendered in student UI.
- Deterministic questions and evidence rules retain recognition/construction/transfer, spacing, diagnostic selection and long-tail coverage. A self-report is not mastery. Preview prerequisites do not block core learning.
- UUID-addressed learner events retain the existing `atlas:v1:*` guest/account format. No migration or reset is needed. Checklist task IDs, choices, answers, source IDs and all concepts remain unchanged.
- Additive `assignment_progress` events store explicit status, question/step cursor and optional done-on-paper state. The projection falls back to legacy task history. Paper completion and review ratings are not mastery. The server validates assignment/question membership and rejects restricted checkpoints; matching server code is required before a frontend release starts syncing these events.
- Optional backend accepts validated idempotent events and paginated sequence cursors. Offline account work queues separately from guest data.
- Fastify/SQLite WAL, versioned migrations, Argon2id, opaque hashed sessions, HttpOnly cookies, CSRF/origin checks, throttling and server-side roles remain unchanged.
- Generated versioned PWA precaches static routes/fonts/math/assets, never API responses. Waiting updates remain actionable after navigation. Offline deep links remain covered by browser tests.
- Admin retains dense operational views. Auth, database, ingestion and server operations remain unchanged; the one new sync-event validator is the only backend extension.

## Content authority

The current catalog retains its existing dated source snapshot, 61 concepts, 198 question archetypes, 76 coverage items and 50 materials/353 contextual questions. Raw/private source stays outside this repository. Original companions remain distinct from restricted teacher handouts. This redesign does not ingest new classroom sources. Chapter 19 lessons and unknown assessment dates/scopes remain explicitly unfinished.

## Runtime and deployment

CI/Docker pin Node 24.21.0; local checks use installed Node 24.11.1. Static GitHub project Pages keeps the `/atlas/` base. The optional API is configured through PUBLIC_API_URL; an absent value preserves local functionality and accurately disables online account/request actions. This redesign does not configure or replace the separately operated server.

See [DEPLOYMENT.md](DEPLOYMENT.md), [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md), [CONTENT.md](CONTENT.md), [SECURITY.md](SECURITY.md), and [SPEC.md](SPEC.md).
