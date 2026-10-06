import { describe, it, expect } from 'vitest';
import {
  assignments,
  concepts,
  coverageItems,
  courses,
  schedule,
} from '../src/content/catalog';
import ingestion from '../src/content/ingestion/bleecker.json';
import {
  assignmentUnits,
  eventPath,
  eventUnit,
  learningPlan,
  searchAtlas,
  teacherUnitResources,
  unitTopics,
  workspaceCourses,
} from '../src/content/workspaces';
import { definitions } from '../src/content/definitions';
describe('V2 presentation over preserved content', () => {
  it('keeps every course independent and every published concept on a unit path', () => {
    expect(new Set(workspaceCourses.map((c) => c.id))).toEqual(
      new Set(courses.map((c) => c.id)),
    );
    const path = workspaceCourses.flatMap((c) =>
      c.units.flatMap((u) => unitTopics(c.id, u.id).map((t) => t.id)),
    );
    expect(new Set(path)).toEqual(
      new Set(
        concepts.filter((c) => c.status === 'publishable').map((c) => c.id),
      ),
    );
    expect(
      coverageItems
        .filter((i) => i.required)
        .every((i) => path.includes(i.concept)),
    ).toBe(true);
  });
  it('groups companions in actual units and orders only their explicit scope', () => {
    for (const a of assignments) {
      expect(
        courses
          .find((c) => c.id === a.course)!
          .units.some((u) => u.id === assignmentUnits[a.id]),
      ).toBe(true);
      const required = [...new Set([...a.prerequisites, ...a.concepts])],
        plan = learningPlan(a);
      expect(new Set(plan)).toEqual(new Set(required));
      for (const id of plan)
        for (const p of concepts
          .find((c) => c.id === id)!
          .prerequisites.filter((p) => required.includes(p)))
          expect(plan.indexOf(p)).toBeLessThan(plan.indexOf(id));
    }
  });
  it('does not invent teacher resource locations', () => {
    const indexed = new Set(
      ingestion.sources.flatMap((s) => [
        s.url,
        s.finalUrl,
        ...s.linkedResources,
      ]),
    );
    for (const r of Object.values(teacherUnitResources).flat())
      expect(indexed.has(r.url), r.url).toBe(true);
  });
  it('search joins half-life learning, companion and assessment using stable IDs', () => {
    const found = searchAtlas('half life');
    expect(found.map((x) => x.group)).toEqual(['Learn', 'Classwork', 'Other']);
    expect(found.map((x) => x.path)).toEqual([
      'learn/half-life/',
      'work/c17-research/',
      'prepare/c17-test-oct7/',
    ]);
    expect(
      searchAtlas('こんにちは').some((r) => r.path === 'learn/jp-konnichiwa/'),
    ).toBe(true);
    expect(
      searchAtlas('sumimasen').some((r) => r.path === 'learn/jp-sumimasen/'),
    ).toBe(true);
    expect(searchAtlas('half life', ['physics'])).toEqual([]);
  });
  it('finds units, formula aliases and teacher resources without exposing graph controls', () => {
    expect(
      searchAtlas('kinematics').some(
        (r) => r.path === 'courses/physics/units/kinematics/',
      ),
    ).toBe(true);
    expect(
      searchAtlas('Wadson').some(
        (r) => r.path === 'courses/physics/?resources=1',
      ),
    ).toBe(true);
    expect(
      searchAtlas('index fossil').some(
        (r) => r.path === 'learn/relative-dating/',
      ),
    ).toBe(true);
  });
  it('retains upcoming and uncertain assessment boundaries', () => {
    const c19 = schedule.find((e) => e.id === 'c19-quiz-oct9')!;
    expect(c19.concepts).toEqual([]);
    expect(eventUnit(c19)).toBe('microorganisms');
    const unknown = schedule.find((e) => e.id === 'physics-test-unconfirmed')!;
    expect(unknown.start).toBeUndefined();
    expect(eventPath(unknown)).toBe('prepare/physics-test-unconfirmed/');
  });
  it('definitions and backlinks always reference real learning IDs', () => {
    expect(
      definitions.every((d) => concepts.some((c) => c.id === d.concept)),
    ).toBe(true);
    expect(
      definitions.find((d) => d.term === 'index fossil')!.definition,
    ).toContain('widespread');
    expect(definitions.find((d) => d.term === 'すみません')!.concept).toBe(
      'jp-sumimasen',
    );
  });
});
