import { pathToFileURL } from 'node:url';
import {
  assignments,
  concepts,
  courses,
  coverageItems,
  edges,
  editions,
  questions,
  schedule,
  sources,
} from '../src/content/catalog';
import * as schema from '../src/core/schema';
import { prerequisitePath, evaluate, variant } from '../src/core/learning';
import { checkCompanionAnswer } from '../src/core/companion';

export const publicCatalog = {
  courses,
  editions,
  concepts,
  edges,
  questions,
  coverageItems,
  assignments,
  schedule,
  sources,
};

export function validateContent(data = publicCatalog) {
  const {
    courses,
    editions,
    concepts,
    edges,
    questions,
    coverageItems,
    assignments,
    schedule,
    sources,
  } = data;
  const errors: string[] = [];
  const sets = [
    [courses, schema.courseSchema],
    [editions, schema.editionSchema],
    [concepts, schema.conceptSchema],
    [edges, schema.edgeSchema],
    [questions, schema.questionSchema],
    [coverageItems, schema.coverageSchema],
    [assignments, schema.assignmentSchema],
    [schedule, schema.scheduleSchema],
    [sources, schema.sourceSchema],
  ] as const;
  for (const [rows, validator] of sets)
    for (const row of rows) {
      const result = validator.safeParse(row);
      if (!result.success) errors.push(JSON.stringify(result.error.issues));
    }
  for (const rows of [
    courses,
    editions,
    concepts,
    questions,
    coverageItems,
    assignments,
    schedule,
    sources,
  ]) {
    const ids = rows.map((r) => r.id);
    if (ids.length !== new Set(ids).size) errors.push('Duplicate stable ID');
  }
  const has = (rows: { id: string }[], id: string) =>
    rows.some((r) => r.id === id);
  for (const edition of editions) {
    if (
      !has(courses, edition.course) ||
      !courses
        .find((c) => c.id === edition.course)
        ?.units.some((u) => u.id === edition.currentUnit)
    )
      errors.push(`Missing edition course/unit: ${edition.id}`);
    if (edition.end < edition.start)
      errors.push(`Invalid edition range ${edition.id}`);
  }
  for (const c of concepts) {
    if (
      !has(courses, c.course) ||
      !courses
        .find((x) => x.id === c.course)
        ?.units.some((u) => u.id === c.unit)
    )
      errors.push(`Missing course/unit: ${c.id}`);
    if (c.status !== 'publishable')
      errors.push(`Unfinished content included in public catalog: ${c.id}`);
    for (const s of c.sources)
      if (!has(sources, s)) errors.push(`Missing provenance ${s}`);
    try {
      prerequisitePath(c.id, concepts);
    } catch (e) {
      errors.push(String(e));
    }
    if (
      !questions.some(
        (q) => q.concepts.includes(c.id) && q.level === 'construction',
      )
    )
      errors.push(`No construction practice: ${c.id}`);
    if (
      !questions.some(
        (q) => q.concepts.includes(c.id) && q.level === 'transfer',
      )
    )
      errors.push(`No transfer practice: ${c.id}`);
    if (!edges.some((e) => e.from === c.id || e.to === c.id))
      errors.push(`Orphan concept: ${c.id}`);
  }
  for (const e of edges)
    if (!has(concepts, e.from) || !has(concepts, e.to))
      errors.push(`Broken edge: ${e.from} → ${e.to}`);
  for (const q of questions) {
    if (q.status !== 'publishable')
      errors.push(`Unfinished question included in public catalog: ${q.id}`);
    if (
      !courses
        .find((c) => c.id === q.course)
        ?.units.some((u) => u.id === q.unit)
    )
      errors.push(`Missing question course/unit: ${q.id}`);
    for (const c of [...q.concepts, q.diagnosis])
      if (!has(concepts, c)) errors.push(`Missing question concept ${c}`);
    for (const id of q.coverage)
      if (!has(coverageItems, id)) errors.push(`Missing coverage ${id}`);
    for (const s of q.sources)
      if (!has(sources, s)) errors.push(`Missing question source ${s}`);
    if (
      q.format === 'choice' &&
      (!q.choices?.includes(String(q.answer)) ||
        new Set(q.choices).size !== q.choices.length)
    )
      errors.push(`Invalid choices ${q.id}`);
    for (let seed = 0; seed < 20; seed++) {
      const v = variant(q, seed);
      const answer = Array.isArray(v.answer) ? v.answer[0] : String(v.answer);
      if (!evaluate(v, answer, v.unitLabel))
        errors.push(`Evaluator rejects own expected answer ${q.id}`);
    }
  }
  for (const item of coverageItems) {
    if (!has(concepts, item.concept))
      errors.push(`Missing coverage concept ${item.id}`);
    for (const source of item.sources)
      if (!has(sources, source))
        errors.push(`Missing coverage source ${source}`);
    if (!questions.some((q) => q.coverage.includes(item.id)))
      errors.push(`Coverage item has no practice: ${item.id}`);
  }
  for (const a of assignments) {
    if (
      a.unit &&
      !courses
        .find((c) => c.id === a.course)
        ?.units.some((u) => u.id === a.unit)
    )
      errors.push(`Unknown assignment unit: ${a.id}`);
    if (
      a.assistance === 'independent-only' &&
      (a.companionQuestions?.length || a.reading?.length || a.download)
    )
      errors.push(`Restricted assignment exposes assistance: ${a.id}`);
    const ids = a.companionQuestions?.map((q) => q.id) ?? [];
    if (ids.length !== new Set(ids).size)
      errors.push(`Duplicate companion checkpoint: ${a.id}`);
    for (const q of a.companionQuestions ?? []) {
      if (q.input === 'choice' && !q.choices?.includes(String(q.answer?.value)))
        errors.push(`Invalid companion choices: ${a.id}/${q.id}`);
      for (const c of q.concepts)
        if (!has(concepts, c))
          errors.push(`Missing companion concept: ${a.id}/${q.id}/${c}`);
      if (
        q.answer &&
        !checkCompanionAnswer(
          q,
          String(q.answer.value),
          q.answer.unit,
          q.answer.directions?.[0],
        ).correct
      )
        errors.push(`Companion rejects own answer: ${a.id}/${q.id}`);
      if (!q.answer && !q.checklist?.length)
        errors.push(`Written answer has no checklist: ${a.id}/${q.id}`);
    }
    if (
      !has(editions, a.edition) ||
      editions.find((e) => e.id === a.edition)?.course !== a.course
    )
      errors.push(`Assignment edition mismatch: ${a.id}`);
    for (const id of [...a.concepts, ...a.prerequisites])
      if (!has(concepts, id)) errors.push(`Missing assignment concept ${id}`);
    if (a.due && a.assigned && a.due < a.assigned)
      errors.push(`Due before assigned: ${a.id}`);
    for (const s of a.sources)
      if (!has(sources, s)) errors.push(`Missing assignment source ${s}`);
  }
  for (const e of schedule) {
    if (e.end && e.start && e.end < e.start)
      errors.push(`Invalid schedule range ${e.id}`);
    if (!e.start && !e.dateNote)
      errors.push(`Undated event without uncertainty ${e.id}`);
    for (const s of e.sources)
      if (!has(sources, s)) errors.push(`Missing schedule source ${s}`);
    for (const id of e.concepts)
      if (!has(concepts, id)) errors.push(`Missing schedule concept ${id}`);
    if (e.course && !has(courses, e.course))
      errors.push(`Missing schedule course ${e.id}`);
    if (
      e.edition &&
      editions.find((x) => x.id === e.edition)?.course !== e.course
    )
      errors.push(`Schedule edition mismatch: ${e.id}`);
    if (e.assignment && !has(assignments, e.assignment))
      errors.push(`Missing schedule assignment ${e.id}`);
  }
  const serialized = JSON.stringify({
    courses,
    concepts,
    questions,
    coverageItems,
    assignments,
    schedule,
    sources,
    editions,
  });
  for (const forbidden of [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    /"(?:password|password_hash|grades|privateProfile|personalPhone)"\s*:/i,
    /\bgh[opusr]_[A-Za-z0-9]{20,}/,
    /\b\(?\d{3}\)?[- ]\d{3}[- ]\d{4}\b/,
  ])
    if (forbidden.test(serialized))
      errors.push(`Private data pattern: ${forbidden}`);
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = validateContent();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `Content PASS: ${courses.length} courses, ${concepts.length} concepts, ${questions.length} question archetypes, ${coverageItems.length} coverage items, ${assignments.length} companions.`,
    );
}
