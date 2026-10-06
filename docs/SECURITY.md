# Security and privacy

The static site ships only reviewed public derivative content. The optional API handles private account state. A running API is never required to read, study or use local progress.

## Authentication and authorization

- Argon2id with unique library-generated salts, 64 MiB memory, three iterations and one lane. Passwords must be 12–128 characters; bootstrap requires 16–128.
- Cryptographically random 32-byte opaque sessions. Only their SHA-256 hashes are stored server-side. Seven-day expiry, HttpOnly host-only cookies, Secure in production, configured SameSite. No bearer credential goes into localStorage.
- Every mutation checks an exact allowed origin, an atlas header and JSON content type. Account mutations also require a constant-time verified session CSRF token. CORS permits only the configured frontend origin.
- SQLite queries use parameters. Strict Zod payloads reject role injection, arbitrary fields, raw answers and unknown content mappings. All user text renders through React escaping.
- Login, registration, requests and global API activity are throttled. The service has a 128 KiB request limit and bounded sync pagination.
- Server-side roles protect all admin reads/actions. Ordinary registration reserves `Jovan`; one-time CLI bootstrap cannot overwrite it. A cached local username/user ID restores an offline workspace only; it grants no authentication or admin authority.
- Production fails closed for insecure cookies or a non-HTTPS origin. SameSite=None requires Secure. Cookie acceptance is checked by the browser before sign-in is reported successful.

The API uses Helmet security headers and `Cache-Control: no-store`. GitHub Pages controls hosting headers; a strict frontend CSP through HTTP headers requires a custom proxy/host. KaTeX uses `trust:false`, annotations are escaped and source URLs are curated. No unsafe uploads, arbitrary HTML ingestion or live model-generated questions are exposed.

## Offline and sync boundaries

Guest and each account have separate local stores. The local remembered-account hint contains only ID/name and is deliberately downgraded to a user role until the server authenticates it. Events survive offline route changes and are queued to the account scope. Logout revokes the server session and restores the separate guest store; completing logout currently requires the API to be reachable. On shared devices, sign out while online and clear browser data if needed.

Sync uploads at most 100 strict events per batch, keyed by account plus UUID. Retries are idempotent. Conflicting content for an existing UUID, including within the same batch, is rejected without replacing evidence. The download cursor is a server sequence, not the student's clock. Preferences use chronological last-event projection with a deterministic UUID tie-break. Clock errors over five minutes into the future are rejected and retained locally for review.

Correctness is a client-reported personal study signal, not a trusted grade or anti-cheating score. A malicious client can falsify its own progress; it cannot retrieve another account's events or authorize admin. There are no rankings or shared competitive rewards.

The service worker only caches same-origin static `/atlas/` GET resources. It never caches API responses or authentication. Versioned caches offer an explicit update action and remove old app caches on activation. The first installation does not force a disruptive reload.

## Data minimization

Learning events contain IDs, correctness, hints, timing, seed, timestamp and preferences/checklist markers. Typed answers, private written work and search queries are not persisted in sync/analytics. Analytics are optional and off by default. Product counts separate guest/account actors without collecting guest identity; consented account daily-activity rows support coarse return counts.

Account deletion rechecks the password and cascades live events, sessions, activity and linked requests. Aggregate counts are not individually attributed and remain aggregate. Other devices and old backups may retain data until explicitly cleared/retention expires. The privacy page states these limits.

The service disables routine request logging and redacts headers/body. It logs lifecycle and safe error codes, rather than credentials or user submissions. Rate limiting uses network addresses transiently; proxy/GitHub hosting logs are controlled by those operators. Choose a narrow retention policy for any operator logs and backups.

On Linux, database files are explicitly owner-readable/writable (`600`), including first creation through bootstrap rather than the service wrapper. Backup creation sets a private umask and owner-only file permissions. A fresh container data directory is `700`. Windows ACLs are platform-controlled; Linux CI checks the actual POSIX modes while running non-root with dropped capabilities and a read-only root filesystem.

## Next authentication milestone

MFA/passkeys/TOTP and recovery email are not shipped. Add them in versioned migrations and a dedicated authentication module before widening administrator use:

1. Add verified recovery-contact and challenge tables; keep the address optional, encrypted at rest where practical, and separate from public profile/analytics.
2. Use short-lived, one-time hashed recovery tokens with resend/reset throttles, session revocation and enumeration-resistant responses.
3. Add a maintained WebAuthn/passkey implementation, administrator enrollment requirements and explicit recovery codes; never implement custom cryptography.
4. Separate a pending-login challenge from a fully authorized session so the server cannot skip MFA. Test replay, cross-origin binding and recovery paths before enabling them.

No recovery route or fake MFA switch exists in the current UI. The account page clearly says recovery is unavailable. HTTPS hosting and cookie behavior on the actual deployed API still require operator validation.

Dependencies are pinned in the lockfile, Actions are pinned to verified SHAs, and CI audits dependencies. Report a vulnerability privately to the repository owner through an available private GitHub channel; do not post sensitive account information in public issues.
