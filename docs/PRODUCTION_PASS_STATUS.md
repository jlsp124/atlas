# October production pass checkpoint

User product contract: docs/SUBJECT_MODELS.md. Physics remains unchanged apart from metadata-only analytics hooks.

- Home/mobile: ba3d2ef, version0.1.2. Full CI passed112 browser tests; exact frontend and API receipts verified live.
- Life Sciences:36faec4, version0.1.3. Separate real sections, external teacher notes, Key Ideas/backlinks, separate review. Final focused desktop/phone checks6/6 passed; CI was in progress at the urgent final push.
- Japanese:01bb226, version0.1.4. Weekly scope, vocabulary sets, adaptive review, reading modes and kana. All140 unit tests and16 targeted desktop/phone checks passed before the final aliases/deep-link corrections; correction unit checks8/8 passed. Final deep-link browser checks2/2 passed.
- Admin:version0.1.5. Private aggregate JSON report, accounts, explicit metadata-only activity operation, feedback statuses, consented product events, active-time buckets and release comparisons. Targeted analytics/server tests33/33 and TypeScript passed. Private dashboard/auth browser checks6/6 and actual opt-in search/hidden/idle checks2/2 passed. Updated legacy inbox checks are pending full CI.

The user requested an immediate push because the session was near its time limit. Preserve the separate stage commits but prioritize saving all completed work remotely. Production auto-deploy remains gated on the exact successful Verify atlas main SHA. Confirm both release.json and API /health; a pushed commit is not proof of deployment.

Chemistry has NOT started. Do it last after the prior stages deploy: Assignments/Notes/Labs, smallest useful help, meaningful visuals for difficult concepts, faithful filled notes only from authorized authoritative evidence, preserve assessed-hand-in restrictions. Update October2026 schedule using the user's exact dates. No new future dates.

Source gaps: original306-photo Windows archive/registry unavailable on this Linux host; no verified17.1 question sheet or original chapter review questions; no checked filled NOVA answer set. Japanese lacks first grammar sheet, further taught kana/strokes, audio and Anime Project rubric. Do not invent these.

Analytics stays opt-in. Production data stays in private SQLite/server, never repository/build. Product exports omit emails, IDs, messages and individual histories. Typed Japanese responses remain ephemeral; synced recall outcomes contain metadata only. Activity excludes hidden/unfocused/idle tabs and is approximate. Account registration currently collects a username rather than email.

Remaining final QA: private admin browser flows and actual event wiring; both deployment receipts; Chemistry; full end-to-end product checks. Test screenshots/logs use synthetic data and live outside the repository in the owner's local atlas QA folder.
