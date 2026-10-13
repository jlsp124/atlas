import { useState } from 'react';
import {
  configurationText,
  type IonConfiguration,
} from '../content/chemistry-electrons';
import { Icon } from './Icons';
export default function ChemIon({ model: m }: { model: IonConfiguration }) {
  const [stage, setStage] = useState(0);
  const count = m.atomicNumber - m.charge;
  const orbitals = [...new Set([...m.neutral, ...m.ion].map(([o]) => o))];
  return (
    <div className="chem-ion chem-working">
      <div className="chem-electron-budget">
        <strong>{count} electrons</strong>
        <span>
          {m.atomicNumber} − ({m.charge > 0 ? '+' : ''}
          {m.charge}) = {count}
        </span>
      </div>
      <h3>
        {
          [
            'Count the ion’s electrons',
            'Change the correct subshells',
            'Check the configuration',
          ][stage]
        }
      </h3>
      <p>
        {stage === 0
          ? `The atomic number gives ${m.atomicNumber} protons. A ${m.charge > 0 ? 'positive' : 'negative'} charge means ${m.charge > 0 ? 'remove' : 'add'} ${Math.abs(m.charge)} electron${Math.abs(m.charge) === 1 ? '' : 's'}.`
          : m.reason}
      </p>
      {stage > 0 && (
        <>
          <div
            className="chem-ion-comparison"
            aria-label="Neutral and ionic outer configurations"
          >
            {[
              { title: 'Neutral atom', rows: m.neutral },
              { title: m.species, rows: m.ion },
            ].map(({ title, rows }) => (
              <section key={title}>
                <p className="meta">
                  {title} ·{' '}
                  {m.core ? `[${m.core}] core: ${m.coreCount} e⁻` : 'no core'}
                </p>
                {orbitals.map((o) => {
                  const n = rows.find(([name]) => name === o)?.[1] ?? 0,
                    boxes = o.endsWith('s')
                      ? 1
                      : o.endsWith('p')
                        ? 3
                        : o.endsWith('d')
                          ? 5
                          : 7;
                  return (
                    <div className="chem-ion-subshell" key={o}>
                      <span>
                        {o}
                        <sup>{n}</sup>
                      </span>
                      <span className="chem-orbitals">
                        {Array.from({ length: boxes }, (_, i) => (
                          <span
                            className="chem-orbital"
                            key={i}
                            aria-label={`${o} orbital ${i + 1}: ${Number(i < n) + Number(i + boxes < n)} electrons`}
                          >
                            <span data-occupied={i < n}>↑</span>
                            <span data-occupied={i + boxes < n}>↓</span>
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
          <p className="chem-caption">
            Electrons outside the core are shown. Paired electrons share an
            orbital with opposite spins.
          </p>
        </>
      )}
      {stage === 2 && (
        <p className="chem-ion-result">
          {configurationText(m.core, m.ion)}
          <small>
            {m.coreCount} in the core + {count - m.coreCount} outside = {count}{' '}
            e⁻
          </small>
        </p>
      )}
      {m.reference && (
        <a
          className="chem-caption"
          href={m.reference}
          target="_blank"
          rel="noreferrer"
        >
          NIST · neutral Ru configuration <Icon name="external" size={12} />
        </a>
      )}
      <div className="chem-step-controls">
        <button
          className="secondary"
          onClick={() => setStage(stage - 1)}
          disabled={stage === 0}
        >
          Back
        </button>
        <small>{['Count', 'Change', 'Audit'][stage]}</small>
        <button
          className="primary"
          onClick={() => setStage(stage + 1)}
          disabled={stage === 2}
        >
          Next <Icon name="arrow" size={14} />
        </button>
      </div>
    </div>
  );
}
