import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type RepoStats = {
  sourceLines: number;
  updates?: number;
  builtAt: string;
};
// Count nonblank lines in application/server/tooling code, excluding data,
// dependencies, generated output, tests and documentation. Recomputed per build.
export function repoStats(): RepoStats {
  let sourceLines = 0;
  function count(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) count(path);
      else if (/\.(?:ts|tsx|astro|css|mjs)$/.test(entry.name))
        sourceLines += readFileSync(path, 'utf8')
          .split('\n')
          .filter((line) => line.trim()).length;
    }
  }
  for (const dir of ['src', 'server', 'scripts']) count(dir);
  let updates: number | undefined;
  try {
    if (
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        encoding: 'utf8',
      }).trim() === 'false'
    )
      updates = Number(
        execFileSync('git', ['rev-list', '--count', 'HEAD'], {
          encoding: 'utf8',
        }).trim(),
      );
  } catch {
    /* Source archives can still report their measured code size. */
  }
  return { sourceLines, updates, builtAt: new Date().toISOString() };
}
