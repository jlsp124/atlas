import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { openDatabase } from './database';
import { passwordOptions } from './app';
const password = process.env.ATLAS_ADMIN_PASSWORD;
if (!password || password.length < 16 || password.length > 128)
  throw new Error(
    'Set ATLAS_ADMIN_PASSWORD to a unique 16–128 character secret in the server environment. No default is supplied.',
  );
const db = openDatabase();
if (db.prepare("SELECT id FROM users WHERE username='Jovan'").get()) {
  db.close();
  throw new Error(
    'Jovan already exists; bootstrap will not overwrite an account.',
  );
}
const hash = await argon2.hash(password, passwordOptions);
const now = new Date().toISOString();
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
  'Administrator Jovan created. Remove ATLAS_ADMIN_PASSWORD from the deployment environment.',
);
