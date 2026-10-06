import { useEffect, useRef, useState } from 'react';
import { findCourse, findEdition } from '../content/catalog';
import {
  topicTitle,
  unitTitle,
  unitTopics,
  unitUrl,
} from '../content/workspaces';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import { Lesson } from './Lesson';
import QuestionSession from './QuestionSession';
export default function Practice({
  course,
  initialTarget,
}: {
  course: string;
  initialTarget?: string;
  compact?: boolean;
}) {
  const state = useLearner(),
    c = findCourse(course),
    [unit, setUnit] = useState(findEdition(course).currentUnit),
    [target, setTarget] = useState(initialTarget ?? ''),
    [review, setReview] = useState(false),
    [started, setStarted] = useState(false),
    [repair, setRepair] = useState('');
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const u = q.get('unit');
    if (c.units.some((x) => x.id === u)) setUnit(u!);
    const t = q.get('target');
    if (t) setTarget(t);
    setReview(
      q.has('review') ||
        q.get('mode') === 'Unit review' ||
        q.get('mode') === 'Test simulation',
    );
  }, [c.units]);
  const ids = target ? [target] : unitTopics(course, unit).map((t) => t.id);
  return (
    <div className="flow-screen" data-course={course}>
      <div className="flow-top">
        <a href={url(unitUrl(course, unit))}>
          <Icon name="back" size={18} />
          {unitTitle(course, unit)}
        </a>
        <span>
          {repair
            ? 'One small thing first'
            : review
              ? 'Review unit'
              : 'Quick check'}
        </span>
      </div>
      {started ? (
        <>
          <div hidden={!!repair} className="session-holder">
            <QuestionSession
              course={course}
              ids={ids}
              mode={review ? 'Unit review' : 'Quick check'}
              count={review ? 8 : 3}
              onFinish={() => {
                window.location.href = url(unitUrl(course, unit));
              }}
              onRepair={(id, callback) => {
                retry.current = callback;
                setRepair(id);
              }}
            />
          </div>
          {repair && (
            <Lesson
              key={repair}
              id={repair}
              allowRepair={false}
              onComplete={() => {
                setRepair('');
                retry.current();
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="flow-body">
            <p className="step-meta">{c.shortTitle}</p>
            <h1>{review ? 'Review unit' : 'Quick check'}</h1>
            <p className="teaching-text">
              {target ? topicTitle(target) : unitTitle(course, unit)}
            </p>
            <p className="muted">
              {review
                ? 'A few questions on the parts worth another look.'
                : 'A few small questions to see what’s clicking.'}
            </p>
            {!target && (
              <label>
                Unit
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {c.units
                    .filter((u) => unitTopics(course, u.id).length)
                    .map((u) => (
                      <option value={u.id} key={u.id}>
                        {unitTitle(course, u.id)}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="flow-secondary">
              <button
                className="quiet"
                aria-pressed={!review}
                onClick={() => setReview(false)}
              >
                Quick check
              </button>
              <button
                className="quiet"
                aria-pressed={review}
                onClick={() => setReview(true)}
              >
                Review unit
              </button>
            </div>
          </div>
          <div className="flow-footer">
            <span className="meta">One question at a time.</span>
            <button
              className="primary"
              disabled={!state.ready || !ids.length}
              onClick={() => setStarted(true)}
            >
              {review ? 'Start review' : 'Start quick check'}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
