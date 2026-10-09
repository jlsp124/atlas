import { describe, expect, it } from 'vitest';
import {
  japaneseGrammar,
  japaneseKanaRows,
  japaneseWeek,
  japaneseWords,
} from '../src/content/japanese';
import {
  adaptiveJapaneseQueue,
  checkJapaneseReview,
  japaneseChoices,
  japaneseHistory,
  reviewWords,
  type JapaneseReviewHistory,
} from '../src/core/japanese-review';
import { eventSchema } from '../src/core/schema';
import { randomUUID } from 'node:crypto';

describe('Japanese class scope and reading data', () => {
  it('retains every real current list and the five confirmed vowels', () => {
    expect(new Set(japaneseWords.map((word) => word.id)).size).toBe(
      japaneseWords.length,
    );
    expect(reviewWords(japaneseWords, ['greetings'])).toHaveLength(18);
    expect(reviewWords(japaneseWords, ['classroom'])).toHaveLength(19);
    expect(reviewWords(japaneseWords, ['numbers'])).toHaveLength(20);
    expect(reviewWords(japaneseWords, ['colors'])).toHaveLength(12);
    expect(reviewWords(japaneseWords, ['shapes'])).toHaveLength(6);
    expect(reviewWords(japaneseWords, japaneseWeek.sets)).toHaveLength(18);
    expect(reviewWords(japaneseWords, ['vowels'])).toHaveLength(5);
    expect(
      japaneseWords.every(
        (word) => word.japanese && word.kana && word.romaji && word.meaning,
      ),
    ).toBe(true);
    expect(
      japaneseKanaRows
        .flatMap((row) => row.kana)
        .filter((kana) => kana.learned)
        .map((kana) => kana.character),
    ).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(japaneseGrammar).toEqual([]);
  });
  it('keeps actual class forms and alternate number readings', () => {
    const zero = japaneseWords.find((word) => word.meaning === '0')!;
    expect(checkJapaneseReview(zero, 'ゼロ', 'typing')).toBe(true);
    expect(checkJapaneseReview(zero, 'れい', 'typing')).toBe(true);
    expect(checkJapaneseReview(zero, zero.japanese, 'english-japanese')).toBe(
      true,
    );
    const triangle = japaneseWords.find((word) => word.meaning === 'triangle')!;
    expect(triangle.japanese).toBe('さんかっけい');
    expect(checkJapaneseReview(triangle, 'sankakkei', 'typing', 'romaji')).toBe(
      true,
    );
    expect(checkJapaneseReview(triangle, 'sankakkei', 'typing', 'kana')).toBe(
      false,
    );
    expect(
      japaneseWords.find((word) => word.japanese === 'こんにちは')?.romaji,
    ).toBe('konnichiwa');
    expect(
      japaneseWords.find((word) => word.japanese === '…はどこですか')?.romaji,
    ).toBe('… wa doko desu ka');
  });
  it('accepts ordinary English spellings and reviewed greeting equivalents without broad guesses', () => {
    const color = japaneseWords.find((word) => word.japanese === 'いろ')!;
    const gray = japaneseWords.find((word) => word.japanese === 'はいいろ')!;
    const hello = japaneseWords.find((word) => word.japanese === 'こんにちは')!;
    for (const value of ['colour', 'color'])
      expect(checkJapaneseReview(color, value, 'japanese-english')).toBe(true);
    for (const value of ['grey', 'gray'])
      expect(checkJapaneseReview(gray, value, 'japanese-english')).toBe(true);
    for (const value of ['hello', 'good afternoon', 'hello during the day'])
      expect(checkJapaneseReview(hello, value, 'japanese-english')).toBe(true);
    expect(checkJapaneseReview(color, 'red', 'japanese-english')).toBe(false);
    expect(checkJapaneseReview(hello, 'good night', 'japanese-english')).toBe(
      false,
    );
  });
});
describe('adaptive Japanese review', () => {
  const words = reviewWords(japaneseWords, ['colors']);
  const now = Date.parse('2026-10-08T12:00:00Z');
  const record = (
    word: string,
    rating: JapaneseReviewHistory['rating'],
    correct = true,
  ): JapaneseReviewHistory => ({
    word,
    rating,
    correct,
    revealed: false,
    mode: 'recognition',
    at: '2026-10-08T11:00:00Z',
  });
  it('prioritizes missed and hard words, then unseen words; recent easy words wait', () => {
    const history = [
      record(words[0].id, 'easy'),
      record(words[3].id, 'hard'),
      record(words[5].id, 'okay', false),
    ];
    const queue = adaptiveJapaneseQueue(words, history, now, 12);
    expect(queue.slice(0, 2)).toEqual([words[3].id, words[5].id]);
    expect(queue.at(-1)).toBe(words[0].id);
    expect(new Set(queue).size).toBe(queue.length);
  });
  it('uses the newest result and isolates the selected vocabulary scope', () => {
    const newer = {
      ...record(words[1].id, 'easy'),
      at: '2026-10-08T11:30:00Z',
    };
    const queue = adaptiveJapaneseQueue(
      words,
      [newer, record(words[1].id, 'hard')],
      now,
      3,
    );
    expect(queue).not.toContain(words[1].id);
    expect(queue.every((id) => words.some((word) => word.id === id))).toBe(
      true,
    );
  });
  it('produces distinct choices with the correct class form included', () => {
    for (const mode of ['recognition', 'english-japanese'] as const) {
      const choices = japaneseChoices(words[0], words, mode, 7);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(
        mode === 'recognition' ? words[0].meaning : words[0].japanese,
      );
    }
  });
  it('persists only a result and rating, rejecting typed response content', () => {
    const event = {
      id: randomUUID(),
      device: randomUUID(),
      at: '2026-10-08T12:00:00Z',
      type: 'japanese_reviewed',
      payload: {
        word: words[0].id,
        mode: 'typing',
        correct: true,
        rating: 'okay',
        revealed: false,
      },
    };
    expect(eventSchema.safeParse(event).success).toBe(true);
    expect(
      eventSchema.safeParse({
        ...event,
        payload: { ...event.payload, answer: 'private typed response' },
      }).success,
    ).toBe(false);
    expect(japaneseHistory([event])).toHaveLength(1);
    expect(
      japaneseHistory([{ ...event, type: 'checkpoint_saved' }]),
    ).toHaveLength(0);
  });
});
