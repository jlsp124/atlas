import { useId, useState } from 'react';
import { concepts, coverageItems, questions } from '../content/catalog';
import {
  coverage,
  evaluate,
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
  const [attempts, setAttempts] = useState(0),
    [tiny, setTiny] = useState(false),
    [tinyAnswer, setTinyAnswer] = useState('');
  const [started, setStarted] = useState(() => Date.now());
  const current = queue[index]
    ? variant(queue[index], seed + index)
    : undefined;
  function reset() {
    setAnswer('');
    setUnit('');
    setHint(false);
    setResult(null);
    setAttempts(0);
    setTiny(false);
    setTinyAnswer('');
    setStarted(Date.now());
  }
  function check() {
    if (!current || !answer.trim() || result !== null) return;
    const correct = evaluate(current, answer, unit);
    setAttempts((n) => n + 1);
    setResult(correct);
    setResults((r) => [
      ...r,
      {
        concept: current.concepts[0],
        correct,
        independent: !hint && attempts === 0,
      },
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
  const repairQuestion = current
    ? questions.find(
        (q) =>
          q.id !== current.id &&
          q.concepts.includes(current.diagnosis) &&
          q.level === 'recognition' &&
          q.format === 'choice',
      )
    : undefined;
  function retryOriginal() {
    setResult(null);
    setTiny(false);
    setTinyAnswer('');
    setHint(true);
    setResults((r) => r.slice(0, -1));
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
              <Glossary text={result ? current.explanation : current.hint} />
            </p>
            {!result && (
              <>
                <p>Use that clue, then try the original again.</p>
                <button className="secondary" onClick={retryOriginal}>
                  Try again
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setTiny(true);
                  }}
                >
                  Fix this first
                  <Icon name="arrow" size={16} />
                </button>
              </>
            )}
            {tiny && (
              <div className="tiny-repair">
                <h3>One small thing first</h3>
                <p>{concepts.find((c) => c.id === current.diagnosis)?.model}</p>
                {repairQuestion ? (
                  <fieldset className="answer-choices">
                    <legend>{repairQuestion.prompt}</legend>
                    {repairQuestion.choices?.map((choice) => (
                      <label className="answer-choice" key={choice}>
                        <input
                          type="radio"
                          name="tiny-repair"
                          checked={tinyAnswer === choice}
                          onChange={() => setTinyAnswer(choice)}
                        />
                        {choice}
                      </label>
                    ))}
                    {tinyAnswer &&
                      tinyAnswer !== String(repairQuestion.answer) && (
                        <p>{repairQuestion.hint}</p>
                      )}
                    <button
                      className="secondary"
                      disabled={tinyAnswer !== String(repairQuestion.answer)}
                      onClick={retryOriginal}
                    >
                      Back to the original question
                    </button>
                  </fieldset>
                ) : (
                  <button className="secondary" onClick={retryOriginal}>
                    Back to the original question
                  </button>
                )}
              </div>
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
