# atlas V2 design authority

**The internal system can be complicated. The student experience must be extremely simple.**

This authority supersedes the old dashboard, timetable hierarchy, graph navigation and coach marks. Do not restore those surfaces because the engine supports them.

## Information architecture

**Course → Unit → Learn / Classwork.** Physics 11, Chemistry 11, Life Sciences 11 and Introductory Japanese 11 are independent teacher/edition workspaces. Never display personal periods, course order claims or “verified” in student navigation. Past units stay accessible. Calendar owns dates.

Home answers what's coming up, what to resume and which courses you've added. Course overview is a compact unit list. A unit has two primary choices: Learn and Classwork. Resources and dates are secondary actions.

Routes: Home, Courses, Course, Unit, Learn topic, Assignment, Practice, assessment Prepare, Calendar, Account, About and Help. Search is a dialog. Preserve legacy concept/course links. Explore is omitted; semantic relationships remain through backlinks and the engine.

## Research and identity

A restrained application with a distinct identity. Neutral panes, aligned rows, deliberate typography. No marketing hero, LMS, AI SaaS or analytics dashboard.

Research informs principles, not imitation:

- [Linear's interface redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): layered navigation, lower chroma, alignment, testing across views. A 2024 design account, not a claim about the latest release.
- [Apple sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars): persistent wide-screen navigation, compact-device adaptation.
- [Brilliant learning paths](https://brilliant.org/help/features/what-are-learning-paths/): directed teaching with a clear next step.
- [Geist](https://vercel.com/font): precise variable grotesk rhythm. Self-host the Latin subset.

The original identity motif is scattered coordinates resolving into one path. Use a small SVG on first launch, About and account moments. No globe, compass, stars, glass, glow, generic gradient or graph background. Wordmark: **atlas.**

## Desktop and mobile shell

Desktop: persistent left sidebar (atlas., Home/courses, Calendar, Search; account/settings and Help at the bottom), a large main pane, and an inspector only when a term or source is opened. Navigation never requires scrolling to the top. Home primary content fits approximately at 1440×900; primary actions remain visible at 1366×768. Long assignments/reference documents can scroll naturally.

Mobile: no squeezed sidebar. Four bottom destinations: Courses, Calendar, Search, You. Course/unit navigation belongs inside the workspace. Learn and practice use focused full-screen layouts. Definitions use bottom sheets. Safe-area insets; touch targets at least 44px; internal sheet scrolling when necessary.

## Surfaces, color and type

Prefer rows, dividers, panes and whitespace. Cards only for distinct selectable objects or focused prompts; never nested cards. Neutral borders, modest radius, restrained overlay shadows. Tabs show selected text/underline and keyboard focus. One primary action per decision point.

**Green is permanently excluded from global brand and success states.** Light: warm off-white, white surfaces, near-black text, gray dividers. Dark: true graphite, neutral surfaces, near-white text, gray borders. Global interaction accent: indigo. Restrained course accents: Physics cobalt, Chemistry violet, Life Sciences amber, Japanese vermilion. Use tiny icons, selected paths and calendar marks, not whole-page themes. Correctness uses a check and words, never color alone.

Geist Sans variable, locally served with system fallback. Japanese uses native Hiragino/Yu Gothic/Meiryo/Noto Sans JP fallbacks and about 1.85 line height. Math stays KaTeX. Four levels: Display only for identity; Title about 28–32px screens/20–24px sections; Body 16–18px at 1.6–1.75; Meta 13–14px, normal capitalization. Tabular numbers for dates/forms. Spacing follows 4px rhythm: 8/12/16/24/32/48. No constant tiny uppercase labels or oversized ordinary headings.

## Learning, practice and disclosure

Three dedicated onboarding screens: promise → choose courses → save setup. Encourage accounts; local use remains available. Existing setup stays intact. No automatic walkthrough.

Learn is an ordered path. One idea, representation, worked example or check at a time. Why/detail/AI are secondary. All required concepts and small facts remain reachable through the path and “Still to check”; simpler UI must not shrink the blueprint.

Invisible prerequisite repair: “Before this, let's check one thing.” Wrong: “This is probably the part getting in your way.” → “Fix this first” → teach/check → automatic return to original target. “I know this” means a quick check, never mastery. Confusion records evidence and offers a useful next step.

Practice exposes Quick check and Review unit; assessment context exposes Prepare. Retain diagnostic, construction, transfer, spacing and coverage internally. One question, immediate feedback, Continue. Summary: Looks good / Review / Still to check. Wrong unhinted attempts are tested but need review. Never claim the reviewed blueprint is the whole syllabus.

## Classwork, definitions and sources

Group by unit/material set, preserving actual source relationships. Never invent teacher worksheets or due dates. Typeset authorized material with numbering, sections, formulas and diagrams. Restricted handouts stay linked; original Atlas companions are clearly identified. Reveal legitimate answers per question via Check answer.

“Learn this first” selects the assignment's required ideas, preserves checked tasks and reading position, teaches/checks them and returns to the worksheet. Strong students may check quickly. Self-report cannot skip proof.

Important words are real keyboard-accessible buttons with subtle underlines. Definition first, one Learn this action, optional Related/Used in links. Desktop contextual inspector is dismissible; mobile modal sheet manages focus. Source details use explicit secondary controls, not blocks below every document.

## Calendar, search, accounts and voice

Calendar defaults to Week; Month is secondary. Selected-course events use accents; holidays neutral. Events open relevant work/unit/prep. Unconfirmed dates remain separate and are never placed as confirmed events.

Search: Cmd/Ctrl+K dialog; Learn / Classwork / Other. Include aliases, formulas, kana, romaji, resources, units and related assessments. Accounts, secure sync, offline, export/import, privacy and admin remain functional; settings owns sync detail. Admin may remain dense.

Voice: short, normal, useful. First person for maintenance (“I haven't added Chapter 19 yet.”), second person for guidance (“Start here.”). No third-person Jovan, engine jargon, evidence states or provenance prose in ordinary UI. About explains why I built it. Policy/source details stay in Help/About or an explicit source action. Japanese assessed-work safeguards remain in tutoring prompts. AI is secondary: Need more help? → Ask an AI → intent.

## Accessibility, motion and acceptance

Semantic landmarks/headings, real links/buttons/labels, visible focus, Escape/focus restoration, live feedback, no color-only states. Reflow at zoom. Math/long URLs may scroll locally without document overflow. Respect reduced motion. Short pane/step/sheet transitions; no bouncing or perpetual motion.

Inspect screenshots at 1920×1080, 1440×900, 1366×768 and realistic phones, light/dark: onboarding, Home, course, unit, Learn, assignment, definition, practice, Calendar, Search, account. Multiple visual passes: first priority, choices, unnecessary scroll, card clutter, generic appearance. Inspect deployed Pages after release.

## Preservation contract

Keep IDs, prerequisites/backlinks, question bank, coverage items, learner evidence, task IDs, offline, account separation/sync, source records, ingestion and backend tests. V2 is a presentation layer over the catalog and engine. The existing atlas:v1:* event storage remains valid; no reset or schema migration is needed. Do not rewrite server, auth, database, sync or deployment for this UX.
