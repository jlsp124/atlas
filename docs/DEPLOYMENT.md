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

## Coordinated domain cutover

Target frontend: **https://atlas.jovanpahal.com/**. Target API: **https://api.atlas.jovanpahal.com**. The October 7 access check confirmed authenticated GitHub repository/Pages access. Cloudflare CLI credentials were expired and could not refresh, including with Wrangler 4.148.0; the browser also required sign-in. Local `cloudflared` and its account certificate were absent. The server was online in Tailscale, but SSH required a fresh identity check. No custom-domain, DNS, cookie or production-origin changes were applied.

**Cloudflare login required.** On this computer, sign in at [the Cloudflare dashboard](https://dash.cloudflare.com/login), using the existing GitHub sign-in, and make the `jovanpahal.com` zone available. Do not paste credentials or tunnel tokens into chat. To restore server access, run:

```powershell
& 'C:\Program Files\Tailscale\tailscale.exe' ssh jovan@glucose-games-server.tail428a5c.ts.net
```

Complete the fresh Tailscale identity check shown by that command. It verifies the server host key against the coordination server; do not disable SSH host-key verification. Once these two logins are complete, the prepared cutover can be applied without changing the application or progress IDs.

Apply in this order:

1. Verify ownership in GitHub account **Settings → Pages** for `jovanpahal.com`, adding the exact TXT record GitHub supplies. Keep that verification record. GitHub recommends ownership verification before custom-domain use to prevent takeover. [Official verification instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
2. On `/opt/atlas`, add `ADDITIONAL_ALLOWED_ORIGINS=https://atlas.jovanpahal.com` to the protected `.env.server`, retaining `ALLOWED_ORIGIN=https://jlsp124.github.io`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none` and `TRUST_PROXY=true` during the transition. Restart through `atlasctl`, verify health, and test CORS/CSRF for both exact origins. The server refuses malformed origins, wildcards and insecure production origins.
3. Check Cloudflare **SSL/TLS → Edge Certificates** for coverage of `api.atlas.jovanpahal.com` before publishing it. This is a second-level subdomain: Universal SSL on a full DNS zone covers only the apex and first level. A tunnel at this depth requires a suitable advanced/custom certificate; **Total TLS does not issue certificates for Tunnel hostnames**. Inspect existing plan/certificate access after sign-in and do not assume coverage or buy a paid add-on without authorization. [Universal SSL limits](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/), [Tunnel multi-level hostname requirement](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel-api/) and [Total TLS limitations](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/total-tls/).
   Create or reuse an authenticated Cloudflare Tunnel on the **Linux API host**. Prefer a remotely managed tunnel in the dashboard; install its official connector as a service and keep the credential protected. Publish only `api.atlas.jovanpahal.com` to **`http://127.0.0.1:8787`**. The connector and its edge certificate must be healthy before the hostname can serve requests. Preserve the unrelated Tailscale 443 service and the current Atlas 8443 fallback. [Current tunnel setup](https://developers.cloudflare.com/tunnel/) and [hostname routing](https://developers.cloudflare.com/tunnel/concepts/routing/).
4. If using an existing locally managed tunnel instead, [`deploy/cloudflared-atlas.example.yml`](../deploy/cloudflared-atlas.example.yml) supplies the loopback ingress and 404 catch-all. On the Linux host with official `cloudflared` installed, run `cloudflared tunnel login`, select `jovanpahal.com`, then create or reuse the named tunnel and run `cloudflared tunnel route dns <TUNNEL_NAME_OR_UUID> api.atlas.jovanpahal.com`. Fill the actual UUID and credential path in protected host configuration, validate ingress, and install/run the service. Never commit the certificate, credential JSON or tunnel token. [Current local-tunnel instructions](https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/create-local-tunnel/).
5. Verify `https://api.atlas.jovanpahal.com/health` against the exact deployed SHA, then test registration/sign-in, HttpOnly/Secure cookies and sync from the new frontend origin. Do not switch Pages if this API check fails.
6. Set the repository build variables to `ATLAS_SITE=https://atlas.jovanpahal.com`, `ATLAS_BASE=/`, and `PUBLIC_API_URL=https://api.atlas.jovanpahal.com`. Set the Pages custom domain to `atlas.jovanpahal.com` **before** creating its DNS record. Create a Cloudflare **CNAME** named `atlas`, targeting **`jlsp124.github.io`**, initially **DNS only** so GitHub's hostname/certificate checks reach Pages directly. Do not include `/atlas` in DNS, create a wildcard, or modify the apex/other records. This Actions-based site does not use a `CNAME` file; GitHub ignores one for workflow publishing. [Official Pages subdomain requirements](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Cloudflare DNS record controls](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/) and [proxy status](https://developers.cloudflare.com/dns/proxy-status/).
7. Re-run Deploy atlas for the exact successful Verify run (or push a reviewed change through normal verification). Wait for DNS and the Pages TLS certificate; enable **Enforce HTTPS** when available. Verify `/release.json`, root assets, manifest, service-worker scope, Pagefind, downloads, question deep links, offline operation and both account contexts on the new origin. GitHub notes that certificate/DNS availability can take up to 24 hours; report propagation separately from a successful deployment.
8. After the new frontend/API pair works, set primary `ALLOWED_ORIGIN=https://atlas.jovanpahal.com`. Retain the old origin in `ADDITIONAL_ALLOWED_ORIGINS` only while its transitional access is needed. Same-parent HTTPS services can use `COOKIE_SAME_SITE=lax`; switch after the old cross-site frontend is no longer needed, then retest sign-in/sync. Cookies remain host-only, Secure and HttpOnly. Authentication secrets never enter localStorage.

GitHub redirects the old project URL after custom-domain configuration, but guest browser storage belongs to the old origin. Offer the existing guest export/import before cutover; account events retain their IDs and sync on the new origin after sign-in. Do not claim automatic transfer of cross-origin localStorage. Existing question hash links and internal concept URLs remain valid.

If the new API or login fails before cutover, keep the current Pages URL/variables and Funnel endpoint. If it fails after cutover, restore the previous Pages domain/build variables and deploy the previously verified release; keep both exact API origins accepted until recovery is confirmed. Do not remove SQLite data, weaken cookies or bind port 8787 publicly.

## Linux with Docker Compose

For the home-server deployment tooling and operator cheat sheet, see [SERVER_OPERATIONS.md](SERVER_OPERATIONS.md). The watcher only deploys a successful **Verify atlas** run for the exact pushed `main` SHA. The deployment tree is `/opt/atlas`; `~/atlas` is development-only. A file lock serializes deployments, each update creates a consistent SQLite backup, and each image has its immutable source SHA tag. Local health gates marking a release deployed. On failure, code/image returns to the previous SHA while the database stays intact. Review schema migrations before attempting any code rollback.

The production image remains bound to `127.0.0.1:8787`. The separate Tailscale Funnel hostname on port 8443 targets `http://127.0.0.1:8787`; do not forward router ports or change the bind address. The current GitHub Pages and `ts.net` endpoints are cross-site, so production uses `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and the exact Pages origin in `ALLOWED_ORIGIN`. Some browsers block third-party cookies; same-parent custom hostnames are the long-term fix. `TRUST_PROXY=true` is set because the tunnel is the public path to the loopback listener.

Backups use `server/backup.ts`'s SQLite online backup API and are stored on the host at `/home/jovan/.local/share/atlas/backups`, mounted into the container at `/app/data/backups`. The daily `atlas-backup.timer` retains 30 days. This is still on the same host; arrange an encrypted off-host copy separately if desired. Nothing uploads backups automatically.

The systemd watcher runs every two minutes; it is not a self-hosted Actions runner. It queries GitHub Actions for the exact `origin/main` SHA and deploys only an event=`push`, branch=`main`, completed successful `Verify atlas` run. It backs up before deploying and rolls code/image back on failure while preserving the database. `atlasctl update` runs the same guarded process. `atlasctl stop` never removes data.

The existing GitHub Pages workflow is preserved. The repository variable `PUBLIC_API_URL` is public build configuration; after DNS and the HTTPS API hostname exist, set it to the API origin and configure the Pages custom domain under the same parent domain. No support email is inferred.

The current API endpoint is the Tailscale Funnel URL above. Follow the coordinated cutover above for `atlas.jovanpahal.com` and `api.atlas.jovanpahal.com`. The root `jovanpahal.com` does not need a web destination; only those subdomains and the GitHub-supplied verification TXT record are needed. Preserve cookie security and never substitute browser-stored bearer tokens.

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
read -r -s -p 'Unique admin password (16–128 characters): ' ATLAS_ADMIN_PASSWORD
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
