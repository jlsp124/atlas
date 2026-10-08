import {
  assignments,
  concepts,
  findCourse,
  findEdition,
  schedule,
} from '../content/catalog';
import {
  workspaceCourses,
  assignmentTitle,
  eventPath,
  eventTitle,
  topicTitle,
  unitTitle,
} from '../content/workspaces';
import { schoolDate, dayDifference, nearbyWeekday } from '../core/dates';
import { useLearner, url } from '../client/store';
import { CourseMark, Icon } from './Icons';
import { assignmentProgress } from '../core/assignment-progress';
export default function Home({ chooser = false }: { chooser?: boolean }) {
  const state = useLearner(),
    today = schoolDate();
  const added = workspaceCourses.filter((c) => state.selected.includes(c.id));
  const next = schedule
    .filter(
      (e) =>
        e.start &&
        (e.end ?? e.start) >= today &&
        (!e.course || state.selected.includes(e.course)) &&
        e.type !== 'research',
    )
    .sort((a, b) => a.start!.localeCompare(b.start!))
    .slice(0, 5);
  const recent = [...state.events]
    .reverse()
    .find((e) =>
      e.type === 'lesson_viewed'
        ? state.selected.includes(
            concepts.find((c) => c.id === e.payload.concept)?.course ?? '',
          )
        : e.type === 'assignment_task' || e.type === 'assignment_progress'
          ? assignments.some(
              (a) =>
                a.id === e.payload.assignment &&
                state.selected.includes(a.course) &&
                assignmentProgress(a, state.events).status !== 'complete',
            )
          : false,
    );
  const resume =
    recent?.type === 'lesson_viewed'
      ? {
          title: topicTitle(recent.payload.concept),
          path: `learn/${recent.payload.concept}/`,
        }
      : recent?.type === 'assignment_progress'
        ? {
            title: assignmentTitle(recent.payload.assignment),
            path:
              `work/${recent.payload.assignment}/` +
              (recent.payload.question
                ? `?step=${recent.payload.step ?? 0}#${recent.payload.question}`
                : ''),
          }
        : recent?.type === 'assignment_task'
          ? {
              title: assignmentTitle(recent.payload.assignment),
              path: `work/${recent.payload.assignment}/`,
            }
          : undefined;
  return (
    <div className="home-screen">
      <div className="screen-heading">
        <div>
          <p className="meta">
            {new Intl.DateTimeFormat('en-CA', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
            }).format(new Date(today + 'T12:00Z'))}
          </p>
          <h1>{chooser ? 'Your courses' : 'Your atlas'}</h1>
        </div>
        <a className="quiet" href={url('account/')}>
          <Icon name="more" />
          <span className="sr-only">Manage your setup</span>
        </a>
      </div>
      <div className={`home-grid ${chooser ? 'course-chooser' : ''}`}>
        {!chooser && (
          <section className="up-next">
            <div className="section-heading">
              <h2>Up next</h2>
              <a href={url('calendar/')}>
                Calendar
                <Icon name="arrow" size={16} />
              </a>
            </div>
            <div className="event-list">
              {next.map((e) => (
                <a
                  className="event-row"
                  data-course={e.course}
                  key={e.id}
                  href={url(eventPath(e))}
                >
                  <time className="event-date" dateTime={e.start}>
                    <strong>
                      {new Date(e.start! + 'T12:00Z').getUTCDate()}
                    </strong>
                    <small>
                      {[
                        nearbyWeekday(e.start!, today),
                        new Intl.DateTimeFormat('en', {
                          month: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(e.start! + 'T12:00Z')),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </time>
                  <span className="event-copy">
                    <small className="event-class">
                      {e.course
                        ? findCourse(e.course).shortTitle
                        : 'School · No classes'}
                    </small>
                    <strong>
                      {eventTitle(e).replace(/^C(\d+)\b/, 'Chapter $1')}
                    </strong>
                  </span>
                  <Icon name="arrow" size={17} />
                </a>
              ))}
              {!next.length && (
                <p className="empty-state">
                  Nothing dated coming up. Your units are still here when you
                  need them.
                </p>
              )}
            </div>
            {resume && (
              <a className="continue-row" href={url(resume.path)}>
                <span>
                  <small>Continue</small>
                  <strong>{resume.title}</strong>
                </span>
                <Icon name="arrow" />
              </a>
            )}
          </section>
        )}
        <section className="my-courses">
          <div className="section-heading">
            <h2>{chooser ? 'Pick up where you left off' : 'My courses'}</h2>
            <a href={url('account/')} aria-label="Change courses">
              Edit
            </a>
          </div>
          <div className="course-rows">
            {added.map((c) => (
              <a
                className="course-row"
                href={url(`courses/${c.id}/`)}
                key={c.id}
              >
                <CourseMark course={c.id} />
                <span>
                  <strong>{c.title}</strong>
                  <small>
                    {unitTitle(c.id, findEdition(c.id).currentUnit)}
                  </small>
                </span>
                <Icon name="arrow" size={18} />
              </a>
            ))}
          </div>
          {!added.length && (
            <div className="empty-state">
              <p>Add the classes you’re taking.</p>
              <a className="primary" href={url('account/')}>
                Choose courses
              </a>
            </div>
          )}
          {chooser && (
            <a className="quiet" href={url()}>
              Back to Home
            </a>
          )}
        </section>
      </div>
      {!chooser && (
        <div className="home-footnote">
          <span>
            {Math.max(0, dayDifference(today, '2026-12-21'))} days until winter
            break
          </span>
          <span>Fall 2026</span>
        </div>
      )}
    </div>
  );
}
