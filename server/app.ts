import Fastify, { LogController } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import argon2 from 'argon2';
import { z } from 'zod';
import { openDatabase, type AtlasDatabase, type UserRow } from './database';
import { eventSchema } from '../src/core/schema';
import { validCheckpoint } from '../src/core/materials';
import {
  assignments,
  legacyAssignmentTasks,
  concepts,
  courses,
  questions,
  snapshot,
  sources,
} from '../src/content/catalog';

export type ServerOptions = {
  db?: AtlasDatabase;
  origin?: string;
  additionalOrigins?: string[];
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  logger?: boolean;
  trustProxy?: boolean;
};
export const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;
const credentials = z
  .object({
    username: z.string().regex(/^[A-Za-z0-9_]{3,32}$/),
    password: z.string().min(12).max(128),
  })
  .strict();
const requestInput = z
  .object({
    kind: z.enum([
      'wrong-information',
      'bug',
      'feature',
      'missing-material',
      'assignment-help',
      'course-resource',
    ]),
    course: z
      .enum(['physics', 'chemistry', 'life-sciences', 'japanese'])
      .optional(),
    message: z.string().trim().min(10).max(3000),
    contact: z.email().max(254).optional(),
  })
  .strict();
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const safeEqual = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
type SessionRow = {
  hash: string;
  user_id: string;
  csrf: string;
  expires_at: number;
};
const analyticTypes = [
  'course_opened',
  'concept_opened',
  'assignment_opened',
  'assignment_completed',
  'quiz_started',
  'quiz_completed',
  'question_answered',
  'hint_used',
  'confusion_marked',
  'graph_opened',
  'graph_path_started',
  'gap_repair_started',
  'gap_repair_completed',
  'ai_prompt_copied',
  'search_performed',
  'search_zero_results',
  'request_submitted',
] as const;

export async function createServer(options: ServerOptions = {}) {
  const db = options.db ?? openDatabase();
  const origin =
    options.origin ?? process.env.ALLOWED_ORIGIN ?? 'http://localhost:4321';
  const origins = [
    ...new Set(
      [
        origin,
        ...(options.additionalOrigins ??
          process.env.ADDITIONAL_ALLOWED_ORIGINS?.split(',') ??
          []),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (
    !origins.length ||
    origins.some((value) => {
      try {
        return (
          value.includes('*') ||
          !/^https?:/.test(value) ||
          new URL(value).origin !== value
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error(
      'Allowed origins must be exact HTTP(S) origins without paths',
    );
  const secure = options.secure ?? process.env.COOKIE_SECURE !== 'false';
  const sameSite =
    options.sameSite ??
    (process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax');
  if (
    process.env.NODE_ENV === 'production' &&
    (!secure || origins.some((value) => !value.startsWith('https://')))
  )
    throw new Error(
      'Production requires secure cookies and an HTTPS allowed origin',
    );
  if (sameSite === 'none' && !secure)
    throw new Error('SameSite=None requires Secure');
  const cookieName = secure ? '__Host-atlas' : 'atlas-dev';
  const app = Fastify({
    bodyLimit: 128 * 1024,
    logger: options.logger
      ? { redact: ['req.headers', 'req.body', 'res.headers'] }
      : false,
    logController: new LogController({ disableRequestLogging: true }),
    trustProxy: options.trustProxy ?? false,
  });
  await app.register(cookie);
  await app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'x-csrf-token', 'x-atlas-client'],
  });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
  });
  await app.register(rateLimit, {
    global: true,
    max: 150,
    timeWindow: '1 minute',
  });
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      if (
        !origins.includes(req.headers.origin ?? '') ||
        req.headers['x-atlas-client'] !== 'atlas'
      )
        return reply
          .code(403)
          .send({ error: 'Origin or request header rejected' });
      if (!req.headers['content-type']?.startsWith('application/json'))
        return reply.code(415).send({ error: 'JSON required' });
    }
  });
  app.setErrorHandler((err, _req, reply) => {
    const status =
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      typeof err.statusCode === 'number'
        ? err.statusCode
        : 500;
    if (status >= 500)
      app.log.error({ code: 'server_error' }, 'Request failed');
    reply.code(status).send({
      error:
        status === 429
          ? 'Too many requests. Try again shortly.'
          : status >= 500
            ? 'Service temporarily unavailable'
            : 'Invalid request',
    });
  });
  app.addHook('onClose', async () => {
    db.close();
  });
  function session(req: { cookies: Record<string, string | undefined> }) {
    const token = req.cookies[cookieName];
    return token
      ? (db
          .prepare('SELECT * FROM sessions WHERE hash=? AND expires_at>?')
          .get(digest(token), Date.now()) as SessionRow | undefined)
      : undefined;
  }
  function userFor(s: SessionRow) {
    return db
      .prepare('SELECT * FROM users WHERE id=?')
      .get(s.user_id) as UserRow;
  }
  function publicUser(u: UserRow) {
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      analytics: !!u.analytics,
    };
  }
  const auth = async (
    req: Parameters<typeof session>[0] & {
      headers: Record<string, unknown>;
      method: string;
    },
    reply: { code: (n: number) => { send: (x: unknown) => unknown } },
    admin = false,
  ) => {
    const s = session(req);
    if (!s) {
      reply.code(401).send({ error: 'Sign in required' });
      return;
    }
    const u = userFor(s);
    if (admin && u.role !== 'admin') {
      reply.code(403).send({ error: 'Administrator authorization required' });
      return;
    }
    if (
      req.method !== 'GET' &&
      !safeEqual(String(req.headers['x-csrf-token'] ?? ''), s.csrf)
    ) {
      reply.code(403).send({ error: 'CSRF check failed' });
      return;
    }
    return { s, u };
  };
  function beginSession(
    u: UserRow,
    reply: {
      setCookie: (name: string, value: string, options: object) => unknown;
    },
  ) {
    db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    const csrf = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').run(
      digest(token),
      u.id,
      csrf,
      Date.now() + 7 * 86400000,
      new Date().toISOString(),
    );
    reply.setCookie(cookieName, token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 7 * 86400,
    });
    db.prepare('UPDATE users SET last_seen=? WHERE id=?').run(
      new Date().toISOString(),
      u.id,
    );
    return { user: publicUser(u), csrf };
  }
  const dummyHash = await argon2.hash(
    randomBytes(24).toString('hex'),
    passwordOptions,
  );
  app.get('/health', async () => ({
    status: 'ok',
    version: '0.1.0',
    contentSnapshot: snapshot.date,
    deploySha: /^[a-f0-9]{40}$/i.test(process.env.ATLAS_DEPLOY_SHA ?? '')
      ? process.env.ATLAS_DEPLOY_SHA
      : null,
  }));
  app.get('/session', async (req) => {
    const s = session(req);
    return s ? { user: publicUser(userFor(s)), csrf: s.csrf } : { user: null };
  });
  app.post(
    '/auth/register',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (req, reply) => {
      const parsed = credentials.safeParse(req.body);
      if (!parsed.success)
        return reply.code(400).send({
          error:
            'Use a 3–32 character username and a 12–128 character password.',
        });
      const { username, password } = parsed.data;
      if (
        username.toLowerCase() === 'jovan' ||
        db.prepare('SELECT id FROM users WHERE username=?').get(username)
      )
        return reply.code(409).send({ error: 'Choose a different username' });
      const u: UserRow = {
        id: randomUUID(),
        username,
        password_hash: await argon2.hash(password, passwordOptions),
        role: 'user',
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        analytics: 0,
      };
      // The unique constraint also closes concurrent-registration races.
      try {
        db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(
          u.id,
          u.username,
          u.password_hash,
          u.role,
          u.created_at,
          u.last_seen,
          0,
        );
      } catch {
        return reply.code(409).send({ error: 'Choose a different username' });
      }
      return reply.code(201).send(beginSession(u, reply));
    },
  );
  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } },
    async (req, reply) => {
      const parsed = credentials.safeParse(req.body);
      if (!parsed.success)
        return reply.code(401).send({ error: 'Invalid username or password' });
      const u = db
        .prepare('SELECT * FROM users WHERE username=?')
        .get(parsed.data.username) as UserRow | undefined;
      const valid = await argon2.verify(
        u?.password_hash ?? dummyHash,
        parsed.data.password,
      );
      if (!u || !valid)
        return reply.code(401).send({ error: 'Invalid username or password' });
      const previous = session(req);
      if (previous)
        db.prepare('DELETE FROM sessions WHERE hash=?').run(previous.hash);
      return beginSession(u, reply);
    },
  );
  app.post('/auth/logout', async (req, reply) => {
    const a = await auth(req, reply);
    if (!a) return;
    db.prepare('DELETE FROM sessions WHERE hash=?').run(a.s.hash);
    reply.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  });
  app.delete('/account', async (req, reply) => {
    const a = await auth(req, reply);
    if (!a) return;
    const p = z
      .object({ password: z.string().min(1).max(128) })
      .strict()
      .safeParse(req.body);
    if (
      !p.success ||
      !(await argon2.verify(a.u.password_hash, p.data.password))
    )
      return reply.code(401).send({ error: 'Password required for deletion' });
    if (a.u.role === 'admin')
      return reply.code(409).send({
        error: 'Administrator deletion requires the local server operator',
      });
    db.prepare('DELETE FROM users WHERE id=?').run(a.u.id);
    reply.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  });
  app.post('/account/privacy', async (req, reply) => {
    const a = await auth(req, reply);
    if (!a) return;
    const p = z.object({ analytics: z.boolean() }).strict().safeParse(req.body);
    if (!p.success)
      return reply.code(400).send({ error: 'Invalid preference' });
    db.prepare('UPDATE users SET analytics=? WHERE id=?').run(
      Number(p.data.analytics),
      a.u.id,
    );
    return { ok: true };
  });
  const batchSchema = z
    .object({
      events: z.array(eventSchema).max(100),
      cursor: z.number().int().min(0).default(0),
    })
    .strict();
  function aggregate(
    type: string,
    course: string,
    concept: string,
    actor: string,
    incorrect = 0,
    hints = 0,
  ) {
    db.prepare(
      `INSERT INTO analytics VALUES (?,?,?,?,?,1,?,?) ON CONFLICT(day,type,course,concept,actor) DO UPDATE SET count=count+1, incorrect=incorrect+excluded.incorrect,hints=hints+excluded.hints`,
    ).run(
      new Date().toISOString().slice(0, 10),
      type,
      course,
      concept,
      actor,
      incorrect,
      hints,
    );
  }
  app.post('/sync', async (req, reply) => {
    const a = await auth(req, reply);
    if (!a) return;
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: 'Invalid sync batch' });
    const { events, cursor } = parsed.data;
    const batchIds = new Map<string, string>();
    for (const e of events) {
      const content = JSON.stringify(e);
      if (batchIds.has(e.id) && batchIds.get(e.id) !== content)
        return reply
          .code(409)
          .send({ error: 'Event ID conflict; batch not accepted' });
      batchIds.set(e.id, content);
      if (
        Date.parse(e.at) > Date.now() + 5 * 60000 ||
        Date.parse(e.at) < Date.parse('2020-01-01')
      )
        return reply.code(400).send({ error: 'Invalid event clock' });
      const conceptId = 'concept' in e.payload ? e.payload.concept : undefined;
      if (e.type === 'material_completed' || e.type === 'checkpoint_saved') {
        const material = assignments.find((a) => a.id === e.payload.assignment);
        if (
          !material ||
          (e.type === 'checkpoint_saved' &&
            !validCheckpoint(material, e.payload.checkpoint))
        )
          return reply.code(400).send({ error: 'Unknown material checkpoint' });
      }
      if (conceptId && !concepts.some((c) => c.id === conceptId))
        return reply.code(400).send({ error: 'Unknown concept' });
      if (
        e.type === 'question_answered' &&
        !questions.some(
          (q) =>
            q.id === e.payload.question &&
            q.concepts.includes(e.payload.concept),
        )
      )
        return reply.code(400).send({ error: 'Unknown question mapping' });
      if (
        e.type === 'assignment_task' &&
        !assignments.some(
          (x) =>
            x.id === e.payload.assignment &&
            (x.tasks.some((t) => t.id === e.payload.task) ||
              legacyAssignmentTasks[x.id]?.includes(e.payload.task)),
        )
      )
        return reply.code(400).send({ error: 'Unknown task' });
      if (
        e.type === 'difficulty_rated' ||
        e.type === 'companion_attempt' ||
        e.type === 'companion_help'
      ) {
        const a = assignments.find((a) => a.id === e.payload.assignment);
        const checkpoint =
          e.type === 'difficulty_rated'
            ? e.payload.checkpoint
            : e.payload.question;
        const q = a?.companionQuestions?.find((q) => q.id === checkpoint);
        if (
          !a ||
          a.assistance === 'independent-only' ||
          !q?.concepts.includes(e.payload.concept)
        )
          return reply.code(400).send({ error: 'Unknown companion mapping' });
      }
      if (
        e.type === 'courses_selected' &&
        !e.payload.courses.every((id) => courses.some((c) => c.id === id))
      )
        return reply.code(400).send({ error: 'Unknown course' });
      const previous = db
        .prepare('SELECT content FROM events WHERE user_id=? AND event_id=?')
        .get(a.u.id, e.id) as { content: string } | undefined;
      if (previous && previous.content !== JSON.stringify(e))
        return reply
          .code(409)
          .send({ error: 'Event ID conflict; existing event preserved' });
    }
    db.transaction(() => {
      for (const e of events) {
        const inserted = db
          .prepare(
            'INSERT OR IGNORE INTO events(user_id,event_id,content,received_at) VALUES (?,?,?,?)',
          )
          .run(a.u.id, e.id, JSON.stringify(e), new Date().toISOString());
        if (inserted.changes && a.u.analytics && 'concept' in e.payload) {
          const conceptId = e.payload.concept;
          const c = concepts.find((c) => c.id === conceptId)!;
          aggregate(
            e.type,
            c.course,
            c.id,
            'account',
            e.type === 'question_answered' ? Number(!e.payload.correct) : 0,
            e.type === 'question_answered' ? e.payload.hints : 0,
          );
        }
      }
      db.prepare('UPDATE users SET last_seen=? WHERE id=?').run(
        new Date().toISOString(),
        a.u.id,
      );
      if (a.u.analytics)
        db.prepare('INSERT OR IGNORE INTO activity VALUES (?,?)').run(
          a.u.id,
          new Date().toISOString().slice(0, 10),
        );
    })();
    const rows = db
      .prepare(
        'SELECT seq,content FROM events WHERE user_id=? AND seq>? ORDER BY seq LIMIT 101',
      )
      .all(a.u.id, cursor) as { seq: number; content: string }[];
    const page = rows.slice(0, 100);
    return {
      accepted: events.map((e) => e.id),
      events: page.map((r) => JSON.parse(r.content)),
      cursor: page.at(-1)?.seq ?? cursor,
      hasMore: rows.length > 100,
    };
  });
  app.post(
    '/requests',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (req, reply) => {
      const p = requestInput.safeParse(req.body);
      if (!p.success)
        return reply.code(400).send({
          error: 'Choose a request type and include 10–3000 characters.',
        });
      const s = session(req);
      if (s && !safeEqual(String(req.headers['x-csrf-token'] ?? ''), s.csrf))
        return reply.code(403).send({ error: 'CSRF check failed' });
      const id = randomUUID();
      db.prepare(
        'INSERT INTO requests(id,user_id,kind,course,message,contact,created_at) VALUES (?,?,?,?,?,?,?)',
      ).run(
        id,
        s?.user_id ?? null,
        p.data.kind,
        p.data.course ?? null,
        p.data.message,
        p.data.contact ?? null,
        new Date().toISOString(),
      );
      return reply.code(201).send({ id, status: 'new' });
    },
  );
  const analyticsInput = z
    .object({
      id: z.uuid(),
      type: z.enum(analyticTypes),
      course: z
        .enum(['physics', 'chemistry', 'life-sciences', 'japanese'])
        .optional(),
      concept: z.string().max(100).optional(),
      consent: z.literal(true),
    })
    .strict();
  app.post('/analytics', async (req, reply) => {
    const p = analyticsInput.safeParse(req.body);
    if (!p.success)
      return reply.code(400).send({ error: 'Invalid aggregate event' });
    const s = session(req);
    if (s && !safeEqual(String(req.headers['x-csrf-token'] ?? ''), s.csrf))
      return reply.code(403).send({ error: 'CSRF check failed' });
    if (s && !userFor(s).analytics)
      return reply
        .code(403)
        .send({ error: 'Analytics are disabled for this account' });
    if (p.data.concept && !concepts.some((c) => c.id === p.data.concept))
      return reply.code(400).send({ error: 'Unknown concept' });
    db.transaction(() => {
      db.prepare('DELETE FROM analytics_dedupe WHERE created_at<?').run(
        Date.now() - 30 * 86400000,
      );
      const inserted = db
        .prepare('INSERT OR IGNORE INTO analytics_dedupe VALUES (?,?)')
        .run(p.data.id, Date.now());
      if (inserted.changes)
        aggregate(
          p.data.type,
          p.data.course ?? '',
          p.data.concept ?? '',
          s ? 'account' : 'guest',
        );
    })();
    return { ok: true };
  });
  app.get('/admin/overview', async (req, reply) => {
    const a = await auth(req, reply, true);
    if (!a) return;
    const scalar = (sql: string, ...args: (string | number)[]) =>
      (db.prepare(sql).get(...args) as { n: number }).n;
    const daily = new Date().toISOString().slice(0, 10);
    const windows = [1, 7, 30].map((days) =>
      scalar(
        'SELECT COUNT(*) AS n FROM users WHERE last_seen>=?',
        new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10),
      ),
    );
    const sevenDayEligible = scalar(
      "SELECT COUNT(DISTINCT a.user_id) AS n FROM activity a WHERE a.day<=date(?,'-7 days')",
      daily,
    );
    const returned = scalar(
      "SELECT COUNT(DISTINCT a.user_id) AS n FROM activity a JOIN activity b ON a.user_id=b.user_id AND b.day=date(a.day,'+7 days')",
    );
    return {
      health: 'ok',
      contentSnapshot: snapshot.date,
      lastDeploy: process.env.ATLAS_DEPLOY_SHA ?? null,
      accounts: scalar('SELECT COUNT(*) AS n FROM users'),
      newAccounts: scalar(
        'SELECT COUNT(*) AS n FROM users WHERE created_at>=?',
        daily,
      ),
      active: { today: windows[0], week: windows[1], month: windows[2] },
      sessions: scalar(
        'SELECT COUNT(*) AS n FROM sessions WHERE expires_at>?',
        Date.now(),
      ),
      pendingRequests: scalar(
        "SELECT COUNT(*) AS n FROM requests WHERE status IN ('new','reviewing')",
      ),
      learning: db
        .prepare(
          "SELECT concept,SUM(count) AS attempts,SUM(incorrect) AS incorrect,SUM(hints) AS hints FROM analytics WHERE type='question_answered' AND concept<>'' GROUP BY concept ORDER BY incorrect DESC LIMIT 12",
        )
        .all(),
      confusion: db
        .prepare(
          "SELECT concept,SUM(count) AS count FROM analytics WHERE type='concept_marked_confused' GROUP BY concept ORDER BY count DESC LIMIT 12",
        )
        .all(),
      product: db
        .prepare(
          'SELECT type,actor,SUM(count) AS count FROM analytics GROUP BY type,actor ORDER BY count DESC',
        )
        .all(),
      retention: {
        sevenDayEligible,
        returned,
        note: 'Consented synced accounts with eligible daily activity only. No individual activity endpoint.',
      },
      content: {
        concepts: concepts.length,
        missingPractice: concepts.filter(
          (c) => !questions.some((q) => q.concepts.includes(c.id)),
        ).length,
        missingTransfer: concepts.filter(
          (c) =>
            !questions.some(
              (q) => q.level === 'transfer' && q.concepts.includes(c.id),
            ),
        ).length,
        staleSources: sources.filter(
          (s) => (Date.now() - Date.parse(s.checked)) / 86400000 > 14,
        ).length,
        unavailableSources: sources
          .filter((s) => s.status === 'unavailable')
          .map((s) => s.title),
        note: 'Chapter 19 and complete course syllabuses remain outside the reviewed learning bank.',
      },
    };
  });
  app.get('/admin/requests', async (req, reply) => {
    if (!(await auth(req, reply, true))) return;
    return {
      requests: db
        .prepare(
          'SELECT id,kind,course,message,contact,status,created_at FROM requests ORDER BY created_at DESC LIMIT 200',
        )
        .all(),
    };
  });
  app.patch('/admin/requests/:id', async (req, reply) => {
    if (!(await auth(req, reply, true))) return;
    const p = z
      .object({
        status: z.enum(['new', 'reviewing', 'planned', 'done', 'declined']),
      })
      .strict()
      .safeParse(req.body);
    const id = (req.params as { id: string }).id;
    if (!z.uuid().safeParse(id).success || !p.success)
      return reply.code(400).send({ error: 'Invalid status' });
    const result = db
      .prepare('UPDATE requests SET status=? WHERE id=?')
      .run(p.data.status, id);
    if (!result.changes)
      return reply.code(404).send({ error: 'Request not found' });
    return { ok: true };
  });
  return app;
}
