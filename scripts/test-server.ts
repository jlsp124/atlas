// Test fixture only: isolated memory DB, random administrator secret, no real data.
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import argon2 from 'argon2';
import { createServer, passwordOptions } from '../server/app';
import { openDatabase } from '../server/database';
if (process.env.NODE_ENV !== 'test' || !process.env.ATLAS_TEST_ADMIN_PASSWORD)
  throw new Error(
    'This fixture requires an explicit test environment and generated secret',
  );
const db = openDatabase('', true);
const classSourceDir = await mkdtemp(join(tmpdir(), 'atlas-source-fixture-'));
await writeFile(
  join(classSourceDir, 'physics-motion-notes.json'),
  JSON.stringify({
    title: 'Class-note fixture',
    captured: '2026-09-23',
    status: 'partial-transcription',
    sections: [
      {
        heading: 'Frames of reference',
        text: 'Owner-only test fixture text.',
      },
    ],
    gaps: ['Fixture: remaining sheet wording is unavailable.'],
  }),
  { mode: 0o600 },
);
const now = new Date().toISOString();
db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(
  randomUUID(),
  'Jovan',
  await argon2.hash(process.env.ATLAS_TEST_ADMIN_PASSWORD, passwordOptions),
  'admin',
  now,
  now,
  0,
);
const app = await createServer({
  db,
  origin: 'http://localhost:4321',
  secure: false,
  trustProxy: true,
  classSourceDir,
});
await app.listen({ host: '127.0.0.1', port: 8790 });
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app
      .close()
      .then(() => rm(classSourceDir, { recursive: true, force: true }))
      .then(() => process.exit(0));
  });
