import { useEffect, useState } from 'react';
import { assignments, findCourse, sources } from '../content/catalog';
import { assignmentUnits, unitTitle, unitUrl } from '../content/workspaces';
import { taskDone } from '../core/learning';
import {
  materialCheckpoints,
  materialProgress,
  checkpointComplete,
  resumeCheckpoint,
} from '../core/materials';
import { latestDifficulty } from '../core/companion';
import { emit, url, useLearner } from '../client/store';
import { Icon } from './Icons';
import Sheet from './Sheet';
import FocusQuestion from './FocusQuestion';
import FocusReading from './FocusReading';

export default function Assignment({ id }: { id: string }) {
  const a = assignments.find((a) => a.id === id)!,
    state = useLearner();
  const [source, setSource] = useState(false),
    [focused, setFocused] = useState<string | null>(null);
  const restricted = a.assistance === 'independent-only';
  const parts = materialCheckpoints(a),
    progress = materialProgress(a, state.events);
  const groups = [...new Set(parts.map((p) => p.section))];
  useEffect(() => {
    if (focused)
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: 'instant' }),
      );
  }, [focused]);
  useEffect(() => {
    if (!state.ready || restricted) return;
    const readRoute = () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      setFocused(
        parts.some((p) => p.id === hash)
          ? hash
          : new URLSearchParams(location.search).has('focus')
            ? (resumeCheckpoint(a, state.events) ?? null)
            : null,
      );
    };
    readRoute();
    window.addEventListener('popstate', readRoute);
    window.addEventListener('hashchange', readRoute);
    return () => {
      window.removeEventListener('popstate', readRoute);
      window.removeEventListener('hashchange', readRoute);
    };
  }, [state.ready, id, restricted]);
  function focus(checkpoint: string | null) {
    setFocused(checkpoint);
    history.pushState(
      null,
      '',
      url(`work/${id}/${checkpoint ? `?focus=1#${checkpoint}` : ''}`),
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('.focus-meta, .overview-heading')
        ?.focus({ preventScroll: true }),
    );
  }
  const index = parts.findIndex((p) => p.id === focused),
    part = parts[index];
  const question = a.companionQuestions?.find((q) => q.id === focused);
  const nav = {
    onPrevious: () => focus(parts[index - 1]?.id ?? null),
    onNext: () => focus(parts[index + 1]?.id ?? null),
    hasPrevious: index > 0,
    hasNext: index < parts.length - 1,
  };
  return (
    <div
      className={`v3-assignment ${focused ? 'is-focused' : ''}`}
      data-course={a.course}
      data-mode={focused ? 'focus' : 'overview'}
    >
      <div className="breadcrumbs">
        <a href={url(`courses/${a.course}/`)}>
          {findCourse(a.course).shortTitle}
        </a>
        <span>/</span>
        <a href={url(unitUrl(a.course, assignmentUnits[id]))}>
          {unitTitle(a.course, assignmentUnits[id])}
        </a>
      </div>
      <header className="material-heading">
        <div>
          <p className="eyebrow">
            {a.teacher} · {a.kind?.replaceAll('-', ' ')}
          </p>
          <h1>{id === 'kinematics-review' ? 'Kinematics Review' : a.title}</h1>
          <p className="material-source-line">
            {a.questionReferences?.join(' · ') ||
              (id === 'kinematics-review'
                ? 'Questions 1–27 · class sheet'
                : 'Use with your original class material')}
          </p>
        </div>
        <button className="quiet" onClick={() => setSource(true)}>
          Original & sources
          <Icon name="external" size={15} />
        </button>
      </header>
      <div className="assignment-mode-bar">
        <div role="group" aria-label="Assignment view">
          <button
            className="quiet"
            aria-pressed={!focused}
            onClick={() => focus(null)}
          >
            Overview
          </button>
          {!restricted && parts.length > 0 && (
            <button
              className="quiet"
              aria-pressed={Boolean(focused)}
              disabled={!state.ready}
              onClick={() =>
                focus(
                  focused ?? resumeCheckpoint(a, state.events) ?? parts[0].id,
                )
              }
            >
              Focus mode
            </button>
          )}
        </div>
        <span className="assignment-progress">
          {progress.completed} / {progress.total} parts
          <span className="mini-progress" aria-hidden="true">
            <span
              style={{
                width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
              }}
            />
          </span>
        </span>
      </div>
      {restricted ? (
        <div className="restricted-work">
          <p className="eyebrow">Independent hand-in</p>
          <h2>Use your original handout</h2>
          <p>{a.summary}</p>
          <p>Due: {a.due ?? 'not confirmed'}</p>
          <p>
            This formal assignment is completed independently, according to
            Cote’s instructions.
          </p>
        </div>
      ) : focused && part ? (
        <div className="focused-material">
          {question ? (
            <FocusQuestion
              key={`${id}-${question.id}`}
              assignment={a}
              question={question}
              {...nav}
            />
          ) : (
            <FocusReading
              key={`${id}-${part.id}`}
              assignment={a}
              index={Number(part.id.replace('reading-', ''))}
              {...nav}
            />
          )}
        </div>
      ) : (
        <div className="assignment-overview">
          <div className="overview-start">
            <div>
              <h2 className="overview-heading" tabIndex={-1}>
                Your assignment
              </h2>
              <p>{a.summary}</p>
              <p className="source-meta">
                Numbered companions follow the class work. Keep the original for
                exact wording, tables and diagrams.
              </p>
            </div>
            {parts.length > 0 && (
              <button
                className="primary"
                disabled={!state.ready}
                onClick={() =>
                  focus(resumeCheckpoint(a, state.events) ?? parts[0].id)
                }
              >
                Continue
                {a.companionQuestions?.length
                  ? ` · Question ${a.companionQuestions.find((q) => q.id === resumeCheckpoint(a, state.events))?.number ?? a.companionQuestions[0].number}`
                  : ''}
                <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
          {groups.map((group) => (
            <section className="overview-section" key={group}>
              <h2>
                {group}
                <small>{parts.filter((p) => p.section === group).length}</small>
              </h2>
              <div>
                {parts
                  .filter((p) => p.section === group)
                  .map((p) => {
                    const done = checkpointComplete(a, p.id, state.events),
                      rating = latestDifficulty(id, p.id, state.events);
                    return (
                      <a
                        key={p.id}
                        className="checkpoint-row"
                        href={url(`work/${id}/?focus=1#${p.id}`)}
                        onClick={(e) => {
                          e.preventDefault();
                          focus(p.id);
                        }}
                      >
                        <span
                          className={`checkpoint-index ${done ? 'part-done' : ''}`}
                        >
                          {done ? <Icon name="check" size={15} /> : p.label}
                        </span>
                        <span>
                          <strong>
                            {p.kind === 'question'
                              ? `Question ${p.label}`
                              : p.title}
                          </strong>
                          {p.kind === 'question' && <small>{p.title}</small>}
                        </span>
                        <span className="checkpoint-state">
                          {rating && (
                            <small>
                              {rating[0].toUpperCase() + rating.slice(1)}
                            </small>
                          )}
                          {done ? 'Done' : 'Open'}
                        </span>
                        <Icon name="arrow" size={16} />
                      </a>
                    );
                  })}
              </div>
            </section>
          ))}
          <details className="progress-checklist">
            <summary>Mark a section finished</summary>
            {a.tasks.map((t) => (
              <label className="task-progress" key={t.id}>
                <input
                  type="checkbox"
                  disabled={!state.ready}
                  checked={Boolean(taskDone(id, t.id, state.events))}
                  onChange={(e) =>
                    emit('assignment_task', {
                      assignment: id,
                      task: t.id,
                      done: e.target.checked,
                    })
                  }
                />
                {t.title}
              </label>
            ))}
            <p className="source-meta">
              Your original saved section checks are preserved.
            </p>
          </details>
        </div>
      )}
      <footer className="material-completion">
        <div>
          <strong>{progress.status}</strong>
          <p className="source-meta">
            {progress.suggested
              ? 'All parts are checked. You can mark the assignment complete.'
              : 'Completion records the work you finished.'}
          </p>
        </div>
        <button
          className={progress.done ? 'secondary' : 'primary'}
          disabled={!state.ready}
          onClick={() =>
            emit('material_completed', { assignment: id, done: !progress.done })
          }
        >
          {progress.done ? 'Mark incomplete' : 'Mark assignment complete'}
          {progress.done && <Icon name="check" size={16} />}
        </button>
      </footer>
      <Sheet
        open={source}
        title="Original & sources"
        onClose={() => setSource(false)}
      >
        <p>{a.originalAvailability}</p>
        {!restricted && (
          <p>
            atlas uses permitted original explanations beside the numbered
            teacher work. Exact source wording, diagrams and tables remain in
            your handout or textbook.
          </p>
        )}
        {a.originalUrl && (
          <a
            className="secondary"
            href={a.originalUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open original class resource
            <Icon name="external" size={16} />
          </a>
        )}
        {a.sources.map((id) => {
          const s = sources.find((s) => s.id === id)!;
          return (
            <p key={id}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              <small className="source-meta">
                {s.author} · checked {s.checked}
              </small>
            </p>
          );
        })}
        {!restricted && a.download && (
          <a className="secondary" href={url(a.download)} download>
            Download practice template
          </a>
        )}
        {!restricted && id === 'wadson-formal-lab' && (
          <a
            className="quiet"
            href={url('downloads/wadson-formal-lab-template.html')}
            download
          >
            Download editable lab template
          </a>
        )}
      </Sheet>
    </div>
  );
}
