import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import {
  assignments,
  concepts,
  findCourse,
  questions,
  sources,
} from '../content/catalog';
import {
  assignmentTitle,
  assignmentUnits,
  learningPlan,
  topicTitle,
  unitTitle,
  unitUrl,
} from '../content/workspaces';
import { taskDone, variant } from '../core/learning';
import { emit, url, useLearner } from '../client/store';
import Glossary from './Glossary';
import { Icon } from './Icons';
import { Lesson } from './Lesson';
import Sheet from './Sheet';
export default function Assignment({ id }: { id: string }) {
  const a = assignments.find((a) => a.id === id)!,
    state = useLearner(),
    unit = assignmentUnits[id],
    plan = learningPlan(a);
  const [source, setSource] = useState(false),
    [learn, setLearn] = useState(false),
    [index, setIndex] = useState(0),
    [review, setReview] = useState<string[]>([]),
    [message, setMessage] = useState(''),
    [answers, setAnswers] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null),
    position = useRef(0),
    trigger = useRef<HTMLButtonElement>(null);
  const practice = [
    ...new Map(
      a.concepts.flatMap((cid) => {
        const q = questions.find(
          (q) => q.concepts.includes(cid) && q.level === 'construction',
        );
        return q ? [[q.id, variant(q, 6)] as const] : [];
      }),
    ).values(),
  ].slice(0, 3);
  const formula = concepts.find(
    (c) => a.concepts.includes(c.id) && c.formula,
  )?.formula;
  function close() {
    setLearn(false);
    dialog.current?.close();
    requestAnimationFrame(() => {
      window.scrollTo({ top: position.current, behavior: 'instant' });
      trigger.current?.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    if (learn && !dialog.current?.open) dialog.current?.showModal();
  }, [learn]);
  return (
    <div className="assignment-screen" data-course={a.course}>
      <div className="breadcrumbs">
        <a href={url(`courses/${a.course}/`)}>
          {findCourse(a.course).shortTitle}
        </a>
        <span>/</span>
        <a href={url(unitUrl(a.course, unit, 'classwork'))}>
          {unitTitle(a.course, unit)}
        </a>
        <span>/</span>
        <span>Classwork</span>
      </div>
      <div className="assignment-layout">
        <article className="assignment-document">
          <div className="assignment-meta">
            <span>Original atlas companion</span>
            <span>{a.teacher}</span>
          </div>
          <h1>{assignmentTitle(id)}</h1>
          <p className="intro">
            <Glossary text={a.summary} />
          </p>
          {formula && (
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(formula, {
                  displayMode: true,
                  throwOnError: false,
                  trust: false,
                }),
              }}
            />
          )}
          <ol className="task-list">
            {a.tasks.map((t, i) => (
              <li className="assignment-task" id={t.id} key={t.id}>
                <div className="task-heading">
                  <span className="task-number">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2>{t.title}</h2>
                  <label>
                    <input
                      type="checkbox"
                      aria-label={t.title}
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
                    <span>Done</span>
                  </label>
                </div>
                <p>
                  <Glossary text={t.instructions} />
                </p>
              </li>
            ))}
          </ol>
          <section className="original-checks">
            <h2>A few checks</h2>
            <p>
              Original practice for this companion. Try each one before opening
              its answer.
            </p>
            {practice.map((q, i) => (
              <div className="original-question" key={q.id}>
                <p>
                  <strong>{i + 1}.</strong> <Glossary text={q.prompt} />
                </p>
                {q.choices && (
                  <ol type="a">
                    {q.choices.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                )}
                <button
                  className="secondary"
                  aria-expanded={answers.includes(q.id)}
                  onClick={() =>
                    setAnswers((old) =>
                      old.includes(q.id)
                        ? old.filter((x) => x !== q.id)
                        : [...old, q.id],
                    )
                  }
                >
                  {answers.includes(q.id) ? 'Hide answer' : 'Check answer'}
                </button>
                {answers.includes(q.id) && (
                  <div className="solution">
                    <strong>
                      {Array.isArray(q.answer) ? q.answer[0] : String(q.answer)}
                      {q.unitLabel ? ' ' + q.unitLabel : ''}
                    </strong>
                    <Glossary text={q.explanation} />
                  </div>
                )}
              </div>
            ))}
          </section>
        </article>
        <aside className="assignment-sidebar">
          <button
            ref={trigger}
            className="primary"
            disabled={!state.ready}
            onClick={() => {
              position.current = window.scrollY;
              setIndex(0);
              setReview([]);
              setMessage('');
              setLearn(true);
            }}
          >
            Learn this first
            <Icon name="arrow" size={16} />
          </button>
          <p>
            A short path through the ideas this work uses. Then right back here.
          </p>
          <button className="quiet" onClick={() => setSource(true)}>
            Original & sources
            <Icon name="external" size={15} />
          </button>
          <p>
            {a.tasks.filter((t) => taskDone(id, t.id, state.events)).length} of{' '}
            {a.tasks.length} sections checked
          </p>
        </aside>
      </div>
      {message && (
        <div className="return-notice" role="status">
          {message}
          <button
            className="icon-button"
            aria-label="Dismiss"
            onClick={() => setMessage('')}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <Sheet
        open={source}
        title="Original & sources"
        onClose={() => setSource(false)}
      >
        <p>
          This is an original atlas companion. Keep your teacher’s handout for
          the exact assigned questions.
        </p>
        {a.originalUrl && (
          <a
            className="primary"
            href={a.originalUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open class resource
            <Icon name="external" size={16} />
          </a>
        )}
        <details>
          <summary>Source details</summary>
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
        </details>
      </Sheet>
      <dialog
        ref={dialog}
        className="learning-modal"
        aria-label="Learn this first"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        {learn && (
          <div className="flow-screen" data-course={a.course}>
            <div className="flow-top">
              <button className="quiet" onClick={close}>
                <Icon name="back" size={16} />
                Back to worksheet
              </button>
              <span>
                {index + 1} of {plan.length} · {topicTitle(plan[index])}
              </span>
            </div>
            <div className="flow-track">
              <span style={{ width: `${(index / plan.length) * 100}%` }} />
            </div>
            <Lesson
              key={plan[index]}
              id={plan[index]}
              onComplete={(good) => {
                const needs = good ? review : [...review, plan[index]];
                setReview(needs);
                if (index + 1 === plan.length) {
                  close();
                  setMessage(
                    needs.length
                      ? 'Back to the worksheet. Keep an eye on ' +
                          needs.map(topicTitle).join(', ') +
                          '.'
                      : 'Ready. Back to the worksheet.',
                  );
                } else setIndex((i) => i + 1);
              }}
            />
          </div>
        )}
      </dialog>
    </div>
  );
}
