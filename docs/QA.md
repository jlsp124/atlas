# V2 verification evidence

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
