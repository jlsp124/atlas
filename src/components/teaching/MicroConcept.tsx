import type { CompanionQuestion } from '../../core/schema';
import { concepts } from '../../content/catalog';
import Sheet from '../Sheet';
import LearningVisual from '../LearningVisual';
export default function MicroConcept({
  term,
  question,
  onClose,
}: {
  term: string;
  question: CompanionQuestion;
  onClose: () => void;
}) {
  const rest = /dropped|released|from rest/i.test(term),
    stop = /stops|comes to rest/i.test(term);
  const concept = concepts.find((c) => c.id === question.concepts[0]);
  return (
    <Sheet open={Boolean(term)} title="A quick connection" onClose={onClose}>
      <div className="micro-concept">
        <p className="eyebrow">
          {rest || stop ? 'Watch for these words' : 'From this question'}
        </p>
        <h3 lang={/ございます/.test(term) ? 'ja' : undefined}>{term}</h3>
        {rest ? (
          <>
            <div className="micro-word-list">
              <span>dropped</span>
              <span>released</span>
              <span>released from rest</span>
              <span>starts from rest</span>
            </div>
            <div className="micro-equation">vᵢ = 0 m/s</div>
            <p>
              Usually, these words mean no initial push. Gravity can still
              accelerate the object after release.
            </p>
          </>
        ) : stop ? (
          <>
            <div className="micro-equation">v𝒻 = 0 m/s</div>
            <p>
              “Comes to rest” describes the final velocity. The initial velocity
              and acceleration need not be zero.
            </p>
          </>
        ) : term === 'ございます' ? (
          <>
            <p>
              You’ve seen this polite component in your current expressions.
            </p>
            <div className="micro-word-list" lang="ja">
              <span>
                おはよう<strong>ございます</strong>
              </span>
              <span>
                ありがとう<strong>ございます</strong>
              </span>
            </div>
            <p>
              Use the complete expression for the situation. This connection
              helps you recognize the familiar ending.
            </p>
          </>
        ) : (
          <>
            <p>
              {question.clues.find(
                (c) => c.word.toLowerCase() === term.toLowerCase(),
              )?.explanation ??
                concept?.model ??
                question.asking}
            </p>
            <LearningVisual id={question.concepts[0]} />
          </>
        )}
        <button className="primary" onClick={onClose}>
          Back to question {question.number}
        </button>
      </div>
    </Sheet>
  );
}
