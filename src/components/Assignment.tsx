import { useEffect } from 'react';
import {
  assignments,
  concepts,
  questions,
  findCourse,
} from '../content/catalog';
import { assignmentPriority, evidence, taskDone } from '../core/learning';
import { emit, track, url, useLearner } from '../client/store';
import { displayDate } from '../core/dates';
import Graph from './Graph';

export default function Assignment({ id }: { id: string }) {
  const state = useLearner();
  const a = assignments.find((a) => a.id === id)!;
  const p = assignmentPriority(a, state.events, questions);
  const done = a.tasks.filter((t) => taskDone(id, t.id, state.events)).length;
  useEffect(() => track('assignment_opened', a.course), [a.course]);
  return (
    <>
      <div className="breadcrumbs">
        <a href={url(`courses/${a.course}/work/`)}>
          {findCourse(a.course).title} / Work
        </a>
        <span>Original companion</span>
      </div>
      <p className="eyebrow">
        {a.teacher} ·{' '}
        {a.assigned ? `Captured ${displayDate(a.assigned)}` : 'Current course'}
      </p>
      <h1 className="reading-title">{a.title}</h1>
      <p className="lede">{a.summary}</p>
      <div className="meta-line">
        <span className="badge">
          {a.due ? `Due ${displayDate(a.due)}` : 'Due date not confirmed'}
        </span>
        <span className="badge">{p.label}</span>
      </div>
      <div className="assignment-layout">
        <section>
          <div className="section-heading">
            <h2>Your checklist</h2>
            <span>
              {done} / {a.tasks.length}
            </span>
          </div>
          <p className="small muted">
            {p.reason} Completion is your local checklist, not a submission to
            your teacher.
          </p>
          <div className="task-list">
            {a.tasks.map((t, i) => (
              <label className="task" key={t.id}>
                <input
                  type="checkbox"
                  disabled={!state.ready}
                  checked={taskDone(id, t.id, state.events)}
                  onChange={(e) => {
                    emit('assignment_task', {
                      assignment: id,
                      task: t.id,
                      done: e.target.checked,
                    });
                    if (e.target.checked && done + 1 === a.tasks.length)
                      track('assignment_completed', a.course);
                  }}
                />
                <span>
                  <small className="eyebrow">TASK {i + 1}</small>
                  <strong>{t.title}</strong>
                  <span>{t.instructions}</span>
                </span>
              </label>
            ))}
          </div>
          <section className="original-source">
            <h2>The original work</h2>
            <p>{a.originalAvailability}</p>
            <p className="small muted">{a.notes}</p>
            {a.originalUrl && (
              <a href={a.originalUrl} target="_blank" rel="noreferrer">
                Open original resource location ↗
              </a>
            )}
          </section>
        </section>
        <aside className="assignment-context">
          <h2>What this practices</h2>
          <ul className="concept-context-list">
            {a.concepts.map((id) => {
              const c = concepts.find((c) => c.id === id)!;
              return (
                <li key={id}>
                  <a href={url(`concepts/${id}/`)}>{c.title}</a>
                  <span className="evidence-state">
                    {evidence(id, state.events, questions).state}
                  </span>
                </li>
              );
            })}
          </ul>
          <a
            className="primary"
            href={url(
              `courses/${a.course}/practice/?target=${a.concepts[0]}&mode=Review%20this%20branch`,
            )}
          >
            Practise this branch →
          </a>
          <h3>Helpful prerequisites</h3>
          <ul>
            {a.prerequisites.map((id) => (
              <li key={id}>
                <a href={url(`concepts/${id}/`)}>
                  {concepts.find((c) => c.id === id)?.title}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={url(
              `courses/${a.course}/practice/?target=${a.concepts[0]}&mode=Fill%20my%20gaps`,
            )}
          >
            I’m stuck · find the gap →
          </a>
          <Graph course={a.course} focus={a.concepts.at(-1)} />
        </aside>
      </div>
    </>
  );
}
