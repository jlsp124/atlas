import { useState } from 'react';
import { concepts, questions } from '../content/catalog';
import { evidence, prerequisitePath } from '../core/learning';
import { track, url, useLearner } from '../client/store';
import Practice from './Practice';
export default function PathLearning({ course }: { course: string }) {
  const state = useLearner();
  const pool = concepts.filter((c) => c.course === course);
  const [target, setTarget] = useState(pool.at(-1)!.id);
  const [known, setKnown] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [probe, setProbe] = useState('');
  const verified = known.filter(
    (id) => evidence(id, state.events, questions).state === 'stable',
  );
  const path = prerequisitePath(target, concepts, verified);
  return (
    <section className="path-learning">
      <p className="eyebrow">BUILD FROM WHAT YOU KNOW</p>
      <h2>I know this. Teach me that.</h2>
      <div className="path-form">
        <fieldset>
          <legend>Ideas you think you know</legend>
          <div className="known-scroll">
            {pool.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={known.includes(c.id)}
                  onChange={(e) =>
                    setKnown((s) =>
                      e.target.checked
                        ? [...s, c.id]
                        : s.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.title}
                <span className="small muted">
                  {evidence(c.id, state.events, questions).state}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label>
            Where you want to get
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {pool.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <p className="small muted">
            Selected known ideas receive a probe. Only demonstrated stable ideas
            are omitted from the learning path; self-report alone does not
            establish mastery.
          </p>
          <button
            className="primary"
            onClick={() => {
              setShow(true);
              track('graph_path_started', course, target);
            }}
          >
            Find my path →
          </button>
        </div>
      </div>
      {show && (
        <>
          <ol className="learning-path">
            {path.map((id, i) => {
              const c = concepts.find((c) => c.id === id)!;
              return (
                <li key={id}>
                  <span className="path-number">{i + 1}</span>
                  <a href={url(`concepts/${id}/`)}>{c.title}</a>
                  <span className="evidence-state">
                    {evidence(id, state.events, questions).state}
                  </span>
                  {known.includes(id) && !verified.includes(id) && (
                    <button className="quiet" onClick={() => setProbe(id)}>
                      Verify this idea
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {!path.length ? (
            <p>
              Your selected path already has stable evidence. Try a transfer
              check or a later review.
            </p>
          ) : (
            <a
              className="primary"
              href={url(
                `courses/${course}/practice/?target=${target}&mode=Learn%20this`,
              )}
            >
              Repair the first missing connection →
            </a>
          )}
          {probe && (
            <Practice
              key={probe}
              course={course}
              initialTarget={probe}
              compact
            />
          )}
        </>
      )}
    </section>
  );
}
