import { useEffect, useState } from 'react';
import { findCourse, schedule } from '../content/catalog';
import {
  eventNote,
  eventPath,
  eventTitle,
  workspaceCourses,
} from '../content/workspaces';
import type { ScheduleEvent } from '../core/schema';
import { schoolDate, displayDate } from '../core/dates';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import Sheet from './Sheet';
const add = (date: string, n: number) =>
  new Date(Date.parse(date + 'T12:00Z') + n * 86400000)
    .toISOString()
    .slice(0, 10);
export default function Calendar() {
  const state = useLearner(),
    [date, setDate] = useState(schoolDate()),
    [month, setMonth] = useState(false),
    [only, setOnly] = useState(''),
    [event, setEvent] = useState<ScheduleEvent | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search),
      d = q.get('date');
    if (
      d &&
      /^\d{4}-\d{2}-\d{2}$/.test(d) &&
      Number.isFinite(Date.parse(d + 'T12:00Z'))
    )
      setDate(d);
    setOnly(q.get('course') ?? '');
  }, []);
  const startDate = month ? date.slice(0, 7) + '-01' : date;
  const weekday = new Date(startDate + 'T12:00Z').getUTCDay(),
    start = add(startDate, -((weekday + 6) % 7));
  const days = Array.from({ length: month ? 42 : 7 }, (_, i) => add(start, i));
  const events = schedule.filter(
    (e) =>
      (!e.course || state.selected.includes(e.course)) &&
      (!only || !e.course || e.course === only),
  );
  const title = month
    ? new Intl.DateTimeFormat('en', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(date + 'T12:00Z'))
    : `${displayDate(start)} – ${displayDate(days[6])}`;
  function move(n: number) {
    if (month) {
      const d = new Date(date + 'T12:00Z');
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + n);
      setDate(d.toISOString().slice(0, 10));
    } else setDate(add(date, n * 7));
  }
  return (
    <div className="calendar-screen">
      <div className="screen-heading">
        <div>
          <p className="meta">All your dates, together</p>
          <h1>Calendar</h1>
        </div>
      </div>
      <div className="calendar-toolbar">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Previous"
          onClick={() => move(-1)}
        >
          <Icon name="back" />
        </button>
        <button className="secondary" onClick={() => setDate(schoolDate())}>
          Today
        </button>
        <button
          className="icon-button"
          aria-label="Next"
          onClick={() => move(1)}
        >
          <Icon name="back" />
        </button>
        <div className="segmented">
          <button aria-pressed={!month} onClick={() => setMonth(false)}>
            Week
          </button>
          <button aria-pressed={month} onClick={() => setMonth(true)}>
            Month
          </button>
        </div>
      </div>
      <div
        className={`calendar-grid ${month ? 'month' : ''}`}
        data-view={month ? 'month' : 'week'}
      >
        {days.map((day) => (
          <section
            className={`calendar-day ${day === schoolDate() ? 'is-today' : ''}`}
            key={day}
            aria-label={displayDate(day, true)}
          >
            <div className="calendar-day-heading">
              <span>
                {new Intl.DateTimeFormat('en', {
                  weekday: 'short',
                  timeZone: 'UTC',
                }).format(new Date(day + 'T12:00Z'))}
              </span>
              <strong>{Number(day.slice(-2))}</strong>
            </div>
            <div className="calendar-day-events">
              {events
                .filter(
                  (e) => e.start && e.start <= day && (e.end ?? e.start) >= day,
                )
                .map((e) => (
                  <button
                    className="calendar-event"
                    data-course={e.course}
                    key={e.id}
                    onClick={() => setEvent(e)}
                  >
                    {eventTitle(e)}
                    <small>
                      {e.course
                        ? findCourse(e.course).shortTitle
                        : 'No classes'}
                    </small>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
      <div className="calendar-key">
        <label className="sr-only" htmlFor="calendar-course">
          Calendar course
        </label>
        <select
          id="calendar-course"
          value={only}
          onChange={(e) => setOnly(e.target.value)}
        >
          <option value="">All my courses</option>
          {workspaceCourses
            .filter((c) => state.selected.includes(c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortTitle}
              </option>
            ))}
        </select>
        {workspaceCourses
          .filter((c) => state.selected.includes(c.id))
          .map((c) => (
            <span key={c.id}>
              <i className="course-dot" data-course={c.id} />
              {c.shortTitle}
            </span>
          ))}
      </div>
      {events.some((e) => !e.start) && (
        <div className="date-to-confirm">
          I’m still checking:{' '}
          {events
            .filter((e) => !e.start)
            .map((e) => (
              <button className="quiet" key={e.id} onClick={() => setEvent(e)}>
                {eventTitle(e)}
              </button>
            ))}
        </div>
      )}
      <Sheet
        open={!!event}
        title={event ? eventTitle(event) : 'Event'}
        onClose={() => setEvent(null)}
      >
        {event && (
          <>
            <p className="meta">
              {event.start ? displayDate(event.start, true) : 'Date to confirm'}
              {event.end ? ' – ' + displayDate(event.end, true) : ''}
              {event.course ? ' · ' + findCourse(event.course).shortTitle : ''}
            </p>
            <p>{eventNote(event)}</p>
            {event.course && (
              <a className="primary" href={url(eventPath(event))}>
                {event.type === 'test' || event.type === 'quiz'
                  ? 'Prepare'
                  : 'Open classwork'}
                <Icon name="arrow" size={16} />
              </a>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
