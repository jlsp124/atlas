import { useEffect, useState } from 'react';
import { concepts, questions, findConcept } from '../content/catalog';
import { evidence, tutorPrompt } from '../core/learning';
import { emit, getState, track, url, useLearner } from '../client/store';

export default function ConceptTools({ id }: { id: string }) {
  const state = useLearner();
  const c = findConcept(id);
  const e = evidence(id, state.events, questions);
  const [known, setKnown] = useState(false);
  const [intent, setIntent] = useState('Diagnose my confusion');
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  useEffect(() => {
    const last = getState()
      .events.filter(
        (e) => e.type === 'lesson_viewed' && e.payload.concept === id,
      )
      .at(-1);
    if (!last || Date.now() - Date.parse(last.at) > 600000)
      emit('lesson_viewed', { concept: id });
    track('concept_opened', c.course, id);
  }, [id, c.course]);
  async function copy() {
    const prompt = tutorPrompt(c, concepts, state.events, questions, intent);
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage('Tutor prompt copied.');
      track('ai_prompt_copied', c.course, id);
    } catch {
      setFallback(prompt);
      setMessage('Select the prompt below to copy it.');
    }
  }
  return (
    <aside className="concept-tools">
      <p className="eyebrow">YOUR EVIDENCE</p>
      <span className={`evidence-state prominent ${e.state.replace(' ', '-')}`}>
        {e.state}
      </span>
      <p className="small muted">{e.reason}</p>
      <div className="self-report">
        <button
          className="secondary"
          onClick={() => {
            emit('concept_marked_confused', { concept: id });
            setMessage('Marked for diagnosis and review.');
          }}
        >
          I don’t understand this
        </button>
        <button
          className="quiet"
          onClick={() => {
            emit('concept_self_reported_known', { concept: id });
            setKnown(true);
            setMessage(
              'Self-report saved. A fresh check gives stronger evidence.',
            );
          }}
        >
          I think I know this
        </button>
      </div>
      {known && (
        <a
          className="primary"
          href={url(
            `courses/${c.course}/practice/?target=${id}&mode=Quick%20check`,
          )}
        >
          Prove it · take a quick check →
        </a>
      )}
      <a
        className="subtle-link"
        href={url(
          `courses/${c.course}/practice/?target=${id}&mode=Learn%20this`,
        )}
      >
        Learn what I’m missing →
      </a>
      <section className="tutor-tools">
        <h3>Still confused?</h3>
        <p className="small muted">
          Take the right context to the AI tutor you use. No account or paid API
          needed.
        </p>
        <label className="small">
          What would help?
          <select value={intent} onChange={(e) => setIntent(e.target.value)}>
            {[
              'Diagnose my confusion',
              'Explain deeper',
              'I am completely lost',
              'I understand it but cannot solve questions',
              'Diagnose my mistake',
              'Grade my independent written practice',
              'Check my calculation',
              'Give me a hint without the answer',
              'Teach using what I already know',
            ].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <button
          className="secondary"
          onClick={() => {
            void copy();
          }}
        >
          Copy AI tutor prompt ↗
        </button>
        {fallback && (
          <textarea
            aria-label="AI tutor prompt"
            value={fallback}
            readOnly
            rows={10}
          />
        )}
      </section>
      <p className="small" role="status" aria-live="polite">
        {message}
      </p>
    </aside>
  );
}
