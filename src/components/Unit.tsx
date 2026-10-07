import { useEffect } from 'react';
import {
  assignments,
  findCourse,
  findEdition,
  schedule,
} from '../content/catalog';
import {
  assignmentUnits,
  eventPath,
  eventTitle,
  teacherUnitResources,
  unitLabel,
  unitTitle,
  unitTopics,
} from '../content/workspaces';
import { displayDate } from '../core/dates';
import { url } from '../client/store';
import { Icon } from './Icons';
import MaterialRow from './MaterialRow';
export default function Unit({
  course,
  unit,
}: {
  course: string;
  unit: string;
}) {
  const c = findCourse(course),
    edition = findEdition(course);
  const work = assignments.filter(
    (a) => a.course === course && assignmentUnits[a.id] === unit,
  );
  const topics = unitTopics(course, unit);
  const assessments = schedule.filter(
    (e) =>
      e.course === course &&
      (e.type === 'test' || e.type === 'quiz') &&
      (e.concepts.some((id) => topics.some((c) => c.id === id)) ||
        (unit === 'microorganisms' && e.id.startsWith('c19'))),
  );
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.has('view')) {
      query.delete('view');
      history.replaceState(
        null,
        '',
        location.pathname + (query.size ? `?${query}` : '') + location.hash,
      );
    }
  }, []);
  const groups = [
    {
      title: 'Current work',
      materials: work.filter(
        (a) => !['notes', 'resource'].includes(a.kind ?? ''),
      ),
    },
    { title: 'Notes', materials: work.filter((a) => a.kind === 'notes') },
    {
      title: 'Resources',
      materials: work.filter((a) => a.kind === 'resource'),
    },
  ];
  return (
    <div className="v3-unit" data-course={course}>
      <div className="breadcrumbs">
        <a href={url(`courses/${course}/`)}>
          <Icon name="back" size={16} />
          {c.shortTitle}
        </a>
        <span>/</span>
        <span>{unitLabel(course, unit) || 'Materials'}</span>
      </div>
      <header className="v3-unit-header">
        <p className="eyebrow">
          {edition.teacher} · {unitLabel(course, unit) || 'In class'}
        </p>
        <h1>{unitTitle(course, unit)}</h1>
        <p className="muted">Your work from school, in one place.</p>
      </header>
      <div className="v3-unit-layout">
        <div className="v3-material-list">
          {groups
            .filter((g) => g.materials.length)
            .map((g) => (
              <section className="material-group" key={g.title}>
                <h2>
                  {g.title}
                  <small aria-hidden="true">{g.materials.length}</small>
                </h2>
                {g.materials.map((a) => (
                  <MaterialRow key={a.id} material={a} />
                ))}
              </section>
            ))}
          {!work.length && (
            <p className="empty-state">
              The teacher resources are available below. Assigned material has
              not been confirmed for this unit yet.
            </p>
          )}
          {(teacherUnitResources[unit] ?? []).length > 0 && (
            <section className="material-group">
              <h2>From {edition.teacher.replace('Mr. ', '')}</h2>
              {teacherUnitResources[unit].map((r) => (
                <a
                  className="resource-row"
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.title}
                  <Icon name="external" size={16} />
                </a>
              ))}
            </section>
          )}
        </div>
        <aside className="v3-unit-context">
          <h2>Assessment & scope</h2>
          {assessments.map((e) => (
            <div className="assessment-note" key={e.id}>
              <p className="eyebrow">
                {e.start ? displayDate(e.start) : 'Date to confirm'}
              </p>
              <a href={url(eventPath(e))}>
                <strong>{eventTitle(e)}</strong>
                <Icon name="arrow" size={16} />
              </a>
              <p className="muted">{e.notes}</p>
            </div>
          ))}
          {!assessments.length && (
            <p className="muted">
              No assessment scope confirmed for this unit.
            </p>
          )}
          <div className="context-divider" />
          <h2>Class resources</h2>
          {edition.resources.slice(0, 2).map((r, i) => (
            <a
              className="resource-row"
              key={r}
              href={r}
              target="_blank"
              rel="noreferrer"
            >
              {i === 0 ? 'Teacher resources' : 'Additional reference'}
              <Icon name="external" size={16} />
            </a>
          ))}
        </aside>
      </div>
    </div>
  );
}
