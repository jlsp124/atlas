import { expect, it } from 'vitest';
import { assignments, concepts, questions } from '../src/content/catalog';
import {
  lifeMaterials,
  lifeQuestions,
  lifeQuestionIdea,
} from '../src/content/life-sciences';
import {
  lifeVideos,
  novaQuestions,
  videoEvidence,
} from '../src/content/bio-videos';

it('keeps all real Chapter 19 sections separate and links every supported item to a key idea', () => {
  for (const [section, count] of [
    [1, 6],
    [2, 5],
    [3, 6],
  ] as const) {
    const material = lifeMaterials.find((m) => m.id === `bio-c19-${section}`)!;
    expect(lifeQuestions(material)).toHaveLength(count);
  }
  for (const material of lifeMaterials.filter(
    (m) =>
      m.unit === 'microorganisms' ||
      ['bio-c17-1', 'bio-c17-assessment', 'bio-c17-test-prep'].includes(m.id),
  ))
    for (const q of lifeQuestions(material)) {
      expect(lifeQuestionIdea(q)).toBeDefined();
      expect(q.hints[0].length).toBeGreaterThan(30);
      expect(q.checklist?.length).toBeGreaterThan(0);
    }
  expect(
    assignments.find((a) => a.id === 'bio-c19-review')!.companionQuestions,
  ).toHaveLength(35);
  const sourceIdeas = concepts.filter((c) => c.practiceMode === 'assignment');
  expect(sourceIdeas).toHaveLength(9);
  expect(
    questions.some((q) => sourceIdeas.some((c) => q.concepts.includes(c.id))),
  ).toBe(false);
});
it('preserves NOVA identities and grounds facts in the teacher-linked video while leaving reflections open', () => {
  expect(novaQuestions.map((q) => q.id)).toEqual([
    'q-pre-1',
    'q-pre-2',
    ...Array.from({ length: 13 }, (_, i) => `q-${i + 1}`),
  ]);
  expect(lifeVideos['c17-research'].url).toContain('IuqmtcogwsE');
  expect(lifeVideos['bio-virus-video'].url).toContain('8q68qHiKKYw');
  expect(
    Object.values(videoEvidence['c17-research']).filter(
      (e) => e.kind === 'fact',
    ),
  ).toHaveLength(11);
  expect(videoEvidence['c17-research']['q-6'].seconds).toBe(1802);
  expect(videoEvidence['c17-research']['q-11'].text).toContain('30 seconds');
  expect(videoEvidence['bio-virus-video']['q-16'].kind).toBe('reasoning');
  expect(videoEvidence['bio-virus-video']['q-16'].seconds).toBeUndefined();
  expect(videoEvidence['bio-virus-video']['q-reflection'].kind).toBe(
    'reasoning',
  );
  for (const [id, evidence] of Object.entries(videoEvidence))
    expect(Object.keys(evidence).sort()).toEqual(
      assignments
        .find((a) => a.id === id)!
        .companionQuestions!.map((q) => q.id)
        .sort(),
    );
});
