#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=${ATLAS_ROOT:-/opt/atlas}
cd "$ROOT"
sha=$(cat .deployed-sha 2>/dev/null || git rev-parse HEAD)
ATLAS_IMAGE_TAG="$sha" ATLAS_DEPLOY_SHA="$sha" docker compose exec -T atlas node --import tsx server/backup.ts
ATLAS_IMAGE_TAG="$sha" ATLAS_DEPLOY_SHA="$sha" docker compose exec -T atlas node --input-type=module -e '
  import { readdir, stat, unlink } from "node:fs/promises";
  import { join } from "node:path";
  const dir = "/app/data/backups";
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const name of await readdir(dir)) {
    if (!/^atlas-[0-9T-]+\.sqlite$/.test(name)) continue;
    const path = join(dir, name);
    const info = await stat(path);
    if (info.isFile() && info.mtimeMs < cutoff) await unlink(path);
  }
' 
