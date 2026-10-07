import type { CSSProperties } from 'react';
import MathToken from './MathToken';
import { equationText, layoutEquation, type Expr } from '../../core/equation';
export default function EquationStage({
  frames,
  frame,
}: {
  frames: Expr[];
  frame: number;
}) {
  const layouts = frames.map(layoutEquation),
    layout = layouts[frame];
  const ids = [...new Set(layouts.flatMap((l) => l.tokens.map((t) => t.id)))];
  return (
    <div
      className="equation-stage"
      data-formula-frame={frame}
      role="img"
      aria-label={equationText(frames[frame])}
    >
      <span className="sr-only">{equationText(frames[frame])}</span>
      {ids.map((id) => {
        const token = layout.tokens.find((t) => t.id === id),
          fallback = layouts.flatMap((l) => l.tokens).find((t) => t.id === id)!;
        const t = token ?? fallback;
        return (
          <span
            key={id}
            aria-hidden="true"
            className={`equation-token ${t.width ? 'equation-line' : ''} ${t.source ? 'equation-variable' : ''}`}
            data-token={id}
            data-motion={`equation-${id}`}
            data-origin={t.source}
            data-copy={frame === 2}
            data-active={Boolean(token)}
            style={
              {
                left: `${8 + (t.x / layout.width) * 84}%`,
                top: `calc(50% + ${t.y * 1.1}em)`,
                fontSize: `${t.size}em`,
                width: t.width
                  ? `${(t.width / layout.width) * 84}%`
                  : undefined,
                opacity: token ? 1 : 0,
              } as CSSProperties
            }
          >
            <MathToken text={t.text} />
          </span>
        );
      })}
    </div>
  );
}
