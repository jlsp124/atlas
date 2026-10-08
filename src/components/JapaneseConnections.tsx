import { useState } from 'react';
import classroom from '../content/ingestion/classroom.json';
import strokes from '../content/ingestion/kana-strokes.json';
import { topicTitle } from '../content/workspaces';
import { url } from '../client/store';
import ReadableText from './ReadableText';

function Kana({
  vowel,
}: {
  vowel: (typeof classroom.japanese.learned)[number];
}) {
  const paths = strokes[vowel.code as keyof typeof strokes],
    [step, setStep] = useState(paths.length);
  return (
    <section className="kana-practice">
      <h3 lang="ja">
        <ReadableText text={vowel.character} />
      </h3>
      <svg
        className="four-square"
        viewBox="0 0 109 109"
        role="img"
        aria-label={`${vowel.character}, ${paths.length} strokes, showing ${step}`}
      >
        <path d="M54.5 0V109M0 54.5H109" className="figure-guide" />
        {paths.slice(0, step).map((d, index) => (
          <path
            d={d}
            key={d}
            fill="none"
            stroke={index + 1 === step ? 'var(--accent)' : 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="context-actions">
        <button className="quiet" onClick={() => setStep(0)}>
          Start
        </button>
        <button
          className="secondary"
          onClick={() => setStep((s) => Math.min(paths.length, s + 1))}
          disabled={step === paths.length}
        >
          Next stroke
        </button>
        <span>
          {step}/{paths.length}
        </span>
      </div>
      <p>
        {vowel.sound}. <ReadableText text={vowel.example} />
      </p>
    </section>
  );
}
export default function JapaneseConnections({
  assignment,
}: {
  assignment: string;
}) {
  const connections = classroom.japanese.connections.filter((c) =>
    assignment === 'greetings-practice'
      ? c.concepts.some((id) => id.startsWith('jp-'))
      : assignment === 'japanese-colours-shapes'
        ? c.examples.some((e) =>
            classroom.japanese.colours.some(([word]) => word === e),
          )
        : false,
  );
  return (
    <>
      {assignment === 'japanese-kana' && (
        <section>
          <h2>In class · Hiragana 1</h2>
          <div className="kana-grid">
            {classroom.japanese.learned.map((v) => (
              <Kana key={v.code} vowel={v} />
            ))}
          </div>
          <small className="source-meta">
            Stroke paths:{' '}
            <a
              href="https://kanjivg.tagaini.net/"
              target="_blank"
              rel="noreferrer"
            >
              KanjiVG
            </a>
            , Ulrich Apel, CC BY-SA 3.0. Teacher handwriting examples control
            class expectations.
          </small>
        </section>
      )}
      {connections.map((c) => (
        <section className="phrase-connection" key={c.component}>
          <p className="meta">{c.scope}</p>
          <h2 lang="ja">
            <ReadableText text={c.component} />
          </h2>
          <p>
            <ReadableText text={c.meaning} />
          </p>
          <p lang="ja">
            <ReadableText text={c.examples.join(' · ')} />
          </p>
          <div className="context-actions">
            {c.concepts.map((id) => (
              <a key={id} href={url(`learn/${id}/`)}>
                <ReadableText text={topicTitle(id)} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
