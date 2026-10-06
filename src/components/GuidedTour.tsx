import { useEffect, useState } from 'react';
import { assignments } from '../content/catalog';
import { url, useLearner } from '../client/store';
const key = 'atlas:guided-tour';
export function startTour() {
  try {
    localStorage.setItem(key, '0');
  } catch {
    /* Tour is optional when storage is unavailable. */
  }
  window.dispatchEvent(new Event('atlas:tour'));
}
export function stopTour() {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Closing remains available without storage. */
  }
  window.dispatchEvent(new Event('atlas:tour'));
}
const steps = [
  {
    selector: '.upcoming-work',
    title: 'Start with what’s next.',
    body: 'These are dated course snapshots. An unconfirmed date stays visibly unconfirmed.',
    action: 'Open an assignment',
  },
  {
    selector: '.task-list',
    title: 'Your work, in smaller steps.',
    body: 'An original companion organizes your teacher’s work. Checkboxes save on this device; use the original for submission.',
    action: 'Show the connections',
  },
  {
    selector: '.assignment-context',
    title: 'See what the work uses.',
    body: 'Concept evidence and the local map show the prerequisites to practise first. The list gives the same connections as the graph.',
    action: 'Open one concept',
  },
  {
    selector: '.self-report',
    title: 'Tell atlas where you’re stuck.',
    body: '“I don’t understand this” raises the priority for a small diagnosis. “I think I know this” invites a check rather than claiming mastery.',
    action: 'About progress sync',
  },
  {
    selector: '.account-panel',
    title: 'Want progress on your other devices?',
    body: 'An optional account syncs learning events when the server is available. Guest learning stays useful on this device.',
    action: 'Keep using atlas without one',
  },
];
export default function GuidedTour() {
  const state = useLearner();
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem(key);
        const n = stored === null ? NaN : Number(stored);
        setStep(Number.isInteger(n) && n >= 0 && n < steps.length ? n : null);
      } catch {
        setStep(null);
      }
    };
    read();
    window.addEventListener('atlas:tour', read);
    return () => window.removeEventListener('atlas:tour', read);
  }, []);
  useEffect(() => {
    if (step === null) return;
    document.body.classList.add('has-tour');
    document.body.dataset.tourStep = String(step);
    const el = document.querySelector(steps[step].selector);
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
    return () => {
      document.body.classList.remove('has-tour');
      delete document.body.dataset.tourStep;
    };
  }, [step]);
  if (step === null) return null;
  const assignment =
    assignments.find((a) => state.selected.includes(a.course)) ??
    assignments[0];
  function next() {
    if (step === null) return;
    if (step === 4) {
      stopTour();
      return;
    }
    const nextStep = step + 1;
    try {
      localStorage.setItem(key, String(nextStep));
    } catch {
      stopTour();
      return;
    }
    setStep(nextStep);
    if (step === 0) window.location.href = url(`work/${assignment.id}/`);
    if (step === 2)
      window.location.href = url(`concepts/${assignment.concepts[0]}/`);
    if (step === 3) window.location.href = url('account/');
  }
  return (
    <aside className="guided-tour" aria-label="Optional guided introduction">
      <div className="dialog-top">
        <p className="eyebrow">
          A QUICK LOOK · {step + 1} / {steps.length}
        </p>
        <button className="quiet" onClick={stopTour}>
          Skip tour
        </button>
      </div>
      <h2>{steps[step].title}</h2>
      <p>{steps[step].body}</p>
      <div className="button-row">
        {step === 4 && (
          <a className="primary" href={url('account/')} onClick={stopTour}>
            Create account
          </a>
        )}
        <button className={step === 4 ? 'secondary' : 'primary'} onClick={next}>
          {steps[step].action}
          {step < 4 ? ' →' : ''}
        </button>
      </div>
    </aside>
  );
}
