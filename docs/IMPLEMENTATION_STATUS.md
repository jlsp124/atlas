# Implementation status

**October 7, 2026:** the assignment-first Atlas Beta redesign is implemented and
verified locally. The primary experience is Course → Unit → Material set → Whole
assignment → Focused question → Guided work on paper. The former required
Learn/Classwork split is superseded; optional reference learning and the original
engine remain. The V2 neutral identity, accents, sidebar, source catalog,
restricted Chemistry and account/offline behavior are preserved. A small BETA
treatment and contextual Help/Feedback are included. See
[ASSIGNMENT_REDESIGN.md](ASSIGNMENT_REDESIGN.md), [QA.md](QA.md) and
[SUPPORT.md](SUPPORT.md). This implementation has not been published; its additive
paper-progress event requires the matching server validator before frontend
publication. No database migration or new environment variable is needed.

## Historical classwork and V2 receipts

**October 6, 2026:** the classwork fidelity milestone supersedes conflicting
parts of the V2 resumption contract below. Read [CLASSWORK_MILESTONE.md](CLASSWORK_MILESTONE.md)
and [INTAKE.md](INTAKE.md). V2 visuals remain; schoolwork is the primary
interface. The current catalog has 50 classwork entries and 353 checkpoints.
The production API is configured and its HTTPS health endpoint was verified;
older statements that no operator API has been connected are historical.
The exact final validation and deployment receipt accompanies this release.

Updated October 5, 2026. This is the V2 resumption contract. Read [UX.md](UX.md) before changing the student interface.

## V2 frontend

The presentation model is **Course → Unit → Learn / Classwork**. Independent course workspaces replace personal timetable order. The neutral desktop sidebar, four-destination mobile navigation, three-screen introduction, focused Learn/practice, typeset companions, definitions, worksheet preparation, Calendar, Search and account settings are implemented.

The old graph renderer, coach marks, evidence dashboard and ten-mode practice panel are removed from the student interface. Explore is intentionally omitted. Semantic relationships, all 61 concept IDs, 198 questions, 76 coverage items, four companions, task IDs and source records remain intact.

The engine, event store, catalog, ingestion, backend and server operations have no redesign changes. Existing atlas:v1:* data stays valid. Browser checks explicitly load V1 course choices, theme, tasks and question events without a reset. Account tests still use the real optional API, two browser contexts, disconnection, queued events and reconnection.

Local release checks pass: formatting, lint, 71-file typecheck, 78 unit/backend tests, content validation, 173-route build and 44 desktop/phone browser tests. The browser suite includes 84 axe scans and a real waiting-worker lifecycle across navigation. See [QA.md](QA.md). Publication is gated by the exact successful Ubuntu verification commit; final live identity and screenshot receipts belong to the release delivery.

## Preserved server work

Docker Compose/systemd, HTTPS/cookie controls, atlasctl, guarded deployment, consistent backups and retention tooling are preserved. Server deployment is a separate workstream. Do not rearchitect authentication, sync, SQLite or deployment for a visual change.

The public Pages build still requires an operator-connected PUBLIC_API_URL for account sync, the private request inbox and admin data. Those capabilities are implemented and tested locally. Do not describe the public site as having a connected API without live evidence.

## Content and operator gaps

- Chapter 19 has teacher resource links but no Atlas lessons/questions yet. Other future units and a complete syllabus bank need curation.
- The Physics unit-test date is Oct. 7 or Oct. 9; it remains undated until confirmed.
- Chemistry's Oct. 16 test scope and the Japanese Anime Project rubric remain unconfirmed.
- Restricted teacher sheets/keys/transcripts remain external links. Original Atlas companions are not exact teacher handout reproductions.
- Video captions and timestamp mappings are not curated; the recorded missing playlist/link evidence is preserved.
- Production API TLS, real-device cookies and backup restoration still need operator verification.
- Administrator MFA/recovery, archive-edition browsing, authoritative listening audio and handwriting grading are future work.

## Continue from here

Confirm immediate assessment boundaries and curate Chapter 19 from verified sources. Connect the existing optional API through the separately maintained server workflow. Expand the bank through content review.

Keep student navigation simple. New backend capability does not automatically earn a primary button. Do not restore timetable periods, green branding, core graph navigation, coach marks or a practice control panel.
