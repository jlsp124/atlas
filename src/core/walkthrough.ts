import type { Assignment, CompanionQuestion } from './schema';
import { physicsSetups } from '../content/walkthrough-values';
import { writtenGuides } from '../content/walkthrough-guides';

export type GuideStep = {
  title: string;
  text: string;
  phase: string;
  write?: string;
  focus?: string;
  equation?: string;
};
export type KnownValue = {
  symbol: string;
  value: number;
  text: string;
  unit: string;
  source: string;
};
export type PhysicsWork = {
  values: KnownValue[];
  target: string;
  equation: string;
  rearranged: string;
  substituted: string;
  result: number;
  unit: string;
  unitWorking: string;
  direction?: string;
  axis: string;
  context?: string;
  why: string;
  rearrangement?: { equation: string; text: string };
};
export type ConversionWork = {
  value: string;
  from: string;
  to: string;
  base: string;
  fromFactor: number;
  toFactor: number;
  result: number;
  factors?: {
    top: number;
    topUnit: string;
    bottom: number;
    bottomUnit: string;
    why: string;
  }[];
};
export type ConfigurationWork = {
  species: string;
  count: number;
  core?: string;
  coreCount: number;
  shells: { name: string; count: number }[];
};
export type Walkthrough = {
  kind: 'physics' | 'conversion' | 'configuration' | 'lewis' | 'reasoning';
  steps: GuideStep[];
  physics?: PhysicsWork;
  conversion?: ConversionWork;
  configuration?: ConfigurationWork;
  visual?: string;
  example?: string;
};
export const symbols: Record<string, string> = {
  vi: 'vᵢ',
  vf: 'v𝒇',
  Δt: 'Δt',
  Δx: 'Δx',
  a: 'a',
};
const units: Record<string, string> = {
  vi: 'm/s',
  vf: 'm/s',
  Δt: 's',
  Δx: 'm',
  a: 'm/s²',
};
export const conciseNumber = (n: number) =>
  Number(n.toPrecision(4)).toString().replace('-', '−');
const readable = (text: string) =>
  text
    .replace(/vf/g, 'v𝒇')
    .replace(/vi/g, 'vᵢ')
    .replace(/Rearrange for the unknown before substituting\./g, '')
    .trim();

/** Only animate a numerical solution when its inputs and reviewed answer agree.
 * Missing original figures and ambiguous multi-part setups use the paper guide.
 * This consumes reviewed public derivatives, never raw source text.
 */
export function physicsWork(
  q: CompanionQuestion,
  assignment = '',
): PhysicsWork | undefined {
  if (q.input !== 'numeric' || typeof q.answer?.value !== 'number') return;
  const known =
    q.steps.find((s) => s.title === 'Write the known values')?.text ?? '';
  const relationship =
    q.steps.find((s) => s.title === 'Choose the relationship')?.text ?? '';
  const evidence = `${known} ${q.prompt}`;
  const up = /up(?:ward|hill)? (?:is )?positive/i.test(evidence);
  const values: KnownValue[] = [];
  for (const match of known.matchAll(
    /\b(vi|vf|a|g|h)\s*=\s*([−+-]?\d+(?:\.\d+)?)(?![\d.])|(?:Δt|Δx)\s*=\s*([−+-]?\d+(?:\.\d+)?)/g,
  )) {
    const key = match[1] ?? (match[0].startsWith('Δt') ? 'Δt' : 'Δx');
    const symbol = key === 'g' ? 'a' : key === 'h' ? 'Δx' : key;
    const text = match[2] ?? match[3];
    let value = Number(text.replace('−', '-'));
    const tail = known.slice(
      (match.index ?? 0) + match[0].length,
      (match.index ?? 0) + match[0].length + 18,
    );
    if (up && /down/.test(tail)) value = -Math.abs(value);
    if (!up && /down (?:is )?positive/i.test(evidence) && /up/.test(tail))
      value = -Math.abs(value);
    if (!values.some((v) => v.symbol === symbol))
      values.push({
        symbol,
        value,
        text: value < 0 ? '−' + text.replace(/^[−+-]/, '') : text,
        unit: units[symbol],
        source: text.replace(/^[−+-]/, ''),
      });
  }
  const add = (symbol: string, value: number, source: string) => {
    if (!values.some((v) => v.symbol === symbol))
      values.push({
        symbol,
        value,
        text: String(value).replace('-', '−'),
        unit: units[symbol],
        source,
      });
  };
  if (/dropped|starts? from rest|from rest/i.test(evidence))
    add('vi', 0, /dropped/i.test(q.prompt) ? 'dropped' : 'rest');
  if (q.concepts.includes('free-fall') && !values.some((v) => v.symbol === 'a'))
    add('a', up ? -9.8 : 9.8, 'gravity');
  const authored = physicsSetups[assignment]?.[q.id];
  if (authored) {
    values.length = 0;
    for (const [symbol, value] of Object.entries(authored.values)) {
      const token = [...q.prompt.matchAll(/[−-]?\d+(?:\.\d+)?/g)].find(
        (m) => Number(m[0].replace('−', '-')) === Math.abs(value),
      );
      const text = token
        ? `${value < 0 ? '−' : ''}${token[0]}`
        : Number(value.toPrecision(12)).toString().replace('-', '−');
      values.push({
        symbol,
        value,
        text,
        unit:
          authored.velocityUnit && ['vi', 'vf'].includes(symbol)
            ? authored.velocityUnit
            : authored.velocityUnit && symbol === 'Δt'
              ? 'year'
              : units[symbol],
        source:
          token?.[0] ??
          (symbol === 'a' && Math.abs(value) === 9.8
            ? 'gravity'
            : symbol === 'vi' && value === 0
              ? /dropped/i.test(q.prompt)
                ? 'dropped'
                : 'rest'
              : text),
      });
    }
  }
  const target =
    authored?.target ??
    (q.answer.unit === 's'
      ? 'Δt'
      : q.answer.unit === 'm/s²'
        ? 'a'
        : q.answer.unit === 'm'
          ? 'Δx'
          : q.answer.unit === 'm/s'
            ? /Find (?:its |the )?(?:initial|launch|starting)/i.test(q.prompt)
              ? 'vi'
              : 'vf'
            : /acceleration|slope/i.test(q.prompt)
              ? 'a'
              : '');
  if (!target) return;
  const v = Object.fromEntries(values.map((v) => [v.symbol, v.value]));
  const has = (...keys: string[]) =>
    keys.every((key) => Number.isFinite(v[key]));
  let equation = '',
    rearranged = '',
    result = NaN;
  const family =
    authored?.family ??
    (/\(\(vi \+ vf\) \/ 2\)|2Δx \/ (?:\(vi \+ vf\)|Δt(?!²))/.test(relationship)
      ? 'average'
      : /vf²|vi²/.test(relationship)
        ? 'squared'
        : /½|2Δx \/ Δt²|Δx = viΔt.*Δt²/.test(relationship)
          ? 'distance'
          : /vf =|a =|Δt =/.test(relationship)
            ? 'velocity'
            : '');
  if (family === 'average') {
    equation = 'Δx = ((vi + vf) / 2) × Δt';
    if (target === 'Δx' && has('vi', 'vf', 'Δt')) {
      rearranged = equation;
      result = ((v.vi + v.vf) / 2) * v['Δt'];
    }
    if (target === 'Δt' && has('vi', 'vf', 'Δx')) {
      rearranged = 'Δt = 2 × Δx / (vi + vf)';
      result = (2 * v['Δx']) / (v.vi + v.vf);
    }
    if (target === 'vi' && has('vf', 'Δt', 'Δx')) {
      rearranged = 'vi = 2 × Δx / Δt − vf';
      result = (2 * v['Δx']) / v['Δt'] - v.vf;
    }
  } else if (family === 'squared') {
    equation = 'vf² = vi² + 2 × a × Δx';
    if (target === 'Δx' && has('vi', 'vf', 'a')) {
      rearranged = 'Δx = (vf² − vi²) / (2 × a)';
      result = (v.vf ** 2 - v.vi ** 2) / (2 * v.a);
    }
    if (target === 'a' && has('vi', 'vf', 'Δx')) {
      rearranged = 'a = (vf² − vi²) / (2 × Δx)';
      result = (v.vf ** 2 - v.vi ** 2) / (2 * v['Δx']);
    }
    if (target === 'vf' && has('vi', 'a', 'Δx')) {
      rearranged = 'vf = √(vi² + 2 × a × Δx)';
      result = Math.sqrt(v.vi ** 2 + 2 * v.a * v['Δx']);
    }
    if (target === 'vi' && has('vf', 'a', 'Δx')) {
      rearranged = 'vi = √(vf² − 2 × a × Δx)';
      result = Math.sqrt(v.vf ** 2 - 2 * v.a * v['Δx']);
    }
  } else if (family === 'distance') {
    equation = 'Δx = vi × Δt + ½ × a × Δt²';
    if (target === 'Δx' && has('vi', 'a', 'Δt')) {
      rearranged = equation;
      result = v.vi * v['Δt'] + 0.5 * v.a * v['Δt'] ** 2;
    }
    if (target === 'Δt' && has('vi', 'a', 'Δx') && v.vi === 0) {
      rearranged = 'Δt = √(2 × Δx / a)';
      result = Math.sqrt((2 * v['Δx']) / v.a);
    }
    if (target === 'a' && has('vi', 'Δt', 'Δx')) {
      rearranged = 'a = 2 × (Δx − vi × Δt) / Δt²';
      result = (2 * (v['Δx'] - v.vi * v['Δt'])) / v['Δt'] ** 2;
    }
  } else if (family === 'velocity') {
    equation = 'vf = vi + a × Δt';
    if (target === 'vf' && has('vi', 'a', 'Δt')) {
      rearranged = equation;
      result = v.vi + v.a * v['Δt'];
    }
    if (target === 'Δt' && has('vi', 'vf', 'a')) {
      rearranged = 'Δt = (vf − vi) / a';
      result = (v.vf - v.vi) / v.a;
    }
    if (target === 'a' && has('vi', 'vf', 'Δt')) {
      rearranged = 'a = (vf − vi) / Δt';
      result = (v.vf - v.vi) / v['Δt'];
    }
  }
  if (
    !Number.isFinite(result) ||
    Math.abs(Math.abs(result) - Math.abs(q.answer.value)) >
      Math.max(1e-6, Math.abs(q.answer.value) * 0.001)
  )
    return;
  const rhs = rearranged.split(' = ')[1];
  const substituted = rhs.replace(
    /vi|vf|Δt|Δx|a/g,
    (key) => `(${values.find((x) => x.symbol === key)?.text ?? key})`,
  );
  const velocityUnit = authored?.velocityUnit ?? 'm/s';
  const timeUnit = authored?.velocityUnit ? 'year' : 's';
  const unitWorking =
    family === 'velocity'
      ? target === 'a'
        ? `(${velocityUnit}) / ${timeUnit} = ${q.answer.unit}`
        : target === 'Δt'
          ? `(${velocityUnit}) / (m/s²) = ${q.answer.unit}`
          : `m/s + (m/s²) × s = ${q.answer.unit}`
      : family === 'average'
        ? target === 'Δx'
          ? `(m/s) × s = m`
          : target === 'Δt'
            ? `m / (m/s) = s`
            : `m/s − m/s = m/s`
        : family === 'squared'
          ? target === 'Δx'
            ? `(m/s)² / (m/s²) = m`
            : target === 'a'
              ? `(m/s)² / m = m/s²`
              : `√(m²/s²) = m/s`
          : target === 'Δx'
            ? `(m/s) × s + (m/s²) × s² = m`
            : target === 'Δt'
              ? `√(m / (m/s²)) = s`
              : `m / s² = m/s²`;
  return {
    values: values.filter((x) => x.symbol !== target),
    target,
    equation,
    rearranged,
    substituted: `${symbols[target]} = ${substituted}`,
    result,
    unit: q.answer.unit ?? '',
    unitWorking,
    direction: q.answer.directions?.[0],
    context: authored?.context,
    why: equation.includes('((vi')
      ? 'The speed changes evenly. Its average is halfway between the starting and ending speeds. Multiply that average by the elapsed time to get the displacement.'
      : equation.includes('vf²')
        ? 'This connects the two velocities, acceleration and displacement. Time is not in it, so you can solve without knowing how long the motion takes.'
        : equation.includes('½')
          ? 'The first term accounts for the starting velocity. The second adds the effect of accelerating during that time. If it starts from rest, the first term is zero.'
          : 'Acceleration times elapsed time gives the change in velocity. Add that change to the starting velocity to get the ending velocity.',
    rearrangement:
      equation !== rearranged
        ? equation.includes('((vi')
          ? {
              equation: '2 × Δx = (vi + vf) × Δt',
              text: 'Multiply both sides by 2 to remove the denominator. The two sides stay equal.',
            }
          : equation.includes('vf²')
            ? target === 'vf'
              ? undefined
              : target === 'vi'
                ? {
                    equation: 'vf² − 2 × a × Δx = vi²',
                    text: 'Subtract the acceleration–displacement term from both sides. The starting velocity squared is left on the right.',
                  }
                : {
                    equation: 'vf² − vi² = 2 × a × Δx',
                    text: 'Subtract the starting velocity squared from both sides. That leaves the acceleration and displacement term on the right.',
                  }
            : equation.includes('½')
              ? {
                  equation: '2 × Δx = a × Δt²',
                  text: 'With zero starting velocity, the first term is zero. Multiply both sides by 2.',
                }
              : {
                  equation: 'vf − vi = a × Δt',
                  text: 'Subtract the starting velocity from both sides. The difference is the change in velocity.',
                }
        : undefined,
    axis:
      authored?.axis ??
      (up
        ? 'Take up as positive.'
        : /down/.test(evidence)
          ? 'Take down as positive.'
          : 'Take forward as positive.'),
  };
}

export function conversionWork(
  q: CompanionQuestion,
): ConversionWork | undefined {
  if (
    q.prompt === 'Convert one year to seconds using a 365-day year.' &&
    q.answer?.value === 31536000
  )
    return {
      value: '1',
      from: 'year',
      to: 's',
      base: 's',
      fromFactor: 31536000,
      toFactor: 1,
      result: 31536000,
      factors: [
        {
          top: 365,
          topUnit: 'days',
          bottom: 1,
          bottomUnit: 'year',
          why: 'This question specifies a 365-day year. Put year underneath so it cancels.',
        },
        {
          top: 24,
          topUnit: 'hours',
          bottom: 1,
          bottomUnit: 'days',
          why: 'Each day has 24 hours. Put days underneath this factor.',
        },
        {
          top: 60,
          topUnit: 'min',
          bottom: 1,
          bottomUnit: 'hours',
          why: 'Each hour has 60 minutes. Hours now cancel.',
        },
        {
          top: 60,
          topUnit: 's',
          bottom: 1,
          bottomUnit: 'min',
          why: 'Each minute has 60 seconds. This leaves seconds, the unit requested.',
        },
      ],
    };
  const match = q.prompt.match(
    /^Convert ([\d.]+) ([A-Za-zμ/]+) to ([A-Za-zμ/]+)\./,
  );
  if (!match || typeof q.answer?.value !== 'number') return;
  const prefixes: Record<string, number> = {
    M: 1e6,
    k: 1e3,
    h: 1e2,
    d: 1e-1,
    c: 1e-2,
    m: 1e-3,
    μ: 1e-6,
    n: 1e-9,
  };
  const parse = (unit: string) =>
    unit.length > 1 && prefixes[unit[0]] !== undefined
      ? { base: unit.slice(1), factor: prefixes[unit[0]] }
      : { base: unit, factor: 1 };
  if (match[2].includes('/') && match[3].includes('/')) {
    const [fn, fd] = match[2].split('/'),
      [tn, td] = match[3].split('/');
    const n1 = parse(fn),
      d1 = parse(fd),
      n2 = parse(tn),
      d2 = parse(td);
    if (n1.base !== n2.base || d1.base !== d2.base) return;
    const f1 = n1.factor / n2.factor,
      f2 = d2.factor / d1.factor;
    const result = Number(match[1]) * f1 * f2;
    if (
      Math.abs(result - q.answer.value) >
      Math.max(1e-10, Math.abs(result) * 1e-8)
    )
      return;
    return {
      value: match[1],
      from: match[2],
      to: match[3],
      base: '',
      fromFactor: f1,
      toFactor: 1 / f2,
      result,
      factors: [
        {
          top: f1 >= 1 ? Number(f1.toPrecision(10)) : 1,
          topUnit: tn,
          bottom: f1 >= 1 ? 1 : Number((1 / f1).toPrecision(10)),
          bottomUnit: fn,
          why: `Convert ${fn} on top to ${tn}. Put ${fn} underneath the factor to cancel the original unit.`,
        },
        {
          top: f2 >= 1 ? Number(f2.toPrecision(10)) : 1,
          topUnit: fd,
          bottom: f2 >= 1 ? 1 : Number((1 / f2).toPrecision(10)),
          bottomUnit: td,
          why: `The original ${fd} is underneath. Put ${fd} on top of this factor so it cancels. Leave ${td} underneath.`,
        },
      ],
    };
  }
  const from = parse(match[2]),
    to = parse(match[3]);
  const result = (Number(match[1]) * from.factor) / to.factor;
  if (
    from.base !== to.base ||
    Math.abs(result - q.answer.value) > Math.max(1e-10, Math.abs(result) * 1e-8)
  )
    return;
  return {
    value: match[1],
    from: match[2],
    to: match[3],
    base: from.base,
    fromFactor: from.factor,
    toFactor: to.factor,
    result,
  };
}

export function configurationWork(
  q: CompanionQuestion,
): ConfigurationWork | undefined {
  const species = q.prompt.match(
    /(?:full|core) electron configuration of ([A-Z][a-z]?)\./,
  )?.[1];
  const count = Number(q.checklist?.[0]?.match(/for (\d+) electrons/)?.[1]);
  if (!species || !count) return;
  const order: [string, number][] = [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
    ['3s', 2],
    ['3p', 6],
    ['4s', 2],
    ['3d', 10],
    ['4p', 6],
    ['5s', 2],
    ['4d', 10],
    ['5p', 6],
    ['6s', 2],
    ['4f', 14],
    ['5d', 10],
    ['6p', 6],
  ];
  let remaining = count;
  const shells = order
    .map(([name, capacity]) => {
      const occupied = Math.min(remaining, capacity);
      remaining -= occupied;
      return { name, count: occupied };
    })
    .filter((s) => s.count);
  if (remaining) return;
  const noble: [string, number][] = [
    ['He', 2],
    ['Ne', 10],
    ['Ar', 18],
    ['Kr', 36],
    ['Xe', 54],
  ];
  const core = /core electron/.test(q.prompt)
    ? noble.filter(([, n]) => n < count).at(-1)
    : undefined;
  return { species, count, shells, core: core?.[0], coreCount: core?.[1] ?? 0 };
}

export function makeWalkthrough(
  a: Assignment,
  q: CompanionQuestion,
): Walkthrough {
  if (a.assistance === 'independent-only')
    throw new Error('Independent work has no walkthrough');
  const written = writtenGuides[a.id]?.[q.id];
  if (written)
    return {
      kind: 'reasoning',
      steps: [
        {
          title: 'Read the question',
          text: q.asking,
          phase: 'read',
          write: 'Keep the matching question on your paper beside you.',
        },
        ...written.map((s, i) => ({ ...s, phase: `point-${i}` })),
        {
          title: 'Finish the working on your paper',
          text: 'Check the setup, the requested unit and the final precision. Include direction words when the answer is a vector.',
          phase: 'finish',
          write: 'Write the result and its reasoning on the assignment.',
        },
      ],
    };
  const physics = a.course === 'physics' ? physicsWork(q, a.id) : undefined;
  if (physics) {
    const steps: GuideStep[] = [
      {
        title: 'Read the question',
        text: q.asking,
        phase: 'read',
        write: 'Read the question once. Leave room for the working underneath.',
      },
    ];
    const clue = q.clues.find((c) =>
      q.prompt.toLowerCase().includes(c.word.toLowerCase()),
    );
    if (clue)
      steps.push({
        title: `Notice “${clue.word}”`,
        text:
          clue.word === 'dropped'
            ? 'Dropped means it starts from rest. Its initial velocity is 0 m/s.'
            : clue.explanation,
        phase: 'clue',
        focus: clue.word,
        write: `Underline “${clue.word}” on your question.`,
      });
    steps.push({
      title: 'Choose a direction',
      text: `${physics.axis} Keep that choice through the calculation. A minus sign then means the opposite direction.`,
      phase: 'axis',
      write: physics.axis,
    });
    if (physics.context)
      steps.push({
        title: 'Bring in the related information',
        text: physics.context,
        phase: 'context',
        write: physics.context,
      });
    for (const value of physics.values)
      steps.push({
        title: `Write ${symbols[value.symbol]}`,
        text:
          value.source === 'gravity'
            ? 'Near Earth, the free-fall model uses 9.8 m/s² downward. Use the sign that fits your chosen direction.'
            : value.source === 'dropped' || value.source === 'rest'
              ? 'It starts from rest, so the starting velocity is zero.'
              : value.symbol === 'vf' && value.value === 0
                ? q.concepts.includes('free-fall')
                  ? 'At the highest point, the vertical velocity is zero for one instant. Gravity still acts downward.'
                  : 'It comes to rest, so the ending velocity is zero.'
                : `This is the ${value.symbol === 'vi' ? 'starting velocity' : value.symbol === 'vf' ? 'ending velocity' : value.symbol === 'Δt' ? 'elapsed time' : value.symbol === 'a' ? 'acceleration' : 'displacement'} ${physics.context && !q.prompt.includes(value.source) ? 'from the related information above' : 'from the question'}. Keep its unit with the number.`,
        phase: 'known',
        focus: value.source,
        write: `${symbols[value.symbol]} = ${value.text} ${value.unit}`,
      });
    steps.push({
      title: 'Name what you need',
      text: q.asking,
      phase: 'unknown',
      focus: [
        ...q.prompt.matchAll(
          physics.target === 'Δt'
            ? /how long|time|how many seconds/gi
            : physics.target === 'Δx'
              ? /how far|how high|displacement|distance|height/gi
              : physics.target === 'a'
                ? /acceleration/gi
                : physics.target === 'vi'
                  ? /initial velocity|launch velocity|starting velocity|initial speed|launch speed|starting speed/gi
                  : /final velocity|final speed|velocity|speed/gi,
        ),
      ].at(-1)?.[0],
      write: `${symbols[physics.target]} = ?`,
    });
    steps.push({
      title: 'Choose the equation',
      text: physics.why,
      phase: 'formula',
      equation: readable(physics.equation),
      write: readable(physics.equation),
    });
    if (
      physics.rearrangement &&
      (!physics.equation.includes('½') ||
        physics.values.find((v) => v.symbol === 'vi')?.value === 0)
    )
      steps.push({
        title: 'Keep the two sides equal',
        text: physics.rearrangement.text,
        phase: 'balance',
        equation: readable(physics.rearrangement.equation),
        write: readable(physics.rearrangement.equation),
      });
    if (physics.equation !== physics.rearranged)
      steps.push({
        title: 'Put the unknown on its own',
        text: physics.rearranged.includes('√')
          ? 'Undo the square with a square root. Here the physical situation selects the positive time or speed.'
          : 'Undo the operations around the unknown. Do the same operation on both sides so the equation stays equal.',
        phase: 'rearrange',
        equation: readable(physics.rearranged),
        write: readable(physics.rearranged),
      });
    steps.push({
      title: 'Put each value in its place',
      text: 'Each number takes the place of its matching symbol. The values come from the list you just wrote.',
      phase: 'substitute',
      equation: readable(physics.substituted),
      write: readable(physics.substituted),
    });
    steps.push({
      title: 'Check what the units give',
      text: `The equation must leave ${physics.unit}, the unit for the quantity you need. Check the units before using the calculator.`,
      phase: 'units',
      equation: readable(physics.substituted),
      write: `The units on the right should simplify to ${physics.unit}.`,
    });
    steps.push({
      title: 'Calculate, then finish the line',
      text: physics.direction
        ? `Keep extra digits until the last line. Write the unit and the direction in words: ${physics.direction}. A minus sign by itself is incomplete.`
        : 'Calculate the expression. Keep extra digits until the last line, then use the precision requested on your assignment.',
      phase: 'finish',
      equation: `${symbols[physics.target]} ≈ ${conciseNumber(physics.result)} ${physics.unit}`,
      write: `${symbols[physics.target]} ≈ ${conciseNumber(physics.result)} ${physics.unit}${physics.direction ? ` (${physics.direction})` : ''}`,
    });
    return { kind: 'physics', physics, steps };
  }
  const conversion = a.course === 'chemistry' ? conversionWork(q) : undefined;
  if (conversion?.factors)
    return {
      kind: 'conversion',
      conversion,
      steps: [
        {
          title: 'Start with the given amount',
          text: `You have ${conversion.value} ${conversion.from}. You need it in ${conversion.to}. Keep each unit attached to its number.`,
          phase: 'read',
          write: `${conversion.value} ${conversion.from}`,
        },
        ...conversion.factors.map((f, i): GuideStep => ({
          title: `Place conversion factor ${i + 1}`,
          text: f.why,
          phase: `factor-${i}`,
          write: `× (${f.top} ${f.topUnit} / ${f.bottom} ${f.bottomUnit})`,
        })),
        {
          title: 'Cancel matching units',
          text: 'A matching unit on top and underneath divides to 1. Follow the cancellations. Only the requested unit should remain.',
          phase: 'cancel',
          write: `The remaining unit is ${conversion.to}.`,
        },
        {
          title: 'Calculate the remaining numbers',
          text: 'Multiply across the top and divide by the bottom. Keep extra digits until the final line.',
          phase: 'finish',
          write: `${conciseNumber(conversion.result)} ${conversion.to}. Match the precision on your paper.`,
        },
      ],
    };
  if (conversion)
    return {
      kind: 'conversion',
      conversion,
      steps: [
        {
          title: 'Read the units',
          text: `Start with ${conversion.value} ${conversion.from}. You want the same amount written in ${conversion.to}.`,
          phase: 'read',
          focus: `${conversion.value} ${conversion.from}`,
          write: `${conversion.value} ${conversion.from}`,
        },
        {
          title: 'Connect to the base unit',
          text: `One ${conversion.from} is ${conversion.fromFactor} ${conversion.base}. Put ${conversion.from} underneath so the old unit cancels.`,
          phase: 'factor-one',
          write: `× (${conversion.fromFactor} ${conversion.base} / 1 ${conversion.from})`,
        },
        {
          title: 'Leave the requested unit on top',
          text: `One ${conversion.to} is ${conversion.toFactor} ${conversion.base}. Put ${conversion.base} underneath this time.`,
          phase: 'factor-two',
          write: `× (1 ${conversion.to} / ${conversion.toFactor} ${conversion.base})`,
        },
        {
          title: 'Cancel matching units',
          text: `The same unit on top and underneath divides to 1. Cross out ${conversion.from}, then ${conversion.base}. Only ${conversion.to} remains.`,
          phase: 'cancel',
          write: `Check that only ${conversion.to} remains.`,
        },
        {
          title: 'Calculate the remaining numbers',
          text: 'Multiply across the top and divide by the bottom. The factors change the number, while keeping the amount the same.',
          phase: 'finish',
          write: `${conciseNumber(conversion.result)} ${conversion.to}. Use the precision requested on your paper.`,
        },
      ],
    };
  const configuration =
    a.course === 'chemistry' ? configurationWork(q) : undefined;
  if (configuration)
    return {
      kind: 'configuration',
      configuration,
      steps: [
        {
          title: 'Count the electrons',
          text: `${configuration.species} is neutral here. Its atomic number gives ${configuration.count} electrons. Each one needs a place.`,
          phase: 'read',
          focus: configuration.species,
          write: `${configuration.count} electrons`,
        },
        ...configuration.shells.map((s, i): GuideStep => ({
          title: `Fill ${s.name}`,
          text: `${s.name} holds ${s.name.endsWith('s') ? 2 : s.name.endsWith('p') ? 6 : s.name.endsWith('d') ? 10 : 14} electrons at most. Put ${s.count} here. The superscript counts electrons; the first number names the shell.`,
          phase: `shell-${i}`,
          write: `${s.name}${superscript(s.count)}`,
        })),
        ...(configuration.core
          ? [
              {
                title: 'Replace the filled inner part',
                text: `[${configuration.core}] stands for ${configuration.coreCount} inner electrons. It is the noble gas before ${configuration.species}, not the same element. Keep the rest of the configuration.`,
                phase: 'core',
                write: `Replace the first ${configuration.coreCount} electrons with [${configuration.core}].`,
              },
            ]
          : []),
        {
          title: 'Check the total',
          text: `Add the superscripts${configuration.core ? ` and the ${configuration.coreCount} electrons in the core` : ''}. The total must be ${configuration.count}.`,
          phase: 'finish',
          write: 'Copy the complete configuration onto your assignment.',
        },
      ],
    };
  if (a.course === 'chemistry' && q.concepts.includes('lewis-structures'))
    return {
      kind: 'lewis',
      example: 'Worked example · H₂O',
      steps: [
        {
          title: 'Use the method on your molecules',
          text: `${q.asking} We’ll build water to show the method. Keep the exact molecules and connections from #${q.number} on your paper.`,
          phase: 'read',
          write: 'Choose the next molecule on your assignment.',
        },
        {
          title: 'Count what each atom brings',
          text: 'Oxygen brings 6 valence electrons. Each hydrogen brings 1. That makes 6 + 1 + 1 = 8 electrons to use.',
          phase: 'count',
          write:
            'Add the valence electrons. Adjust for any charge shown on your molecule.',
        },
        {
          title: 'Connect the atoms',
          text: 'Put oxygen between the two hydrogens. Each bond uses a pair of electrons. Watch two pairs move into the bonds.',
          phase: 'bonds',
          write:
            'Connect your atoms. Subtract 2 electrons for every single bond.',
        },
        {
          title: 'Place the electrons left over',
          text: 'The two bonds used 4 electrons. The other 4 form two lone pairs on oxygen. No electrons were added.',
          phase: 'pairs',
          write:
            'Finish the outer atoms, then place the remaining pairs on the central atom.',
        },
        {
          title: 'Check the structure',
          text: 'Each hydrogen shares 2 electrons. Oxygen counts 8 around it, including the two bonds. The whole structure still uses only 8 electrons.',
          phase: 'finish',
          write:
            'Audit your total and the electrons around each atom. Use multiple bonds or the stated exceptions when your molecule needs them.',
        },
      ],
    };
  const visual = q.concepts.find((id) =>
    [
      'cladograms',
      'half-life',
      'relative-dating',
      'endosymbiosis',
      'classification',
      'motion-graphs',
      'vsepr',
      'electron-groups',
      'periodic-trends',
      'electronegativity',
      'bond-types',
      'valence-electrons',
      'atomic-identity',
    ].includes(id),
  );
  const check = q.checklist?.length
    ? q.checklist
    : [
        'Use the original figure or measurements beside you.',
        'Show why the evidence supports your answer.',
      ];
  return {
    kind: 'reasoning',
    visual,
    example:
      visual === 'motion-graphs'
        ? /position|displacement|distance/i.test(q.prompt + q.hints[0])
          ? 'Position–time example'
          : 'Velocity–time example'
        : undefined,
    steps: [
      {
        title: 'What the question asks',
        text: q.asking,
        phase: 'read',
        focus: q.prompt.match(
          /^(Explain|Describe|Compare|Draw|Name|Identify|Construct|Count|Write|Calculate|Sketch)/,
        )?.[0],
        write: 'Read the matching question on your paper.',
      },
      {
        title:
          a.course === 'life-sciences'
            ? 'Find the evidence'
            : 'Choose your starting point',
        text: q.hints[0],
        phase: 'evidence',
        write: /video|watch|timestamp/i.test(q.hints[0] + q.prompt)
          ? 'Find the original video segment. Note what you actually observe.'
          : 'Mark the relevant part of your notes, diagram or question.',
      },
      ...q.steps
        .filter((s) =>
          ['Write the known values', 'Choose the relationship'].includes(
            s.title,
          ),
        )
        .map((s, i): GuideStep => ({
          title:
            s.title === 'Write the known values'
              ? 'Write what you know'
              : 'Connect the quantities',
          text: readable(s.text),
          phase: `point-setup-${i}`,
          write: readable(s.text),
        })),
      ...check.map((item, i): GuideStep => ({
        title:
          check.length === 1
            ? 'Build the answer'
            : `Build the answer · ${i + 1}`,
        text: item,
        phase: `point-${i}`,
        write: `On your paper: ${item}`,
      })),
      {
        title: 'Put it together on your paper',
        text: q.answer
          ? readable(q.answer.reasoning)
          : 'Read your response against the question. Include the explanation or evidence it asks for, using your own words.',
        phase: 'finish',
        write: q.answer
          ? `${q.answer.value}${q.answer.unit ? ` ${q.answer.unit}` : ''}. Include the reasoning you just worked through.`
          : 'Finish your response on the assignment. Then mark this question done.',
      },
    ],
  };
}

export function superscript(n: number) {
  return String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
}
