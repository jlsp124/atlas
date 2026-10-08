import { useEffect, useState } from 'react';
import {
  assignments,
  findCourse,
  findEdition,
  schedule,
} from '../content/catalog';
import {
  eventPath,
  eventTitle,
  unitTitle,
  unitLabel,
  unitUrl,
  assignmentUnits,
} from '../content/workspaces';
import { schoolDate, displayUpcomingDate } from '../core/dates';
import { url } from '../client/store';
import { CourseMark, Icon } from './Icons';
import Sheet from './Sheet';
export default function Course({
  id,
  section,
}: {
  id: string;
  section?: 'learn' | 'work' | 'schedule';
}) {
  const c = findCourse(id),
    edition = findEdition(id);
  const [resources, setResources] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setResources(query.has('resources'));
    if (section)
      location.replace(
        url(
          section === 'schedule'
            ? `calendar/?course=${id}`
            : unitUrl(
                id,
                edition.currentUnit,
                section === 'work' ? 'classwork' : 'learn',
              ),
        ),
      );
  }, [section, id, edition.currentUnit]);
  const events = schedule
    .filter(
      (e) =>
        e.course === id &&
        (!e.start || e.start >= schoolDate()) &&
        (e.type === 'test' || e.type === 'quiz'),
    )
    .slice(0, 3);
  return (
    <div className="course-screen" data-course={id}>
      <div className="course-heading">
        <CourseMark course={id} />
        <div>
          <p className="meta">
            {edition.teacher} · {edition.term}
          </p>
          <h1>{c.title}</h1>
        </div>
        <div className="course-actions">
          <a
            className="icon-button"
            aria-label="Course calendar"
            href={url(`calendar/?course=${id}`)}
          >
            <Icon name="calendar" />
          </a>
          <button className="secondary" onClick={() => setResources(true)}>
            Resources
            <Icon name="external" size={15} />
          </button>
        </div>
      </div>
      <p className="screen-intro">{c.description}</p>
      <div className="course-layout">
        <section>
          <h2>Your units</h2>
          <div className="unit-list">
            {c.units.map((u, i) => (
              <a
                key={u.id}
                className={`unit-row ${u.id === edition.currentUnit ? 'current-unit' : ''}`}
                href={url(unitUrl(id, u.id))}
              >
                <span className="unit-index">
                  {unitLabel(id, u.id) || String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{unitTitle(id, u.id)}</strong>
                  <small>
                    {assignments.filter(
                      (a) => a.course === id && assignmentUnits[a.id] === u.id,
                    ).length
                      ? `${assignments.filter((a) => a.course === id && assignmentUnits[a.id] === u.id).length} materials`
                      : 'Class resources'}
                  </small>
                </span>
                <span className="unit-status">
                  {u.id === edition.currentUnit
                    ? 'Current'
                    : u.status === 'review'
                      ? 'Earlier'
                      : u.status === 'upcoming'
                        ? 'Next'
                        : 'In class'}
                </span>
                <Icon name="arrow" size={18} />
              </a>
            ))}
          </div>
        </section>
        <aside className="course-next">
          <h2>Coming up</h2>
          {events.map((e) => (
            <a className="upcoming-link" href={url(eventPath(e))} key={e.id}>
              <small>
                {e.start ? displayUpcomingDate(e.start) : 'Date to confirm'}
              </small>
              <strong>{eventTitle(e)}</strong>
              <Icon name="arrow" size={16} />
            </a>
          ))}
          {!events.length && (
            <p className="muted">I’ll add the next date when I get it.</p>
          )}
        </aside>
      </div>
      <Sheet
        open={resources}
        title={`${c.shortTitle} resources`}
        onClose={() => setResources(false)}
      >
        <p className="muted">
          The original class resources, when you need them.
        </p>
        {edition.resources.map((r, i) => (
          <a
            className="resource-row"
            href={r}
            target="_blank"
            rel="noreferrer"
            key={r}
          >
            {i === 0
              ? `${edition.teacher} · course resources`
              : 'Additional reference'}
            <Icon name="external" size={16} />
          </a>
        ))}
        <a className="quiet" href={url('sources/')}>
          Source details
        </a>
      </Sheet>
    </div>
  );
}
