import { useEffect, useState } from 'react';
import {
  assignments,
  findCourse,
  findEdition,
  questions,
  schedule,
} from '../content/catalog';
import {
  assignmentTitle,
  assignmentUnits,
  eventPath,
  eventTitle,
  teacherUnitResources,
  topicTitle,
  unitDescriptions,
  unitLabel,
  unitTitle,
  unitTopics,
  unitUrl,
} from '../content/workspaces';
import { displayDate } from '../core/dates';
import { evidence } from '../core/learning';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import Coverage from './Coverage';
import Sheet from './Sheet';
export default function Unit({
  course,
  unit,
}: {
  course: string;
  unit: string;
}) {
  const state = useLearner(),
    c = findCourse(course),
    edition = findEdition(course),
    topics = unitTopics(course, unit);
  const defaultView =
    course === 'japanese' && topics.length ? 'learn' : 'classwork';
  const [view, setView] = useState(defaultView),
    [resources, setResources] = useState(false);
  useEffect(() => {
    setView(new URLSearchParams(location.search).get('view') ?? defaultView);
  }, []);
  const work = assignments.filter(
    (a) => a.course === course && assignmentUnits[a.id] === unit,
  );
  const sets = [...new Set(work.map((a) => a.materialSet ?? a.id))];
  const dated = schedule.find(
    (e) =>
      e.course === course &&
      (e.type === 'test' || e.type === 'quiz') &&
      e.concepts.some((id) => topics.some((c) => c.id === id)),
  );
  const next =
    topics.find(
      (c) => evidence(c.id, state.events, questions).state !== 'stable',
    ) ?? topics[0];
  function change(value: string) {
    setView(value);
    history.replaceState(null, '', url(unitUrl(course, unit, value)));
  }
  return (
    <div className="unit-screen" data-course={course}>
      <div className="breadcrumbs">
        <a href={url(`courses/${course}/`)}>
          <Icon name="back" size={16} />
          {c.shortTitle}
        </a>
        <span>/</span>
        <span>{unitLabel(course, unit) || 'Your units'}</span>
      </div>
      <div className="unit-header">
        <div>
          <h1>{unitTitle(course, unit)}</h1>
          <p>{unitDescriptions[unit]}</p>
        </div>
        {dated && (
          <a className="unit-assessment" href={url(eventPath(dated))}>
            <Icon name="calendar" size={16} />
            {eventTitle(dated)} ·{' '}
            {dated.start ? displayDate(dated.start) : 'Date to confirm'}
          </a>
        )}
      </div>
      <div className="unit-tabs">
        <button aria-pressed={view === 'learn'} onClick={() => change('learn')}>
          Learn
        </button>
        <button
          aria-pressed={view === 'classwork'}
          onClick={() => change('classwork')}
        >
          Classwork
        </button>
        <div className="unit-toolbar">
          <a
            className="quiet course-dates"
            href={url(`calendar/?course=${course}`)}
          >
            Dates
          </a>
          <button className="secondary" onClick={() => setResources(true)}>
            Resources
            <Icon name="external" size={14} />
          </button>
        </div>
      </div>
      {view === 'learn' ? (
        topics.length ? (
          <div className="learn-overview">
            <ol className="unit-path">
              {topics.map((t, i) => {
                const checked =
                  evidence(t.id, state.events, questions).state === 'stable';
                return (
                  <li key={t.id}>
                    <a
                      className={`path-topic ${checked ? 'checked' : ''}`}
                      href={url(`learn/${t.id}/`)}
                    >
                      <span className="path-point">
                        {checked ? <Icon name="check" size={14} /> : i + 1}
                      </span>
                      <span lang={course === 'japanese' ? 'ja' : undefined}>
                        {topicTitle(t.id)}
                      </span>
                      <Icon name="arrow" size={17} />
                    </a>
                  </li>
                );
              })}
            </ol>
            <aside className="learning-actions">
              <p>One idea at a time. Start here, or pick the part you need.</p>
              <a className="primary" href={url(`learn/${next.id}/`)}>
                {state.events.some(
                  (e) =>
                    e.type === 'lesson_viewed' &&
                    topics.some((c) => c.id === e.payload.concept),
                )
                  ? 'Continue learning'
                  : 'Start here'}
                <Icon name="arrow" size={16} />
              </a>
              <a
                className="secondary"
                href={url(`courses/${course}/practice/?unit=${unit}&review=1`)}
              >
                Review unit
              </a>
              <Coverage course={course} unit={unit} />
            </aside>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              I haven’t added these lessons yet. The class resources are here in
              the meantime.
            </p>
            <button className="secondary" onClick={() => setResources(true)}>
              Open teacher resources
              <Icon name="external" size={16} />
            </button>
          </div>
        )
      ) : (
        <div className="classwork-layout">
          {sets.map((set) => (
            <section className="material-set" key={set}>
              <h2>
                {set.replaceAll('-', ' ').replace(/^./, (s) => s.toUpperCase())}
              </h2>
              {work
                .filter((a) => (a.materialSet ?? a.id) === set)
                .map((a) => (
                  <div key={a.id}>
                    <a className="material-row" href={url(`work/${a.id}/`)}>
                      <Icon name="book" />
                      <span>
                        <strong>{assignmentTitle(a.id)}</strong>
                        <small>
                          {a.kind ?? 'Companion'}
                          {a.assistance === 'independent-only'
                            ? ' · details only'
                            : a.companionQuestions?.length
                              ? ` · ${a.companionQuestions.length} checkpoints`
                              : ''}
                        </small>
                      </span>
                      <Icon name="arrow" />
                    </a>
                    {a.originalUrl && (
                      <a
                        className="resource-row"
                        href={a.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Original class resource
                        <Icon name="external" size={16} />
                      </a>
                    )}
                  </div>
                ))}
            </section>
          ))}
          {(teacherUnitResources[unit] ?? []).length > 0 && (
            <section className="material-set">
              <h2>From class</h2>
              {teacherUnitResources[unit].map((r) => (
                <a
                  className="resource-row"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  key={r.url}
                >
                  {r.title}
                  <Icon name="external" size={16} />
                </a>
              ))}
            </section>
          )}
          {!work.length && (
            <p className="classwork-note">
              I haven’t typeset the work for this unit yet. You can open the
              class resources.
            </p>
          )}
          <p className="classwork-note">
            Keep the teacher’s handout for the exact assigned questions.
          </p>
        </div>
      )}
      <Sheet
        open={resources}
        title="Class resources"
        onClose={() => setResources(false)}
      >
        {(teacherUnitResources[unit] ?? []).map((r) => (
          <a
            className="resource-row"
            href={r.url}
            key={r.url}
            target="_blank"
            rel="noreferrer"
          >
            {r.title}
            <Icon name="external" size={16} />
          </a>
        ))}
        {edition.resources.map((r, i) => (
          <a
            className="resource-row"
            href={r}
            key={r}
            target="_blank"
            rel="noreferrer"
          >
            {i === 0
              ? `${edition.teacher} · resources`
              : 'Additional reference'}
            <Icon name="external" size={16} />
          </a>
        ))}
      </Sheet>
    </div>
  );
}
