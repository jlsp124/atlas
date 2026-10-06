import { useEffect, useState } from 'react';
import { concepts } from '../content/catalog';
import { API, request, url, useLearner } from '../client/store';
type Overview = {
  health: string;
  contentSnapshot: string;
  lastDeploy: string | null;
  accounts: number;
  newAccounts: number;
  active: { today: number; week: number; month: number };
  sessions: number;
  pendingRequests: number;
  learning: {
    concept: string;
    attempts: number;
    incorrect: number;
    hints: number;
  }[];
  confusion: { concept: string; count: number }[];
  product: { type: string; actor: string; count: number }[];
  retention: { sevenDayEligible: number; returned: number; note: string };
  content: {
    concepts: number;
    missingPractice: number;
    missingTransfer: number;
    staleSources: number;
    unavailableSources: string[];
    note: string;
  };
};
type RequestRow = {
  id: string;
  kind: string;
  course: string | null;
  message: string;
  contact: string | null;
  status: string;
  created_at: string;
};
export default function Admin() {
  const state = useLearner();
  const [data, setData] = useState<Overview | null>(null);
  const [inbox, setInbox] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  async function load() {
    try {
      const [overview, requests] = await Promise.all([
        request('/admin/overview'),
        request('/admin/requests'),
      ]);
      setData(overview);
      setInbox(requests.requests);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    }
  }
  useEffect(() => {
    if (state.user?.role === 'admin') void load();
    else {
      setData(null);
      setInbox([]);
    }
  }, [state.user?.role]);
  if (!API || state.user?.role !== 'admin')
    return (
      <>
        <p className="eyebrow">ADMIN</p>
        <h1>Authorized access.</h1>
        <p>
          Real admin data requires a server-authorized administrator session.{' '}
          {API
            ? 'Sign in with your administrator account.'
            : 'Online admin services are not connected for this release.'}
        </p>
        <a className="primary" href={url('account/')}>
          Profile & sign in →
        </a>
      </>
    );
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">ADMIN · AGGREGATE VIEW</p>
          <h1>
            How atlas is doing<span className="title-dot">.</span>
          </h1>
        </div>
        <button
          className="secondary"
          onClick={() => {
            void load();
          }}
        >
          Refresh
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          <section>
            <h2>Overview</h2>
            <dl className="admin-stats">
              {Object.entries({
                Accounts: data.accounts,
                'New today': data.newAccounts,
                'Active today': data.active.today,
                'Active 7 days': data.active.week,
                'Active 30 days': data.active.month,
                'Current sessions': data.sessions,
                'Pending requests': data.pendingRequests,
              }).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="small muted">
              Service: {data.health} · Content snapshot: {data.contentSnapshot}{' '}
              · Deploy: {data.lastDeploy || 'Not supplied by operator'}
            </p>
          </section>
          <div className="admin-columns">
            <section>
              <h2>Learning</h2>
              <p className="small muted">
                Only opted-in aggregate learning events; no individual answers
                or private profiles.
              </p>
              {data.learning.length ? (
                <ul className="admin-list">
                  {data.learning.map((r) => (
                    <li key={r.concept}>
                      <strong>
                        {concepts.find((c) => c.id === r.concept)?.title ||
                          r.concept}
                      </strong>
                      <span>
                        {r.incorrect} misses / {r.attempts} attempts · {r.hints}{' '}
                        hints
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No consented learning events yet.</p>
              )}
              <h3>Confusion markers</h3>
              {data.confusion.map((r) => (
                <p key={r.concept}>
                  {concepts.find((c) => c.id === r.concept)?.title}: {r.count}
                </p>
              ))}
            </section>
            <section>
              <h2>Product use</h2>
              <ul className="admin-list">
                {data.product.map((r) => (
                  <li key={r.type + r.actor}>
                    <strong>{r.type.replace(/_/g, ' ')}</strong>
                    <span>
                      {r.count} · {r.actor}
                    </span>
                  </li>
                ))}
              </ul>
              {!data.product.length && <p>No consented usage events yet.</p>}
              <h3>Seven-day return</h3>
              <p>
                {data.retention.returned} / {data.retention.sevenDayEligible}{' '}
                eligible accounts.
              </p>
              <p className="small muted">{data.retention.note}</p>
            </section>
          </div>
          <section className="settings-section">
            <h2>Content health</h2>
            <p>
              {data.content.concepts} concepts · {data.content.missingPractice}{' '}
              missing practice · {data.content.missingTransfer} missing transfer
              checks · {data.content.staleSources} stale sources.
            </p>
            <p>{data.content.note}</p>
            <p>
              Unavailable sources:{' '}
              {data.content.unavailableSources.join(', ') || 'None'}.
            </p>
          </section>
        </>
      ) : (
        <p>Loading authorized server data…</p>
      )}
      <section className="settings-section">
        <h2>Requests</h2>
        {inbox.map((r) => (
          <article key={r.id} className="inbox-entry">
            <p className="eyebrow">
              {r.kind} · {r.course || 'General'} ·{' '}
              {new Date(r.created_at).toLocaleDateString()}
            </p>
            <p>{r.message}</p>
            {r.contact && (
              <p className="small">Reply contact supplied: {r.contact}</p>
            )}
            <label>
              Status
              <select
                value={r.status}
                onChange={(e) => {
                  void request(
                    `/admin/requests/${r.id}`,
                    { status: e.target.value },
                    'PATCH',
                  )
                    .then(load)
                    .catch((e) => setError(e.message));
                }}
              >
                {['new', 'reviewing', 'planned', 'done', 'declined'].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
          </article>
        ))}
        {!inbox.length && <p>No requests in the inbox.</p>}
      </section>
    </>
  );
}
