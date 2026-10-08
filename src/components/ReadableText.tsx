import { concepts } from '../content/catalog';
import { kanaRomaji } from '../core/romaji';

const phraseReadings = Object.fromEntries(
  concepts
    .filter((c) => c.course === 'japanese' && c.kind === 'vocabulary')
    .map((c) => [c.title, c.aliases?.[0]]),
);
const readable = /vᵢ|v𝒇|(?<![a-zA-Z])v[if](?![a-zA-Z])|[ぁ-ゖァ-ヺー]+/gu;

export default function ReadableText({ text }: { text: string }) {
  const pieces = [];
  let cursor = 0;
  for (const match of text.matchAll(readable)) {
    const word = match[0];
    pieces.push(text.slice(cursor, match.index));
    if (word.startsWith('v')) {
      pieces.push(
        <span className="velocity-symbol" key={match.index}>
          v<sub>{word === 'vᵢ' || word === 'vi' ? 'i' : 'f'}</sub>
        </span>,
      );
    } else {
      const reading = phraseReadings[word] ?? kanaRomaji(word);
      pieces.push(
        reading ? (
          <ruby className="kana-reading" lang="ja" key={match.index}>
            {word}
            <rt lang="ja-Latn">{reading}</rt>
          </ruby>
        ) : (
          word
        ),
      );
    }
    cursor = match.index + word.length;
  }
  pieces.push(text.slice(cursor));
  return <>{pieces}</>;
}
