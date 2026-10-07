import {
  assignments,
  findCourse,
  findEdition,
  schedule,
} from '../content/catalog';
import {
  workspaceCourses,
  assignmentTitle,
  eventPath,
  eventTitle,
  unitTitle,
} from '../content/workspaces';
import { materialProgress, resumeCheckpoint } from '../core/materials';
import { schoolDate, displayDate } from '../core/dates';
import { useLearner, url } from '../client/store';
import { CourseMark, Icon } from './Icons';
export default function Home({ chooser = false }: { chooser?: boolean }) {
  const state = useLearner(),
    today = schoolDate();
  const added = workspaceCourses.filter((c) => state.selected.includes(c.id));
  const current = assignments.filter(
    (a) =>
      state.selected.includes(a.course) &&
      a.status === 'current' &&
      a.assistance !== 'independent-only' &&
      a.companionQuestions?.length &&
      !materialProgress(a, state.events).done,
  );
  const recent = [...state.events]
    .reverse()
    .find((e) =>
      current.some(
        (a) => 'assignment' in e.payload && a.id === e.payload.assignment,
      ),
    );
  const recentId =
    recent && 'assignment' in recent.payload
      ? recent.payload.assignment
      : undefined;
  const resume = current.find((a) => a.id === recentId) ?? current[0];
  const checkpoint = resume
    ? resumeCheckpoint(resume, state.events)
    : undefined;
  const label = resume?.companionQuestions?.find(
    (q) => q.id === checkpoint,
  )?.number;
  const next = schedule
    .filter(
      (e) =>
        e.start &&
        (e.end ?? e.start) >= today &&
        (!e.course || state.selected.includes(e.course)) &&
        e.type !== 'research',
    )
    .sort((a, b) => a.start!.localeCompare(b.start!))
    .slice(0, 3);
  return (
    <div className="home-screen v3-home">
      <div className="screen-heading">
        <div>
          <p className="meta">{displayDate(today)}</p>
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
            {resume && (
              <a
                className="continue-row v3-continue"
                data-course={resume.course}
                href={url(
                  `work/${resume.id}/?focus=1${checkpoint ? `#${checkpoint}` : ''}`,
                )}
              >
                <span>
                  <small>Continue{label ? ` · Question ${label}` : ''}</small>
                  <strong>
                    {resume.id === 'kinematics-review'
                      ? 'Kinematics Review'
                      : assignmentTitle(resume.id)}
                  </strong>
                  <small>
                    {findCourse(resume.course).shortTitle} · {resume.teacher}
                  </small>
                </span>
                <Icon name="arrow" />
              </a>
            )}
            <div className="section-heading">
              <h2>Coming up</h2>
              <a href={url('calendar/')}>
                Calendar
                <Icon name="arrow" size={16} />
              </a>
            </div>
            <div className="event-list">
              {next.map((e) => (
                <a className="event-row" key={e.id} href={url(eventPath(e))}>
                  <span className="event-date">
                    <strong>
                      {new Date(e.start! + 'T12:00Z').getUTCDate()}
                    </strong>
                    <small>
                      {new Intl.DateTimeFormat('en', {
                        month: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(e.start! + 'T12:00Z'))}
                    </small>
                  </span>
                  <span className="event-copy">
                    <strong>{eventTitle(e)}</strong>
                    <small>
                      {e.course
                        ? findCourse(e.course).shortTitle
                        : 'No classes'}
                    </small>
                  </span>
                  <Icon name="arrow" size={17} />
                </a>
              ))}
              {!next.length && <p className="muted">No new dates confirmed.</p>}
            </div>
          </section>
        )}
        <section className="my-courses">
          <div className="section-heading">
            <h2>{chooser ? 'Current courses' : 'Current work'}</h2>
            <a className="quiet" href={url('account/')}>
              Manage
              <Icon name="more" size={15} />
            </a>
          </div>
          <div className="course-workspaces">
            {added.map((c) => (
              <a
                className="course-row"
                data-course={c.id}
                key={c.id}
                href={url(`courses/${c.id}/`)}
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
            <a className="primary" href={url('account/')}>
              Choose courses
            </a>
          )}
          {chooser && (
            <a className="quiet" href={url()}>
              Back to Home
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
