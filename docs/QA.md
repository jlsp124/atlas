# October 7 Atlas Beta assignment redesign

The final `npm run check` passed locally on Windows: formatting, ESLint,
Astro/TypeScript (97 files, zero errors/warnings/hints), 105 unit/backend tests
in seven files, content validation, the production build and all 78 browser
tests across desktop and phone. No browser tests were skipped. A separate
`npm audit --audit-level=high` reports zero vulnerabilities.

The new coverage verifies the complete science document catalog without default
answer forms; persistent Physics terms, rearrangement, units and saved question
position; the provenance of all eight Lewis electrons; configuration totals and
core notation; conversion cancellation; Biology evidence; completion and unit
filters; quick feedback receipt, context, failed drafts and focus; custom 404
search; reduced motion; and working, Back and Japanese navigation on small phones.
Existing account isolation, two-context sync, offline queue/reconnect, guest
progress, restricted Chemistry, source intake and Japanese checks also pass.

The built-app visual pass captured 80 states at 1920×1080, 1440×900, 1366×768,
390×844 and 360×800, in both themes, with no JavaScript page errors or horizontal
overflow. The inspected states include unit rows, full assignments, focused
Physics/Chemistry/Biology/Japanese, feedback sheets and the 404. Inspection led to
compact focused headers, visible restored/new working, a persistent phone header,
Back revealing the prompt and a single-row Japanese rating control. This supports
the automated accessibility checks; it is not a complete manual WCAG certification.

The catalog remains 50 materials and 353 contextual checkpoints. The 285 science
questions use 60 numeric Physics guides, 30 configuration guides, 11 conversion
guides, one labelled Lewis example and 183 paced written/setup guides. The other
68 checkpoints use Japanese recall. Missing original figures and molecule/species
lists still require the class material. Presentation coverage is not a claim of
automatic grading or complete reconstruction of classroom diagrams.

The production build has 222 routes, 223 HTML files, 220 indexed pages and 557
offline assets (about 7.8 MiB). Vite reports its shared-chunk size warning above
500 kB; the build succeeds. No dependency, database migration or new environment
variable was added. Catalog/ingestion data, source intake, event-store persistence,
the original learning engine and offline generation have no diff. The additive
paper-progress event and matching server validation are covered by the tests.

This redesign is local and has not been published. Linux CI/container validation,
an exact deployed revision and live validation of the new API event are NOT RUN
for these changes. Deploy the matching server validator before the frontend. The
Hostinger connector could not provision an Atlas mailbox; mailbox setup and email
delivery remain unverified. See [Support](SUPPORT.md) for the exact hPanel step and
[Assignment redesign](ASSIGNMENT_REDESIGN.md) for the implementation scope.

## Historical October 6 classwork verification

The classroom milestone contains 50 material entries and 353 contextual
checkpoints. Written responses, diagrams and configuration notation use honest
self-check criteria; the checkpoint count is not a claim that every photographed
question is automatically graded. The three restricted Chemistry hand-ins contain
metadata only.

`npm run check` passed locally: formatting, ESLint, Astro/TypeScript (82 files,
zero errors/warnings/hints), 96 unit/backend tests in six files, the production
build, and all 54 browser tests across desktop and phone. The browser checks include
account/guest isolation, two-context difficulty-rating sync, offline reconnect,
exact-question repair and return, Japanese input and stroke controls, restricted
hand-ins, percent error, and Help/About in a tiled desktop. Existing light/dark
accessibility and reflow checks pass. `npm audit --audit-level=high` reports zero
vulnerabilities.

The production build has 222 routes, 223 HTML files, 220 indexed pages and 554
offline assets (about 7.4 MiB). All six pages of the fillable lab template and the
one-page vowel practice sheet were rendered and inspected. The lab fields are
blank and contain no student work.

The live update workflow refreshes the bounded teacher sources and compares the
private registry and permitted vault hashes. After accepting the reviewed vault
authority changes, repeated unchanged applies must report zero source, companion,
teacher and vault changes, zero errors and zero writes. The CLI regression test
also verifies unchanged bytes and modification times across two identical intakes.

Ubuntu CI and deployment are verified against the final pushed SHA separately;
Windows checks alone do not establish Linux runtime behavior. The existing
production API is configured and reachable. Real hardware, third-party cookie
policies, missing classroom sources and unconfirmed dates remain distinct from
the local browser tests. The release receipt records final CI, Pages and live API
results.

## Historical V2 verification evidence

Checked October 5, 2026, in America/Vancouver. The redesign started from fetched main bd9d057d2bc51ffffcc269b540ccf1dc44de05e8, after inspecting the V1 live site, routes, models, content and tests. The baseline complete suite passed: 71 unit/backend and 32 browser tests.

## Local gates

| Check                    | Result | Evidence                                                                        |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| Formatting / ESLint      | PASS   | npm run check; no diagnostics                                                   |
| Astro / TypeScript       | PASS   | 71 files; zero errors, warnings or hints                                        |
| Unit / backend           | PASS   | 78 tests in five files; original 71 retained                                    |
| Content                  | PASS   | Four courses, 61 concepts, 198 questions, 76 items, four original companions    |
| Production build         | PASS   | 173 routes; Pagefind indexes 171 pages                                          |
| Browser flows            | PASS   | 44 tests across desktop and phone; no skips                                     |
| Accessibility            | PASS   | 21 states × two themes × two viewports = 84 axe scans                           |
| Dependency audit         | PASS   | npm audit --audit-level=high; zero vulnerabilities                              |
| Engine/data preservation | PASS   | No diff in core, client/store, catalog, ingestion, backend or offline generator |

The seven new presentation tests ensure every published concept and required small item remains reachable, each companion maps to its actual unit, required learning stays ordered and bounded, teacher links match the ingestion index, search includes related classwork/prep and Japanese, and missing content/dates stay honest.

Browser checks cover three-screen onboarding; course selection/account entry; V1 stored choices/theme/tasks/evidence; unit Learn/Classwork; answer disclosure; definitions/backlinks/Escape/focus restoration; stepwise math; confusion/known checks; prerequisite repair preserving the original question and seed; hinted answers requiring review; complete Learn this first with exact worksheet scroll/task return; Japanese typed production and guarded AI context; three-group search; Calendar/prep/unknown content; theme/text-spacing/reflow; real two-device sync and guest isolation; authorized admin/requests; production base paths; offline persistence; and installed waiting-worker updates across navigation.

Accessibility scans include all three introduction steps, 14 ordinary routes, an active question and its feedback, definition and search overlays in light/dark at desktop/phone sizes. Reflow/text spacing also passes at 320px. These automated checks supplement keyboard/focus and visual inspection; they are not a complete manual WCAG certification.

## Visual acceptance

Multiple screenshot passes cover 1920×1080, 1440×900, 1366×768, 390×844 and 360×800 in light/dark. Screens include introduction/setup, Home, course, unit, Classwork, Learn/representation, companion, definition sheet/inspector, Learn this first, active practice, Calendar, Search, account, assessment prep and About.

The initial pass found form ownership during nested repair, reading controls on phones, oversized question text and short-desktop Home spacing. These were corrected and rechecked. Home fits the requested desktop viewports, including a Continue action at 1440×900 and 1366×768. Long companions scroll intentionally. No horizontal overflow or JavaScript page errors appeared in the completed local screenshot pass.

Screenshots and measured report.json files are delivery artifacts outside the Git repository. The final delivery records the immutable deployed SHA and live screenshot pass. A local build or historical V1 release does not establish V2 live acceptance.

Live review also removed duplicate plain-text equations beside rendered math. The source catalog stays intact; the presentation supplies a short explanation and typesets all three constant-acceleration relations.

## Release gate and live checks

[Verify atlas](https://github.com/jlsp124/atlas/actions/workflows/verify.yml) runs the entire suite on Ubuntu/Node 24.21.0, dependency audit and existing Linux container checks. [Deploy atlas](https://github.com/jlsp124/atlas/actions/workflows/pages.yml) publishes that exact successful commit.

After deployment, inspect https://jlsp124.github.io/atlas/ with fresh browser contexts at all five sizes/both themes. Check published modules/fonts, deep routes, Japanese/math, Search, definitions and guest persistence. Check the real service worker and an unvisited route offline. Record actual screenshots and release identity before declaring completion.

The generated PWA caches 445 static assets, about 5.3 MiB. The unchanged cache mechanism includes static deep routes, fonts and Pagefind; never API responses. Updates remain explicit and actionable across navigation.

## Limits

Real accounts/sync are verified against the local optional API. No public API variable is currently configured. Production server DNS/TLS, real-device cross-site cookies and production backup restore are separate operator checks. Linux container execution is established by CI, not by Windows tests.

The reviewed bank is a subset of classroom material. Chapter 19, confirmed assessment scope/dates, captions, subject review, recovery/MFA and authoritative Japanese audio/handwriting remain documented content/operator work.
