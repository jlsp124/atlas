import type { Guide } from '../../core/guide';

export default function DiagramStage({
  guide,
  step,
  onConcept,
}: {
  guide: Guide;
  step: number;
  onConcept: (term: string) => void;
}) {
  const scene = guide.steps[step]?.scene ?? 0;
  return (
    <div className={`diagram-stage scene-${guide.kind}`} data-scene={scene}>
      {guide.kind === 'conversion' && guide.conversion && (
        <div
          className="conversion-chain"
          aria-label={`Convert ${guide.conversion.value} ${guide.conversion.from} to ${guide.conversion.to}`}
        >
          <span
            className="conversion-initial"
            data-motion="conversion-value"
            data-origin="prompt-conversion-source"
          >
            <b>{guide.conversion.value}</b>{' '}
            <span className={scene >= 2 ? 'cancelled-unit' : ''}>
              {guide.conversion.from}
            </span>
          </span>
          {guide.conversion.factors.map((f, i) => (
            <span
              className="conversion-factor"
              key={f.bottom}
              data-motion={`factor-${i}`}
              data-active={scene >= 1}
              aria-hidden={scene < 1}
              style={{ opacity: scene >= 1 ? 1 : 0 }}
            >
              <span>×</span>
              <span className="fraction">
                <span>
                  {f.top.slice(0, f.top.lastIndexOf(' '))}{' '}
                  <span
                    className={
                      scene >= 2 && i < guide.conversion!.factors.length - 1
                        ? 'cancelled-unit'
                        : scene >= 2
                          ? 'remaining-unit'
                          : ''
                    }
                  >
                    {f.top.slice(f.top.lastIndexOf(' ') + 1)}
                  </span>
                </span>
                <span>
                  {f.bottom.slice(0, f.bottom.lastIndexOf(' '))}{' '}
                  <span className={scene >= 2 ? 'cancelled-unit' : ''}>
                    {f.bottom.slice(f.bottom.lastIndexOf(' ') + 1)}
                  </span>
                </span>
              </span>
            </span>
          ))}
          <span
            className="remaining-unit"
            data-motion="conversion-target"
            data-active={scene >= 2}
            aria-hidden={scene < 2}
            style={{ opacity: scene >= 2 ? 1 : 0 }}
          >
            → {guide.conversion.to}
          </span>
        </div>
      )}
      {guide.kind === 'phrase' && (
        <>
          <div
            className={`phrase-construction ${scene > 0 ? 'separated' : ''}`}
            lang="ja"
          >
            <span data-motion="phrase-first">
              {guide.phrase?.replace('ございます', '')}
            </span>
            <span
              className="phrase-plus"
              data-motion="phrase-plus"
              data-active={scene > 0}
              style={{ opacity: scene > 0 ? 1 : 0 }}
            >
              +
            </span>
            <button
              data-motion="phrase-polite"
              className="phrase-component"
              onClick={() => onConcept('ございます')}
            >
              ございます
            </button>
          </div>
          {scene >= 2 && (
            <div className="phrase-relations">
              <p className="eyebrow">Useful next · familiar connection</p>
              <p lang="ja">
                おはよう<span>ございます</span>
                <br />
                ありがとう<span>ございます</span>
              </p>
            </div>
          )}
        </>
      )}
      {guide.kind === 'layers' && (
        <figure>
          <svg
            viewBox="0 0 600 245"
            role="img"
            aria-label="Schematic rock layers at two locations. Matching index fossils correlate a time interval; layer thickness does not set an exact age."
          >
            <text x="68" y="25">
              Location A
            </text>
            <text x="365" y="25" opacity={scene >= 1 ? 1 : 0}>
              Location B
            </text>
            {[0, 1].map((location) => (
              <g
                key={location}
                opacity={location === 0 || scene >= 1 ? 1 : 0}
                className="diagram-build"
              >
                {[0, 1, 2, 3].map((i) => (
                  <rect
                    key={i}
                    x={location === 0 ? 45 : 345}
                    y={48 + i * (location ? 38 : 42)}
                    width="200"
                    height={location ? 38 : 42}
                    rx="1"
                    className={`rock-layer layer-${i} ${scene >= 2 && i === 1 ? 'matched-layer' : ''}`}
                  />
                ))}
                <g
                  transform={`translate(${location ? 445 : 145} ${location ? 105 : 111})`}
                  className="index-fossil"
                >
                  <path d="M-13 0a13 13 0 1 0 26 0a10 10 0 1 0-20 0a7 7 0 1 0 14 0a4 4 0 1 0-8 0" />
                </g>
              </g>
            ))}
            <path
              d="M246 111C285 111 309 105 344 105"
              className="correlation-line"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: scene >= 2 ? 0 : 1,
              }}
            />
            <text x="48" y="236">
              Older layers below · undisturbed sequence
            </text>
          </svg>
          <figcaption>
            Schematic model · match the fossil, not the thickness.
          </figcaption>
        </figure>
      )}
      {guide.kind === 'half-life' && (
        <figure>
          <svg
            viewBox="0 0 600 230"
            role="img"
            aria-label={`${scene === 0 ? '100' : scene === 1 ? '50' : scene === 2 ? '25' : '12.5'} percent parent remains after ${scene} half-lives. Equal intervals halve the remaining parent amount.`}
          >
            {Array.from({ length: 32 }, (_, i) => (
              <circle
                key={i}
                cx={65 + (i % 8) * 26}
                cy={52 + Math.floor(i / 8) * 31}
                r="7"
                className={`isotope ${i < 32 / 2 ** scene ? 'parent-isotope' : 'daughter-isotope'}`}
              />
            ))}
            <path d="M310 171H558M310 32V171" className="diagram-axis" />
            {[100, 50, 25, 12.5].map((n, i) => (
              <g key={n} opacity={scene >= i ? 1 : 0}>
                <rect
                  x={328 + i * 58}
                  y={171 - n * 1.25}
                  width="27"
                  height={n * 1.25}
                  className="diagram-accent"
                />
                <text x={330 + i * 58} y="195">
                  {i}
                </text>
              </g>
            ))}
            <text x="319" y="223">
              Elapsed half-lives
            </text>
            <text x="56" y="195">
              {100 / 2 ** scene}% parent remains
            </text>
          </svg>
          <figcaption>
            Parent atoms become daughter products. They do not disappear.
          </figcaption>
        </figure>
      )}
      {guide.kind === 'cell' && (
        <figure>
          <svg
            viewBox="0 0 600 240"
            role="img"
            aria-label="A bacterium becomes retained in an ancestral cell; bacterial-like DNA, ribosomes and binary fission support endosymbiosis."
          >
            <ellipse
              cx="280"
              cy="119"
              rx="153"
              ry="83"
              className="cell-outline"
            />
            <circle cx="237" cy="117" r="27" className="cell-nucleus" />
            <g
              className="bacterium"
              style={{
                transform:
                  scene >= 1
                    ? 'translate(345px, 130px)'
                    : 'translate(505px, 90px)',
              }}
            >
              <ellipse rx="30" ry="15" />
              <path d="M-18 0q9-11 18 0t18 0" />
            </g>
            <text x="151" y="223">
              Ancestral cell
            </text>
            {scene >= 2 && (
              <>
                <text x="350" y="32">
                  DNA · ribosomes · division
                </text>
                <path d="M390 40L354 111" className="diagram-axis" />
              </>
            )}
          </svg>
          <figcaption>
            Proposed ancestry · explain how each clue supports the model.
          </figcaption>
        </figure>
      )}
      {guide.kind === 'lewis' && (
        <figure>
          <svg
            viewBox="0 0 600 265"
            role="img"
            aria-label={`Water worked model: 8 valence electrons, ${scene >= 1 ? 'two bonds use four' : 'none placed yet'}, ${scene >= 2 ? 'two lone pairs use four; bent molecular shape' : 'complete the remaining pairs'}.`}
          >
            <text x="293" y="121" className="atom-label">
              O
            </text>
            <text
              x={scene >= 3 ? 200 : 180}
              y={scene >= 3 ? 190 : 121}
              className="atom-label diagram-build"
            >
              H
            </text>
            <text
              x={scene >= 3 ? 387 : 409}
              y={scene >= 3 ? 190 : 121}
              className="atom-label diagram-build"
            >
              H
            </text>
            <path
              d={
                scene >= 3
                  ? 'M281 135L225 173 M319 135L375 173'
                  : 'M210 113H279 M321 113H400'
              }
              className="chemical-bond"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: scene >= 1 ? 0 : 1,
              }}
            />
            {[270, 282, 319, 331].map((x, i) => (
              <circle
                key={x}
                cx={scene >= 2 ? x : 80 + i * 28}
                cy={scene >= 2 ? 66 : 42}
                r="4"
                className="electron-dot diagram-build"
              />
            ))}
            <text x="36" y="242">
              {scene === 0
                ? '8 electrons available'
                : scene === 1
                  ? '4 electrons remain'
                  : '0 electrons remain · 8 accounted for'}
            </text>
            {scene >= 3 && (
              <path d="M262 147Q300 175 338 147" className="angle-marker" />
            )}
          </svg>
          <figcaption>
            Worked model: H₂O · use this method on the exact assigned list.
          </figcaption>
        </figure>
      )}
    </div>
  );
}
