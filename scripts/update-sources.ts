import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { validateContent } from './validate-content';
import { concepts, questions, schedule } from '../src/content/catalog';

const root = process.env.ATLAS_VAULT_PATH;
console.log(
  `Content errors: ${validateContent().length}. Concepts without transfer checks: ${concepts.filter((c) => !questions.some((q) => q.level === 'transfer' && q.concepts.includes(c.id))).length}. Unconfirmed dated items: ${schedule.filter((e) => e.confidence === 'unverified').length}.`,
);
if (!root)
  console.log(
    'Set ATLAS_VAULT_PATH to a read-only fresh source checkout to compare evidence. No raw notes are imported or published.',
  );
else {
  const paths = [
    '02 Projects',
    '03 Areas/School/Chemistry 11',
    '03 Areas/School/Physics 11',
    '03 Areas/School/Courses/Life Sciences 11',
    '03 Areas/School/Introductory Japanese 11',
  ];
  const previous = JSON.parse(
    await readFile('src/content/ingestion/vault-hashes.json', 'utf8').catch(
      () => '{}',
    ),
  ) as Record<string, string>;
  const current: Record<string, string> = {};
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(p);
      else if (
        entry.name.endsWith('.md') &&
        !/grade|learning profile|postmortem|missed work audit/i.test(
          entry.name,
        ) &&
        (!relative(root!, p).startsWith('02 Projects') ||
          /Science Course Pages Site/.test(entry.name))
      )
        current[relative(root!, p).replace(/\\/g, '/')] = createHash('sha256')
          .update(await readFile(p))
          .digest('hex');
    }
  }
  for (const p of paths) await walk(resolve(root, p));
  const changed = Object.keys(current).filter(
    (k) => current[k] !== previous[k],
  );
  console.log(
    `Source files changed/new: ${changed.length}. Removed: ${Object.keys(previous).filter((k) => !current[k]).length}.`,
  );
  console.log(changed.join('\n'));
  if (process.argv.includes('--accept-hashes')) {
    await mkdir('src/content/ingestion', { recursive: true });
    await writeFile(
      'src/content/ingestion/vault-hashes.json',
      JSON.stringify(current, null, 2) + '\n',
    );
    console.log(
      'Hash baseline accepted. Content still requires manual publication review.',
    );
  }
}
