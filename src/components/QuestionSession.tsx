import { useId, useState } from 'react';
import { concepts, coverageItems, questions } from '../content/catalog';
import {
  coverage,
  evaluate,
  nearestGap,
  selectQuestions,
  variant,
  type PracticeMode,
} from '../core/learning';
import { emit, getState, track, url } from '../client/store';
import { topicTitle } from '../content/workspaces';
import Glossary from './Glossary';
import { Icon } from './Icons';
export type SessionResult = {
  concept: string;
  correct: boolean;
  independent: boolean;
};
export default function QuestionSession({
  course,
  ids,
  mode = 'Quick check',
  count = 3,
  onFinish,
  onRepair,
  skipSummary = false,
}: {
  course: string;
  ids: string[];
  mode?: PracticeMode;
  count?: number;
  onFinish: (good: boolean) => void;
  onRepair?: (id: string, retry: () => void) => void;
  skipSummary?: boolean;
}) {
  const formId = useId();
  const [seed] = useState(() => Date.now() % 1000000000);
  const [queue] = useState(() =>
    selectQuestions(
      questions,
      coverageItems,
      getState().events,
      mode,
      ids,
      count,
      seed,
    ),
  );
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(''),
    [unit, setUnit] = useState(''),
    [hint, setHint] = useState(false),
    [result, setResult] = useState<boolean | null>(null),
    [results, setResults] = useState<SessionResult[]>([]);
  const [started, setStarted] = useState(() => Date.now());
  const current = queue[index]
    ? variant(queue[index], seed + index)
    : undefined;
  function reset() {
    setAnswer('');
    setUnit('');
    setHint(false);
    setResult(null);
    setStarted(Date.now());
  }
  function check() {
    if (!current || !answer.trim() || result !== null) return;
    const correct = evaluate(current, answer, unit);
    setResult(correct);
    setResults((r) => [
      ...r,
      { concept: current.concepts[0], correct, independent: !hint },
    ]);
    emit('question_answered', {
      question: current.id,
      concept: current.concepts[0],
      correct,
      hints: hint ? 1 : 0,
      seed: seed + index,
      durationMs: Math.min(3600000, Math.max(0, Date.now() - started)),
    });
  }
  function next() {
    if (skipSummary && index + 1 === queue.length) {
      onFinish(results.every((r) => r.correct && r.independent));
      return;
    }
    if (index + 1 === queue.length)
      track('quiz_completed', course, ids.length === 1 ? ids[0] : undefined);
    setIndex((i) => i + 1);
    reset();
  }
  if (!current) {
    const report = coverage(
      coverageItems.filter(
        (i) => i.course === course && ids.includes(i.concept),
      ),
      getState().events,
      questions,
    );
    const bad = [
        ...new Set(
          results
            .filter((r) => !r.correct || !r.independent)
            .map((r) => r.concept),
        ),
      ],
      good = [
        ...new Set(
          results
            .filter((r) => r.correct && !bad.includes(r.concept))
            .map((r) => r.concept),
        ),
      ];
    return (
      <>
        <div className="flow-body session-summary">
          <h1>
            {queue.length
              ? bad.length
                ? 'Worth another look'
                : 'Looks good'
              : 'I haven’t added questions here yet.'}
          </h1>
          {good.length > 0 && (
            <section className="summary-group">
              <h2>Looks good</h2>
              <ul>
                {good.map((id) => (
                  <li key={id}>{topicTitle(id)}</li>
                ))}
              </ul>
            </section>
          )}
          {bad.length > 0 && (
            <section className="summary-group">
              <h2>Review</h2>
              <ul>
                {bad.map((id) => (
                  <li key={id}>
                    <a href={url(`learn/${id}/`)}>{topicTitle(id)}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {report.unseen.length > 0 && (
            <section className="summary-group">
              <h2>Still to check · {report.unseen.length}</h2>
              <details>
                <summary>You haven’t been tested on these yet.</summary>
                <ul>
                  {report.unseen.map((i) => (
                    <li key={i.id}>
                      <a href={url(`learn/${i.concept}/`)}>{i.title}</a>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          )}
        </div>
        <div className="flow-footer">
          <span className="meta">
            Keep practising anything that still feels shaky.
          </span>
          <button
            className="primary"
            onClick={() => onFinish(queue.length > 0 && bad.length === 0)}
          >
            Continue
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      <div
        className="flow-body question-session"
        data-question={current.id}
        data-seed={seed + index}
      >
        <p className="step-meta">
          {index + 1} of {queue.length}
        </p>
        <h1 className="question-prompt">
          <Glossary text={current.prompt} />
        </h1>
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          {current.format === 'choice' ? (
            <fieldset className="answer-choices" disabled={result !== null}>
              <legend className="sr-only">Choose an answer</legend>
              {current.choices?.map((choice) => (
                <label className="answer-choice" key={choice}>
                  <input
                    type="radio"
                    name="answer"
                    value={choice}
                    checked={answer === choice}
                    onChange={() => setAnswer(choice)}
                  />
                  <span lang={course === 'japanese' ? 'ja' : undefined}>
                    {choice}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="answer-inputs">
              <label>
                Your answer
                <input
                  autoComplete="off"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={result !== null}
                  inputMode={current.format === 'numeric' ? 'decimal' : 'text'}
                  lang={course === 'japanese' ? 'ja' : undefined}
                />
              </label>
              {current.unitLabel && (
                <label>
                  Unit
                  <input
                    value={unit}
                    autoComplete="off"
                    disabled={result !== null}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </label>
              )}
            </div>
          )}
        </form>
        {result === null && (
          <button className="quiet" onClick={() => setHint(true)}>
            Give me a hint
          </button>
        )}
        {hint && (
          <p className="question-hint">
            <Glossary text={current.hint} />
          </p>
        )}
        {result !== null && (
          <div className="question-feedback" role="status">
            <h2>
              {result ? (
                <>
                  <Icon name="check" />
                  That’s it.
                </>
              ) : (
                'Let’s check the reasoning.'
              )}
            </h2>
            <p>
              <Glossary text={current.explanation} />
            </p>
            {!result && onRepair && (
              <>
                <p>This is probably the part getting in your way.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    const gap =
                      nearestGap(
                        current.concepts[0],
                        concepts,
                        getState().events,
                        questions,
                      ) ?? current.diagnosis;
                    onRepair(gap, () => {
                      setResults((r) => r.slice(0, -1));
                      reset();
                    });
                  }}
                >
                  Fix this first
                  <Icon name="arrow" size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flow-footer">
        <span className="meta">{topicTitle(current.concepts[0])}</span>
        {result === null ? (
          <button
            className="primary"
            type="submit"
            form={formId}
            disabled={!answer.trim()}
          >
            Check answer
          </button>
        ) : (
          <button className="primary" onClick={next}>
            Continue
            <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
    </>
  );
}
