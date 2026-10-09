import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { openDatabase, type AtlasDatabase } from '../server/database';
import { createServer } from '../server/app';
import { productReport, recordProductEvent } from '../server/analytics';
import {
  activeTimeSeconds,
  productEventSchema,
  publicRoute,
  routeMetadata,
  type ProductEvent,
} from '../src/core/product-analytics';

const origin = 'http://localhost:4321';
const headers = {
  origin,
  'x-atlas-client': 'atlas',
  'content-type': 'application/json',
};
const now = Date.parse('2026-10-08T17:00:00Z');
function event(overrides: Partial<ProductEvent> = {}): ProductEvent {
  return {
    id: randomUUID(),
    session: randomUUID(),
    visitor: randomUUID(),
    type: 'route_viewed',
    version: '0.1.2',
    device: 'mobile',
    consent: true,
    route: '/courses/japanese/',
    course: 'japanese',
    ...overrides,
  };
}
let db: AtlasDatabase;
let app: FastifyInstance;
beforeEach(async () => {
  db = openDatabase('', true);
  app = await createServer({ db, origin, secure: false });
});
afterEach(async () => {
  await app.close();
});
function identity(role: 'user' | 'admin', analytics = 1) {
  const id = randomUUID(),
    cookie = randomUUID().replace(/-/g, ''),
    csrf = randomUUID();
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(
    id,
    `fixture_${id.slice(0, 8)}`,
    'unused-test-only-hash',
    role,
    new Date(now).toISOString(),
    new Date(now).toISOString(),
    analytics,
  );
  return import('node:crypto').then(({ createHash }) => {
    db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').run(
      createHash('sha256').update(cookie).digest('hex'),
      id,
      csrf,
      Date.now() + 600000,
      new Date().toISOString(),
    );
    return {
      id,
      headers: {
        ...headers,
        cookie: `atlas-dev=${cookie}`,
        'x-csrf-token': csrf,
      },
    };
  });
}
describe('product analytics privacy and active time', () => {
  it('accepts reviewed routes and separates Life Sciences sections while rejecting arbitrary context', () => {
    expect(publicRoute('/atlas/work/kinematics-review/', '/atlas')).toBe(
      '/work/kinematics-review/',
    );
    expect(
      publicRoute('/atlas/account/?email=private@example.invalid', '/atlas'),
    ).toBe('/other/');
    expect(publicRoute('/some/private/path/')).toBe('/other/');
    expect(routeMetadata('/courses/life-sciences/key-ideas/').feature).toBe(
      'key-ideas',
    );
    expect(routeMetadata('/courses/life-sciences/review/').feature).toBe(
      'definitions',
    );
    expect(
      routeMetadata('/courses/life-sciences/assignments/bio-c17-2/'),
    ).toMatchObject({
      material: 'bio-c17-2',
      course: 'life-sciences',
      feature: 'assignments',
    });
    expect(
      productEventSchema.safeParse(
        event({
          route: '/courses/life-sciences/assignments/bio-c17-2/',
          course: 'life-sciences',
          material: 'bio-c17-2',
          question: 'q-17-2-1',
        }),
      ).success,
    ).toBe(true);
    for (const privatePayload of [
      { answer: 'private homework' },
      { query: 'private search' },
      { email: 'private@example.invalid' },
      { token: 'secret' },
      { message: 'private tutoring' },
      { uploadedFile: 'private.jpg' },
    ])
      expect(
        productEventSchema.safeParse({ ...event(), ...privatePayload }).success,
      ).toBe(false);
    for (const field of [
      { route: '/account/?token=secret' },
      { previousRoute: 'https://private.invalid/' },
      { material: 'unknown-material' },
      { concept: 'private-text' },
      { feature: 'raw words' },
      { errorCode: 'user-generated-error-text' },
    ])
      expect(
        productEventSchema.safeParse({ ...event(), ...field }).success,
      ).toBe(false);
  });
  it('does not count hidden, unfocused or idle pages and bounds foreground increments', () => {
    expect(activeTimeSeconds(now, now + 15000, now, true, true)).toBe(15);
    expect(activeTimeSeconds(now, now + 15000, now, false, true)).toBe(0);
    expect(activeTimeSeconds(now, now + 15000, now, true, false)).toBe(0);
    expect(activeTimeSeconds(now, now + 60000, now, true, true)).toBe(0);
    expect(activeTimeSeconds(now, now + 45 * 60000, now, true, true)).toBe(0);
    expect(activeTimeSeconds(now, now + 45000, now + 40000, true, true)).toBe(
      30,
    );
  });
  it('deduplicates and bounds claimed active time by server elapsed time', () => {
    const visit = event();
    recordProductEvent(db, visit, undefined, now);
    const pulse = event({
      session: visit.session,
      visitor: visit.visitor,
      type: 'route_activity',
      activeSeconds: 30,
    });
    recordProductEvent(db, pulse, undefined, now + 15000);
    recordProductEvent(db, pulse, undefined, now + 15000);
    recordProductEvent(
      db,
      event({ ...pulse, id: randomUUID() }),
      undefined,
      now + 15000,
    );
    expect(
      (
        db.prepare('SELECT active_seconds FROM product_sessions').get() as {
          active_seconds: number;
        }
      ).active_seconds,
    ).toBe(15);
    expect(
      recordProductEvent(
        db,
        event({ session: visit.session }),
        undefined,
        now + 20000,
      ),
    ).toBe(false);
    expect(
      recordProductEvent(
        db,
        event({
          session: visit.session,
          visitor: visit.visitor,
          version: '0.1.3',
        }),
        undefined,
        now + 20000,
      ),
    ).toBe(false);
    const report = productReport(db, 7, now + 20000);
    expect(report.sessions.total).toBe(1);
    expect(report.sessions.active_buckets[1].count).toBe(1);
    expect(JSON.stringify(report)).not.toContain(visit.session);
    expect(JSON.stringify(report)).not.toContain(visit.visitor);
  });
  it('keeps release comparisons and report counts aggregate without identity or feedback contents', async () => {
    const admin = await identity('admin');
    const old = event({
      version: '0.1.1',
      type: 'japanese_review_started',
      feature: 'japanese-review',
      scope: 'colors',
    });
    const newer = event({
      version: '0.1.2',
      type: 'search_performed',
      feature: 'search',
      resultBucket: '0',
    });
    recordProductEvent(db, old, admin.id, now - 2 * 86400000);
    recordProductEvent(db, newer, admin.id, now);
    db.prepare(
      'INSERT INTO requests(id,kind,message,contact,created_at) VALUES (?,?,?,?,?)',
    ).run(
      randomUUID(),
      'bug',
      'private fixture feedback',
      'fixture@example.invalid',
      new Date(now).toISOString(),
    );
    const report = productReport(db, 7, now + 1000);
    expect(report.release_comparison.releases.map((r) => r.version)).toEqual([
      '0.1.1',
      '0.1.2',
    ]);
    expect(report.users.returning_visitors).toBe(1);
    expect(report.search.searches).toBe(1);
    expect(report.japanese_review.starts).toBe(1);
    const json = JSON.stringify(report);
    for (const value of [
      admin.id,
      'private fixture feedback',
      'fixture@example.invalid',
      'actor_hash',
      'password_hash',
      'csrf',
    ])
      expect(json).not.toContain(value);
    const result = await app.inject({
      url: '/admin/accounts',
      headers: admin.headers,
    });
    expect(result.statusCode).toBe(200);
    expect(result.json().accounts[0]).toMatchObject({
      id: admin.id,
      synced_events: 0,
      analytics: 1,
    });
    expect(JSON.stringify(result.json())).not.toContain(
      'unused-test-only-hash',
    );
    expect(result.headers['cache-control']).toBe('no-store');
  });
  it('expires private metadata after 30 days and removes linked sessions on account deletion', async () => {
    const account = await identity('user');
    recordProductEvent(db, event(), undefined, now - 31 * 86400000);
    recordProductEvent(db, event(), account.id, now);
    expect(productReport(db, 30, now).sessions.total).toBe(1);
    expect(
      (
        db.prepare('SELECT COUNT(*) AS n FROM product_sessions').get() as {
          n: number;
        }
      ).n,
    ).toBe(1);
    db.prepare('DELETE FROM users WHERE id=?').run(account.id);
    expect(
      (
        db.prepare('SELECT COUNT(*) AS n FROM product_events').get() as {
          n: number;
        }
      ).n,
    ).toBe(0);
  });
  it('guards new private endpoints, consent and CSRF on metadata ingestion', async () => {
    const user = await identity('user', 0);
    for (const path of [
      '/admin/report',
      '/admin/accounts',
      `/admin/accounts/${user.id}/activity`,
    ]) {
      expect((await app.inject(path)).statusCode).toBe(401);
      expect(
        (await app.inject({ url: path, headers: user.headers })).statusCode,
      ).toBe(403);
    }
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers: user.headers,
          payload: event(),
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers: { ...headers, cookie: user.headers.cookie },
          payload: event(),
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers,
          payload: { ...event(), consent: false },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers,
          payload: { ...event(), answer: 'private' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers,
          payload: event(),
        })
      ).statusCode,
    ).toBe(200);
    const admin = await identity('admin');
    expect(
      (
        await app.inject({
          url: '/admin/report?days=365',
          headers: admin.headers,
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          url: '/admin/report?days=7',
          headers: admin.headers,
        })
      ).json().schema_version,
    ).toBe(1);
  });
  it('does not let another authenticated account claim an existing analytics session', async () => {
    const first = await identity('user');
    const second = await identity('user');
    const visit = event();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/analytics',
          headers: first.headers,
          payload: visit,
        })
      ).statusCode,
    ).toBe(200);
    const conflict = await app.inject({
      method: 'POST',
      url: '/analytics',
      headers: second.headers,
      payload: { ...visit, id: randomUUID() },
    });
    expect(conflict.statusCode).toBe(409);
    expect(JSON.stringify(conflict.json())).not.toContain(first.id);
    expect(
      (
        await app.inject({
          url: `/admin/accounts/${first.id}/activity`,
          headers: second.headers,
        })
      ).statusCode,
    ).toBe(403);
  });
  it('requires an explicit admin operation for recent metadata and never returns saved assignment values', async () => {
    const owner = await identity('user');
    const admin = await identity('admin');
    const draft = {
      id: randomUUID(),
      device: randomUUID(),
      at: new Date().toISOString(),
      type: 'checkpoint_saved',
      payload: {
        assignment: 'kinematics-review',
        checkpoint: 'q-10',
        value: 'Synthetic private draft value',
        unit: 'm/s',
        direction: 'downward',
        step: 2,
        help: true,
        complete: false,
      },
    };
    const save = await app.inject({
      method: 'POST',
      url: '/sync',
      headers: owner.headers,
      payload: { events: [draft], cursor: 0 },
    });
    expect(save.statusCode).toBe(200);
    const result = await app.inject({
      url: `/admin/accounts/${owner.id}/activity`,
      headers: admin.headers,
    });
    expect(result.statusCode).toBe(200);
    expect(result.json().activity[0]).toMatchObject({
      type: 'checkpoint_saved',
      material: 'kinematics-review',
      question: 'q-10',
      course: 'physics',
      source: 'synced-work',
    });
    expect(JSON.stringify(result.json())).not.toContain(
      'Synthetic private draft value',
    );
    expect(JSON.stringify(result.json())).not.toContain('downward');
    expect(JSON.stringify(productReport(db, 7))).not.toContain(owner.id);
    expect(
      (
        await app.inject({
          url: '/admin/accounts/not-an-id/activity',
          headers: admin.headers,
        })
      ).statusCode,
    ).toBe(404);
  });
  it('stores submitted feedback context privately and supports simple status changes', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/requests',
      headers,
      payload: {
        kind: 'bug',
        message: 'Synthetic private message only.',
        course: 'japanese',
        route: '/courses/japanese/',
        version: '0.1.2',
        device: 'mobile',
      },
    });
    expect(result.statusCode).toBe(201);
    const admin = await identity('admin');
    const change = await app.inject({
      method: 'PATCH',
      url: `/admin/requests/${result.json().id}`,
      headers: admin.headers,
      payload: { status: 'fixed' },
    });
    expect(change.statusCode).toBe(200);
    const inbox = (
      await app.inject({ url: '/admin/requests', headers: admin.headers })
    ).json().requests;
    expect(inbox[0]).toMatchObject({
      status: 'fixed',
      version: '0.1.2',
      device: 'mobile',
      route: '/courses/japanese/',
    });
    expect(JSON.stringify(productReport(db, 7))).not.toContain(
      'Synthetic private message only.',
    );
  });
});
