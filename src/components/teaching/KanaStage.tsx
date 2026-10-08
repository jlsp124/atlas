import { useRef } from 'react';
import classroom from '../../content/ingestion/classroom.json';
import strokes from '../../content/ingestion/kana-strokes.json';
import { useTeachingMotion } from './Motion';
import { Icon } from '../Icons';
export default function KanaStage({
  code,
  step,
  onChange,
}: {
  code: string;
  step: number;
  onChange: (code: string, step: number) => void;
}) {
  const vowel =
    classroom.japanese.learned.find((v) => v.code === code) ??
    classroom.japanese.learned[0];
  const paths = strokes[vowel.code as keyof typeof strokes],
    shown = Math.min(step, paths.length);
  const ref = useRef<HTMLDivElement>(null),
    reduced = useTeachingMotion(ref, `${vowel.code}-${shown}`);
  return (
    <div className="kana-stage" ref={ref} data-reduced-motion={reduced}>
      <div
        className="kana-selector"
        role="group"
        aria-label="Five confirmed vowels"
      >
        {classroom.japanese.learned.map((v) => (
          <button
            lang="ja"
            className="secondary"
            key={v.code}
            aria-pressed={v.code === vowel.code}
            onClick={() => onChange(v.code, 0)}
          >
            {v.character}
            <small>{v.reading}</small>
          </button>
        ))}
      </div>
      <div className="kana-focus">
        <svg
          className="four-square"
          viewBox="0 0 109 109"
          role="img"
          aria-label={`${vowel.character}, ${paths.length} strokes, showing ${shown}`}
        >
          <path d="M54.5 0V109M0 54.5H109" className="figure-guide" />
          {paths.map((d, i) => (
            <path
              key={d}
              d={d}
              className={`kana-stroke ${i === shown - 1 ? 'current-stroke' : ''}`}
              fill="none"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: i < shown ? 0 : 1,
              }}
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div>
          <p className="eyebrow">In class · {vowel.reading}</p>
          <h3 lang="ja">{vowel.character}</h3>
          <p>{vowel.sound}</p>
          <p lang="ja">{vowel.example}</p>
          <p className="muted">
            Follow each stroke, then write it in your four-square guide.
          </p>
        </div>
      </div>
      <nav className="guide-navigation" aria-label="Stroke order">
        <button className="secondary" onClick={() => onChange(vowel.code, 0)}>
          Start
        </button>
        <span>
          {shown}/{paths.length}
        </span>
        <button
          className="primary"
          disabled={shown === paths.length}
          onClick={() => onChange(vowel.code, shown + 1)}
        >
          Next stroke <Icon name="arrow" size={16} />
        </button>
      </nav>
      <p className="source-meta">
        Stroke paths:{' '}
        <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">
          KanjiVG
        </a>
        , Ulrich Apel, CC BY-SA 3.0. Teacher handwriting examples control class
        expectations.
      </p>
    </div>
  );
}
