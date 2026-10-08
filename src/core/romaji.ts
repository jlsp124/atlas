// Kana readings follow the Japan Foundation's Irodori reference:
// https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf
// Keep vowels explicit, matching the existing class vocabulary (ohayou, sensei).
const rows = [
  ['あいうえお', 'a i u e o'],
  ['かきくけこ', 'ka ki ku ke ko'],
  ['さしすせそ', 'sa shi su se so'],
  ['たちつてと', 'ta chi tsu te to'],
  ['なにぬねの', 'na ni nu ne no'],
  ['はひふへほ', 'ha hi fu he ho'],
  ['まみむめも', 'ma mi mu me mo'],
  ['やゆよ', 'ya yu yo'],
  ['らりるれろ', 'ra ri ru re ro'],
  ['わをん', 'wa o n'],
  ['がぎぐげご', 'ga gi gu ge go'],
  ['ざじずぜぞ', 'za ji zu ze zo'],
  ['だぢづでど', 'da ji zu de do'],
  ['ばびぶべぼ', 'ba bi bu be bo'],
  ['ぱぴぷぺぽ', 'pa pi pu pe po'],
] as const;
const kana: Record<string, string> = Object.fromEntries(
  rows.flatMap(([letters, readings]) =>
    [...letters].map((letter, i) => [letter, readings.split(' ')[i]]),
  ),
);
const paired: Record<string, string> = {};
for (const [letter, prefix] of [
  ['き', 'ky'],
  ['し', 'sh'],
  ['ち', 'ch'],
  ['に', 'ny'],
  ['ひ', 'hy'],
  ['み', 'my'],
  ['り', 'ry'],
  ['ぎ', 'gy'],
  ['じ', 'j'],
  ['ぢ', 'j'],
  ['び', 'by'],
  ['ぴ', 'py'],
])
  for (const [small, vowel] of [
    ['ゃ', 'a'],
    ['ゅ', 'u'],
    ['ょ', 'o'],
  ])
    paired[letter + small] = prefix + vowel;

// This is a kana reading aid, not a kanji or sentence-pronunciation guesser.
// Known expression readings, including the greeting particle は, take priority.
export function kanaRomaji(text: string): string | undefined {
  const letters = [...text.normalize('NFKC')].map((c) =>
    c >= 'ァ' && c <= 'ヶ' ? String.fromCharCode(c.charCodeAt(0) - 0x60) : c,
  );
  let reading = '';
  let doubled = false;
  for (let i = 0; i < letters.length; i++) {
    const c = letters[i];
    if (c === 'っ') {
      doubled = true;
      continue;
    }
    if (c === 'ー') {
      const vowel = reading.match(/[aiueo]$/)?.[0];
      if (!vowel) return;
      reading += vowel;
      continue;
    }
    const pair = paired[c + (letters[i + 1] ?? '')];
    const sound = pair ?? kana[c];
    if (!sound) return;
    if (pair) i++;
    if (doubled) {
      if (!/^[bcdfghjklmnpqrstvwxyz]/.test(sound)) return;
      reading += sound.startsWith('ch') ? 't' : sound[0];
      doubled = false;
    }
    reading += sound;
    if (c === 'ん' && /^[あいうえおやゆよ]/.test(letters[i + 1] ?? ''))
      reading += "'";
  }
  return doubled ? undefined : reading || undefined;
}
