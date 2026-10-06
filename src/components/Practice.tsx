import { useEffect, useState } from 'react';
import {
  concepts,
  coverageItems,
  questions,
  findCourse,
} from '../content/catalog';
import {
  coverage,
  evaluate,
  hash,
  modes,
  nearestGap,
  prerequisitePath,
  selectQuestions,
  variant,
  type PracticeMode,
} from '../core/learning';
import { emit, track, url, useLearner } from '../client/store';
import type { Question } from '../core/schema';

export default function Practice({
  course,
  initialTarget = '',
  compact = false,
}: {
  course: string;
  initialTarget?: string;
  compact?: boolean;
}) {
  const state = useLearner();
  const [mode, setMode] = useState<PracticeMode>('Quick check');
  const [target, setTarget] = useState(initialTarget);
  const [unit, setUnit] = useState('');
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(1);
  const [answer, setAnswer] = useState('');
  const [unitAnswer, setUnitAnswer] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const [started, setStarted] = useState(0);
  const [repair, setRepair] = useState('');
  const [saved, setSaved] = useState<{
    queue: Question[];
    index: number;
  } | null>(null);
  useEffect(() => {
    if (compact) return;
    const query = new URLSearchParams(window.location.search);
    const t = query.get('target');
    const m = query.get('mode');
    const u = query.get('unit');
    if (t && concepts.some((c) => c.id === t && c.course === course))
      setTarget(t);
    if (modes.includes(m as PracticeMode)) setMode(m as PracticeMode);
    if (u && findCourse(course).units.some((x) => x.id === u)) setUnit(u);
  }, [course, compact]);
  const pool = concepts.filter(
    (c) =>
      c.course === course && (!unit || c.unit === unit) && c.depth === 'core',
  );
  const current = queue[index] ? variant(queue[index], seed) : undefined;
  const lesson = concepts.find(
    (c) => c.id === (repair || current?.concepts[0] || target),
  );
  const report = coverage(
    coverageItems.filter((i) => pool.some((c) => c.id === i.concept)),
    state.events,
    questions,
  );
  function resetAnswer() {
    setAnswer('');
    setUnitAnswer('');
    setResult(null);
    setHint(false);
    setStarted(performance.now());
  }
  function start() {
    const newSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    setSeed(newSeed);
    let ids = pool.map((c) => c.id);
    if (
      target &&
      [
        'Quick check',
        'Learn this',
        'Review this branch',
        'Fill my gaps',
      ].includes(mode)
    )
      ids =
        mode === 'Review this branch'
          ? prerequisitePath(target, concepts)
          : [
              mode === 'Learn this' || mode === 'Fill my gaps'
                ? (nearestGap(target, concepts, state.events, questions) ??
                  target)
                : target,
            ];
    setQueue(
      selectQuestions(
        questions,
        coverageItems,
        state.events,
        mode,
        ids,
        mode === 'Test simulation'
          ? 12
          : compact || mode === 'Learn this'
            ? 3
            : 6,
        newSeed,
      ),
    );
    setIndex(0);
    setRepair('');
    setSaved(null);
    resetAnswer();
    track('quiz_started', course, target || undefined);
  }
  function check() {
    if (!current || !answer.trim() || result !== null) return;
    const correct = evaluate(current, answer, unitAnswer);
    setResult(correct);
    emit('question_answered', {
      question: current.id,
      concept: current.concepts[0],
      correct,
      hints: hint ? 1 : 0,
      seed,
      durationMs: Math.min(3600000, Math.round(performance.now() - started)),
    });
  }
  function next() {
    setIndex((i) => i + 1);
    resetAnswer();
    if (index + 1 === queue.length)
      track('quiz_completed', course, target || undefined);
  }
  function repairGap() {
    if (!current) return;
    const id =
      nearestGap(current.concepts[0], concepts, state.events, questions) ??
      current.diagnosis;
    setSaved({ queue, index });
    setRepair(id);
    setQueue(
      selectQuestions(
        questions,
        coverageItems,
        state.events,
        'Learn this',
        [id],
        3,
        seed,
      ),
    );
    setIndex(0);
    resetAnswer();
    track('gap_repair_started', course, id);
  }
  function retry() {
    if (!saved) return;
    track('gap_repair_completed', course, repair);
    setQueue(saved.queue);
    setIndex(saved.index);
    setRepair('');
    setSaved(null);
    resetAnswer();
  }
  const choices = current?.choices
    ? [...current.choices].sort((a, b) => hash(a + seed) - hash(b + seed))
    : [];
  return (
    <section
      className={`practice-workspace ${compact ? 'compact' : ''}`}
      aria-label="Practice workspace"
    >
      {!compact && (
        <>
          <p className="eyebrow">{findCourse(course).title} / PRACTICE</p>
          <h1>
            Make it stick<span className="title-dot">.</span>
          </h1>
          <p className="lede">
            A few good questions. The right next connection.
          </p>
        </>
      )}
      {!queue.length ? (
        <>
          <div className="practice-setup">
            <label>
              Practice mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PracticeMode)}
              >
                {modes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            {!compact && (
              <label>
                Unit
                <select
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setTarget('');
                  }}
                >
                  <option value="">All reviewed units</option>
                  {findCourse(course)
                    .units.filter((u) => u.status !== 'upcoming')
                    .map((u) => (
                      <option value={u.id} key={u.id}>
                        {u.title}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              Focus
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">All ideas in this scope</option>
                {pool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="small muted">
            {mode === 'Learn this'
              ? 'We check the nearest missing prerequisite, then teach and practise that branch.'
              : mode === 'Coverage sweep'
                ? 'Never-tested reviewed core items receive first priority. Coverage is independent of a correct answer.'
                : mode === 'Test simulation'
                  ? 'Twelve mixed questions from reviewed scope. This does not predict the teacher’s test.'
                  : 'Newly tested items, confusion and due reviews inform selection. Recognition alone cannot establish stable evidence.'}
          </p>
          <button className="primary" onClick={start}>
            Start {mode.toLowerCase()} <span aria-hidden="true">→</span>
          </button>
        </>
      ) : current ? (
        <>
          <div className="practice-progress">
            <span>
              {repair ? 'Repairing one connection' : mode} · {index + 1} of{' '}
              {queue.length}
            </span>
            <span className="badge">{current.level}</span>
            <button
              className="quiet"
              onClick={() => {
                setQueue([]);
                setSaved(null);
              }}
            >
              End session
            </button>
          </div>
          {(repair || mode === 'Learn this') && lesson && (
            <aside className="teaching-block">
              <p className="eyebrow">
                {repair ? 'THE CONNECTION TO CHECK' : '30-SECOND MODEL'} ·{' '}
                {lesson.title}
              </p>
              <p>{lesson.model}</p>
              <details>
                <summary>Why it works & an example</summary>
                <p>{lesson.why}</p>
                <p>
                  <strong>{lesson.example.prompt}</strong>
                </p>
                <ol>
                  {lesson.example.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </details>
              <a href={url(`concepts/${lesson.id}/`)}>
                Open the full explanation ↗
              </a>
            </aside>
          )}
          <form
            className="question-block"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <h2>{current.prompt}</h2>
            {current.format === 'choice' ? (
              <fieldset disabled={result !== null}>
                <legend className="sr-only">Choose an answer</legend>
                {choices.map((a) => (
                  <label
                    className={`choice ${answer === a ? 'selected' : ''}`}
                    key={a}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={a}
                      checked={answer === a}
                      onChange={() => setAnswer(a)}
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <div className="answer-fields">
                <label>
                  Your answer
                  <input
                    autoComplete="off"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={result !== null}
                    inputMode={
                      current.format === 'numeric' ? 'decimal' : 'text'
                    }
                    placeholder={
                      current.format === 'numeric'
                        ? 'Value, e.g. -2.5 or 1.2e3'
                        : 'Short answer; kana where requested'
                    }
                  />
                </label>
                {current.format === 'numeric' && (
                  <label>
                    Unit
                    <input
                      value={unitAnswer}
                      onChange={(e) => setUnitAnswer(e.target.value)}
                      disabled={result !== null}
                      placeholder={`e.g. ${current.unitLabel}`}
                    />
                  </label>
                )}
              </div>
            )}
            {result === null && (
              <div className="button-row">
                <button
                  className="primary"
                  type="submit"
                  disabled={!answer.trim()}
                >
                  Check answer
                </button>
                <button
                  className="quiet"
                  type="button"
                  onClick={() => {
                    setHint(true);
                    track('hint_used', course, current.concepts[0]);
                  }}
                >
                  Give me a hint
                </button>
              </div>
            )}
            {hint && (
              <p className="hint">
                {current.hint} · This attempt will count as exposure, with a
                hint recorded.
              </p>
            )}
          </form>
          {result !== null && (
            <div
              className={`feedback ${result ? 'correct' : 'incorrect'}`}
              role="status"
              aria-live="polite"
            >
              <h3>
                {result ? 'That holds up.' : 'Let’s check the reasoning.'}
              </h3>
              <p>{current.explanation}</p>
              {!result && (
                <>
                  <p className="small">
                    Expected short answer:{' '}
                    {Array.isArray(current.answer)
                      ? current.answer[0]
                      : current.answer}
                    {current.unitLabel ? ` ${current.unitLabel}` : ''}. This is
                    a possible concept gap, not a confirmed diagnosis.
                  </p>
                  <button className="secondary" onClick={repairGap}>
                    Check the missing prerequisite →
                  </button>
                </>
              )}
              <div className="button-row">
                <a href={url(`concepts/${current.concepts[0]}/#map`)}>
                  See the concept & connections
                </a>
                <button className="primary" onClick={next}>
                  {index + 1 === queue.length
                    ? 'See coverage'
                    : 'Next question →'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="session-summary">
          <p className="eyebrow">SESSION COMPLETE</p>
          <h2>Another connection made.</h2>
          <p>
            {report.tested.length} / {report.total} reviewed core items
            meaningfully tested. {report.unseen.length} still unseen;{' '}
            {report.weak.length} have a recent unhinted miss.
          </p>
          {saved ? (
            <button className="primary" onClick={retry}>
              Retry the original question →
            </button>
          ) : (
            <button className="primary" onClick={() => setQueue([])}>
              Choose the next check →
            </button>
          )}
          <a className="subtle-link" href={url(`courses/${course}/learn/`)}>
            Open your course coverage
          </a>
        </div>
      )}
      {course === 'japanese' && (
        <p className="integrity-note small">
          Independent study only. Your class prohibits AI/translator-written
          submitted work. Typed practice does not assess handwriting or
          pronunciation.
        </p>
      )}
    </section>
  );
}
