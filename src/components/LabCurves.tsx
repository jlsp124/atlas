import { useState } from 'react';
import { parseTemperaturePoints } from '../core/lab-curves';

export default function LabCurves() {
  const [heating, setHeating] = useState(''),
    [cooling, setCooling] = useState('');
  const h = parseTemperaturePoints(heating),
    c = parseTemperaturePoints(cooling),
    points = [...h.points, ...c.points];
  const maxTime = Math.max(1, ...points.map((p) => p.time)),
    lo = Math.floor(Math.min(...points.map((p) => p.temperature)) / 5) * 5,
    hi = Math.max(
      lo + 5,
      Math.ceil(Math.max(...points.map((p) => p.temperature)) / 5) * 5,
    );
  const x = (t: number) => 60 + (t / maxTime) * 430,
    y = (t: number) => 270 - ((t - lo) / (hi - lo)) * 220;
  return (
    <section className="lab-curves">
      <h3>Plot your measured curves</h3>
      <p>
        Enter time (minutes) and temperature (°C), separated by a space or
        comma. Use one reading per line. Start each process at its recorded time
        zero. Entries stay in this page only.
      </p>
      <div className="lab-curve-inputs">
        <label>
          Heating readings
          <textarea
            value={heating}
            onChange={(e) => setHeating(e.target.value)}
            rows={5}
            spellCheck={false}
          />
        </label>
        <label>
          Cooling readings
          <textarea
            value={cooling}
            onChange={(e) => setCooling(e.target.value)}
            rows={5}
            spellCheck={false}
          />
        </label>
      </div>
      {(h.error || c.error) && <p role="alert">{h.error ?? c.error}</p>}
      {points.length ? (
        <figure>
          <svg
            viewBox="0 0 540 325"
            role="img"
            aria-label="Your measured temperature versus time. Circles are heating; squares are cooling."
          >
            <path d="M60 45V270H500" fill="none" stroke="currentColor" />
            {Array.from({ length: 5 }, (_, i) => {
              const time = (maxTime * i) / 4,
                temp = lo + ((hi - lo) * i) / 4;
              return (
                <g key={i}>
                  <text x={x(time)} y="294" textAnchor="middle">
                    {Number(time.toFixed(2))}
                  </text>
                  <text x="50" y={y(temp) + 4} textAnchor="end">
                    {Number(temp.toFixed(1))}
                  </text>
                </g>
              );
            })}
            <text x="275" y="320" textAnchor="middle">
              Time (min)
            </text>
            <text x="12" y="25">
              Temperature (°C)
            </text>
            {[
              { readings: h.points, name: 'heating' },
              { readings: c.points, name: 'cooling' },
            ].map(({ readings, name }) => {
              return (
                <g key={String(name)} className={`lab-curve-${name}`}>
                  <polyline
                    points={readings
                      .map((p) => `${x(p.time)},${y(p.temperature)}`)
                      .join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={name === 'cooling' ? '5 4' : undefined}
                  />
                  {readings.map((p, i) =>
                    name === 'heating' ? (
                      <circle
                        key={i}
                        cx={x(p.time)}
                        cy={y(p.temperature)}
                        r="4"
                        fill="currentColor"
                      />
                    ) : (
                      <rect
                        key={i}
                        x={x(p.time) - 4}
                        y={y(p.temperature) - 4}
                        width="8"
                        height="8"
                        fill="currentColor"
                      />
                    ),
                  )}
                </g>
              );
            })}
          </svg>
          <figcaption>
            Measured points joined for reading. Circles: heating.
            Squares/dashes: cooling. Mark actual melting/solidification times
            from your observations on the paper graph.
          </figcaption>
        </figure>
      ) : (
        <p className="muted">
          No measured values entered. The reference temperature is not used to
          create data.
        </p>
      )}
    </section>
  );
}
