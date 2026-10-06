import { useEffect } from 'react';
import {
  assignments,
  concepts,
  coverageItems,
  findCourse,
  findEdition,
  questions,
  schedule,
  snapshot,
  sources,
} from '../content/catalog';
import { coverage, evidence, assignmentPriority } from '../core/learning';
import { displayDate, schoolDate } from '../core/dates';
import { track, url, useLearner } from '../client/store';
import Graph from './Graph';

export default function Course({
  id,
  section = 'overview',
}: {
  id: string;
  section?: 'overview' | 'work' | 'learn' | 'schedule';
}) {
  const state = useLearner();
  const c = findCourse(id);
  const edition = findEdition(id);
  const items = coverage(
    coverageItems.filter((i) => i.course === id),
    state.events,
    questions,
  );
  useEffect(() => {
    track('course_opened', id);
  }, [id]);
  const upcoming = schedule.filter(
    (e) => e.course === id && e.type !== 'research',
  );
  return (
    <>
      <div className="course-title">
        <span className={`course-symbol large ${id}`} aria-hidden="true">
          {c.symbol}
        </span>
        <div>
          <p className="eyebrow">
            P{edition.period} · {edition.teacher} · {edition.term}
          </p>
          <h1>{c.title}</h1>
        </div>
      </div>
      <p className="lede">{c.description}</p>
      <nav className="course-tabs" aria-label="Course navigation">
        {(['overview', 'work', 'learn', 'schedule'] as const).map((tab) => (
          <a
            key={tab}
            aria-current={section === tab ? 'page' : undefined}
            href={url(`courses/${id}/${tab === 'overview' ? '' : tab + '/'}`)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </a>
        ))}
        <a className="course-practice" href={url(`courses/${id}/practice/`)}>
          Practice <span aria-hidden="true">↗</span>
        </a>
      </nav>
      {section === 'overview' ? (
        <div className="course-overview-grid">
          <section>
            <p className="eyebrow">IN CLASS NOW</p>
            <h2>{c.units.find((u) => u.id === edition.currentUnit)?.title}</h2>
            <p>{edition.notes}</p>
            <div className="button-row">
              <a
                className="primary"
                href={url(`courses/${id}/learn/#${edition.currentUnit}`)}
              >
                Open current material →
              </a>
              <a href={url(`courses/${id}/practice/`)}>Quick check</a>
            </div>
            <div className="units-list">
              <h2>The course so far</h2>
              {c.units.map((u) => (
                <a key={u.id} href={url(`courses/${id}/learn/#${u.id}`)}>
                  <span>{u.title}</span>
                  <span className="badge">
                    {u.status === 'review'
                      ? 'Taught earlier'
                      : u.status === 'current'
                        ? 'Taught / current'
                        : 'Upcoming · sourced'}
                  </span>
                </a>
              ))}
            </div>
          </section>
          <aside className="course-context">
            <h2>Next assessments</h2>
            {upcoming.map((e) => (
              <div className="context-event" key={e.id}>
                <small>
                  {e.start ? displayDate(e.start) : e.dateNote} ·{' '}
                  {e.confidence.replace(/-/g, ' ')}
                </small>
                <strong>{e.title}</strong>
                {e.start && e.start < schoolDate() && (
                  <span className="badge">Earlier date · snapshot</span>
                )}
              </div>
            ))}
            <div className="mini-coverage">
              <strong>
                {items.tested.length}
                <span> / {items.total}</span>
              </strong>
              <p>reviewed core items tested</p>
              <p className="small muted">
                {items.unseen.length} unseen · {items.weak.length} need
                checking. This is the reviewed atlas blueprint, not the full
                syllabus.
              </p>
              <a href={url(`courses/${id}/learn/`)}>Explore coverage →</a>
            </div>
          </aside>
        </div>
      ) : section === 'work' ? (
        <section>
          <h2>Work & study companions</h2>
          <p className="muted">
            Checklists help you prepare and complete your own work. Confirm
            submissions and due dates with the teacher.
          </p>
          {assignments
            .filter((a) => a.course === id)
            .map((a) => {
              const priority = assignmentPriority(a, state.events, questions);
              return (
                <article key={a.id} className="work-entry">
                  <p className="eyebrow">
                    {a.due
                      ? `Due ${displayDate(a.due)}`
                      : 'Due date not confirmed'}
                  </p>
                  <h3>
                    <a href={url(`work/${a.id}/`)}>{a.title} ↗</a>
                  </h3>
                  <p>{a.summary}</p>
                  <span className="badge">{priority.label}</span>
                  <p className="small muted">{priority.reason}</p>
                </article>
              );
            })}
        </section>
      ) : section === 'schedule' ? (
        <section>
          <h2>Schedule snapshot</h2>
          <p className="muted">
            Checked {displayDate(snapshot.date, true)}. Teacher sources take
            precedence. Past dates stay labeled as earlier events.
          </p>
          {schedule
            .filter((e) => e.course === id || e.type === 'holiday')
            .sort((a, b) =>
              (a.start ?? '9999').localeCompare(b.start ?? '9999'),
            )
            .map((e) => (
              <article className="schedule-row" key={e.id}>
                <div>
                  <p className="eyebrow">
                    {e.start ? displayDate(e.start) : e.dateNote}
                    {e.end ? ` – ${displayDate(e.end)}` : ''}
                  </p>
                  <h3>{e.title}</h3>
                  <p>{e.notes}</p>
                  <div className="meta-line">
                    <span className="badge">
                      {e.confidence.replace(/-/g, ' ')}
                    </span>
                    {e.start && e.start < schoolDate() && (
                      <span className="badge">Earlier date</span>
                    )}
                    <span className="small muted">
                      Last verified {e.verified}
                    </span>
                  </div>
                </div>
                <div className="schedule-action">
                  {e.sources.map((s) => {
                    const source = sources.find((x) => x.id === s)!;
                    return source.url ? (
                      <a
                        key={s}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Teacher / source ↗
                      </a>
                    ) : (
                      <small key={s}>{source.title}</small>
                    );
                  })}
                  {e.concepts.length > 0 && (
                    <a
                      className="secondary"
                      href={url(
                        `courses/${id}/practice/?target=${e.concepts[0]}&mode=Review%20this%20branch`,
                      )}
                    >
                      Prepare
                    </a>
                  )}
                </div>
              </article>
            ))}
        </section>
      ) : (
        <>
          <section className="coverage-report">
            <div className="section-heading">
              <h2>What you’ve tested</h2>
              <a href={url(`courses/${id}/practice/?mode=Coverage%20sweep`)}>
                Fill the unseen gaps →
              </a>
            </div>
            <p>
              <strong>
                {items.tested.length} / {items.total}
              </strong>{' '}
              reviewed core items tested · {items.unseen.length} unseen ·{' '}
              {items.weak.length} with recent misses.
            </p>
            <p className="small muted">
              Seeing a lesson is exposure; an unhinted answer tests an item even
              when it is wrong. A hinted attempt does not establish tested
              coverage. More syllabus material will be added as it is reviewed.
            </p>
          </section>
          {c.units.map((u) => (
            <section id={u.id} className="unit-section" key={u.id}>
              <div className="section-heading">
                <h2>{u.title}</h2>
                <span className="badge">{u.status}</span>
              </div>
              {u.status === 'upcoming' ? (
                <p className="muted">
                  This unit is in the teacher schedule. Learning content and
                  practice are awaiting review; no completed coverage is
                  claimed.
                </p>
              ) : (
                <>
                  <div className="concept-index">
                    {concepts
                      .filter((x) => x.course === id && x.unit === u.id)
                      .map((x) => (
                        <a key={x.id} href={url(`concepts/${x.id}/`)}>
                          <span>{x.title}</span>
                          <span
                            className={`evidence-state ${evidence(x.id, state.events, questions).state.replace(' ', '-')}`}
                          >
                            {evidence(x.id, state.events, questions).state}
                          </span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                  </div>
                  <Graph course={id} unit={u.id} />
                </>
              )}
            </section>
          ))}
        </>
      )}
      <div className="resource-links">
        <p className="eyebrow">ORIGINAL COURSE RESOURCES</p>
        {edition.resources.map((r, i) => (
          <a href={r} key={r} target="_blank" rel="noreferrer">
            {id === 'life-sciences' && i === 1
              ? 'Teacher calendar'
              : 'Course resource'}{' '}
            ↗
          </a>
        ))}
        <a href={url('sources/')}>Source provenance</a>
      </div>
    </>
  );
}
