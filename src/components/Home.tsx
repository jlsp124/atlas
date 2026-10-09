import { assignments, concepts, findEdition } from '../content/catalog';
import {
  workspaceCourses,
  assignmentTitle,
  topicTitle,
  unitTitle,
} from '../content/workspaces';
import { schoolDate } from '../core/dates';
import {
  schoolCalendar,
  schoolYearDetails,
  schoolYearClock,
} from '../core/school-calendar';
import { useEffect, useState } from 'react';
import { atlasVersion } from '../content/product';
import { japaneseWeek } from '../content/japanese';
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
  const state = useLearner();
  const [now, setNow] = useState(() => new Date(build?.builtAt ?? Date.now()));
  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const today = schoolDate(now);
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
          <h1>{chooser ? 'Your courses' : 'Your atlas'}</h1>
        </div>
        <a className="quiet" href={url('account/')}>
          <Icon name="more" />
          <span className="sr-only">Manage your setup</span>
        </a>
      </div>
      <div className={`home-grid ${chooser ? 'course-chooser' : ''}`}>
        <section className="my-courses">
          <div className="section-heading">
            <h2>Courses</h2>
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
                    {c.id === 'japanese'
                      ? japaneseWeek.title
                      : unitTitle(c.id, findEdition(c.id).currentUnit)}
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
        {!chooser && resume && (
          <a className="continue-row" href={url(resume.path)}>
            <span>
              <small>Pick up where you left off</small>
              <strong>{resume.title}</strong>
            </span>
            <Icon name="arrow" />
          </a>
        )}
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
              title={`Calendar time from September 8 to the end of June 29. ${year.elapsed} of ${year.total} instructional days have elapsed.`}
            >
              <b>{schoolYearClock(now)}%</b> of the school year elapsed
            </a>
          )}
          {build?.sourceLines !== undefined && (
            <span title="Nonblank lines in src, server and scripts, calculated for this build.">
              <b>{build.sourceLines.toLocaleString('en-CA')}</b> lines of code
            </span>
          )}
          {build?.updates !== undefined && (
            <span title="Source updates included in this release, measured from the full Git history.">
              <b>{build.updates}</b> updates
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
