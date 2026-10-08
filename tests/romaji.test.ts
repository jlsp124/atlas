import { describe, expect, it } from 'vitest';
import { kanaRomaji } from '../src/core/romaji';

describe('beginner kana reading aid', () => {
  it('keeps irregular class hundreds and shape sounds readable', () => {
    expect(kanaRomaji('ひゃく')).toBe('hyaku');
    expect(kanaRomaji('ろっぴゃく')).toBe('roppyaku');
    expect(kanaRomaji('はっせん')).toBe('hassen');
    expect(kanaRomaji('さんかっけい')).toBe('sankakkei');
    expect(kanaRomaji('ちゃいろ')).toBe('chairo');
  });
  it('reads katakana and preserves long vowels in the class spelling style', () => {
    expect(kanaRomaji('オレンジ')).toBe('orenji');
    expect(kanaRomaji('ピンク')).toBe('pinku');
    expect(kanaRomaji('ハート')).toBe('haato');
    expect(kanaRomaji('せんせい')).toBe('sensei');
  });
  it('does not invent readings for kanji or incomplete kana', () => {
    expect(kanaRomaji('日本')).toBeUndefined();
    expect(kanaRomaji('っ')).toBeUndefined();
    expect(kanaRomaji('ー')).toBeUndefined();
  });
});
