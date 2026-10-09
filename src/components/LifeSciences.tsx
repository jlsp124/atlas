import { findCourse, schedule } from '../content/catalog';
import { displayUpcomingDate, schoolDate } from '../core/dates';
import { eventPath, eventTitle, unitTitle } from '../content/workspaces';
import {
  lifeMaterials,
  lifeMaterialPath,
  lifeNotesUrl,
  lifeIdeaPath,
} from '../content/life-sciences';
import { url } from '../client/store';
import { CourseMark, Icon } from './Icons';
import '../styles/life-sciences.css';

export function LifeNavigation({ current }: { current: string }) {
  return (
    <nav className="life-navigation" aria-label="Life Sciences sections">
      {[
        ['Assignments', 'courses/life-sciences/', 'assignments'],
        ['Key ideas', lifeIdeaPath(), 'key-ideas'],
        ['Review', 'courses/life-sciences/review/', 'definitions'],
      ].map(([label, path, feature]) => (
        <a
          key={feature}
          href={url(path)}
          aria-current={current === feature ? 'page' : undefined}
          data-atlas-feature={feature}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
export function LifeNotesLink() {
  return (
    <a
      className="life-notes-link"
      href={lifeNotesUrl}
      target="_blank"
      rel="noreferrer"
      data-atlas-feature="notes"
    >
      <span>
        <strong>Class notes</strong>
        <small>Mr. Bleecker’s site</small>
      </span>
      <Icon name="external" size={18} />
    </a>
  );
}
export function LifeMaterialList({
  unit,
  assignment,
}: {
  unit?: string;
  assignment?: string;
}) {
  return (
    <div className="life-material-list">
      {lifeMaterials
        .filter(
          (m) =>
            (!unit || m.unit === unit) &&
            (!assignment || m.assignment === assignment),
        )
        .map((m) => (
          <a
            key={m.id}
            className="life-material-row"
            href={url(lifeMaterialPath(m.id))}
            data-atlas-feature="assignments"
          >
            <span>
              <strong>{m.title}</strong>
              <small>{m.detail}</small>
            </span>
            {m.kind === 'reference' ? (
              <small className="life-material-type">Reference</small>
            ) : (
              <small className="life-material-type">
                {m.questions.length}{' '}
                {m.kind === 'video' ? 'prompts' : 'questions'}
              </small>
            )}
            <Icon name="arrow" size={17} />
          </a>
        ))}
    </div>
  );
}
export default function LifeSciences({ unit }: { unit?: string }) {
  const course = findCourse('life-sciences');
  const coming = schedule
    .filter(
      (e) =>
        e.course === course.id &&
        e.start &&
        e.start >= schoolDate() &&
        ['quiz', 'test'].includes(e.type),
    )
    .slice(0, 2);
  const chapters = unit
    ? course.units.filter((u) => u.id === unit)
    : [...course.units].sort((a, b) =>
        a.id === 'origins' ? -1 : b.id === 'origins' ? 1 : 0,
      );
  return (
    <div className="life-screen" data-course="life-sciences">
      {unit && (
        <div className="breadcrumbs">
          <a href={url('courses/life-sciences/')}>
            <Icon name="back" size={16} />
            Life Sciences
          </a>
        </div>
      )}
      <header className="course-heading">
        <CourseMark course="life-sciences" />
        <div>
          <p className="meta">Mr. Bleecker</p>
          <h1>{unit ? unitTitle(course.id, unit) : course.title}</h1>
        </div>
      </header>
      <LifeNavigation current="assignments" />
      <LifeNotesLink />
      {chapters.map((chapter) => (
        <section className="life-chapter" key={chapter.id}>
          <div className="section-heading">
            <h2>{chapter.title}</h2>
            {chapter.id === 'origins' && !unit && (
              <span className="meta">Current material</span>
            )}
          </div>
          {lifeMaterials.some((m) => m.unit === chapter.id) ? (
            <LifeMaterialList unit={chapter.id} />
          ) : (
            <p className="life-resource-empty">
              New assignments will appear when the class material is reviewed.{' '}
              <a
                href="https://sites.google.com/view/ecl-life-sciences-11/bio1/c19-microbes"
                target="_blank"
                rel="noreferrer"
              >
                Class resources <Icon name="external" size={14} />
              </a>
            </p>
          )}
        </section>
      ))}
      {coming.length > 0 && (
        <section className="life-coming">
          <h2>Coming up</h2>
          {coming.map((e) => (
            <a key={e.id} href={url(eventPath(e))}>
              {eventTitle(e)}
              <small>{displayUpcomingDate(e.start!)}</small>
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
