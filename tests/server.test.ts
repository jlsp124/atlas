import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from '../server/app';
import { openDatabase } from '../server/database';
import type { FastifyInstance } from 'fastify';
import type { AtlasDatabase } from '../server/database';
const origin = 'http://localhost:4321';
const headers = {
  origin,
  'x-atlas-client': 'atlas',
  'content-type': 'application/json',
};
let app: FastifyInstance;
let db: AtlasDatabase;
const password = () => randomBytes(20).toString('base64url');
async function account(name = 'student_' + randomBytes(4).toString('hex')) {
  const pass = password();
  const r = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers,
    payload: { username: name, password: pass },
  });
  expect(r.statusCode).toBe(201);
  return {
    username: name,
    password: pass,
    user: r.json().user,
    csrf: r.json().csrf,
    cookie: r.headers['set-cookie']!.toString().split(';')[0],
  };
}
function event() {
  return {
    id: randomUUID(),
    device: randomUUID(),
    at: new Date().toISOString(),
    type: 'question_answered',
    payload: {
      question: 'electron-groups-construction',
      concept: 'electron-groups',
      correct: true,
      hints: 0,
      seed: 3,
      durationMs: 800,
    },
  };
}
const authed = (a: { cookie: string; csrf: string }) => ({
  ...headers,
  cookie: a.cookie,
  'x-csrf-token': a.csrf,
});
beforeEach(async () => {
  db = openDatabase('', true);
  app = await createServer({ db, origin, secure: false });
});
afterEach(async () => {
  await app.close();
});
describe('accounts and authorization', () => {
  it('health works without authentication and is not cached', async () => {
    const r = await app.inject('/health');
    expect(r.json().status).toBe('ok');
    expect(r.headers['cache-control']).toBe('no-store');
  });
  it('stores Argon2id hashes and HttpOnly sessions without returning secrets', async () => {
    const a = await account();
    const row = db
      .prepare('SELECT password_hash FROM users WHERE id=?')
      .get(a.user.id) as { password_hash: string };
    expect(row.password_hash).toMatch(/^\$argon2id\$/);
    expect(row.password_hash).not.toContain(a.password);
    const r = await app.inject({
      url: '/session',
      headers: { cookie: a.cookie },
    });
    expect(r.json().user).not.toHaveProperty('password_hash');
    expect(r.json().user).not.toHaveProperty('email');
  });
  it('reserves Jovan and rejects injected roles', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers,
      payload: { username: 'jovan', password: password() },
    });
    expect(r.statusCode).toBe(409);
    const role = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers,
      payload: { username: 'student123', password: password(), role: 'admin' },
    });
    expect(role.statusCode).toBe(400);
  });
  it('rejects cross-origin writes and missing CSRF', async () => {
    const a = await account();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: { ...authed(a), origin: 'https://evil.example' },
          payload: { events: [], cursor: 0 },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: { ...headers, cookie: a.cookie },
          payload: { events: [], cursor: 0 },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('protects admin data server-side for guests and ordinary users', async () => {
    expect((await app.inject('/admin/overview')).statusCode).toBe(401);
    const a = await account();
    expect(
      (
        await app.inject({
          url: '/admin/overview',
          headers: { cookie: a.cookie },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          url: '/admin/requests',
          headers: { cookie: a.cookie },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('validates credentials, revokes logout sessions and permits login', async () => {
    const a = await account();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers,
          payload: { username: a.username, password: password() },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/logout',
          headers: authed(a),
          payload: {},
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({ url: '/session', headers: { cookie: a.cookie } })
      ).json().user,
    ).toBeNull();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers,
          payload: { username: a.username, password: a.password },
        })
      ).statusCode,
    ).toBe(200);
  });
  it('rejects expired sessions', async () => {
    const a = await account();
    db.prepare('UPDATE sessions SET expires_at=0').run();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: authed(a),
          payload: { events: [], cursor: 0 },
        })
      ).statusCode,
    ).toBe(401);
  });
  it('throttles repeated logins', async () => {
    for (let i = 0; i < 8; i++)
      await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers,
        payload: { username: 'missing_user', password: password() },
      });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers,
          payload: { username: 'missing_user', password: password() },
        })
      ).statusCode,
    ).toBe(429);
  });
  it('does not permit insecure SameSite=None configuration', async () => {
    const temporary = openDatabase('', true);
    await expect(
      createServer({ db: temporary, secure: false, sameSite: 'none' }),
    ).rejects.toThrow('requires Secure');
    temporary.close();
  });
});
describe('offline event reconciliation', () => {
  it('deduplicates a retry and downloads only this account’s events', async () => {
    const a = await account();
    const b = await account();
    const e = event();
    for (let i = 0; i < 2; i++)
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/sync',
            headers: authed(a),
            payload: { events: [e], cursor: 0 },
          })
        ).json().events,
      ).toHaveLength(1);
    const other = await app.inject({
      method: 'POST',
      url: '/sync',
      headers: authed(b),
      payload: { events: [], cursor: 0 },
    });
    expect(other.json().events).toHaveLength(0);
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n,
    ).toBe(1);
  });
  it('rejects a conflicting UUID without replacing evidence', async () => {
    const a = await account();
    const e = event();
    await app.inject({
      method: 'POST',
      url: '/sync',
      headers: authed(a),
      payload: { events: [e], cursor: 0 },
    });
    const conflict = { ...e, payload: { ...e.payload, correct: false } };
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: authed(a),
          payload: { events: [conflict], cursor: 0 },
        })
      ).statusCode,
    ).toBe(409);
  });
  it('rejects contradictory duplicates within a batch atomically', async () => {
    const a = await account();
    const e = event();
    const conflict = { ...e, payload: { ...e.payload, correct: false } };
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: authed(a),
          payload: { events: [e, conflict], cursor: 0 },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n,
    ).toBe(0);
  });
  it('rejects unknown question mappings and free-text leakage', async () => {
    const a = await account();
    const e = event();
    for (const payload of [
      { ...e.payload, question: 'unknown' },
      { ...e.payload, answer: 'private homework' },
    ])
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/sync',
            headers: authed(a),
            payload: { events: [{ ...e, payload }], cursor: 0 },
          })
        ).statusCode,
      ).toBe(400);
  });
  it('paginates without losing events after a reconnect', async () => {
    const a = await account();
    const batch = Array.from({ length: 201 }, event);
    for (const part of [
      batch.slice(0, 100),
      batch.slice(100, 200),
      batch.slice(200),
    ])
      await app.inject({
        method: 'POST',
        url: '/sync',
        headers: authed(a),
        payload: { events: part, cursor: 0 },
      });
    let cursor = 0;
    let count = 0;
    let more = true;
    while (more) {
      const r = (
        await app.inject({
          method: 'POST',
          url: '/sync',
          headers: authed(a),
          payload: { events: [], cursor },
        })
      ).json();
      count += r.events.length;
      expect(r.cursor).toBeGreaterThan(cursor);
      cursor = r.cursor;
      more = r.hasMore;
    }
    expect(count).toBe(201);
  });
});
describe('requests, aggregates and deletion', () => {
  it('returns real admin totals and eligible seven-day retention', async () => {
    const a = await account();
    db.prepare("UPDATE users SET role='admin',analytics=1 WHERE id=?").run(
      a.user.id,
    );
    const today = new Date().toISOString().slice(0, 10);
    const earlier = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    db.prepare('INSERT INTO activity VALUES (?,?)').run(a.user.id, earlier);
    db.prepare('INSERT INTO activity VALUES (?,?)').run(a.user.id, today);
    const r = await app.inject({
      url: '/admin/overview',
      headers: { cookie: a.cookie },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().accounts).toBe(1);
    expect(r.json().retention).toMatchObject({
      sevenDayEligible: 1,
      returned: 1,
    });
    expect(r.json().content.missingTransfer).toBe(0);
  });
  it('accepts a bounded guest request and permits only authorized status changes', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/requests',
      headers,
      payload: {
        kind: 'bug',
        message: 'The graph button is hard to reach on my phone.',
      },
    });
    expect(r.statusCode).toBe(201);
    const a = await account();
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: `/admin/requests/${r.json().id}`,
          headers: authed(a),
          payload: { status: 'done' },
        })
      ).statusCode,
    ).toBe(403);
    db.prepare("UPDATE users SET role='admin' WHERE id=?").run(a.user.id);
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: `/admin/requests/${r.json().id}`,
          headers: authed(a),
          payload: { status: 'planned' },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          url: '/admin/requests',
          headers: { cookie: a.cookie },
        })
      ).json().requests[0].status,
    ).toBe('planned');
  });
  it('requires consent and rejects raw search/answer content in analytics', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/analytics',
      headers,
      payload: {
        id: randomUUID(),
        type: 'search_performed',
        query: 'private query',
        consent: true,
      },
    });
    expect(bad.statusCode).toBe(400);
    const a = await account();
    await app.inject({
      method: 'POST',
      url: '/sync',
      headers: authed(a),
      payload: { events: [event()], cursor: 0 },
    });
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM analytics').get() as { n: number })
        .n,
    ).toBe(0);
  });
  it('aggregate retry does not double-count and no raw answer is stored', async () => {
    const a = await account();
    await app.inject({
      method: 'POST',
      url: '/account/privacy',
      headers: authed(a),
      payload: { analytics: true },
    });
    const e = event();
    for (let i = 0; i < 2; i++)
      await app.inject({
        method: 'POST',
        url: '/sync',
        headers: authed(a),
        payload: { events: [e], cursor: 0 },
      });
    expect(
      (
        db.prepare('SELECT SUM(count) AS n FROM analytics').get() as {
          n: number;
        }
      ).n,
    ).toBe(1);
    expect(
      (db.prepare('SELECT content FROM events').get() as { content: string })
        .content,
    ).not.toContain('answerText');
  });
  it('deletion requires password and cascades events, requests and sessions', async () => {
    const a = await account();
    await app.inject({
      method: 'POST',
      url: '/sync',
      headers: authed(a),
      payload: { events: [event()], cursor: 0 },
    });
    await app.inject({
      method: 'POST',
      url: '/requests',
      headers: authed(a),
      payload: {
        kind: 'feature',
        message: 'Please add a reviewed thermal physics unit.',
      },
    });
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: '/account',
          headers: authed(a),
          payload: { password: password() },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: '/account',
          headers: authed(a),
          payload: { password: a.password },
        })
      ).statusCode,
    ).toBe(200);
    for (const table of ['users', 'events', 'requests', 'sessions'])
      expect(
        (
          db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as {
            n: number;
          }
        ).n,
      ).toBe(0);
  });
});
