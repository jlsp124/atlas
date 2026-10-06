# Verification evidence

Checked October 5, 2026, in America/Vancouver. Commands run against the actual application and optional service; local backend tests use isolated generated credentials and disposable databases. Raw browser traces, credentials, server data and source captures are ignored.

## Local verification

| Check                      | Result | Evidence                                                                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Formatting / ESLint        | PASS   | `npm run check`; no diagnostics                                                                                     |
| Astro / TypeScript         | PASS   | 56 checked files; zero errors, warnings or hints                                                                    |
| Unit / backend integration | PASS   | 71 tests in four files                                                                                              |
| Content publication        | PASS   | Four courses, 61 concepts, 198 archetypes, 76 coverage items and four original companions                           |
| Production build           | PASS   | 93 generated routes; Pagefind indexes 91 pages                                                                      |
| Browser flows              | PASS   | 32 tests across desktop and phone, including account sync, admin/request flows and waiting-update navigation        |
| Accessibility / reflow     | PASS   | 10 page types × two themes × two viewports; 40 axe scans without violations                                         |
| Dependency audit           | PASS   | `npm audit --audit-level=high`: zero vulnerabilities                                                                |
| Source-update workflow     | PASS   | Fresh vault fetch matches `01c9644647ee197de2a4e06f004a5d1c77535f28`; no source hash additions, changes or removals |
| Publication privacy        | PASS   | Reachable history reviewed; raw evidence, runtime data, profile narrative, grades and personal contact excluded     |

Learning tests cover prerequisite ordering, cycles/missing targets, nearest missing bridges, self-report boundaries, construction/transfer evidence, seven-day review, conflict, independent coverage, unseen-item selection, long-tail checks, numeric variants/units/precision, kana and AI tutor context.

Backend tests cover Argon2id, session expiry/revocation, role/origin/CSRF checks, login throttling, account isolation, retry and batch UUID conflicts, 201-event download pagination, raw-answer rejection, consent, actual admin totals, request authorization and password-confirmed deletion. A file-backed WAL test checks a consistent online backup, database integrity, reopen persistence, migration idempotency and foreign keys.

Browser checks exercise actual onboarding, checklist refresh/unchecking, confusion/known probes, copied tutor prompts, Japanese production, math, graph/list navigation, repair/retry, coverage, keyboard search, themes/text spacing, accounts across two browser contexts, API disconnection/reconnection, guest isolation, authorized requests/admin and production-base-path offline routes. Accessibility scans are useful evidence, not a complete manual WCAG certification.

Visual inspection covers the 1365-pixel desktop and 390-pixel phone dashboard plus dark science lessons and Japanese text. Narrow header/reflow regressions also pass at 320 and 390 pixels, including increased text spacing. The rebuild and affected production/offline checks pass after that layout repair.

The generated PWA cache contains 291 static resources (about 4.7 MiB), including unvisited lessons and Pagefind files. API responses are not cached. Installation is atomic; updates require an explicit action. Cache lookups handle static module/font `Vary: Origin` responses and ignore retry query strings on immutable assets. A real service-worker lifecycle regression reproduces a waiting update, navigates to another page, applies it and verifies the clean reload on desktop and phone. The update notice checks existing waiting workers as well as newly installed workers.

## Release verification

- Release gate: [Verify atlas](https://github.com/jlsp124/atlas/actions/workflows/verify.yml) runs the complete suite; [Deploy atlas](https://github.com/jlsp124/atlas/actions/workflows/pages.yml) publishes the exact successful verification commit. The pre-update-fix release `66c4e084750ef95cb37ff2a3c7ad086cd302a86a` passed [Ubuntu verification](https://github.com/jlsp124/atlas/actions/runs/37402860343) and [Pages deployment](https://github.com/jlsp124/atlas/actions/runs/37403164328). The waiting-update fix adds two browser cases to the same release gate; current immutable run evidence is available in [Actions](https://github.com/jlsp124/atlas/actions).
- Ubuntu runs Node 24.21.0, unit/backend and desktop/phone browser tests, formatting/lint/type/content/build checks, the dependency audit and Linux container checks. All checks must pass before automatic deployment.
- The Linux image builds the native SQLite binding in a separate compiler stage. It passes health and consistent-backup checks while non-root, with a read-only root and dropped capabilities. CI checks data directory mode `700` and database/backup file mode `600`.
- Live https://jlsp124.github.io/atlas/: eight route types × two themes × two viewports give 32 successful axe/reflow checks. Graph canvas/list navigation, kana/romaji search, mathematics and deep links work without page or asset errors.
- Live installed-cache test: an unvisited C17 companion opens offline, its checklist survives refresh, and Japanese recognition/typed production work offline. Narrow reflow passes at 320 pixels.
- The current published scientific-notation question rejects a plain decimal when normalized e notation is requested and accepts the correct normalized transfer answer. Equivalent numeric values remain accepted for count/conversion questions; measured precision is checked separately.

## Operator checks not run

The actual home server, reverse proxy/tunnel, DNS, real-device cross-site cookies, production credentials and production backup restore were not available. Linux CI container verification does not establish that the bedroom server is deployed. No optional API URL or support email is configured in the public build.

Human subject review, a complete syllabus bank, caption/timestamp curation, administrator MFA/recovery and authoritative Japanese listening/handwriting checks remain documented product/content milestones.
