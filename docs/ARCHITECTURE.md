# Architecture

Visual thesis: a quiet study workspace with precise typography, warm paper surfaces and a restrained green accent; equally readable in light and dark.

Content plan: today and upcoming work first, a clear course workspace second, then focused assignment and concept pages with contextual relationships and practice. No marketing hero inside the app.

Interaction thesis: brief dialog/sheet entrances, immediate evidence and checklist updates, and stable directional graphs with a keyboard-accessible relationship list. Reduced motion removes transitions.

## Boundaries

- Astro statically renders every content route. React islands manage only local interaction. Base-path helpers support GitHub project Pages.
- TypeScript/Zod model courses, editions, concepts, semantic edges, questions, coverage, assignments, schedules and provenance. Edition dates never enter shared concept identity.
- Reviewed, deterministic question families and transparent evidence rules drive all practice modes. Recognition alone cannot establish stable evidence. Preview knowledge does not block core progress.
- Client events are UUID-addressed and stored on-device. The optional backend accepts validated idempotent events and paginates downloads with a server sequence cursor. Local work continues through disconnects.
- SQLite with WAL and versioned migrations backs a small Fastify service. Argon2id passwords, opaque hashed session identifiers, HttpOnly cookies, CSRF tokens, origin checks, throttling and server-side roles protect online routes.
- Pagefind indexes rendered content; a compact fallback index supports development and offline search. A generated, versioned service worker caches the static learning application and never API responses.

## Authority

Source workspace: `jlsp124/obsidian-vaults`, branch `main`, snapshot `01c9644647ee197de2a4e06f004a5d1c77535f28` (checked October 5, 2026). The atlas brief supersedes older plans to publish only at semester end or omit Japanese/accounts. The vault checkout is read-only; raw private source stays outside this repository.

Graph choice: Cytoscape breadth-first layout, with no continuous force simulation. Backend choice: Fastify, SQLite and Node 24 rather than another service stack. Anonymous analytics are opt-in; learning progress is useful without analytics.

Current stable versions were checked against npm and official docs on October 5, 2026. See [Astro Pages](https://docs.astro.build/en/guides/deploy/github/), [Pagefind](https://pagefind.app/docs/), [Cytoscape](https://js.cytoscape.org/) and [Fastify](https://fastify.dev/docs/latest/).

Production CI and Docker use Node 24.21.0, the maintained LTS release checked against the [official Node.js download page](https://nodejs.org/en/download) and release index. Local compatibility was also exercised on the installed Node 24.11.1. The SQLite binding is compiled in a separate Docker build stage, keeping the runtime image free of compiler tooling.
