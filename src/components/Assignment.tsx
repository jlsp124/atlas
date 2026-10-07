import { useRef, useState } from 'react';
import { assignments, concepts, findCourse, sources } from '../content/catalog';
import {
  assignmentUnits,
  topicTitle,
  unitTitle,
  unitUrl,
} from '../content/workspaces';
import { taskDone } from '../core/learning';
import { emit, url, useLearner } from '../client/store';
import Glossary from './Glossary';
import { Icon } from './Icons';
import Sheet from './Sheet';
import LearningVisual from './LearningVisual';
import CompanionQuestion from './CompanionQuestion';
import JapaneseConnections from './JapaneseConnections';
import PercentError from './PercentError';

export default function Assignment({ id }: { id: string }) {
  const a = assignments.find((a) => a.id === id)!,
    state = useLearner();
  const [source, setSource] = useState(false),
    [learn, setLearn] = useState<string[]>([]);
  const position = useRef(0),
    trigger = useRef<HTMLElement | null>(null);
  const restricted = a.assistance === 'independent-only';
  function openLearn(ids: string[], element: HTMLElement) {
    position.current = window.scrollY;
    trigger.current = element;
    setLearn(ids);
  }
  function closeLearn() {
    setLearn([]);
    requestAnimationFrame(() => {
      window.scrollTo({ top: position.current, behavior: 'instant' });
      trigger.current?.focus({ preventScroll: true });
    });
  }
  const sections = [...new Set(a.companionQuestions?.map((q) => q.section))];
  return (
    <div className="assignment-screen" data-course={a.course}>
      <div className="breadcrumbs">
        <a href={url(`courses/${a.course}/`)}>
          {findCourse(a.course).shortTitle}
        </a>
        <span>/</span>
        <a href={url(unitUrl(a.course, assignmentUnits[id], 'classwork'))}>
          {unitTitle(a.course, assignmentUnits[id])}
        </a>
        <span>/</span>
        <span>Classwork</span>
      </div>
      <div className="assignment-layout">
        <article className="assignment-document">
          <div className="assignment-meta">
            <span>
              {a.kind === 'independent-study'
                ? 'Independent study'
                : 'Classwork companion'}
            </span>
            <span>{a.teacher}</span>
          </div>
          <h1>{a.title}</h1>
          <p className="intro">{a.summary}</p>
          {a.questionReferences?.length ? (
            <p className="source-meta">{a.questionReferences.join(' · ')}</p>
          ) : null}
          {restricted ? (
            <p className="restricted-work">
              Use your original handout. The due date is{' '}
              {a.due ?? 'not confirmed'}.
            </p>
          ) : (
            <>
              {a.course === 'japanese' && (
                <JapaneseConnections assignment={id} />
              )}
              {id === 'physics-basic-skills' && <PercentError />}
              {a.reading?.map((r, index) => (
                <section
                  className="companion-reading"
                  key={r.heading}
                  id={`reading-${index}`}
                >
                  <h2>{r.heading}</h2>
                  <p>
                    <Glossary text={r.text} />
                  </p>
                  <button
                    className="quiet"
                    onClick={(e) =>
                      openLearn(r.concepts.slice(0, 2), e.currentTarget)
                    }
                  >
                    Explain this
                  </button>
                </section>
              ))}
              {sections.map((section) => (
                <section className="companion-section" key={section}>
                  <h2>{section}</h2>
                  {a.companionQuestions
                    ?.filter((q) => q.section === section)
                    .map((q) => (
                      <CompanionQuestion
                        key={q.id}
                        question={q}
                        assignment={a}
                        nextId={
                          a.companionQuestions?.[
                            a.companionQuestions.findIndex(
                              (item) => item.id === q.id,
                            ) + 1
                          ]?.id
                        }
                        onLearn={(element) => openLearn(q.concepts, element)}
                      />
                    ))}
                </section>
              ))}
              {!a.companionQuestions?.length && !a.reading?.length && (
                <p>
                  Open the part you need below, then return to the numbered work
                  on your class sheet.
                </p>
              )}
              <details className="progress-checklist">
                <summary>Mark a section finished</summary>
                {a.tasks.map((t) => (
                  <label className="task-progress" key={t.id}>
                    <input
                      type="checkbox"
                      disabled={!state.ready}
                      checked={Boolean(taskDone(id, t.id, state.events))}
                      onChange={(e) =>
                        emit('assignment_task', {
                          assignment: id,
                          task: t.id,
                          done: e.target.checked,
                        })
                      }
                    />
                    {t.title}
                  </label>
                ))}
                <p className="source-meta">
                  This records your progress. It does not submit work to your
                  teacher.
                </p>
              </details>
            </>
          )}
        </article>
        <aside className="assignment-sidebar">
          {!restricted && (
            <>
              <button
                className="primary"
                disabled={!state.ready}
                onClick={(e) =>
                  openLearn(
                    (a.prerequisites.length
                      ? a.prerequisites
                      : a.concepts
                    ).slice(0, 3),
                    e.currentTarget,
                  )
                }
              >
                Learn this first
                <Icon name="arrow" size={16} />
              </button>
              <p>Open just the idea you need, then return here.</p>
              {a.download && (
                <a className="secondary" href={url(a.download)} download>
                  Download practice template
                  <Icon name="external" size={15} />
                </a>
              )}
              {id === 'wadson-formal-lab' && (
                <a
                  className="quiet"
                  href={url('downloads/wadson-formal-lab-template.html')}
                  download
                >
                  Download editable lab template
                </a>
              )}
            </>
          )}
          <button className="quiet" onClick={() => setSource(true)}>
            Original & sources
            <Icon name="external" size={15} />
          </button>
          {a.originalUrl && (
            <a
              className="quiet"
              href={a.originalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open class resource
              <Icon name="external" size={15} />
            </a>
          )}
        </aside>
      </div>
      <Sheet
        open={source}
        title="Original & sources"
        onClose={() => setSource(false)}
      >
        <p>{a.originalAvailability}</p>
        <p>
          Atlas uses original explanations. For exact wording, tables and
          figures, keep your teacher’s handout or textbook beside it.
        </p>
        {a.sources.map((id) => {
          const s = sources.find((s) => s.id === id)!;
          return (
            <p key={id}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              <small className="source-meta">
                {s.author} · checked {s.checked}
              </small>
            </p>
          );
        })}
      </Sheet>
      <Sheet
        open={learn.length > 0}
        title="Learn this first"
        onClose={closeLearn}
      >
        {learn.map((id) => {
          const c = concepts.find((c) => c.id === id)!;
          return (
            <section className="tiny-lesson" key={id}>
              <h3>{topicTitle(id)}</h3>
              <p>
                <Glossary text={c.model} />
              </p>
              <LearningVisual id={id} />
              <details>
                <summary>Show me an example</summary>
                <p>{c.example.prompt}</p>
                <ol>
                  {c.example.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </details>
              <details>
                <summary>More detail</summary>
                <p>{c.deeper}</p>
              </details>
            </section>
          );
        })}
        <button className="primary" onClick={closeLearn}>
          Back to worksheet
          <Icon name="back" size={16} />
        </button>
      </Sheet>
    </div>
  );
}
