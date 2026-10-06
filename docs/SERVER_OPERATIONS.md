# atlas server cheat sheet

**Current host status (October 6, 2026): not provisioned.** `~/atlas` is present; `/opt/atlas`, the production container/volume, `atlasctl`, timers and public API tunnel are not. These commands become available after an operator runs `sudo bash ~/atlas/deploy/install-host.sh` in an interactive terminal, then logs in again for Docker group access. A domain and Cloudflare DNS authorization are also required before enabling public API access.

After provisioning:

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
- Production checkout (planned): `/opt/atlas`.
- API: not configured. The intended endpoint is `https://api.atlas.<your-domain>` after domain/DNS and Cloudflare Tunnel setup.
- Frontend: `https://jlsp124.github.io/atlas/`. No Pages custom domain is configured.
- SQLite volume and backups: not created yet. The planned Compose volume is `atlas_atlas-data`; the backup command uses `/app/data/backups` in that volume.
- Auto deploy and backup timers: unit files are in `deploy/systemd/`, but neither timer is installed or active. After provisioning, deploy checks run every two minutes and daily backups retain 30 days. Intended logs are `/var/log/atlas/deploy.log` and `journalctl -u atlas-deploy.service`.
- HTTPS tunnel: none for Atlas. The existing Tailscale Funnel still routes its hostname to another app on `127.0.0.1:3000`; it has not been changed.

## Deploy and recovery

Once installed and initialized, the watcher fetches `origin/main` and deploys only the exact SHA after its `Verify atlas` workflow completed successfully for a push to `main`. It takes a SQLite backup, builds an image tagged with that commit, restarts the service, and checks local health. A failed health check restores the previous application image and code; the database is retained. Review migrations before manually rolling back code across a schema change.

To pause automatic deployment: `sudo systemctl stop atlas-deploy.timer`. Re-enable: `sudo systemctl start atlas-deploy.timer`. These commands do not stop Atlas.

For a manual code rollback, first inspect `atlasctl version` and available backups. Check out the intended known-good commit in `/opt/atlas`, build it with that commit SHA as `ATLAS_IMAGE_TAG` and `ATLAS_DEPLOY_SHA`, then recreate the service and verify `atlasctl health`. Do not restore an older database unless a reviewed migration rollback requires it. Keep automatic updates paused until the cause is resolved.

`atlasctl stop` and `atlasctl restart` never remove the volume. Do not run `docker compose down -v`.
