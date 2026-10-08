import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { assignments } from '../src/content/catalog';
import {
  makeWalkthrough,
  physicsWork,
  configurationWork,
  conversionWork,
} from '../src/core/walkthrough';
import {
  assignmentProgress,
  questionStep,
  reviewDue,
  dueQuestions,
} from '../src/core/assignment-progress';
import { eventSchema, type LearnerEvent } from '../src/core/schema';
const work = (id: string) => assignments.find((a) => a.id === id)!;
const question = (id: string, q: string) =>
  work(id).companionQuestions!.find((x) => x.id === q)!;
const progress = (
  payload: Record<string, unknown>,
  at = '2026-10-07T12:00:00.000Z',
) =>
  eventSchema.parse({
    id: randomUUID(),
    device: randomUUID(),
    at,
    type: 'assignment_progress',
    payload,
  });
describe('assignment tutoring over the reviewed catalog', () => {
  it('walks every existing allowed science checkpoint and keeps independent hand-ins closed', () => {
    let count = 0,
      numerical = 0;
    for (const a of assignments) {
      if (a.assistance === 'independent-only') {
        expect(a.companionQuestions ?? []).toEqual([]);
        expect(() =>
          makeWalkthrough(a, question('kinematics-review', 'q-1')),
        ).toThrow('Independent work');
      } else
        for (const q of a.companionQuestions ?? []) {
          const guide = makeWalkthrough(a, q);
          expect(guide.steps.length, `${a.id}/${q.id}`).toBeGreaterThanOrEqual(
            4,
          );
          expect(guide.steps.every((s) => s.text && s.title && s.write)).toBe(
            true,
          );
          if (guide.physics) {
            numerical++;
            expect(Math.abs(guide.physics.result)).toBeCloseTo(
              Math.abs(Number(q.answer!.value)),
              5,
            );
            expect(
              guide.physics.values.every(
                (v) => Number.isFinite(v.value) && v.unit && v.source,
              ),
            ).toBe(true);
          }
          count++;
        }
    }
    expect(count).toBe(353);
    expect(numerical).toBeGreaterThanOrEqual(60);
  });
  it('uses signed acceleration, the correct unknown and related-part provenance', () => {
    expect(
      physicsWork(question('kinematics-review', 'q-1'), 'kinematics-review')
        ?.result,
    ).toBe(63);
    const launch = physicsWork(
      question('kinematics-review', 'q-12'),
      'kinematics-review',
    )!;
    expect(launch.target).toBe('vi');
    expect(launch.values.find((v) => v.symbol === 'a')?.value).toBe(-9.8);
    expect(launch.result).toBeCloseTo(Math.sqrt(2 * 9.8 * 4.5));
    const carried = physicsWork(
      question('kinematics-review', 'q-24b'),
      'kinematics-review',
    )!;
    expect(carried.result).toBeCloseTo(-110.4);
    expect(carried.context).toContain('24a');
    expect(carried.axis).toBe('Take up as positive; down is negative.');
    const otherPlanet = physicsWork(
      question('kinematics-review', 'q-16'),
      'kinematics-review',
    )!;
    expect(otherPlanet.result).toBeCloseTo(-44.444444);
    expect(otherPlanet.values.some((v) => v.value === 9.8)).toBe(false);
  });
  it('refuses a numerical animation when the reviewed result and setup disagree', () => {
    const q = structuredClone(question('kinematics-review', 'q-1'));
    q.answer!.value = 100;
    expect(physicsWork(q, 'kinematics-review')).toBeUndefined();
  });
  it('accounts for all configuration electrons and uses a strictly preceding core', () => {
    for (const q of work('chemistry-hebden-electrons').companionQuestions!) {
      const c = configurationWork(q);
      if (!c) continue;
      expect(c.shells.reduce((n, s) => n + s.count, 0)).toBe(c.count);
      expect(c.coreCount).toBeLessThan(c.count);
      expect(
        c.shells.every(
          (s) =>
            s.count <=
            (s.name.endsWith('s')
              ? 2
              : s.name.endsWith('p')
                ? 6
                : s.name.endsWith('d')
                  ? 10
                  : 14),
        ),
      ).toBe(true);
    }
    const argon = configurationWork(
      question('chemistry-hebden-electrons', 'q-27f'),
    )!;
    expect(argon.core).toBe('Ne');
    expect(
      configurationWork(question('chemistry-hebden-electrons', 'q-28')),
    ).toBeUndefined();
  });
  it('balances prefix, rate and specified-year conversions independently', () => {
    for (const q of work('chemistry-hebden-conversions').companionQuestions!) {
      const c = conversionWork(q);
      if (!c) continue;
      const result = c.factors
        ? c.factors.reduce((n, f) => (n * f.top) / f.bottom, Number(c.value))
        : (Number(c.value) * c.fromFactor) / c.toFactor;
      expect(result).toBeCloseTo(Number(q.answer!.value), 6);
    }
    expect(
      conversionWork(question('chemistry-hebden-conversions', 'q-17m'))!.result,
    ).toBeCloseTo(10);
    expect(
      conversionWork(question('chemistry-hebden-conversions', 'q-17k'))!.result,
    ).toBe(31536000);
  });
});
describe('saved paper progress and recall scheduling', () => {
  it('brings missed recall back before hard and new words without changing mastery', () => {
    const a = work('greetings-practice');
    const [missed, hard, fresh, easy] = a.companionQuestions!;
    const event = (
      type: string,
      payload: Record<string, unknown>,
      at: string,
    ) =>
      eventSchema.parse({
        id: randomUUID(),
        device: randomUUID(),
        type,
        payload,
        at,
      });
    const events = [
      event(
        'difficulty_rated',
        {
          assignment: a.id,
          checkpoint: missed.id,
          concept: missed.concepts[0],
          rating: 'easy',
        },
        '2026-10-07T10:00:00.000Z',
      ),
      event(
        'companion_attempt',
        {
          assignment: a.id,
          question: missed.id,
          concept: missed.concepts[0],
          correct: false,
          hints: 0,
          revealed: false,
        },
        '2026-10-07T11:00:00.000Z',
      ),
      event(
        'difficulty_rated',
        {
          assignment: a.id,
          checkpoint: hard.id,
          concept: hard.concepts[0],
          rating: 'hard',
        },
        '2026-10-07T10:00:00.000Z',
      ),
      event(
        'difficulty_rated',
        {
          assignment: a.id,
          checkpoint: easy.id,
          concept: easy.concepts[0],
          rating: 'easy',
        },
        '2026-10-07T10:00:00.000Z',
      ),
    ];
    const due = dueQuestions(a, events, Date.parse('2026-10-07T11:01:00.000Z'));
    expect(due.slice(0, 3).map((q) => q.id)).toEqual([
      missed.id,
      hard.id,
      fresh.id,
    ]);
    expect(due.some((q) => q.id === easy.id)).toBe(false);
    expect(assignmentProgress({ ...a, tasks: [] }, []).status).toBe(
      'not-started',
    );
  });
  it('keeps old tasks and new cursors separate from demonstrated mastery', () => {
    const a = work('kinematics-review');
    const events: LearnerEvent[] = [
      progress({
        assignment: a.id,
        status: 'in-progress',
        question: 'q-1',
        step: 4,
        done: true,
      }),
      progress({
        assignment: a.id,
        status: 'in-progress',
        question: 'q-2',
        step: 2,
      }),
    ];
    const p = assignmentProgress(a, events);
    expect(p.completed.has('q-1')).toBe(true);
    expect(p.status).toBe('in-progress');
    expect(p.question).toBe('q-2');
    expect(questionStep(a.id, 'q-1', events)).toBe(4);
    expect(assignmentProgress(a, []).status).toBe('not-started');
    expect(
      assignmentProgress(a, [
        ...events,
        progress({ assignment: a.id, status: 'complete' }),
      ]).status,
    ).toBe('complete');
  });
  it('schedules hard, okay and easy recall without treating the rating as a correct answer', () => {
    const at = '2026-10-07T12:00:00.000Z';
    for (const [rating, minutes] of [
      ['hard', 10],
      ['okay', 1440],
      ['easy', 5760],
    ] as const) {
      const e = eventSchema.parse({
        id: randomUUID(),
        device: randomUUID(),
        at,
        type: 'difficulty_rated',
        payload: {
          assignment: 'greetings-practice',
          checkpoint: 'q-1',
          concept: 'hiragana',
          rating,
        },
      });
      expect(
        reviewDue(
          'greetings-practice',
          'q-1',
          [e],
          Date.parse(at) + minutes * 60000 - 1,
        ),
      ).toBe(false);
      expect(
        reviewDue(
          'greetings-practice',
          'q-1',
          [e],
          Date.parse(at) + minutes * 60000,
        ),
      ).toBe(true);
    }
  });
});
