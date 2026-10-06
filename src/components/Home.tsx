import {
  concepts,
  courses,
  editions,
  assignments,
  questions,
  schedule,
  coverageItems,
  snapshot,
} from '../content/catalog';
import {
  displayDate,
  dayDifference,
  isSchoolDay,
  schoolDate,
  schoolDaysThrough,
} from '../core/dates';
import { coverage, evidence, nearestGap, taskDone } from '../core/learning';
import { useLearner, url } from '../client/store';
import { useEffect, useState } from 'react';

export default function Home() {
  const state = useLearner();
  const [today, setToday] = useState(snapshot.date);
  useEffect(() => setToday(schoolDate()), []);
  const selected = courses.filter((c) => state.selected.includes(c.id));
  const upcoming = schedule
    .filter(
      (e) =>
        e.type !== 'holiday' &&
        (!e.course || state.selected.includes(e.course)) &&
        (!e.start || e.start >= today || (e.end && e.end >= today)),
    )
    .sort((a, b) => (a.start ?? today).localeCompare(b.start ?? today))
    .slice(0, 6);
  const nextDayOff = schedule
    .filter((e) => e.type === 'holiday' && e.start && e.start >= today)
    .sort((a, b) => a.start!.localeCompare(b.start!))[0];
  const nextAssessment = upcoming.find(
    (e) => ['test', 'quiz'].includes(e.type) && e.concepts.length,
  );
  const weak = concepts.filter(
    (c) =>
      state.selected.includes(c.course) &&
      ['conflict', 'review due', 'developing'].includes(
        evidence(c.id, state.events, questions).state,
      ),
  );
  const target = weak[0]?.id ?? nextAssessment?.concepts[0];
  const gap = target
    ? nearestGap(target, concepts, state.events, questions)
    : undefined;
  const recommendation = concepts.find((c) => c.id === (gap ?? target));
  const localCoverage = coverage(
    coverageItems.filter((i) => state.selected.includes(i.course)),
    state.events,
    questions,
  );
  const fullDays = schoolDaysThrough('2027-01-29');
  return (
    <div className="home-grid">
      <section className="today-heading">
        <p className="eyebrow">
          YOUR SCHOOL DAY{' '}
          <span className="live-label">
            {isSchoolDay(today) ? 'Semester 1' : 'No regular classes today'}
          </span>
        </p>
        <h1>
          Today<span className="title-dot">.</span>
        </h1>
        <p className="date-line">
          {new Intl.DateTimeFormat('en-CA', {
            weekday: 'long',
            timeZone: 'UTC',
          }).format(new Date(`${today}T12:00Z`))}
          , {displayDate(today, true)}
        </p>
      </section>
      <div className="home-sidebar">
        <section className="today-classes">
          <div className="section-heading">
            <h2>{isSchoolDay(today) ? 'Class order' : 'Your course order'}</h2>
            <a href={url('account/')}>
              Edit courses <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ol className="class-list">
            {selected.map((c) => {
              const e = editions.find((e) => e.course === c.id)!;
              return (
                <li key={c.id}>
                  <a href={url(`courses/${c.id}/`)}>
                    <span className="period">P{e.period}</span>
                    <span
                      className={`course-symbol ${c.id}`}
                      aria-hidden="true"
                    >
                      {c.symbol}
                    </span>
                    <span>
                      <strong>{c.title}</strong>
                      <small>{e.teacher}</small>
                    </span>
                    <span className="row-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          {!selected.length && (
            <p>
              Choose your courses in <a href={url('account/')}>settings</a> to
              start your atlas.
            </p>
          )}
          <p className="small muted">
            Verified P1–P4 order · no bell times or special-day rotations
            inferred.
          </p>
        </section>
        <aside className="up-next">
          <p className="eyebrow">A USEFUL NEXT STEP</p>
          {recommendation ? (
            <>
              <h2>{recommendation.title}</h2>
              <p>
                {state.events.some((e) => e.type === 'question_answered')
                  ? 'Your local evidence points to this branch.'
                  : 'Start with a small check before rereading the whole unit.'}
              </p>
              <a
                className="primary"
                href={url(
                  `courses/${recommendation.course}/practice/?target=${recommendation.id}&mode=Learn%20this`,
                )}
              >
                Find what I’m missing <span aria-hidden="true">→</span>
              </a>
              <a
                className="subtle-link"
                href={url(`concepts/${recommendation.id}/`)}
              >
                Open the explanation
              </a>
            </>
          ) : (
            <>
              <h2>Make the first connection.</h2>
              <p>A quick check gives atlas something useful to work with.</p>
              <a className="primary" href={url('courses/physics/practice/')}>
                Try a quick check →
              </a>
            </>
          )}
          <div className="mini-coverage">
            <strong>
              {localCoverage.tested.length}
              <span> / {localCoverage.total}</span>
            </strong>
            <p>reviewed core items tested</p>
            <div className="progress-track">
              <span
                style={{
                  width: `${localCoverage.total ? (localCoverage.tested.length / localCoverage.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="small muted">
              Coverage is separate from correctness. This bank covers reviewed
              material, not the whole syllabus.
            </p>
          </div>
        </aside>
      </div>
      <section className="upcoming-work">
        <div className="section-heading">
          <h2>Coming up</h2>
          <span className="small muted">
            Dates checked {displayDate(snapshot.date)}
          </span>
        </div>
        <div className="timeline">
          {upcoming.map((e) => (
            <article key={e.id} className="timeline-row">
              <div className="event-date">
                {e.start ? (
                  <>
                    <strong>
                      {new Date(`${e.start}T12:00Z`).getUTCDate()}
                    </strong>
                    <small>{displayDate(e.start).split(' ')[0]}</small>
                  </>
                ) : (
                  <strong aria-label="Date unconfirmed">?</strong>
                )}
              </div>
              <div>
                <div className="meta-line">
                  <span className="eyebrow">
                    {e.course
                      ? courses.find((c) => c.id === e.course)?.shortTitle
                      : 'School'}
                  </span>
                  <span className="badge">{e.type}</span>
                  {e.confidence === 'unverified' && (
                    <span className="badge warning">Unconfirmed</span>
                  )}
                </div>
                <h3>
                  <a href={url(`courses/${e.course}/schedule/`)}>{e.title}</a>
                </h3>
                <p>
                  {e.start === today ? 'Today · ' : ''}
                  {e.dateNote || e.notes}
                </p>
              </div>
              <span className="row-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
        {!upcoming.length && (
          <p>
            No upcoming work is recorded in this snapshot. Check your teacher’s
            latest announcements.
          </p>
        )}
      </section>
      <section className="home-assignments">
        <div className="section-heading">
          <h2>On your desk</h2>
          <span className="small muted">Original companions</span>
        </div>
        {assignments
          .filter((a) => state.selected.includes(a.course))
          .map((a) => {
            const done = a.tasks.filter((t) =>
              taskDone(a.id, t.id, state.events),
            ).length;
            return (
              <a
                className="assignment-row"
                href={url(`work/${a.id}/`)}
                key={a.id}
              >
                <span className="check-symbol" aria-hidden="true">
                  {done === a.tasks.length ? '✓' : '□'}
                </span>
                <span>
                  <small className="eyebrow">
                    {courses.find((c) => c.id === a.course)?.shortTitle}
                  </small>
                  <strong>{a.title}</strong>
                </span>
                <small>
                  {done}/{a.tasks.length}
                </small>
                <span aria-hidden="true">→</span>
              </a>
            );
          })}
      </section>
      <section className="school-context">
        <h2>A little perspective</h2>
        <dl className="context-stats">
          <div>
            <dt>Winter break</dt>
            <dd>
              {dayDifference(today, '2026-12-21') >= 0
                ? `${dayDifference(today, '2026-12-21')} days`
                : 'Dec. 21–Jan. 1'}
            </dd>
          </div>
          <div>
            <dt>School days through today</dt>
            <dd>
              {schoolDaysThrough(today)} <span>/ {fullDays}</span>
            </dd>
          </div>
          <div>
            <dt>Mapped ideas</dt>
            <dd>{concepts.length}</dd>
          </div>
          <div>
            <dt>Practice archetypes</dt>
            <dd>{questions.length}</dd>
          </div>
        </dl>
        <p className="small muted">
          {nextDayOff
            ? `Next day off: ${displayDate(nextDayOff.start!)} · ${nextDayOff.title}`
            : 'This snapshot has no later holiday recorded.'}{' '}
          ·{' '}
          <a href="https://sd57.bc.ca/district/school-district-calendars/">
            District calendar
          </a>
        </p>
      </section>
    </div>
  );
}
