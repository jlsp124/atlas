# Implementation status

Updated: October 5, 2026. This file is the resumption contract.

## Complete

- Source authority checked on fresh vault main; exact snapshot recorded.
- Four active courses and Fall 2026 editions; 61 original lessons, 198 question archetypes, 76 coverage items, four original companions and dated schedules.
- Responsive light/dark/system interface, annotations, math, Japanese, contextual graphs with accessible lists, practice, prerequisite repair/retry, independent coverage and known-to-target paths.
- Guest/account-isolated local events, cross-device event reconciliation, offline navigation with queued account events, once-per-browser onboarding and actual guided work/concept flow.
- Optional Fastify/SQLite backend: secure sessions, Argon2id, CSRF/origin checks, rate limiting, Jovan bootstrap, deletion, aggregate admin metrics and request inbox.
- Static search and installable PWA with versioned cache, offline routes and an update notice that survives navigation while a worker is waiting; no API caching.
- Linux Docker Compose/systemd, HTTPS/proxy/cookie and backup/restore instructions. Pinned CI and Pages workflows authored.
- Content validation, formatting/lint/type checks, 71 unit/backend tests and the 93-page production build pass. All 32 phone/desktop browser tests pass without skips; forty local light/dark accessibility scans pass. The same full suite gates Ubuntu verification and Pages deployment.
- Reachable-history privacy audit complete; public Pages enabled after GitHub rejected the private repository plan. The private vault remains unchanged at its recorded authority commit.
- GitHub Pages is live at https://jlsp124.github.io/atlas/. Live desktop/phone checks cover 32 route/theme combinations, graphs, search, math, Japanese and original companions without asset errors or axe violations. Live offline assignment/checklist/Japanese practice and the published scientific-notation grading fix pass.
- The Node 24.21.0 Linux container builds native SQLite in a separate stage, starts with a read-only root and dropped capabilities, creates a consistent backup, and verifies non-root execution plus private database/backup permissions in CI.

## In progress

- No implementation work remains open for this release. Accounts/admin/private requests are implemented and tested, but need an operator-connected API before they are available on the public site.

## Next

1. Refresh near-term class announcements, independently review the Physics/C17 bank, and curate Chapter 19 from verified evidence.
2. Connect the optional API on Jovan's Linux server behind HTTPS; configure dedicated support/API variables and verify real phone cookies and backup restoration.
3. Expand the reviewed bank and expose archived editions when those sources exist.
4. Add administrator passkeys/MFA and recovery before widening administrator use.

## Blocked / content gaps

- Physics unit-test date is Oct. 7 or Oct. 9; no exact confirmed date.
- Chemistry Oct. 16 test scope is not teacher-confirmed.
- Japanese Anime Project rubric is missing; weekly quiz dates cannot be inferred.
- Linux home-server credentials/hostname have not been supplied; deliver deployable configuration.
- Teacher source rights do not authorize mirroring worksheets, transcripts or answer keys.

## Known issues

- The reviewed bank is a subset, not a complete syllabus or predicted test. Chapter 19, every kana, detailed kingdom characteristics and future units need curation.
- Individual videos/Drive URLs are indexed; captions and timestamp-to-concept mapping are pending. The saved playlist shortlink is HTTP 404.
- MFA/recovery, authoritative listening audio, handwriting grading and an archive-edition browser are not shipped.
- Actual home-server TLS/cookies/deployment/backups require operator validation. Logout requires a reachable API to revoke its cookie.
- Admin supplies real basic aggregates and eligible seven-day return counts. Richer bottleneck/remediation/assessment-period metrics remain future work.
- Publishable content records atlas curation and structural checks, not external teacher/expert sign-off.
