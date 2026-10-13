import type { ForceArrow } from '../content/physics-dynamics';
export default function ForceDiagram({
  forces,
  caption = 'Forces on the chosen object · schematic',
}: {
  forces: ForceArrow[];
  caption?: string;
}) {
  const axes = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  return (
    <figure className="force-diagram">
      <svg
        viewBox="0 0 320 230"
        role="img"
        aria-label={forces.map((f) => `${f.label} ${f.direction}`).join('; ')}
      >
        <circle cx="160" cy="115" r="7" fill="currentColor" />
        {forces.map((f, i) => {
          const [dx, dy] = axes[f.direction],
            length = 46 * f.size;
          const x = 160 + dx * length,
            y = 115 + dy * length;
          return (
            <g key={i}>
              <path
                d={`M${160 + dx * 11} ${115 + dy * 11}L${x} ${y}M${x - dx * 9 + dy * 5} ${y - dy * 9 - dx * 5}L${x} ${y}L${x - dx * 9 - dy * 5} ${y - dy * 9 + dx * 5}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <text
                x={x + (dx ? dx * 8 : 12)}
                y={y + (dy > 0 ? 17 : dy < 0 ? -9 : 4)}
                textAnchor={dx < 0 ? 'end' : 'start'}
              >
                {f.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
