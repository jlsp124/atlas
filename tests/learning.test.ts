import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  concepts,
  questions,
  coverageItems,
  assignments,
} from '../src/content/catalog';
import {
  assignmentPriority,
  coverage,
  evaluate,
  evidence,
  mergeEvents,
  nearestGap,
  prerequisitePath,
  selectQuestions,
  taskDone,
  tutorPrompt,
  variant,
} from '../src/core/learning';
import {
  eventSchema,
  type Concept,
  type LearnerEvent,
} from '../src/core/schema';
import { validateContent } from '../scripts/validate-content';
import { isSchoolDay, schoolDate, schoolDaysThrough } from '../src/core/dates';
const now = Date.now();
const timestamp = new Date(now - 1000).toISOString();
function attempt(
  concept = 'electron-groups',
  level = 'diagnostic',
  correct = true,
  hints = 0,
  at = timestamp,
): LearnerEvent {
  return eventSchema.parse({
    id: randomUUID(),
    device: randomUUID(),
    at,
    type: 'question_answered',
    payload: {
      question: `${concept}-${level}`,
      concept,
      correct,
      hints,
      seed: 2,
      durationMs: 1000,
    },
  });
}
const stable = (id: string) =>
  ['diagnostic', 'construction', 'transfer'].map((level) => attempt(id, level));
function report(
  type:
    'concept_marked_confused' | 'concept_self_reported_known' | 'lesson_viewed',
  concept = 'electron-groups',
  at = timestamp,
): LearnerEvent {
  return eventSchema.parse({
    id: randomUUID(),
    device: randomUUID(),
    at,
    type,
    payload: { concept },
  });
}

describe('instructional dependency graph', () => {
  it('keeps only the missing bridge from known Lewis structures to VSEPR', () =>
    expect(prerequisitePath('vsepr', concepts, ['lewis-structures'])).toEqual([
      'electron-groups',
      'vsepr',
    ]));
  it('orders every prerequisite before its dependent', () => {
    const path = prerequisitePath('vsepr', concepts);
    for (const id of path)
      for (const p of concepts.find((c) => c.id === id)!.prerequisites)
        expect(path.indexOf(p)).toBeLessThan(path.indexOf(id));
  });
  it('diagnoses electron groups when earlier branch knowledge is demonstrated', () => {
    const events = prerequisitePath('lewis-structures', concepts).flatMap(
      stable,
    );
    expect(nearestGap('vsepr', concepts, events, questions)).toBe(
      'electron-groups',
    );
  });
  it('never treats untested self-report as a stable shortcut', () =>
    expect(
      nearestGap(
        'vsepr',
        concepts,
        [report('concept_self_reported_known', 'electron-groups')],
        questions,
      ),
    ).not.toBe('vsepr'));
  it('rejects a cycle', () => {
    const a = { ...concepts[0], id: 'a', prerequisites: ['b'] };
    const b = { ...concepts[1], id: 'b', prerequisites: ['a'] };
    expect(() => prerequisitePath('a', [a, b])).toThrow('cycle');
  });
  it('rejects missing concepts', () =>
    expect(() => prerequisitePath('missing', concepts)).toThrow('Missing'));
  it('does not make preview material block core knowledge', () => {
    const a = { ...concepts[0], id: 'a', prerequisites: ['b'] };
    const b: Concept = {
      ...concepts[1],
      id: 'b',
      depth: 'preview',
      prerequisites: [],
    };
    expect(prerequisitePath('a', [a, b])).toEqual(['a']);
  });
});
describe('explainable evidence', () => {
  it('starts unseen, then exposed after opening a lesson', () => {
    expect(evidence('electron-groups', [], questions).state).toBe('unseen');
    expect(
      evidence('electron-groups', [report('lesson_viewed')], questions).state,
    ).toBe('exposed');
  });
  it('recognition repetition cannot establish stable evidence', () =>
    expect(
      evidence(
        'electron-groups',
        Array.from({ length: 8 }, () => attempt()),
        questions,
      ).state,
    ).toBe('developing'));
  it('requires unhinted construction and transfer across archetypes', () => {
    expect(
      evidence('electron-groups', stable('electron-groups'), questions, now)
        .state,
    ).toBe('stable');
    const hinted = [
      attempt(),
      attempt('electron-groups', 'construction', true, 1),
      attempt('electron-groups', 'transfer'),
    ];
    expect(evidence('electron-groups', hinted, questions, now).state).toBe(
      'developing',
    );
  });
  it('marks review due after seven days', () =>
    expect(
      evidence(
        'electron-groups',
        stable('electron-groups'),
        questions,
        now + 8 * 86400000,
      ).state,
    ).toBe('review due'));
  it('shows conflict when recent performance disagrees', () =>
    expect(
      evidence(
        'electron-groups',
        [
          ...stable('electron-groups'),
          attempt('electron-groups', 'transfer', false),
        ],
        questions,
      ).state,
    ).toBe('conflict'));
  it('a confusion marker increases priority until fresh production', () => {
    const events = [
      ...stable('electron-groups'),
      report(
        'concept_marked_confused',
        'electron-groups',
        new Date(now).toISOString(),
      ),
    ];
    expect(evidence('electron-groups', events, questions).state).toBe(
      'developing',
    );
  });
  it('self-report known remains exposed without a check', () =>
    expect(
      evidence(
        'electron-groups',
        [report('concept_self_reported_known')],
        questions,
      ).state,
    ).toBe('exposed'));
});
describe('coverage, not repeated accuracy', () => {
  it('an unhinted miss tests one item and marks it weak', () => {
    const r = coverage(
      coverageItems,
      [attempt('electron-groups', 'diagnostic', false)],
      questions,
    );
    expect(r.tested).toHaveLength(1);
    expect(r.weak).toHaveLength(1);
    expect(r.unseen).toHaveLength(coverageItems.length - 1);
  });
  it('a hinted response is exposure, not tested coverage', () =>
    expect(
      coverage(
        coverageItems,
        [attempt('electron-groups', 'diagnostic', true, 1)],
        questions,
      ).tested,
    ).toHaveLength(0));
  it('repeating a question leaves other required items unseen', () =>
    expect(
      coverage(coverageItems, [attempt(), attempt(), attempt()], questions)
        .tested,
    ).toHaveLength(1));
  it('new unseen items displace a frequently practised concept', () => {
    const events = stable('electron-groups');
    const selected = selectQuestions(
      questions,
      coverageItems,
      events,
      'Coverage sweep',
      ['electron-groups', 'vsepr'],
      1,
      2,
    );
    expect(selected[0].concepts).toContain('vsepr');
  });
  it('transfer mode contains only transfer checks', () =>
    expect(
      selectQuestions(
        questions,
        coverageItems,
        [],
        'Transfer only',
        ['vsepr'],
        3,
      ).every((q) => q.level === 'transfer'),
    ).toBe(true));
  it('learning proceeds through recognition, construction and transfer', () =>
    expect(
      selectQuestions(
        questions,
        coverageItems,
        [],
        'Learn this',
        ['electron-groups'],
        3,
      ).map((q) => q.level),
    ).toEqual(['recognition', 'construction', 'transfer']));
  it('additional long-tail checks never displace the transfer stage', () =>
    expect(
      selectQuestions(
        questions,
        coverageItems,
        [],
        'Learn this',
        ['evolution-patterns'],
        3,
      ).map((q) => q.level),
    ).toEqual(['recognition', 'construction', 'transfer']));
  it('a broad evolution check leaves Hox and pace items unseen', () => {
    const r = coverage(
      coverageItems,
      [attempt('evolution-patterns', 'diagnostic')],
      questions,
    );
    expect(r.unseen.map((i) => i.id)).toContain('detail-hox-patterning');
    expect(r.unseen.map((i) => i.id)).toContain(
      'detail-punctuated-equilibrium',
    );
  });
});
describe('deterministic reviewed numeric families', () => {
  it('generates reproducible questions with multiple actual answer values', () => {
    const q = questions.find((q) => q.template === 'velocity')!;
    expect(variant(q, 8)).toEqual(variant(q, 8));
    expect(
      new Set(Array.from({ length: 30 }, (_, n) => variant(q, n).answer)).size,
    ).toBeGreaterThan(6);
  });
  it('checks 100 velocity variants against displacement/time independently', () => {
    const q = questions.find((q) => q.template === 'velocity')!;
    for (let seed = 0; seed < 100; seed++) {
      const v = variant(q, seed);
      const m = v.prompt.match(/moves (\d+) m (west|east) in (\d+) s/)!;
      const expected =
        (Number(m[1]) / Number(m[3])) * (m[2] === 'west' ? -1 : 1);
      expect(v.answer).toBe(expected);
      expect(evaluate(v, String(expected), 'm/s')).toBe(true);
      expect(evaluate(v, String(expected), 'm')).toBe(false);
    }
  });
  it('checks acceleration variants by signed subtraction', () => {
    const q = questions.find((q) => q.template === 'acceleration')!;
    for (let seed = 0; seed < 50; seed++) {
      const v = variant(q, seed);
      const m = v.prompt.match(/from (-\d+) m\/s to (-\d+) m\/s in (\d+) s/)!;
      expect(v.answer).toBe((Number(m[2]) - Number(m[1])) / Number(m[3]));
    }
  });
  it('checks half-life variants using the remaining-fraction equation', () => {
    const q = questions.find((q) => q.template === 'half-life')!;
    for (let seed = 0; seed < 50; seed++) {
      const v = variant(q, seed);
      const m = v.prompt.match(/half-life of (\d+) years.*retains ([\d.]+)%/)!;
      expect(v.answer).toBe(Math.log2(100 / Number(m[2])) * Number(m[1]));
    }
  });
  it('rejects empty, nonfinite and mixed numeric input', () => {
    const q = variant(
      questions.find((q) => q.template === 'velocity')!,
      2,
    );
    for (const s of ['', 'Infinity', 'NaN', '4 m/s', '0x10'])
      expect(evaluate(q, s, 'm/s')).toBe(false);
  });
  it('supports scientific notation and explicit tolerance', () => {
    const q = {
      ...variant(
        questions.find((q) => q.template === 'conversion')!,
        2,
      ),
      answer: 1200,
      tolerance: 0.001,
    };
    expect(evaluate(q, '1.2e3', 's')).toBe(true);
    expect(evaluate(q, '1201', 's')).toBe(true);
    expect(evaluate(q, '1210', 's')).toBe(false);
  });
  it('handles kana without requiring a specific input width', () => {
    const q = questions.find((q) => q.id === 'jp-konnichiwa-construction')!;
    expect(evaluate(q, 'こんにちは。')).toBe(true);
    expect(evaluate(q, 'konbanwa')).toBe(false);
  });
  it('preserves decimal value in typed numeric checks', () => {
    const q = questions.find((q) => q.id === 'powered-units-construction')!;
    expect(evaluate(q, '0.04')).toBe(true);
    expect(evaluate(q, '4e-2')).toBe(true);
    expect(evaluate(q, '4')).toBe(false);
    expect(evaluate(q, '0.004')).toBe(false);
  });
  it('accepts equivalent counts, signed decimals and scientific notation', () => {
    const count = questions.find(
      (q) => q.id === 'electron-groups-construction',
    )!;
    expect(evaluate(count, '2.0')).toBe(true);
    expect(evaluate(count, '２')).toBe(true);
    expect(evaluate(count, '2.1')).toBe(false);
    const signed = questions.find((q) => q.id === 'detail-velocity-area')!;
    expect(evaluate(signed, '−12.0')).toBe(true);
    expect(evaluate(signed, '12')).toBe(false);
  });
  it('requires the requested significant-figure precision', () => {
    const q = questions.find((q) => q.id === 'significant-figures-transfer')!;
    expect(evaluate(q, '7.2')).toBe(true);
    expect(evaluate(q, '72e-1')).toBe(true);
    expect(evaluate(q, '7.20')).toBe(false);
    expect(evaluate(q, '72')).toBe(false);
  });
  it('requires the requested decimal-place precision for measured addition', () => {
    const q = questions.find((q) => q.id === 'detail-addition-precision')!;
    expect(evaluate(q, '12.3')).toBe(true);
    expect(evaluate(q, '123e-1')).toBe(true);
    expect(evaluate(q, '12.30')).toBe(false);
    expect(evaluate(q, '123')).toBe(false);
  });
});
describe('event projection and prompt boundaries', () => {
  it('merges identical UUIDs idempotently', () => {
    const e = attempt();
    expect(mergeEvents([e], [e])).toEqual([e]);
  });
  it('retains assignment task unchecking', () => {
    const common = {
      device: randomUUID(),
      type: 'assignment_task',
      payload: { assignment: assignments[0].id, task: 'signs', done: true },
    };
    const a = eventSchema.parse({ ...common, id: randomUUID(), at: timestamp });
    const b = eventSchema.parse({
      ...common,
      id: randomUUID(),
      at: new Date(now).toISOString(),
      payload: { ...common.payload, done: false },
    });
    expect(taskDone(assignments[0].id, 'signs', [a, b])).toBe(false);
  });
  it('unknown evidence yields no invented minute estimate', () => {
    const p = assignmentPriority(assignments[0], [], questions);
    expect(p.label).toBe('Difficulty not yet known');
    expect(p.reason).not.toMatch(/minute/);
  });
  it('builds context-rich tutor prompts and protects Japanese assessed work', () => {
    const c = concepts.find((c) => c.id === 'jp-sumimasen')!;
    const prompt = tutorPrompt(c, concepts, [], questions);
    expect(prompt).toContain('Ask what is confusing');
    expect(prompt).toContain('Not yet tested');
    expect(prompt).toContain('prohibits AI/translator');
    expect(prompt).toContain('すみません');
  });
  it('validates the entire public catalog and privacy patterns', () =>
    expect(validateContent()).toEqual([]));
  it('rejects arbitrary event fields and raw answer text', () => {
    const e = attempt();
    expect(
      eventSchema.safeParse({
        ...e,
        payload: { ...e.payload, answer: 'private answer' },
      }).success,
    ).toBe(false);
  });
});
describe('school snapshot dates', () => {
  it('uses Vancouver date across the UTC date boundary', () =>
    expect(schoolDate(new Date('2026-10-06T01:00:00Z'))).toBe('2026-10-05'));
  it('omits weekends, holidays and out-of-edition days', () => {
    expect(isSchoolDay('2026-10-05')).toBe(true);
    for (const day of [
      '2026-10-10',
      '2026-10-12',
      '2026-09-28',
      '2026-09-30',
      '2026-12-22',
      '2027-02-01',
    ])
      expect(isSchoolDay(day)).toBe(false);
  });
  it('school-day counts stop at edition end', () =>
    expect(schoolDaysThrough('2028-01-01')).toBe(
      schoolDaysThrough('2027-01-29'),
    ));
});
