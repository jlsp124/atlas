import { assignments, findCourse } from '../content/catalog';
import { assignmentUnits, unitTitle } from '../content/workspaces';
import { assignmentProgress } from '../core/assignment-progress';
import { emit, url, useLearner } from '../client/store';
import { Icon } from './Icons';

export default function PhysicsUnit({ unit }: { unit: string }) {
  const state = useLearner();
  const work = assignments.filter(
    (a) => a.course === 'physics' && assignmentUnits[a.id] === unit,
  );
  const isLab = (a: (typeof work)[number]) =>
    a.kind === 'lab' || a.id === 'wadson-formal-lab';
  const groups = [
    {
      title: 'Assignments',
      items: work.filter((a) => a.kind !== 'notes' && !isLab(a)),
      complete: true,
    },
    {
      title: 'Notes',
      items: work.filter((a) => a.kind === 'notes' && !isLab(a)),
      complete: false,
    },
    { title: 'Labs', items: work.filter(isLab), complete: false },
  ];
  return (
    <div className="unit-screen physics-unit" data-course="physics">
      <div className="breadcrumbs">
        <a href={url('courses/physics/')}>
          <Icon name="back" size={16} />
          {findCourse('physics').shortTitle}
        </a>
        <span>/</span>
        <span>Units</span>
      </div>
      <header className="unit-header">
        <h1>{unitTitle('physics', unit)}</h1>
      </header>
      {groups
        .filter((g) => g.items.length)
        .map((group) => (
          <section
            className="physics-material-section"
            key={group.title}
            aria-label={group.title}
          >
            <h2>{group.title}</h2>
            <div className="physics-material-list">
              {group.items.map((a) => {
                const p = assignmentProgress(a, state.events);
                return (
                  <div
                    className="physics-material-row"
                    key={a.id}
                    data-material={a.id}
                  >
                    <a href={url(`work/${a.id}/`)}>
                      <Icon
                        name={
                          group.title === 'Labs'
                            ? 'lab'
                            : group.title === 'Notes'
                              ? 'book'
                              : 'document'
                        }
                        size={18}
                      />
                      <span>{a.title}</span>
                      <Icon name="arrow" size={16} />
                    </a>
                    {group.complete && (
                      <button
                        className="assignment-check"
                        aria-label={`${p.status === 'complete' ? 'Mark incomplete' : 'Mark complete'}: ${a.title}`}
                        aria-pressed={p.status === 'complete'}
                        title={
                          p.status === 'complete'
                            ? 'Complete · click to undo'
                            : 'Mark assignment complete'
                        }
                        disabled={!state.ready}
                        onClick={() =>
                          emit('assignment_progress', {
                            assignment: a.id,
                            status:
                              p.status === 'complete'
                                ? p.question
                                  ? 'in-progress'
                                  : 'not-started'
                                : 'complete',
                          })
                        }
                      >
                        <Icon name="check" size={16} />
                        <span className="sr-only">
                          {p.status === 'complete'
                            ? 'Complete'
                            : 'Not complete'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
