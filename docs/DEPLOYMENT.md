# Deploy atlas

The public static app works without a server. Accounts, sync, the request inbox and real admin data become available only when you connect the optional API. No home-server deployment credentials were supplied for this implementation.

## GitHub Pages

`main` is the release branch. The **Verify atlas** workflow runs the complete suite on Ubuntu and tests the Linux container. A successful push verification triggers **Deploy atlas**, which builds that exact verified commit and publishes `dist` to Pages. Pull requests do not deploy. Actions are pinned to checked commit SHAs.

Enable **Settings → Pages → Source: GitHub Actions**. The project URL is `https://jlsp124.github.io/atlas/`. Private repository Pages requires an eligible GitHub plan; a public repository is the fallback when the plan prevents Pages. Before making source public, audit the complete tracked history for private source and secrets.

This repository started private. GitHub returned HTTP 422 stating that the account's plan does not support Pages for it. After reviewing the reachable history and public derivative, the authorized public fallback was used and workflow Pages was enabled. Private vault material and runtime data remain excluded.

Optional repository **Variables** (not frontend secrets):

| Variable               | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `PUBLIC_API_URL`       | HTTPS API origin, with no trailing path or slash         |
| `PUBLIC_SUPPORT_EMAIL` | Dedicated support contact; never a personal phone number |

Changing a variable requires another Pages deployment. Never put credentials in either variable. Empty values keep a complete guest app and a public issue link for non-private support.

For a custom site path, set `ATLAS_SITE` and `ATLAS_BASE` at build time. Keep the manifest, service-worker scope and Astro base consistent. Do not serve the built `/atlas/` app at `/` without rebuilding.

## Linux with Docker Compose

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

No new tunnel, DNS record, router rule or home-server port has been configured by this repository.

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
