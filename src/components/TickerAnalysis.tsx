import { useState } from 'react';
import { analyzeTape, parseMeasurements } from '../core/ticker';
import { usePhysicsSource } from '../client/physics-source';
import PhysicsGraph from './PhysicsGraph';
export default function TickerAnalysis({ id }: { id: string }) {
  const archive = usePhysicsSource(id);
  const [text, setText] = useState(''),
    [unit, setUnit] = useState<'mm' | 'm'>('mm');
  let result: ReturnType<typeof analyzeTape> | undefined,
    error = '';
  if (text.trim()) {
    try {
      result = analyzeTape(parseMeasurements(text), unit);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  const n = (v: number) => Number(v.toPrecision(5)).toString();
  return (
    <section className="tape-analysis">
      <h2>Analyze your measurements</h2>
      <p>
        Paste time and position pairs, one row per mark. Nothing is assumed at
        time zero. The lab’s every-sixth-dot marks are 0.100 s apart; the
        original timer is 60 Hz.
      </p>
      {archive?.source?.data && (
        <>
          <button
            className="secondary"
            onClick={() => {
              setText(
                archive
                  .source!.data!.map((r) => `${r.time}, ${r.position}`)
                  .join('\n'),
              );
              setUnit(archive.source!.positionUnit ?? 'mm');
            }}
          >
            Load my captured measurements
          </button>
          <p className="source-meta">
            Private capture · {archive.source.captured}. Confirm these belong to
            your run before using them.
          </p>
          <ul className="measurement-gaps">
            {archive.source.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </>
      )}
      <label>
        Position units{' '}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as 'm' | 'mm')}
        >
          <option value="mm">mm</option>
          <option value="m">m</option>
        </select>
      </label>
      <label htmlFor="tape-measurements">Time (s), position ({unit})</label>
      <textarea
        id="tape-measurements"
        rows={7}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your measured pairs here"
      />
      <p className="source-meta">
        Your entries stay in this page. Instrument uncertainty is not supplied;
        take it from your ruler and timing method.
      </p>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <div className="tape-results">
            <h3>From these measurements</h3>
            <p>
              For the first measured interval: Δd = (
              {n(result.data[1].position)} − {n(result.data[0].position)}) m ={' '}
              {n(result.intervals[0].displacement)} m. Δt ={' '}
              {n(result.intervals[0].duration)} s. Divide to get v ={' '}
              {n(result.intervals[0].velocity)} m/s, plotted at the midpoint{' '}
              {n(result.intervals[0].midpoint)} s.
            </p>
            <div className="table-scroll">
              <table>
                <caption>Consecutive intervals · metres and seconds</caption>
                <thead>
                  <tr>
                    <th>Interval (s)</th>
                    <th>Midpoint (s)</th>
                    <th>Δd (m)</th>
                    <th>v (m/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.intervals.map((r) => (
                    <tr key={r.start}>
                      <td>
                        {n(r.start)}–{n(r.end)}
                      </td>
                      <td>{n(r.midpoint)}</td>
                      <td>{n(r.displacement)}</td>
                      <td>{n(r.velocity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Average velocity over the <em>recorded</em> interval ={' '}
              {n(result.average)} m/s. This uses final minus initial position
              divided by final minus initial time, not an unrecorded start
              point.
            </p>
            <p>
              Least-squares velocity–time fit: v = {n(result.intercept)} + (
              {n(result.acceleration)})t, in metres and seconds. Its slope gives
              a ≈ {n(result.acceleration)} m/s². Compare the scatter with your
              measurement uncertainty before claiming constant acceleration.
              These extra digits show the calculation; choose final precision
              from your actual measurement uncertainty.
            </p>
          </div>
          <div className="physics-graphs">
            <PhysicsGraph
              graph={{
                title: 'Measured position vs time',
                xLabel: 'Time (s)',
                yLabel: 'Position (m)',
                description:
                  'Measured points only. No unrecorded origin or invented smooth position fit.',
                series: [
                  {
                    points: result.data.map((r) => [r.time, r.position]),
                    dots: true,
                  },
                ],
              }}
            />
            <PhysicsGraph
              graph={{
                title: 'Interval velocity vs midpoint time',
                xLabel: 'Midpoint time (s)',
                yLabel: 'Velocity (m/s)',
                description:
                  'Dots are interval velocities. The straight line is a least-squares fit; its slope estimates acceleration.',
                series: [
                  {
                    points: result.intervals.map((r) => [
                      r.midpoint,
                      r.velocity,
                    ]),
                    dots: true,
                  },
                  {
                    points: [
                      result.intervals[0].midpoint,
                      result.intervals.at(-1)!.midpoint,
                    ].map((t) => [
                      t,
                      result!.intercept + result!.acceleration * t,
                    ]),
                    line: true,
                  },
                ],
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}
