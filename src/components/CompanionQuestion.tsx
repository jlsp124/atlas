import { useId, useState } from 'react';
import type { Assignment, CompanionQuestion as Question } from '../core/schema';
import {
  checkCompanionAnswer,
  latestDifficulty,
  repairStage,
} from '../core/companion';
import { emit, useLearner } from '../client/store';
import Glossary from './Glossary';
import LearningVisual from './LearningVisual';
import ReadableText from './ReadableText';

export default function CompanionQuestion({
  question: q,
  assignment: a,
  nextId,
  onLearn,
}: {
  question: Question;
  assignment: Assignment;
  nextId?: string;
  onLearn: (element: HTMLElement) => void;
}) {
  const state = useLearner(),
    field = useId();
  const [value, setValue] = useState(''),
    [unit, setUnit] = useState(''),
    [direction, setDirection] = useState('');
  const [panel, setPanel] = useState(''),
    [hints, setHints] = useState(0),
    [attempts, setAttempts] = useState(0),
    [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean | null;
    feedback: string;
  } | null>(null);
  const [repair, setRepair] = useState(false),
    [repairAnswer, setRepairAnswer] = useState('');
  const rating = latestDifficulty(a.id, q.id, state.events);
  function help(
    action: 'asking' | 'hint' | 'example' | 'explanation' | 'reveal',
  ) {
    setPanel(panel === action ? '' : action);
    if (action === 'hint') setHints((n) => Math.min(10, n + 1));
    if (action === 'reveal') setRevealed(true);
    emit('companion_help', {
      assignment: a.id,
      question: q.id,
      concept: q.concepts[0],
      action,
    });
  }
  function check() {
    const result = checkCompanionAnswer(q, value, unit, direction);
    setFeedback(result);
    if (result.correct !== null) {
      const next = attempts + 1;
      setAttempts(next);
      emit('companion_attempt', {
        assignment: a.id,
        question: q.id,
        concept: q.concepts[0],
        correct: result.correct,
        hints,
        revealed,
      });
      if (!result.correct && repairStage(next) === 'tiny-check')
        setRepair(true);
    } else setPanel('checklist');
  }
  return (
    <div className="companion-question" id={q.id} data-question={q.id}>
      <h3>
        <span className="question-number">{q.number}</span>
        <span className="question-prompt">
          <Glossary text={q.prompt} />
        </span>
      </h3>
      <div className="context-actions">
        <button
          className="quiet"
          aria-expanded={panel === 'asking'}
          onClick={() => help('asking')}
        >
          What is this asking?
        </button>
        <button className="quiet" onClick={(e) => onLearn(e.currentTarget)}>
          What do I need to know?
        </button>
      </div>
      {panel === 'asking' && (
        <div className="question-context">
          <p>
            <ReadableText text={q.asking} />
          </p>
          {q.clues.map((c) => (
            <p key={c.word}>
              <strong>
                <ReadableText text={c.word} />
              </strong>{' '}
              → <ReadableText text={c.explanation} />
            </p>
          ))}
          <details>
            <summary>Walk through the setup</summary>
            <ol>
              {q.steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <p>
                    <ReadableText text={step.text} />
                  </p>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        {q.input === 'choice' ? (
          <fieldset className="answer-choices">
            <legend className="sr-only">Choose an answer for {q.number}</legend>
            {q.choices?.map((c) => (
              <label className="answer-choice" key={c}>
                <input
                  name={field}
                  type="radio"
                  disabled={!state.ready}
                  checked={value === c}
                  onChange={() => setValue(c)}
                />
                <ReadableText text={c} />
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="answer-inputs">
            <label htmlFor={field}>
              {q.input === 'japanese'
                ? 'Write in Japanese'
                : q.input === 'numeric'
                  ? 'Your answer'
                  : 'Your explanation'}
            </label>
            {q.input === 'text' ? (
              <textarea
                id={field}
                disabled={!state.ready}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
              />
            ) : (
              <input
                id={field}
                disabled={!state.ready}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode={q.input === 'numeric' ? 'decimal' : 'text'}
                autoComplete="off"
                lang={q.input === 'japanese' ? 'ja' : undefined}
              />
            )}
            {q.answer?.unit && (
              <label>
                Unit
                <input
                  disabled={!state.ready}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  autoComplete="off"
                />
              </label>
            )}
            {q.answer?.directions?.length ? (
              <label>
                Direction in words
                <input
                  disabled={!state.ready}
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  autoComplete="off"
                />
              </label>
            ) : null}
          </div>
        )}
        <div className="context-actions">
          <button
            className="secondary"
            type="submit"
            disabled={!state.ready || !value.trim()}
          >
            Check answer
          </button>
          <button className="quiet" type="button" onClick={() => help('hint')}>
            Give me a hint
          </button>
        </div>
      </form>
      {panel === 'hint' && (
        <p className="question-hint">
          <ReadableText
            text={q.hints[Math.min(Math.max(0, hints - 1), q.hints.length - 1)]}
          />
        </p>
      )}
      {feedback && (
        <p className="question-feedback" role="status">
          {feedback.feedback}
        </p>
      )}
      {repair && (
        <fieldset className="tiny-repair">
          <legend>One small thing first</legend>
          <p>
            <ReadableText text={q.repair.prompt} />
          </p>
          {q.repair.choices.map((c) => (
            <label className="answer-choice" key={c}>
              <input
                type="radio"
                name={field + '-repair'}
                checked={repairAnswer === c}
                onChange={() => setRepairAnswer(c)}
              />
              <ReadableText text={c} />
            </label>
          ))}
          <button
            className="secondary"
            disabled={!repairAnswer}
            onClick={() => {
              if (repairAnswer === q.repair.answer) {
                setRepair(false);
                setFeedback({
                  correct: null,
                  feedback:
                    'Good. Return to the original question and try your answer again.',
                });
              }
            }}
          >
            Check this idea
          </button>
          {repairAnswer && repairAnswer !== q.repair.answer && (
            <p>
              <ReadableText text={q.repair.explanation} />
            </p>
          )}
        </fieldset>
      )}
      {panel === 'checklist' && (
        <ul className="answer-checklist">
          {q.checklist?.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      <details className="more-help">
        <summary>More help</summary>
        <div className="context-actions">
          <button className="quiet" onClick={() => help('example')}>
            Show me an example
          </button>
          <button className="quiet" onClick={() => help('explanation')}>
            Explain this
          </button>
          {q.answer && (
            <button className="quiet" onClick={() => help('reveal')}>
              Show answer & reasoning
            </button>
          )}
        </div>
        {panel === 'example' && (
          <p>
            <ReadableText text={q.example} />
          </p>
        )}
        {panel === 'explanation' && (
          <>
            <p>
              <ReadableText text={q.hints[0]} />
            </p>
            <LearningVisual id={q.concepts[0]} />
          </>
        )}
        {panel === 'reveal' && q.answer && (
          <div className="solution">
            <p>
              <strong>
                <ReadableText text={String(q.answer.value)} /> {q.answer.unit}{' '}
                {q.answer.directions?.[0]}
              </strong>
            </p>
            <small>
              {q.answer.origin === 'teacher'
                ? 'Teacher-provided answer'
                : q.answer.origin === 'student'
                  ? 'User-supplied answer'
                  : 'Atlas-derived solution · round to the question’s precision'}
            </small>
            <p>
              <ReadableText text={q.answer.reasoning} />
            </p>
            <p>
              Watch for: <ReadableText text={q.answer.commonMistake} />
            </p>
          </div>
        )}
      </details>
      <div
        className="difficulty-rating"
        role="group"
        aria-label={`How did question ${q.number} feel?`}
      >
        <span>How did this feel?</span>
        {(['easy', 'okay', 'hard'] as const).map((r) => (
          <button
            className="quiet"
            key={r}
            aria-pressed={rating === r}
            disabled={!state.ready}
            onClick={() =>
              emit('difficulty_rated', {
                assignment: a.id,
                checkpoint: q.id,
                concept: q.concepts[0],
                rating: r,
              })
            }
          >
            {r[0].toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      {nextId && (
        <a className="quiet" href={'#' + nextId}>
          Next real question
        </a>
      )}
    </div>
  );
}
