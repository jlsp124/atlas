import { definitions, type Definition } from '../content/definitions';
import ReadableText from './ReadableText';
const terms = definitions
  .flatMap((d) => [d.term, ...(d.aliases ?? [])].map((term) => ({ term, d })))
  .sort((a, b) => b.term.length - a.term.length);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(
  terms.map(({ term }) => escape(term)).join('|'),
  'giu',
);
export function openDefinition(definition: Definition, trigger: HTMLElement) {
  window.dispatchEvent(
    new CustomEvent('atlas:definition', { detail: { definition, trigger } }),
  );
}
export default function Glossary({ text }: { text: string }) {
  const pieces: (string | { text: string; d: Definition })[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    if (
      /^[a-z]/i.test(match[0]) &&
      (/[a-z]/i.test(text[start - 1] ?? '') ||
        /[a-z]/i.test(text[start + match[0].length] ?? ''))
    )
      continue;
    const d = terms.find(
      (t) => t.term.toLowerCase() === match[0].toLowerCase(),
    )!.d;
    pieces.push(text.slice(last, start), { text: match[0], d });
    last = start + match[0].length;
  }
  pieces.push(text.slice(last));
  return (
    <>
      {pieces.map((p, i) =>
        typeof p === 'string' ? (
          <ReadableText text={p} key={i} />
        ) : (
          <button
            type="button"
            className="term"
            key={i}
            onClick={(e) => openDefinition(p.d, e.currentTarget)}
            aria-label={`Define ${p.text}`}
          >
            <ReadableText text={p.text} />
          </button>
        ),
      )}
    </>
  );
}
