import { describe, expect, it } from 'vitest';
import { assignments, concepts } from '../src/content/catalog';
import {
  lifeMaterials,
  lifeQuestions,
  lifeIdeas,
  lifeIdeaBacklinks,
  lifeQuestionIdea,
  lifeNotesUrl,
} from '../src/content/life-sciences';

describe('Life Sciences source boundaries and navigation', () => {
  it('separates sections and preserves all existing non-note checkpoints exactly once', () => {
    const supported = assignments.filter(
      (a) =>
        a.course === 'life-sciences' &&
        !['bio-c17-notes', 'bio-c18-notes'].includes(a.id),
    );
    const expected = supported
      .flatMap((a) =>
        (a.companionQuestions ?? []).map((q) => `${a.id}/${q.id}`),
      )
      .sort();
    const actual = lifeMaterials
      .flatMap((m) => lifeQuestions(m).map((q) => `${m.assignment}/${q.id}`))
      .sort();
    expect(actual).toEqual(expected);
    expect(new Set(lifeMaterials.map((m) => m.id)).size).toBe(
      lifeMaterials.length,
    );
    for (const part of [1, 2, 3, 4])
      expect(
        lifeMaterials.find((m) => m.id === `bio-c17-${part}`),
      ).toBeDefined();
    expect(lifeMaterials.find((m) => m.id === 'bio-c17-2')?.questions).toEqual([
      'q-17-2-1',
      'q-17-2-2',
      'q-17-2-3',
      'q-17-2-4',
      'q-17-2-5',
    ]);
  });
  it('keeps unreviewed source prompts honest instead of generating missing work', () => {
    for (const id of ['bio-c17-1', 'bio-c17-assessment', 'bio-c17-test-prep']) {
      const material = lifeMaterials.find((m) => m.id === id)!;
      expect(material.kind).toBe('reference');
      expect(material.questions).toEqual([]);
      expect(material.availability).toBeTruthy();
    }
    expect(
      lifeMaterials.find((m) => m.id === 'bio-c17-assessment')?.availability,
    ).toContain('not a confirmed assignment');
    expect(lifeNotesUrl).toBe(
      'https://sites.google.com/view/ecl-life-sciences-11/notes',
    );
  });
  it('resolves every idea, related link and backlink to actual content', () => {
    for (const idea of lifeIdeas) {
      expect(
        concepts.some(
          (c) => c.id === idea.concept && c.course === 'life-sciences',
        ),
      ).toBe(true);
      for (const id of idea.related ?? [])
        expect(lifeIdeas.some((i) => i.id === id)).toBe(true);
      for (const link of lifeIdeaBacklinks(idea.id)) {
        expect(lifeQuestions(link.material)).toContain(link.question);
        expect(lifeQuestionIdea(link.question)?.id).toBe(idea.id);
      }
    }
    expect(
      lifeIdeaBacklinks('endosymbiosis').some(
        (link) => link.question.id === 'q-17-2-4',
      ),
    ).toBe(true);
  });
  it('connects paired-choice key work to its own explanation, separate from taxonomy ranks', () => {
    const key = lifeMaterials.find((m) => m.id === 'bio-dichotomous-key')!;
    expect(lifeQuestions(key).map((q) => lifeQuestionIdea(q)?.id)).toEqual([
      'dichotomous-keys',
      'dichotomous-keys',
    ]);
    expect(
      lifeIdeaBacklinks('dichotomous-keys').map((link) => link.question.id),
    ).toEqual(['q-key-1', 'q-key-2']);
    expect(
      lifeIdeas.find((i) => i.id === 'dichotomous-keys')?.simple,
    ).toContain('two contrasting descriptions');
  });
});
