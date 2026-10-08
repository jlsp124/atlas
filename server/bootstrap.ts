import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { openDatabase } from './database';
import { passwordOptions } from './app';
const password = process.env.ATLAS_ADMIN_PASSWORD;
if (!password || password.length < 8 || password.length > 128)
  throw new Error(
    'Supply ATLAS_ADMIN_PASSWORD (8–128 characters) privately. No default is supplied.',
  );
const db = openDatabase();
const existing = db
  .prepare("SELECT id FROM users WHERE username='Jovan'")
  .get() as { id: string } | undefined;
if (existing && !process.argv.includes('--reset')) {
  db.close();
  throw new Error(
    'Jovan already exists; bootstrap will not overwrite an account.',
  );
}
const hash = await argon2.hash(password, passwordOptions);
const now = new Date().toISOString();
if (existing) {
  db.transaction(() => {
    db.prepare(
      "UPDATE users SET username='Jovan', password_hash=?, role='admin' WHERE id=?",
    ).run(hash, existing.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(existing.id);
  })();
} else
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(
    randomUUID(),
    'Jovan',
    hash,
    'admin',
    now,
    now,
    0,
  );
db.close();
console.log(
  'Administrator Jovan configured. Remove ATLAS_ADMIN_PASSWORD from the deployment environment.',
);
