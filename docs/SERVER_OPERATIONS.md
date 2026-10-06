# atlas server cheat sheet

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
- Production checkout: `/opt/atlas`.
- API: `https://api.atlas.<your-domain>` (pending domain and tunnel authorization).
- Frontend: `https://atlas.<your-domain>` after the GitHub Pages custom domain is configured. The Pages URL remains `https://jlsp124.github.io/atlas/`.
- SQLite: Docker named volume `atlas_atlas-data`, mounted at `/app/data`.
- Consistent backups: `/app/data/backups` inside that persistent volume; daily at 02:30 with 30-day retention. Backups stay on this server and are not uploaded.
- Auto deploy: `atlas-deploy.timer` / `atlas-deploy.service`, every two minutes. Logs: `/var/log/atlas/deploy.log` and `journalctl -u atlas-deploy.service`.
- Daily backup: `atlas-backup.timer` / `atlas-backup.service`.
- HTTPS tunnel: named Cloudflare Tunnel to `http://127.0.0.1:8787` (pending domain and Cloudflare authorization). Existing Tailscale Funnel is left untouched.

## Deploy and recovery

The server fetches `origin/main` and only deploys the exact SHA after its `Verify atlas` workflow completed successfully for a push to `main`. It takes a SQLite backup, builds an image tagged with that commit, restarts the service, and checks local health. A failed health check restores the previous application image and code; the database is retained. Review migrations before manually rolling back code across a schema change.

To pause automatic deployment: `sudo systemctl stop atlas-deploy.timer`. Re-enable: `sudo systemctl start atlas-deploy.timer`. These commands do not stop Atlas.

For a manual code rollback, first inspect `atlasctl version` and available backups. Check out the intended known-good commit in `/opt/atlas`, build it with that commit SHA as `ATLAS_IMAGE_TAG` and `ATLAS_DEPLOY_SHA`, then recreate the service and verify `atlasctl health`. Do not restore an older database unless a reviewed migration rollback requires it. Keep automatic updates paused until the cause is resolved.

`atlasctl stop` and `atlasctl restart` never remove the volume. Do not run `docker compose down -v`.
