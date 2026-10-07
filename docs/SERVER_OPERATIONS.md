# atlas server cheat sheet

**Current host status (October 6, 2026): running.** Atlas is deployed from verified GitHub `main` on this Linux server. The API uses a Tailscale Funnel HTTPS endpoint while a custom domain is pending.

Everyday commands:

Attach: `atlasctl console`

Status: `atlasctl status`

Restart: `atlasctl restart`

Stop: `atlasctl stop`

Start: `atlasctl start`

Update now: `atlasctl update`

Backup: `atlasctl backup`

Logs: `atlasctl logs`

In the console, **Ctrl+B then D** detaches; Atlas keeps running.

## This server

- Development checkout: `~/atlas`. Only pushed, verified `main` commits are deployed.
- Production checkout: `/opt/atlas`; deploys only exact verified `origin/main` commits.
- API: `https://glucose-games-server.tail428a5c.ts.net:8443`; Tailscale Funnel forwards to `http://127.0.0.1:8787`.
- Frontend: `https://jlsp124.github.io/atlas/`.
- SQLite: Docker named volume `atlas_atlas-data`, mounted at `/app/data`.
- Backups: `/home/jovan/.local/share/atlas/backups` (host directory, mode 700; files mode 600), made through SQLite's online backup API. Daily timer retains 30 days; nothing uploads them.
- Auto deploy timer: `atlas-deploy.timer`, every two minutes. Backup timer: `atlas-backup.timer`, daily. Logs: `/var/log/atlas/deploy.log` and `journalctl -u atlas-deploy.service`.
- Tailscale: existing Funnel on 443 still serves the unrelated service on port 3000. Atlas has a separate Funnel listener on 8443 to loopback port 8787. No router ports are open.
- Admin account: `Jovan` has not been bootstrapped. Bootstrap requires the operator to enter a new unique 16–128 character password interactively; do not put it in `.env.server` or source control.

## Deploy and recovery

The public `/health` response includes `deploySha` when the deployment environment
contains a valid 40-character commit SHA. Match it to the successful verification
and Pages runs to confirm the API release; a content snapshot date alone does not
prove the deployed revision. Development or unknown deployment values return null.

The watcher fetches `origin/main` and deploys only the exact SHA after its `Verify atlas` workflow completed successfully for a push to `main`. It takes a SQLite backup, builds an image tagged with that commit, restarts the service, and checks local health. A failed health check restores the previous application image and code; the database is retained. Review migrations before manually rolling back code across a schema change.

To pause automatic deployment: `sudo systemctl stop atlas-deploy.timer`. Re-enable: `sudo systemctl start atlas-deploy.timer`. These commands do not stop Atlas.

For a manual code rollback, pause `atlas-deploy.timer`, inspect `atlasctl version` and available backups, then use the guarded deployment script with a known-good verified commit after confirming migration compatibility. Verify `atlasctl health` before re-enabling the timer. Do not restore an older database unless a reviewed migration rollback requires it.

When `jovanpahal.com` is available, use `atlas.jovanpahal.com` for Pages and `api.atlas.jovanpahal.com` for the API. Configure only those subdomains; the apex `jovanpahal.com` can remain without DNS records. Update the Pages custom domain, repository variable `PUBLIC_API_URL`, `.env.server` origin and Tailscale/Cloudflare routing as appropriate. A shared parent domain allows `SameSite=Lax` cookies. No Cloudflare access is currently configured.

`atlasctl stop` and `atlasctl restart` never remove the volume. Do not run `docker compose down -v`.
