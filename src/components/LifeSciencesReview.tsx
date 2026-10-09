import { useState } from 'react';
import { lifeReviewTerms, lifeIdeaPath } from '../content/life-sciences';
import { url } from '../client/store';
import { LifeNavigation } from './LifeSciences';
import { Icon } from './Icons';
import '../styles/life-sciences.css';

export default function LifeSciencesReview() {
  const [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false);
  const term = lifeReviewTerms[index % lifeReviewTerms.length];
  return (
    <div className="life-screen" data-course="life-sciences">
      <header className="life-page-heading">
        <p className="meta">Life Sciences 11</p>
        <h1>Definitions review</h1>
        <p className="muted">
          Optional recall practice, separate from your assignments.
        </p>
      </header>
      <LifeNavigation current="definitions" />
      <section className="life-review" aria-live="polite">
        <p className="meta">
          {(index % lifeReviewTerms.length) + 1} of {lifeReviewTerms.length}
        </p>
        <h2>{term.title}</h2>
        <p className="muted">Explain it in one sentence before you look.</p>
        {revealed && (
          <div className="life-review-definition">
            <p>{term.simple}</p>
            <a href={url(lifeIdeaPath(term.id))}>
              Open key idea
              <Icon name="arrow" size={15} />
            </a>
          </div>
        )}
        <div className="life-review-actions">
          <button className="secondary" onClick={() => setRevealed(!revealed)}>
            {revealed ? 'Hide definition' : 'Show definition'}
          </button>
          <button
            className="primary"
            onClick={() => {
              setIndex(index + 1);
              setRevealed(false);
            }}
          >
            Next term
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
