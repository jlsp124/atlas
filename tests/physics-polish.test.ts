import { describe, expect, it } from 'vitest';
import { assignments } from '../src/content/catalog';
import { makeWalkthrough, physicsWork } from '../src/core/walkthrough';
import { questionGraphs } from '../src/core/physics-graphs';
import { analyzeTape, parseMeasurements } from '../src/core/ticker';
import { schoolYearDetails } from '../src/core/school-calendar';
import { physicsLabPrompt, formalLabOrder } from '../src/content/physics-labs';
const work = (a: string, q: string) =>
  physicsWork(
    assignments
      .find((x) => x.id === a)!
      .companionQuestions!.find((x) => x.id === q)!,
    a,
  )!;
describe('Physics source and teaching audit', () => {
  it('covers every Physics checkpoint with solved reasoning or a named source gap, without generic filler', () => {
    const physics = assignments.filter((a) => a.course === 'physics');
    let count = 0;
    for (const a of physics)
      for (const q of a.companionQuestions ?? []) {
        count++;
        const guide = makeWalkthrough(a, q);
        expect(
          guide.steps.map((s) => `${s.title} ${s.text} ${s.write}`).join(' '),
          `${a.id}/${q.id}`,
        ).not.toMatch(
          /Fill this out|Do the question|Read the sheet|Finish your response|precision requested on your assignment|Use the original data\/figures and the relationship this part/i,
        );
        expect(
          guide.physics ||
            guide.steps.some((s) => s.phase.startsWith('point-')),
        ).toBeTruthy();
      }
    expect(count).toBe(115);
    expect(
      physics
        .filter((a) => a.kind === 'notes' && a.id !== 'wadson-formal-lab')
        .every((a) => !a.companionQuestions?.length && !a.reading?.length),
    ).toBe(true);
  });
  it('keeps right/up positive, distinguishes braking signs and formats vectors with words', () => {
    const westBrake = work('physics-textbook-accelerated-motion', 'q-7a');
    expect(westBrake.values.find((v) => v.symbol === 'vi')!.value).toBe(-25);
    expect(westBrake.result).toBeCloseTo(25 / 3);
    expect(westBrake.direction).toBe('east');
    const forwardBrake = work('physics-motion-review', 'q-c14a');
    expect(forwardBrake.result).toBe(-2.25);
    expect(forwardBrake.direction).toBe('backward');
    const dropped = work('kinematics-review', 'q-10');
    expect(dropped.values.find((v) => v.symbol === 'vi')!.source).toBe(
      'dropped',
    );
    expect(dropped.values.find((v) => v.symbol === 'a')!.value).toBe(-9.8);
    expect(dropped.result).toBe(-19.6);
    expect(dropped.finalValue).toBe('2.0 × 10¹');
    expect(dropped.direction).toBe('down');
    const returning = work('kinematics-review', 'q-25a');
    expect(returning.result).toBeCloseTo(-31.2);
    expect(returning.direction).toBe('down');
    const reversal = work('physics-textbook-accelerated-motion', 'q-8');
    expect(reversal.result).toBe(3);
    expect(reversal.direction).toBe('uphill');
  });
  it('preserves the exact source values and correct substitutions, including negative squares', () => {
    const average = work('kinematics-review', 'q-1');
    expect(average.substituted).toBe('Δd = ((24 + 18) / 2) × 3.00');
    expect(average.result).toBe(63);
    expect(work('kinematics-review', 'q-22a').result).toBeCloseTo(-55.468);
    expect(work('kinematics-review', 'q-22b').result).toBeCloseTo(-156.97444);
    const penny = work('kinematics-review', 'q-18b');
    expect(penny.values.find((v) => v.symbol === 'Δt')!.value).toBe(1.1);
    expect(penny.result).toBeCloseTo(-5.929);
    expect(penny.finalLabel).toBe('Height');
    expect(penny.finalValue).toBe('5.9');
    expect(work('kinematics-review', 'q-18a').finalLabel).toBe('Speed');
    expect(work('kinematics-review', 'q-21').substituted).toContain('(−98.5)²');
    expect(work('physics-textbook-accelerated-motion', 'q-26').finalValue).toBe(
      '0.9',
    );
    expect(
      work('physics-textbook-accelerated-motion', 'q-26').precisionExplanation,
    ).toContain('tenths');
    expect(
      work('physics-textbook-accelerated-motion', 'q-25').precisionExplanation,
    ).toContain('printed tie rule');
  });
  it('graphs the actual endpoints and signed shapes rather than invented source figures', () => {
    const elevator = questionGraphs(
      'physics-textbook-accelerated-motion',
      'q-4',
    )[0];
    expect(elevator.series[0].points).toEqual([
      [0, 0],
      [2, 1],
      [14, 1],
      [18, 0],
    ]);
    const west = questionGraphs(
      'physics-textbook-accelerated-motion',
      'q-22a',
    )[0];
    expect(west.series[0].points).toEqual([
      [0, 0],
      [12, -25],
    ]);
    const golf = questionGraphs('physics-textbook-accelerated-motion', 'q-16c');
    expect(golf[1].series[0].points.at(-1)).toEqual([6, 3]);
    expect(
      questionGraphs('physics-textbook-accelerated-motion', 'q-3'),
    ).toEqual([]);
    const bounce = questionGraphs(
      'physics-textbook-accelerated-motion',
      'q-46',
    );
    expect(bounce[0].series).toHaveLength(3);
    expect(bounce[1].series[1].points[0][1]).toBeLessThan(0);
    const cyclist = questionGraphs('physics-motion-review', 'q-b10')[0];
    expect(cyclist.series[0].points[0]).toEqual([0, 2]);
  });
  it('uses actual intervals and midpoint times without silently adding a zero measurement', () => {
    const analysis = analyzeTape(
      parseMeasurements('0.1,10\n0.2,30\n0.3,60'),
      'mm',
    );
    expect(analysis.data[0]).toEqual({ time: 0.1, position: 0.01 });
    expect(analysis.intervals[0].midpoint).toBeCloseTo(0.15);
    expect(analysis.intervals[0].velocity).toBeCloseTo(0.2);
    expect(analysis.acceleration).toBeCloseTo(1);
    expect(analysis.average).toBeCloseTo(0.25);
    expect(() => parseMeasurements('0.1, [unclear]')).toThrow('Row 1');
    expect(() =>
      analyzeTape(
        [
          { time: 0, position: 0 },
          { time: 0, position: 1 },
          { time: 1, position: 2 },
        ],
        'mm',
      ),
    ).toThrow('strictly increasing');
  });
  it('counts the approved 179 instructional days with breaks and NI days excluded', () => {
    expect(schoolYearDetails('2026-09-08')).toMatchObject({
      total: 179,
      elapsed: 0,
    });
    expect(schoolYearDetails('2026-10-08')).toMatchObject({
      total: 179,
      elapsed: 20,
      winterDays: 74,
    });
    expect(schoolYearDetails('2026-10-12')!.elapsed).toBe(
      schoolYearDetails('2026-10-13')!.elapsed,
    );
    expect(schoolYearDetails('2027-03-15')!.elapsed).toBe(
      schoolYearDetails('2027-03-30')!.elapsed,
    );
    expect(schoolYearDetails('2027-06-29')!.elapsed).toBe(178);
    expect(schoolYearDetails('2027-07-01')).toBeUndefined();
  });
  it('requests evidence before drafting and preserves the teacher report structure', () => {
    for (const id of [
      'wadson-formal-lab',
      'physics-uniform-lab',
      'physics-position-lab',
      'physics-ticker-lab',
    ]) {
      const prompt = physicsLabPrompt(id, id);
      expect(prompt).toContain('Do not start writing a report');
      expect(prompt).toContain('wait for my answers');
      expect(prompt).toContain('never fabricate');
      for (const heading of formalLabOrder) expect(prompt).toContain(heading);
    }
    expect(physicsLabPrompt('physics-ticker-lab', 'tape')).toContain(
      'unrecorded (0,0)',
    );
    expect(physicsLabPrompt('physics-position-lab', 'sprint')).toContain(
      'do not require a formal report',
    );
  });
});
