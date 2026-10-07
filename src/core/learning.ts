import type {
  Assignment,
  Concept,
  CoverageItem,
  EvidenceState,
  LearnerEvent,
  Question,
} from './schema';

export function mergeEvents(...sets: LearnerEvent[][]): LearnerEvent[] {
  const unique = new Map<string, LearnerEvent>();
  for (const events of sets)
    for (const event of events)
      if (!unique.has(event.id)) unique.set(event.id, event);
  return [...unique.values()].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
}

export function evidence(
  concept: string,
  events: LearnerEvent[],
  bank: Question[],
  now = Date.now(),
): { state: EvidenceState; reason: string; attempts: number } {
  const relevant = events.filter(
    (e) => 'concept' in e.payload && e.payload.concept === concept,
  );
  const attempts = relevant.filter((e) => e.type === 'question_answered');
  const classwork = relevant.filter((e) => e.type === 'companion_attempt');
  const difficulty = relevant
    .filter((e) => e.type === 'difficulty_rated')
    .at(-1);
  const latest = attempts.slice(-8);
  const report = relevant
    .filter(
      (e) =>
        e.type === 'concept_marked_confused' ||
        e.type === 'concept_self_reported_known',
    )
    .at(-1);
  const clean = latest.filter(
    (e) => e.payload.correct && e.payload.hints === 0,
  );
  const produced = clean.filter(
    (e) =>
      bank.find((q) => q.id === e.payload.question)?.level !== 'recognition',
  );
  const misses = latest.slice(-2).filter((e) => !e.payload.correct);
  if (
    report?.type === 'concept_marked_confused' &&
    !produced.some((e) => e.at > report.at)
  )
    return {
      state: attempts.length ? 'developing' : 'exposed',
      reason:
        'You marked this confusing. A fresh construction check can help locate the gap.',
      attempts: attempts.length,
    };
  if (
    misses.length &&
    (report?.type === 'concept_self_reported_known' || clean.length >= 3)
  )
    return {
      state: 'conflict',
      reason:
        'Earlier evidence and recent answers disagree. Try a small diagnostic.',
      attempts: attempts.length,
    };
  const archetypes = new Set(
    clean.map((e) => bank.find((q) => q.id === e.payload.question)?.archetype),
  );
  const construction = produced.some(
    (e) =>
      bank.find((q) => q.id === e.payload.question)?.level === 'construction',
  );
  const transfer = produced.some(
    (e) => bank.find((q) => q.id === e.payload.question)?.level === 'transfer',
  );
  if (archetypes.size >= 3 && construction && transfer && !misses.length) {
    const last = Date.parse(clean.at(-1)!.at);
    return {
      state: now - last > 7 * 86400000 ? 'review due' : 'stable',
      reason:
        'Fresh unhinted answers across recognition, construction and transfer. Review after seven days.',
      attempts: attempts.length,
    };
  }
  if (
    attempts.length ||
    classwork.length ||
    (difficulty?.type === 'difficulty_rated' &&
      difficulty.payload.rating === 'hard')
  )
    return {
      state: 'developing',
      reason:
        'Some evidence exists. Stability needs varied unhinted construction and transfer checks.',
      attempts: attempts.length + classwork.length,
    };
  if (relevant.length)
    return {
      state: 'exposed',
      reason: 'Seen or self-reported; not yet demonstrated through practice.',
      attempts: 0,
    };
  return {
    state: 'unseen',
    reason: 'No learning evidence on this device yet.',
    attempts: 0,
  };
}

export function classworkReview(
  assignments: Assignment[],
  events: LearnerEvent[],
  concepts: string[],
) {
  return assignments
    .filter((a) => a.assistance !== 'independent-only')
    .flatMap((a) =>
      (a.companionQuestions ?? [])
        .filter((q) => q.concepts.some((c) => concepts.includes(c)))
        .map((q) => {
          const matching = events.filter(
            (e) =>
              (e.type === 'difficulty_rated' ||
                e.type === 'companion_attempt' ||
                e.type === 'companion_help') &&
              e.payload.assignment === a.id &&
              (e.type === 'difficulty_rated'
                ? e.payload.checkpoint
                : e.payload.question) === q.id,
          );
          const rating = matching
            .filter((e) => e.type === 'difficulty_rated')
            .at(-1);
          const attempt = matching
            .filter((e) => e.type === 'companion_attempt')
            .at(-1);
          const helped = matching
            .filter((e) => e.type === 'companion_help')
            .at(-1);
          const score =
            (rating?.type === 'difficulty_rated'
              ? rating.payload.rating === 'hard'
                ? 3
                : rating.payload.rating === 'okay'
                  ? 1
                  : 0
              : 0) +
            (attempt?.type === 'companion_attempt'
              ? !attempt.payload.correct
                ? 2
                : attempt.payload.hints || attempt.payload.revealed
                  ? 1
                  : 0
              : helped
                ? 1
                : 0);
          return {
            assignment: a,
            question: q,
            score,
            reason:
              rating?.type === 'difficulty_rated' &&
              rating.payload.rating === 'hard'
                ? 'You marked this hard'
                : attempt?.type === 'companion_attempt' &&
                    !attempt.payload.correct
                  ? 'Your last answer needs another look'
                  : 'Worth revisiting without help',
          };
        }),
    )
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.assignment.id.localeCompare(b.assignment.id) ||
        a.question.id.localeCompare(b.question.id),
    );
}

/** Dependency order with explicit cycle/missing-target rejection. Preview dependencies never block core learning. */
export function prerequisitePath(
  target: string,
  concepts: Concept[],
  known: string[] = [],
): string[] {
  const map = new Map(concepts.map((c) => [c.id, c]));
  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];
  function visit(id: string) {
    if (visited.has(id) || known.includes(id)) return;
    const c = map.get(id);
    if (!c) throw new Error(`Missing concept: ${id}`);
    if (active.has(id)) throw new Error(`Prerequisite cycle: ${id}`);
    active.add(id);
    for (const p of c.prerequisites)
      if (map.get(p)?.depth !== 'preview') visit(p);
    active.delete(id);
    visited.add(id);
    path.push(id);
  }
  visit(target);
  return path;
}

/** Nearest weak prerequisite by graph distance, then its own first unresolved prerequisite. */
export function nearestGap(
  target: string,
  concepts: Concept[],
  events: LearnerEvent[],
  bank: Question[],
): string | undefined {
  const map = new Map(concepts.map((c) => [c.id, c]));
  const queue = [...(map.get(target)?.prerequisites ?? [])];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const c = map.get(id);
    if (!c || c.depth === 'preview') continue;
    if (evidence(id, events, bank).state !== 'stable') {
      const branch = prerequisitePath(id, concepts);
      return branch.find((p) => evidence(p, events, bank).state !== 'stable');
    }
    queue.push(...c.prerequisites);
  }
  return evidence(target, events, bank).state === 'stable' ? undefined : target;
}

export function coverage(
  items: CoverageItem[],
  events: LearnerEvent[],
  bank: Question[],
) {
  const required = items.filter((i) => i.required);
  const tested = new Set<string>();
  const weak = new Set<string>();
  for (const e of events)
    if (e.type === 'question_answered') {
      const q = bank.find((q) => q.id === e.payload.question);
      // A revealed/hinted answer is exposure, not a meaningful coverage check.
      if (q && e.payload.hints === 0)
        for (const id of q.coverage) {
          tested.add(id);
          if (!e.payload.correct) weak.add(id);
          else weak.delete(id);
        }
    }
  return {
    total: required.length,
    tested: required.filter((i) => tested.has(i.id)),
    unseen: required.filter((i) => !tested.has(i.id)),
    weak: required.filter((i) => weak.has(i.id)),
  };
}

export const modes = [
  'Quick check',
  'Learn this',
  'Review this branch',
  'Fill my gaps',
  'Coverage sweep',
  'Unit review',
  'Test simulation',
  'Transfer only',
  'Cumulative review',
  'Surprise me',
] as const;
export type PracticeMode = (typeof modes)[number];
export function selectQuestions(
  bank: Question[],
  items: CoverageItem[],
  events: LearnerEvent[],
  mode: PracticeMode,
  conceptIds: string[],
  count = 6,
  seed = 1,
): Question[] {
  let pool = bank.filter(
    (q) =>
      q.status === 'publishable' &&
      q.concepts.some((c) => conceptIds.includes(c)),
  );
  if (mode === 'Transfer only')
    pool = pool.filter((q) => q.level === 'transfer');
  const unseen = new Set(coverage(items, events, bank).unseen.map((i) => i.id));
  const times = (id: string) =>
    events.filter(
      (e) => e.type === 'question_answered' && e.payload.question === id,
    ).length;
  const priority = (q: Question) =>
    (q.coverage.some((i) => unseen.has(i)) ? 100 : 0) +
    (['conflict', 'developing', 'review due'].includes(
      evidence(q.concepts[0], events, bank).state,
    )
      ? 20
      : 0) -
    times(q.id) * 8;
  pool = [...pool].sort(
    (a, b) =>
      priority(b) - priority(a) ||
      hash(`${a.id}${seed}`) - hash(`${b.id}${seed}`),
  );
  if (mode === 'Quick check')
    pool.sort(
      (a, b) =>
        Number(b.purpose === 'diagnostic') - Number(a.purpose === 'diagnostic'),
    );
  if (mode === 'Learn this') {
    const progression = (
      ['recognition', 'construction', 'transfer'] as const
    ).flatMap((level) => pool.find((q) => q.level === level) ?? []);
    pool = [...progression, ...pool.filter((q) => !progression.includes(q))];
  }
  // All mixed modes reserve exposure budget by prioritizing never-tested required items.
  return pool.slice(0, mode === 'Quick check' ? Math.min(count, 3) : count);
}
export function taskDone(
  assignment: string,
  task: string,
  events: LearnerEvent[],
) {
  const last = events
    .filter(
      (e) =>
        e.type === 'assignment_task' &&
        e.payload.assignment === assignment &&
        e.payload.task === task,
    )
    .at(-1);
  return last?.type === 'assignment_task' && last.payload.done;
}
export function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function variant(q: Question, seed: number): Question {
  const n = (hash(q.id + seed) % 8) + 2;
  if (q.template === 'velocity') {
    const speed = n - 1;
    const time = n + 2;
    const west = seed % 2 === 1;
    return {
      ...q,
      prompt: `A cart moves ${speed * time} m ${west ? 'west' : 'east'} in ${time} s. Take east as positive. What is its average velocity?`,
      answer: west ? -speed : speed,
      unitLabel: 'm/s',
      explanation: `Signed displacement divided by time: ${west ? '-' : '+'}${speed * time} / ${time} = ${west ? '-' : '+'}${speed} m/s. Direction is encoded by the sign.`,
    };
  }
  if (q.template === 'acceleration') {
    const a = (n % 5) + 1;
    return {
      ...q,
      prompt: `Velocity changes from -${n * a * 2} m/s to -${n * a} m/s in ${n} s. Calculate acceleration.`,
      answer: a,
      unitLabel: 'm/s²',
      explanation: `Change is (-${n * a}) - (-${n * a * 2}) = +${n * a} m/s. Divide by ${n} s: +${a} m/s². Negative velocity with positive acceleration means slowing down.`,
    };
  }
  if (q.template === 'conversion')
    return {
      ...q,
      prompt: `Convert ${n * 0.5} minutes into seconds.`,
      answer: n * 30,
      unitLabel: 's',
      explanation: `${n * 0.5} min × (60 s / 1 min) = ${n * 30} s. Minutes cancel.`,
    };
  if (q.template === 'half-life') {
    const halvings = (seed % 3) + 2;
    const percent = 100 / 2 ** halvings;
    return {
      ...q,
      prompt: `An isotope has a half-life of ${n * 100} years. A closed sample retains ${percent}% of its original parent isotope. What age does this indicate?`,
      answer: n * 100 * halvings,
      unitLabel: 'years',
      explanation: `${percent}% is ${halvings} halvings. ${halvings} × ${n * 100} = ${n * 100 * halvings} years.`,
    };
  }
  return q;
}
export function normalizeAnswer(s: string) {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[。.!?！？,]/g, '')
    .replace(/\s+/g, ' ');
}
function numericAnswer(value: string) {
  const normalized = value.normalize('NFKC').replace(/−/g, '-').trim();
  const match = normalized.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:e([+-]?\d+))?$/i,
  );
  if (!match || !Number.isFinite(Number(normalized))) return null;
  const mantissa = match[1].replace(/^[+-]/, '');
  const digits = mantissa.replace('.', '').replace(/^0+/, '');
  const decimals = mantissa.includes('.') ? mantissa.split('.')[1].length : 0;
  return {
    value: Number(normalized),
    significantFigures: digits.length || Math.max(1, decimals),
    decimalPlaces: decimals - Number(match[2] ?? 0),
    normalizedScientific:
      match[2] !== undefined &&
      Math.abs(Number(match[1])) >= 1 &&
      Math.abs(Number(match[1])) < 10,
  };
}
function matchingPrecision(
  q: Question,
  given: NonNullable<ReturnType<typeof numericAnswer>>,
  expected: NonNullable<ReturnType<typeof numericAnswer>>,
) {
  return (
    (!q.notation || given.normalizedScientific) &&
    (!q.precision ||
      (q.precision === 'significant-figures'
        ? given.significantFigures === expected.significantFigures
        : given.decimalPlaces === expected.decimalPlaces))
  );
}
export function evaluate(q: Question, answer: string, unit = ''): boolean {
  if (q.format === 'numeric') {
    const parsed = numericAnswer(answer);
    if (!parsed) return false;
    const n = parsed.value;
    const expected = Number(q.answer);
    const aliases: Record<string, string> = {
      'm/s^2': 'm/s²',
      'm/s2': 'm/s²',
      yr: 'years',
      year: 'years',
      seconds: 's',
      sec: 's',
    };
    const u = unit.trim();
    return (
      Number.isFinite(n) &&
      Math.abs(n - expected) <=
        (q.tolerance ?? 0.005) * Math.max(1, Math.abs(expected)) &&
      (aliases[u] ?? u) === (q.unitLabel ?? '') &&
      matchingPrecision(q, parsed, numericAnswer(String(q.answer))!)
    );
  }
  const answers = Array.isArray(q.answer) ? q.answer : [String(q.answer)];
  const expectedNumbers = answers.map(numericAnswer);
  if (q.format === 'text' && expectedNumbers.every((n) => n !== null)) {
    const given = numericAnswer(answer);
    if (!given) return false;
    return expectedNumbers.some(
      (expected) =>
        Math.abs(given.value - expected.value) <=
          Number.EPSILON * 8 * Math.max(1, Math.abs(expected.value)) &&
        matchingPrecision(q, given, expected),
    );
  }
  return answers.some((a) => normalizeAnswer(a) === normalizeAnswer(answer));
}
export function assignmentPriority(
  a: Assignment,
  events: LearnerEvent[],
  bank: Question[],
) {
  const states = a.concepts.map((id) => evidence(id, events, bank).state);
  const stable = states.filter((s) => s === 'stable').length;
  const unknown = states.filter(
    (s) => s === 'unseen' || s === 'exposed',
  ).length;
  return {
    label:
      stable === states.length
        ? 'Likely quick'
        : unknown === states.length
          ? 'Difficulty not yet known'
          : 'Worth doing fully',
    reason: `${stable} of ${states.length} underlying concepts look stable. ${unknown} still need a fresh check.`,
  };
}
export function tutorPrompt(
  c: Concept,
  concepts: Concept[],
  events: LearnerEvent[],
  bank: Question[],
  intent = 'Diagnose my confusion',
) {
  const known = concepts
    .filter((x) => evidence(x.id, events, bank).state === 'stable')
    .map((x) => x.title);
  return `You are helping me learn ${c.course} at Grade 11 depth. Intent: ${intent}.\nTarget: ${c.title}.\nExplanation I saw: ${c.model}\nReasoning: ${c.why}\nPrerequisites: ${c.prerequisites.map((id) => concepts.find((x) => x.id === id)?.title ?? id).join(', ') || 'No formal prerequisite'}.\nDemonstrated concepts: ${known.join(', ') || 'Not yet tested; do not assume mastery'}.\nAsk what is confusing before repeating the entire explanation. Diagnose the nearest missing prerequisite with one small probe. Teach using what I already know; use a different example or analogy if helpful. Give a small construction check, then a changed-context transfer check. Do not move on until the misunderstanding is repaired. Give hints before solutions. This is independent study, not submitted class work.${c.course === 'japanese' ? '\nMy course prohibits AI/translator-written submitted work. Do not produce a submit-ready assessed assignment answer.' : ''}`;
}
