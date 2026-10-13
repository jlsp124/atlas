import { expect, it } from 'vitest';
import { assignments, courses, editions } from '../src/content/catalog';
import {
  dynamicsLessons,
  dynamicsAssignment,
} from '../src/content/physics-dynamics';
import { makeWalkthrough } from '../src/core/walkthrough';
import { validateContent } from '../scripts/validate-content';
import { dotPositions } from '../src/components/DotDiagram';

it('opens Dynamics as a new unit and keeps all 33 question identities in one assignment', () => {
  expect(
    courses
      .find((c) => c.id === 'physics')!
      .units.find((u) => u.id === 'dynamics')!.title,
  ).toContain('Forces in 1D');
  expect(editions.find((e) => e.course === 'physics')!.currentUnit).toBe(
    'dynamics',
  );
  expect(
    assignments.filter((a) => a.unit === 'dynamics' && a.kind === 'textbook'),
  ).toHaveLength(1);
  expect(dynamicsAssignment.companionQuestions!.map((q) => q.number)).toEqual(
    Array.from({ length: 33 }, (_, i) => String(i + 1)),
  );
  expect(validateContent()).toEqual([]);
});
it('preserves missing questions and missing example data without guessed answers', () => {
  const missing = Object.entries(dynamicsLessons)
    .filter(([, d]) => d.prompt.includes('source page needed'))
    .map(([n]) => Number(n));
  expect(missing).toEqual([12, 13, 14, 15, 22, 23, 24, 25, 26, 27]);
  for (const n of missing) {
    const q = dynamicsAssignment.companionQuestions![n - 1];
    expect(q.answer).toBeUndefined();
    expect(dynamicsLessons[String(n)].values).toEqual([]);
    expect(
      makeWalkthrough(dynamicsAssignment, q).steps.some(
        (s) => s.title === 'Identify the missing source',
      ),
    ).toBe(true);
  }
  expect(dynamicsLessons['21'].result).toBeUndefined();
  expect(dynamicsLessons['21'].gap).toContain('person mass');
});
it('independently checks signed force sums, mass elimination, weight and tension', () => {
  expect(dynamicsLessons['6'].result!.value).toBe(225 + 165);
  expect(dynamicsLessons['7'].result!.value).toBe(225 - 165);
  expect(dynamicsLessons['8'].result!.value).toBe(35 + 42 - 53);
  expect(dynamicsLessons['9'].result!.value).toBeCloseTo(2.7 / 0.64);
  expect(dynamicsLessons['10'].result!.value).toBeCloseTo(27.2 * 0.8);
  const mass = dynamicsLessons['11'].result!.value;
  expect(mass * ((6.5 - 0) / 5)).toBeCloseTo(317 - 173);
  expect(dynamicsLessons['17'].result!.value * 22.5).toBeCloseTo(235.2);
  expect(dynamicsLessons['19'].result!.value - 15 * 9.8).toBeCloseTo(15 * 7);
  expect(dynamicsLessons['20'].result!.value / 1.6).toBeCloseTo(585 / 9.8);
  expect(42 * dynamicsLessons['33'].result!.value + 42 * 9.8).toBeCloseTo(450);
});
it('explains combinations and direction changes question by question', () => {
  expect(dynamicsLessons['11'].steps.map((s) => s.text).join(' ')).toContain(
    'two unknowns',
  );
  expect(dynamicsLessons['19'].steps.map((s) => s.text).join(' ')).toContain(
    'support the weight',
  );
  expect(dynamicsLessons['20'].steps.map((s) => s.text).join(' ')).toContain(
    'Substitute',
  );
  expect(dynamicsLessons['21'].steps.map((s) => s.write).join(' ')).toContain(
    '11.8m',
  );
  expect(dynamicsLessons['3'].forces!.map((f) => f.label)).toEqual(['Fg']);
  expect(dynamicsLessons['2'].forces![0].size).toBeGreaterThan(
    dynamicsLessons['2'].forces![1].size,
  );
  expect(dynamicsLessons['5'].forces![0].size).toBeGreaterThan(
    dynamicsLessons['5'].forces![1].size,
  );
});
it('uses dot spacing to distinguish speeding up, slowing down, uniform motion and rest', () => {
  const gaps = (n: string) => {
    const positions = dotPositions(dynamicsLessons[n].dots!);
    return positions.slice(1).map((p, i) => p - positions[i]);
  };
  expect(new Set(gaps('1')).size).toBe(1);
  expect(gaps('2').every((g, i, gs) => i === 0 || g > gs[i - 1])).toBe(true);
  expect(gaps('3').every((g, i, gs) => i === 0 || g < gs[i - 1])).toBe(true);
  expect(dynamicsLessons['3'].dots!.direction).toBe('up');
  expect(dynamicsLessons['5'].dots!.direction).toBe('down');
  expect(gaps('30').every((g) => g === 0)).toBe(true);
});
