import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  contentHash,
  stableSourceId,
  sourceRelation,
  mergeRegistry,
  groupCaptures,
  parseTeacherCalendar,
  isBleeckerCoursePage,
  type RegisteredSource,
} from '../src/core/intake';
import {
  planUpdate,
  validateProjection,
  writeChanged,
  permittedVaultHashes,
  type Projection,
} from '../scripts/intake-workflow';
import { teacherLinks } from '../scripts/bleecker';
import { assignments, concepts, questions } from '../src/content/catalog';
import classroom from '../src/content/ingestion/classroom.json';
import strokes from '../src/content/ingestion/kana-strokes.json';
import { percentError, vectorFeedback } from '../src/content/teacher-profiles';
import { checkCompanionAnswer, latestDifficulty } from '../src/core/companion';
import { eventSchema } from '../src/core/schema';
import { evidence, mergeEvents, classworkReview } from '../src/core/learning';

const source = (
  identity = 'worksheet',
  patch: Partial<RegisteredSource> = {},
): RegisteredSource => ({
  source_id: stableSourceId('physics', 'fall-2026', identity),
  course: 'physics',
  teacher: 'Wadson',
  edition: 'fall-2026',
  unit: 'kinematics',
  material_set: 'motion',
  title: 'Motion worksheet',
  kind: 'worksheet',
  origin: 'test',
  raw_ids: ['photo-1'],
  raw_hashes: ['hash-1'],
  normalized_content_hash: contentHash('questions 1–15'),
  question_numbers: ['1', '2', '3'],
  publication: 'original-companion',
  assistance: 'allowed',
  confidence: 'verified',
  supplements: [],
  atlas_content_ids: ['kinematics-review'],
  ...patch,
});
const empty = { schema_version: 1 as const, sources: [], relationships: [] };

describe('canonical source intake', () => {
  it('the actual intake CLI preserves eight captures and writes nothing on a repeat', async () => {
    const folder = await mkdtemp(resolve(tmpdir(), 'atlas-cli-'));
    if (!folder.startsWith(resolve(tmpdir(), 'atlas-cli-')))
      throw new Error('Unexpected test directory');
    try {
      const files = [];
      for (let i = 0; i < 8; i++) {
        const path = resolve(folder, `page-${i}.txt`);
        await writeFile(path, `fixture page ${i}`);
        files.push({
          path,
          sequence_index: i,
          capture_timestamp: '2026-10-06T12:00:00Z',
        });
      }
      const specPath = resolve(folder, 'spec.json');
      await writeFile(
        specPath,
        JSON.stringify({
          identity: 'cli-eight-pages',
          course: 'physics',
          teacher: 'Wadson',
          edition: 'fall-2026',
          unit: 'kinematics',
          material_set: 'motion',
          title: 'Fixture worksheet',
          kind: 'worksheet',
          text: 'fixture questions 1–15',
          files,
          publication: 'private',
          assistance: 'allowed',
          confidence: 'verified',
          atlas_content_ids: [],
        }),
      );
      const archive = resolve(folder, 'archive'),
        run = () =>
          promisify(execFile)(
            process.execPath,
            [
              resolve('node_modules/tsx/dist/cli.mjs'),
              'scripts/intake.ts',
              '--spec',
              specPath,
              '--apply',
            ],
            { env: { ...process.env, ATLAS_SOURCE_ARCHIVE: archive } },
          );
      await run();
      const path = resolve(archive, 'registry.json'),
        bytes = await readFile(path, 'utf8'),
        modified = (await stat(path)).mtimeMs;
      expect(JSON.parse(bytes).sources[0].raw_files).toHaveLength(8);
      await run();
      expect(await readFile(path, 'utf8')).toBe(bytes);
      expect((await stat(path)).mtimeMs).toBe(modified);
      const id = JSON.parse(bytes).sources[0].source_id;
      expect(
        JSON.parse(
          await readFile(
            resolve(archive, 'intake', id, 'manifest.json'),
            'utf8',
          ),
        ).files,
      ).toHaveLength(8);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  }, 20000);
  it('uses stable IDs and normalizes OCR whitespace, unicode and case', () => {
    expect(stableSourceId('physics', 'fall-2026', ' Worksheet ')).toBe(
      stableSourceId('physics', 'fall-2026', 'worksheet'),
    );
    expect(contentHash('A\n B ２')).toBe(contentHash('a b 2'));
  });
  it('merges exact raw/text duplicates but reviews URLs and changed content', () => {
    const a = source();
    expect(sourceRelation(a, source('pdf', { raw_hashes: ['hash-1'] }))).toBe(
      'duplicate',
    );
    expect(sourceRelation(a, source('vault', { raw_hashes: ['other'] }))).toBe(
      'duplicate',
    );
    expect(
      sourceRelation(
        { ...a, original_url: 'https://drive.google.com/file/d/abc/view' },
        source('revision', {
          raw_hashes: ['new'],
          normalized_content_hash: contentHash('new text'),
          original_url: 'https://drive.google.com/open?id=abc',
        }),
      ),
    ).toBe('review');
    expect(
      sourceRelation(
        a,
        source('worksheet', {
          raw_hashes: ['new'],
          normalized_content_hash: contentHash('revised'),
        }),
      ),
    ).toBe('review');
    expect(() =>
      mergeRegistry({ schema_version: 1, sources: [a], relationships: [] }, [
        source('worksheet', {
          raw_hashes: ['new'],
          normalized_content_hash: contentHash('revised'),
        }),
      ]),
    ).toThrow(/revision identity/);
  });
  it('preserves all eight captures in one material and is idempotent', () => {
    const a = source('eight', { raw_ids: [], raw_hashes: [], raw_files: [] });
    const incoming = Array.from({ length: 8 }, (_, i) => ({
      ...a,
      raw_ids: ['raw' + i],
      raw_hashes: ['hash' + i],
      raw_files: [
        { raw_id: 'raw' + i, original_path: 'capture' + i, sequence_index: i },
      ],
    }));
    const merged = mergeRegistry(empty, incoming);
    expect(merged.sources).toHaveLength(1);
    expect(merged.sources[0].raw_files).toHaveLength(8);
    expect(mergeRegistry(merged, incoming)).toEqual(merged);
  });
  it('retains revisions and never makes a private duplicate public', () => {
    const a = source('v1', { publication: 'private' }),
      b = source('v2', {
        raw_hashes: ['v2'],
        normalized_content_hash: contentHash('changed'),
        supersedes: a.source_id,
      });
    const merged = mergeRegistry(empty, [a, b]);
    expect(merged.sources).toHaveLength(2);
    expect(merged.relationships).toContainEqual({
      from: b.source_id,
      to: a.source_id,
      relation: 'supersedes',
    });
    const dup = mergeRegistry(empty, [a, source('public')]);
    expect(dup.sources).toHaveLength(1);
    expect(dup.sources[0].publication).toBe('private');
    expect(
      sourceRelation(a, source('other-edition', { edition: 'new-term' })),
    ).toBe('different');
  });
  it('groups ordered page continuations and routes final Physics pages after Chemistry', () => {
    const captures = [
      {
        raw_id: 'c',
        sha256: 'c',
        sequence_index: 1,
        original_filename: 'c',
        text: 'Chemistry Hebden covalent bonding',
        course: 'chemistry' as const,
        document_key: 'chem',
      },
      {
        raw_id: 'p1',
        sha256: 'p1',
        sequence_index: 2,
        original_filename: 'p1',
        text: 'Physics Chapter 3 Accelerated motion velocity-time',
        document_key: 'physics-book',
        page: 66,
      },
      {
        raw_id: 'p2',
        sha256: 'p2',
        sequence_index: 3,
        original_filename: 'p2',
        text: 'Questions continue on the next page',
        document_key: 'physics-book',
        page: 67,
      },
    ];
    const grouped = groupCaptures(captures.reverse());
    expect(grouped.map((g) => g.course)).toEqual(['chemistry', 'physics']);
    expect(grouped[1].captures).toHaveLength(2);
    expect(
      assignments.find((a) => a.id === 'physics-textbook-accelerated-motion')!
        .course,
    ).toBe('physics');
  });
  it('maps notes and work to a shared material set without merging different books', () => {
    const work = assignments.find((a) => a.id === 'kinematics-review')!;
    expect(
      assignments.some(
        (a) =>
          a.kind === 'notes' &&
          a.course === work.course &&
          a.unit === work.unit,
      ),
    ).toBe(true);
    const hebden = assignments.find((a) => a.id === 'chemistry-hebden-atoms')!;
    expect(hebden.questionReferences).toEqual([
      'p.146 #13–17',
      'p.147 #19',
      'p.149 #22',
    ]);
    expect(JSON.stringify(hebden)).not.toContain('p.118');
  });
});
describe('teacher fidelity and publication', () => {
  it('retains folded calendar descriptions and real assessment scope', () => {
    const events = parseTeacherCalendar(
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:one\r\nDTSTART;VALUE=DATE:20261007\r\nDTEND;VALUE=DATE:20261008\r\nSUMMARY:C17 Test\r\nDESCRIPTION:Fossils\\, index fossils\\nMiller–Urey\r\n  and endosymbiosis; Hox genes\r\nEND:VEVENT\r\nEND:VCALENDAR',
    );
    expect(events[0].assessmentScope).toContain(
      'Miller–Urey and endosymbiosis; Hox genes',
    );
    expect(events[0].description).toContain('Fossils, index fossils');
    expect(
      parseTeacherCalendar(
        'BEGIN:VEVENT\nDTSTART:20250101\nSUMMARY:old\nEND:VEVENT',
      ),
    ).toEqual([]);
  });
  it('bounds teacher pages and unwraps video links while excluding unrelated courses', () => {
    expect(
      isBleeckerCoursePage(
        'https://sites.google.com/view/ecl-life-sciences-11/bio1/c17-origins',
      ),
    ).toBe(true);
    expect(
      isBleeckerCoursePage('https://sites.google.com/view/ecl-bio2/home'),
    ).toBe(false);
    expect(
      isBleeckerCoursePage(
        'https://sites.google.com/view/ecl-life-sciences-11/anatomy',
      ),
    ).toBe(false);
    expect(
      teacherLinks(
        '<a href="https://www.google.com/url?q=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc&amp;sa=D">x</a>',
        'https://sites.google.com',
      ),
    ).toEqual(['https://www.youtube.com/watch?v=abc']);
  });
  it('uses accepted-value absolute percent error with no blanket decimal rule', () => {
    expect(percentError(99.51, 100)).toBeCloseTo(0.49);
    expect(percentError(110, 100)).toBe(10);
    expect(percentError(90, 100)).toBe(10);
    expect(() => percentError(2, 0)).toThrow();
  });
  it('requires direction words and accepts the teacher’s signed-plus-direction form', () => {
    expect(vectorFeedback(15, 15, 'backward', ['backward'])).toBeNull();
    expect(vectorFeedback(-15, 15, 'backward', ['backward'])).toBeNull();
    expect(vectorFeedback(-15, 15, '', ['backward'])).toContain('direction');
    const q = assignments.find((a) => a.id === 'kinematics-review')!
      .companionQuestions![0];
    expect(checkCompanionAnswer(q, '63', 'm').correct).toBe(true);
    expect(checkCompanionAnswer(q, '64', 'm').correct).toBe(false);
    expect(checkCompanionAnswer(q, '63', 's').correct).toBe(false);
    expect(checkCompanionAnswer(q, '', 'm').correct).toBe(false);
    const count = assignments
      .find((a) => a.id === 'chemistry-hebden-atoms')!
      .companionQuestions!.find((q) => q.number === '13b')!;
    expect(checkCompanionAnswer(count, '93').correct).toBe(false);
    const tiny = assignments
      .find((a) => a.id === 'chemistry-hebden-conversions')!
      .companionQuestions!.find((q) => q.number === '17i')!;
    expect(checkCompanionAnswer(tiny, '0', 'kL').correct).toBe(false);
    expect(checkCompanionAnswer(tiny, '3.125e-6', 'kL').correct).toBe(true);
  });
  it('keeps marked work private and formal hand-ins free of assistance', () => {
    expect(validateProjection(classroom as Projection)).toEqual([]);
    const restricted = assignments.filter(
      (a) => a.assistance === 'independent-only',
    );
    expect(restricted).toHaveLength(3);
    for (const a of restricted) {
      expect(a.reading).toEqual([]);
      expect(a.companionQuestions).toEqual([]);
      expect(a.download).toBeUndefined();
    }
    expect(
      validateProjection({
        ...classroom,
        materials: [{ publication: 'private' }],
      } as Projection),
    ).toContain('Private source in public material index');
    expect(
      validateProjection({
        ...classroom,
        private_path: 'C:\\raw pictures\\IMG_1.JPG',
      } as Projection).length,
    ).toBeGreaterThan(0);
    expect(JSON.stringify(classroom)).not.toMatch(
      /Pahal|Woolgar|Isaac|99\.51|returnedAnswer|studentName/,
    );
  });
  it('prints a blank lab template and retains the authentic five-vowel strokes and connections', async () => {
    const template = await readFile(
      'public/downloads/wadson-formal-lab-template.html',
      'utf8',
    );
    expect(template).not.toMatch(/Pahal|Woolgar|Isaac|99\.51/);
    expect(template).toContain('Literature Cited');
    expect(classroom.japanese.learned.map((k) => k.character)).toEqual([
      'あ',
      'い',
      'う',
      'え',
      'お',
    ]);
    expect(Object.values(strokes).map((p) => p.length)).toEqual([
      3, 2, 2, 2, 3,
    ]);
    expect(
      classroom.japanese.connections.find((c) => c.component === 'ございます')!
        .examples,
    ).toEqual(['おはようございます', 'ありがとうございます']);
    expect(new Set(classroom.japanese.connections.map((c) => c.scope))).toEqual(
      new Set(['In class', 'Useful next']),
    );
  });
});
describe('saved classwork evidence and minimal updates', () => {
  const a = assignments.find((a) => a.id === 'kinematics-review')!,
    q = a.companionQuestions![0];
  const event = (rating: 'easy' | 'okay' | 'hard', at: string) =>
    eventSchema.parse({
      id: randomUUID(),
      device: randomUUID(),
      at,
      type: 'difficulty_rated',
      payload: {
        assignment: a.id,
        checkpoint: q.id,
        concept: q.concepts[0],
        rating,
      },
    });
  it('persists latest ratings across event merge while keeping self-report out of mastery', () => {
    const hard = event('hard', '2026-10-05T10:00:00Z'),
      easy = event('easy', '2026-10-06T10:00:00Z');
    const saved = JSON.parse(JSON.stringify([hard, easy]));
    expect(latestDifficulty(a.id, q.id, mergeEvents(saved, [hard]))).toBe(
      'easy',
    );
    expect(evidence(q.concepts[0], saved, questions).state).not.toBe('stable');
    expect(
      classworkReview(assignments, [hard], a.concepts)[0].question.id,
    ).toBe(q.id);
    expect(classworkReview(assignments, [easy], a.concepts)).toEqual([]);
  });
  it('has a zero-change second update and writes only changed bytes', async () => {
    const s = source();
    const r = mergeRegistry(empty, [s]);
    const plan = planUpdate(
      r,
      [s],
      classroom as Projection,
      classroom as Projection,
    );
    expect(plan.changedSources).toEqual([]);
    expect(plan.changedAssignments).toEqual([]);
    expect(plan.publicChanged).toBe(false);
    const folder = await mkdtemp(resolve(tmpdir(), 'atlas-idempotency-'));
    try {
      const p = resolve(folder, 'record.json');
      expect(await writeChanged(p, r)).toBe(true);
      const m = (await stat(p)).mtimeMs;
      expect(await writeChanged(p, r)).toBe(false);
      expect((await stat(p)).mtimeMs).toBe(m);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
  it('maps changed vault sources and never reads the protected notes folder', async () => {
    const folder = await mkdtemp(resolve(tmpdir(), 'atlas-vault-'));
    try {
      await mkdir(resolve(folder, '03 Areas/School/Physics'), {
        recursive: true,
      });
      await writeFile(
        resolve(folder, '03 Areas/School/Physics/worksheet.md'),
        'source',
      );
      await mkdir(resolve(folder, '06 My Notes'), { recursive: true });
      await writeFile(resolve(folder, '06 My Notes/secret.md'), 'private');
      const hashes = await permittedVaultHashes(folder);
      expect(Object.keys(hashes)).toEqual([
        '03 Areas/School/Physics/worksheet.md',
      ]);
      const s = source('vault', {
        vault_links: [
          {
            path: '03 Areas/School/Physics/worksheet.md',
            sha256: 'old',
            relation: 'same-material',
          },
        ],
      });
      const r = mergeRegistry(empty, [s]);
      expect(
        planUpdate(
          r,
          [],
          classroom as Projection,
          classroom as Projection,
          Object.keys(hashes),
        ).affected,
      ).toContain('kinematics-review');
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
  it('all companion questions use genuine inputs and concept-specific short repair checks', () => {
    for (const a of assignments.filter(
      (a) =>
        a.assistance !== 'independent-only' &&
        !(a.course === 'physics' && a.kind === 'notes'),
    ))
      expect(
        (a.reading?.length ?? 0) + (a.companionQuestions?.length ?? 0),
        a.id,
      ).toBeGreaterThan(0);
    for (const a of assignments)
      for (const q of a.companionQuestions ?? []) {
        expect(concepts.some((c) => c.id === q.concepts[0])).toBe(true);
        expect(q.repair.choices).toContain(q.repair.answer);
        expect(q.repair.choices.length).toBeLessThanOrEqual(3);
        if (q.input === 'numeric')
          expect(typeof q.answer?.value).toBe('number');
        if (q.input === 'choice') expect(q.choices).toContain(q.answer?.value);
      }
  });
});
