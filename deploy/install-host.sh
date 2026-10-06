#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then echo 'Run with sudo: deploy/install-host.sh' >&2; exit 1; fi
DEPLOY_USER=${DEPLOY_USER:-jovan}
USER_HOME=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
[[ -n "$USER_HOME" ]] || { echo "Unknown deployment user: $DEPLOY_USER" >&2; exit 1; }
ROOT=/opt/atlas

getent group docker >/dev/null || groupadd docker
usermod -aG docker "$DEPLOY_USER"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0750 "$ROOT"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 /var/log/atlas
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "$USER_HOME/.local/share/atlas/backups"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "$USER_HOME/.config/atlas"
if [[ ! -e "$ROOT/.env" ]]; then
  printf "ATLAS_BACKUP_HOST_DIR=%s/.local/share/atlas/backups\n" "$USER_HOME" > "$ROOT/.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ROOT/.env"
  chmod 600 "$ROOT/.env"
fi
if [[ ! -d "$ROOT/.git" ]]; then
  runuser -u "$DEPLOY_USER" -- git clone --branch main https://github.com/jlsp124/atlas.git "$ROOT"
fi
if [[ ! -e "$ROOT/.env.server" ]]; then
  cat >"$ROOT/.env.server" <<'ENV'
NODE_ENV=production
HOST=0.0.0.0
PORT=8787
DATA_DIR=/app/data
ALLOWED_ORIGIN=https://jlsp124.github.io
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
TRUST_PROXY=false
PUBLIC_API_URL=
ENV
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ROOT/.env.server"
  chmod 600 "$ROOT/.env.server"
fi

# Keep the server's existing GitHub login available to the boot-time system service.
# The token remains private in the operator's config directory and is never logged.
if [[ ! -s "$USER_HOME/.config/atlas/gh.env" ]]; then
  token_tmp=$(mktemp "$USER_HOME/.config/atlas/.gh.env.XXXXXX")
  chown "$DEPLOY_USER:$DEPLOY_USER" "$token_tmp"
  chmod 600 "$token_tmp"
  if ! runuser -u "$DEPLOY_USER" -- gh auth token | sed 's/^/GH_TOKEN=/' >"$token_tmp"; then
    rm -f "$token_tmp"
    echo 'gh authentication is required before installing the deployment timer.' >&2
    exit 1
  fi
  mv "$token_tmp" "$USER_HOME/.config/atlas/gh.env"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$USER_HOME/.config/atlas/gh.env"
  chmod 600 "$USER_HOME/.config/atlas/gh.env"
fi

for unit in atlas-deploy.service atlas-deploy.timer atlas-backup.service atlas-backup.timer; do
  install -o root -g root -m 0644 "$ROOT/deploy/systemd/$unit" "/etc/systemd/system/$unit"
done
install -o root -g root -m 0755 "$ROOT/scripts/atlasctl" /usr/local/bin/atlasctl
systemctl enable docker.service >/dev/null
systemctl daemon-reload
systemctl enable --now atlas-deploy.timer atlas-backup.timer
echo 'Host units installed. Log out and back in so the deployment user gets docker group access.'
echo 'Complete .env.server values and initial container/backup setup before enabling public DNS.'
