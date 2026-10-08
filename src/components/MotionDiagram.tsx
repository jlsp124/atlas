export default function MotionDiagram() {
  return (
    <figure className="physics-graph">
      <figcaption>Golf ball motion diagram · equal 1 s intervals</figcaption>
      <svg
        viewBox="0 0 420 234"
        role="img"
        aria-label="Golf ball positions at 0 through 6 seconds are 0, 1.75, 3, 3.75, 4, 3.75 and 3 metres uphill. Velocity arrows shorten while moving uphill, become zero at 4 seconds, then point downhill."
      >
        <text x="62" y="18">
          Position uphill (m) →
        </text>
        {[0, 1, 2, 3, 4].map((d) => (
          <g key={d}>
            <path d={`M${70 + d * 65} 32V211`} className="plot-grid" />
            <text x={70 + d * 65} y="229" textAnchor="middle">
              {d}
            </text>
          </g>
        ))}
        {Array.from({ length: 7 }, (_, t) => {
          const d = 2 * t - 0.25 * t * t,
            v = 2 - 0.5 * t,
            x = 70 + d * 65,
            y = 40 + t * 26;
          return (
            <g key={t}>
              <text x="0" y={y + 4}>
                {t} s
              </text>
              <circle cx={x} cy={y} r="3" fill="currentColor" />
              {v !== 0 && (
                <>
                  <path d={`M${x} ${y}h${v * 20}`} className="plot-line" />
                  <path
                    d={`M${x + v * 20 - (v > 0 ? 5 : -5)} ${y - 3}l${v > 0 ? 5 : -5} 3l${v > 0 ? -5 : 5} 3`}
                    className="plot-line"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
      <p>
        Each row is the next instant. Dot position uses the same scale; arrow
        length shows velocity magnitude. The 4 s dot has no velocity arrow.
        Acceleration remains downhill through the turnaround.
      </p>
    </figure>
  );
}
