import { Fragment, useEffect, useState } from 'react';
import { courses, concepts, assignments } from '../content/catalog';
import { lifeMaterials } from '../content/life-sciences';
import { API, request, url, useLearner } from '../client/store';
import type { AccountActivity, ProductReport } from '../../server/analytics';
import '../styles/admin.css';

type AccountRow = {
  id: string;
  username: string;
  role: string;
  created_at: string;
  last_seen: string;
  analytics: number;
  authenticated_sessions: number;
  synced_events: number;
  last_sync: string | null;
  product_sessions_30d: number;
};
type RequestRow = {
  id: string;
  kind: string;
  course: string | null;
  message: string;
  contact: string | null;
  status: string;
  created_at: string;
  route: string | null;
  material: string | null;
  question: string | null;
  version: string | null;
  device: string | null;
};
type Overview = {
  health: string;
  contentSnapshot: string;
  lastDeploy: string | null;
  pendingRequests: number;
  content: { staleSources: number; unavailableSources: string[] };
};
const label = (id: string) =>
  courses.find((c) => c.id === id)?.shortTitle ??
  concepts.find((c) => c.id === id)?.title ??
  assignments.find((a) => a.id === id)?.title ??
  lifeMaterials.find((m) => m.id === id)?.title ??
  id.replace(/[-_]/g, ' ');
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No saved sync yet';
const statuses = [
  { id: 'new', label: 'New' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'fixed', label: 'Fixed' },
  { id: 'wont_fix', label: 'Won’t fix' },
];
const canonicalStatus = (status: string) =>
  (
    ({
      reviewing: 'reviewed',
      planned: 'reviewed',
      done: 'fixed',
      declined: 'wont_fix',
    }) as Record<string, string>
  )[status] ?? status;
function Ranked({
  rows,
  metric = 'uses',
  title,
}: {
  rows: { id: string; count: number }[];
  metric?: string;
  title: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {rows.length ? (
        <ul className="admin-ranking">
          {rows.slice(0, 12).map((row) => (
            <li key={row.id}>
              <span>{label(row.id)}</span>
              <strong>
                {row.count} <small>{metric}</small>
              </strong>
              <span
                className="admin-bar"
                aria-hidden="true"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No observed use in this period.</p>
      )}
    </section>
  );
}
export default function Admin() {
  const state = useLearner();
  const [tab, setTab] = useState<'usage' | 'accounts' | 'feedback'>('usage');
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<ProductReport | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [inbox, setInbox] = useState<RequestRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('');
  const [activity, setActivity] = useState<Record<string, AccountActivity[]>>(
    {},
  );
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const [usage, health, people, requests] = await Promise.all([
        request(`/admin/report?days=${days}`),
        request('/admin/overview'),
        request('/admin/accounts'),
        request('/admin/requests'),
      ]);
      setReport(usage);
      setOverview(health);
      setAccounts(people.accounts);
      setInbox(requests.requests);
      setError('');
      setCopyStatus('');
    } catch (e) {
      setError((e as Error).message);
      setReport(null);
      setAccounts([]);
      setInbox([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (state.user?.role === 'admin') void load();
    else {
      setActivity({});
      setExpandedAccount(null);
      setReport(null);
      setAccounts([]);
      setInbox([]);
    }
    // Period changes request a fresh server aggregate; no production data is embedded in the build.
  }, [state.user?.role, days]);
  async function inspectAccount(id: string) {
    if (expandedAccount === id) {
      setExpandedAccount(null);
      return;
    }
    setExpandedAccount(id);
    setActivityLoading(true);
    try {
      const result = await request(`/admin/accounts/${id}/activity`);
      setActivity((previous) => ({ ...previous, [id]: result.activity }));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setActivityLoading(false);
    }
  }
  const json = report ? JSON.stringify(report, null, 2) : '';
  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus('JSON copied.');
    } catch {
      setCopyStatus('Clipboard unavailable. Select and copy the report below.');
    }
  }
  function download() {
    const objectUrl = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `atlas-product-${days}d.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
  if (!API || state.user?.role !== 'admin')
    return (
      <>
        <p className="eyebrow">PRIVATE ADMIN</p>
        <h1>Authorized access.</h1>
        <p>
          {API
            ? 'Sign in with your administrator account to view private server data.'
            : 'Online admin services are not connected for this release.'}
        </p>
        <a className="primary" href={url('account/')}>
          You & sign in →
        </a>
      </>
    );
  return (
    <div className="admin-product">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PRIVATE ADMIN</p>
          <h1>
            How atlas is used<span className="title-dot">.</span>
          </h1>
        </div>
        <button
          className="secondary"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div className="admin-controls">
        <div className="admin-tabs" role="tablist" aria-label="Admin areas">
          {(['usage', 'accounts', 'feedback'] as const).map((item) => (
            <button
              key={item}
              className="quiet"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
            >
              {item === 'usage'
                ? 'Product use'
                : item === 'accounts'
                  ? 'Accounts'
                  : 'Feedback'}
              {item === 'feedback' && overview?.pendingRequests ? (
                <span className="admin-count">{overview.pendingRequests}</span>
              ) : null}
            </button>
          ))}
        </div>
        {tab === 'usage' && (
          <label className="admin-period">
            Period
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Past 7 days</option>
              <option value={14}>Past 14 days</option>
              <option value={30}>Past 30 days</option>
            </select>
          </label>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {loading && !report && <p role="status">Loading private server data…</p>}
      {tab === 'usage' && report && (
        <>
          <p className="small muted">
            Opt-in use only. Events are kept for 30 days. Active time excludes
            hidden or unfocused tabs and pauses after 60 seconds without
            interaction.
          </p>
          <dl className="admin-summary">
            <div>
              <dt>Observed sessions</dt>
              <dd>{report.sessions.total}</dd>
            </div>
            <div>
              <dt>Consented visitors</dt>
              <dd>{report.users.consented_visitors}</dd>
            </div>
            <div>
              <dt>Sessions with a useful action</dt>
              <dd>{report.sessions.useful_sessions}</dd>
            </div>
            <div>
              <dt>Median active time</dt>
              <dd>
                {report.sessions.median_active_seconds_approx === null
                  ? '—'
                  : `≈ ${Math.round((report.sessions.median_active_seconds_approx / 60) * 10) / 10} min`}
              </dd>
            </div>
          </dl>
          {!report.sessions.total && (
            <div className="admin-empty">
              <h2>Ready to learn from use.</h2>
              <p>
                No consented product events have arrived in this period. This
                dashboard measures use after the analytics release; it does not
                reconstruct private schoolwork or old browsing history.
              </p>
            </div>
          )}
          <div className="admin-grid">
            <Ranked
              title="Courses"
              rows={report.courses.map((r) => ({ id: r.id, count: r.events }))}
              metric="events"
            />
            <Ranked
              title="Features"
              rows={report.features.map((r) => ({
                id: r.id,
                count: r.sessions,
              }))}
              metric="sessions"
            />
            <Ranked
              title="Assignments"
              rows={report.assignments.map((r) => ({
                id: r.id,
                count: r.opens,
              }))}
              metric="opens"
            />
            <Ranked title="Devices" rows={report.devices} metric="sessions" />
          </div>
          <section className="admin-panel">
            <h2>Routes & active time</h2>
            <p className="small muted">
              Time is approximate. A quick visit has under 15 seconds of
              observed active time; it can also be a recently started visit.
            </p>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Views</th>
                    <th>Active minutes</th>
                    <th>Quick visits</th>
                    <th>Reopened in session</th>
                  </tr>
                </thead>
                <tbody>
                  {report.routes.map((row) => (
                    <tr key={row.route}>
                      <td>
                        <a href={url(row.route)}>{row.route}</a>
                      </td>
                      <td>{row.views}</td>
                      <td>≈ {row.active_minutes_approx}</td>
                      <td>{row.quick_visits}</td>
                      <td>{row.return_sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.routes.length && (
              <p className="muted">No routes observed yet.</p>
            )}
          </section>
          <div className="admin-grid">
            <section className="admin-panel">
              <h2>Search & study</h2>
              <dl className="admin-facts">
                <div>
                  <dt>Searches / empty results</dt>
                  <dd>
                    {report.search.searches} / {report.search.empty_results}
                  </dd>
                </div>
                <div>
                  <dt>Walkthrough starts / completions</dt>
                  <dd>
                    {report.walkthroughs.starts} /{' '}
                    {report.walkthroughs.completions}
                  </dd>
                </div>
                <div>
                  <dt>Key idea opens</dt>
                  <dd>{report.key_ideas.opens}</dd>
                </div>
                <div>
                  <dt>Japanese review starts / completions</dt>
                  <dd>
                    {report.japanese_review.starts} /{' '}
                    {report.japanese_review.completions}
                  </dd>
                </div>
                <div>
                  <dt>New / returning observed visitors</dt>
                  <dd>
                    {report.users.first_observed_visitors} /{' '}
                    {report.users.returning_visitors}
                  </dd>
                </div>
                <div>
                  <dt>Client errors</dt>
                  <dd>{report.errors.total}</dd>
                </div>
              </dl>
              <p className="small muted">
                Search terms, typed answers and error messages are never
                collected.
              </p>
            </section>
            <section className="admin-panel">
              <h2>Navigation paths</h2>
              {report.navigation.length ? (
                <ol className="admin-paths">
                  {report.navigation.slice(0, 8).map((r) => (
                    <li key={r.from + r.to}>
                      <span>
                        {r.from} → {r.to}
                      </span>
                      <strong>{r.count}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">No cross-page paths observed yet.</p>
              )}
              <h3>Features used together</h3>
              {report.feature_combinations.slice(0, 5).map((r) => (
                <p className="small" key={r.first + r.second}>
                  {label(r.first)} + {label(r.second)} · {r.sessions} sessions
                </p>
              ))}
            </section>
          </div>
          <section className="admin-panel">
            <h2>Release comparison</h2>
            <p className="small muted">
              Compare adoption and exit rates with audience size in mind.
              Different releases may cover different dates and users.
            </p>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Sessions</th>
                    <th>Useful action</th>
                    <th>Quick exit, no action</th>
                    <th>Searches</th>
                    <th>Walkthroughs</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {report.release_comparison.releases.map((r) => (
                    <tr key={r.version}>
                      <th>{r.version}</th>
                      <td>{r.sessions}</td>
                      <td>
                        {r.sessions
                          ? Math.round((r.useful_sessions / r.sessions) * 100)
                          : 0}
                        %
                      </td>
                      <td>
                        {r.sessions
                          ? Math.round((r.quick_sessions / r.sessions) * 100)
                          : 0}
                        %
                      </td>
                      <td>{r.searches}</td>
                      <td>
                        {r.walkthrough_starts} / {r.walkthrough_completions}
                      </td>
                      <td>{r.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.release_comparison.releases.length && (
              <p className="muted">
                Release rows appear as consented events arrive.
              </p>
            )}
          </section>
          <details className="admin-panel">
            <summary>Daily activity, performance & event details</summary>
            <div className="admin-grid">
              <Ranked
                title="Session active time"
                rows={report.sessions.active_buckets}
                metric="sessions"
              />
              <section>
                <h3>Daily visitors</h3>
                {report.users.daily.map((r) => (
                  <p className="small" key={r.day}>
                    {r.day} · {r.visitors} visitors · {r.sessions} sessions
                  </p>
                ))}
              </section>
              <section>
                <h3>Page load buckets</h3>
                {report.performance.map((r) => (
                  <p className="small" key={r.route + r.bucket}>
                    {r.route} · {r.bucket.replace(/-/g, ' ')} · {r.count}
                  </p>
                ))}
              </section>
              <section>
                <h3>Errors</h3>
                {report.errors.codes.map((r) => (
                  <p key={r.id}>
                    {r.id}: {r.count}
                  </p>
                ))}
                <h3>Observed funnel events</h3>
                {Object.entries(report.sessions.observed_funnel).map(
                  ([id, count]) => (
                    <p className="small" key={id}>
                      {label(id)}: {count}
                    </p>
                  ),
                )}
              </section>
            </div>
          </details>
          <section className="admin-panel admin-export">
            <div className="section-heading">
              <div>
                <h2>Product report</h2>
                <p className="small muted">
                  Aggregate JSON for product analysis. Account records and
                  feedback messages are excluded.
                </p>
              </div>
              <div className="admin-export-actions">
                <button className="primary" onClick={() => void copy()}>
                  Copy JSON
                </button>
                <button className="secondary" onClick={download}>
                  Download JSON
                </button>
              </div>
            </div>
            <p className="small" role="status">
              {copyStatus}
            </p>
            <details>
              <summary>View copyable JSON</summary>
              <label>
                <span className="sr-only">Aggregate product report JSON</span>
                <textarea
                  readOnly
                  value={json}
                  rows={12}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            </details>
          </section>
          {overview && (
            <p className="small muted">
              API {overview.health} · Version {report.atlas_version} · Deploy{' '}
              {overview.lastDeploy?.slice(0, 12) || 'Not supplied'} · Source
              snapshot {overview.contentSnapshot}.{' '}
              {overview.content.staleSources} sources need a fresh check;{' '}
              {overview.content.unavailableSources.length} unavailable.
            </p>
          )}
        </>
      )}
      {tab === 'accounts' && (
        <section className="admin-panel">
          <h2>Account administration</h2>
          <p className="small muted">
            Private operational records. Registration collects usernames, not
            email addresses. Last activity reflects sign-in, saved work or
            consented use. Sync totals show server history; another device’s
            pending local queue cannot be seen here.
          </p>
          <label className="admin-account-search">
            Find an account
            <input
              type="search"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              placeholder="Username or account ID"
            />
          </label>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Created / last activity</th>
                  <th>Status</th>
                  <th>Sync</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {accounts
                  .filter((a) =>
                    `${a.username} ${a.id}`
                      .toLowerCase()
                      .includes(accountFilter.toLowerCase()),
                  )
                  .map((a) => (
                    <Fragment key={a.id}>
                      <tr>
                        <td>
                          <strong>{a.username}</strong>
                          <br />
                          <span className="admin-account-id">{a.id}</span>
                          <br />
                          <span className="small muted">
                            {a.role} · email not collected
                          </span>
                          <button
                            className="quiet small"
                            aria-expanded={expandedAccount === a.id}
                            onClick={() => void inspectAccount(a.id)}
                          >
                            {expandedAccount === a.id
                              ? 'Hide activity'
                              : 'Recent activity'}
                          </button>
                        </td>
                        <td>
                          {date(a.created_at)}
                          <br />
                          <span className="muted">{date(a.last_seen)}</span>
                        </td>
                        <td>
                          {a.authenticated_sessions
                            ? 'Signed-in session'
                            : 'No active session'}
                          <br />
                          <span className="small muted">
                            Analytics {a.analytics ? 'enabled' : 'off'}
                          </span>
                        </td>
                        <td>
                          {a.synced_events} saved events
                          <br />
                          <span className="small muted">
                            {date(a.last_sync)}
                          </span>
                        </td>
                        <td>
                          {a.product_sessions_30d} observed sessions / 30 days
                        </td>
                      </tr>
                      {expandedAccount === a.id && (
                        <tr className="admin-account-activity">
                          <td colSpan={5}>
                            <strong>
                              Latest activity · private account operation
                            </strong>
                            {activityLoading ? (
                              <p role="status">Loading metadata…</p>
                            ) : activity[a.id]?.length ? (
                              <ol>
                                {activity[a.id].map((event, index) => (
                                  <li key={`${event.at}-${index}`}>
                                    <span>
                                      {label(event.type)} · {date(event.at)}
                                    </span>
                                    <span className="small muted">
                                      {[
                                        event.course
                                          ? label(event.course)
                                          : undefined,
                                        event.material
                                          ? label(event.material)
                                          : undefined,
                                        event.question,
                                        event.feature,
                                        event.route,
                                        event.version
                                          ? `atlas ${event.version}`
                                          : undefined,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}{' '}
                                      ·{' '}
                                      {event.source === 'synced-work'
                                        ? 'Saved work metadata'
                                        : 'Consented use'}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="muted">
                                No saved or consented activity available.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            Showing at most 250 accounts, most recently active first. Recent
            activity is requested separately and excluded from product JSON.
          </p>
          {!accounts.length && <p>No accounts found.</p>}
        </section>
      )}
      {tab === 'feedback' && (
        <section className="admin-panel">
          <div className="section-heading">
            <h2>Feedback inbox</h2>
            <label>
              Status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted">
            Messages and optional reply contacts stay in this private inbox.
            Product reports include counts only.
          </p>
          {inbox
            .filter(
              (r) => filter === 'all' || canonicalStatus(r.status) === filter,
            )
            .map((r) => (
              <article key={r.id} className="inbox-entry">
                <p className="eyebrow">
                  {label(r.kind)} · {r.course ? label(r.course) : 'General'} ·{' '}
                  {date(r.created_at)}
                </p>
                <p className="admin-feedback-message">{r.message}</p>
                <p className="small muted">
                  {r.material ? `${label(r.material)} · ` : ''}
                  {r.question ? `${r.question} · ` : ''}
                  {r.route || 'Route not supplied'} ·{' '}
                  {r.version ? `atlas ${r.version}` : 'Earlier release'} ·{' '}
                  {r.device || 'Device not supplied'}
                </p>
                {r.contact && (
                  <p className="small">
                    Reply contact:{' '}
                    <a href={`mailto:${r.contact}`}>{r.contact}</a>
                  </p>
                )}
                <label>
                  Status
                  <select
                    value={canonicalStatus(r.status)}
                    onChange={(e) => {
                      void request(
                        `/admin/requests/${r.id}`,
                        { status: e.target.value },
                        'PATCH',
                      )
                        .then(load)
                        .catch((error: Error) => setError(error.message));
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          {!inbox.some(
            (r) => filter === 'all' || canonicalStatus(r.status) === filter,
          ) && <p className="muted">No feedback with this status.</p>}
        </section>
      )}
    </div>
  );
}
