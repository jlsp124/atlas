import { resolve } from 'node:path';
import { chmod, mkdir } from 'node:fs/promises';
import { openDatabase } from './database';
const destination = resolve(process.env.ATLAS_BACKUP_DIR || './data/backups');
process.umask(0o077);
await mkdir(destination, { recursive: true, mode: 0o700 });
const db = openDatabase();
const path = resolve(
  destination,
  `atlas-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`,
);
await db.backup(path);
await chmod(path, 0o600);
db.close();
console.log(`Consistent SQLite backup created: ${path}`);
