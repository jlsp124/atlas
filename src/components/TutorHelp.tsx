import { useState } from 'react';
import { concepts, questions, findConcept } from '../content/catalog';
import { tutorPrompt } from '../core/learning';
import { track, useLearner } from '../client/store';
export default function TutorHelp({ id }: { id: string }) {
  const state = useLearner(),
    [open, setOpen] = useState(false),
    [ai, setAi] = useState(false),
    [intent, setIntent] = useState('Explain this differently'),
    [message, setMessage] = useState(''),
    [fallback, setFallback] = useState('');
  async function copy() {
    const c = findConcept(id);
    const prompt = tutorPrompt(c, concepts, state.events, questions, intent);
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage('Prompt copied. Paste it into the AI you use.');
      track('ai_prompt_copied', c.course, id);
    } catch {
      setFallback(prompt);
      setMessage('Copy this prompt into the AI you use.');
    }
  }
  return (
    <div className="tutor-help">
      <button
        className="quiet"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Need more help?
      </button>
      {open && (
        <div>
          <button className="secondary" onClick={() => setAi((a) => !a)}>
            Ask an AI ↗
          </button>
          {ai && (
            <>
              <div className="intent-list">
                {[
                  'Explain this differently',
                  'I’m completely lost',
                  'Help with my mistake',
                  'Give me a hint',
                  'Go deeper',
                ].map((i) => (
                  <button
                    className="secondary"
                    aria-pressed={intent === i}
                    key={i}
                    onClick={() => setIntent(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <button className="primary" onClick={() => void copy()}>
                Copy AI tutor prompt
              </button>
              <p role="status">{message}</p>
              {fallback && (
                <textarea
                  aria-label="AI tutor prompt"
                  readOnly
                  value={fallback}
                  rows={8}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
