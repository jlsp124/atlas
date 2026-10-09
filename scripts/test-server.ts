// Test fixture only: isolated memory DB, random administrator secret, no real data.
import { randomUUID } from 'node:crypto';
import {
  createServer as createHttpServer,
  request as httpRequest,
} from 'node:http';
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
await app.listen({ host: '127.0.0.1', port: 8791 });

// Browser integration tests exercise many independent users against one in-memory
// API. Give every proxied request its own synthetic client IP so production rate
// limits stay enabled and tested by server tests without throttling unrelated E2E
// cases. The browser never sends or controls this header.
let requestNumber = 0;
const proxy = createHttpServer((incoming, outgoing) => {
  const n = requestNumber++;
  const forwardedFor = `10.${Math.floor(n / 65025) % 250}.${Math.floor(n / 255) % 255}.${(n % 254) + 1}`;
  const upstream = httpRequest(
    {
      host: '127.0.0.1',
      port: 8791,
      path: incoming.url,
      method: incoming.method,
      headers: {
        ...incoming.headers,
        host: '127.0.0.1:8791',
        'x-forwarded-for': forwardedFor,
      },
    },
    (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    },
  );
  upstream.on('error', () => {
    if (!outgoing.headersSent) outgoing.writeHead(502);
    outgoing.end();
  });
  incoming.pipe(upstream);
});
await new Promise<void>((resolve, reject) => {
  proxy.once('error', reject);
  proxy.listen(8790, '127.0.0.1', resolve);
});

async function close() {
  await new Promise<void>((resolve) => proxy.close(() => resolve()));
  await app.close();
  await rm(classSourceDir, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void close().then(() => process.exit(0));
  });
