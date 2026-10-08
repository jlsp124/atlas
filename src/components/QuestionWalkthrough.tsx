import { useEffect, useRef } from 'react';
import type { Assignment, CompanionQuestion } from '../core/schema';
import { makeWalkthrough, symbols, conciseNumber } from '../core/walkthrough';
import { latestDifficulty } from '../core/companion';
import { emit, useLearner } from '../client/store';
import { useContinuity } from '../client/motion';
import { Icon } from './Icons';
import { openFeedback } from '../client/feedback';
import GuidedVisual from './GuidedVisual';
import ReadableText from './ReadableText';

export default function QuestionWalkthrough({
  assignment: a,
  question: q,
  step,
  onStep,
  onDone,
  onLearn,
  done,
  next,
}: {
  assignment: Assignment;
  question: CompanionQuestion;
  step: number;
  onStep: (step: number) => void;
  onDone: () => void;
  onLearn: (element: HTMLElement) => void;
  done: boolean;
  next?: () => void;
}) {
  const state = useLearner();
  const guide = makeWalkthrough(a, q);
  const index = Math.min(Math.max(0, step), guide.steps.length - 1);
  const current = guide.steps[index];
  const last = index === guide.steps.length - 1;
  const root = useRef<HTMLDivElement>(null);
  useContinuity(root, index);
  const previousStep = useRef<number | undefined>(undefined);
  useEffect(() => {
    const initial = previousStep.current === undefined;
    if (previousStep.current === index || (initial && index === 0)) {
      previousStep.current = index;
      return;
    }
    previousStep.current = index;
    if (!matchMedia('(max-width: 800px)').matches) return;
    const points = root.current?.querySelectorAll(
      '.response-outline > p[data-on=true]',
    );
    const target =
      current.phase === 'read' || current.phase === 'clue'
        ? (root.current?.querySelector(
            '.transforming-question mark[data-active=true]',
          ) ?? root.current?.querySelector('.transforming-question'))
        : current.phase === 'finish'
          ? root.current?.querySelector('.paper-instruction')
          : current.phase.startsWith('point-')
            ? points?.[points.length - 1]
            : guide.physics
              ? root.current?.querySelector(
                  [
                    'formula',
                    'balance',
                    'rearrange',
                    'substitute',
                    'units',
                  ].includes(current.phase)
                    ? '.live-equation'
                    : '.known-values',
                )
              : (root.current?.querySelector('.teaching-diagram') ??
                root.current?.querySelector('.paper-instruction'));
    const footer = root.current?.querySelector('.walkthrough-footer');
    if (!target || !footer) return;
    // After a restored question has opened, reveal the working beside its
    // instruction. A tap advances only far enough to show the actual change.
    const frame = requestAnimationFrame(() => {
      const behavior =
        initial || matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth';
      if (current.phase === 'read') {
        window.scrollTo({ top: 0, behavior });
        return;
      }
      const limit = footer.getBoundingClientRect().top - 16;
      const upper = Math.max(
        16,
        (document.querySelector('.topbar')?.getBoundingClientRect().bottom ??
          0) + 12,
      );
      const rect = target.getBoundingClientRect();
      const shift =
        rect.bottom > limit
          ? rect.bottom - limit
          : rect.top < upper
            ? rect.top - upper
            : 0;
      if (shift)
        window.scrollTo({
          top: window.scrollY + shift,
          behavior,
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [index]);
  const rating = latestDifficulty(a.id, q.id, state.events);
  const physics = guide.physics;
  const formulaStep = guide.steps.findIndex((s) => s.phase === 'formula');
  const formulaVisible = formulaStep >= 0 && index >= formulaStep;
  const substituted = ['substitute', 'units', 'finish'].includes(current.phase);
  const equation = physics
    ? current.phase === 'balance'
      ? physics.rearrangement!.equation
      : ['rearrange', 'substitute', 'units', 'finish'].includes(current.phase)
        ? physics.rearranged
        : physics.equation
    : '';
  const parts = equation.split(/(vi|vf|Δt|Δx|a)/);
  const tokens = parts.map((part, i) => ({
    part,
    i,
    id: symbols[part]
      ? `equation-${part}-${parts.slice(0, i).filter((p) => p === part).length}`
      : `operator-${i}`,
  }));
  const cues: { start: number; end: number; source: string; text: string }[] =
    [];
  const unknown = guide.steps.find((s) => s.phase === 'unknown');
  const addCue = (text: string, source: string, last = false) => {
    const start = last
      ? q.prompt.toLowerCase().lastIndexOf(text.toLowerCase())
      : q.prompt.toLowerCase().indexOf(text.toLowerCase());
    if (
      start < 0 ||
      cues.some((c) => start < c.end && start + text.length > c.start)
    )
      return;
    cues.push({
      start,
      end: start + text.length,
      source,
      text: q.prompt.slice(start, start + text.length),
    });
  };
  for (const value of physics?.values ?? [])
    addCue(value.source, `source-${value.symbol}`);
  if (unknown?.focus) addCue(unknown.focus, 'unknown-request', true);
  if (current.focus && current.phase !== 'unknown')
    addCue(current.focus, `clue-${current.focus}`);
  for (const clue of q.clues) addCue(clue.word, `clue-${clue.word}`);
  cues.sort((a, b) => a.start - b.start);
  let cursor = 0;
  const activeSource =
    current.phase === 'unknown'
      ? 'unknown-request'
      : current.phase === 'known'
        ? `source-${physics?.values.find((v) => current.write?.startsWith(symbols[v.symbol] + ' ='))?.symbol}`
        : `clue-${current.focus}`;
  const prompt = cues.flatMap((c) => {
    const before = q.prompt.slice(cursor, c.start);
    cursor = c.end;
    return [
      <ReadableText text={before} key={`before-${c.start}`} />,
      <mark
        key={c.start}
        data-origin-id={c.source}
        data-active={current.focus !== undefined && c.source === activeSource}
      >
        <ReadableText text={c.text} />
      </mark>,
    ];
  });
  prompt.push(<ReadableText text={q.prompt.slice(cursor)} key="last" />);
  return (
    <div
      className="walkthrough"
      data-kind={guide.kind}
      data-question={q.id}
      data-step={index}
      ref={root}
    >
      <div className="focus-question">
        <div className="question-meta-row">
          <p className="paper-meta">
            {q.section} · Question {q.number}
          </p>
          <button
            className="suggest-link"
            disabled={!state.ready}
            onClick={() => openFeedback('feature')}
          >
            <Icon name="pencil" size={12} />
            Suggest
          </button>
        </div>
        <h2 className="transforming-question">{prompt}</h2>
        {physics?.context && (
          <p className="question-source-context">
            <ReadableText text={physics.context} />
          </p>
        )}
      </div>
      <div className="walkthrough-body">
        <div
          className="step-narration"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="step-index">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="narration-content">
            <div className="narration-copy">
              <h3>{current.title}</h3>
              <p>
                <ReadableText text={current.text} />
              </p>
            </div>
            <div className="narration-reserve" aria-hidden="true">
              {guide.steps.map((s, i) => (
                <div key={i}>
                  <h3>{s.title}</h3>
                  <p>
                    <ReadableText text={s.text} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {physics ? (
          <div className="physics-working" aria-label="Working on paper">
            <div className="known-values">
              {physics.values.map((v) => {
                const at = guide.steps.findIndex(
                  (s) =>
                    s.phase === 'known' &&
                    s.write?.startsWith(symbols[v.symbol] + ' ='),
                );
                const visible = index >= at && at >= 0;
                return (
                  <div
                    className="known-value"
                    key={v.symbol}
                    data-on={visible}
                    aria-hidden={!visible}
                  >
                    <span>
                      <ReadableText text={symbols[v.symbol]} /> ={' '}
                    </span>
                    <span
                      className="value-token"
                      data-move-id={`known-${v.symbol}`}
                      data-origin={`source-${v.symbol}`}
                      data-origin-id={`known-${v.symbol}`}
                      data-on={visible}
                    >
                      {v.text}
                    </span>
                    <span className="value-unit"> {v.unit}</span>
                  </div>
                );
              })}
              <div
                className="known-value unknown-value"
                data-on={
                  index >= guide.steps.findIndex((s) => s.phase === 'unknown')
                }
              >
                <span
                  data-move-id="unknown"
                  data-on={
                    index >= guide.steps.findIndex((s) => s.phase === 'unknown')
                  }
                  data-origin="unknown-request"
                >
                  <ReadableText text={symbols[physics.target]} /> = ?
                </span>
              </div>
            </div>
            <div
              className="equation-working"
              data-on={formulaVisible}
              aria-hidden={!formulaVisible}
            >
              <p className="paper-meta">
                {substituted
                  ? 'Substitute your values'
                  : 'Keep both sides equal'}
              </p>
              <div
                className="live-equation"
                aria-label={current.equation ?? equation}
              >
                {tokens.map(({ part, i, id }) => {
                  const value = physics.values.find((v) => v.symbol === part);
                  const replacing = substituted && i > 1 && value;
                  return (
                    <span
                      key={id}
                      className={value ? 'equation-token' : ''}
                      data-move-id={id}
                      data-origin={replacing ? `known-${part}` : undefined}
                      data-on={formulaVisible}
                    >
                      <ReadableText
                        text={
                          replacing
                            ? `(${value.text})`
                            : (symbols[part] ?? part)
                        }
                      />
                    </span>
                  );
                })}
              </div>
              <p
                className="physics-unit-working"
                data-on={['units', 'finish'].includes(current.phase)}
                aria-hidden={!['units', 'finish'].includes(current.phase)}
              >
                Units: {physics.unitWorking}
              </p>
              <div
                className="calculated-result"
                data-on={last}
                aria-hidden={!last}
              >
                <span>
                  <ReadableText text={symbols[physics.target]} /> ≈{' '}
                </span>
                <strong>
                  {conciseNumber(physics.result)} {physics.unit}
                </strong>
                {physics.direction && (
                  <span className="result-direction">{physics.direction}</span>
                )}
              </div>
            </div>
            <p className="paper-origin">
              {last
                ? `${q.answer?.origin === 'teacher' ? 'Teacher-provided result' : 'Atlas-derived working'} · match the precision on your assignment`
                : 'Build this working on your own paper.'}
            </p>
          </div>
        ) : (
          <>
            <GuidedVisual guide={guide} step={index} />
            {guide.kind === 'reasoning' && (
              <div
                className="response-outline"
                aria-label="What your written answer needs"
              >
                <p className="paper-meta">Your response on paper</p>
                {guide.steps
                  .filter((s) => s.phase.startsWith('point-'))
                  .map((s, i) => {
                    const visible = guide.steps.indexOf(s) <= index;
                    return (
                      <p key={i} data-on={visible} aria-hidden={!visible}>
                        <span className="outline-number">{i + 1}</span>
                        <span>
                          <ReadableText
                            text={
                              (s.phase.startsWith('point-setup') ||
                              s.write !== `On your paper: ${s.text}`
                                ? s.write
                                : s.text) ?? ''
                            }
                          />
                        </span>
                      </p>
                    );
                  })}
              </div>
            )}
          </>
        )}
        <div className="paper-instruction">
          <Icon name="pencil" size={17} />
          <p>
            <ReadableText text={current.write ?? ''} />
          </p>
        </div>
        <details className="walkthrough-help">
          <summary>Need another explanation?</summary>
          <p>
            <ReadableText text={q.example} />
          </p>
          <button className="quiet" onClick={(e) => onLearn(e.currentTarget)}>
            Explain the idea <Icon name="help" size={15} />
          </button>
        </details>
        {last && (
          <details className="walkthrough-review">
            <summary>Keep this question for review</summary>
            <div
              className="difficulty-rating"
              role="group"
              aria-label={`How did question ${q.number} feel?`}
            >
              {(['easy', 'okay', 'hard'] as const).map((r) => (
                <button
                  className="quiet"
                  key={r}
                  disabled={!state.ready}
                  aria-pressed={rating === r}
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
          </details>
        )}
      </div>
      <footer className="walkthrough-footer" data-done={done}>
        <button
          className="secondary"
          disabled={index === 0 || !state.ready}
          onClick={() => onStep(index - 1)}
        >
          <Icon name="back" size={16} />
          Back
        </button>
        <div
          className="step-progress"
          role="progressbar"
          aria-label="Walkthrough progress"
          aria-valuemin={0}
          aria-valuemax={guide.steps.length}
          aria-valuenow={index + 1}
        >
          <span
            style={{ transform: `scaleX(${(index + 1) / guide.steps.length})` }}
          />
          <small>
            {index + 1} / {guide.steps.length}
          </small>
        </div>
        {last ? (
          done ? (
            <button className="primary" disabled={!next} onClick={next}>
              {next ? 'Next question' : 'Question done'}
              <Icon name={next ? 'arrow' : 'check'} size={16} />
            </button>
          ) : (
            <button
              className="primary"
              disabled={!state.ready}
              onClick={onDone}
            >
              Done on paper
              <Icon name="check" size={16} />
            </button>
          )
        ) : (
          <button
            className="primary"
            disabled={!state.ready}
            onClick={() => onStep(index + 1)}
          >
            Next
            <Icon name="arrow" size={16} />
          </button>
        )}
      </footer>
    </div>
  );
}
