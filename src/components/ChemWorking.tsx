import { useEffect, useState } from 'react';
import type { Assignment, CompanionQuestion } from '../core/schema';
import { makeWalkthrough } from '../core/walkthrough';
import GuidedVisual from './GuidedVisual';
import ReadableText from './ReadableText';
import { Icon } from './Icons';
import { emit, useLearner } from '../client/store';
import { questionStep } from '../core/assignment-progress';

export default function ChemWorking({
  assignment,
  question,
}: {
  assignment: Assignment;
  question: CompanionQuestion;
}) {
  const guide = makeWalkthrough(assignment, question);
  const [step, setStep] = useState(0);
  const state = useLearner();
  useEffect(() => {
    const value = new URLSearchParams(location.search).get('step');
    const at =
      value !== null
        ? Number(value)
        : questionStep(assignment.id, question.id, state.events);
    if (Number.isFinite(at))
      setStep(Math.max(0, Math.min(guide.steps.length - 1, at)));
  }, [assignment.id, question.id, guide.steps.length, state.ready]);
  function changeStep(at: number) {
    setStep(at);
    const route = new URL(location.href);
    route.searchParams.set('step', String(at));
    route.hash = question.id;
    history.replaceState(null, '', route.pathname + route.search + route.hash);
    emit('assignment_progress', {
      assignment: assignment.id,
      question: question.id,
      status: 'in-progress',
      step: at,
    });
  }
  return (
    <div className="chem-working" data-kind={guide.kind}>
      <p className="meta">{guide.example ?? 'Build the working'}</p>
      <h3>{guide.steps[step].title}</h3>
      <p>
        <ReadableText text={guide.steps[step].text} />
      </p>
      <GuidedVisual guide={guide} step={step} />
      {guide.kind === 'lewis' && step === guide.steps.length - 1 && (
        <p className="chem-caption">
          Water has two bonds and two lone pairs around oxygen: four electron
          groups. Their electron geometry is tetrahedral; the H–O–H molecular
          shape is bent. The Lewis picture above shows the electron allocation.
        </p>
      )}
      <div className="chem-step-controls">
        <button
          className="secondary"
          onClick={() => changeStep(step - 1)}
          disabled={step === 0}
        >
          Back
        </button>
        <small>
          {step + 1} / {guide.steps.length}
        </small>
        <button
          className="primary"
          onClick={() => changeStep(step + 1)}
          disabled={step === guide.steps.length - 1}
        >
          Next <Icon name="arrow" size={14} />
        </button>
      </div>
    </div>
  );
}
