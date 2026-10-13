import { useState } from 'react';
import {
  lewisBudget,
  formalCharges,
  valence,
  type LewisModel,
} from '../content/chemistry-lewis';
import { Icon } from './Icons';

export default function ChemLewis({ model }: { model: LewisModel }) {
  const [stage, setStage] = useState(0),
    [other, setOther] = useState(false);
  const m =
    other && model.alternative ? { ...model, ...model.alternative } : model;
  const total = lewisBudget(m),
    singleUsed = m.bonds.length * 2,
    bondUsed = m.bonds.reduce((n, b) => n + b[2] * 2, 0);
  const charges = formalCharges(m);
  const contributions = [...new Set(m.atoms.map((a) => a.element))].map(
    (element) =>
      `${element}: ${m.atoms.filter((a) => a.element === element).length} × ${valence[element]}`,
  );
  return (
    <div className="chem-lewis" data-stage={stage}>
      <div className="chem-electron-budget" aria-live="polite">
        <strong>{total} total e⁻</strong>
        <span>
          {stage === 0
            ? `${total} to allocate`
            : stage === 1
              ? `${singleUsed} in single bonds · ${total - singleUsed} left`
              : `${bondUsed} in bonds · ${total - bondUsed} in lone pairs`}
        </span>
      </div>
      <p className="chem-valence-count">
        {contributions.join(' + ')}
        {m.charge < 0
          ? ` + ${-m.charge} for charge`
          : m.charge > 0
            ? ` − ${m.charge} for charge`
            : ''}{' '}
        = {total} e⁻
      </p>
      <p>
        {stage === 0
          ? 'Add each atom’s valence electrons. Add one for each negative charge; subtract one for each positive charge.'
          : stage === 1
            ? 'Follow the printed connections with single bonds first. Each line uses two electrons from the fixed budget.'
            : 'Finish outer-atom octets and place remaining pairs. Where an ordinary C/N/O atom still lacks an octet, move a lone pair into another shared pair. No new electrons are created.'}
      </p>
      <svg
        viewBox="0 0 440 280"
        role="img"
        aria-label={`${m.title}: ${stage === 0 ? 'printed skeleton; count electrons' : stage === 1 ? 'single bonds; remaining electron budget' : 'reviewed bonds and lone pairs'}`}
      >
        {m.bonds.map(([a, b, order], i) => {
          const first = m.atoms[a],
            last = m.atoms[b],
            dx = last.x - first.x,
            dy = last.y - first.y,
            length = Math.hypot(dx, dy),
            nx = -dy / length,
            ny = dx / length;
          const shownOrder = stage < 2 ? 1 : order;
          return Array.from({ length: shownOrder }, (_, j) => (
            <line
              key={`${i}-${j}`}
              x1={
                first.x +
                (dx / length) * 22 +
                nx * (j - (shownOrder - 1) / 2) * 6
              }
              y1={
                first.y +
                (dy / length) * 22 +
                ny * (j - (shownOrder - 1) / 2) * 6
              }
              x2={
                last.x -
                (dx / length) * 22 +
                nx * (j - (shownOrder - 1) / 2) * 6
              }
              y2={
                last.y -
                (dy / length) * 22 +
                ny * (j - (shownOrder - 1) / 2) * 6
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={stage === 0 ? '2 5' : undefined}
            />
          ));
        })}
        {m.atoms.map((a, i) => (
          <g key={i}>
            <text x={a.x} y={a.y + 8} textAnchor="middle" className="chem-atom">
              {a.element}
            </text>
            {stage === 2 &&
              a.pairs > 0 &&
              Array.from({ length: a.pairs }, (_, pair) => {
                const neighbours = m.bonds
                  .filter((b) => b[0] === i || b[1] === i)
                  .map((b) => m.atoms[b[0] === i ? b[1] : b[0]]);
                const sides = [
                  [0, -1],
                  [1, 0],
                  [0, 1],
                  [-1, 0],
                ].sort((s, t) => {
                  const clearance = (p: number[]) =>
                    Math.max(
                      ...neighbours.map((n) => {
                        const l = Math.hypot(n.x - a.x, n.y - a.y);
                        return (
                          (p[0] * (n.x - a.x)) / l + (p[1] * (n.y - a.y)) / l
                        );
                      }),
                    );
                  return clearance(s) - clearance(t);
                });
                const [sx, sy] = sides[pair];
                return [-1, 1].map((sign) => (
                  <circle
                    key={`${pair}-${sign}`}
                    cx={a.x + sx * 28 + (sy ? sign * 5 : 0)}
                    cy={a.y + sy * 28 + (sx ? sign * 5 : 0)}
                    r="3"
                    fill="currentColor"
                  />
                ));
              })}
            {stage === 2 && charges[i] !== 0 && (
              <text className="chem-formal-charge" x={a.x + 18} y={a.y - 15}>
                {charges[i] > 0 ? '+' : ''}
                {charges[i]}
              </text>
            )}
          </g>
        ))}
      </svg>
      {stage === 2 && (
        <p className="chem-charge-audit">
          Formal charges sum to {m.charge > 0 ? '+' : ''}
          {m.charge}. {m.note}
        </p>
      )}
      {stage === 2 && m.alternative && (
        <button className="quiet" onClick={() => setOther(!other)}>
          Other resonance contributor <Icon name="swap" size={14} />
        </button>
      )}
      <p className="chem-caption">
        Atlas-derived Lewis model · the flat layout shows connections, not 3D
        geometry.
      </p>
      <div className="chem-step-controls">
        <button
          className="secondary"
          onClick={() => setStage(Math.max(0, stage - 1))}
          disabled={stage === 0}
        >
          Back
        </button>
        <small>{['Count', 'Connect', 'Audit'][stage]}</small>
        <button
          className="primary"
          onClick={() => setStage(Math.min(2, stage + 1))}
          disabled={stage === 2}
        >
          Next <Icon name="arrow" size={14} />
        </button>
      </div>
    </div>
  );
}
