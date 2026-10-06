import { useEffect, useRef, useState } from 'react';
import GuidedTour, { startTour, stopTour } from './GuidedTour';
import {
  courses,
  editions,
  snapshot,
  concepts,
  assignments,
} from '../content/catalog';
import {
  emit,
  finishOnboarding,
  initialize,
  replayOnboarding,
  track,
  url,
  useLearner,
} from '../client/store';

export default function Shell({ course }: { course?: string }) {
  const state = useLearner();
  const pendingCount = state.events.filter(
    (e) => !state.synced.includes(e.id),
  ).length;
  const [search, setSearch] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>(courses.map((c) => c.id));
  const dialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    initialize();
    const replay = () => {
      setStep(0);
      setOnboarding(true);
    };
    window.addEventListener('atlas:onboarding', replay);
    return () => window.removeEventListener('atlas:onboarding', replay);
  }, []);
  useEffect(() => {
    if (state.ready && !state.onboarding && window.location.pathname === url())
      setOnboarding(true);
  }, [state.ready, state.onboarding]);
  useEffect(() => {
    if (onboarding && !dialog.current?.open) dialog.current?.showModal();
    else if (!onboarding) dialog.current?.close();
  }, [onboarding]);
  useEffect(() => {
    if (search && !searchDialog.current?.open) {
      searchDialog.current?.showModal();
      searchDialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    } else if (!search) searchDialog.current?.close();
  }, [search]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && search) {
        e.preventDefault();
        setSearch(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [search]);
  function complete() {
    emit('courses_selected', { courses: picked });
    finishOnboarding();
    setOnboarding(false);
    startTour();
  }
  function skip() {
    finishOnboarding();
    stopTour();
    setOnboarding(false);
  }
  return (
    <>
      <header className="topbar" data-ready={state.ready ? 'true' : 'false'}>
        <a className="wordmark" href={url()} aria-label="atlas home">
          atlas
          <span className="wordmark-dot" aria-hidden="true">
            .
          </span>
        </a>
        <div className="course-switch">
          <label className="sr-only" htmlFor="course-selector">
            Course selector
          </label>
          <select
            id="course-selector"
            value={course || ''}
            onChange={(e) => {
              window.location.href = e.target.value
                ? url(`courses/${e.target.value}/`)
                : url();
            }}
          >
            <option value="">My atlas</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <button
          className="search-trigger"
          aria-label="Search anything"
          onClick={() => setSearch(true)}
        >
          <span aria-hidden="true">⌕</span> <span>Search anything</span>
          <kbd>⌘ / Ctrl K</kbd>
        </button>
        <a
          className="profile-button"
          href={url('account/')}
          aria-label="Profile and settings"
        >
          {state.user ? (
            state.user.username.slice(0, 1).toUpperCase()
          ) : (
            <span aria-hidden="true">☰</span>
          )}
        </a>
      </header>
      <div className="statusbar">
        <span>
          {snapshot.term}{' '}
          <span className="muted">/ course snapshot {snapshot.date}</span>
        </span>
        <details className="sync-status">
          <summary>
            <span
              className={`status-dot ${state.connection === 'online' ? 'on' : ''}`}
              aria-hidden="true"
            />
            {state.connection === 'offline'
              ? 'Sync offline'
              : state.connection === 'sign-in'
                ? 'Sign in to sync'
                : state.user
                  ? pendingCount
                    ? 'Sync pending'
                    : 'Progress synced'
                  : 'On this device'}
          </summary>
          <div>
            {state.connection === 'offline'
              ? 'atlas’s online services can’t be reached right now. Lessons, assignments, practice and local progress still work. We’ll sync automatically when service returns.'
              : state.user
                ? 'Your learning events sync when the service can be reached.'
                : 'Guest progress stays on this device. An account is optional.'}
            {state.lastSync && (
              <p>
                Last successful sync:{' '}
                {new Date(state.lastSync).toLocaleString()}
              </p>
            )}
            {state.user && (
              <p>
                {
                  state.events.filter((e) => !state.synced.includes(e.id))
                    .length
                }{' '}
                events queued.
              </p>
            )}
          </div>
        </details>
      </div>
      {state.storageError && (
        <p role="alert" className="storage-alert">
          Your browser could not save progress. Keep this tab open and export
          progress in settings.
        </p>
      )}
      <dialog
        ref={dialog}
        className="onboarding sheet"
        aria-labelledby="onboard-title"
        onCancel={skip}
      >
        <div className="dialog-top">
          <span className="wordmark">atlas.</span>
          <button className="quiet" onClick={skip}>
            Skip
          </button>
        </div>
        {step === 0 ? (
          <>
            <p className="eyebrow">A little more connected</p>
            <h2 id="onboard-title">
              Your courses.
              <br />
              In one place.
            </h2>
            <p>
              atlas is a student-built companion for the courses I’m taking.
              Notes, assignments, schedules, practice and the connections
              between everything.
            </p>
            <button className="primary" onClick={() => setStep(1)}>
              Get started <span aria-hidden="true">→</span>
            </button>
          </>
        ) : step === 1 ? (
          <>
            <h2 id="onboard-title">What are you taking?</h2>
            <p>Choose the courses to keep on your home screen.</p>
            <div className="course-picks">
              {courses.map((c) => {
                const e = editions.find((e) => e.course === c.id)!;
                return (
                  <label key={c.id} className="course-pick">
                    <input
                      type="checkbox"
                      checked={picked.includes(c.id)}
                      onChange={(event) =>
                        setPicked((p) =>
                          event.target.checked
                            ? [...p, c.id]
                            : p.filter((x) => x !== c.id),
                        )
                      }
                    />
                    <span>
                      <strong>{c.title}</strong>
                      <small>
                        P{e.period} · {e.teacher} · {e.term}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              className="primary"
              onClick={() => {
                void complete();
              }}
            >
              Add to my atlas
            </button>
          </>
        ) : null}
      </dialog>
      <dialog
        ref={searchDialog}
        className="search-dialog sheet"
        aria-labelledby="search-title"
        onCancel={() => setSearch(false)}
      >
        <div className="dialog-top">
          <h2 id="search-title">Find your next connection</h2>
          <button
            className="quiet"
            onClick={() => setSearch(false)}
            aria-label="Close search"
          >
            ×
          </button>
        </div>
        <Search />
      </dialog>
      <GuidedTour />
    </>
  );
}

type SearchResult = {
  title: string;
  url: string;
  type: string;
  detail: string;
};
function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      const needle = query.normalize('NFKC').toLowerCase();
      const fallback: SearchResult[] = [
        ...concepts
          .filter((c) =>
            [c.title, c.model, c.representation, c.trap, ...c.aliases]
              .join(' ')
              .normalize('NFKC')
              .toLowerCase()
              .includes(needle),
          )
          .map((c) => ({
            title: c.title,
            url: url(`concepts/${c.id}/`),
            type: c.course,
            detail: c.model,
          })),
        ...courses
          .filter((c) => c.title.toLowerCase().includes(needle))
          .map((c) => ({
            title: c.title,
            url: url(`courses/${c.id}/`),
            type: 'course',
            detail: c.description,
          })),
        ...assignments
          .filter((a) =>
            (a.title + ' ' + a.summary).toLowerCase().includes(needle),
          )
          .map((a) => ({
            title: a.title,
            url: url(`work/${a.id}/`),
            type: 'work',
            detail: a.summary,
          })),
      ];
      let found = fallback;
      try {
        const path = url('pagefind/pagefind.js');
        const pf = await import(/* @vite-ignore */ path);
        await pf.options({ baseUrl: url() });
        const data = await pf.search(query);
        const docs = await Promise.all(
          data.results.slice(0, 8).map(
            (r: {
              data: () => Promise<{
                meta: { title: string };
                url: string;
                excerpt: string;
              }>;
            }) => r.data(),
          ),
        );
        if (docs.length)
          found = docs.map((d) => ({
            title: d.meta.title,
            url: d.url,
            type: 'Search',
            detail: d.excerpt.replace(/<[^>]*>/g, ''),
          }));
      } catch {
        /* Static fallback search remains available in development/offline. */
      }
      if (active) {
        setResults(found.slice(0, 10));
        setBusy(false);
        track('search_performed');
        if (!found.length) track('search_zero_results');
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  return (
    <>
      <label className="sr-only" htmlFor="global-search">
        Search concepts, formulas, assignments or Japanese
      </label>
      <input
        id="global-search"
        className="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try acceleration, VSEPR or すみません"
        autoComplete="off"
      />
      <p className="muted small" aria-live="polite">
        {busy
          ? 'Searching…'
          : query
            ? `${results.length} results`
            : 'Concepts, equations, assignments, kana and rōmaji.'}
      </p>
      <ul className="search-results">
        {results.map((r) => (
          <li key={r.url}>
            <a href={r.url}>
              <small className="eyebrow">{r.type}</small>
              <strong>{r.title}</strong>
              <span>{r.detail}</span>
            </a>
          </li>
        ))}
      </ul>
      {query && !busy && !results.length && (
        <p>
          No match yet. Try another term or{' '}
          <a href={url('help/')}>request missing material</a>.
        </p>
      )}
      <div className="button-row">
        <a
          href={url('account/')}
          onClick={() => {
            replayOnboarding();
          }}
        >
          Replay introduction
        </a>
        <a href={url('help/')}>Need something?</a>
      </div>
    </>
  );
}
