import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, sep } from 'node:path';
import { homedir } from 'node:os';
import type { SourceRegistry, RegisteredSource } from '../src/core/intake';
import { mergeRegistry } from '../src/core/intake';
import { assignmentSchema } from '../src/core/schema';

export const defaultArchive = () =>
  process.env.ATLAS_SOURCE_ARCHIVE ||
  resolve(homedir(), 'Documents', 'Atlas Sources');
export type Projection = {
  schemaVersion: number;
  assignments: unknown[];
  dependencies: Record<string, string[]>;
  materials: { publication: string }[];
  [key: string]: unknown;
};
export const bytesHash = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');
export const semantic = (value: unknown): string => {
  if (Array.isArray(value)) return '[' + value.map(semantic).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + semantic(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
};
export function validateProjection(projection: Projection) {
  const problems: string[] = [];
  if (projection.schemaVersion !== 1)
    problems.push('Unsupported projection version');
  const parsed = projection.assignments.map((value) =>
    assignmentSchema.safeParse(value),
  );
  const ids: string[] = [];
  for (const result of parsed) {
    if (!result.success) {
      problems.push('Invalid assignment projection: ' + result.error.message);
      continue;
    }
    const a = result.data;
    ids.push(a.id);
    if (
      a.assistance === 'independent-only' &&
      (a.reading?.length || a.companionQuestions?.length || a.download)
    )
      problems.push('Restricted assistance: ' + a.id);
  }
  if (new Set(ids).size !== ids.length)
    problems.push('Duplicate assignment ID');
  if (projection.materials.some((s) => s.publication === 'private'))
    problems.push('Private source in public material index');
  const text = JSON.stringify(projection);
  for (const forbidden of [
    /raw_files|original_path|archive_relative_path|filesystem_created|ocr-input|private_path/i,
    /IMG_\d+|raw pictures|Uniform_Motion_Lab_FINAL/i,
    /"(?:grade|mark|studentName|teacherComment|returnedAnswer)"\s*:/i,
    /[A-Z]:\\\\/,
  ])
    if (forbidden.test(text))
      problems.push('Private source field or raw capture in public projection');
  return problems;
}
export function planUpdate(
  previous: SourceRegistry,
  incoming: RegisteredSource[],
  published: Projection,
  reviewed: Projection,
  vaultChanges: string[] = [],
) {
  const registry = mergeRegistry(previous, incoming);
  const changedSources = registry.sources
    .filter(
      (source) =>
        semantic(source) !==
        semantic(
          previous.sources.find((s) => s.source_id === source.source_id),
        ),
    )
    .map((s) => s.source_id);
  const changedAssignments = reviewed.assignments
    .filter(
      (a) =>
        semantic(a) !==
        semantic(
          published.assignments.find(
            (old) => (old as { id: string }).id === (a as { id: string }).id,
          ),
        ),
    )
    .map((a) => (a as { id: string }).id);
  const vaultAffected = registry.sources
    .filter((source) =>
      source.vault_links?.some((link) => vaultChanges.includes(link.path)),
    )
    .flatMap((source) => source.atlas_content_ids);
  const affected = [
    ...new Set(
      changedSources
        .flatMap(
          (id) =>
            registry.sources.find((s) => s.source_id === id)
              ?.atlas_content_ids ?? [],
        )
        .concat(changedAssignments, vaultAffected),
    ),
  ].sort();
  const errors = validateProjection(reviewed);
  return {
    registry,
    changedSources,
    changedAssignments,
    affected,
    vaultChanges,
    relationships: registry.relationships.filter(
      (r) =>
        !previous.relationships.some((old) => semantic(r) === semantic(old)),
    ),
    publicChanged: semantic(reviewed) !== semantic(published),
    errors,
  };
}
export async function readJson<T>(path: string, fallback?: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === 'ENOENT' &&
      fallback !== undefined
    )
      return fallback;
    throw error;
  }
}
export async function writeChanged(path: string, value: unknown) {
  const text = JSON.stringify(value, null, 2) + '\n';
  const old = await readFile(path, 'utf8').catch(() => '');
  if (old === text) return false;
  await mkdir(resolve(path, '..'), { recursive: true });
  const temp = path + '.tmp';
  await writeFile(temp, text);
  await rename(temp, path);
  return true;
}
export async function permittedVaultHashes(root?: string) {
  if (!root) return {};
  const current: Record<string, string> = {};
  const paths = ['02 Projects', '03 Areas/School'];
  async function walk(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      const path = resolve(directory, entry.name),
        rel = relative(root!, path);
      if (
        rel.startsWith('..' + sep) ||
        /(^|[\\/])06 My Notes([\\/]|$)/i.test(rel)
      )
        throw new Error('Protected or escaped vault path');
      if (entry.isDirectory()) await walk(path);
      else if (
        entry.name.endsWith('.md') &&
        !/grade|error log|learning profile|postmortem|returned|quiz version/i.test(
          entry.name,
        ) &&
        (!rel.startsWith('02 Projects') ||
          /Science Course Pages Site|^Atlas Intake\.md$/.test(entry.name))
      )
        current[rel.replaceAll('\\', '/')] = bytesHash(await readFile(path));
    }
  }
  for (const path of paths) await walk(resolve(root, path));
  return current;
}
