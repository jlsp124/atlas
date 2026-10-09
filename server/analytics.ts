import { createHash } from 'node:crypto';
import type { AtlasDatabase } from './database';
import type { ProductEvent } from '../src/core/product-analytics';
import { atlasVersion } from '../src/content/product';
import { assignments, concepts } from '../src/content/catalog';
import { japaneseWords } from '../src/content/japanese';
import { eventSchema } from '../src/core/schema';

const retentionDays = 30;
const usefulTypes = new Set([
  'assignment_opened',
  'concept_opened',
  'key_idea_opened',
  'notes_opened',
  'lab_opened',
  'walkthrough_started',
  'japanese_review_started',
  'quiz_started',
  'search_performed',
  'ai_prompt_copied',
]);
type Session = {
  actor_hash: string;
  version: string;
  started_at: string;
  last_activity_at: string;
  active_seconds: number;
  useful_actions: number;
};
export function recordProductEvent(
  db: AtlasDatabase,
  event: ProductEvent,
  userId?: string,
  now = Date.now(),
) {
  const stamp = new Date(now).toISOString();
  const actorHash = createHash('sha256')
    .update(userId ? `account:${userId}` : `guest:${event.visitor}`)
    .digest('hex');
  return db.transaction(() => {
    const cutoff = new Date(now - retentionDays * 86400000).toISOString();
    db.prepare('DELETE FROM product_events WHERE received_at<?').run(cutoff);
    db.prepare('DELETE FROM product_sessions WHERE started_at<?').run(cutoff);
    const previous = db
      .prepare('SELECT * FROM product_sessions WHERE id=?')
      .get(event.session) as Session | undefined;
    if (
      previous &&
      (previous.actor_hash !== actorHash || previous.version !== event.version)
    )
      return false;
    if (!previous)
      db.prepare(
        'INSERT INTO product_sessions(id,actor_hash,user_id,actor,device,version,started_at,last_active_at,last_activity_at) VALUES (?,?,?,?,?,?,?,?,?)',
      ).run(
        event.session,
        actorHash,
        userId ?? null,
        userId ? 'account' : 'guest',
        event.device,
        event.version,
        stamp,
        stamp,
        stamp,
      );
    const elapsed = previous ? now - Date.parse(previous.last_activity_at) : 0;
    // A client cannot inflate active time by retrying or rapidly posting heartbeats.
    const active =
      event.type === 'route_activity'
        ? Math.min(
            event.activeSeconds ?? 0,
            Math.max(0, Math.min(30, Math.floor(elapsed / 5000) * 5)),
          )
        : 0;
    const inserted = db
      .prepare(
        'INSERT OR IGNORE INTO product_events(id,session_id,type,course,material,concept,question,feature,scope,route,previous_route,version,device,success,result_bucket,duration_bucket,error_code,active_seconds,received_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        event.id,
        event.session,
        event.type,
        event.course ?? null,
        event.material ?? null,
        event.concept ?? null,
        event.question ?? null,
        event.feature ?? null,
        event.scope ?? null,
        event.route,
        event.previousRoute ?? null,
        event.version,
        event.device,
        event.success === undefined ? null : Number(event.success),
        event.resultBucket ?? null,
        event.durationBucket ?? null,
        event.errorCode ?? null,
        active,
        stamp,
      );
    if (!inserted.changes) return true;
    const useful = Number(usefulTypes.has(event.type));
    const firstUseful =
      useful && !previous?.useful_actions
        ? Math.round(
            Math.max(0, now - Date.parse(previous?.started_at ?? stamp)) /
              30000,
          ) * 30
        : null;
    db.prepare(
      'UPDATE product_sessions SET last_active_at=?,last_activity_at=CASE WHEN ? THEN ? ELSE last_activity_at END,active_seconds=active_seconds+?,route_views=route_views+?,useful_actions=useful_actions+?,first_useful_seconds=COALESCE(first_useful_seconds,?) WHERE id=?',
    ).run(
      stamp,
      event.type === 'route_activity' ? 1 : 0,
      stamp,
      active,
      Number(event.type === 'route_viewed'),
      useful,
      firstUseful,
      event.session,
    );
    return true;
  })();
}
const scalar = (
  db: AtlasDatabase,
  sql: string,
  ...values: (string | number)[]
) => (db.prepare(sql).get(...values) as { n: number | null }).n ?? 0;
function approximateMedian(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return (
    Math.round(
      (sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2) / 30,
    ) * 30
  );
}
export function productReport(db: AtlasDatabase, days = 7, now = Date.now()) {
  const end = new Date(now).toISOString();
  const start = new Date(now - days * 86400000).toISOString();
  const since = new Date(now - retentionDays * 86400000).toISOString();
  db.prepare('DELETE FROM product_events WHERE received_at<?').run(since);
  db.prepare('DELETE FROM product_sessions WHERE started_at<?').run(since);
  const rows = <T>(sql: string, ...values: (string | number)[]) =>
    db.prepare(sql).all(...values) as T[];
  type Count = { id: string; count: number };
  const events = (condition: string) =>
    scalar(
      db,
      `SELECT COUNT(*) AS n FROM product_events WHERE received_at>=? AND ${condition}`,
      start,
    );
  const sessions = rows<{
    active_seconds: number;
    route_views: number;
    useful_actions: number;
    first_useful_seconds: number | null;
  }>(
    'SELECT active_seconds,route_views,useful_actions,first_useful_seconds FROM product_sessions WHERE started_at>=?',
    start,
  );
  const sessionCount = sessions.length;
  const grouped = (column: 'device' | 'actor' | 'version') =>
    rows<Count>(
      `SELECT ${column} AS id,COUNT(*) AS count FROM product_sessions WHERE started_at>=? GROUP BY ${column} ORDER BY count DESC`,
      start,
    );
  const materialUse = rows<{
    id: string;
    course: string;
    opens: number;
    active_minutes_approx: number;
  }>(
    "SELECT material AS id,course,SUM(CASE WHEN type='assignment_opened' THEN 1 ELSE 0 END) AS opens,ROUND(SUM(active_seconds)/60.0,1) AS active_minutes_approx FROM product_events WHERE received_at>=? AND material IS NOT NULL GROUP BY material,course ORDER BY opens DESC LIMIT 25",
    start,
  );
  const routes = rows<{
    route: string;
    views: number;
    active_minutes_approx: number;
    quick_visits: number;
    return_sessions: number;
  }>(
    `WITH visits AS (SELECT session_id,route,SUM(CASE WHEN type='route_viewed' THEN 1 ELSE 0 END) AS views,SUM(active_seconds) AS active FROM product_events WHERE received_at>=? GROUP BY session_id,route) SELECT route,SUM(views) AS views,ROUND(SUM(active)/60.0,1) AS active_minutes_approx,SUM(CASE WHEN active<15 AND views>0 THEN 1 ELSE 0 END) AS quick_visits,SUM(CASE WHEN views>1 THEN 1 ELSE 0 END) AS return_sessions FROM visits GROUP BY route ORDER BY views DESC LIMIT 30`,
    start,
  );
  const releases = rows<{
    version: string;
    sessions: number;
    useful_sessions: number;
    active_minutes_approx: number;
    quick_sessions: number;
    median_time_to_useful_seconds_approx: number | null;
    searches: number;
    walkthrough_starts: number;
    walkthrough_completions: number;
    japanese_review_starts: number;
    japanese_review_completions: number;
    errors: number;
    route_views: number;
  }>(
    `SELECT version,COUNT(*) AS sessions,SUM(CASE WHEN useful_actions>0 THEN 1 ELSE 0 END) AS useful_sessions,ROUND(SUM(active_seconds)/60.0,1) AS active_minutes_approx,SUM(CASE WHEN active_seconds<15 AND useful_actions=0 THEN 1 ELSE 0 END) AS quick_sessions FROM product_sessions WHERE started_at>=? GROUP BY version ORDER BY MIN(started_at)`,
    start,
  ).map((release) => {
    const count = (type: string) =>
      scalar(
        db,
        'SELECT COUNT(*) AS n FROM product_events WHERE received_at>=? AND version=? AND type=?',
        start,
        release.version,
        type,
      );
    const times = rows<{ seconds: number }>(
      'SELECT first_useful_seconds AS seconds FROM product_sessions WHERE started_at>=? AND version=? AND first_useful_seconds IS NOT NULL',
      start,
      release.version,
    );
    return {
      ...release,
      median_time_to_useful_seconds_approx: approximateMedian(
        times.map((t) => t.seconds),
      ),
      searches: count('search_performed'),
      walkthrough_starts: count('walkthrough_started'),
      walkthrough_completions: count('walkthrough_completed'),
      japanese_review_starts: count('japanese_review_started'),
      japanese_review_completions: count('japanese_review_completed'),
      errors: count('client_error'),
      route_views: count('route_viewed'),
    };
  });
  const visitors = scalar(
    db,
    'SELECT COUNT(DISTINCT actor_hash) AS n FROM product_sessions WHERE started_at>=?',
    start,
  );
  const returning = scalar(
    db,
    'SELECT COUNT(DISTINCT s.actor_hash) AS n FROM product_sessions s WHERE s.started_at>=? AND EXISTS(SELECT 1 FROM product_sessions p WHERE p.actor_hash=s.actor_hash AND p.started_at<s.started_at)',
    start,
  );
  const feedback = rows<{ category: string; status: string; count: number }>(
    'SELECT kind AS category,status,COUNT(*) AS count FROM requests WHERE created_at>=? GROUP BY kind,status ORDER BY count DESC',
    start,
  );
  const report = {
    schema_version: 1,
    generated_at: end,
    atlas_version: atlasVersion,
    deploy_sha: /^[a-f0-9]{40}$/i.test(process.env.ATLAS_DEPLOY_SHA ?? '')
      ? process.env.ATLAS_DEPLOY_SHA
      : null,
    period: { start, end, days },
    coverage: {
      consent: 'Opt-in only; absent events do not mean absent use.',
      retention_days: retentionDays,
      active_time:
        'Visible, focused and interacted within 60 seconds. Five-second buckets; session estimates rounded to 30 seconds. Quick visits may include very recent sessions.',
      identity:
        'Random first-party guest IDs rotate after 30 days. Product export contains no account IDs, names, emails, messages, typed answers or search text.',
      started_at:
        rows<{ at: string | null }>(
          'SELECT MIN(received_at) AS at FROM product_events',
        )[0]?.at ?? null,
    },
    users: {
      total_accounts: scalar(db, 'SELECT COUNT(*) AS n FROM users'),
      analytics_enabled_accounts: scalar(
        db,
        'SELECT COUNT(*) AS n FROM users WHERE analytics=1',
      ),
      active_accounts_7d: scalar(
        db,
        'SELECT COUNT(*) AS n FROM users WHERE last_seen>=?',
        new Date(now - 7 * 86400000).toISOString(),
      ),
      active_accounts_30d: scalar(
        db,
        'SELECT COUNT(*) AS n FROM users WHERE last_seen>=?',
        since,
      ),
      new_accounts: scalar(
        db,
        'SELECT COUNT(*) AS n FROM users WHERE created_at>=?',
        start,
      ),
      consented_visitors: visitors,
      returning_visitors: returning,
      first_observed_visitors: Math.max(0, visitors - returning),
      daily: rows<{ day: string; visitors: number; sessions: number }>(
        'SELECT substr(started_at,1,10) AS day,COUNT(DISTINCT actor_hash) AS visitors,COUNT(*) AS sessions FROM product_sessions WHERE started_at>=? GROUP BY day ORDER BY day',
        start,
      ),
    },
    sessions: {
      total: sessionCount,
      actors: grouped('actor'),
      average_active_seconds_approx: sessionCount
        ? Math.round(
            sessions.reduce((sum, s) => sum + s.active_seconds, 0) /
              sessionCount /
              30,
          ) * 30
        : null,
      median_active_seconds_approx: approximateMedian(
        sessions.map((s) => s.active_seconds),
      ),
      active_buckets: ['under 15s', '15–59s', '1–5m', '5m+'].map(
        (id, index) => ({
          id,
          count: sessions.filter((s) =>
            index === 0
              ? s.active_seconds < 15
              : index === 1
                ? s.active_seconds >= 15 && s.active_seconds < 60
                : index === 2
                  ? s.active_seconds >= 60 && s.active_seconds < 300
                  : s.active_seconds >= 300,
          ).length,
        }),
      ),
      useful_sessions: sessions.filter((s) => s.useful_actions > 0).length,
      quick_sessions_without_action: sessions.filter(
        (s) => s.active_seconds < 15 && s.useful_actions === 0,
      ).length,
      median_time_to_useful_seconds_approx: approximateMedian(
        sessions.flatMap((s) =>
          s.first_useful_seconds === null ? [] : [s.first_useful_seconds],
        ),
      ),
      observed_funnel: {
        sessions: sessionCount,
        course_opened: events("type='course_opened'"),
        assignment_opened: events("type='assignment_opened'"),
        walkthrough_started: events("type='walkthrough_started'"),
        walkthrough_completed: events("type='walkthrough_completed'"),
      },
    },
    devices: grouped('device'),
    courses: rows<{
      id: string;
      opens: number;
      events: number;
      active_minutes_approx: number;
    }>(
      "SELECT course AS id,SUM(CASE WHEN type='course_opened' THEN 1 ELSE 0 END) AS opens,COUNT(*) AS events,ROUND(SUM(active_seconds)/60.0,1) AS active_minutes_approx FROM product_events WHERE received_at>=? AND course IS NOT NULL GROUP BY course ORDER BY events DESC",
      start,
    ),
    assignments: materialUse,
    features: rows<{
      id: string;
      entries: number;
      exits: number;
      sessions: number;
    }>(
      "SELECT feature AS id,SUM(CASE WHEN type IN ('feature_entered','walkthrough_started','japanese_review_started','key_idea_opened','notes_opened','lab_opened','assignment_opened') THEN 1 ELSE 0 END) AS entries,SUM(CASE WHEN type IN ('feature_exited','japanese_review_completed','walkthrough_completed') THEN 1 ELSE 0 END) AS exits,COUNT(DISTINCT session_id) AS sessions FROM product_events WHERE received_at>=? AND feature IS NOT NULL GROUP BY feature ORDER BY sessions DESC",
      start,
    ),
    feature_combinations: rows<{
      first: string;
      second: string;
      sessions: number;
    }>(
      'WITH used AS (SELECT DISTINCT session_id,feature FROM product_events WHERE received_at>=? AND feature IS NOT NULL) SELECT a.feature AS first,b.feature AS second,COUNT(*) AS sessions FROM used a JOIN used b ON a.session_id=b.session_id AND a.feature<b.feature GROUP BY a.feature,b.feature ORDER BY sessions DESC LIMIT 12',
      start,
    ),
    routes,
    navigation: rows<{ from: string; to: string; count: number }>(
      "SELECT previous_route AS 'from',route AS 'to',COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='route_viewed' AND previous_route IS NOT NULL AND previous_route<>route GROUP BY previous_route,route ORDER BY count DESC LIMIT 20",
      start,
    ),
    search: {
      searches: events("type='search_performed'"),
      empty_results: events("type='search_zero_results'"),
      result_buckets: rows<Count>(
        "SELECT result_bucket AS id,COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='search_performed' AND result_bucket IS NOT NULL GROUP BY result_bucket",
        start,
      ),
      note: 'Search terms are never collected.',
    },
    walkthroughs: {
      starts: events("type='walkthrough_started'"),
      completions: events("type='walkthrough_completed'"),
    },
    key_ideas: {
      opens: events("type='key_idea_opened'"),
      ideas: rows<Count>(
        "SELECT concept AS id,COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='key_idea_opened' AND concept IS NOT NULL GROUP BY concept ORDER BY count DESC LIMIT 20",
        start,
      ),
    },
    japanese_review: {
      starts: events("type='japanese_review_started'"),
      completions: events("type='japanese_review_completed'"),
      scopes: rows<Count>(
        "SELECT scope AS id,COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='japanese_review_started' AND scope IS NOT NULL GROUP BY scope ORDER BY count DESC",
        start,
      ),
    },
    feedback: {
      total: feedback.reduce((sum, row) => sum + row.count, 0),
      by_category_status: feedback,
    },
    errors: {
      total: events("type='client_error'"),
      codes: rows<Count>(
        "SELECT error_code AS id,COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='client_error' GROUP BY error_code ORDER BY count DESC",
        start,
      ),
    },
    performance: rows<{ route: string; bucket: string; count: number }>(
      "SELECT route,duration_bucket AS bucket,COUNT(*) AS count FROM product_events WHERE received_at>=? AND type='route_performance' AND duration_bucket IS NOT NULL GROUP BY route,duration_bucket ORDER BY route,count DESC",
      start,
    ),
    release_comparison: {
      releases,
      note: 'Compare rates and coverage, not raw counts. Only releases observed during this period appear; time and audience differ.',
    },
  };
  return report;
}
export type ProductReport = ReturnType<typeof productReport>;
export function accountSummaries(db: AtlasDatabase, now = Date.now()) {
  return db
    .prepare(
      `SELECT u.id,u.username,u.role,u.created_at,u.last_seen,u.analytics,(SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.expires_at>?) AS authenticated_sessions,(SELECT COUNT(*) FROM events e WHERE e.user_id=u.id) AS synced_events,(SELECT MAX(received_at) FROM events e WHERE e.user_id=u.id) AS last_sync,(SELECT COUNT(*) FROM product_sessions p WHERE p.user_id=u.id AND p.started_at>=?) AS product_sessions_30d FROM users u ORDER BY u.last_seen DESC LIMIT 250`,
    )
    .all(now, new Date(now - 30 * 86400000).toISOString()) as {
    id: string;
    username: string;
    role: 'user' | 'admin';
    created_at: string;
    last_seen: string;
    analytics: number;
    authenticated_sessions: number;
    synced_events: number;
    last_sync: string | null;
    product_sessions_30d: number;
  }[];
}

export type AccountActivity = {
  type: string;
  at: string;
  source: 'synced-work' | 'consented-product';
  course?: string | null;
  material?: string | null;
  concept?: string | null;
  question?: string | null;
  feature?: string | null;
  route?: string;
  version?: string;
};
/** Explicit admin troubleshooting only. Construct fields individually; never return a learner payload. */
export function accountActivity(
  db: AtlasDatabase,
  accountId: string,
  now = Date.now(),
): AccountActivity[] {
  const saved = db
    .prepare(
      'SELECT content,received_at FROM events WHERE user_id=? ORDER BY seq DESC LIMIT 15',
    )
    .all(accountId) as { content: string; received_at: string }[];
  const work = saved.flatMap((row): AccountActivity[] => {
    const parsed = eventSchema.safeParse(JSON.parse(row.content));
    if (!parsed.success) return [];
    const event = parsed.data;
    const material =
      'assignment' in event.payload ? event.payload.assignment : undefined;
    const concept =
      'concept' in event.payload ? event.payload.concept : undefined;
    const word =
      event.type === 'japanese_reviewed'
        ? japaneseWords.find((w) => w.id === event.payload.word)
        : undefined;
    const course = word
      ? 'japanese'
      : (assignments.find((a) => a.id === material)?.course ??
        concepts.find((c) => c.id === concept)?.course);
    const question =
      'question' in event.payload
        ? event.payload.question
        : 'checkpoint' in event.payload
          ? event.payload.checkpoint
          : word?.id;
    return [
      {
        type: event.type,
        at: row.received_at,
        source: 'synced-work',
        ...(course ? { course } : {}),
        ...(material ? { material } : {}),
        ...(concept ? { concept } : {}),
        ...(question ? { question } : {}),
      },
    ];
  });
  const product = db
    .prepare(
      `SELECT e.type,e.received_at AS at,e.course,e.material,e.concept,e.question,e.feature,e.route,e.version FROM product_events e JOIN product_sessions s ON s.id=e.session_id WHERE s.user_id=? AND e.received_at>=? AND e.type NOT IN ('route_activity','route_performance') ORDER BY e.received_at DESC LIMIT 15`,
    )
    .all(accountId, new Date(now - 30 * 86400000).toISOString()) as Omit<
    AccountActivity,
    'source'
  >[];
  return [
    ...work,
    ...product.map((row): AccountActivity => ({
      ...row,
      source: 'consented-product',
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15);
}
