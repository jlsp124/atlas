import type { JapaneseSet, JapaneseWord } from '../content/japanese';

export type JapaneseReviewMode =
  'recognition' | 'japanese-english' | 'english-japanese' | 'typing';
export type JapaneseRating = 'easy' | 'okay' | 'hard';
export type JapaneseReviewRecord = {
  word: string;
  mode: JapaneseReviewMode;
  correct: boolean;
  rating: JapaneseRating;
  revealed: boolean;
};
export type JapaneseReviewHistory = JapaneseReviewRecord & { at: string };
type Event = { type: string; at: string; payload: unknown };

export function japaneseHistory(
  events: readonly Event[],
): JapaneseReviewHistory[] {
  return events.flatMap((event) => {
    if (
      event.type !== 'japanese_reviewed' ||
      !event.payload ||
      typeof event.payload !== 'object'
    )
      return [];
    const p = event.payload as JapaneseReviewRecord;
    if (
      typeof p.word !== 'string' ||
      ![
        'recognition',
        'japanese-english',
        'english-japanese',
        'typing',
      ].includes(p.mode) ||
      typeof p.correct !== 'boolean' ||
      typeof p.revealed !== 'boolean' ||
      !['easy', 'okay', 'hard'].includes(p.rating)
    )
      return [];
    return [{ ...p, at: event.at }];
  });
}
export function reviewWords(
  words: readonly JapaneseWord[],
  sets: readonly JapaneseSet[],
) {
  return words.filter((word) => sets.includes(word.set));
}
export function reviewDue(history?: JapaneseReviewHistory) {
  if (!history) return 0;
  const interval =
    !history.correct || history.revealed || history.rating === 'hard'
      ? 10 * 60 * 1000
      : history.rating === 'okay'
        ? 24 * 60 * 60 * 1000
        : 3 * 24 * 60 * 60 * 1000;
  return Date.parse(history.at) + interval;
}
export function adaptiveJapaneseQueue(
  words: readonly JapaneseWord[],
  history: readonly JapaneseReviewHistory[],
  now: number,
  limit = 12,
): string[] {
  const latest = new Map<string, JapaneseReviewHistory>();
  for (const record of history)
    if (!latest.has(record.word) || record.at > latest.get(record.word)!.at)
      latest.set(record.word, record);
  const priority = (word: JapaneseWord) => {
    const previous = latest.get(word.id);
    if (
      previous &&
      (!previous.correct || previous.revealed || previous.rating === 'hard')
    )
      return 0;
    if (!previous) return 1;
    if (reviewDue(previous) <= now) return 2;
    return 3;
  };
  return [...words]
    .sort(
      (a, b) =>
        priority(a) - priority(b) ||
        reviewDue(latest.get(a.id)) - reviewDue(latest.get(b.id)) ||
        words.indexOf(a) - words.indexOf(b),
    )
    .slice(0, limit)
    .map((word) => word.id);
}
export function normalizeJapaneseAnswer(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[\s。、,.!?！？'’…]/g, '');
}
export function checkJapaneseReview(
  word: JapaneseWord,
  value: string,
  mode: JapaneseReviewMode,
  script: 'kana' | 'romaji' = 'kana',
) {
  const answers =
    mode === 'japanese-english' || mode === 'recognition'
      ? word.englishAnswers
      : script === 'romaji' && mode === 'typing'
        ? word.romaji.split(' / ')
        : word.alternatives;
  const normalized = normalizeJapaneseAnswer(value);
  return (
    !!normalized &&
    answers.some((answer) => normalizeJapaneseAnswer(answer) === normalized)
  );
}
export function japaneseChoices(
  word: JapaneseWord,
  words: readonly JapaneseWord[],
  mode: JapaneseReviewMode,
  seed = 0,
) {
  const form = (item: JapaneseWord) =>
    mode === 'english-japanese' ? item.japanese : item.meaning;
  const correct = form(word);
  const pool = [...words.filter((w) => w.set === word.set), ...words];
  const alternatives = [
    ...new Set(pool.filter((w) => w.id !== word.id).map(form)),
  ].filter((a) => a !== correct);
  const distractors: string[] = [];
  while (alternatives.length && distractors.length < 3) {
    const index = (seed + distractors.length * 7) % alternatives.length;
    distractors.push(alternatives.splice(index, 1)[0]);
  }
  const choices = [...distractors];
  choices.splice(seed % (choices.length + 1), 0, correct);
  return choices;
}
