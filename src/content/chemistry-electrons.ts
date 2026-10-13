import type { CompanionQuestion } from '../core/schema';
export type IonConfiguration = {
  part: string;
  species: string;
  atomicNumber: number;
  charge: number;
  core: string;
  coreCount: number;
  neutral: [string, number][];
  ion: [string, number][];
  reason: string;
  reference?: string;
};
export const ionConfigurations: IonConfiguration[] = [
  {
    part: 'a',
    species: 'H⁻',
    atomicNumber: 1,
    charge: -1,
    core: '',
    coreCount: 0,
    neutral: [['1s', 1]],
    ion: [['1s', 2]],
    reason:
      'Add one electron to the existing 1s orbital. Hydrogen has no preceding noble-gas core; write 1s².',
  },
  {
    part: 'b',
    species: 'Sr²⁺',
    atomicNumber: 38,
    charge: 2,
    core: 'Kr',
    coreCount: 36,
    neutral: [['5s', 2]],
    ion: [],
    reason:
      'The two outer 5s electrons leave first. All remaining electrons are represented by [Kr].',
  },
  {
    part: 'c',
    species: 'Br⁻',
    atomicNumber: 35,
    charge: -1,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 10],
      ['4p', 5],
    ],
    ion: [
      ['4s', 2],
      ['3d', 10],
      ['4p', 6],
    ],
    reason:
      'Add the extra electron to the last unfilled 4p subshell. Keep the preceding core used for bromine and complete 4p⁶.',
  },
  {
    part: 'd',
    species: 'N³⁺',
    atomicNumber: 7,
    charge: 3,
    core: 'He',
    coreCount: 2,
    neutral: [
      ['2s', 2],
      ['2p', 3],
    ],
    ion: [['2s', 2]],
    reason:
      'The source is N³⁺, not nickel. Remove the three 2p electrons before 2s because both subshells have n=2 and p has higher energy.',
  },
  {
    part: 'e',
    species: 'Ti²⁺',
    atomicNumber: 22,
    charge: 2,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 2],
    ],
    ion: [['3d', 2]],
    reason:
      'Remove the 4s pair before the 3d electrons. 4s has the higher principal shell number, even though it filled first.',
  },
  {
    part: 'f',
    species: 'N²⁻',
    atomicNumber: 7,
    charge: -2,
    core: 'He',
    coreCount: 2,
    neutral: [
      ['2s', 2],
      ['2p', 3],
    ],
    ion: [
      ['2s', 2],
      ['2p', 5],
    ],
    reason:
      'Add two electrons to nitrogen’s unfilled 2p subshell. The charge is −2, so the ion contains nine electrons.',
  },
  {
    part: 'g',
    species: 'Mn²⁺',
    atomicNumber: 25,
    charge: 2,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 5],
    ],
    ion: [['3d', 5]],
    reason: 'Remove both 4s electrons. The inner 3d⁵ subshell remains.',
  },
  {
    part: 'h',
    species: 'Ge⁴⁺',
    atomicNumber: 32,
    charge: 4,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 10],
      ['4p', 2],
    ],
    ion: [['3d', 10]],
    reason:
      'Remove two 4p electrons first, then two 4s electrons. Those four electrons have n=4; the n=3 d electrons remain.',
  },
  {
    part: 'i',
    species: 'Fe³⁺',
    atomicNumber: 26,
    charge: 3,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 6],
    ],
    ion: [['3d', 5]],
    reason:
      'First remove the two 4s electrons. A third electron must leave, so remove one from 3d. Stopping at [Ar]3d⁶ would describe Fe²⁺.',
  },
  {
    part: 'j',
    species: 'Ge²⁺',
    atomicNumber: 32,
    charge: 2,
    core: 'Ar',
    coreCount: 18,
    neutral: [
      ['4s', 2],
      ['3d', 10],
      ['4p', 2],
    ],
    ion: [
      ['4s', 2],
      ['3d', 10],
    ],
    reason:
      'Remove only the two 4p electrons. The charge needs two electrons removed, so do not also remove the 4s pair.',
  },
  {
    part: 'k',
    species: 'Ru³⁺',
    atomicNumber: 44,
    charge: 3,
    core: 'Kr',
    coreCount: 36,
    neutral: [
      ['5s', 1],
      ['4d', 7],
    ],
    ion: [['4d', 5]],
    reason:
      'Neutral Ru has the measured configuration [Kr]5s¹4d⁷, an exception beyond the class’s Cr/Cu pair. Remove the 5s electron, then two 4d electrons. Both the actual configuration and the simple filling prediction lead to [Kr]4d⁵ here.',
    reference:
      'https://physics.nist.gov/PhysRefData/Handbook/Tables/rutheniumtable1.htm',
  },
  {
    part: 'l',
    species: 'Sb³⁺',
    atomicNumber: 51,
    charge: 3,
    core: 'Kr',
    coreCount: 36,
    neutral: [
      ['5s', 2],
      ['4d', 10],
      ['5p', 3],
    ],
    ion: [
      ['5s', 2],
      ['4d', 10],
    ],
    reason:
      'Remove the three outer 5p electrons before 5s. The filled 4d subshell is inside that outer shell.',
  },
];
const textConfig = (core: string, orbitals: [string, number][]) =>
  [
    core ? `[${core}]` : '',
    ...orbitals.map(
      ([o, n]) =>
        `${o}${String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])}`,
    ),
  ]
    .filter(Boolean)
    .join(' ');
const helper = (
  id: string,
  section: string,
  prompt: string,
  asking: string,
  help: string,
  concept: string,
): CompanionQuestion => ({
  id,
  number: id.slice(2),
  section,
  prompt,
  asking,
  concepts: [concept],
  input: 'text',
  clues: [],
  steps: [{ title: 'Use the source rule', text: help }],
  hints: [help],
  example: help,
  repair: {
    prompt: 'Which electron count should the configuration match?',
    choices: [
      'Atomic number minus signed charge',
      'Always the neutral atomic number',
    ],
    answer: 'Atomic number minus signed charge',
    explanation: 'Account for charge before distributing electrons.',
  },
  checklist: [asking, help],
});
export const recoveredIonQuestions = ionConfigurations.map((m) =>
  helper(
    `q-28${m.part}`,
    'p.157 · #28',
    `Predict the core electron configuration of ${m.species}.`,
    'Count the ion’s electrons, then apply the teacher’s anion/cation rules.',
    m.reason,
    'electron-configuration',
  ),
);
const valenceRows: [string, string, string][] = [
  ['a', 'O', '[He]2s²2p⁴ leaves two s and four p electrons outside the core.'],
  ['b', 'P', '[Ne]3s²3p³ leaves two s and three p electrons outside the core.'],
  [
    'c',
    'V',
    '[Ar]4s²3d³ has an unfilled d subshell. Count its three d electrons as well as the two s electrons; do not count s/p alone.',
  ],
  ['d', 'Ca', '[Ar]4s² leaves the two 4s electrons outside the core.'],
  [
    'e',
    'Xe',
    'The preceding page explicitly reports ZERO valence electrons for neutral Xe because of its noble-gas configuration. Its eight outer s/p electrons are a different count.',
  ],
  [
    'f',
    'Hg',
    '[Xe]6s²4f¹⁴5d¹⁰ has filled f and d subshells. The course excludes both; the 6s pair remains.',
  ],
  [
    'g',
    'Te',
    '[Kr]5s²4d¹⁰5p⁴: omit filled 4d¹⁰ and count the outer s/p electrons.',
  ],
  [
    'h',
    'Cl⁻',
    '[Ne]3s²3p⁶ has eight outer s/p electrons and a closed noble-gas configuration. The source also calls noble-gas Xe’s valence zero. The supplied notes do not resolve how that convention is applied to this closed-shell ion; confirm whether the teacher expects the outer-shell count or the zero-reactable count.',
  ],
  [
    'i',
    'I⁵⁺',
    'Remove the five 5p electrons from [Kr]5s²4d¹⁰5p⁵. Omit filled 4d¹⁰ when counting valence; the 5s pair remains.',
  ],
  [
    'j',
    'Xe²⁺',
    'Remove two 5p electrons, leaving [Kr]5s²4d¹⁰5p⁴. This is no longer a closed noble-gas configuration. Omit filled d and count s/p.',
  ],
  [
    'k',
    'Zn²⁺',
    'Removing the 4s pair leaves [Ar]3d¹⁰. The d subshell is filled and excluded by this page’s definition.',
  ],
  [
    'l',
    'Ge⁴⁺',
    'Remove 4p² and 4s², leaving [Ar]3d¹⁰. The remaining filled d subshell is excluded.',
  ],
  [
    'm',
    'Tc⁴⁺',
    'From [Kr]5s²4d⁵ remove the 5s pair, then two 4d electrons. The remaining d subshell is unfilled, so its electrons count.',
  ],
  [
    'n',
    'Sb³⁺',
    'Remove 5p³, leaving [Kr]5s²4d¹⁰. Omit filled d; count the 5s pair.',
  ],
  [
    'o',
    'O⁻',
    'Add one electron to 2p, giving [He]2s²2p⁵. Count both occupied outer subshells.',
  ],
  [
    'p',
    'Nb³⁺',
    'Removing three outer electrons leaves [Kr]4d². The d subshell is unfilled, so those electrons count.',
  ],
];
export const recoveredValenceQuestions = valenceRows.map(
  ([part, species, help]) =>
    helper(
      `q-29${part}`,
      'p.158 · #29',
      `How many valence electrons does ${species} contain?`,
      'Use the definition and examples printed on p.157: exclude the core and filled d/f subshells; preserve the stated noble-gas convention.',
      help,
      'valence-electrons',
    ),
);
export const configurationText = textConfig;
