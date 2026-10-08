import { assignments, concepts, findEdition } from '../content/catalog';
import {
  workspaceCourses,
  assignmentTitle,
  topicTitle,
  unitTitle,
} from '../content/workspaces';
import { schoolDate } from '../core/dates';
import { schoolCalendar, schoolYearDetails } from '../core/school-calendar';
import { atlasVersion } from '../content/product';
import type { RepoStats } from '../../scripts/repo-stats';
import { useLearner, url } from '../client/store';
import { CourseMark, Icon } from './Icons';
import { assignmentProgress } from '../core/assignment-progress';
export default function Home({
  chooser = false,
  build,
}: {
  chooser?: boolean;
  build?: RepoStats;
}) {
  const state = useLearner(),
    today = schoolDate();
  const added = workspaceCourses.filter((c) => state.selected.includes(c.id));
  const year = schoolYearDetails(today);
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
      {!chooser && (
        <div className="school-context">
          <div className="school-coordinate" aria-hidden="true">
            <span />
            <span />
            <i />
          </div>
          <div>
            <p className="meta">
              School District 57 ·{' '}
              {year ? schoolCalendar.year : 'College Heights'}
            </p>
            <h2>College Heights</h2>
            <p>Your classes, close at hand.</p>
          </div>
        </div>
      )}
      <div className={`home-grid ${chooser ? 'course-chooser' : ''}`}>
        {!chooser && resume && (
          <a className="continue-row" href={url(resume.path)}>
            <span>
              <small>Pick up where you left off</small>
              <strong>{resume.title}</strong>
            </span>
            <Icon name="arrow" />
          </a>
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
        <div className="home-footnote home-details">
          {year?.winterDays !== undefined && (
            <span>
              <b>{year.winterDays}</b> days to winter break
            </span>
          )}
          {year && (
            <a
              href={schoolCalendar.source}
              target="_blank"
              rel="noreferrer"
              title={`${year.elapsed} of ${year.total} district instructional days have elapsed; today is excluded.`}
            >
              <b>{year.percent}%</b> of school days behind us
            </a>
          )}
          {build?.sourceLines !== undefined && (
            <span title="Nonblank lines in src, server and scripts, calculated for this build.">
              about <b>{build.sourceLines.toLocaleString('en-CA')}</b> lines of
              Atlas
            </span>
          )}
          {build?.commits !== undefined && (
            <span title="Commits reachable from this release; measured from the full Git history.">
              <b>{build.commits}</b> commits so far
            </span>
          )}
          <a href={url('about/')} className="atlas-version">
            atlas. {atlasVersion}
          </a>
        </div>
      )}
    </div>
  );
}
