# atlas V2 release report

The redesign replaces the student product experience while preserving the learning system. [UX.md](UX.md) and [SPEC.md](SPEC.md) govern future changes.

1. **Live URL:** https://jlsp124.github.io/atlas/.
2. **Release identity:** [Deploy atlas](https://github.com/jlsp124/atlas/actions/workflows/pages.yml) publishes the exact commit accepted by [Verify atlas](https://github.com/jlsp124/atlas/actions/workflows/verify.yml). The delivery includes the deployed SHA, immutable run links and live screenshot receipts.
3. **Information architecture:** Course → Unit → Learn / Classwork. Four independent teacher/edition workspaces; past units remain accessible.
4. **Navigation:** Persistent desktop courses/Calendar/Search/account, four mobile destinations, two primary unit choices. Cmd/Ctrl+K opens Search.
5. **Identity:** Original coordinates resolving into a path, lowercase atlas., warm neutral light and true graphite dark. Indigo interactions; restrained cobalt, violet, amber and coral course marks. Green branding is removed.
6. **Typography:** Self-hosted Latin Geist variable; deliberate display/title/body/meta hierarchy. Native Japanese glyph stack and generous line height; KaTeX remains.
7. **Mobile:** Courses / Calendar / Search / You, contextual course back links, definition sheets and focused full-screen teaching/practice.
8. **Desktop:** Persistent sidebar, large main pane, contextual inspector only when requested. Home including Continue fits 1440×900 and 1366×768.
9. **Courses/units:** Unit-first course list, teacher context, Learn/Classwork tabs, secondary resources/dates. Personal periods and course-order claims are absent.
10. **Learn:** Ordered paths expose all published ideas. Concept, representation, worked example and actual bank checks appear one step at a time. Foundation repair returns automatically to the original target.
11. **Classwork:** Unit/material-set rows lead to deliberately typeset original companions, stable task checklists and per-question Check answer. Restricted teacher materials remain linked.
12. **Definitions:** Important terms open a short definition and Learn this action, with Used in/Related backlinks. Keyboard focus and mobile sheets are managed.
13. **Learn this first:** The companion's required topics form a bounded ordered sequence. Completion returns to the exact reading position and preserves checked tasks.
14. **Practice:** Quick check / Review unit, plus assessment Prepare. Immediate feedback; Looks good / Review / Still to check. Hinted answers do not claim independent success.
15. **Removed primary features:** Graph renderer/navigation, coach marks, dashboard evidence panels and ten exposed modes. Internal relationships and adaptive modes remain.
16. **Explore:** Omitted intentionally.
17. **Accessibility:** 84 local axe scans across themes/viewports; keyboard/Escape/focus tests, 320px reflow, text spacing and reduced-motion support.
18. **Visual QA:** Multiple screenshot passes at 1920×1080, 1440×900, 1366×768, 390×844 and 360×800. Live acceptance is documented with the delivery after deployment.
19. **Tests:** Complete npm run check: formatting/lint/types, 78 unit/backend tests, full content validation, 173 routes and 44 browser cases. Dependency audit clean. Real sync/offline/waiting-update tests retained.
20. **Remaining work:** Connect the separately maintained public API; curate Chapter 19/future content; confirm Physics date, Chemistry scope and Japanese rubric; complete caption/audio/recovery work. Existing server, auth, sync, database, ingestion and source safeguards are preserved.

This frontend release does not provision the separate home server. Account sync, the private request inbox and admin need its configured API. Source material and content remain governed by [CONTENT.md](CONTENT.md) and [NOTICE](../NOTICE.md). See [QA.md](QA.md) and [Implementation status](IMPLEMENTATION_STATUS.md) for continuation boundaries.
