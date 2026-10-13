import type { PrivatePhysicsSource } from '../core/physics-source';
import ReadableText from './ReadableText';
import ForceDiagram from './ForceDiagram';

export function ReferenceSketch({
  sketch,
}: {
  sketch: NonNullable<PrivatePhysicsSource['sections'][number]['sketch']>;
}) {
  const dirs = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };
  return (
    <figure className="class-reference-sketch">
      <figcaption>{sketch.caption}</figcaption>
      <svg viewBox="0 0 600 360" role="img" aria-label={sketch.caption}>
        {sketch.edges?.map((edge, i) => {
          const a = sketch.nodes[edge.from],
            b = sketch.nodes[edge.to];
          if (!a || !b) return null;
          const dx = b.x - a.x,
            dy = b.y - a.y,
            l = Math.hypot(dx, dy);
          if (!l) return null;
          return Array.from({ length: edge.order }, (_, j) => (
            <line
              key={`${i}-${j}`}
              x1={
                a.x + (dx / l) * 25 - (dy / l) * (j - (edge.order - 1) / 2) * 7
              }
              y1={
                a.y + (dy / l) * 25 + (dx / l) * (j - (edge.order - 1) / 2) * 7
              }
              x2={
                b.x - (dx / l) * 25 - (dy / l) * (j - (edge.order - 1) / 2) * 7
              }
              y2={
                b.y - (dy / l) * 25 + (dx / l) * (j - (edge.order - 1) / 2) * 7
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={edge.dashed ? '3 5' : undefined}
            />
          ));
        })}
        {sketch.nodes.map((node, i) => (
          <g key={i}>
            <text
              className="reference-atom"
              x={node.x}
              y={node.y + 9}
              textAnchor="middle"
            >
              {node.label.split('\n').map((line, j) => (
                <tspan key={j} x={node.x} dy={j === 0 ? 0 : '1.15em'}>
                  {line}
                </tspan>
              ))}
            </text>
            {node.charge && (
              <text x={node.x + 24} y={node.y - 19}>
                {node.charge}
              </text>
            )}
            {node.pairs?.flatMap((side, j) =>
              [-1, 1].map((sign) => {
                const [dx, dy] = dirs[side];
                return (
                  <circle
                    key={`p${j}${sign}`}
                    cx={node.x + dx * 34 + (dy ? sign * 6 : 0)}
                    cy={node.y + dy * 34 + (dx ? sign * 6 : 0)}
                    r="3.6"
                    fill="currentColor"
                  />
                );
              }),
            )}
            {node.dots?.map((side, j) => {
              const [dx, dy] = dirs[side];
              return (
                <circle
                  key={`d${j}`}
                  cx={node.x + dx * 34}
                  cy={node.y + dy * 34}
                  r="3.6"
                  fill="currentColor"
                />
              );
            })}
          </g>
        ))}
      </svg>
    </figure>
  );
}
export default function ClassNoteCopy({
  source,
}: {
  source: PrivatePhysicsSource;
}) {
  return (
    <article className="class-note-copy">
      {source.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.heading}</h2>
          {section.text
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((paragraph, j) => (
              <p key={j}>
                <ReadableText text={paragraph} />
              </p>
            ))}
          {section.table && (
            <div className="class-table-wrap">
              <table>
                <thead>
                  <tr>
                    {section.table.headers.map((h, j) => (
                      <th scope="col" key={j}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>
                          <ReadableText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {section.sketch && <ReferenceSketch sketch={section.sketch} />}{' '}
          {section.diagram && <ForceDiagram {...section.diagram} />}
        </section>
      ))}
    </article>
  );
}
