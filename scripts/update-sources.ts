import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateContent } from './validate-content';
import { refreshBleecker } from './bleecker';
import {
  defaultArchive,
  permittedVaultHashes,
  planUpdate,
  readJson,
  writeChanged,
  type Projection,
} from './intake-workflow';
import type { RegisteredSource, SourceRegistry } from '../src/core/intake';

const apply =
  process.argv.includes('--apply') || process.argv.includes('--accept-hashes');
const archive = defaultArchive();
const config = await readJson<{ vaultPath?: string }>(
  resolve(archive, 'config.json'),
  {},
);
const previous = await readJson<SourceRegistry>(
  resolve(archive, 'registry.json'),
  { schema_version: 1, sources: [], relationships: [] },
);
const incoming: RegisteredSource[] = [];
for (const file of (await readdir(resolve(archive, 'inbox')).catch(() => []))
  .filter((file) => file.endsWith('.json'))
  .sort()) {
  const batch = await readJson<{ sources: RegisteredSource[] }>(
    resolve(archive, 'inbox', file),
  );
  if (!Array.isArray(batch.sources))
    throw new Error('Inbox file needs reviewed source records: ' + file);
  incoming.push(...batch.sources);
}
const published = await readJson<Projection>(
  'src/content/ingestion/classroom.json',
);
const reviewed = await readJson<Projection>(
  resolve(archive, 'approved-companions.json'),
  published,
);
const currentVault = await permittedVaultHashes(
  process.env.ATLAS_VAULT_PATH || config.vaultPath,
);
const oldVault = await readJson<Record<string, string>>(
  resolve(archive, 'vault-hashes.json'),
  {},
);
const vaultChanges = [
  ...new Set([...Object.keys(currentVault), ...Object.keys(oldVault)]),
]
  .filter((path) => currentVault[path] !== oldVault[path])
  .sort();
const plan = planUpdate(previous, incoming, published, reviewed, vaultChanges);
const teacher = process.argv.includes('--skip-teacher')
  ? { changed: [], failures: [] }
  : await refreshBleecker({ apply: false, archive });
const teacherAffected = plan.registry.sources
  .filter((source) =>
    teacher.changed.some(
      (id) =>
        (id.startsWith('bleecker-drive-') &&
          source.original_url?.includes(id.slice('bleecker-drive-'.length))) ||
        (id === 'bleecker-c17' &&
          source.course === 'life-sciences' &&
          source.unit === 'origins') ||
        (id === 'bleecker-c18' &&
          source.course === 'life-sciences' &&
          source.unit === 'classification'),
    ),
  )
  .flatMap((source) => source.atlas_content_ids);
plan.affected = [...new Set([...plan.affected, ...teacherAffected])].sort();
const errors = [...validateContent(), ...plan.errors];
const pendingPath = resolve(archive, 'review-pending.json');
const pending = await readJson<
  Record<string, { hash: string; affected: string[] }>
>(pendingPath, {});
for (const path of vaultChanges.filter((path) =>
  path.startsWith('03 Areas/School/'),
)) {
  const linked = plan.registry.sources.filter((source) =>
    source.vault_links?.some((link) => link.path === path),
  );
  pending[path] = {
    hash: currentVault[path] ?? 'removed',
    affected: [
      ...new Set(linked.flatMap((source) => source.atlas_content_ids)),
    ].sort(),
  };
}
if ('manifest' in teacher)
  for (const source of teacher.manifest.sources.filter((source) =>
    source.inspection?.includes('review required'),
  ))
    pending[source.id] = {
      hash: source.contentHash,
      affected: teacherAffected,
    };
// Only a human/agent source review may approve a derivative; a fetch alone cannot clear this queue.
if (process.argv.includes('--reviewed-evidence'))
  for (const path of vaultChanges) delete pending[path];
console.log(
  JSON.stringify(
    {
      mode: apply ? 'apply' : 'inspect',
      newOrChangedSources: plan.changedSources,
      duplicateOrRevisionRelationships: plan.relationships,
      affectedAssignments: plan.affected,
      changedCompanions: plan.changedAssignments,
      vaultChanges,
      teacherChanges: teacher.changed,
      teacherFailures: teacher.failures,
      errors,
    },
    null,
    2,
  ),
);
if (errors.length || teacher.failures.length) {
  process.exitCode = 1;
} else if (apply) {
  let writes = 0;
  if (plan.changedSources.length || plan.relationships.length)
    writes += Number(
      await writeChanged(resolve(archive, 'registry.json'), plan.registry),
    );
  if (plan.publicChanged)
    writes += Number(
      await writeChanged('src/content/ingestion/classroom.json', reviewed),
    );
  if (vaultChanges.length)
    writes += Number(
      await writeChanged(resolve(archive, 'vault-hashes.json'), currentVault),
    );
  writes += Number(await writeChanged(pendingPath, pending));
  if (teacher.changed.length) await refreshBleecker({ apply: true, archive });
  console.log(
    `Applied ${writes} changed documents. ${Object.keys(pending).length} evidence changes await content review. Unchanged documents retain their bytes. New or revised evidence without an approved derivative remains private.`,
  );
} else
  console.log(
    'Inspection complete. Run with --apply to accept reviewed changes; raw/OCR files are never publication inputs.',
  );
