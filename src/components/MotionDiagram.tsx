export default function MotionDiagram() {
  return (
    <figure className="physics-graph">
      <figcaption>Golf ball motion diagram · equal 1 s intervals</figcaption>
      <svg
        viewBox="0 0 420 234"
        role="img"
        aria-label="Golf ball dot positions at 0 through 6 seconds are 0, 1.75, 3, 3.75, 4, 3.75 and 3 metres uphill. The dots approach the turning point then move downhill."
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
            x = 70 + d * 65,
            y = 40 + t * 26;
          return (
            <g key={t}>
              <text x="0" y={y + 4}>
                {t} s
              </text>
              <circle cx={x} cy={y} r="3" fill="currentColor" />
            </g>
          );
        })}
      </svg>
      <p>
        Each row is the next instant. Dot position uses the same scale. The 4 s
        dot is the turning point. Acceleration remains downhill through the
        turnaround.
      </p>
    </figure>
  );
}
