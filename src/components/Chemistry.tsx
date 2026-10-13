import { useEffect, useState } from 'react';
import { assignments, findCourse, schedule } from '../content/catalog';
import { assignmentUnits, unitTitle } from '../content/workspaces';
import { chemistryLabs } from '../content/chemistry-labs';
import { url } from '../client/store';
import { schoolDate, displayUpcomingDate } from '../core/dates';
import { CourseMark, Icon } from './Icons';
import '../styles/chemistry.css';

export type ChemistryView = 'assignments' | 'notes' | 'labs';
export function ChemistryNavigation({
  view,
  unit,
}: {
  view: ChemistryView;
  unit?: string;
}) {
  const base = unit ? `courses/chemistry/units/${unit}/` : 'courses/chemistry/';
  return (
    <nav className="chem-navigation" aria-label="Chemistry sections">
      {(['assignments', 'notes', 'labs'] as const).map((kind) => (
        <a
          key={kind}
          href={url(`${base}?view=${kind}`)}
          aria-current={kind === view ? 'page' : undefined}
        >
          {kind[0].toUpperCase() + kind.slice(1)}
        </a>
      ))}
    </nav>
  );
}
export default function Chemistry({ unit }: { unit?: string }) {
  const [view, setView] = useState<ChemistryView>('assignments');
  useEffect(() => {
    const value = new URLSearchParams(location.search).get('view');
    if (['assignments', 'notes', 'labs'].includes(value ?? ''))
      setView(value as ChemistryView);
  }, []);
  const course = findCourse('chemistry');
  const units = unit
    ? course.units.filter((u) => u.id === unit)
    : [...course.units].sort(
        (a, b) =>
          (a.status === 'current' ? 0 : 1) - (b.status === 'current' ? 0 : 1),
      );
  const matches = assignments.filter(
    (a) =>
      a.course === 'chemistry' &&
      (!unit || assignmentUnits[a.id] === unit) &&
      (view === 'labs'
        ? a.kind === 'lab'
        : view === 'notes'
          ? ['notes', 'resource'].includes(a.kind ?? '')
          : !['notes', 'resource', 'lab'].includes(a.kind ?? '')),
  );
  const coming = schedule.filter(
    (e) => e.course === 'chemistry' && e.start && e.start >= schoolDate(),
  );
  return (
    <div className="chem-screen course-screen" data-course="chemistry">
      {unit && (
        <div className="breadcrumbs">
          <a href={url('courses/chemistry/')}>
            <Icon name="back" size={16} />
            Chemistry
          </a>
        </div>
      )}
      <header className="course-heading">
        <CourseMark course="chemistry" />
        <div>
          <p className="meta">Mrs. Cote</p>
          <h1>{unit ? unitTitle('chemistry', unit) : course.title}</h1>
        </div>
        <a
          className="quiet"
          href="https://mrstcote.wordpress.com/"
          target="_blank"
          rel="noreferrer"
        >
          Class resources <Icon name="external" size={15} />
        </a>
      </header>
      <ChemistryNavigation view={view} unit={unit} />
      {view === 'labs' && (
        <p className="chem-intro">
          Prepare, observe and explain using the real lab sheet. Expected
          chemistry and your observed results stay separate.
        </p>
      )}
      {units
        .filter(
          (u) =>
            matches.some((a) => assignmentUnits[a.id] === u.id) ||
            (view === 'notes' && u.id === 'bonding'),
        )
        .map((u) => (
          <section
            className="chem-material-section"
            key={u.id}
            aria-label={u.title}
          >
            <div className="section-heading">
              <h2>{u.title}</h2>
              {!unit && (
                <a href={url(`courses/chemistry/units/${u.id}/?view=${view}`)}>
                  Open unit <Icon name="arrow" size={14} />
                </a>
              )}
            </div>
            <div className="chem-material-list">
              {matches
                .filter((a) => assignmentUnits[a.id] === u.id)
                .map((a) => (
                  <a
                    className="chem-material-row"
                    key={a.id}
                    data-material={a.id}
                    href={url(`work/${a.id}/`)}
                  >
                    <Icon
                      name={
                        view === 'labs'
                          ? 'lab'
                          : view === 'notes'
                            ? 'book'
                            : 'document'
                      }
                      size={18}
                    />
                    <span>
                      <strong>{a.title}</strong>
                      <small>
                        {a.assistance === 'independent-only'
                          ? 'Formal hand-in · instructions only'
                          : view === 'labs'
                            ? `${chemistryLabs.find((l) => l.id === a.id)?.source} · date unconfirmed`
                            : view === 'notes'
                              ? 'Class reference'
                              : a.questionReferences?.join(' · ')}
                      </small>
                    </span>
                    <Icon name="arrow" size={16} />
                  </a>
                ))}
            </div>
            {view === 'notes' && u.id === 'bonding' && (
              <a
                className="chem-material-row"
                href={url('work/chemistry-hebden-bonding/?reference=1')}
              >
                <Icon name="book" size={18} />
                <span>
                  <strong>Other captured Hebden questions</strong>
                  <small>p.182 · 80, 81, 83 · outside the assigned range</small>
                </span>
                <Icon name="arrow" size={16} />
              </a>
            )}
          </section>
        ))}
      {!matches.length && (
        <p className="chem-intro">No {view} are recorded for this unit.</p>
      )}
      {coming.length > 0 && (
        <section className="chem-coming">
          <h2>Coming up</h2>
          {coming.map((e) => (
            <a key={e.id} href={url('calendar/?course=chemistry')}>
              <span>{e.title}</span>
              <small>{displayUpcomingDate(e.start!)}</small>
              <Icon name="arrow" size={14} />
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
