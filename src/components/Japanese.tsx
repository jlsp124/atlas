import { useEffect, useRef, useState } from 'react';
import {
  japaneseGrammar,
  japaneseKanaRows,
  japaneseMaterials,
  japaneseMaterialDestination,
  japanesePhraseConnections,
  japaneseSets,
  japaneseWeek,
  japaneseWords,
  type JapaneseForm,
  type JapaneseReadingMode,
  type JapaneseSet,
} from '../content/japanese';
import {
  adaptiveJapaneseQueue,
  checkJapaneseReview,
  japaneseChoices,
  japaneseHistory,
  reviewDue,
  reviewWords,
  type JapaneseRating,
  type JapaneseReviewMode,
  type JapaneseReviewRecord,
} from '../core/japanese-review';
import { emit, url, useLearner } from '../client/store';
import { CourseMark, Icon } from './Icons';
import KanaStage from './teaching/KanaStage';
import '../styles/japanese.css';

export type JapaneseSection =
  'this-week' | 'vocabulary' | 'kana' | 'grammar' | 'review' | 'resources';
const sections: { id: JapaneseSection; title: string }[] = [
  { id: 'this-week', title: 'This week' },
  { id: 'vocabulary', title: 'Vocabulary' },
  { id: 'kana', title: 'Kana' },
  { id: 'grammar', title: 'Grammar' },
  { id: 'review', title: 'Review' },
  { id: 'resources', title: 'Resources' },
];
const modes: { id: JapaneseReviewMode; title: string }[] = [
  { id: 'recognition', title: 'Recognition' },
  { id: 'japanese-english', title: 'Japanese → English' },
  { id: 'english-japanese', title: 'English → Japanese' },
  { id: 'typing', title: 'Type Japanese' },
];
const vocabularySets = japaneseSets.filter((set) => set.id !== 'vowels');
const readingModes: { id: JapaneseReadingMode; title: string }[] = [
  { id: 'japanese', title: 'Japanese only' },
  { id: 'kana-romaji', title: 'Kana + romaji' },
  { id: 'reading-aids', title: 'Japanese + reading aids' },
];
function JapaneseText({
  form,
  reading,
  aids = true,
}: {
  form: JapaneseForm;
  reading: JapaneseReadingMode;
  aids?: boolean;
}) {
  const japanese = reading === 'kana-romaji' ? form.kana : form.japanese;
  return (
    <span className="jp-form">
      <span className="jp-written" lang="ja">
        {reading === 'reading-aids' && form.furigana?.length
          ? form.furigana.map((part, index) =>
              part.reading ? (
                <ruby key={index}>
                  {part.text}
                  <rt>{part.reading}</rt>
                </ruby>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )
          : japanese}
      </span>
      {aids && reading === 'reading-aids' && form.kana !== form.japanese && (
        <span lang="ja" className="jp-reading">
          {form.kana}
        </span>
      )}
      {aids && reading !== 'japanese' && form.romaji && (
        <span className="jp-romaji">{form.romaji}</span>
      )}
    </span>
  );
}
function WordList({
  sets,
  reading,
}: {
  sets: JapaneseSet[];
  reading: JapaneseReadingMode;
}) {
  return (
    <div className="jp-word-list">
      {reviewWords(japaneseWords, sets).map((word) => (
        <div className="jp-word-row" id={word.id} key={word.id}>
          <JapaneseText form={word} reading={reading} />
          <div className="jp-meaning">
            <span>{word.meaning}</span>
            {word.note && <small>{word.note}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}
function productEvent(
  type: 'japanese_review_started' | 'japanese_review_completed',
  sets: JapaneseSet[],
) {
  const scope =
    sets.length === vocabularySets.length && !sets.includes('vowels')
      ? 'all'
      : sets.length === 2 && sets.includes('colors') && sets.includes('shapes')
        ? 'colors-shapes'
        : sets.length === 1
          ? sets[0]
          : 'selected';
  window.dispatchEvent(
    new CustomEvent('atlas:product-event', {
      detail: {
        type,
        course: 'japanese',
        feature: 'japanese-review',
        scope,
        success: true,
      },
    }),
  );
}
function saveReview(record: JapaneseReviewRecord) {
  // A dedicated, text-free progress event uses the existing scoped sync engine.
  emit('japanese_reviewed', record);
}
type ReviewSession = {
  queue: string[];
  visits: Record<string, number>;
  rated: number;
  correct: number;
  total: number;
  sets: JapaneseSet[];
  mode: JapaneseReviewMode;
  script: 'kana' | 'romaji';
};
function Review({
  reading,
  initialSets,
}: {
  reading: JapaneseReadingMode;
  initialSets: JapaneseSet[];
}) {
  const state = useLearner();
  const [sets, setSets] = useState<JapaneseSet[]>(initialSets);
  const [mode, setMode] = useState<JapaneseReviewMode>('recognition');
  const [script, setScript] = useState<'kana' | 'romaji'>('kana');
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    correct: boolean;
    revealed: boolean;
  } | null>(null);
  const answerRef = useRef<HTMLInputElement>(null);
  const history = japaneseHistory(state.events);
  const selectedWords = reviewWords(japaneseWords, sets);
  const latest = new Map(history.map((record) => [record.word, record]));
  const due = selectedWords.filter(
    (word) => reviewDue(latest.get(word.id)) <= Date.now(),
  ).length;
  const word = session?.queue[0]
    ? japaneseWords.find((word) => word.id === session.queue[0])
    : undefined;
  useEffect(() => {
    answerRef.current?.focus();
  }, [word?.id]);
  const presets: { title: string; sets: JapaneseSet[] }[] = [
    { title: 'This week', sets: japaneseWeek.sets },
    { title: 'All words', sets: vocabularySets.map((set) => set.id) },
    { title: 'Colors + Shapes', sets: ['colors', 'shapes'] },
  ];
  const toggleSet = (set: JapaneseSet) =>
    setSets((current) =>
      current.includes(set)
        ? current.filter((s) => s !== set)
        : [...current, set],
    );
  function start() {
    const queue = adaptiveJapaneseQueue(selectedWords, history, Date.now());
    if (!queue.length) return;
    setSession({
      queue,
      visits: {},
      rated: 0,
      correct: 0,
      total: queue.length,
      sets: [...sets],
      mode,
      script,
    });
    setAnswer('');
    setResult(null);
    productEvent('japanese_review_started', sets);
  }
  function check(value: string) {
    if (!word || !session || result) return;
    setAnswer(value);
    setResult({
      correct: checkJapaneseReview(word, value, session.mode, session.script),
      revealed: false,
    });
  }
  function rate(rating: JapaneseRating) {
    if (!word || !session || !result) return;
    saveReview({
      word: word.id,
      mode: session.mode,
      correct: result.correct,
      revealed: result.revealed,
      rating,
    });
    const queue = session.queue.slice(1);
    const visits = {
      ...session.visits,
      [word.id]: (session.visits[word.id] ?? 0) + 1,
    };
    if (
      (rating === 'hard' || !result.correct || result.revealed) &&
      visits[word.id] < 2
    )
      queue.splice(Math.min(2, queue.length), 0, word.id);
    const next = {
      ...session,
      queue,
      visits,
      rated: session.rated + 1,
      correct: session.correct + Number(result.correct && !result.revealed),
    };
    setSession(next);
    setAnswer('');
    setResult(null);
    if (!queue.length) productEvent('japanese_review_completed', session.sets);
  }
  if (session && !word)
    return (
      <section className="jp-review-finished">
        <p className="eyebrow">Review finished</p>
        <h2>{session.total} words reviewed</h2>
        <p>
          {session.correct} correct recalls across {session.rated} cards. Hard
          words came back for another try.
        </p>
        <p className="muted">
          Your next review will put missed and difficult words first.
        </p>
        <button className="primary" onClick={() => setSession(null)}>
          Choose another review <Icon name="arrow" size={16} />
        </button>
      </section>
    );
  if (session && word) {
    const japanesePrompt =
      session.mode === 'recognition' || session.mode === 'japanese-english';
    const choices = japaneseChoices(
      word,
      reviewWords(japaneseWords, session.sets),
      session.mode,
      session.rated + 3,
    );
    const chosenWord = (choice: string) =>
      japaneseWords.find((word) => word.japanese === choice);
    return (
      <section className="jp-review-session">
        <div className="jp-review-top">
          <span>
            {modes.find((mode) => mode.id === session.mode)?.title} · Card{' '}
            {session.rated + 1}
          </span>
          <button className="quiet" onClick={() => setSession(null)}>
            End review
          </button>
        </div>
        <p className="eyebrow">
          {japaneseSets.find((set) => set.id === word.set)?.title}
        </p>
        <div className="jp-review-question">
          {japanesePrompt ? (
            <JapaneseText
              form={word}
              reading={reading}
              aids={word.set !== 'vowels'}
            />
          ) : (
            <h2>{word.meaning}</h2>
          )}
        </div>
        <p className="muted">
          {japanesePrompt
            ? 'What does this mean?'
            : session.mode === 'typing'
              ? `Type the Japanese in ${session.script === 'kana' ? 'kana' : 'romaji'}.`
              : 'Choose the Japanese.'}
        </p>
        {['recognition', 'english-japanese'].includes(session.mode) ? (
          <div
            className="jp-review-choices"
            role="group"
            aria-label="Answer choices"
          >
            {choices.map((choice) => (
              <button
                className="secondary"
                key={choice}
                disabled={!!result}
                data-selected={answer === choice}
                onClick={() => check(choice)}
              >
                {session.mode === 'english-japanese' && chosenWord(choice) ? (
                  <JapaneseText
                    form={chosenWord(choice)!}
                    reading={reading}
                    aids={word.set !== 'vowels'}
                  />
                ) : (
                  choice
                )}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="jp-typing-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (answer.trim()) check(answer);
            }}
          >
            <label className="sr-only" htmlFor="jp-answer">
              {japanesePrompt ? 'English meaning' : 'Japanese answer'}
            </label>
            <input
              id="jp-answer"
              ref={answerRef}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={!!result}
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
              lang={
                session.mode === 'typing' && session.script === 'kana'
                  ? 'ja'
                  : 'en'
              }
            />
            <button className="primary" disabled={!!result || !answer.trim()}>
              Check
            </button>
          </form>
        )}
        {!result && (
          <button
            className="quiet jp-reveal"
            onClick={() => setResult({ correct: false, revealed: true })}
          >
            Show me
          </button>
        )}
        {result && (
          <div className="jp-review-answer" aria-live="polite">
            <p className="eyebrow">
              {result.revealed
                ? 'The class form'
                : result.correct
                  ? 'That’s right'
                  : 'Compare with the class form'}
            </p>
            <JapaneseText form={word} reading={reading} />
            <p>{word.meaning}</p>
            {word.note && <p className="muted">{word.note}</p>}
            <p className="jp-rate-label">How did that feel?</p>
            <div
              className="jp-ratings"
              role="group"
              aria-label="Rate recall difficulty"
            >
              {(['easy', 'okay', 'hard'] as const).map((rating) => (
                <button
                  className="secondary"
                  key={rating}
                  onClick={() => rate(rating)}
                >
                  {rating[0].toUpperCase() + rating.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="jp-review-setup">
      <h2>A small review, often</h2>
      <p className="muted">
        Start with up to 12 words. Missed and difficult words return for another
        try.
      </p>
      <fieldset>
        <legend>Choose a scope</legend>
        <div className="jp-presets">
          {presets.map((preset) => (
            <button
              type="button"
              className="secondary"
              key={preset.title}
              aria-pressed={
                sets.length === preset.sets.length &&
                preset.sets.every((set) => sets.includes(set))
              }
              onClick={() => setSets(preset.sets)}
            >
              {preset.title}
            </button>
          ))}
        </div>
        <div className="jp-set-picker">
          {japaneseSets.map((set) => (
            <label key={set.id}>
              <input
                type="checkbox"
                checked={sets.includes(set.id)}
                onChange={() => toggleSet(set.id)}
              />
              <span>{set.title}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Review mode</legend>
        <div className="jp-mode-picker">
          {modes.map((option) => (
            <button
              type="button"
              className="secondary"
              key={option.id}
              aria-pressed={mode === option.id}
              onClick={() => setMode(option.id)}
            >
              {option.title}
            </button>
          ))}
        </div>
      </fieldset>
      {mode === 'typing' && (
        <label className="jp-script-picker">
          Type with
          <select
            value={script}
            onChange={(event) =>
              setScript(event.target.value as 'kana' | 'romaji')
            }
          >
            <option value="kana">Kana</option>
            <option value="romaji">Romaji</option>
          </select>
        </label>
      )}
      <div className="jp-review-start">
        <span>
          {selectedWords.length} words · {due} new or due
        </span>
        <button
          className="primary"
          onClick={start}
          disabled={!selectedWords.length}
        >
          Start review <Icon name="arrow" size={16} />
        </button>
      </div>
      <p className="source-meta">
        Review stores the word, result and difficulty. Your typed response is
        not saved.
      </p>
    </section>
  );
}

export default function Japanese({
  initialSection = 'this-week',
  initialSets = japaneseWeek.sets,
}: {
  initialSection?: JapaneseSection;
  initialSets?: JapaneseSet[];
}) {
  const state = useLearner();
  const [section, setSection] = useState<JapaneseSection>(initialSection);
  const [sets, setSets] = useState<JapaneseSet[]>(initialSets);
  const [wordAnchor, setWordAnchor] = useState('');
  const [reading, setReading] = useState<JapaneseReadingMode>('kana-romaji');
  const [kana, setKana] = useState({ code: '03042', step: 0 });
  const accountScope = state.user?.id ?? 'guest';
  useEffect(() => {
    const readRoute = () => {
      const params = new URLSearchParams(location.search);
      const view = params.get('view');
      setSection(
        sections.find((section) => section.id === view)?.id ?? initialSection,
      );
      const selected = params
        .get('sets')
        ?.split(',')
        .filter((set): set is JapaneseSet =>
          japaneseSets.some((item) => item.id === set),
        );
      setSets(params.has('sets') ? (selected ?? []) : initialSets);
      const anchor = location.hash.slice(1);
      setWordAnchor(
        japaneseWords.some((word) => word.id === anchor) ? anchor : '',
      );
    };
    readRoute();
    window.addEventListener('popstate', readRoute);
    window.addEventListener('hashchange', readRoute);
    try {
      const saved = localStorage.getItem('atlas:japanese-reading');
      if (readingModes.some((mode) => mode.id === saved))
        setReading(saved as JapaneseReadingMode);
    } catch {
      /* The reading mode remains available in memory. */
    }
    return () => {
      window.removeEventListener('popstate', readRoute);
      window.removeEventListener('hashchange', readRoute);
    };
  }, [initialSection, initialSets]);
  useEffect(() => {
    if (section !== 'vocabulary' || !wordAnchor) return;
    const target = document.getElementById(wordAnchor);
    if (!target?.classList.contains('jp-word-row')) return;
    // Query-driven views mount after hydration, so the browser's initial hash
    // scroll can run before the vocabulary row exists.
    const frame = requestAnimationFrame(() => {
      const topbar = document.querySelector('.topbar')?.getBoundingClientRect();
      const offset =
        topbar && topbar.width >= innerWidth - 1 ? topbar.height + 16 : 32;
      window.scrollTo({
        top: scrollY + target.getBoundingClientRect().top - offset,
        behavior: 'instant',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [section, sets, wordAnchor, state.ready]);
  function navigate(next: JapaneseSection, nextSets = sets) {
    const destination = new URL(url('courses/japanese/'), location.origin);
    destination.searchParams.set('view', next);
    if (next === 'vocabulary' || next === 'review')
      destination.searchParams.set('sets', nextSets.join(','));
    history.pushState(null, '', destination);
    setSection(next);
    setSets(nextSets);
    setWordAnchor('');
  }
  function changeReading(value: JapaneseReadingMode) {
    setReading(value);
    try {
      localStorage.setItem('atlas:japanese-reading', value);
    } catch {
      /* No persistent preference is required to read. */
    }
  }
  return (
    <div className="japanese-screen course-screen" data-course="japanese">
      <header className="course-heading">
        <CourseMark course="japanese" />
        <div>
          <p className="meta">McNeill-sensei</p>
          <h1>Introductory Japanese 11</h1>
        </div>
      </header>
      <nav className="jp-navigation" aria-label="Japanese sections">
        {sections.map((tab) => (
          <a
            key={tab.id}
            href={url(`courses/japanese/?view=${tab.id}`)}
            aria-current={section === tab.id ? 'page' : undefined}
            data-atlas-feature={
              tab.id === 'review'
                ? 'japanese-review'
                : tab.id === 'vocabulary'
                  ? 'japanese-vocabulary'
                  : tab.id === 'kana' || tab.id === 'grammar'
                    ? tab.id
                    : undefined
            }
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                navigate(tab.id);
              }
            }}
          >
            {tab.title}
          </a>
        ))}
      </nav>
      <div className="jp-display">
        <label htmlFor="jp-reading-mode">Reading display</label>
        <select
          id="jp-reading-mode"
          value={reading}
          onChange={(event) =>
            changeReading(event.target.value as JapaneseReadingMode)
          }
        >
          {readingModes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.title}
            </option>
          ))}
        </select>
      </div>
      <div className="jp-content">
        {section === 'this-week' && (
          <>
            <section className="jp-week">
              <p className="eyebrow">Current class focus</p>
              <h2>{japaneseWeek.title}</h2>
              <p>{japaneseWeek.focus}</p>
              <div className="jp-week-actions">
                <button
                  className="primary"
                  onClick={() => navigate('review', japaneseWeek.sets)}
                >
                  Review this week <Icon name="arrow" size={16} />
                </button>
                <button
                  className="quiet"
                  onClick={() => navigate('vocabulary', japaneseWeek.sets)}
                >
                  See the word list <Icon name="arrow" size={16} />
                </button>
              </div>
            </section>
            <div className="jp-week-sets">
              {japaneseWeek.sets.map((set) => (
                <button key={set} onClick={() => navigate('vocabulary', [set])}>
                  <span>
                    <strong>
                      {japaneseSets.find((s) => s.id === set)?.title}
                    </strong>
                    <small>
                      {japaneseWords.filter((word) => word.set === set).length}{' '}
                      class words
                    </small>
                  </span>
                  <Icon name="arrow" size={18} />
                </button>
              ))}
            </div>
            <section className="jp-week-kana">
              <div>
                <p className="eyebrow">Handwriting in class</p>
                <h3 lang="ja">あ い う え お</h3>
                <p className="muted">
                  Five vowel sounds. Follow the strokes, then write them on
                  paper.
                </p>
              </div>
              <button className="secondary" onClick={() => navigate('kana')}>
                Open kana <Icon name="arrow" size={16} />
              </button>
            </section>
            <p className="source-meta">
              Weekly focus follows the class material. New lists can be added
              without replacing earlier words.
            </p>
          </>
        )}
        {section === 'vocabulary' && (
          <>
            <div className="jp-section-heading">
              <div>
                <h2>Vocabulary</h2>
                <p className="muted">
                  The class forms, grouped by how you use them.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() => navigate('review', sets)}
              >
                Review these words <Icon name="arrow" size={16} />
              </button>
            </div>
            <div
              className="jp-vocab-groups"
              role="group"
              aria-label="Vocabulary sets"
            >
              {vocabularySets.map((set) => (
                <button
                  className="secondary"
                  key={set.id}
                  aria-pressed={sets.includes(set.id)}
                  onClick={() => {
                    const next = sets.includes(set.id)
                      ? sets.filter((item) => item !== set.id)
                      : [...sets, set.id];
                    navigate('vocabulary', next);
                  }}
                >
                  {set.title}
                  <small>
                    {japaneseWords.filter((word) => word.set === set.id).length}
                  </small>
                </button>
              ))}
            </div>
            {sets.length ? (
              <WordList sets={sets} reading={reading} />
            ) : (
              <p className="muted">Choose one or more word groups.</p>
            )}
            {sets.includes('classroom') && (
              <details className="jp-source-note">
                <summary>About the shortened class expressions</summary>
                <p>
                  The class sheet shortens two requests. The full polite phrases
                  are <span lang="ja">もういちどいってください</span> (please
                  say it again) and{' '}
                  <span lang="ja">もっとゆっくりはなしてください</span> (please
                  speak more slowly). The list above keeps the class forms.
                </p>
              </details>
            )}
            {sets.includes('greetings') && (
              <details className="jp-source-note">
                <summary>About the class farewell spelling</summary>
                <p>
                  The photographed farewell line has an extra え after
                  じゃあまたね. The list uses the usual short form じゃあまたね;
                  check the teacher’s intended model if it is assessed.
                </p>
              </details>
            )}
          </>
        )}
        {section === 'kana' && (
          <>
            <div className="jp-section-heading">
              <div>
                <h2>Kana</h2>
                <p className="muted">In class · the five vowel characters</p>
              </div>
              <button
                className="secondary"
                onClick={() => navigate('review', ['vowels'])}
              >
                Review vowels <Icon name="arrow" size={16} />
              </button>
            </div>
            <KanaStage
              code={kana.code}
              step={kana.step}
              onChange={(code, step) => setKana({ code, step })}
            />
            <a
              className="jp-print-link"
              href={url('downloads/hiragana-vowels-practice.pdf')}
              download
            >
              Printable four-square practice <Icon name="external" size={15} />
            </a>
            <section className="jp-kana-reference">
              <h3>Hiragana by row</h3>
              <p className="muted">
                A reference for reading the word lists. Only the vowel row is
                confirmed in class handwriting so far.
              </p>
              {japaneseKanaRows.map((row) => (
                <details key={row.id}>
                  <summary>
                    <span>{row.label}</span>
                    <span lang="ja">{[...row.characters].join(' ')}</span>
                    <small>
                      {row.id === 'vowels' ? 'In class' : 'Reference'}
                    </small>
                  </summary>
                  <div className="jp-kana-row">
                    {row.kana.map((character) => (
                      <div key={character.character}>
                        <strong lang="ja">{character.character}</strong>
                        <span>{character.reading}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
              <a
                className="quiet"
                href="https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Japan Foundation · pronunciation & writing reference{' '}
                <Icon name="external" size={15} />
              </a>
            </section>
          </>
        )}
        {section === 'grammar' && (
          <>
            <h2>Grammar</h2>
            {japaneseGrammar.length ? (
              japaneseGrammar.map((lesson) => (
                <section className="jp-grammar-lesson" key={lesson.id}>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.explanation}</p>
                  {lesson.examples.map((example, index) => (
                    <div key={index}>
                      <JapaneseText form={example.sentence} reading={reading} />
                      <p>{example.sentence.meaning}</p>
                      <div className="jp-sentence-parts">
                        {example.parts.map((part, index) => (
                          <div key={index}>
                            <JapaneseText form={part.form} reading={reading} />
                            <small>{part.role}</small>
                            <p>{part.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))
            ) : (
              <p className="muted">
                The first grammar sheet hasn’t been added yet. Class sentence
                patterns and their explanations will appear here when the
                material arrives.
              </p>
            )}
            <section className="jp-familiar-piece">
              <p className="eyebrow">A familiar piece from your expressions</p>
              <h3 lang="ja">ございます</h3>
              {japanesePhraseConnections.map((connection) => (
                <div key={connection.component}>
                  <p>{connection.meaning}</p>
                  <div className="jp-phrase-pairs">
                    {connection.examples.map((example) => {
                      const word = japaneseWords.find(
                        (word) => word.japanese === example,
                      )!;
                      const base = example.replace('ございます', '');
                      return (
                        <div key={example}>
                          <div className="jp-phrase-parts" lang="ja">
                            <span>{base}</span>
                            <span>ございます</span>
                          </div>
                          {reading !== 'japanese' && (
                            <small className="jp-romaji">{word.romaji}</small>
                          )}
                          <p>{word.meaning}</p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="quiet"
                    onClick={() => navigate('vocabulary', ['greetings'])}
                  >
                    Back to greetings <Icon name="arrow" size={15} />
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
        {section === 'review' && (
          <Review
            key={`${accountScope}-${sets.join(',')}`}
            initialSets={sets}
            reading={reading}
          />
        )}
        {section === 'resources' && (
          <>
            <h2>Class material</h2>
            <p className="muted">
              The source lists and reference material behind this course.
            </p>
            <div className="jp-materials">
              {japaneseMaterials.map((material) => (
                <a
                  key={material.id}
                  href={url(
                    `courses/japanese/?view=${japaneseMaterialDestination(material.id)}`,
                  )}
                >
                  <span>
                    <strong>{material.title}</strong>
                    <small>
                      {material.kind === 'notes'
                        ? 'Class notes / reference'
                        : 'Class material'}
                    </small>
                  </span>
                  <Icon name="arrow" size={17} />
                </a>
              ))}
            </div>
            <div className="jp-external-resources">
              <h3>Language reference</h3>
              <a
                href="https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Japan Foundation · kana sounds & writing{' '}
                <Icon name="external" size={15} />
              </a>
              <a
                href="https://marugoto.jpf.go.jp/en/e-learning/index.html"
                target="_blank"
                rel="noreferrer"
              >
                Japan Foundation · beginner resources{' '}
                <Icon name="external" size={15} />
              </a>
            </div>
            <details className="jp-source-note">
              <summary>Numbers, money & Japan context</summary>
              <p>
                Use the money packet’s printed exchange rate for its exercises.
                It is a classroom assumption. The map material identifies
                Hokkaidō, Honshū, Shikoku and Kyūshū; use the original map to
                locate them.
              </p>
            </details>
            <p className="source-meta">
              These tools support independent study. Write your own assessed
              class work.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
