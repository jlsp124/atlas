import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { assignments } from '../src/content/catalog';
import { questionGuide, visualGuide } from '../src/core/guide';
import { equationText, layoutEquation, type Expr } from '../src/core/equation';
import {
  checkpointComplete,
  materialProgress,
  resumeCheckpoint,
  validCheckpoint,
} from '../src/core/materials';
import { eventSchema, type LearnerEvent } from '../src/core/schema';
import { searchAtlas, unitUrl } from '../src/content/workspaces';
import { syncBatch } from '../src/core/sync-batch';
const material = assignments.find((a) => a.id === 'kinematics-review')!;
function event(type: string, payload: unknown, time: number): LearnerEvent {
  return eventSchema.parse({
    id: randomUUID(),
    device: randomUUID(),
    at: new Date(Date.UTC(2026, 9, 7, 12, 0, time)).toISOString(),
    type,
    payload,
  });
}
function evaluate(e: Expr): number {
  if (e.kind === 'atom')
    return e.text === '½' ? 0.5 : Number(e.text.replace(/[()]/g, ''));
  if (e.kind === 'fraction') return evaluate(e.top) / evaluate(e.bottom);
  if (e.kind === 'square') return evaluate(e.value) ** 2;
  if (e.kind === 'root') return Math.sqrt(evaluate(e.value));
  if (e.kind === 'group') return evaluate(e.value);
  if (e.kind !== 'op') throw new Error('Unsupported expression');
  const a = evaluate(e.left),
    b = evaluate(e.right);
  return e.op === '+' ? a + b : e.op === '−' ? a - b : e.op === '×' ? a * b : b;
}
describe('V3 material and motion contracts', () => {
  it('syncs long multilingual draft queues within the existing request limit without losing events', () => {
    const queued = Array.from({ length: 100 }, (_, i) =>
      event(
        'checkpoint_saved',
        {
          assignment: 'bio-c17-sections',
          checkpoint: 'q-17-2-4',
          value: 'あ\n'.repeat(4000),
          unit: '',
          direction: '',
          step: 2,
          help: true,
          complete: false,
        },
        i,
      ),
    );
    const accepted: LearnerEvent[] = [];
    while (queued.length) {
      const batch = syncBatch(queued);
      expect(
        new TextEncoder().encode(
          JSON.stringify({ events: batch, cursor: 10000 }),
        ).byteLength,
      ).toBeLessThan(128 * 1024);
      accepted.push(...batch);
      queued.splice(0, batch.length);
    }
    expect(accepted).toHaveLength(100);
    expect(new Set(accepted.map((e) => e.id)).size).toBe(100);
  });
  it('maps all 353 published checkpoints without changing IDs or helping restricted work', () => {
    const questions = assignments.flatMap((a) =>
      (a.companionQuestions ?? []).map((q) => ({ a, q })),
    );
    expect(questions).toHaveLength(353);
    for (const { a, q } of questions) {
      const guide = questionGuide(a, q);
      expect(guide.steps.at(-1)?.action).toBe('student');
      expect(validCheckpoint(a, q.id)).toBe(true);
      expect(new Set(guide.steps.map((s) => s.id)).size).toBe(
        guide.steps.length,
      );
    }
    for (const a of assignments.filter(
      (a) => a.assistance === 'independent-only',
    )) {
      expect(a.companionQuestions).toHaveLength(0);
      expect(validCheckpoint(a, 'q-1')).toBe(false);
      expect(() => questionGuide(a, questions[0].q)).toThrow('Restricted');
    }
  });
  it('extracts real dropped-question facts and stops before calculating the result', () => {
    const q = material.companionQuestions!.find((q) => q.id === 'q-10')!;
    const guide = questionGuide(material, q);
    expect(guide.kind).toBe('physics');
    expect(guide.steps[0].focus).toBe('dropped');
    expect(guide.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'vi', value: '0', phrase: 'dropped' }),
        expect.objectContaining({ id: 't', value: '2.0', phrase: '2.0 s' }),
        expect.objectContaining({
          id: 'a',
          value: '-9.8',
          implied: expect.any(String),
        }),
      ]),
    );
    expect(equationText(guide.equations![2])).toBe('v_f = 0 + (-9.8) × 2.0');
    expect(guide.steps.at(-1)?.action).toBe('student');
  });
  it('keeps identities through denominator movement, square roots and substitution', () => {
    const q = material.companionQuestions!.find((q) => q.id === 'q-4')!;
    const g = questionGuide(material, q);
    const frames = g.equations!.map(layoutEquation);
    expect(frames[0].tokens.find((t) => t.id === 'two')!.y).toBeGreaterThan(0);
    expect(frames[1].tokens.find((t) => t.id === 'two')!.y).toBeLessThan(0);
    expect(frames.every((f) => f.tokens.some((t) => t.id === 't'))).toBe(true);
    const drop = questionGuide(
      material,
      material.companionQuestions!.find((q) => q.id === 'q-11')!,
    );
    expect(equationText(drop.equations![1])).toContain('√');
    expect(equationText(drop.equations![2])).toContain('28');
  });
  it('independently calculates every generated physics setup against existing reviewed answers', () => {
    for (const a of assignments)
      for (const q of a.companionQuestions ?? []) {
        if (a.assistance === 'independent-only') continue;
        const g = questionGuide(a, q);
        if (g.kind !== 'physics') continue;
        const result = evaluate(g.equations![2]);
        expect(g.candidates?.some((c) => c.chosen && c.fits)).toBe(true);
        expect(Math.abs(result), `${a.id}/${q.id}`).toBeCloseTo(
          Math.abs(Number(q.answer!.value)),
          5,
        );
        for (const frame of g.equations!.map(layoutEquation))
          expect(new Set(frame.tokens.map((t) => t.id)).size).toBe(
            frame.tokens.length,
          );
      }
  });
  it('persists completion independently from mastery, with an explicit incomplete override', () => {
    const events = material.tasks.map((t, i) =>
      event(
        'assignment_task',
        { assignment: material.id, task: t.id, done: true },
        i,
      ),
    );
    expect(materialProgress(material, events).done).toBe(true);
    events.push(
      event('material_completed', { assignment: material.id, done: false }, 10),
    );
    expect(materialProgress(material, events).done).toBe(false);
    const saved = event(
      'checkpoint_saved',
      {
        assignment: material.id,
        checkpoint: 'q-10',
        value: '-19.6',
        unit: 'm/s',
        direction: '',
        step: 6,
        help: true,
        complete: false,
      },
      11,
    );
    events.push(saved);
    expect(checkpointComplete(material, 'q-10', events)).toBe(false);
    expect(resumeCheckpoint(material, events)).toBe('q-10');
    expect(eventSchema.parse(saved)).toEqual(saved);
    events.push(
      event('material_completed', { assignment: material.id, done: true }, 12),
    );
    expect(materialProgress(material, events).status).toBe('Complete');
  });
  it('uses course-specific visual scaffolds and real materials before concepts in search', () => {
    expect(visualGuide(['relative-dating'], 'Index fossils')?.kind).toBe(
      'layers',
    );
    expect(visualGuide(['half-life'], 'Half life')?.kind).toBe('half-life');
    expect(visualGuide(['endosymbiosis'], '')?.kind).toBe('cell');
    const chemistry = assignments.find(
      (a) => a.id === 'chemistry-hebden-conversions',
    )!;
    const g = questionGuide(chemistry, chemistry.companionQuestions![0]);
    expect(g.conversion?.from).toBe('Mg');
    expect(g.conversion?.to).toBe('mg');
    expect(g.conversion?.factors[0].top).toBe('10⁶ g');
    const japanese = assignments.find((a) => a.id === 'greetings-practice')!;
    const phrase = questionGuide(
      japanese,
      japanese.companionQuestions!.find((q) => q.id === 'q-4')!,
    );
    expect(phrase.kind).toBe('phrase');
    expect(phrase.phrase).toBe('おはようございます');
    expect(searchAtlas('half life')[0].group).toBe('Materials');
    expect(
      searchAtlas('kinematics review').some(
        (r) => r.path === 'work/kinematics-review/',
      ),
    ).toBe(true);
    expect(searchAtlas('Hebden 166').some((r) => r.group === 'Materials')).toBe(
      true,
    );
    expect(unitUrl('physics', 'kinematics', 'learn')).toBe(
      unitUrl('physics', 'kinematics', 'classwork'),
    );
  });
});
