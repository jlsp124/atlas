#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=${ATLAS_ROOT:-/opt/atlas}
REPO=jlsp124/atlas
REMOTE=origin
BRANCH=main
LOCK=${ATLAS_DEPLOY_LOCK:-/run/lock/atlas-deploy.lock}
STATE="$ROOT/.deployed-sha"
LOG=${ATLAS_DEPLOY_LOG:-/var/log/atlas/deploy.log}
mkdir -p "$(dirname "$LOG")"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date -Is) another deployment is running" >>"$LOG"
  exit 0
fi
exec >>"$LOG" 2>&1
trap 'rc=$?; echo "$(date -Is) deployment command failed (exit $rc)"; exit "$rc"' ERR

cd "$ROOT"
if [[ ! -d .git || ! -f .env.server ]]; then
  echo "$(date -Is) production checkout or .env.server is missing"
  exit 1
fi
chmod 600 .env.server
git fetch --prune "$REMOTE" "$BRANCH"
target=$(git rev-parse "$REMOTE/$BRANCH")
previous=$(cat "$STATE" 2>/dev/null || git rev-parse HEAD)
if [[ "$target" == "$previous" ]]; then
  echo "$(date -Is) already deployed $target"
  exit 0
fi

# Only accept a successful Verify atlas run for the exact pushed main SHA.
run=$(gh run list --repo "$REPO" --workflow 'Verify atlas' --branch "$BRANCH" \
  --commit "$target" --limit 20 \
  --json headSha,headBranch,event,status,conclusion,databaseId)
if ! printf '%s' "$run" | node -e '
  let s=""; process.stdin.on("data", c => s += c).on("end", () => {
    const exact = JSON.parse(s).some(r => r.headSha === process.argv[1] &&
      r.headBranch === "main" && r.event === "push" &&
      r.status === "completed" && r.conclusion === "success");
    process.exit(exact ? 0 : 1);
  });
' "$target"; then
  echo "$(date -Is) $target is not yet verified by a successful main push; leaving production at $previous"
  exit 0
fi

echo "$(date -Is) deploying verified main $target (previous $previous)"
export ATLAS_IMAGE_TAG="$target" ATLAS_DEPLOY_SHA="$target"
if ! docker compose exec -T atlas node --import tsx server/backup.ts; then
  echo "$(date -Is) could not create a consistent pre-deploy SQLite backup; aborting"
  exit 1
fi

git reset --hard "$target"
if docker compose build atlas && docker compose up -d --no-deps atlas; then
  for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error http://127.0.0.1:8787/health >/dev/null; then
      printf '%s\n' "$target" >"$STATE.tmp"
      chmod 600 "$STATE.tmp"
      mv "$STATE.tmp" "$STATE"
      echo "$(date -Is) deployed $target; local health passed"
      exit 0
    fi
    sleep 2
  done
fi

echo "$(date -Is) health/build failed for $target; restoring application code $previous (database is deliberately untouched)"
git reset --hard "$previous"
export ATLAS_IMAGE_TAG="$previous" ATLAS_DEPLOY_SHA="$previous"
if ! docker image inspect "atlas:$previous" >/dev/null 2>&1; then
  docker compose build atlas
fi
docker compose up -d --no-deps --no-build --force-recreate atlas
if ! curl --fail --silent --show-error --retry 20 --retry-delay 2 \
  --retry-connrefused http://127.0.0.1:8787/health >/dev/null; then
  echo "$(date -Is) CRITICAL: rollback did not restore health; data was retained, manual review required"
  exit 2
fi
echo "$(date -Is) restored application code $previous and health passed; inspect migration compatibility before any further rollback"
exit 1
