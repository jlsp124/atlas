# Private product analytics

The private admin page has Product use, Accounts and Feedback areas. Server
roles authorize every `/admin/report`, `/admin/accounts` and inbox operation;
frontend role checks provide navigation only. API responses use `no-store`.
No production account or behavior records are fetched during the static build.

## Collection and privacy

Analytics remain optional and off by default. `src/core/product-analytics.ts`
contains the strict public metadata schema and route allowlist. Unknown routes
become `/other/`; query strings, fragments, arbitrary URLs and unknown IDs cannot
enter product events. Event metadata supports course/material/question/concept
IDs, fixed feature and review-scope enums, release, broad device class, count
buckets, fixed error codes and coarse timing. No learner event payload is copied.

Product events reject answers, search terms, free-form tutoring, uploaded files,
passwords, tokens, email, messages and unexpected fields. Runtime errors record
a fixed code without the browser's error message, stack or filename. Device
classification uses viewport width and does not store user-agent strings.
Feedback is an explicit private submission with its own text/contact storage;
the aggregate product report includes feedback counts only.

Consented guests receive a first-party random analytics ID expiring in 30 days,
independent of the learning device ID. Account and guest sessions use hashed
pseudonyms for aggregate visitor counts. Product sessions may link to the
account privately so account deletion cascades their records. Product reports
never include pseudonyms, session IDs, user IDs, usernames, contact email,
individual histories or submission messages. Account administration is a
separate operation. The optional Recent activity control explicitly requests
`GET /admin/accounts/:id/activity`; it shows at most 15 public event metadata
records. Saved answer/draft values, units, directions and other input content
never appear. The account table states its 250-account limit. Existing username registration does not collect an email;
that absence is stated instead of adding unnecessary personal information.

The additive SQLite migration creates private `product_sessions` and
`product_events` and adds structured feedback context columns. Events and
sessions expire 30 days after receipt/creation, even if a client keeps an old
session active; cleanup runs on ingestion and report generation.
Existing learning history and aggregate tables remain intact. Production data,
SQLite files, operator exports and backups stay outside Git and build contexts.
Only synthetic generated test records are used by tests.

## Active time and sessions

A foreground page contributes five-second active-time buckets only when visible,
focused and interacted with within 60 seconds. Pointer, key and scroll activity
refresh the idle timer without reading event text or input values. A 15-second
heartbeat emits at most 30 seconds per increment; the server further limits
claimed activity by elapsed receipt time. Hidden, blurred, minimized and long
idle tabs earn zero time. Returning after 30 minutes without real activity
starts a new session. A release change also starts a new session so release
comparisons cannot mix versions within a session. Background errors do not
renew user activity. Internal navigation flushes observed time early; browser
unload delivery can still be missed, so the estimates are conservative.

The report exposes active-time buckets, approximate minutes and session/time to
useful-action estimates rounded to 30 seconds. It does not present wall-clock
session duration as time studying. Quick sessions mean under 15 seconds of
observed activity without a useful action; recent sessions may be included.
An empty background sync no longer marks an account as recently active.
Account last activity reflects sign-in, newly submitted work, or consented use;
server sync history cannot reveal another device's unsent local queue.

## Reporting and instrumentation

`GET /admin/report?days=7|14|30` returns schema version 1. It contains aggregate
users/daily visitors, sessions, devices, course/material/feature use, common
feature combinations, routes, navigation transitions, search result buckets,
walkthroughs, Key Ideas, Japanese review scopes, feedback categories/statuses,
fixed error codes, page-load buckets and release comparisons. Page performance
is the DOMContentLoaded timing bucket, not a Core Web Vitals claim. Only observed
releases appear; compare rates, sample sizes and time windows before deciding
that a change helped. Empty reports remain honest about unavailable history.

`startProductAnalytics()` is mounted in Shell after learner initialization.
Legacy `track()` calls use the same strict metadata collector. Public feature
controls may use `data-atlas-feature`; subject-specific actions dispatch
`atlas:product-event` with a valid type and metadata. Shell search records result
buckets after a debounced search, never the query. Japanese review dispatches
start/completion events without typed answers. The Physics `QuestionWalkthrough` and generic `FocusQuestion` emit their own
start/completion metadata. A start means a consented ready guide was mounted
(or resumed); generic help must actually be open. Completion means the student
reached its final guide step after seeing an earlier step in this mounted guide.
A restored final step does not create a completion, and guide completion never
claims assignment completion or a correct answer. Each mounted guide emits each
signal at most once for the current account/question.

The admin can Copy JSON, view/select the same read-only JSON, or download it.
This export is for aggregate product analysis; private account troubleshooting
and feedback messages remain separate. New inbox statuses are `new`, `reviewed`,
`fixed`, `wont_fix`; the UI maps existing statuses without rewriting old records.

## Validation

`tests/product-analytics.test.ts` uses an in-memory database and generated IDs.
It verifies strict privacy fields, route/material mapping, consent, CSRF, role
checks, deduplication, elapsed-time limits, expiry, account cascades, release
aggregation, metadata-free exports and feedback statuses. The browser test
checks private access, actual Copy JSON behavior, account separation and inbox
status changes with synthetic fixtures on desktop and phone.
