import { describe, expect, it } from 'vitest';
import { assignments, schedule } from '../src/content/catalog';
import {
  lewisModels,
  lewisBudget,
  lewisUsed,
  formalCharges,
} from '../src/content/chemistry-lewis';
import { chemistryLabs } from '../src/content/chemistry-labs';
import { matterQuestions } from '../src/content/chemistry-matter';
import { parseTemperaturePoints } from '../src/core/lab-curves';
import {
  ionConfigurations,
  recoveredIonQuestions,
  recoveredValenceQuestions,
} from '../src/content/chemistry-electrons';

describe('reviewed Chemistry source and electron accounting', () => {
  it('recovers every exact ion/valence species and conserves charge through configuration changes', () => {
    expect(recoveredIonQuestions.map((q) => q.number)).toEqual(
      Array.from({ length: 12 }, (_, i) => `28${String.fromCharCode(97 + i)}`),
    );
    expect(recoveredValenceQuestions.map((q) => q.number)).toEqual(
      Array.from({ length: 16 }, (_, i) => `29${String.fromCharCode(97 + i)}`),
    );
    expect(ionConfigurations.map((m) => m.species)).toEqual([
      'H⁻',
      'Sr²⁺',
      'Br⁻',
      'N³⁺',
      'Ti²⁺',
      'N²⁻',
      'Mn²⁺',
      'Ge⁴⁺',
      'Fe³⁺',
      'Ge²⁺',
      'Ru³⁺',
      'Sb³⁺',
    ]);
    for (const m of ionConfigurations) {
      expect(
        m.coreCount + m.neutral.reduce((n, [, v]) => n + v, 0),
        m.species,
      ).toBe(m.atomicNumber);
      expect(
        m.coreCount + m.ion.reduce((n, [, v]) => n + v, 0),
        m.species,
      ).toBe(m.atomicNumber - m.charge);
      for (const [o, n] of [...m.neutral, ...m.ion])
        expect(n, m.species).toBeLessThanOrEqual(
          o.endsWith('s') ? 2 : o.endsWith('p') ? 6 : o.endsWith('d') ? 10 : 14,
        );
    }
    expect(
      recoveredValenceQuestions.find((q) => q.id === 'q-29c')!.hints[0],
    ).toContain('three d electrons');
    expect(
      recoveredValenceQuestions.find((q) => q.id === 'q-29h')!.hints[0],
    ).toContain('confirm whether the teacher expects');
  });
  it('retains all 29 source parts and the historical overview, with exact unusual skeletons', () => {
    expect(lewisModels.map((m) => m.part)).toEqual([
      ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
      'aa',
      'bb',
      'cc',
    ]);
    expect(
      assignments.find((a) => a.id === 'chemistry-hebden-lewis')!
        .companionQuestions?.[0].id,
    ).toBe('q-86');
    const species = (part: string) =>
      lewisModels.find((m) => m.part === part)!.atoms.map((a) => a.element);
    expect(species('b')).toEqual(['I', 'I']);
    expect(species('l').filter((e) => e === 'C')).toHaveLength(4);
    expect(species('l').filter((e) => e === 'H')).toHaveLength(4);
    expect(species('o')).toEqual(['C', 'S', 'H', 'Cl']);
    expect(species('q')).toEqual(['N', 'O']);
    expect(species('t')).toEqual(['O', 'S', 'O']);
    expect(species('z').filter((e) => e === 'C')).toHaveLength(4);
    expect(species('aa')).toEqual(['O', 'N', 'O', 'O']);
    expect(lewisBudget(lewisModels.find((m) => m.part === 'aa')!)).toBe(23);
    expect(lewisModels.find((m) => m.part === 'aa')!.promptOnly).toContain(
      'no printed charge',
    );
  });
  it('conserves total electrons, charge and duets/octets including resonance', () => {
    for (const original of lewisModels.filter((m) => !m.promptOnly)) {
      for (const m of [
        original,
        ...(original.alternative
          ? [{ ...original, ...original.alternative }]
          : []),
      ]) {
        expect(lewisUsed(m), m.part).toBe(lewisBudget(m));
        expect(
          formalCharges(m).reduce((n, v) => n + v, 0),
          m.part,
        ).toBe(m.charge);
        for (const [i, a] of m.atoms.entries()) {
          const around =
            a.pairs * 2 +
            m.bonds
              .filter((b) => b[0] === i || b[1] === i)
              .reduce((n, b) => n + b[2] * 2, 0);
          if (a.element === 'H') expect(around, m.part).toBe(2);
          else if (['C', 'N', 'O', 'F', 'Cl', 'Br', 'I'].includes(a.element))
            expect(around, m.part).toBe(8);
          else expect(around, m.part).toBeLessThanOrEqual(12);
        }
      }
    }
  });
  it('uses the exact teacher ranges and keeps formal hand-ins metadata only', () => {
    expect(matterQuestions.map((q) => q.number)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '13',
      '14',
      '15',
      '17',
      '22',
      '24',
      '33',
      '34',
      '35',
      '36',
      '37',
    ]);
    expect(
      assignments.find((a) => a.id === 'chemistry-hebden-bonding')!
        .questionReferences,
    ).toContain('p.182 #79,82');
    for (const a of assignments.filter(
      (a) => a.course === 'chemistry' && a.assistance === 'independent-only',
    ))
      expect(a.companionQuestions ?? []).toHaveLength(0);
  });
});
describe('real labs and measurements', () => {
  it('keeps SMG labs distinct and states source and data limits', () => {
    expect(chemistryLabs.map((l) => l.number)).toEqual(['2A', '2B', '2C']);
    const a = chemistryLabs[0],
      c = chemistryLabs[2];
    expect(a.before.join(' ')).toContain('50 mL');
    expect(a.before.join(' ')).toContain('7.5 cm');
    expect(
      a.expected.find((e) => e.label === 'Bubbles in Part II')!.text,
    ).toContain('does not prove chlorine');
    expect(c.expected[0].text).toContain('not supplied');
    for (const lab of chemistryLabs) {
      expect(lab.source).toContain('SMG');
      expect(lab.references.length).toBeGreaterThan(0);
      expect(lab.questions.some((q) => q.needsData)).toBe(true);
      const event = schedule.find((e) => e.assignment === lab.id)!;
      expect(event.start).toBeUndefined();
      expect(event.confidence).toBe('unverified');
      expect(event.status).toBe('date-unconfirmed');
    }
  });
  it('never supplies synthetic curve measurements and rejects damaged readings', () => {
    expect(parseTemperaturePoints('')).toEqual({ points: [] });
    expect(parseTemperaturePoints('0, 28\n0.5, 33\n1, 38').points).toEqual([
      { time: 0, temperature: 28 },
      { time: 0.5, temperature: 33 },
      { time: 1, temperature: 38 },
    ]);
    for (const text of [
      '0 30\n0 31',
      '1 32\n0 30',
      'bad 30',
      '0 -300',
      '0 30 2',
      '-1 30',
    ])
      expect(parseTemperaturePoints(text).error).toBeTruthy();
  });
});
