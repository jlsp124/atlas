import { useEffect, useState } from 'react';
import katex from 'katex';
import { concepts, questions, findConcept } from '../content/catalog';
import {
  exampleSteps,
  representationCopy,
  representationFormulas,
} from '../content/presentation';
import { evidence, nearestGap } from '../core/learning';
import { emit, getState, url, useLearner } from '../client/store';
import {
  topicTitle,
  unitTitle,
  unitUrl,
  unitTopics,
} from '../content/workspaces';
import Glossary from './Glossary';
import { Icon } from './Icons';
import LearningVisual from './LearningVisual';
import QuestionSession from './QuestionSession';
import TutorHelp from './TutorHelp';
export function Lesson({
  id,
  onComplete,
  allowRepair = true,
}: {
  id: string;
  onComplete?: (good: boolean) => void;
  allowRepair?: boolean;
}) {
  const c = findConcept(id),
    state = useLearner(),
    [step, setStep] = useState(0),
    [phase, setPhase] = useState<
      'teach' | 'check' | 'probe' | 'repair' | 'done'
    >('teach'),
    [gap, setGap] = useState(''),
    [confused, setConfused] = useState(false),
    [outcome, setOutcome] = useState(true);
  useEffect(() => {
    const last = getState()
      .events.filter(
        (e) => e.type === 'lesson_viewed' && e.payload.concept === id,
      )
      .at(-1);
    if (!last || Date.now() - Date.parse(last.at) > 600000)
      emit('lesson_viewed', { concept: id });
  }, [id]);
  function checkFirst() {
    const missing = allowRepair
      ? nearestGap(id, concepts, state.events, questions)
      : undefined;
    if (missing && missing !== id) {
      setGap(missing);
      setPhase('probe');
    } else setPhase('check');
  }
  function finish(good: boolean) {
    setOutcome(good);
    if (onComplete) onComplete(good);
    else setPhase('done');
  }
  if (phase === 'repair')
    return (
      <Lesson
        key={gap}
        id={gap}
        allowRepair={false}
        onComplete={() => {
          setPhase('check');
          setGap('');
        }}
      />
    );
  if (phase === 'probe')
    return (
      <>
        {confused ? (
          <>
            <div className="flow-body">
              <p className="step-meta">One small thing first</p>
              <h1>This is probably the part getting in your way.</h1>
              <p className="teaching-text">{topicTitle(gap)}</p>
            </div>
            <div className="flow-footer">
              <button
                className="quiet"
                onClick={() => {
                  setConfused(false);
                  setPhase('check');
                }}
              >
                Back to {topicTitle(id)}
              </button>
              <button
                className="primary"
                onClick={() => {
                  setConfused(false);
                  setPhase('repair');
                }}
              >
                Fix this first
                <Icon name="arrow" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="probe-heading">
              Before this, let’s check one thing.
            </div>
            <QuestionSession
              course={c.course}
              ids={[gap]}
              count={1}
              skipSummary
              onFinish={(good) => {
                if (good) setPhase('check');
                else setConfused(true);
              }}
            />
          </>
        )}
      </>
    );
  if (phase === 'check')
    return (
      <QuestionSession
        course={c.course}
        ids={[id]}
        mode="Learn this"
        count={3}
        onFinish={finish}
      />
    );
  const nextTopic = unitTopics(c.course, c.unit)[
    unitTopics(c.course, c.unit).findIndex((t) => t.id === id) + 1
  ];
  if (phase === 'done')
    return (
      <>
        <div className="flow-body">
          <p className="step-meta">{unitTitle(c.course, c.unit)}</p>
          <h1>{outcome ? 'Looks good' : 'Keep this one close'}</h1>
          <p className="teaching-text">
            {outcome
              ? 'You’ve checked the idea. Pick up the next one when you’re ready.'
              : 'You’ve tried the idea. A little more practice will help it stick.'}
          </p>
        </div>
        <div className="flow-footer">
          {nextTopic ? (
            <a className="quiet" href={url(unitUrl(c.course, c.unit))}>
              Back to {unitTitle(c.course, c.unit)}
            </a>
          ) : (
            <span className="meta">{topicTitle(id)}</span>
          )}
          <a
            className="primary"
            href={url(
              nextTopic ? `learn/${nextTopic.id}/` : unitUrl(c.course, c.unit),
            )}
          >
            {nextTopic
              ? `Next: ${topicTitle(nextTopic.id)}`
              : `Back to ${unitTitle(c.course, c.unit)}`}
            <Icon name="arrow" size={16} />
          </a>
        </div>
      </>
    );
  return (
    <>
      <div
        className="flow-body teaching-block"
        key={step}
        lang={c.course === 'japanese' ? 'ja' : undefined}
      >
        <p className="step-meta">
          {step === 0
            ? 'The idea'
            : step === 1
              ? 'See it'
              : 'Try the reasoning'}
        </p>
        <h1>{topicTitle(id)}</h1>
        {step === 0 ? (
          <>
            <div className="teaching-text">
              <Glossary text={c.model} />
            </div>
            {confused && (
              <div className="alternate-explanation">
                <p>
                  <Glossary text={c.why} />
                </p>
                <button className="secondary" onClick={checkFirst}>
                  Check what I’m missing
                </button>
              </div>
            )}
          </>
        ) : step === 1 ? (
          <>
            <p className="representation">
              <Glossary text={representationCopy[id] ?? c.representation} />
            </p>
            {c.formula && (
              <div
                className="formula"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    representationFormulas[id] ?? c.formula,
                    {
                      displayMode: true,
                      throwOnError: false,
                      trust: false,
                      output: 'htmlAndMathml',
                    },
                  ),
                }}
              />
            )}
            <LearningVisual id={id} />
          </>
        ) : (
          <>
            <h2>{c.example.prompt}</h2>
            <ol className="worked-steps">
              {(exampleSteps[id] ?? c.example.steps).map((s, i) => (
                <li key={i}>
                  <Glossary text={s} />
                </li>
              ))}
            </ol>
            <details>
              <summary>A common mix-up</summary>
              <p>
                <Glossary text={c.trap} />
              </p>
            </details>
          </>
        )}
        <div className="flow-secondary">
          <details>
            <summary>Why?</summary>
            <p>
              <Glossary text={c.why} />
            </p>
          </details>
          <details>
            <summary>More detail</summary>
            <p>
              <Glossary text={c.deeper} />
            </p>
            <ul>
              {c.review.map((r) => (
                <li key={r}>
                  <Glossary text={r} />
                </li>
              ))}
            </ul>
          </details>
        </div>
        {step === 0 && (
          <div className="flow-secondary">
            <button
              className="quiet"
              onClick={() => {
                emit('concept_marked_confused', { concept: id });
                setConfused(true);
              }}
            >
              I don’t understand this
            </button>
            <button
              className="quiet"
              onClick={() => {
                emit('concept_self_reported_known', { concept: id });
                checkFirst();
              }}
            >
              I know this
            </button>
          </div>
        )}
        <TutorHelp id={id} />
      </div>
      <div className="flow-footer">
        <span className="meta">
          {step + 1} of 3
          {evidence(id, state.events, questions).state === 'stable'
            ? ' · You’ve checked this before'
            : ''}
        </span>
        <div className="button-row">
          {step > 0 && (
            <button className="quiet" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          <button
            className="primary"
            onClick={() => (step < 2 ? setStep((s) => s + 1) : checkFirst())}
          >
            {step < 2 ? 'Next' : 'Quick check'}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
export default function Topic({ id }: { id: string }) {
  const c = findConcept(id);
  return (
    <div className="flow-screen" data-course={c.course}>
      <div className="flow-top">
        <a href={url(unitUrl(c.course, c.unit))}>
          <Icon name="back" size={18} />
          {unitTitle(c.course, c.unit)}
        </a>
        <span>{topicTitle(id)}</span>
      </div>
      <Lesson id={id} />
    </div>
  );
}
