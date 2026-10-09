import type { Assignment, CompanionQuestion } from './schema';
import {
  atom,
  op,
  fraction,
  square,
  root,
  variable as v,
  substitute,
  type Expr,
} from './equation';

export type Fact = {
  id: string;
  symbol: string;
  value: string;
  unit: string;
  phrase?: string;
  implied?: string;
};
export type GuideStep = {
  id: string;
  action:
    | 'highlight'
    | 'derive'
    | 'extract'
    | 'target'
    | 'formula'
    | 'transform'
    | 'substitute'
    | 'visual'
    | 'student';
  title: string;
  text: string;
  focus?: string;
  facts?: number;
  frame?: number;
  scene?: number;
};
export type Guide = {
  kind:
    | 'reasoning'
    | 'physics'
    | 'conversion'
    | 'layers'
    | 'half-life'
    | 'cell'
    | 'timeline'
    | 'lewis'
    | 'phrase'
    | 'kana'
    | 'graph';
  steps: GuideStep[];
  facts?: Fact[];
  target?: string;
  equations?: Expr[];
  candidates?: {
    text: string;
    fits: boolean;
    chosen: boolean;
    reason: string;
  }[];
  conversion?: {
    value: string;
    from: string;
    to: string;
    factors: { top: string; bottom: string; cancel: string }[];
  };
  phrase?: string;
};
const step = (
  id: string,
  action: GuideStep['action'],
  title: string,
  text: string,
  extra: Partial<GuideStep> = {},
): GuideStep => ({ id, action, title, text, ...extra });
const turn = step(
  'your-turn',
  'student',
  'Your turn',
  'Use the setup on your real work. Keep your reasoning and units; atlas will check when you’re ready.',
);
const mul = (id: string, a: Expr, b: Expr) => op(id, '×', a, b);
const eq = (a: Expr, b: Expr) => op('equals', '=', a, b);
const twoAD = () =>
  mul('times-d', mul('times-a', atom('two', '2'), v('a')), v('d'));
const deltaV = () => op('velocity-difference', '−', v('vf'), v('vi'));
const deltaV2 = () =>
  op('squares-difference', '−', square(v('vf')), square(v('vi')));
export function physicsGuide(q: CompanionQuestion): Guide | undefined {
  if (q.input !== 'numeric') return;
  const knownText =
    q.steps.find((s) => s.title === 'Write the known values')?.text ?? '';
  const relationship = (
    q.steps.find((s) => s.title === 'Choose the relationship')?.text ?? ''
  ).replaceAll('Δd', 'Δx');
  const known = [
    ...knownText.matchAll(
      /(?<![a-z])(vi|vf|a|g|h|Δx|Δd|Δt)\s*=\s*([−+-]?\d+(?:\.\d+)?)(?:\s*(cm\/year²|cm\/year|m\/s²|m\/s|year|m|s))?/g,
    ),
  ].map((m) => {
    const id =
      ({ Δx: 'd', Δd: 'd', Δt: 't', g: 'a', h: 'd' } as Record<string, string>)[
        m[1]
      ] ?? m[1];
    const value = m[2].replace('−', '-');
    const unit =
      m[3] ??
      (id === 'a' ? 'm/s²' : id === 'd' ? 'm' : id === 't' ? 's' : 'm/s');
    const phrase = q.prompt.includes(`${m[2]} ${unit}`)
      ? `${m[2]} ${unit}`
      : q.prompt.includes(m[2]) && Number(value) !== 0
        ? m[2]
        : undefined;
    return {
      id,
      symbol: (
        { vi: 'vᵢ', vf: 'v𝒻', d: 'Δd', t: 'Δt', a: 'a' } as Record<
          string,
          string
        >
      )[id],
      value,
      unit,
      phrase,
    };
  });
  if (
    q.concepts.includes('free-fall') &&
    !known.some((f) => f.id === 'a') &&
    !/another planet/.test(q.prompt)
  )
    known.push({
      id: 'a',
      symbol: 'a',
      value: '-9.8',
      unit: 'm/s²',
      phrase: undefined,
    });
  const facts: Fact[] = [...new Map(known.map((f) => [f.id, f])).values()];
  const target =
    q.answer?.unit === 's'
      ? 't'
      : q.answer?.unit === 'm/s²' || q.answer?.unit === 'cm/y²'
        ? 'a'
        : q.answer?.unit === 'm'
          ? 'd'
          : /launch|starting|initial/i.test(q.asking)
            ? 'vi'
            : 'vf';
  if (facts.some((f) => f.id === target)) return;
  let original: Expr, isolated: Expr;
  let required: string[];
  let family: string;
  if (relationship.startsWith('vf² = vi² + 2aΔx')) {
    original = eq(square(v('vf')), op('sum', '+', square(v('vi')), twoAD()));
    required = ['vf', 'vi', 'a', 'd'];
    family = 'without time';
    const rhs =
      target === 'vf'
        ? root(op('sum', '+', square(v('vi')), twoAD()))
        : target === 'vi'
          ? root(op('difference', '−', square(v('vf')), twoAD()))
          : fraction(
              'divide',
              deltaV2(),
              mul('times-two', atom('two', '2'), v(target === 'd' ? 'a' : 'd')),
            );
    isolated = eq(v(target), rhs);
  } else if (
    /^vf = (vi|aΔt)/.test(relationship) &&
    ['vf', 'vi', 'a', 't'].includes(target)
  ) {
    original = eq(
      v('vf'),
      op('sum', '+', v('vi'), mul('times', v('a'), v('t'))),
    );
    required = ['vf', 'vi', 'a', 't'];
    family = 'without displacement';
    isolated =
      target === 'vf'
        ? original
        : target === 'vi'
          ? eq(
              v('vi'),
              op('difference', '−', v('vf'), mul('times', v('a'), v('t'))),
            )
          : eq(
              v(target),
              fraction('divide', deltaV(), v(target === 't' ? 'a' : 't')),
            );
  } else if (
    relationship.startsWith('Δx = ((vi + vf) / 2) Δt') &&
    ['d', 't'].includes(target)
  ) {
    const sum = op('velocity-sum', '+', v('vi'), v('vf'));
    original = eq(
      v('d'),
      mul('times', fraction('average', sum, atom('two', '2')), v('t')),
    );
    required = ['d', 'vi', 'vf', 't'];
    family = 'average velocity';
    isolated =
      target === 'd'
        ? original
        : eq(
            v('t'),
            fraction(
              'average',
              mul('times-two', atom('two', '2'), v('d')),
              sum,
            ),
          );
  } else if (
    /^Δx = (viΔt|½aΔt²)/.test(relationship) &&
    facts.find((f) => f.id === 'vi')?.value === '0' &&
    ['d', 't', 'a'].includes(target)
  ) {
    original = eq(
      v('d'),
      mul(
        'times-time',
        mul('times-half', atom('half', '½'), v('a')),
        square(v('t')),
      ),
    );
    required = ['d', 'a', 't'];
    family = 'from rest';
    isolated =
      target === 'd'
        ? original
        : eq(
            v(target),
            target === 't'
              ? root(
                  fraction(
                    'divide',
                    mul('times-two', atom('two', '2'), v('d')),
                    v('a'),
                  ),
                )
              : fraction(
                  'divide',
                  mul('times-two', atom('two', '2'), v('d')),
                  square(v('t')),
                ),
          );
  } else return;
  if (
    required
      .filter((id) => id !== target)
      .some((id) => !facts.some((f) => f.id === id))
  )
    return;
  const rest = q.clues.find(
    (c) =>
      /dropped|from rest|released/.test(c.word) && q.prompt.includes(c.word),
  );
  const restFact = facts.find((f) => f.id === 'vi' && f.value === '0');
  if (rest && restFact) {
    restFact.phrase = rest.word;
    restFact.implied = 'Released without an initial push → starts from rest.';
  }
  facts.forEach((f) => {
    if (f.id === 'a' && !f.phrase && q.concepts.includes('free-fall'))
      f.implied =
        'This is free fall. Up is positive, so gravity points in the negative direction: a = −9.8 m/s², using Wadson’s supplied formula-sheet value.';
  });
  if (restFact && rest)
    facts.sort((a, b) => (a === restFact ? -1 : b === restFact ? 1 : 0));
  const steps: GuideStep[] = [];
  if (rest) {
    steps.push(
      step(
        'clue',
        'highlight',
        'Watch this word',
        'Tap the highlighted word for a quick connection, or keep going.',
        { focus: rest.word, facts: 0 },
      ),
    );
    steps.push(
      step(
        'rest',
        'derive',
        'Starts from rest',
        '“Dropped” means released without an initial push. Initial velocity is zero; acceleration is still nonzero.',
        { focus: rest.word, facts: 1 },
      ),
    );
  } else
    steps.push(
      step('clue', 'highlight', 'Read the question', q.asking, {
        focus: q.clues.find((c) => q.prompt.includes(c.word))?.word,
        facts: 0,
      }),
    );
  facts.forEach((f, i) => {
    if (rest && f === restFact) return;
    steps.push(
      step(
        `extract-${f.id}`,
        f.implied ? 'derive' : 'extract',
        f.implied ? 'An implied value' : 'Pull out the measurement',
        f.implied ??
          `${f.phrase ?? f.value} describes ${f.symbol}. Keep its unit and the chosen direction.`,
        { focus: f.phrase, facts: i + 1 },
      ),
    );
  });
  steps.push(
    step('target', 'target', 'What are we finding?', q.asking, {
      facts: facts.length,
    }),
  );
  steps.push(
    step(
      'equation',
      'formula',
      'Choose what fits',
      `This relationship connects the known values to ${target === 'vf' ? 'final velocity' : target === 'vi' ? 'initial velocity' : target === 't' ? 'time' : target === 'd' ? 'displacement' : 'acceleration'} ${family === 'without time' ? 'without needing time.' : family === 'without displacement' ? 'without needing displacement.' : 'under constant acceleration.'}`,
      { facts: facts.length, frame: 0 },
    ),
  );
  if (original !== isolated)
    steps.push(
      step(
        'isolate',
        'transform',
        'Isolate the unknown',
        target === 'vf' || target === 'vi'
          ? 'Take the square root after isolating the squared velocity. The direction comes from your chosen axis, not from guessing a sign.'
          : 'Apply the same operation to both sides. Watch the same terms change position.',
        { facts: facts.length, frame: 1 },
      ),
    );
  steps.push(
    step(
      'substitute',
      'substitute',
      'The values take their places',
      'Each measurement fills its own variable. Calculate only after the units and signs agree.',
      { facts: facts.length, frame: 2 },
    ),
  );
  steps.push({ ...turn, facts: facts.length, frame: 2 });
  const available = new Set([...facts.map((f) => f.id), target]);
  const candidates = [
    {
      text: 'v𝒻² = vᵢ² + 2ad',
      ids: ['vf', 'vi', 'a', 'd'],
      chosen: family === 'without time',
    },
    {
      text: 'v𝒻 = vᵢ + aΔt',
      ids: ['vf', 'vi', 'a', 't'],
      chosen: family === 'without displacement',
    },
    {
      text: 'd = ½(vᵢ + v𝒻)Δt',
      ids: ['d', 'vi', 'vf', 't'],
      chosen: family === 'average velocity',
    },
    {
      text: 'd = ½aΔt²',
      ids: ['d', 'a', 't'],
      chosen: family === 'from rest',
    },
  ].map((c) => ({
    text: c.text,
    chosen: c.chosen,
    fits: c.ids.every((id) => available.has(id)),
    reason: c.ids.every((id) => available.has(id))
      ? 'Uses the available quantities'
      : `Needs ${c.ids.filter((id) => !available.has(id)).join(', ')}`,
  }));
  return {
    kind: 'physics',
    facts,
    target,
    steps,
    candidates,
    equations: [
      original,
      isolated,
      substitute(
        isolated,
        Object.fromEntries(facts.map((f) => [f.id, f.value])),
      ),
    ],
  };
}

const prefix: Record<string, number> = {
  M: 1e6,
  k: 1e3,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  μ: 1e-6,
  n: 1e-9,
};
function scale(unit: string) {
  return unit.length === 1 ? 1 : prefix[unit[0]];
}
function sci(n: number) {
  return n === 1
    ? '1'
    : n >= 0.01 && n < 10000
      ? String(n)
      : `10${String(Math.round(Math.log10(n))).replace(/./g, (c) => (({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }) as Record<string, string>)[c])}`;
}
function conversionGuide(q: CompanionQuestion): Guide | undefined {
  const match =
    /^Convert ([\d.]+) ([Mkdcmμn]?[gsLm]) to ([Mkdcmμn]?[gsLm])\.$/.exec(
      q.prompt,
    );
  if (
    !match ||
    match[2].at(-1) !== match[3].at(-1) ||
    !scale(match[2]) ||
    !scale(match[3])
  )
    return;
  const [, value, from, to] = match,
    base = from.at(-1)!;
  const factors =
    from.length > 1 && to.length > 1
      ? [
          {
            top: `${sci(scale(from))} ${base}`,
            bottom: `1 ${from}`,
            cancel: from,
          },
          { top: `1 ${to}`, bottom: `${sci(scale(to))} ${base}`, cancel: base },
        ]
      : [
          {
            top: `${sci(scale(from) / scale(to))} ${to}`,
            bottom: `1 ${from}`,
            cancel: from,
          },
        ];
  return {
    kind: 'conversion',
    conversion: { value, from, to, factors },
    steps: [
      step(
        'value',
        'extract',
        'Start with the actual value',
        'A conversion changes the unit and number together.',
        { focus: `${value} ${from}`, scene: 0 },
      ),
      step(
        'factors',
        'visual',
        'Build the factor chain',
        'Equal quantities make a factor of one. Put the old unit below so it cancels.',
        { scene: 1 },
      ),
      step(
        'cancel',
        'visual',
        'Follow the units',
        `Cancel matching units above and below. Only ${to} remains.`,
        { scene: 2 },
      ),
      { ...turn, scene: 2 },
    ],
  };
}
export function visualGuide(
  concepts: string[],
  text: string,
): Guide | undefined {
  if (concepts.includes('relative-dating'))
    return {
      kind: 'layers',
      steps: [
        step(
          'fossil',
          'highlight',
          'Find the shared fossil',
          'An index fossil was widespread and lived for a limited time.',
          { focus: 'Index fossils', scene: 0 },
        ),
        step(
          'locations',
          'visual',
          'Compare two locations',
          'Layers can differ in thickness. Look for the same index fossil.',
          { scene: 1 },
        ),
        step(
          'correlate',
          'visual',
          'Match the evidence',
          'Same index fossil → same limited interval → correlate the layers. This gives a relative order, not an exact age in years.',
          { scene: 2 },
        ),
        step(
          'write',
          'student',
          'Explain how it helps',
          'Use that connection in your own response. Explain the mechanism, rather than just defining “fossil”.',
          { scene: 2 },
        ),
      ],
    };
  if (concepts.includes('half-life'))
    return {
      kind: 'half-life',
      steps: [
        step(
          'initial',
          'visual',
          'Start with the parent isotope',
          'The initial parent amount is 100%.',
          { scene: 0 },
        ),
        step(
          'halve',
          'visual',
          'One equal interval',
          'One half-life leaves half the parent amount: 50%.',
          { scene: 1 },
        ),
        step(
          'again',
          'visual',
          'Halve what remains',
          'Two half-lives leave 25%; three leave 12.5%. Each interval halves the remaining parent.',
          { scene: 2 },
        ),
        { ...turn, scene: 3 },
      ],
    };
  if (concepts.includes('endosymbiosis'))
    return {
      kind: 'cell',
      steps: [
        step(
          'bacteria',
          'visual',
          'An ancestral cell and a bacterium',
          'This is a model of the proposed origin, not a teacher-specific diagram.',
          { scene: 0 },
        ),
        step(
          'inside',
          'visual',
          'Retained inside the larger cell',
          'A lasting partnership could provide useful energy or photosynthesis.',
          { scene: 1 },
        ),
        step(
          'evidence',
          'visual',
          'Connect the evidence',
          'Bacterial-like DNA, ribosomes and binary fission support the proposed ancestry.',
          { scene: 2 },
        ),
        { ...turn, scene: 2 },
      ],
    };
  if (
    concepts.some((c) =>
      ['lewis-structures', 'electron-groups', 'vsepr'].includes(c),
    )
  )
    return {
      kind: 'lewis',
      steps: [
        step(
          'count',
          'visual',
          'Count before drawing',
          'Worked model: H₂O. Oxygen contributes 6 electrons; each hydrogen contributes 1. Total: 8.',
          { scene: 0 },
        ),
        step(
          'bonds',
          'visual',
          'Build the bonds',
          'Two O–H bonds use four electrons. Four remain.',
          { scene: 1 },
        ),
        step(
          'pairs',
          'visual',
          'Place the remaining electrons',
          'Two lone pairs on oxygen use the last four electrons. Each H has two; O counts eight.',
          { scene: 2 },
        ),
        step(
          'shape',
          'visual',
          'From electrons to shape',
          'Two bond regions + two lone pairs = four electron regions. Tetrahedral electron arrangement; bent molecular shape.',
          { scene: 3 },
        ),
        step(
          'paper',
          'student',
          'Your assigned molecules',
          'Return to the exact list in Hebden p.188 #86. This water model shows the method; it does not replace or invent the textbook’s molecules.',
          { scene: 3 },
        ),
      ],
    };
  if (/ございます/.test(text))
    return {
      kind: 'phrase',
      phrase: text.match(/[ぁ-ん]+ございます/)?.[0] ?? 'おはようございます',
      steps: [
        step(
          'phrase',
          'visual',
          'The expression you’ve seen in class',
          'Say the whole phrase first.',
          { scene: 0 },
        ),
        step(
          'parts',
          'visual',
          'Notice the familiar part',
          'ございます is a polite component. Here it connects to おはよう or ありがとう; the whole phrase gives the greeting or thanks.',
          { scene: 1 },
        ),
        step(
          'connect',
          'visual',
          'You’ve seen it before',
          'おはようございます · ありがとうございます. Tap ございます to compare the current expressions.',
          { scene: 2 },
        ),
        step(
          'recall',
          'student',
          'Use the complete expression',
          'Return to your current phrase and write or say it as a whole.',
          { scene: 2 },
        ),
      ],
    };
}
export function questionGuide(a: Assignment, q: CompanionQuestion): Guide {
  if (a.assistance === 'independent-only')
    throw new Error('Restricted material has no teaching guide');
  const phrase = typeof q.answer?.value === 'string' ? q.answer.value : '';
  const specialized =
    a.course === 'physics'
      ? physicsGuide(q)
      : a.course === 'chemistry'
        ? (conversionGuide(q) ?? visualGuide(q.concepts, q.prompt))
        : a.course === 'japanese' && phrase.includes('ございます')
          ? visualGuide(q.concepts, phrase)
          : visualGuide(q.concepts, q.prompt);
  if (specialized) return specialized;
  const steps = q.clues
    .filter((c) => q.prompt.toLowerCase().includes(c.word.toLowerCase()))
    .map((c, i) =>
      step(`clue-${i}`, 'highlight', 'A clue in the wording', c.explanation, {
        focus: c.word,
      }),
    );
  steps.push(
    ...q.steps
      .filter((s) => s.title !== 'Check the written work')
      .map((s, i) => step(`setup-${i}`, 'derive', s.title, s.text)),
  );
  if (steps.length === 0)
    steps.push(step('asking', 'highlight', 'Help me start', q.asking));
  steps.push(turn);
  return { kind: 'reasoning', steps };
}
