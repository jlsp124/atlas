import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { openDatabase } from './database';
const destination = resolve(process.env.ATLAS_BACKUP_DIR || './data/backups');
await mkdir(destination, { recursive: true, mode: 0o700 });
const db = openDatabase();
const path = resolve(
  destination,
  `atlas-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`,
);
await db.backup(path);
db.close();
console.log(`Consistent SQLite backup created: ${path}`);
