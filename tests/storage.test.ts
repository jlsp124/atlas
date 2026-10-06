import { it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../server/database';

it('backs up active WAL data consistently and reopens without replaying migrations', async () => {
  const root = resolve('data');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(resolve(root, 'test-storage-'));
  // Validate the absolute cleanup target before opening the database.
  if (
    dirname(directory) !== root ||
    !directory.startsWith(resolve(root, 'test-storage-'))
  )
    throw new Error('Refusing cleanup outside the test data directory');
  let db = openDatabase(directory);
  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,0)').run(
      id,
      'storage_test',
      'test-only-no-credential',
      'user',
      now,
      now,
    );
    db.prepare(
      'INSERT INTO events (user_id,event_id,content,received_at) VALUES (?,?,?,?)',
    ).run(id, randomUUID(), '{}', now);
    const backupPath = resolve(directory, 'consistent-backup.sqlite');
    await db.backup(backupPath);
    const backup = new Database(backupPath, { readonly: true });
    try {
      expect(backup.pragma('integrity_check', { simple: true })).toBe('ok');
      expect(backup.prepare('SELECT COUNT(*) AS n FROM events').get()).toEqual({
        n: 1,
      });
      expect(backup.prepare('SELECT username FROM users').get()).toEqual({
        username: 'storage_test',
      });
    } finally {
      backup.close();
    }
    db.close();
    db = openDatabase(directory);
    expect(db.prepare('SELECT COUNT(*) AS n FROM migrations').get()).toEqual({
      n: 1,
    });
    expect(db.prepare('SELECT COUNT(*) AS n FROM events').get()).toEqual({
      n: 1,
    });
    expect(() =>
      db
        .prepare(
          'INSERT INTO events (user_id,event_id,content,received_at) VALUES (?,?,?,?)',
        )
        .run('absent-user', randomUUID(), '{}', now),
    ).toThrow('FOREIGN KEY');
  } finally {
    db.close();
    // Remove only this test's verified, freshly created child directory.
    await rm(directory, { recursive: true, force: true });
  }
});
