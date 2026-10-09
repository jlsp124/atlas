import { useEffect, useState } from 'react';
import {
  assignments,
  findCourse,
  findEdition,
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
} from '../content/workspaces';
import { displayUpcomingDate, schoolDate } from '../core/dates';
import {
  assignmentProgress,
  reviewDue,
  statusLabel,
} from '../core/assignment-progress';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import Sheet from './Sheet';
import ReadableText from './ReadableText';
import PhysicsUnit from './PhysicsUnit';
import LifeSciences from './LifeSciences';

const kindIcon: Record<string, string> = {
  notes: 'book',
  lab: 'lab',
  worksheet: 'document',
  textbook: 'book',
  review: 'review',
  resource: 'external',
  'formal-assignment': 'document',
  'independent-study': 'pencil',
};
export default function MaterialUnit({
  course,
  unit,
}: {
  course: string;
  unit: string;
}) {
  const state = useLearner(),
    c = findCourse(course),
    edition = findEdition(course);
  const topics = unitTopics(course, unit);
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [resources, setResources] = useState(false);
  useEffect(() => {
    const route = new URL(location.href);
    if (route.searchParams.has('view')) {
      route.searchParams.delete('view');
      history.replaceState(
        null,
        '',
        route.pathname + route.search + route.hash,
      );
    }
  }, []);
  const work = assignments.filter(
    (a) => a.course === course && assignmentUnits[a.id] === unit,
  );
  const kinds = [...new Set(work.map((a) => a.kind ?? 'worksheet'))];
  const visible = work.filter(
    (a) =>
      (filter === 'all' || filter === 'todo'
        ? filter !== 'todo' ||
          assignmentProgress(a, state.events).status !== 'complete'
        : a.kind === filter) &&
      `${a.title} ${a.materialSet} ${a.kind} ${a.questionReferences?.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const sets = [...new Set(visible.map((a) => a.materialSet ?? a.id))];
  const upcoming = schedule.filter(
    (e) =>
      e.course === course &&
      ['test', 'quiz'].includes(e.type) &&
      (!e.start || e.start >= schoolDate()) &&
      e.concepts.some((id) => topics.some((c) => c.id === id)),
  );
  const review =
    course === 'japanese'
      ? work.filter((a) =>
          a.companionQuestions?.some((q) =>
            reviewDue(a.id, q.id, state.events),
          ),
        )
      : [];
  if (course === 'life-sciences') return <LifeSciences unit={unit} />;
  if (course === 'physics') return <PhysicsUnit unit={unit} />;
  return (
    <div className="unit-screen material-unit" data-course={course}>
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
          <p className="meta">{edition.teacher}</p>
          <h1>{unitTitle(course, unit)}</h1>
          <p>{unitDescriptions[unit]}</p>
        </div>
        <div className="unit-toolbar">
          <a
            className="icon-button"
            aria-label="Unit calendar"
            href={url(`calendar/?course=${course}`)}
          >
            <Icon name="calendar" size={18} />
          </a>
          <button className="secondary" onClick={() => setResources(true)}>
            Resources
            <Icon name="external" size={15} />
          </button>
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="unit-dates">
          {upcoming.map((e) => (
            <a href={url(eventPath(e))} key={e.id}>
              <Icon name="calendar" size={16} />
              <span>{eventTitle(e)}</span>
              <small>
                {e.start
                  ? displayUpcomingDate(e.start)
                  : (e.dateNote ?? 'Date to confirm')}
              </small>
              <Icon name="arrow" size={15} />
            </a>
          ))}
        </div>
      )}
      {review.length > 0 && (
        <div className="unit-review-row">
          <Icon name="review" size={19} />
          <div>
            <strong>Words ready to review</strong>
            <small>
              Recall them, check the form, then rate Easy, Okay or Hard.
            </small>
          </div>
          <a className="secondary" href={url(`work/${review[0].id}/?review=1`)}>
            Review
            <Icon name="arrow" size={15} />
          </a>
        </div>
      )}
      <div className="material-filters">
        <div
          className="material-filter-options"
          role="group"
          aria-label="Filter materials"
        >
          {[
            ['all', 'All materials'],
            ['todo', 'To do'],
            ...kinds.map((kind) => [
              kind,
              kind === 'independent-study'
                ? 'Practice'
                : kind === 'formal-assignment'
                  ? 'Hand-ins'
                  : kind === 'textbook'
                    ? 'Textbook'
                    : kind === 'resource'
                      ? 'Resources'
                      : kind[0].toUpperCase() +
                        kind.slice(1) +
                        (kind === 'lab' || kind === 'worksheet' ? 's' : ''),
            ]),
          ].map(([value, title]) => (
            <button
              key={value}
              className="quiet"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {title}
            </button>
          ))}
        </div>
        <label className="material-search">
          <Icon name="search" size={17} />
          <span className="sr-only">Find material in this unit</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find material…"
          />
        </label>
      </div>
      <div className="classwork-layout">
        {sets.map((set) => (
          <section className="material-set" key={set}>
            <h2>
              {set.replaceAll('-', ' ').replace(/^./, (s) => s.toUpperCase())}
            </h2>
            {visible
              .filter((a) => (a.materialSet ?? a.id) === set)
              .map((a) => {
                const progress = assignmentProgress(a, state.events);
                return (
                  <a
                    key={a.id}
                    className="material-row"
                    href={url(`work/${a.id}/`)}
                  >
                    <Icon name={kindIcon[a.kind ?? 'worksheet']} size={20} />
                    <span className="material-title">
                      <strong>{assignmentTitle(a.id)}</strong>
                      <small>
                        {a.kind?.replaceAll('-', ' ') ?? 'material'}
                        {a.assistance === 'independent-only'
                          ? ' · details only'
                          : a.companionQuestions?.length
                            ? ` · ${a.companionQuestions.length} ${course === 'japanese' ? 'words' : 'questions'}`
                            : ''}
                        {a.due ? ` · due ${displayUpcomingDate(a.due)}` : ''}
                      </small>
                    </span>
                    <span
                      className="material-status"
                      data-status={progress.status}
                    >
                      {progress.status === 'complete' && (
                        <Icon name="check" size={14} />
                      )}
                      {statusLabel[progress.status]}
                    </span>
                    <Icon name="arrow" size={16} />
                  </a>
                );
              })}
          </section>
        ))}
        {!visible.length && (
          <div className="material-empty">
            <Icon name={work.length ? 'search' : 'book'} size={27} />
            <h2>
              {work.length
                ? filter === 'todo' && !query.trim()
                  ? 'All marked complete'
                  : 'No matching materials'
                : 'Class resources are here when you need them'}
            </h2>
            <p>
              {work.length
                ? filter === 'todo' && !query.trim()
                  ? 'Revisit any material whenever you need it.'
                  : 'Try another word or show all materials.'
                : 'There are no typeset assignments for this unit yet. Use your teacher’s resources below.'}
            </p>
            {work.length ? (
              <button
                className="secondary"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
              >
                Show all materials
              </button>
            ) : (
              <button className="secondary" onClick={() => setResources(true)}>
                Open class resources
                <Icon name="external" size={15} />
              </button>
            )}
          </div>
        )}
        {(teacherUnitResources[unit] ?? []).length > 0 && (
          <section className="material-set linked-resources">
            <h2>Useful resources</h2>
            {teacherUnitResources[unit].map((r) => (
              <a
                className="resource-row"
                href={r.url}
                target="_blank"
                rel="noreferrer"
                key={r.url}
              >
                <span>{r.title}</span>
                <Icon name="external" size={16} />
              </a>
            ))}
          </section>
        )}
        {topics.length > 0 && (
          <details className="reference-explanations">
            <summary>Find an explanation</summary>
            <p>Open the part you need for your work.</p>
            <div>
              {topics.map((t) => (
                <a
                  className="resource-row"
                  key={t.id}
                  href={url(`learn/${t.id}/`)}
                >
                  <span lang={course === 'japanese' ? 'ja' : undefined}>
                    <ReadableText text={topicTitle(t.id)} />
                  </span>
                  <Icon name="arrow" size={16} />
                </a>
              ))}
            </div>
            <a
              className="quiet"
              href={url(`courses/${course}/practice/?unit=${unit}&review=1`)}
            >
              {course === 'japanese'
                ? 'More recall practice'
                : 'Optional practice'}
              <Icon name="arrow" size={15} />
            </a>
          </details>
        )}
      </div>
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
