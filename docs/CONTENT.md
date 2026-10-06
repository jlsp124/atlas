# Content, authority and updates

atlas is a curated publishable derivative of `jlsp124/obsidian-vaults@01c9644647ee197de2a4e06f004a5d1c77535f28`, read from `main` on October 5, 2026. The source checkout is read-only. The implementation brief overrides older science-only/end-of-semester plans.

## Model

Courses hold reusable concepts and unit groupings. Fall 2026 editions hold teacher, term, period, resources, current pacing and dates. Assignment objects are original study companions, with source availability and uncertain due dates made explicit. The schema can archive editions without changing concept IDs; only current Fall 2026 routes are exposed in this release. An archive edition picker remains future work.

`src/content/catalog.ts` contains 61 concepts, 198 original question archetypes, 76 independently tracked coverage items, four companions and the dated schedule. Fifteen detail items check smaller facts, teacher conventions and graph representations separately from their umbrella concepts. A high accuracy on repeated questions cannot cover unseen items.

All explanations, examples and published question wording are original atlas material. They were structurally checked and factually cross-checked against classroom evidence and the linked OpenStax/Japan Foundation references. `publishable` records this curation pass; it does **not** mean a teacher or external subject expert signed off. Invite corrections and independent subject review before treating the bank as assessment-complete.

The current bank is a reviewed **subset**, not a complete syllabus or test predictor:

| Course        | Published scope                                                                                                                                                              | Important boundary                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Physics       | Basic skills; kinematics, signs, units, slope, displacement, velocity, acceleration, graphs, equations and free fall                                                         | Oct. 6 quiz confirmed by current class evidence. Unit test Oct. 7 **or** Oct. 9 is unconfirmed; no guessed date is stored.                      |
| Life Sciences | C18 classification and C17 origins/fossil record, terminology, cladograms, molecular evidence, domains/kingdoms, dating, early Earth and evolutionary patterns               | Oct. 7 C17 test and Oct. 9 C19 quiz are teacher-calendar snapshots. C19 research is listed, but its learning content is not yet reviewed.       |
| Japanese      | Four script/mora foundations and all 18 current greetings/basic phrases, typed production and situation recall                                                               | No future weekly quiz date is inferred. Anime project Nov. 20 is student-confirmed; the rubric remains missing. No listening/handwriting score. |
| Chemistry     | Measurement, dimensional reasoning, notation, significant figures, atoms/ions/isotopes, configurations, valence, trends, bonding, forces and Lewis → electron groups → VSEPR | Oct. 5 quiz ends at notes p.24. Shape content is taught beyond that quiz. Oct. 16 test date is student-confirmed but its scope is unknown.      |

Private grades, individual error logs/profile narrative, classmates, teacher assessment keys, scans and restricted handouts are absent from the public derivative. A source reference identifies provenance without reproducing the private file. Do not execute historical or classroom source artifacts.

## Bleecker ingestion

The teacher resource handout resolved to [Life Sciences 11](https://sites.google.com/view/ecl-life-sciences-11/home) and the [public Google Calendar](https://calendar.google.com/calendar/embed?src=q87773ofbdnsahhi3vmatr59t0%40group.calendar.google.com&ctz=America%2FVancouver). The saved shortened playlist link returned HTTP 404. Actual C17/C18 pages expose individual YouTube and Drive links.

```sh
npm run ingest:bleecker
npm run ingest:videos
```

The bounded manifest reads eight allowlisted public pages and the public ICS feed. It has timeouts, a 5 MB per-source limit, checked redirect hosts, hashes and captured timestamps. Raw page/ICS evidence stays under ignored `evidence/bleecker/`. The committed `src/content/ingestion/bleecker.json` publishes only metadata, links, statuses and event titles/dates.

The public ICS index contains 18 current-term events. A separate read-only connected-calendar check returned 20; the difference is retained as evidence, rather than implying the feed is complete. All-day ICS end dates are exclusive: the C17 research block ends at Oct. 7 exclusive (through Oct. 6); C19 ends Oct. 21 exclusive (through Oct. 20). Research-block endings are not automatically submission deadlines.

Indexed teacher pages: home, calendar, course, notes, biological vocabulary, C17 origins, C18 classification and cladograms. Discovered YouTube/Drive URLs are an index, **not** a claim that every linked file/video was inspected. A separate bounded check of six YouTube IDs returned public title/author metadata for five and HTTP 404 for one. Public caption lookups returned no retrievable tracks; that does not prove there are no platform captions. Metadata/statuses are in `videos.json`; no transcripts were captured. Caption acquisition and transcript-to-concept timestamp mapping remain pending. Do not manufacture transcript evidence or mirror full captions publicly.

## Class → vault → atlas

1. Receive class material, confirm dates/boundaries, and update the private vault through Jovan's normal workflow.
2. Fetch/read the latest relevant vault `main` in a separate read-only checkout. Keep `06 My Notes` outside this workflow.
3. Set `ATLAS_VAULT_PATH` to that checkout and run `npm run atlas:update`. It compares file hashes, validates the public catalog and reports changed evidence, stale sources and current content gaps. It does not publish raw notes or make live schedule changes automatically.
4. Manually review the changed evidence. Update normalized sources, edition schedule, companions, concepts, questions and coverage together. Use stable IDs and distinguish verified, student-confirmed and unknown dates.
5. Run `npm run content:check` and the complete suite. Review original questions, numerical templates, source attribution and private/copyright boundaries.
6. Accept the new hash baseline only after review: `npm run atlas:update -- --accept-hashes`. Update the authority commit and snapshot date deliberately.
7. Commit a coherent milestone and push `main`; verify CI and the actual deployed deep routes.

Validators reject duplicate IDs, invalid schemas/dates, missing targets, prerequisite cycles, missing question coverage/source mappings, absent original question answers and known leakage patterns. Automated leakage matching is a guardrail; it is not a substitute for reading the diff and history.

Do not equate a public teacher link with redistribution permission. Link to copyrighted sources and write original companions. Japanese tutoring/prompts stay within independent study; submitted class work forbids AI/translator-written answers.
