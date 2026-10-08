# Deploy atlas

The public static app works without a server. Accounts, sync, the request inbox and real admin data use the optional API. As of October 6, 2026, `/opt/atlas` is running on the home server and exposed through Tailscale Funnel at `https://glucose-games-server.tail428a5c.ts.net:8443`; the listener remains loopback-only at `127.0.0.1:8787`. GitHub Pages remains `https://jlsp124.github.io/atlas/` as the guest/offline layer.

## GitHub Pages

`main` is the release branch. The **Verify atlas** workflow runs the complete suite on Ubuntu and tests the Linux container. A successful push verification triggers **Deploy atlas**, which builds that exact verified commit and publishes `dist` to Pages. Pull requests do not deploy. Actions are pinned to checked commit SHAs.

Enable **Settings → Pages → Source: GitHub Actions**. The project URL is `https://jlsp124.github.io/atlas/`. Private repository Pages requires an eligible GitHub plan; a public repository is the fallback when the plan prevents Pages. Before making source public, audit the complete tracked history for private source and secrets.

This repository started private. GitHub returned HTTP 422 stating that the account's plan does not support Pages for it. After reviewing the reachable history and public derivative, the authorized public fallback was used and workflow Pages was enabled. Private vault material and runtime data remain excluded.

Optional repository **Variables** (not frontend secrets):

| Variable               | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `PUBLIC_API_URL`       | HTTPS API origin, with no trailing path or slash         |
| `PUBLIC_SUPPORT_EMAIL` | Dedicated support contact; never a personal phone number |
| `ATLAS_SITE`           | Site origin; defaults to `https://jlsp124.github.io`     |
| `ATLAS_BASE`           | Site path; defaults to `/atlas`; custom domain uses `/`  |

Changing a variable requires another Pages deployment. Never put credentials in either variable. Empty values keep a complete guest app and a public issue link for non-private support.

For a custom site path, set `ATLAS_SITE` and `ATLAS_BASE` at build time. Keep the manifest, service-worker scope and Astro base consistent. Do not serve the built `/atlas/` app at `/` without rebuilding.

The build writes `/release.json` (under the configured base), containing the full source `deploySha`, base and dirty-worktree flag. A production release must match the successful Verify and Deploy workflow SHA and have `dirty: false`. This receipt is also available offline; bypass the service worker and HTTP cache when verifying a new live deployment.

## Custom production domains

Frontend: **https://atlas.jovanpahal.com/**. API: **https://api.atlas.jovanpahal.com**. The apex `jovanpahal.com` has no web destination. Its email records are independent and must remain intact. GitHub account ownership verification covers the apex and its immediate subdomains; retain the `_github-pages-challenge-jlsp124` TXT record.

The frontend remains GitHub Pages. Set these repository Variables before rebuilding the exact verified commit:

```dotenv
ATLAS_SITE=https://atlas.jovanpahal.com
ATLAS_BASE=/
PUBLIC_API_URL=https://api.atlas.jovanpahal.com
```

Set the repository Pages custom domain to `atlas.jovanpahal.com`, then create a DNS-only CNAME `atlas` pointing to `jlsp124.github.io`. Do not include `/atlas/`, add apex A/AAAA records, or create wildcard DNS. Enable HTTPS once GitHub has issued the certificate. A custom Actions workflow does not require a CNAME file. [Current GitHub domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

The API hostname is a small Cloudflare Worker **TLS/hostname adapter** at [`deploy/api-proxy/worker.ts`](../deploy/api-proxy/worker.ts). It forwards only to the existing HTTPS Tailscale Funnel on port 8443, which reaches **`http://127.0.0.1:8787`** on the Linux server. Authentication, CSRF, sync and SQLite remain on that server. The Worker streams bodies, bypasses caching, rejects redirects and unrelated hostnames, preserves Secure HttpOnly host-only cookies, and logs only a generic upstream-failure code. Automatic request logs and traces are disabled. The original Funnel endpoint remains available for recovery; the unrelated Tailscale port 443 service is unchanged.

A Workers Custom Domain automatically creates the DNS record and a certificate for **the exact multi-level hostname**. This does not require a separate Advanced Certificate Manager subscription. A direct Cloudflare Tunnel hostname at this depth would require additional certificate coverage because Universal SSL covers only one subdomain level. [Current Workers certificate behavior](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#certificates). No paid plan or certificate add-on is enabled by this setup; the existing Workers plan limits apply.

Deploy the tested adapter through the authenticated Cloudflare connector or, after restoring local Wrangler authentication:

```sh
npx wrangler deploy --config deploy/api-proxy/wrangler.jsonc
```

Use the checked-in configuration, disable workers.dev and preview hostnames, and associate `api.atlas.jovanpahal.com` with `atlas-api-proxy`. Attach the verified source SHA to the Worker version. Do not upload credentials, the private vault, source documents or runtime data. The adapter has no secret bindings.

Apply origin configuration **before switching the frontend**. On `/opt/atlas`, keep the protected `.env.server` at mode 600 and set `ALLOWED_ORIGIN=https://atlas.jovanpahal.com`, `ADDITIONAL_ALLOWED_ORIGINS=https://jlsp124.github.io`, `COOKIE_SECURE=true` and `TRUST_PROXY=true`. Initially preserve `COOKIE_SAME_SITE=none` for the old cross-site frontend. Once the new same-parent frontend/API works, use `COOKIE_SAME_SITE=lax` and retest account sync. Cookies remain host-only; tokens never enter localStorage.

**Apply changed environment variables with `atlasctl start`**, which runs Compose `up -d` and recreates containers whose configuration changed. `atlasctl restart` restarts the existing container without reloading its environment. Back up first, then verify loopback health, accepted exact origins, rejected unrelated origins, public API health and live account behavior.

Verify the root release receipt, canonical URLs, assets, Pagefind, downloads, manifest and service-worker scope, saved deep links and offline use. Wait for a successful Verify run and exact Pages/server SHA before reporting deployment. DNS/certificate propagation is separate from application verification.

GitHub redirects the old project URL after custom-domain configuration. Guest browser storage belongs to the old origin: use Settings export/import before cutover. Account events retain their IDs and sync after sign-in on the new origin. Do not claim automatic transfer of cross-origin localStorage.

If login fails before cutover, keep the current Pages domain/build variables. For recovery after cutover, restore the old Pages domain/variables, `PUBLIC_API_URL=https://glucose-games-server.tail428a5c.ts.net:8443` and `COOKIE_SAME_SITE=none`, then rebuild the previously verified release. Accept both exact origins until recovery is confirmed. Do not remove SQLite data, expose port 8787 publicly, disable TLS verification, or weaken cookie security.

## Linux with Docker Compose

For the home-server deployment tooling and operator cheat sheet, see [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md). The watcher only deploys a successful **Verify atlas** run for the exact pushed `main` SHA. The deployment tree is `/opt/atlas`; `~/atlas` is development-only. A file lock serializes deployments, each update creates a consistent SQLite backup, and each image has its immutable source SHA tag. Local health gates marking a release deployed. On failure, code/image returns to the previous SHA while the database stays intact. Review schema migrations before attempting any code rollback.

The production image remains bound to `127.0.0.1:8787`. The separate Tailscale Funnel hostname on port 8443 targets `http://127.0.0.1:8787`; do not forward router ports or change the bind address. The current GitHub Pages and `ts.net` endpoints are cross-site, so production uses `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and the exact Pages origin in `ALLOWED_ORIGIN`. Some browsers block third-party cookies; same-parent custom hostnames are the long-term fix. `TRUST_PROXY=true` is set because the tunnel is the public path to the loopback listener.

Backups use `server/backup.ts`'s SQLite online backup API and are stored on the host at `/home/jovan/.local/share/atlas/backups`, mounted into the container at `/app/data/backups`. The daily `atlas-backup.timer` retains 30 days. This is still on the same host; arrange an encrypted off-host copy separately if desired. Nothing uploads backups automatically.

The systemd watcher runs every two minutes; it is not a self-hosted Actions runner. It queries GitHub Actions for the exact `origin/main` SHA and deploys only an event=`push`, branch=`main`, completed successful `Verify atlas` run. It backs up before deploying and rolls code/image back on failure while preserving the database. `atlasctl update` runs the same guarded process. `atlasctl stop` never removes data.

The existing GitHub Pages workflow is preserved. The repository variable `PUBLIC_API_URL` is public build configuration; after DNS and the HTTPS API hostname exist, set it to the API origin and configure the Pages custom domain under the same parent domain. No support email is inferred.

The Tailscale Funnel endpoint remains the upstream and recovery URL. Follow the custom production domain instructions above for `atlas.jovanpahal.com` and `api.atlas.jovanpahal.com`. The root `jovanpahal.com` does not need a web destination; only those subdomains and the GitHub-supplied verification TXT record are needed. Preserve cookie security and never substitute browser-stored bearer tokens.

Install Docker Engine and the Compose plugin using your distribution's supported instructions. Clone this repository to a directory you control. Create `.env.server` with permissions `600`; this file is ignored by Git:

```dotenv
ALLOWED_ORIGIN=https://jlsp124.github.io
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
TRUST_PROXY=false
ATLAS_DEPLOY_SHA=operator-supplied-commit
```

`ALLOWED_ORIGIN` is the exact **frontend origin**, without `/atlas/`. Production refuses insecure cookies and non-HTTPS origins. The API cookie is host-only, HttpOnly, Secure, path `/`, and expires in seven days.

```sh
chmod 600 .env.server
docker compose up --build -d
docker compose ps
curl --fail http://127.0.0.1:8787/health
```

Compose exposes only `127.0.0.1:8787`, persists SQLite in the `atlas-data` volume, runs as an unprivileged user, drops capabilities and uses a read-only root filesystem. Do not change the binding to a public interface or configure router port forwarding.

The image uses Node 24.21.0 LTS. A separate build stage installs Python/Make/C++ to compile the SQLite binding; those build tools are omitted from the runtime image. Fresh data directories are `700`, database/backup files are `600`, and CI verifies these permissions on Linux.

### HTTPS and browser cookies

Point an existing HTTPS reverse proxy or Cloudflare Tunnel to `http://127.0.0.1:8787`. Configure the public API hostname in `PUBLIC_API_URL`, then rebuild Pages. Trust proxy headers only when your deployment actually controls the proxy path; if enabling `TRUST_PROXY=true`, the API must remain reachable only through that trusted local proxy.

GitHub Pages and a separate API domain are cross-site. `SameSite=None; Secure` is necessary for that setup, but browsers can still block third-party cookies. atlas verifies cookie acceptance before reporting sign-in success and keeps guest learning available if blocked. For dependable account sync, use a custom Pages domain and API subdomain under the **same parent domain**, then use `COOKIE_SAME_SITE=lax`. Test Safari, Firefox and your actual phones before announcing synced accounts.

The Pages build has `PUBLIC_API_URL` set as a repository variable. Current browser account registration from the in-app browser did not complete; see [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md) for the tested endpoints and cross-site cookie limitation.

### Bootstrap Jovan once

Normal registration cannot claim `Jovan` or choose an admin role. Supply a unique secret interactively on the server; no default password exists:

```sh
read -r -s -p 'Admin password (8–128 characters): ' ATLAS_ADMIN_PASSWORD
printf '\n'
export ATLAS_ADMIN_PASSWORD
docker compose run --rm -e ATLAS_ADMIN_PASSWORD atlas node --import tsx server/bootstrap.ts
unset ATLAS_ADMIN_PASSWORD
```

Bootstrap refuses to overwrite an existing account. Keep the administrator password in a password manager. Remove the bootstrap variable from shell/deployment environments afterward. Admin MFA and recovery email are not implemented; keep access narrow until the next authentication milestone.

## Persistent data, backups and restore

Migrations run transactionally on startup and have monotonically numbered records. The database uses WAL, foreign keys and a busy timeout. The data directory and backups contain private account/progress/request information; never place them under the static site or commit them.

Create a consistent SQLite backup while the service runs:

```sh
docker compose exec atlas node --import tsx server/backup.ts
```

This uses SQLite's backup API, not a copy of a potentially incomplete live WAL database. Backups go to `/app/data/backups`. Copy them to a separate protected location, encrypt off-server copies, choose an explicit retention period, and test restoration periodically. Do not treat one volume or one server as a backup.

Restore procedure:

1. Stop the service with `docker compose stop atlas`.
2. Make a cold copy of the entire data volume, preserving permissions, as a rollback point.
3. In the stopped volume, move the current `atlas.sqlite`, `atlas.sqlite-wal` and `atlas.sqlite-shm` (if present) into a separate dated rollback directory. Keep them together.
4. Copy a **chosen** consistent backup to `atlas.sqlite`; retain ownership for the container's `node` user and permissions `600`. Do not reuse old WAL/SHM files with the restored database.
5. Start the service, check `/health`, test login and sync, and compare expected account/event counts. Keep the rollback copy until verified.

Account deletion removes live account-linked rows. Old protected backups may retain data until your retention period expires; describe that policy to users.

## Linux with systemd

The alternate example is [`deploy/atlas.service`](../deploy/atlas.service). Install Node 24.21.0 LTS (or a newer maintained Node 24 patch) and dependencies with `npm ci --omit=dev` in `/opt/atlas`. The SQLite binding needs Python and a C++ build toolchain; on Debian/Ubuntu, install `python3` and `build-essential` before dependency installation. Create a dedicated non-login `atlas` account, give it a private `/var/lib/atlas` directory, and set `/etc/atlas/server.env` to owner-readable configuration:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=8787
DATA_DIR=/var/lib/atlas
ALLOWED_ORIGIN=https://your-frontend.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
TRUST_PROXY=false
```

Adjust the `ExecStart` Node path to your actual installation. Install and enable the service using normal administrator tools. Keep secrets out of the unit file and repository. Run bootstrap and backup as the `atlas` service user with the same environment/data directory. The unit grants write access only to `/var/lib/atlas` and uses `UMask=0077`.

## Update and rollback

Back up first, pull the intended reviewed commit, build the new container, and restart with Compose. Verify health, login, queued-event reconciliation and admin access. Keep the prior image and backup available. Older application code may not understand future schema migrations, so a rollback may require the corresponding database backup. Never silently reset or overwrite production data.
