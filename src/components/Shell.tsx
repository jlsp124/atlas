import { useEffect, useRef, useState } from 'react';
import { assignments, concepts, edges, findCourse } from '../content/catalog';
import {
  workspaceCourses,
  searchAtlas,
  assignmentTitle,
  topicTitle,
} from '../content/workspaces';
import type { Definition } from '../content/definitions';
import {
  emit,
  finishOnboarding,
  initialize,
  url,
  useLearner,
} from '../client/store';
import { Coordinates, CourseMark, Icon } from './Icons';
import {
  feedbackContext,
  openFeedback,
  type FeedbackContext,
  type FeedbackKind,
} from '../client/feedback';
import Feedback from './Feedback';
import Sheet from './Sheet';
export default function Shell({
  course,
  focus = false,
}: {
  course?: string;
  focus?: boolean;
}) {
  const state = useLearner();
  const [step, setStep] = useState(0),
    [picked, setPicked] = useState<string[]>(workspaceCourses.map((c) => c.id));
  const [onboarding, setOnboarding] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState('');
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [feedback, setFeedback] = useState<{
    context: FeedbackContext;
    kind?: FeedbackKind;
  } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const onboardingRef = useRef<HTMLDialogElement>(null),
    searchRef = useRef<HTMLDialogElement>(null),
    inspectorRef = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null),
    searchTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    initialize();
    const replay = () => {
      setStep(0);
      setOnboarding(true);
    };
    const define = (e: Event) => {
      const d = (
        e as CustomEvent<{ definition: Definition; trigger: HTMLElement }>
      ).detail;
      trigger.current = d.trigger;
      setDefinition(d.definition);
    };
    window.addEventListener('atlas:onboarding', replay);
    window.addEventListener('atlas:definition', define);
    const requestedSearch = () => {
      setQuery('');
      setSearch(true);
    };
    window.addEventListener('atlas:search', requestedSearch);
    const requestedFeedback = (event: Event) => {
      setFeedback({
        context: feedbackContext(),
        kind: (event as CustomEvent<{ kind?: FeedbackKind }>).detail?.kind,
      });
      setFeedbackOpen(true);
    };
    window.addEventListener('atlas:feedback', requestedFeedback);
    return () => {
      window.removeEventListener('atlas:onboarding', replay);
      window.removeEventListener('atlas:definition', define);
      window.removeEventListener('atlas:search', requestedSearch);
      window.removeEventListener('atlas:feedback', requestedFeedback);
    };
  }, []);
  useEffect(() => {
    if (
      state.ready &&
      !state.onboarding &&
      window.location.pathname === url()
    ) {
      setPicked(state.selected);
      setOnboarding(true);
    }
  }, [state.ready, state.onboarding, state.selected]);
  useEffect(() => {
    if (onboarding && !onboardingRef.current?.open)
      onboardingRef.current?.showModal();
    else if (!onboarding) onboardingRef.current?.close();
  }, [onboarding]);
  useEffect(() => {
    if (search && !searchRef.current?.open) {
      searchRef.current?.showModal();
      searchRef.current?.querySelector('input')?.focus();
    } else if (!search) {
      searchRef.current?.close();
      searchTrigger.current?.focus();
    }
  }, [search]);
  useEffect(() => {
    const dialog = inspectorRef.current;
    const show = () => {
      dialog?.close();
      if (definition) {
        if (
          matchMedia('(max-width: 800px)').matches ||
          document.querySelector('dialog:modal')
        )
          dialog?.showModal();
        else dialog?.show();
        document.documentElement.dataset.inspector = 'open';
      } else delete document.documentElement.dataset.inspector;
    };
    show();
    window.addEventListener('resize', show);
    return () => {
      window.removeEventListener('resize', show);
      delete document.documentElement.dataset.inspector;
    };
  }, [definition]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchTrigger.current = document.activeElement as HTMLElement;
        setSearch((s) => !s);
      }
      if (e.key === 'Escape' && definition) {
        setDefinition(null);
        trigger.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [definition]);
  function finish(account = false) {
    emit('courses_selected', { courses: picked });
    finishOnboarding();
    window.location.href = url(account ? 'account/?create=1' : 'courses/');
  }
  function openSearch(el: HTMLElement) {
    searchTrigger.current = el;
    setQuery('');
    setSearch(true);
  }
  const results = searchAtlas(query, state.selected);
  const related = definition
    ? edges
        .filter(
          (e) =>
            (e.from === definition.concept || e.to === definition.concept) &&
            e.type !== 'requires',
        )
        .map((e) => (e.from === definition.concept ? e.to : e.from))
    : [];
  const used = definition
    ? assignments.filter(
        (a) =>
          a.concepts.includes(definition.concept) ||
          a.prerequisites.includes(definition.concept),
      )
    : [];
  return (
    <>
      <header
        className={`topbar ${focus ? 'focus-shell' : ''}`}
        data-ready={state.ready ? 'true' : 'false'}
      >
        <div className="atlas-identity">
          <a className="wordmark" href={url()} aria-label="atlas home">
            atlas<span>.</span>
          </a>
          <span className="beta-label">BETA</span>
        </div>
        <nav className="sidebar" aria-label="Main navigation">
          <a className={course ? 'nav-item' : 'nav-item home-nav'} href={url()}>
            <Icon name="home" />
            Home
          </a>
          <div className="sidebar-label">
            <span>Courses</span>
            <a href={url('courses/')} aria-label="Manage courses">
              +
            </a>
          </div>
          <div className="sidebar-courses">
            {workspaceCourses
              .filter((c) => state.selected.includes(c.id))
              .map((c) => (
                <a
                  key={c.id}
                  className={`nav-item ${course === c.id ? 'selected' : ''}`}
                  data-course={c.id}
                  href={url(`courses/${c.id}/`)}
                  aria-current={course === c.id ? 'page' : undefined}
                >
                  <CourseMark course={c.id} small />
                  <span>{c.shortTitle}</span>
                </a>
              ))}
          </div>
          <div className="sidebar-divider" />
          <a className="nav-item" href={url('calendar/')}>
            <Icon name="calendar" />
            Calendar
          </a>
          <button
            className="nav-item search-button"
            onClick={(e) => openSearch(e.currentTarget)}
          >
            <Icon name="search" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="sidebar-bottom">
            <a className="nav-item" href={url('account/')}>
              <span className="avatar">
                {state.user ? (
                  state.user.username.slice(0, 1).toUpperCase()
                ) : (
                  <Icon name="user" size={16} />
                )}
              </span>
              <span>{state.user?.username ?? 'Your setup'}</span>
              <Icon name="more" />
            </a>
            <div className="sidebar-links">
              <a href={url('help/')}>Help</a>
              <a href={url('about/')}>About</a>
            </div>
          </div>
        </nav>
      </header>
      <button
        className="feedback-launcher"
        aria-label="Help and feedback"
        title="Help and feedback"
        disabled={!state.ready}
        onClick={() => openFeedback()}
      >
        <Icon name="help" size={19} />
      </button>
      <Sheet
        open={feedbackOpen}
        title="Help / Feedback"
        onClose={() => setFeedbackOpen(false)}
      >
        {feedback && (
          <Feedback
            key={`${state.user?.id ?? 'guest'}:${feedback.context.page}:${feedback.kind ?? 'bug'}`}
            context={feedback.context}
            initialKind={feedback.kind}
          />
        )}
      </Sheet>
      {!focus && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <a href={url('courses/')}>
            <Icon name="book" />
            <span>Courses</span>
          </a>
          <a href={url('calendar/')}>
            <Icon name="calendar" />
            <span>Calendar</span>
          </a>
          <button onClick={(e) => openSearch(e.currentTarget)}>
            <Icon name="search" />
            <span>Search</span>
          </button>
          <a href={url('account/')}>
            <Icon name="user" />
            <span>You</span>
          </a>
        </nav>
      )}
      {state.storageError && (
        <div className="storage-notice" role="status">
          Your browser couldn’t save this change. Export a backup in{' '}
          <a href={url('account/')}>settings</a>.
        </div>
      )}
      <dialog
        ref={onboardingRef}
        className="onboarding"
        aria-label="Welcome to atlas"
        onCancel={(e) => e.preventDefault()}
      >
        <div className="onboarding-content" key={step}>
          {step === 0 ? (
            <>
              <Coordinates />
              <div className="display-wordmark">
                atlas<span>.</span>
              </div>
              <h1>
                Everything from class,
                <br />
                without digging for it.
              </h1>
              <p>
                I built atlas to keep our notes, assignments, dates and study
                stuff in one place.
              </p>
              <button className="primary" onClick={() => setStep(1)}>
                Get started
                <Icon name="arrow" />
              </button>
              <button
                className="quiet"
                onClick={() => {
                  finishOnboarding();
                  setOnboarding(false);
                }}
              >
                Look around without an account
              </button>
              <small>Designed & built by Jovan</small>
            </>
          ) : step === 1 ? (
            <>
              <button
                className="icon-button onboarding-back"
                aria-label="Back"
                onClick={() => setStep(0)}
              >
                <Icon name="back" />
              </button>
              <p className="meta">1 of 2</p>
              <h1>What are you taking?</h1>
              <p>Make a little room for your classes.</p>
              <div className="course-picks">
                {workspaceCourses.map((c) => (
                  <label
                    className={`course-pick ${picked.includes(c.id) ? 'picked' : ''}`}
                    key={c.id}
                  >
                    <CourseMark course={c.id} />
                    <span>{c.title}</span>
                    <input
                      type="checkbox"
                      checked={picked.includes(c.id)}
                      onChange={(e) =>
                        setPicked((p) =>
                          e.target.checked
                            ? [...p, c.id]
                            : p.filter((x) => x !== c.id),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                className="primary"
                disabled={!picked.length}
                onClick={() => setStep(2)}
              >
                Continue
                <Icon name="arrow" />
              </button>
            </>
          ) : (
            <>
              <button
                className="icon-button onboarding-back"
                aria-label="Back"
                onClick={() => setStep(1)}
              >
                <Icon name="back" />
              </button>
              <Coordinates />
              <p className="meta">2 of 2</p>
              <h1>Save your setup</h1>
              <p>
                Your classes and progress stay synced on your other devices.
              </p>
              <button className="primary" onClick={() => finish(true)}>
                Create an account
                <Icon name="arrow" />
              </button>
              <button className="quiet" onClick={() => finish()}>
                Keep it on this device
              </button>
            </>
          )}
        </div>
      </dialog>
      <dialog
        ref={searchRef}
        className="search-dialog"
        aria-label="Search atlas"
        onCancel={(e) => {
          e.preventDefault();
          setSearch(false);
        }}
      >
        <div className="search-input-row">
          <Icon name="search" />
          <label className="sr-only" htmlFor="atlas-search">
            Search atlas
          </label>
          <input
            id="atlas-search"
            autoComplete="off"
            placeholder="Topics, classwork, anything…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                searchRef.current
                  ?.querySelector<HTMLAnchorElement>('.search-result')
                  ?.focus();
              }
            }}
          />
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => setSearch(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results">
          {query.trim() ? (
            results.length ? (
              (['Learn', 'Classwork', 'Other'] as const).map((group) => {
                const rows = results.filter((r) => r.group === group);
                return rows.length ? (
                  <section key={group}>
                    <h2>{group}</h2>
                    {rows.map((r, i) => (
                      <a
                        className="search-result"
                        key={r.path + i}
                        href={
                          r.path.startsWith('https:') ? r.path : url(r.path)
                        }
                      >
                        {r.course ? (
                          <CourseMark course={r.course} small />
                        ) : (
                          <Icon name="calendar" />
                        )}
                        <span>
                          <strong
                            lang={r.course === 'japanese' ? 'ja' : undefined}
                          >
                            {r.title}
                          </strong>
                          <small>{r.detail}</small>
                        </span>
                        <Icon name="arrow" size={16} />
                      </a>
                    ))}
                  </section>
                ) : null;
              })
            ) : (
              <p className="empty-state">
                Nothing here yet. Try a topic or a different word.
              </p>
            )
          ) : (
            <div className="search-suggestions">
              <p>Find the thing you’re looking for.</p>
              {['half life', 'velocity', 'すみません'].map((q) => (
                <button
                  className="secondary"
                  key={q}
                  onClick={() => setQuery(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="search-footer">
          <span>Topics · Classwork · Dates</span>
          <span>Esc to close</span>
        </div>
      </dialog>
      <dialog
        ref={inspectorRef}
        className="definition-inspector"
        aria-label={
          definition ? `Definition: ${definition.term}` : 'Definition'
        }
        onCancel={(e) => {
          e.preventDefault();
          setDefinition(null);
          trigger.current?.focus();
        }}
      >
        {definition && (
          <div className="inspector-content">
            <div className="sheet-heading">
              <span className="meta">A little context</span>
              <button
                className="icon-button"
                aria-label="Close definition"
                onClick={() => {
                  setDefinition(null);
                  trigger.current?.focus();
                }}
              >
                <Icon name="close" />
              </button>
            </div>
            <h2
              lang={
                /[\u3040-\u30ff\u4e00-\u9fff]/.test(definition.term)
                  ? 'ja'
                  : undefined
              }
            >
              {definition.term}
            </h2>
            <p>{definition.definition}</p>
            <a className="primary" href={url(`learn/${definition.concept}/`)}>
              Learn this
              <Icon name="arrow" />
            </a>
            {used.length > 0 && (
              <section>
                <h3>Used in</h3>
                {used.map((a) => (
                  <a
                    className="inspector-link"
                    href={url(`work/${a.id}/`)}
                    key={a.id}
                  >
                    {assignmentTitle(a.id)}
                  </a>
                ))}
              </section>
            )}
            {related.length > 0 && (
              <section>
                <h3>Related</h3>
                {[...new Set(related)]
                  .filter((id) => concepts.some((c) => c.id === id))
                  .slice(0, 3)
                  .map((id) => (
                    <a
                      className="inspector-link"
                      href={url(`learn/${id}/`)}
                      key={id}
                    >
                      {topicTitle(id)}
                    </a>
                  ))}
              </section>
            )}
            <small>
              {
                findCourse(
                  concepts.find((c) => c.id === definition.concept)!.course,
                ).shortTitle
              }
            </small>
          </div>
        )}
      </dialog>
    </>
  );
}
