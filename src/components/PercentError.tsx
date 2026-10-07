import { useState } from 'react';
import { percentError } from '../content/teacher-profiles';

export default function PercentError() {
  const [experimental, setExperimental] = useState(''),
    [accepted, setAccepted] = useState('');
  const e = Number(experimental),
    r = Number(accepted);
  const result =
    experimental.trim() &&
    accepted.trim() &&
    Number.isFinite(e) &&
    Number.isFinite(r) &&
    r !== 0
      ? percentError(e, r)
      : null;
  return (
    <details className="companion-reading">
      <summary>Check your percent-error calculation</summary>
      <p>Enter the two values from your own work in the same unit.</p>
      <div className="answer-inputs">
        <label>
          Experimental value
          <input
            inputMode="decimal"
            value={experimental}
            onChange={(event) => setExperimental(event.target.value)}
          />
        </label>
        <label>
          Accepted value
          <input
            inputMode="decimal"
            value={accepted}
            onChange={(event) => setAccepted(event.target.value)}
          />
        </label>
      </div>
      <p role="status">
        {result === null
          ? 'Use a nonzero accepted value.'
          : `|${e} − ${r}| ÷ |${r}| × 100 = ${Number(result.toPrecision(6))}%`}
      </p>
      <p className="source-meta">
        This checks the setup. Round your final result to the precision
        requested on your sheet. Percent error has no physical unit.
      </p>
    </details>
  );
}
