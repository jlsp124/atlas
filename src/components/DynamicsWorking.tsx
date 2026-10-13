import type { Walkthrough } from '../core/walkthrough';
import ReadableText from './ReadableText';
import ForceDiagram from './ForceDiagram';
function DynamicsText({ text }: { text: string }) {
  const parts = text.split(
    /(?<![A-Za-z])(Fnet|Fhand|Fpull|Flift|Fg|FN|Fair|F1|F2|FA|FS|FK|Tmax|amax|gE|gM|WE|WM|Wcase|Ncart|Ncase|Nfloor|a0)(?![A-Za-z])/,
  );
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span className="dynamics-symbol" key={i}>
            {part[0]}
            <sub>{part.slice(1)}</sub>
          </span>
        ) : (
          <ReadableText key={i} text={part} />
        ),
      )}
    </>
  );
}
export default function DynamicsWorking({
  guide,
  step,
}: {
  guide: Walkthrough;
  step: number;
}) {
  const d = guide.dynamics!,
    current = guide.steps[step];
  const working = guide.steps.filter((s) => s.phase.startsWith('point-'));
  const active =
    current.phase === 'finish' ? working.length - 1 : working.indexOf(current);
  return (
    <div
      className="physics-working dynamics-working"
      aria-label="Working on paper"
    >
      {d.values.length > 0 && (
        <div className="known-values">
          {d.values.map((v) => {
            const at = guide.steps.findIndex(
              (s) =>
                s.phase === 'known' && s.write?.startsWith(v.symbol + ' ='),
            );
            const visible = step >= at;
            return (
              <div
                className="known-value"
                key={v.symbol}
                data-on={visible}
                aria-hidden={!visible}
              >
                <span>
                  <DynamicsText text={v.symbol} /> ={' '}
                </span>
                <span
                  className="value-token"
                  data-move-id={`known-${v.symbol}`}
                  data-origin={`source-${v.symbol}`}
                  data-origin-id={`known-${v.symbol}`}
                  data-on={visible}
                >
                  {v.text}
                </span>
                <span className="value-unit"> {v.unit}</span>
              </div>
            );
          })}
          <div
            className="known-value unknown-value"
            data-on={
              step >= guide.steps.findIndex((s) => s.phase === 'unknown')
            }
          >
            <DynamicsText text={d.target} /> = ?
          </div>
        </div>
      )}
      {active >= 0 && (
        <>
          <div
            className="dynamics-relationships"
            aria-label="Build the relationship"
          >
            {working.slice(active, active + 1).map((s) => (
              <div
                key={active}
                className="relationship-line"
                data-current="true"
              >
                <p className="paper-meta">{s.title}</p>
                <p
                  className="live-equation"
                  data-move-id="active-relationship"
                  data-on="true"
                >
                  <DynamicsText text={s.write!} />
                </p>
              </div>
            ))}
            {active > 0 && (
              <details className="dynamics-earlier">
                <summary>Earlier relationships</summary>
                {working.slice(0, active).map((s, i) => (
                  <p key={i}>
                    <DynamicsText text={s.write!} />
                  </p>
                ))}
              </details>
            )}
          </div>
          {d.forces && <ForceDiagram forces={d.forces} />}
        </>
      )}
      <p className="paper-origin">
        {d.gap
          ? `Source gap: ${d.gap}`
          : current.phase === 'finish'
            ? 'atlas-derived working · keep units and write vector directions in words.'
            : 'Build this working on your own paper.'}
      </p>
    </div>
  );
}
