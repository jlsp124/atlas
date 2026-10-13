export type DotMotion = {
  direction: 'up' | 'down' | 'right' | 'still';
  spacing: 'equal' | 'increasing' | 'decreasing' | 'overlapping';
};

export function dotPositions(motion: DotMotion) {
  const gaps =
    motion.spacing === 'increasing'
      ? [12, 22, 32, 42]
      : motion.spacing === 'decreasing'
        ? [42, 32, 22, 12]
        : motion.spacing === 'overlapping'
          ? [0, 0, 0, 0]
          : [27, 27, 27, 27];
  return gaps.reduce<number[]>(
    (points, gap) => [...points, points.at(-1)! + gap],
    [0],
  );
}

export default function DotDiagram({ motion }: { motion: DotMotion }) {
  const positions = dotPositions(motion);
  const vertical = motion.direction === 'up' || motion.direction === 'down';
  const description =
    motion.direction === 'still'
      ? 'At rest: successive positions overlap.'
      : `Moving ${motion.direction}: ${motion.spacing} spacing at equal time intervals.`;
  return (
    <figure className="physics-graph dot-diagram">
      <figcaption>Dot diagram · equal time intervals</figcaption>
      <svg
        viewBox={vertical ? '0 0 220 170' : '0 0 300 80'}
        role="img"
        aria-label={description}
      >
        {positions.map((position, i) => {
          const y = vertical
            ? motion.direction === 'up'
              ? 140 - position
              : 30 + position
            : 40;
          const x = vertical ? 70 : 60 + position;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={motion.direction === 'still' ? 6 + i * 3 : 5}
                fill={motion.direction === 'still' ? 'none' : 'currentColor'}
                stroke="currentColor"
              />
              {motion.direction !== 'still' && (
                <text
                  x={vertical ? 90 : x}
                  y={vertical ? y + 4 : 65}
                  textAnchor={vertical ? 'start' : 'middle'}
                >
                  {i === 0 ? 'start' : i === 4 ? 'later' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p>
        {description} Qualitative positions; no measured times or distances are
        implied.
      </p>
    </figure>
  );
}
