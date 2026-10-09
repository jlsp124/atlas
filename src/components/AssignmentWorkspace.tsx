import { useEffect, useRef, useState } from 'react';
import { assignments, concepts, findCourse, sources } from '../content/catalog';
import {
  assignmentUnits,
  topicTitle,
  unitTitle,
  unitUrl,
} from '../content/workspaces';
import { taskDone } from '../core/learning';
import {
  assignmentProgress,
  questionStep,
  dueQuestions,
  statusLabel,
  type WorkStatus,
} from '../core/assignment-progress';
import { makeWalkthrough } from '../core/walkthrough';
import { emit, url, useLearner } from '../client/store';
import Glossary from './Glossary';
import { Icon } from './Icons';
import Sheet from './Sheet';
import LearningVisual from './LearningVisual';
import CompanionQuestion from './CompanionQuestion';
import QuestionWalkthrough from './QuestionWalkthrough';
import JapaneseConnections from './JapaneseConnections';
import PercentError from './PercentError';

export default function AssignmentWorkspace({ id }: { id: string }) {
  const a = assignments.find((a) => a.id === id)!;
  const state = useLearner();
  const restricted = a.assistance === 'independent-only';
  const japanese = a.course === 'japanese';
  const physics = a.course === 'physics';
  const questions = restricted ? [] : (a.companionQuestions ?? []);
  const progress = assignmentProgress(a, state.events);
  const [source, setSource] = useState(false),
    [learn, setLearn] = useState<string[]>([]);
  const [active, setActive] = useState<string>(),
    [step, setStep] = useState(0);
  const [locationReady, setLocationReady] = useState(false);
  const [review, setReview] = useState(false),
    [reviewFinished, setReviewFinished] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const paperPosition = useRef(0),
    helpPosition = useRef(0),
    trigger = useRef<HTMLElement | null>(null);
  const focusHeading = useRef<HTMLDivElement>(null);
  const q = questions.find((q) => q.id === active);
  const activeIndex = questions.findIndex((q) => q.id === active);
  const sections = [...new Set(questions.map((q) => q.section))];
  const due = dueQuestions(a, state.events);
  const scope = state.user?.id ?? 'guest';

  function readLocation() {
    const checkpoint = location.hash.slice(1);
    const target = questions.find(
      (q) => q.id === checkpoint || `q-${q.id}` === checkpoint,
    );
    setActive(target?.id);
    const n = Number(new URLSearchParams(location.search).get('step'));
    setStep(Number.isSafeInteger(n) && n >= 0 && n <= 100 ? n : 0);
    setLocationReady(true);
  }
  useEffect(() => {
    readLocation();
    setReview(japanese && new URLSearchParams(location.search).has('review'));
    window.addEventListener('popstate', readLocation);
    window.addEventListener('hashchange', readLocation);
    return () => {
      window.removeEventListener('popstate', readLocation);
      window.removeEventListener('hashchange', readLocation);
    };
  }, []);
  useEffect(() => {
    if (
      !physics ||
      !state.ready ||
      active ||
      !new URLSearchParams(location.search).has('focus')
    )
      return;
    const saved = [...state.events]
      .reverse()
      .find(
        (e) =>
          (e.type === 'checkpoint_saved' || e.type === 'assignment_progress') &&
          e.payload.assignment === id,
      );
    const checkpoint =
      saved?.type === 'checkpoint_saved'
        ? saved.payload.checkpoint
        : saved?.type === 'assignment_progress'
          ? saved.payload.question
          : undefined;
    const target = questions.find((q) => q.id === checkpoint) ?? questions[0];
    if (target) openQuestion(target.id);
  }, [physics, state.ready, active, id]);
  useEffect(() => {
    if (q) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      focusHeading.current?.focus({ preventScroll: true });
      const selected = document.querySelector<HTMLElement>(
        '.question-index [aria-current=step]',
      );
      if (
        selected?.parentElement &&
        selected.parentElement.scrollWidth > selected.parentElement.clientWidth
      )
        selected.parentElement.scrollLeft = Math.max(
          0,
          selected.offsetLeft - selected.parentElement.offsetLeft - 20,
        );
    }
  }, [active]);
  useEffect(() => {
    setQueue([]);
    setReviewFinished(false);
  }, [scope]);
  useEffect(() => {
    if (state.ready && review && !queue.length && !reviewFinished) {
      const ids = due.map((q) => q.id);
      setQueue(ids);
      if (ids.length) openQuestion(ids[0]);
      else setReviewFinished(true);
    }
  }, [state.ready, review, scope]);

  function saveProgress(question: string, at: number, done?: boolean) {
    const allDone =
      done === true &&
      questions.every((q) => q.id === question || progress.completed.has(q.id));
    emit('assignment_progress', {
      assignment: id,
      question,
      step: at,
      done,
      status:
        progress.status === 'complete' || (!physics && allDone)
          ? 'complete'
          : 'in-progress',
    });
  }
  function openQuestion(question: string) {
    if (!active) paperPosition.current = window.scrollY;
    const at = questionStep(id, question, state.events);
    history.pushState(null, '', `${url(`work/${id}/`)}?step=${at}#${question}`);
    setActive(question);
    setStep(at);
    setReviewFinished(false);
    saveProgress(question, at);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function changeStep(at: number) {
    if (!q) return;
    setStep(at);
    history.replaceState(null, '', `${url(`work/${id}/`)}?step=${at}#${q.id}`);
    saveProgress(q.id, at);
  }
  function showDocument() {
    history.pushState(null, '', url(`work/${id}/`));
    setActive(undefined);
    setReview(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: paperPosition.current, behavior: 'instant' });
      document.getElementById(`open-${active}`)?.focus({ preventScroll: true });
    });
  }
  function nextQuestion() {
    const list = review && queue.length ? queue : questions.map((q) => q.id);
    const next = list[list.indexOf(active!) + 1];
    if (next) openQuestion(next);
    else {
      showDocument();
      setReviewFinished(true);
    }
  }
  function openLearn(ids: string[], element: HTMLElement) {
    helpPosition.current = window.scrollY;
    trigger.current = element;
    setLearn(ids);
  }
  function closeLearn() {
    setLearn([]);
    requestAnimationFrame(() => {
      window.scrollTo({ top: helpPosition.current, behavior: 'instant' });
      trigger.current?.focus({ preventScroll: true });
    });
  }
  function status(value: WorkStatus) {
    emit('assignment_progress', { assignment: id, status: value });
  }

  return (
    <div
      className={`assignment-screen paper-workspace ${q ? 'question-focused' : ''}`}
      data-course={a.course}
      data-ready={state.ready}
      data-location-ready={locationReady}
    >
      <div className="breadcrumbs">
        <a href={url(`courses/${a.course}/`)}>
          {findCourse(a.course).shortTitle}
        </a>
        <span>/</span>
        <a href={url(unitUrl(a.course, assignmentUnits[id]))}>
          {unitTitle(a.course, assignmentUnits[id])}
        </a>
        <span>/</span>
        <span>{a.kind === 'textbook' ? 'Textbook work' : 'Materials'}</span>
      </div>
      <div className="document-toolbar">
        {q ? (
          <button className="quiet" onClick={showDocument}>
            <Icon name="document" size={17} />
            Whole assignment
          </button>
        ) : !physics ? (
          <p className="meta">{a.teacher}</p>
        ) : (
          <span />
        )}
        <div className="document-tools">
          {!physics && (
            <label className="work-status">
              <span className="sr-only">Assignment status</span>
              <select
                aria-label="Assignment status"
                value={progress.status}
                disabled={!state.ready}
                onChange={(e) => status(e.target.value as WorkStatus)}
              >
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="quiet" onClick={() => setSource(true)}>
            <Icon name="external" size={15} />
            Sources
          </button>
        </div>
      </div>
      {q && (
        <div className="focused-title" ref={focusHeading} tabIndex={-1}>
          <h1>{a.title}</h1>
          <span className="desktop-question-count">
            {activeIndex + 1} / {questions.length}
          </span>
          <label className="mobile-question-jump">
            <span className="sr-only">Jump to question</span>
            <select value={q.id} onChange={(e) => openQuestion(e.target.value)}>
              {questions.map((item) => (
                <option key={item.id} value={item.id}>
                  Question {item.number}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {!q && questions.length > 0 && (
        <div className="assignment-resume">
          <p>
            {japanese
              ? `${due.length} words ready to review`
              : !physics && progress.completed.size
                ? `${progress.completed.size} of ${questions.length} questions done on paper`
                : 'Keep your assignment beside you. Write your working there.'}
          </p>
          <button
            className="primary"
            disabled={!state.ready}
            onClick={() => openQuestion(progress.question ?? questions[0].id)}
          >
            {progress.question
              ? `Continue question ${questions.find((q) => q.id === progress.question)?.number}`
              : japanese
                ? 'Start review'
                : 'Start with question ' + questions[0].number}
            <Icon name="arrow" size={16} />
          </button>
          {japanese && (
            <button
              className="quiet"
              disabled={!state.ready || !due.length}
              onClick={() => {
                setQueue(due.map((q) => q.id));
                setReview(true);
                openQuestion(due[0].id);
              }}
            >
              Review due words
            </button>
          )}
        </div>
      )}
      {reviewFinished && !physics && (
        <p className="review-finished" role="status">
          Review finished. Easy returns in four days, Okay tomorrow, and Hard in
          ten minutes.
        </p>
      )}
      <div className="focus-loading" role="status">
        <p>
          <span className="loading-wordmark">
            atlas<span>.</span>
          </span>
          <span>Opening your question…</span>
        </p>
        <div className="focus-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <a href={url(`work/${id}/`)}>Whole assignment</a>
      </div>
      <div className="document-layout">
        <article className={`assignment-document ${q ? 'focused-paper' : ''}`}>
          {q ? (
            japanese ? (
              <div className="japanese-review">
                <p className="paper-meta">
                  {review ? 'Due review' : 'In class · recall practice'}
                </p>
                <CompanionQuestion
                  key={q.id}
                  question={q}
                  assignment={a}
                  onLearn={(el) => openLearn(q.concepts, el)}
                />
                <div className="japanese-review-footer">
                  <button
                    className="secondary"
                    disabled={activeIndex === 0}
                    onClick={() => openQuestion(questions[activeIndex - 1].id)}
                  >
                    <Icon name="back" size={16} />
                    Previous word
                  </button>
                  <button className="primary" onClick={nextQuestion}>
                    Next word
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <QuestionWalkthrough
                key={q.id}
                assignment={a}
                question={q}
                step={step}
                onStep={changeStep}
                done={progress.completed.has(q.id)}
                onDone={() =>
                  saveProgress(
                    q.id,
                    Math.min(step, makeWalkthrough(a, q).steps.length - 1),
                    true,
                  )
                }
                next={
                  physics || activeIndex < questions.length - 1
                    ? nextQuestion
                    : undefined
                }
                finalQuestion={activeIndex === questions.length - 1}
                onLearn={(el) => openLearn(q.concepts, el)}
              />
            )
          ) : (
            <>
              <div className="assignment-meta">
                <span>{a.kind?.replace('-', ' ') ?? 'School material'}</span>
                <span>{a.due ? `Due ${a.due}` : 'Your class material'}</span>
              </div>
              <h1>{a.title}</h1>
              <p className="intro">{a.summary}</p>
              {a.questionReferences?.length ? (
                <p className="source-meta">
                  {a.questionReferences.join(' · ')}
                </p>
              ) : null}
              {restricted ? (
                <p className="restricted-work">
                  Use your original handout. The due date is{' '}
                  {a.due ?? 'not confirmed'}.
                </p>
              ) : (
                <>
                  {japanese && <JapaneseConnections assignment={id} />}
                  {id === 'physics-basic-skills' && <PercentError />}
                  {a.reading?.map((r, i) => (
                    <section
                      className="companion-reading"
                      key={r.heading}
                      id={`reading-${i}`}
                    >
                      <h2>
                        <Glossary text={r.heading} />
                      </h2>
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
                        <Icon name="help" size={15} />
                      </button>
                    </section>
                  ))}
                  {sections.map((section) => (
                    <section className="companion-section" key={section}>
                      <h2>{section}</h2>
                      <ol className="paper-questions">
                        {questions
                          .filter((q) => q.section === section)
                          .map((q) => (
                            <li
                              className="document-question"
                              id={q.id}
                              data-question={q.id}
                              key={q.id}
                            >
                              <span className="document-question-number">
                                {q.number}
                              </span>
                              <div>
                                <p>
                                  <Glossary text={q.prompt} />
                                </p>
                                <a
                                  className="question-link"
                                  id={`open-${q.id}`}
                                  href={`?step=${questionStep(id, q.id, state.events)}#${q.id}`}
                                  aria-label={`${japanese ? 'Review' : 'Walk through'} question ${q.number}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openQuestion(q.id);
                                  }}
                                >
                                  {progress.completed.has(q.id) ? (
                                    <>
                                      <Icon name="check" size={14} />
                                      {physics
                                        ? 'Walk through again'
                                        : 'Done on paper · revisit'}
                                    </>
                                  ) : (
                                    <>
                                      {japanese ? 'Review' : 'Walk through'}
                                      <Icon name="arrow" size={14} />
                                    </>
                                  )}
                                </a>
                              </div>
                            </li>
                          ))}
                      </ol>
                    </section>
                  ))}
                  {!questions.length && !a.reading?.length && (
                    <div className="material-empty">
                      <Icon name="book" size={24} />
                      <h2>Keep the original beside you</h2>
                      <p>
                        This material points to work on your class sheet. Open a
                        relevant explanation below or use the original resource.
                      </p>
                      <button
                        className="secondary"
                        onClick={(e) =>
                          openLearn(a.concepts.slice(0, 2), e.currentTarget)
                        }
                      >
                        Explain the main idea
                      </button>
                    </div>
                  )}
                  {!physics && (
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
                        This records your progress. It does not submit work to
                        your teacher.
                      </p>
                    </details>
                  )}
                </>
              )}
            </>
          )}
        </article>
        <aside className="document-index" aria-label="Assignment navigation">
          {questions.length > 0 && (
            <>
              <h2>{japanese ? 'Words' : 'Questions'}</h2>
              <nav className="question-index" aria-label="Question numbers">
                {questions.map((item) => (
                  <a
                    href={`#${item.id}`}
                    key={item.id}
                    aria-label={`Question ${item.number}${progress.completed.has(item.id) ? ', done' : ''}`}
                    aria-current={q?.id === item.id ? 'step' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      openQuestion(item.id);
                    }}
                  >
                    <span>{item.number}</span>
                    {progress.completed.has(item.id) && (
                      <Icon name="check" size={12} />
                    )}
                  </a>
                ))}
              </nav>
            </>
          )}
          {!restricted && (
            <div className="material-tools">
              <h2>For this work</h2>
              <button
                className="quiet"
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
                Explain an idea
                <Icon name="help" size={15} />
              </button>
              {a.download && (
                <a className="quiet" href={url(a.download)} download>
                  Practice template
                  <Icon name="external" size={15} />
                </a>
              )}
              {id === 'wadson-formal-lab' && (
                <a
                  className="quiet"
                  href={url('downloads/wadson-formal-lab-template.html')}
                  download
                >
                  Editable lab template
                </a>
              )}
            </div>
          )}
          {!restricted && a.originalUrl && (
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
          atlas uses original explanations. For exact wording, tables and
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
        title="Explain this idea"
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
          Back to assignment
          <Icon name="back" size={16} />
        </button>
      </Sheet>
    </div>
  );
}
