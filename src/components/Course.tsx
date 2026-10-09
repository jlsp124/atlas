import { useEffect, useState } from 'react';
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
  unitTitle,
  unitLabel,
  unitUrl,
} from '../content/workspaces';
import { materialProgress } from '../core/materials';
import { schoolDate, displayUpcomingDate } from '../core/dates';
import { url, useLearner } from '../client/store';
import { CourseMark, Icon } from './Icons';
import Sheet from './Sheet';
import LifeSciences from './LifeSciences';
import Japanese from './Japanese';
import MaterialRow from './MaterialRow';
export default function Course({
  id,
  section,
}: {
  id: string;
  section?: 'learn' | 'work' | 'schedule';
}) {
  const c = findCourse(id),
    edition = findEdition(id),
    state = useLearner();
  const [resources, setResources] = useState(false);
  useEffect(() => {
    setResources(new URLSearchParams(location.search).has('resources'));
    if (section)
      location.replace(
        url(
          section === 'schedule'
            ? `calendar/?course=${id}`
            : id === 'japanese'
              ? `courses/japanese/?view=${section === 'learn' ? 'vocabulary' : 'this-week'}`
              : unitUrl(id, edition.currentUnit),
        ),
      );
  }, [section, id, edition.currentUnit]);
  const work = assignments.filter(
    (a) => a.course === id && assignmentUnits[a.id] === edition.currentUnit,
  );
  const actionable = work.filter(
    (a) =>
      a.assistance !== 'independent-only' &&
      !['notes', 'resource'].includes(a.kind ?? ''),
  );
  const recent = [...state.events]
    .reverse()
    .find((e) =>
      actionable.some(
        (a) =>
          'assignment' in e.payload &&
          a.id === e.payload.assignment &&
          !materialProgress(a, state.events).done,
      ),
    );
  const recentId =
    recent && 'assignment' in recent.payload
      ? recent.payload.assignment
      : undefined;
  const current =
    actionable.find((a) => a.id === recentId) ??
    actionable.find((a) => !materialProgress(a, state.events).done) ??
    work[0];
  const events = schedule
    .filter(
      (e) =>
        e.course === id &&
        (!e.start || e.start >= schoolDate()) &&
        (e.type === 'test' ||
          e.type === 'quiz' ||
          e.type === 'assignment' ||
          e.type === 'project'),
    )
    .slice(0, 3);
  if (id === 'japanese') return <Japanese />;
  if (id === 'life-sciences') return <LifeSciences />;
  if (id === 'physics')
    return (
      <div className="course-screen physics-course" data-course={id}>
        <header className="course-heading">
          <CourseMark course={id} />
          <div>
            <p className="meta">{edition.teacher}</p>
            <h1>{c.title}</h1>
          </div>
          <a
            className="quiet"
            href={edition.resources[0]}
            target="_blank"
            rel="noreferrer"
          >
            Class resources <Icon name="external" size={15} />
          </a>
        </header>
        <div className="unit-list">
          {c.units.map((u, i) => (
            <a className="unit-row" key={u.id} href={url(unitUrl(id, u.id))}>
              <span className="unit-index">
                {unitLabel(id, u.id) || String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{unitTitle(id, u.id)}</strong>
                <small>
                  {
                    assignments.filter(
                      (a) => a.course === id && assignmentUnits[a.id] === u.id,
                    ).length
                  }{' '}
                  materials
                </small>
              </span>
              <Icon name="arrow" size={18} />
            </a>
          ))}
        </div>
        {events.filter((e) => e.start && e.confidence !== 'unverified').length >
          0 && (
          <section className="physics-coming">
            <h2>Coming up</h2>
            {events
              .filter((e) => e.start && e.confidence !== 'unverified')
              .map((e) => (
                <a key={e.id} href={url(eventPath(e))}>
                  {eventTitle(e)} <small>{displayUpcomingDate(e.start!)}</small>
                </a>
              ))}
          </section>
        )}
      </div>
    );
  return (
    <div className="v3-course course-screen" data-course={id}>
      <header className="course-heading">
        <CourseMark course={id} />
        <div>
          <p className="meta">
            {edition.teacher} · {edition.term}
          </p>
          <h1>{c.title}</h1>
        </div>
        <div className="course-actions">
          <button className="secondary" onClick={() => setResources(true)}>
            Resources
            <Icon name="external" size={15} />
          </button>
        </div>
      </header>
      <section className="current-work-band">
        <div className="section-heading">
          <p className="eyebrow">Current unit</p>
          <a href={url(unitUrl(id, edition.currentUnit))}>
            All material
            <Icon name="arrow" size={16} />
          </a>
        </div>
        <h2>
          <a href={url(unitUrl(id, edition.currentUnit))}>
            {unitTitle(id, edition.currentUnit)}
          </a>
        </h2>
        <p className="muted">What you’re doing now</p>
        {current && <MaterialRow material={current} featured />}
        <div className="current-work-footer">
          <span>{edition.teacher}</span>
          {current && (
            <a className="primary" href={url(`work/${current.id}/?focus=1`)}>
              Continue
              <Icon name="arrow" size={16} />
            </a>
          )}
        </div>
      </section>
      <div className="v3-course-bottom">
        <section>
          <h2>Units</h2>
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
                    {
                      assignments.filter(
                        (a) =>
                          a.course === id && assignmentUnits[a.id] === u.id,
                      ).length
                    }{' '}
                    materials
                  </small>
                </span>
                <span className="unit-status">
                  {u.id === edition.currentUnit
                    ? 'Current'
                    : u.status === 'upcoming'
                      ? 'Coming up'
                      : 'Previous'}
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
              <small>
                {e.confidence === 'unverified'
                  ? 'Scope to confirm'
                  : 'Teacher scope available'}
              </small>
              <Icon name="arrow" size={16} />
            </a>
          ))}
          {!events.length && <p className="muted">No new dates confirmed.</p>}
        </aside>
      </div>
      <section className="recent-materials">
        <h2>Current materials</h2>
        {work
          .filter((a) => a.id !== current?.id)
          .slice(0, 4)
          .map((a) => (
            <MaterialRow key={a.id} material={a} />
          ))}
      </section>
      <Sheet
        open={resources}
        title={`${c.shortTitle} resources`}
        onClose={() => setResources(false)}
      >
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
