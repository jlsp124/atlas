# Verification evidence

Checked October 5, 2026, in America/Vancouver. Commands run against the actual application and optional service; local backend tests use isolated generated credentials and disposable databases. Raw browser traces, credentials, server data and source captures are ignored.

## Local verification

| Check                      | Result | Evidence                                                                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Formatting / ESLint        | PASS   | `npm run check`; no diagnostics                                                                                     |
| Astro / TypeScript         | PASS   | 56 checked files; zero errors, warnings or hints                                                                    |
| Unit / backend integration | PASS   | 70 tests in four files                                                                                              |
| Content publication        | PASS   | Four courses, 61 concepts, 198 archetypes, 76 coverage items and four original companions                           |
| Production build           | PASS   | 93 generated routes; Pagefind indexes 91 pages                                                                      |
| Browser flows              | PASS   | 30 tests across desktop and phone, including account sync and authorized admin/request flows                        |
| Accessibility / reflow     | PASS   | 10 page types × two themes × two viewports; 40 axe scans without violations                                         |
| Dependency audit           | PASS   | `npm audit --audit-level=high`: zero vulnerabilities                                                                |
| Source-update workflow     | PASS   | Fresh vault fetch matches `01c9644647ee197de2a4e06f004a5d1c77535f28`; no source hash additions, changes or removals |
| Publication privacy        | PASS   | Reachable history reviewed; raw evidence, runtime data, profile narrative, grades and personal contact excluded     |

Learning tests cover prerequisite ordering, cycles/missing targets, nearest missing bridges, self-report boundaries, construction/transfer evidence, seven-day review, conflict, independent coverage, unseen-item selection, long-tail checks, numeric variants/units/precision, kana and AI tutor context.

Backend tests cover Argon2id, session expiry/revocation, role/origin/CSRF checks, login throttling, account isolation, retry and batch UUID conflicts, 201-event download pagination, raw-answer rejection, consent, actual admin totals, request authorization and password-confirmed deletion. A file-backed WAL test checks a consistent online backup, database integrity, reopen persistence, migration idempotency and foreign keys.

Browser checks exercise actual onboarding, checklist refresh/unchecking, confusion/known probes, copied tutor prompts, Japanese production, math, graph/list navigation, repair/retry, coverage, keyboard search, themes/text spacing, accounts across two browser contexts, API disconnection/reconnection, guest isolation, authorized requests/admin and production-base-path offline routes. Accessibility scans are useful evidence, not a complete manual WCAG certification.

Visual inspection covers the 1365-pixel desktop and 390-pixel phone dashboard plus dark science lessons and Japanese text. Narrow header/reflow regressions also pass at 320 and 390 pixels, including increased text spacing. The rebuild and affected production/offline checks pass after that layout repair.

The generated PWA cache contains 291 static resources (about 4.7 MiB), including unvisited lessons and Pagefind files. API responses are not cached. Installation is atomic; updates require an explicit action. Cache lookups handle static module/font `Vary: Origin` responses and ignore retry query strings on immutable assets.

## Release verification

- Ubuntu CI and Docker runtime: pending first release push.
- GitHub Pages and live deep-route/browser verification: pending deployment.

## Operator checks not run

The actual home server, reverse proxy/tunnel, DNS, real-device cross-site cookies, production credentials and production backup restore were not available. Linux CI container verification does not establish that the bedroom server is deployed. No optional API URL or support email is configured in the public build.

Human subject review, a complete syllabus bank, caption/timestamp curation, administrator MFA/recovery and authoritative Japanese listening/handwriting checks remain documented product/content milestones.
