export default function LearningVisual({ id }: { id: string }) {
  if (!['motion-graphs', 'half-life', 'cladograms'].includes(id)) return null;
  return (
    <figure className="learning-figure">
      {id === 'motion-graphs' ? (
        <svg
          viewBox="0 0 440 240"
          role="img"
          aria-label="Velocity is negative three metres per second for four seconds. Signed area is negative twelve metres; zero slope means zero acceleration."
        >
          <rect x="64" y="98" width="304" height="76" className="figure-fill" />
          <path d="M64 26V208 M44 98H402" className="figure-axis" />
          <path d="M64 174H368" className="figure-line" />
          <path d="M368 98V179" className="figure-guide" />
          <text x="14" y="28">
            v (m/s)
          </text>
          <text x="381" y="122">
            t (s)
          </text>
          <text x="44" y="116">
            0
          </text>
          <text x="27" y="179">
            −3
          </text>
          <text x="362" y="91">
            4
          </text>
          <text x="100" y="138">
            signed area = −12 m
          </text>
          <text x="116" y="199">
            slope = 0 → acceleration = 0
          </text>
        </svg>
      ) : id === 'half-life' ? (
        <svg
          viewBox="0 0 440 245"
          role="img"
          aria-label="Parent isotope halves each interval: one hundred, fifty, twenty-five, twelve point five percent."
        >
          <path d="M64 25V203H395" className="figure-axis" />
          <path
            d={Array.from(
              { length: 61 },
              (_, i) =>
                `${i ? 'L' : 'M'}${64 + i * 5} ${203 - 160 * 2 ** (-i / 20)}`,
            ).join(' ')}
            className="figure-line"
          />
          {[
            { x: 64, y: 43, n: '100%' },
            { x: 164, y: 123, n: '50%' },
            { x: 264, y: 163, n: '25%' },
            { x: 364, y: 183, n: '12.5%' },
          ].map((p, i) => (
            <g key={p.n}>
              <circle cx={p.x} cy={p.y} r="4" className="figure-point" />
              <text x={p.x + 5} y={p.y - 10}>
                {p.n}
              </text>
              <text x={p.x - 4} y="222">
                {i}
              </text>
            </g>
          ))}
          <text x="6" y="21">
            parent
          </text>
          <text x="158" y="241">
            elapsed half-lives
          </text>
        </svg>
      ) : (
        <svg
          viewBox="0 0 440 235"
          role="img"
          aria-label="A and B share a more recent common ancestor than either shares with C."
        >
          <path
            d="M46 190H104V64H214 M104 160H365 M214 64V34H365 M214 64V94H365"
            className="figure-line"
          />
          <circle cx="104" cy="160" r="4" className="figure-point" />
          <circle cx="214" cy="64" r="4" className="figure-point" />
          <text x="380" y="39">
            A
          </text>
          <text x="380" y="99">
            B
          </text>
          <text x="380" y="165">
            C
          </text>
          <text x="160" y="132">
            recent shared ancestor
          </text>
          <text x="25" y="217">
            root
          </text>
        </svg>
      )}
      <figcaption>
        {id === 'motion-graphs'
          ? 'Height: velocity. Slope: acceleration. Signed area: displacement.'
          : id === 'half-life'
            ? 'Each interval halves what remains. Real dating also needs a suitable isotope and sample.'
            : 'Follow the shared branching points. Tip order doesn’t change ancestry.'}
      </figcaption>
    </figure>
  );
}
