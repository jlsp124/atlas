import type { LifeIdea } from '../content/life-sciences';

/** Small schematic models; no teacher figures or copyrighted source diagrams. */
export default function LifeIdeaVisual({ kind }: { kind: LifeIdea['visual'] }) {
  if (kind === 'half-life')
    return (
      <figure className="life-visual">
        <div
          className="life-halves"
          aria-label="Each equal half-life halves the remaining parent atoms"
        >
          {[100, 50, 25, 12.5].map((amount, i) => (
            <div key={amount}>
              <span className="life-half-bar">
                <i style={{ height: `${amount}%` }} />
              </span>
              <strong>{amount}%</strong>
              <small>{i} half-lives</small>
            </div>
          ))}
        </div>
        <figcaption>
          Equal time intervals. Half of the remainder decays each time.
        </figcaption>
      </figure>
    );
  if (kind === 'layers')
    return (
      <figure className="life-visual">
        <div className="life-layers">
          <div>
            <span>Top layer</span>
            <strong>Younger</strong>
          </div>
          <div>
            <span>Middle layer</span>
            <span>↓</span>
          </div>
          <div>
            <span>Bottom layer</span>
            <strong>Older</strong>
          </div>
        </div>
        <figcaption>
          A schematic undisturbed sequence. The layers give an order, not an age
          in years.
        </figcaption>
      </figure>
    );
  if (kind === 'eras')
    return (
      <figure className="life-visual">
        <div className="life-process">
          <span>
            <strong>Paleozoic</strong>
            <small>Marine diversity; vertebrates move onto land</small>
          </span>
          <b aria-hidden="true">→</b>
          <span>
            <strong>Mesozoic</strong>
            <small>
              Dinosaurs dominate; mammals and flowering plants appear
            </small>
          </span>
          <b aria-hidden="true">→</b>
          <span>
            <strong>Cenozoic</strong>
            <small>Mammals diversify on land, in water and in air</small>
          </span>
        </div>
        <figcaption>
          Class era anchors, in order. This diagram is not to scale.
        </figcaption>
      </figure>
    );
  if (kind === 'evolution')
    return (
      <figure className="life-visual">
        <svg
          viewBox="0 0 420 150"
          role="img"
          aria-label="One ancestral lineage branches into descendants adapted to three different niches"
        >
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M40 75H155M155 75L275 30H365M155 75H365M155 75L275 120H365" />
          </g>
          <g fill="currentColor">
            <circle cx="40" cy="75" r="6" />
            <circle cx="365" cy="30" r="6" />
            <circle cx="365" cy="75" r="6" />
            <circle cx="365" cy="120" r="6" />
          </g>
          <text x="20" y="108">
            Ancestor
          </text>
          <text x="282" y="20">
            Niche A
          </text>
          <text x="282" y="66">
            Niche B
          </text>
          <text x="282" y="145">
            Niche C
          </text>
        </svg>
        <figcaption>
          Adaptive radiation: one lineage, several ways of living.
        </figcaption>
      </figure>
    );
  if (kind === 'symbiosis')
    return (
      <figure className="life-visual">
        <div className="life-symbiosis">
          <svg
            viewBox="0 0 390 125"
            role="img"
            aria-label="A smaller bacterium enters a larger cell and persists inside it as a partner"
          >
            <g fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="60" cy="57" rx="41" ry="34" />
              <circle cx="48" cy="52" r="9" />
              <ellipse cx="121" cy="57" rx="12" ry="7" />
              <path d="M155 57H212m-8-7 8 7-8 7" />
              <ellipse cx="300" cy="57" rx="48" ry="35" />
              <circle cx="280" cy="52" r="9" />
              <ellipse cx="320" cy="63" rx="12" ry="7" />
            </g>
            <text x="16" y="112">
              Larger cell + bacterium
            </text>
            <text x="244" y="112">
              Lasting partnership
            </text>
          </svg>
        </div>
        <div className="life-process life-organelle">
          <span>
            Oxygen-using bacterium<b>→</b>
            <strong>Mitochondrion</strong>
          </span>
          <span>
            Photosynthetic bacterium<b>→</b>
            <strong>Chloroplast</strong>
          </span>
        </div>
        <figcaption>
          A simplified model over many generations, not an instant
          transformation.
        </figcaption>
      </figure>
    );
  return null;
}
