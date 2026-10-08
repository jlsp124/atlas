import { useRef } from 'react';
import type { Guide } from '../../core/guide';
import { symbols } from '../../core/equation';
import { useTeachingMotion } from './Motion';
import EquationStage from './EquationStage';
import DiagramStage from './DiagramStage';
import MathToken from './MathToken';

export default function StoryStage({
  prompt,
  guide,
  step,
  active,
  onConcept,
}: {
  prompt: string;
  guide: Guide;
  step: number;
  active: boolean;
  onConcept: (term: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    current = guide.steps[step] ?? guide.steps[0];
  const reduced = useTeachingMotion(ref, `${active}-${step}`);
  const phrases = [
    ...new Set([
      ...(guide.facts ?? [])
        .map((f) => f.phrase)
        .filter((s): s is string => Boolean(s)),
      ...guide.steps.map((s) => s.focus).filter((s): s is string => Boolean(s)),
    ]),
  ]
    .filter((p) => prompt.toLowerCase().includes(p.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  const expression = phrases.length
    ? new RegExp(
        `(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
        'gi',
      )
    : undefined;
  const parts = expression ? prompt.split(expression) : [prompt];
  const targetShown =
    active &&
    ['target', 'formula', 'transform', 'substitute', 'student'].includes(
      current.action,
    );
  return (
    <div
      className="story-stage"
      ref={ref}
      data-guide-kind={guide.kind}
      data-guide-step={step}
      data-guide-action={active ? current.action : 'question'}
      data-reduced-motion={reduced}
    >
      <h2 className="persistent-question">
        {parts.map((part, i) => {
          const recognized = phrases.some(
            (p) => p.toLowerCase() === part.toLowerCase(),
          );
          const f = guide.facts?.find(
            (f) => f.phrase?.toLowerCase() === part.toLowerCase(),
          );
          const highlighted =
            active && current.focus?.toLowerCase() === part.toLowerCase();
          return recognized ? (
            <button
              key={i}
              className={`question-token ${highlighted ? 'is-highlighted' : ''}`}
              data-motion={
                f
                  ? `prompt-${f.id}`
                  : guide.kind === 'conversion' && part === guide.steps[0].focus
                    ? 'prompt-conversion-source'
                    : `prompt-${i}`
              }
              data-active="true"
              onClick={() => onConcept(part)}
              aria-label={`Explain ${part}`}
            >
              {part}
            </button>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </h2>
      {active && (
        <div className="story-workspace">
          <div className="guide-caption" aria-live="polite">
            <p className="eyebrow">
              {current.action === 'student'
                ? 'Your turn'
                : `Reasoning · ${step + 1} / ${guide.steps.length}`}
            </p>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>
          {guide.kind === 'physics' && (
            <>
              {guide.steps[0].focus &&
                /dropped|rest|released/.test(guide.steps[0].focus) &&
                step <= 1 && (
                  <div className="semantic-bridge">
                    <button
                      data-motion="clue-copy"
                      data-origin="prompt-vi"
                      onClick={() => onConcept(guide.steps[0].focus!)}
                    >
                      {guide.steps[0].focus}
                    </button>
                    <span aria-hidden="true">→</span>
                    <span
                      data-motion="rest-meaning"
                      data-active={step >= 1}
                      aria-hidden={step < 1}
                      style={{ opacity: step >= 1 ? 1 : 0 }}
                    >
                      starts from rest
                    </span>
                  </div>
                )}
              <div
                className="known-unknown-board"
                aria-label="Known values and unknown"
              >
                <div className="known-values">
                  <p className="eyebrow">Known</p>
                  <div className="facts-row">
                    {guide.facts?.map((f, i) => (
                      <div
                        className="known-fact"
                        key={f.id}
                        data-motion={`known-${f.id}`}
                        data-origin={f.phrase ? `prompt-${f.id}` : undefined}
                        data-active={i < (current.facts ?? 0)}
                        aria-hidden={i >= (current.facts ?? 0)}
                        style={{ opacity: i < (current.facts ?? 0) ? 1 : 0 }}
                      >
                        <span>
                          <MathToken text={symbols[f.id] ?? f.symbol} />
                        </span>
                        <span>=</span>
                        <strong
                          data-motion={`value-${f.id}`}
                          data-active={i < (current.facts ?? 0)}
                        >
                          {f.value}
                        </strong>
                        <small>{f.unit}</small>
                        {f.implied && (
                          <span className="implied-marker" title={f.implied}>
                            implied
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="unknown-value"
                  data-motion="unknown"
                  data-active={targetShown}
                  aria-hidden={!targetShown}
                  style={{ opacity: targetShown ? 1 : 0 }}
                >
                  <p className="eyebrow">Find</p>
                  <strong>
                    <MathToken text={symbols[guide.target ?? 'vf']} /> = ?
                  </strong>
                </div>
              </div>
              {current.frame !== undefined && guide.equations && (
                <>
                  <div className="formula-options" aria-label="Formula fit">
                    {guide.candidates?.map((c) => (
                      <span
                        key={c.text}
                        className={`${c.chosen ? 'chosen-formula' : ''} ${c.fits ? '' : 'unavailable-formula'}`}
                        title={c.reason}
                      >
                        {c.text}
                        <small>
                          {c.chosen ? 'Fits this question' : c.reason}
                        </small>
                      </span>
                    ))}
                  </div>
                  <EquationStage
                    frames={guide.equations}
                    frame={current.frame}
                  />
                </>
              )}
            </>
          )}
          {[
            'conversion',
            'layers',
            'half-life',
            'cell',
            'lewis',
            'phrase',
          ].includes(guide.kind) && (
            <DiagramStage guide={guide} step={step} onConcept={onConcept} />
          )}
          {guide.kind === 'reasoning' && (
            <div className="reasoning-thread">
              {guide.steps
                .filter((s, i) => i <= step && s.action !== 'student')
                .map((s, i) => (
                  <p
                    key={s.id}
                    data-motion={s.id}
                    className={i === step ? 'current-reason' : ''}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {s.text}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
