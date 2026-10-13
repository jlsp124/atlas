import type { CompanionQuestion } from '../core/schema';

export type LewisAtom = {
  element: string;
  x: number;
  y: number;
  pairs: number;
};
export type LewisBond = [from: number, to: number, order: number];
export type LewisModel = {
  part: string;
  title: string;
  atoms: LewisAtom[];
  bonds: LewisBond[];
  charge: number;
  note?: string;
  alternative?: { atoms: LewisAtom[]; bonds: LewisBond[] };
  promptOnly?: string;
};
export const valence: Record<string, number> = {
  H: 1,
  B: 3,
  Be: 2,
  C: 4,
  N: 5,
  O: 6,
  F: 7,
  S: 6,
  Cl: 7,
  Se: 6,
  Br: 7,
  I: 7,
};
const atom = (element: string, x: number, y: number, pairs = 0): LewisAtom => ({
  element,
  x,
  y,
  pairs,
});
const bond = (a: number, b: number, n = 1): LewisBond => [a, b, n];
const model = (
  part: string,
  title: string,
  atoms: LewisAtom[],
  bonds: LewisBond[],
  extra: Partial<LewisModel> = {},
): LewisModel => ({ part, title, atoms, bonds, charge: 0, ...extra });
const diatomic = (
  part: string,
  a: string,
  b: string,
  order: number,
  pairsA: number,
  pairsB: number,
) =>
  model(
    part,
    a + (a === b ? '₂' : b),
    [atom(a, 155, 140, pairsA), atom(b, 285, 140, pairsB)],
    [bond(0, 1, order)],
  );
const hydrocarbon = (
  part: string,
  title: string,
  carbonCount: number,
  orders: number[],
  hydrogenCounts: number[],
) => {
  const spacing = carbonCount === 2 ? 135 : 95;
  const atoms = Array.from({ length: carbonCount }, (_, i) =>
    atom('C', 110 + i * spacing, 140),
  );
  const bonds = orders.map((order, i) => bond(i, i + 1, order));
  for (let c = 0; c < carbonCount; c++) {
    const offsets =
      hydrogenCounts[c] === 3
        ? [
            [0, -80],
            [0, 80],
            [c === 0 ? -80 : 80, 0],
          ]
        : hydrogenCounts[c] === 2
          ? [
              [0, -80],
              [0, 80],
            ]
          : hydrogenCounts[c] === 1
            ? [[0, -80]]
            : [];
    for (const [dx, dy] of offsets) {
      bonds.push(bond(c, atoms.length));
      atoms.push(atom('H', atoms[c].x + dx, atoms[c].y + dy));
    }
  }
  return model(part, title, atoms, bonds);
};
export const lewisModels: LewisModel[] = [
  diatomic('a', 'H', 'Cl', 1, 0, 3),
  diatomic('b', 'I', 'I', 1, 3, 3),
  diatomic('c', 'I', 'Cl', 1, 3, 3),
  hydrocarbon('d', 'C₂H₆ · ethane', 2, [1], [3, 3]),
  hydrocarbon('e', 'C₂H₄ · ethene', 2, [2], [2, 2]),
  model(
    'f',
    'C₂H₂ · H–C–C–H',
    [
      atom('H', 55, 140),
      atom('C', 160, 140),
      atom('C', 280, 140),
      atom('H', 385, 140),
    ],
    [bond(0, 1), bond(1, 2, 3), bond(2, 3)],
  ),
  model(
    'g',
    'BeF₂',
    [atom('F', 80, 140, 3), atom('Be', 220, 140), atom('F', 360, 140, 3)],
    [bond(0, 1), bond(1, 2)],
    {
      note: 'Be is a taught octet exception. Its two bonds give it four surrounding electrons; forcing an octet would change this model.',
    },
  ),
  diatomic('h', 'O', 'O', 2, 2, 2),
  model(
    'i',
    'SCl₂',
    [atom('Cl', 80, 140, 3), atom('S', 220, 140, 2), atom('Cl', 360, 140, 3)],
    [bond(0, 1), bond(1, 2)],
  ),
  diatomic('j', 'N', 'N', 3, 1, 1),
  model(
    'k',
    'CH₂O',
    [
      atom('C', 170, 140),
      atom('O', 310, 140, 2),
      atom('H', 170, 55),
      atom('H', 70, 140),
    ],
    [bond(0, 1, 2), bond(0, 2), bond(0, 3)],
  ),
  hydrocarbon('l', 'C₄H₄ · H₂C–C–C–CH₂', 4, [2, 2, 2], [2, 0, 0, 2]),
  model(
    'm',
    'HCN',
    [atom('H', 80, 140), atom('C', 220, 140), atom('N', 360, 140, 1)],
    [bond(0, 1), bond(1, 2, 3)],
  ),
  model(
    'n',
    'BH₃',
    [
      atom('B', 220, 140),
      atom('H', 80, 140),
      atom('H', 360, 140),
      atom('H', 220, 55),
    ],
    [bond(0, 1), bond(0, 2), bond(0, 3)],
    {
      note: 'B is a taught deficient-octet example: three bonds give it six surrounding electrons.',
    },
  ),
  model(
    'o',
    'H–C(S)–Cl',
    [
      atom('C', 220, 140),
      atom('S', 220, 55, 2),
      atom('H', 80, 140),
      atom('Cl', 360, 140, 3),
    ],
    [bond(0, 1, 2), bond(0, 2), bond(0, 3)],
  ),
  model(
    'p',
    'NO₂⁻',
    [atom('O', 80, 140, 2), atom('N', 220, 140, 1), atom('O', 360, 140, 3)],
    [bond(0, 1, 2), bond(1, 2)],
    {
      charge: -1,
      note: 'One resonance contributor is shown. Swap the double bond and the corresponding oxygen lone pair; the atoms stay connected in the same order.',
      alternative: {
        atoms: [
          atom('O', 80, 140, 3),
          atom('N', 220, 140, 1),
          atom('O', 360, 140, 2),
        ],
        bonds: [bond(0, 1), bond(1, 2, 2)],
      },
    },
  ),
  model(
    'q',
    'NO⁺',
    [atom('N', 155, 140, 1), atom('O', 285, 140, 1)],
    [bond(0, 1, 3)],
    { charge: 1 },
  ),
  model(
    'r',
    'H–O–N–C skeleton',
    [
      atom('H', 55, 140),
      atom('O', 160, 140),
      atom('N', 280, 140),
      atom('C', 385, 140),
    ],
    [bond(0, 1), bond(1, 2), bond(2, 3)],
    {
      promptOnly:
        'Keep the unusual H–O–N–C connection order printed in part r. Count 16 valence electrons, then compare possible bond orders using octets and formal charges. Do not silently replace it with a more familiar atom order.',
    },
  ),
  model(
    's',
    'NH₂⁻',
    [atom('H', 80, 140), atom('N', 220, 140, 2), atom('H', 360, 140)],
    [bond(0, 1), bond(1, 2)],
    { charge: -1 },
  ),
  model(
    't',
    'SO₂',
    [atom('O', 80, 140, 2), atom('S', 220, 140, 1), atom('O', 360, 140, 2)],
    [bond(0, 1, 2), bond(1, 2, 2)],
    {
      note: 'The middle atom on the source is sulfur. This expanded-octet representation uses all 18 electrons and gives zero formal charges. Sulfur has ten surrounding electrons, an exception allowed in the class notes.',
    },
  ),
  model(
    'u',
    'Cl–S–S–Cl',
    [
      atom('Cl', 55, 140, 3),
      atom('S', 160, 140, 2),
      atom('S', 280, 140, 2),
      atom('Cl', 385, 140, 3),
    ],
    [bond(0, 1), bond(1, 2), bond(2, 3)],
  ),
  model(
    'v',
    'N₂H₄',
    [
      atom('N', 155, 140, 1),
      atom('N', 285, 140, 1),
      atom('H', 155, 55),
      atom('H', 155, 225),
      atom('H', 285, 55),
      atom('H', 285, 225),
    ],
    [bond(0, 1), bond(0, 2), bond(0, 3), bond(1, 4), bond(1, 5)],
  ),
  model(
    'w',
    'SF₆',
    [
      atom('S', 220, 140),
      atom('F', 220, 40, 3),
      atom('F', 350, 85, 3),
      atom('F', 350, 195, 3),
      atom('F', 220, 240, 3),
      atom('F', 90, 195, 3),
      atom('F', 90, 85, 3),
    ],
    [bond(0, 1), bond(0, 2), bond(0, 3), bond(0, 4), bond(0, 5), bond(0, 6)],
    {
      note: 'Sulfur is a taught expanded-octet case. Count all 48 electrons; the six bonds place 12 around sulfur.',
    },
  ),
  model(
    'x',
    '[C–N–O]⁻ skeleton',
    [atom('C', 80, 140), atom('N', 220, 140), atom('O', 360, 140)],
    [bond(0, 1), bond(1, 2)],
    {
      charge: -1,
      promptOnly:
        'The printed skeleton is C–N–O with overall −1 charge. Count 16 electrons and keep that order. Compare formal charges explicitly instead of substituting the more familiar N–C–O cyanate connection.',
    },
  ),
  model(
    'y',
    'NO₃⁻',
    [
      atom('N', 220, 140),
      atom('O', 90, 140, 2),
      atom('O', 350, 140, 3),
      atom('O', 220, 240, 3),
    ],
    [bond(0, 1, 2), bond(0, 2), bond(0, 3)],
    {
      charge: -1,
      note: 'This is one of three equivalent resonance contributors. N has formal charge +1 and two singly bonded O atoms have −1 each, giving the overall −1.',
      alternative: {
        atoms: [
          atom('N', 220, 140),
          atom('O', 90, 140, 3),
          atom('O', 350, 140, 2),
          atom('O', 220, 240, 3),
        ],
        bonds: [bond(0, 1), bond(0, 2, 2), bond(0, 3)],
      },
    },
  ),
  model(
    'z',
    'C₄H₄ ring',
    [
      atom('C', 155, 85),
      atom('C', 285, 85),
      atom('C', 285, 215),
      atom('C', 155, 215),
      atom('H', 55, 85),
      atom('H', 385, 85),
      atom('H', 385, 215),
      atom('H', 55, 215),
    ],
    [
      bond(0, 1, 2),
      bond(1, 2),
      bond(2, 3, 2),
      bond(3, 0),
      bond(0, 4),
      bond(1, 5),
      bond(2, 6),
      bond(3, 7),
    ],
    {
      note: 'Keep the four-carbon ring and one H on each carbon shown in the source. Alternating single and double bonds meet the electron-count and octet rules. This diagram does not make a claim about molecular stability.',
    },
  ),
  model(
    'aa',
    'Neutral NO₃ skeleton',
    [
      atom('O', 80, 140),
      atom('N', 220, 140),
      atom('O', 360, 140),
      atom('O', 220, 230),
    ],
    [bond(0, 1), bond(1, 2), bond(1, 3)],
    {
      promptOnly:
        'The photo shows O–N–O with a third O attached to N and no printed charge. That gives 23 valence electrons, an odd total. Keep the neutral source skeleton and ask how the course treats the unpaired electron; do not silently add a negative charge to turn this into part y.',
    },
  ),
  model(
    'bb',
    'CH₃COOH',
    [
      atom('C', 110, 140),
      atom('C', 240, 140),
      atom('O', 240, 230, 2),
      atom('O', 350, 140, 2),
      atom('H', 415, 140),
      atom('H', 110, 45),
      atom('H', 110, 230),
      atom('H', 30, 140),
    ],
    [
      bond(0, 1),
      bond(1, 2, 2),
      bond(1, 3),
      bond(3, 4),
      bond(0, 5),
      bond(0, 6),
      bond(0, 7),
    ],
  ),
  model(
    'cc',
    'SeBr₄',
    [
      atom('Se', 220, 140, 1),
      atom('Br', 90, 90, 3),
      atom('Br', 350, 90, 3),
      atom('Br', 90, 210, 3),
      atom('Br', 350, 210, 3),
    ],
    [bond(0, 1), bond(0, 2), bond(0, 3), bond(0, 4)],
    {
      note: 'Se is an expanded-octet case here: four bond pairs and one lone pair place ten electrons around it. This flat drawing shows connectivity, not the three-dimensional shape.',
    },
  ),
];
export function lewisBudget(m: LewisModel) {
  return m.atoms.reduce((n, a) => n + valence[a.element], 0) - m.charge;
}
export function lewisUsed(m: LewisModel) {
  return (
    m.bonds.reduce((n, b) => n + b[2] * 2, 0) +
    m.atoms.reduce((n, a) => n + a.pairs * 2, 0)
  );
}
export function formalCharges(m: LewisModel) {
  return m.atoms.map(
    (a, i) =>
      valence[a.element] -
      a.pairs * 2 -
      m.bonds
        .filter((b) => b[0] === i || b[1] === i)
        .reduce((n, b) => n + b[2], 0),
  );
}
export const recoveredLewisQuestions: CompanionQuestion[] = lewisModels.map(
  (m) => ({
    id: `q-86${m.part}`,
    number: `86${m.part}`,
    section: 'p.188 · #86',
    prompt: `Assign a Lewis structure to ${m.title}, keeping the connections printed in the textbook.`,
    asking:
      'Count valence electrons, allocate pairs to bonds and lone pairs, then check the total and any charge.',
    concepts: ['lewis-structures'],
    input: 'text',
    clues: [],
    steps: [
      {
        title: 'Count the electron budget',
        text: `The atoms and overall charge give ${lewisBudget(m)} valence electrons.`,
      },
      {
        title: 'Keep the source connections',
        text:
          m.promptOnly ??
          'Start with single bonds. If an ordinary C/N/O atom lacks an octet, move an existing lone pair into another shared pair; do not add electrons.',
      },
    ],
    hints: [
      m.promptOnly ??
        `Use ${lewisBudget(m)} electrons in total. Check hydrogen’s duet and the appropriate octets or stated exceptions.`,
      m.note ?? 'Audit formal charges as well as the electron total.',
    ],
    example:
      m.note ??
      'Bond pairs belong to both atoms for octet counting but are counted once in the whole-molecule budget.',
    repair: {
      prompt: 'Does making a double bond add new electrons?',
      choices: ['No; an existing pair becomes shared', 'Yes; add another pair'],
      answer: 'No; an existing pair becomes shared',
      explanation: 'The total electron budget stays fixed.',
    },
    checklist: [
      'The printed atom connections.',
      `${lewisBudget(m)} electrons, including the ion’s charge.`,
      'Lone pairs, bond orders and the overall/formal charges.',
    ],
  }),
);
