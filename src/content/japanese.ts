import classroom from './ingestion/classroom.json' with { type: 'json' };
import { kanaRomaji } from '../core/romaji';
import type { Assignment } from '../core/schema';

export type JapaneseReadingMode = 'japanese' | 'kana-romaji' | 'reading-aids';
export type JapaneseSet =
  'greetings' | 'classroom' | 'numbers' | 'colors' | 'shapes' | 'vowels';
export type JapaneseForm = {
  japanese: string;
  kana: string;
  romaji: string;
  meaning: string;
  kanji?: string;
  furigana?: { text: string; reading?: string }[];
};
export type JapaneseWord = JapaneseForm & {
  id: string;
  set: JapaneseSet;
  material: string;
  checkpoint?: string;
  concept: string;
  alternatives: string[];
  englishAnswers: string[];
  note?: string;
};
export type JapaneseGrammarLesson = {
  id: string;
  title: string;
  material: string;
  explanation: string;
  examples: {
    sentence: JapaneseForm;
    parts: { form: JapaneseForm; role: string; explanation: string }[];
  }[];
};

// Updating the weekly focus does not change the vocabulary or learner IDs.
// This scope follows the current class material confirmed in the product brief.
export const japaneseWeek = {
  id: 'colors-shapes',
  title: 'Colors & shapes',
  sets: ['colors', 'shapes'] as JapaneseSet[],
  materials: ['japanese-colours-shapes'],
  focus: 'Recognize the class words, then recall them without the list.',
};
export const japaneseSets: {
  id: JapaneseSet;
  title: string;
  description: string;
}[] = [
  {
    id: 'greetings',
    title: 'Greetings',
    description: 'The 18 basic class expressions',
  },
  {
    id: 'classroom',
    title: 'Classroom expressions',
    description: 'Requests, responses and classroom directions',
  },
  {
    id: 'numbers',
    title: 'Numbers',
    description: 'Numbers and money, including irregular readings',
  },
  {
    id: 'colors',
    title: 'Colors',
    description: 'The current class color list',
  },
  {
    id: 'shapes',
    title: 'Shapes',
    description: 'The six shapes on the class sheet',
  },
  {
    id: 'vowels',
    title: 'Vowel kana',
    description: 'The five confirmed handwriting characters',
  },
];

const readingOverrides: Record<string, string> = {
  こんにちは: 'konnichiwa',
  こんばんは: 'konbanwa',
  '…はなんですか': '… wa nan desu ka',
  '…はにほんごでなんですか': '… wa nihongo de nan desu ka',
  '…はどこですか': '… wa doko desu ka',
  '…をかりてもいいですか': '… o karite mo ii desu ka',
  '…にいってもいいですか': '… ni itte mo ii desu ka',
};
const romajiFor = (form: string) =>
  readingOverrides[form] ??
  form
    .split(' / ')
    .map((part) => kanaRomaji(part) ?? '')
    .join(' / ');
// Keep context-specific class meanings; accept ordinary spelling variants and
// the greeting equivalents already present in the reviewed basics glossary.
const englishAliases: Record<string, string[]> = {
  いろ: ['color'],
  はいいろ: ['gray'],
  こんにちは: ['hello', 'good afternoon', 'hello / good afternoon'],
};
const englishAnswers = (meaning: string, japanese: string) => {
  const plain = meaning
    .replace(/,.*$/, '')
    .replace(/ on the class sheet.*$/, '')
    .replace(/ in this class context.*$/, '')
    .replace(/ in the class attendance context.*$/, '')
    .replace(/;.*$/, '')
    .replace(/\.$/, '');
  return [
    ...new Set([
      meaning,
      plain,
      ...plain.split(' / '),
      ...(englishAliases[japanese] ?? []),
    ]),
  ];
};
function wordsFrom(material: string, set: JapaneseSet, prefix: string) {
  const assignment = classroom.assignments.find(
    (a) => a.id === material,
  )! as Assignment;
  return (assignment.reading ?? [])
    .filter((r) => r.heading.startsWith('In class · '))
    .map((r, index): JapaneseWord => {
      const japanese = r.heading.replace('In class · ', '');
      const q = assignment.companionQuestions?.find(
        (q) => q.answer?.value === japanese,
      );
      return {
        id: `${prefix}-${index + 1}`,
        japanese,
        kana: japanese,
        romaji: romajiFor(japanese),
        meaning: r.text,
        set,
        material,
        checkpoint: q?.id,
        concept: q?.concepts[0] ?? r.concepts[0] ?? 'hiragana',
        alternatives: [...new Set([japanese, ...japanese.split(' / ')])],
        englishAnswers: englishAnswers(r.text, japanese),
      };
    });
}
const colorsShapes = wordsFrom(
  'japanese-colours-shapes',
  'colors',
  'jp-color-shape',
);
for (const [index, word] of colorsShapes.entries()) {
  if (index >= 12) word.set = 'shapes';
  if (word.japanese === 'しかっけい')
    word.note =
      'The class sheet uses this for a square / quadrangle. Keep the teacher’s intended shape in mind.';
  if (word.japanese === 'こころ')
    word.note =
      'This is the class-sheet form. こころ usually means heart or mind; ハート is the common heart-shape word.';
}
const classroomWords = wordsFrom(
  'japanese-classroom-expressions',
  'classroom',
  'jp-classroom',
);
for (const word of classroomWords)
  if (['もういちどください', 'もっとゆっくりください'].includes(word.japanese))
    word.note =
      'A shortened expression from the class sheet. The fuller everyday phrases appear in the class material below.';

export const japaneseWords: JapaneseWord[] = [
  ...wordsFrom('greetings-practice', 'greetings', 'jp-basics'),
  ...classroomWords,
  ...wordsFrom('japanese-numbers', 'numbers', 'jp-number'),
  ...colorsShapes,
  ...classroom.japanese.learned.map((v): JapaneseWord => ({
    id: `jp-kana-${v.code}`,
    japanese: v.character,
    kana: v.character,
    romaji: v.reading,
    meaning: v.reading,
    set: 'vowels',
    material: 'japanese-kana',
    concept: 'hiragana',
    alternatives: [v.character],
    englishAnswers: [v.reading],
    note: v.sound,
  })),
];
export const japaneseGrammar: JapaneseGrammarLesson[] = [];
export const japanesePhraseConnections = classroom.japanese.connections.filter(
  (c) => c.scope === 'In class' && c.component === 'ございます',
);
export const japaneseMaterials = classroom.assignments.filter(
  (a) => a.course === 'japanese',
);

// Reference rows are not evidence that the class has learned them.
// Readings cross-checked against the Japan Foundation Irodori kana reference.
export const japaneseKanaRows = [
  {
    id: 'vowels',
    label: 'Vowels',
    characters: 'あいうえお',
    readings: 'a i u e o',
  },
  {
    id: 'k',
    label: 'K row',
    characters: 'かきくけこ',
    readings: 'ka ki ku ke ko',
  },
  {
    id: 's',
    label: 'S row',
    characters: 'さしすせそ',
    readings: 'sa shi su se so',
  },
  {
    id: 't',
    label: 'T row',
    characters: 'たちつてと',
    readings: 'ta chi tsu te to',
  },
  {
    id: 'n',
    label: 'N row',
    characters: 'なにぬねの',
    readings: 'na ni nu ne no',
  },
  {
    id: 'h',
    label: 'H row',
    characters: 'はひふへほ',
    readings: 'ha hi fu he ho',
  },
  {
    id: 'm',
    label: 'M row',
    characters: 'まみむめも',
    readings: 'ma mi mu me mo',
  },
  { id: 'y', label: 'Y row', characters: 'やゆよ', readings: 'ya yu yo' },
  {
    id: 'r',
    label: 'R row',
    characters: 'らりるれろ',
    readings: 'ra ri ru re ro',
  },
  { id: 'w', label: 'W row & n', characters: 'わをん', readings: 'wa o n' },
].map((row) => ({
  ...row,
  kana: [...row.characters].map((character, index) => ({
    character,
    reading: row.readings.split(' ')[index],
    learned: classroom.japanese.learned.some((v) => v.character === character),
    strokeCode: classroom.japanese.learned.find(
      (v) => v.character === character,
    )?.code,
  })),
}));

export const japaneseMaterialDestination = (id: string) => {
  if (id === 'japanese-kana' || id === 'japanese-writing-notes') return 'kana';
  if (id === 'japanese-colours-shapes') return 'this-week';
  if (id === 'greetings-practice') return 'vocabulary&sets=greetings';
  if (id === 'japanese-classroom-expressions')
    return 'vocabulary&sets=classroom';
  if (id === 'japanese-numbers' || id === 'japanese-money')
    return 'vocabulary&sets=numbers';
  return 'resources';
};
