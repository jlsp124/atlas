import { readFile, stat, mkdir, copyFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { z } from 'zod';
import {
  contentHash,
  stableSourceId,
  sourceRelation,
  mergeRegistry,
  type RegisteredSource,
  type SourceRegistry,
} from '../src/core/intake';
import {
  defaultArchive,
  bytesHash,
  readJson,
  writeChanged,
} from './intake-workflow';

const args = process.argv.slice(2),
  option = (name: string) => args[args.indexOf('--' + name) + 1];
const specPath = option('spec');
if (!args.includes('--spec') || !specPath)
  throw new Error(
    'Usage: npm run atlas:intake -- --spec <private reviewed intake JSON> [--apply]',
  );
const specSchema = z
  .object({
    identity: z.string().min(1),
    course: z.enum(['physics', 'chemistry', 'life-sciences', 'japanese']),
    teacher: z.string().min(1),
    edition: z.string().min(1),
    unit: z.string().min(1),
    material_set: z.string().min(1),
    title: z.string().min(1),
    kind: z.string().min(1),
    text: z.string(),
    question_numbers: z.array(z.string()).default([]),
    files: z
      .array(
        z.object({
          path: z.string(),
          sequence_index: z.number().int().nonnegative(),
          capture_timestamp: z.string().optional(),
          exif: z.record(z.string(), z.unknown()).optional(),
          image_dimensions: z.tuple([z.number(), z.number()]).optional(),
        }),
      )
      .min(1),
    publication: z.enum(['private', 'reference-only', 'original-companion']),
    assistance: z.enum(['allowed', 'independent-only']),
    confidence: z.enum(['verified', 'supported', 'needs-review']),
    original_url: z.url().optional(),
    supersedes: z.string().optional(),
    same_material_as: z.string().optional(),
    atlas_content_ids: z.array(z.string()).default([]),
    assigned: z.iso.date().optional(),
    due: z.iso.date().optional(),
  })
  .strict();
const spec = specSchema.parse(await readJson(specPath));
const archive = defaultArchive();
const registry = await readJson<SourceRegistry>(
  resolve(archive, 'registry.json'),
  { schema_version: 1, sources: [], relationships: [] },
);
const raw = [];
for (const file of [...spec.files].sort(
  (a, b) => a.sequence_index - b.sequence_index,
)) {
  const path = resolve(file.path),
    bytes = await readFile(path),
    info = await stat(path),
    hash = bytesHash(bytes);
  raw.push({
    raw_id: 'raw-' + hash.slice(0, 24),
    original_filename: path.split(/[\\/]/).at(-1)!,
    original_path: path,
    capture_timestamp: file.capture_timestamp,
    exif: file.exif,
    image_dimensions: file.image_dimensions,
    filesystem_created_utc: info.birthtime.toISOString(),
    filesystem_modified_utc: info.mtime.toISOString(),
    file_size: bytes.length,
    sha256: hash,
    sequence_index: file.sequence_index,
    archive_relative_path: `raw/${hash.slice(0, 2)}/${hash}${extname(path).toLowerCase()}`,
    rights: 'private-source-evidence',
  });
}
const source: RegisteredSource & { raw_files: typeof raw } = {
  source_id: stableSourceId(spec.course, spec.edition, spec.identity),
  course: spec.course,
  teacher: spec.teacher,
  edition: spec.edition,
  unit: spec.unit,
  material_set: spec.material_set,
  title: spec.title,
  kind: spec.kind,
  origin: 'reviewed-intake',
  original_url: spec.original_url,
  raw_ids: raw.map((f) => f.raw_id),
  raw_hashes: raw.map((f) => f.sha256),
  raw_files: raw,
  normalized_content_hash: contentHash(spec.text),
  question_numbers: spec.question_numbers,
  publication: spec.publication,
  assistance: spec.assistance,
  confidence: spec.confidence,
  supersedes: spec.supersedes,
  same_material_as: spec.same_material_as,
  supplements: [],
  atlas_content_ids: spec.atlas_content_ids,
  assigned: spec.assigned,
  due: spec.due,
};
const matches = registry.sources
  .map((old) => ({
    source_id: old.source_id,
    title: old.title,
    relation: sourceRelation(old, source),
  }))
  .filter((m) => m.relation !== 'different');
console.log(
  JSON.stringify(
    { source_id: source.source_id, captures: raw.length, matches },
    null,
    2,
  ),
);
if (matches.some((m) => m.relation === 'review') && !spec.supersedes)
  throw new Error(
    'Possible duplicate/revision. Review the canonical match before applying; no automatic merge by title or URL.',
  );
if (args.includes('--apply')) {
  if (spec.supersedes === source.source_id)
    throw new Error(
      'A revision needs its own distinct identity; it cannot supersede itself.',
    );
  const merged = mergeRegistry(registry, [source]);
  // Manifest is written first, before copying or grouping captures.
  const manifest = resolve(
    archive,
    'intake',
    source.source_id,
    'manifest.json',
  );
  const oldManifest = await readJson<{ files: typeof raw }>(manifest, {
    files: [],
  });
  const files = [
    ...new Map(
      [...oldManifest.files, ...raw].map((file) => [
        file.raw_id + file.original_path,
        file,
      ]),
    ).values(),
  ].sort(
    (a, b) =>
      a.sequence_index - b.sequence_index ||
      a.original_path.localeCompare(b.original_path),
  );
  await writeChanged(manifest, { source_id: source.source_id, files });
  for (const file of raw) {
    const destination = resolve(archive, file.archive_relative_path);
    await mkdir(resolve(destination, '..'), { recursive: true });
    const existing = await readFile(destination).catch(() => null);
    if (existing && bytesHash(existing) !== file.sha256)
      throw new Error('Archive hash conflict');
    if (!existing) await copyFile(file.original_path, destination);
    if (bytesHash(await readFile(destination)) !== file.sha256)
      throw new Error('Archive copy verification failed');
  }
  await writeChanged(resolve(archive, 'registry.json'), merged);
  console.log(
    'Private source registered. Create or update its original companion in approved-companions.json, then run atlas:update -- --apply.',
  );
} else
  console.log('Inspection only. Use --apply to archive this reviewed source.');
