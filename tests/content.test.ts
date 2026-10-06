import { describe, expect, it } from 'vitest';
import { publicCatalog, validateContent } from '../scripts/validate-content';

const copy = () => structuredClone(publicCatalog);

describe('publication validation rejects damaged source mappings', () => {
  it('rejects duplicate stable concept IDs', () => {
    const data = copy();
    data.concepts.push(structuredClone(data.concepts[0]));
    expect(validateContent(data)).toContain('Duplicate stable ID');
  });
  it('rejects a graph edge with a missing target', () => {
    const data = copy();
    data.edges[0].to = 'missing-concept';
    expect(
      validateContent(data).some((e) => e.startsWith('Broken edge:')),
    ).toBe(true);
  });
  it('rejects a concept with no instructional connections', () => {
    const data = copy();
    const id = data.concepts[0].id;
    data.edges = data.edges.filter((e) => e.from !== id && e.to !== id);
    expect(validateContent(data)).toContain(`Orphan concept: ${id}`);
  });
  it('rejects missing provenance and missing transfer practice', () => {
    const data = copy();
    const id = data.concepts[0].id;
    data.concepts[0].sources = ['missing-source'];
    data.questions = data.questions.filter(
      (q) => !q.concepts.includes(id) || q.level !== 'transfer',
    );
    const errors = validateContent(data);
    expect(errors).toContain('Missing provenance missing-source');
    expect(errors).toContain(`No transfer practice: ${id}`);
  });
  it('rejects impossible dates and reversed ranges', () => {
    const data = copy();
    data.schedule[0].start = '2026-02-30';
    data.assignments[0].assigned = '2026-10-10';
    data.assignments[0].due = '2026-10-01';
    const errors = validateContent(data);
    expect(errors.some((e) => e.includes('Invalid ISO date'))).toBe(true);
    expect(errors).toContain(`Due before assigned: ${data.assignments[0].id}`);
  });
  it('rejects undated assessments without an uncertainty note', () => {
    const data = copy();
    delete data.schedule[0].start;
    delete data.schedule[0].dateNote;
    expect(validateContent(data)).toContain(
      `Undated event without uncertainty ${data.schedule[0].id}`,
    );
  });
  it('rejects invalid external URLs and unpublished questions', () => {
    const data = copy();
    data.sources[0].url = 'broken URL';
    data.questions[0].status = 'draft';
    const errors = validateContent(data);
    expect(errors.some((e) => e.includes('Invalid URL'))).toBe(true);
    expect(errors).toContain(
      `Unfinished question included in public catalog: ${data.questions[0].id}`,
    );
  });
  it('does not publish a coverage item with no actual check', () => {
    const data = copy();
    const id = data.coverageItems[0].id;
    data.questions.forEach((q) => {
      q.coverage = q.coverage.filter((c) => c !== id);
    });
    expect(validateContent(data)).toContain(
      `Coverage item has no practice: ${id}`,
    );
  });
});
