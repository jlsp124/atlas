import type { PhysicsGraphSpec } from '../core/physics-graphs';
export default function PhysicsGraph({ graph }: { graph: PhysicsGraphSpec }) {
  const all = graph.series.flatMap((s) => s.points);
  if (!all.length) return null;
  const xMin = Math.min(0, ...all.map((p) => p[0])),
    xMax = Math.max(...all.map((p) => p[0])) || 1;
  const lo = Math.min(0, ...all.map((p) => p[1])),
    hi = Math.max(0, ...all.map((p) => p[1]));
  const span = hi - lo || 1,
    yMin = lo < 0 ? lo - span * 0.1 : 0,
    yMax = hi + span * 0.1;
  const x = (v: number) => 62 + ((v - xMin) / (xMax - xMin)) * 326;
  const y = (v: number) => 184 - ((v - yMin) / (yMax - yMin)) * 146;
  const ticks = (min: number, max: number) =>
    Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const number = (v: number) => Number(v.toPrecision(3)).toString();
  return (
    <figure className="physics-graph">
      <figcaption>{graph.title}</figcaption>
      <svg viewBox="0 0 420 240" role="img" aria-label={graph.description}>
        {ticks(xMin, xMax).map((t) => (
          <g key={t}>
            <path d={`M${x(t)} 38V184`} className="plot-grid" />
            <text x={x(t)} y="204" textAnchor="middle">
              {number(t)}
            </text>
          </g>
        ))}
        {ticks(lo, hi === lo ? lo + 1 : hi).map((v) => (
          <g key={v}>
            <path d={`M62 ${y(v)}H388`} className="plot-grid" />
            <text x="54" y={y(v) + 4} textAnchor="end">
              {number(v)}
            </text>
          </g>
        ))}
        <path d={`M62 38V184M62 ${y(0)}H388`} className="plot-axis" />
        <text x="62" y="21" className="plot-label">
          {graph.yLabel}
        </text>
        <text x="225" y="229" textAnchor="middle" className="plot-label">
          {graph.xLabel}
        </text>
        {graph.series.map((s, i) => (
          <g key={i} className={`plot-series plot-series-${i}`}>
            {s.line && (
              <polyline
                points={s.points.map((p) => `${x(p[0])},${y(p[1])}`).join(' ')}
                className="plot-line"
              />
            )}
            {s.dots &&
              s.points.map((p, k) => (
                <circle key={k} cx={x(p[0])} cy={y(p[1])} r="3" />
              ))}
          </g>
        ))}
      </svg>
      <p>{graph.description}</p>
    </figure>
  );
}
