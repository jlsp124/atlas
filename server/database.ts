import Database from 'better-sqlite3';
import { chmodSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrations = [
  `CREATE TABLE users (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','admin')),
    created_at TEXT NOT NULL, last_seen TEXT NOT NULL,
    analytics INTEGER NOT NULL DEFAULT 0 CHECK(analytics IN (0,1))
  );
  CREATE TABLE sessions (
    hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, content TEXT NOT NULL, received_at TEXT NOT NULL,
    UNIQUE(user_id,event_id)
  );
  CREATE INDEX events_user_seq ON events(user_id,seq);
  CREATE TABLE requests (
    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, course TEXT, message TEXT NOT NULL, contact TEXT,
    status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL
  );
  CREATE TABLE analytics (
    day TEXT NOT NULL, type TEXT NOT NULL, course TEXT NOT NULL DEFAULT '',
    concept TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL,
    count INTEGER NOT NULL, incorrect INTEGER NOT NULL DEFAULT 0, hints INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(day,type,course,concept,actor)
  );
  CREATE TABLE analytics_dedupe (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
  CREATE TABLE activity (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL,
    PRIMARY KEY(user_id,day)
  );`,
  `ALTER TABLE requests ADD COLUMN route TEXT;
  ALTER TABLE requests ADD COLUMN material TEXT;
  ALTER TABLE requests ADD COLUMN question TEXT;
  ALTER TABLE requests ADD COLUMN version TEXT;
  ALTER TABLE requests ADD COLUMN device TEXT;
  CREATE TABLE product_sessions (
    id TEXT PRIMARY KEY, actor_hash TEXT NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK(actor IN ('guest','account')), device TEXT NOT NULL, version TEXT NOT NULL,
    started_at TEXT NOT NULL, last_active_at TEXT NOT NULL, last_activity_at TEXT NOT NULL,
    active_seconds INTEGER NOT NULL DEFAULT 0, route_views INTEGER NOT NULL DEFAULT 0, useful_actions INTEGER NOT NULL DEFAULT 0,
    first_useful_seconds INTEGER
  );
  CREATE INDEX product_sessions_started ON product_sessions(started_at);
  CREATE INDEX product_sessions_actor ON product_sessions(actor_hash,started_at);
  CREATE TABLE product_events (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES product_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL, course TEXT, material TEXT, concept TEXT, question TEXT, feature TEXT, scope TEXT,
    route TEXT NOT NULL, previous_route TEXT, version TEXT NOT NULL, device TEXT NOT NULL,
    success INTEGER, result_bucket TEXT, duration_bucket TEXT, error_code TEXT,
    active_seconds INTEGER NOT NULL DEFAULT 0, received_at TEXT NOT NULL
  );
  CREATE INDEX product_events_time ON product_events(received_at);
  CREATE INDEX product_events_route ON product_events(route,type);`,
];
export function openDatabase(
  dir = process.env.DATA_DIR || './data',
  memory = false,
) {
  if (!memory) mkdirSync(resolve(dir), { recursive: true, mode: 0o700 });
  const db = new Database(memory ? ':memory:' : resolve(dir, 'atlas.sqlite'));
  if (!memory) chmodSync(resolve(dir, 'atlas.sqlite'), 0o600);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(
    'CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)',
  );
  const migrate = db.transaction(() => {
    for (let i = 0; i < migrations.length; i++)
      if (
        !db.prepare('SELECT version FROM migrations WHERE version=?').get(i + 1)
      ) {
        db.exec(migrations[i]);
        db.prepare('INSERT INTO migrations VALUES (?,?)').run(
          i + 1,
          new Date().toISOString(),
        );
      }
  });
  migrate();
  return db;
}
export type AtlasDatabase = ReturnType<typeof openDatabase>;
export type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: string;
  last_seen: string;
  analytics: number;
};
