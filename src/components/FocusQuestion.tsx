import { useEffect, useMemo, useRef, useState } from 'react';
import type { Assignment, CompanionQuestion } from '../core/schema';
import { checkCompanionAnswer, latestDifficulty } from '../core/companion';
import { questionGuide } from '../core/guide';
import { emit, useLearner } from '../client/store';
import { useCheckpoint } from '../client/checkpoint';
import { Icon } from './Icons';
import StoryStage from './teaching/StoryStage';
import MicroConcept from './teaching/MicroConcept';
import { focusStage } from './teaching/focusStage';

export default function FocusQuestion({
  assignment: a,
  question: q,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  assignment: Assignment;
  question: CompanionQuestion;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const state = useLearner(),
    { draft, update, flush, ready } = useCheckpoint(a.id, q.id);
  const guide = useMemo(() => questionGuide(a, q), [a, q]);
  const position = Math.min(draft.step, guide.steps.length - 1);
  const [feedback, setFeedback] = useState<{
    correct: boolean | null;
    feedback: string;
  } | null>(null);
  const [term, setTerm] = useState(''),
    [more, setMore] = useState(false),
    [revealed, setRevealed] = useState(false),
    [repair, setRepair] = useState(false),
    [repairAnswer, setRepairAnswer] = useState('');
  const attempts = state.events.filter(
    (e) =>
      e.type === 'companion_attempt' &&
      e.payload.assignment === a.id &&
      e.payload.question === q.id,
  );
  const helps = state.events.filter(
    (e) =>
      e.type === 'companion_help' &&
      e.payload.assignment === a.id &&
      e.payload.question === q.id,
  );
  const rating = latestDifficulty(a.id, q.id, state.events);
  const analyticsGuide = useRef({
    key: '',
    started: false,
    completed: false,
    sawEarlierStep: false,
  });
  useEffect(() => {
    if (
      !ready ||
      !state.analytics ||
      (state.user && state.connection !== 'online') ||
      !draft.help ||
      a.assistance === 'independent-only'
    )
      return;
    const key = `${state.user?.id ?? 'guest'}:${a.id}:${q.id}`;
    if (analyticsGuide.current.key !== key)
      analyticsGuide.current = {
        key,
        started: false,
        completed: false,
        sawEarlierStep: false,
      };
    const metadata = {
      course: a.course,
      material: a.id,
      question: q.id,
      feature: 'walkthrough',
    };
    if (!analyticsGuide.current.started) {
      window.dispatchEvent(
        new CustomEvent('atlas:product-event', {
          detail: { type: 'walkthrough_started', ...metadata },
        }),
      );
      analyticsGuide.current.started = true;
    }
    const last = position === guide.steps.length - 1;
    if (!last) analyticsGuide.current.sawEarlierStep = true;
    if (
      last &&
      analyticsGuide.current.sawEarlierStep &&
      !analyticsGuide.current.completed
    ) {
      window.dispatchEvent(
        new CustomEvent('atlas:product-event', {
          detail: { type: 'walkthrough_completed', ...metadata, success: true },
        }),
      );
      analyticsGuide.current.completed = true;
    }
  }, [
    ready,
    state.analytics,
    state.connection,
    state.user?.id,
    draft.help,
    position,
    guide.steps.length,
    a.id,
    a.course,
    a.assistance,
    q.id,
  ]);

  function help(
    action: 'asking' | 'hint' | 'example' | 'explanation' | 'reveal',
  ) {
    emit('companion_help', {
      assignment: a.id,
      question: q.id,
      concept: q.concepts[0],
      action,
    });
  }
  function start() {
    update({ help: true, step: 0 }, true);
    help('asking');
    focusStage();
  }
  function move(delta: number) {
    update(
      { step: Math.max(0, Math.min(guide.steps.length - 1, position + delta)) },
      true,
    );
  }
  useEffect(() => {
    // The chooser contracts at the handoff. Keep the original question in view
    // rather than letting scroll anchoring follow the previously focused arrow.
    if (ready && draft.help && guide.steps[position].action === 'student')
      focusStage(true);
  }, [ready, draft.help, position, guide]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !ready ||
        term ||
        document.querySelector('dialog[open]') ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        !draft.help
      )
        return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        move(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [ready, term, draft.help, position]);
  function check() {
    flush();
    const result = checkCompanionAnswer(
      q,
      draft.value,
      draft.unit,
      draft.direction,
    );
    setFeedback(result);
    if (result.correct !== null) {
      emit('companion_attempt', {
        assignment: a.id,
        question: q.id,
        concept: q.concepts[0],
        correct: result.correct,
        hints: Math.min(10, helps.length),
        revealed:
          revealed ||
          helps.some(
            (e) => e.type === 'companion_help' && e.payload.action === 'reveal',
          ),
      });
      update({ complete: result.correct }, true);
      if (!result.correct && attempts.length >= 1) setRepair(true);
    }
  }
  function concept(word: string) {
    flush();
    setTerm(word);
    help('explanation');
  }
  return (
    <div
      className="focus-question companion-question"
      id={q.id}
      data-question={q.id}
    >
      <div className="focus-meta">
        <p className="eyebrow">
          {q.section} · Question {q.number}
        </p>
        <span className={draft.complete ? 'part-done' : 'muted'}>
          {draft.complete ? 'Done' : 'In progress'}
        </span>
      </div>
      <StoryStage
        prompt={q.prompt}
        guide={guide}
        step={position}
        active={draft.help}
        onConcept={concept}
      />
      {draft.help && (
        <nav className="guide-navigation" aria-label="Reasoning steps">
          <button
            className="secondary"
            disabled={position === 0}
            onClick={() => move(-1)}
          >
            <Icon name="back" />
            Back step
          </button>
          <span>
            {position + 1} / {guide.steps.length}
          </span>
          <button
            className="primary"
            disabled={position === guide.steps.length - 1}
            onClick={() => move(1)}
          >
            Next step
            <Icon name="arrow" />
          </button>
        </nav>
      )}
      <form
        className="focus-answer"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        {q.input === 'choice' ? (
          <fieldset className="answer-choices">
            <legend>Your answer</legend>
            {q.choices?.map((c) => (
              <label className="answer-choice" key={c}>
                <input
                  name={q.id}
                  type="radio"
                  checked={draft.value === c}
                  disabled={!ready}
                  onChange={() => update({ value: c, complete: false })}
                />
                {c}
              </label>
            ))}
          </fieldset>
        ) : (
          <div
            className={`answer-inputs ${q.input === 'numeric' ? 'numeric-answer' : ''}`}
          >
            <label htmlFor={`answer-${q.id}`}>
              {q.input === 'japanese'
                ? 'Write in Japanese'
                : q.input === 'text'
                  ? 'Your explanation'
                  : 'Your answer'}
            </label>
            {q.input === 'text' ? (
              <textarea
                id={`answer-${q.id}`}
                rows={4}
                disabled={!ready}
                value={draft.value}
                maxLength={8000}
                onChange={(e) => {
                  update({ value: e.target.value, complete: false });
                  setFeedback(null);
                }}
                onBlur={flush}
                placeholder="Write your reasoning here, or work on your paper."
              />
            ) : (
              <input
                id={`answer-${q.id}`}
                disabled={!ready}
                value={draft.value}
                maxLength={8000}
                lang={q.input === 'japanese' ? 'ja' : undefined}
                inputMode={q.input === 'numeric' ? 'decimal' : 'text'}
                autoComplete="off"
                onChange={(e) => {
                  update({ value: e.target.value, complete: false });
                  setFeedback(null);
                }}
                onBlur={flush}
              />
            )}
            {q.answer?.unit && (
              <label>
                Unit
                <input
                  disabled={!ready}
                  value={draft.unit}
                  maxLength={80}
                  autoComplete="off"
                  onChange={(e) =>
                    update({ unit: e.target.value, complete: false })
                  }
                  onBlur={flush}
                  placeholder={q.answer.unit}
                />
              </label>
            )}
            {q.answer?.directions?.length ? (
              <label>
                Direction in words
                <input
                  disabled={!ready}
                  value={draft.direction}
                  maxLength={80}
                  autoComplete="off"
                  onChange={(e) =>
                    update({ direction: e.target.value, complete: false })
                  }
                  onBlur={flush}
                  placeholder="Write the direction"
                />
              </label>
            ) : null}
          </div>
        )}
        <div className="answer-actions">
          <button
            type="submit"
            className="secondary"
            disabled={!ready || !draft.value.trim()}
          >
            {q.answer ? 'Check answer' : 'Self-check response'}
          </button>
          {!draft.help && (
            <button
              type="button"
              className="quiet help-start"
              disabled={!ready}
              onClick={start}
            >
              Help me start
              <Icon name="arrow" size={16} />
            </button>
          )}
          {draft.help && (
            <button
              type="button"
              className="quiet"
              onClick={() => {
                setMore(true);
                help('hint');
              }}
            >
              Show me more
            </button>
          )}
        </div>
      </form>
      {feedback && (
        <p className="question-feedback" role="status">
          {feedback.feedback}
        </p>
      )}
      {!q.answer && feedback && (
        <div className="self-check-stage">
          <p className="eyebrow">{a.teacher} · self-check</p>
          <ul>
            {q.checklist?.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            className="secondary"
            onClick={() => update({ complete: !draft.complete }, true)}
          >
            {draft.complete
              ? 'Mark this question incomplete'
              : 'I’ve checked my response'}
          </button>
        </div>
      )}
      {repair && (
        <fieldset className="tiny-repair">
          <legend>One small thing first</legend>
          <p>{q.repair.prompt}</p>
          {q.repair.choices.map((c) => (
            <label className="answer-choice" key={c}>
              <input
                type="radio"
                name={`${q.id}-repair`}
                checked={repairAnswer === c}
                onChange={() => setRepairAnswer(c)}
              />
              {c}
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
                  feedback: 'Good. Return to the exact question and try again.',
                });
              }
            }}
          >
            Check this idea
          </button>
          {repairAnswer && repairAnswer !== q.repair.answer && (
            <p>{q.repair.explanation}</p>
          )}
        </fieldset>
      )}
      {more && (
        <section className="more-scaffold">
          <p>{q.hints[0]}</p>
          <details
            onToggle={(e) => {
              if (e.currentTarget.open) help('example');
            }}
          >
            <summary>A small worked example</summary>
            <p>{q.example}</p>
          </details>
          {q.answer && (
            <details
              onToggle={(e) => {
                if (e.currentTarget.open) {
                  setRevealed(true);
                  help('reveal');
                }
              }}
            >
              <summary>Answer & reasoning</summary>
              <div className="solution">
                <strong>
                  {String(
                    Number(q.answer.value).toPrecision(5) === 'NaN'
                      ? q.answer.value
                      : Number(Number(q.answer.value).toPrecision(5)),
                  )}{' '}
                  {q.answer.unit} {q.answer.directions?.[0]}
                </strong>
                <p className="source-meta">
                  {q.answer.origin === 'atlas'
                    ? 'atlas-derived solution'
                    : q.answer.origin === 'teacher'
                      ? 'Teacher-provided answer'
                      : 'User-supplied answer'}{' '}
                  · use the question’s precision
                </p>
                <p>{q.answer.reasoning}</p>
              </div>
            </details>
          )}
        </section>
      )}
      {(feedback || draft.complete || attempts.length > 0 || rating) && (
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
              disabled={!ready}
              onClick={() => {
                flush();
                emit('difficulty_rated', {
                  assignment: a.id,
                  checkpoint: q.id,
                  concept: q.concepts[0],
                  rating: r,
                });
              }}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}
      <div className="question-finish">
        <label>
          <input
            type="checkbox"
            checked={draft.complete}
            disabled={!ready}
            onChange={(e) => update({ complete: e.target.checked }, true)}
          />
          Mark question {q.number} done
        </label>
      </div>
      <nav className="focus-navigation" aria-label="Assignment questions">
        <button
          className="secondary"
          disabled={!hasPrevious}
          onClick={() => {
            flush();
            onPrevious();
          }}
        >
          <Icon name="back" />
          Previous question
        </button>
        <button
          className="primary"
          onClick={() => {
            flush();
            onNext();
          }}
        >
          {' '}
          {hasNext ? 'Next real question' : 'Back to overview'}
          <Icon name="arrow" />
        </button>
      </nav>
      <MicroConcept term={term} question={q} onClose={() => setTerm('')} />
    </div>
  );
}
