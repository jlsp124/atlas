# atlas V2 product specification

atlas keeps notes, work, dates and study in one place. [UX.md](UX.md) is the student design authority.

## Core model

**Course → Unit → Learn / Classwork.** Independent Physics 11, Chemistry 11, Life Sciences 11 and Introductory Japanese 11 workspaces. Teacher/edition belongs to the course. Personal periods and verified course order never appear. Past units remain accessible. Calendar owns dates.

## Primary flows

1. Onboarding: promise → choose courses → account or this device. Preserve existing setup. No coach marks.
2. Home: Up next, My courses, one Continue action. Compact desktop viewport.
3. Course: units, current unit, subtle teacher. Unit: Learn / Classwork. Resources/dates secondary.
4. Learn: ordered path, one idea/representation/example/check at a time. Optional Why/detail. Strong learners can check quickly.
5. Foundation repair: small check → Fix this first → teach/check → automatically return to target. No graph or engine terminology.
6. Classwork: unit/material-set grouping. Typeset authorized work; clearly identified original companions for restricted handouts. Preserve checklist IDs; answers disclosed per question.
7. Terms: definition inspector/sheet → Learn this; Related and Used in backlinks.
8. Learn this first: assignment-required ideas → focused teaching/checks → exact worksheet return, preserving reading position and checked tasks.
9. Practice: Quick check / Review unit. Prepare for test contextually. One question, feedback, Continue. Summary: Looks good / Review / Still to check.
10. Calendar: Week/Month, selected-course events/no-school days, uncertain dates separate; event links to related course/unit/work/prep.
11. Search: Cmd/Ctrl+K dialog, Learn / Classwork / Other, aliases/formulas/kana/romaji/resources/tests.
12. Account/settings, About/Help, privacy and dense admin retain actual functionality.

## Content and learning guarantees

Preserve IDs, prerequisites, question selection, deterministic variants, spacing, coverage blueprint and events. Self-report never awards mastery. Wrong unhinted answers count as tested but need review. Hints do not prove mastery. All small required items remain reachable through Still to check.

The reviewed blueprint is not necessarily the entire teacher syllabus. Unknown Chapter 19 content, unconfirmed dates and unknown assessment scope are stated plainly in first person. Preserve copyright/source safeguards: restricted sheets are linked, never fabricated as transcriptions. Japanese assessed-work safeguards stay in tutor context.

## Architecture and migration

Retain Astro static/PWA, React islands, cookie/CSRF accounts, event sync, SQLite, admin, ingestion and server tooling. No server rearchitecture. Existing atlas:v1:* account/guest state remains valid without reset. Keep legacy links functional. Internal graph remains; optional Explore is omitted until it merits inclusion.

## Acceptance

Persistent desktop sidebar, main pane and contextual inspector. Four-item mobile navigation, focused Learn/practice and definition sheets. Warm neutral light/graphite dark, no green, restrained course accents, self-hosted Geist/native Japanese/KaTeX. No dashboard, graph controls, evidence jargon or practice-mode panel.

Run engine/backend/offline/account tests plus V2 flow checks. Inspect accessibility and screenshots at 1920×1080, 1440×900, 1366×768 and phones, both themes, with more than one visual pass. Home primary content fits approximately one desktop viewport. Completion requires live deployment and visual inspection of the deployed site.
