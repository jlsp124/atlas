# Japanese course experience

Japanese now has a dedicated course surface: This week, Vocabulary, Kana,
Grammar, Review and Resources. It uses the reviewed class lists rather than
the guided problem-solving shell. Physics is unchanged by this implementation.

`src/content/japanese.ts` holds a small weekly-focus object, stable vocabulary
IDs and the reading model. Change the focus’s title, source material IDs and
sets when new reviewed class material arrives. Earlier sets and review history
stay available. No weekly quiz date is inferred.

## Source coverage

The existing reviewed classroom derivative supplies 18 basic expressions,
19 classroom expressions, 20 numbers/money forms, 12 color terms, six shapes
and the five confirmed vowels. Alternate readings such as れい / ゼロ remain
available. The class sheet’s こころ shape label, abbreviated requests and
farewell spelling retain explicit context; they are not silently presented as
universal language rules.

The source audit used the canonical intake authority and permitted Japanese
course/outline notes in the private vault, along with the existing published
source identities in `classroom.json`. No private original, marked schoolwork,
personal-profile sheet or private note body is added to the public build.
The original capture registry is outside this checkout; the existing reviewed
derivative remains the publication boundary for this stage.

Only あ い う え お are confirmed taught for handwriting. The same five KanjiVG
stroke assets, attribution and printable practice file remain. Other hiragana
rows are marked as reference, with readings checked against the
[Japan Foundation kana reference](https://www.irodori.jpf.go.jp/assets/data/Kana_all.pdf).
No additional stroke assets, listening clips or learned status are invented.

No actual first grammar sheet is available. The typed grammar model supports
sentence breakdowns, roles, explanations and source material. Its lesson list
stays empty. The shared ございます piece comes from the existing reviewed class
expressions, and is shown as a familiar phrase component.

The Anime Project rubric, future vocabulary sets, new learned kana rows and
trusted audio remain source gaps.

## Reading and review

Japanese form, kana, romaji, meaning, optional kanji and optional furigana are
separate fields. One reading-display control chooses Japanese only, Kana +
romaji or Japanese + reading aids. It applies across lists and explanations.
Kana review hides the answer’s reading until the result is shown.

Review supports combined sets, all vocabulary, the current week and vowels.
Recognition and English → Japanese use choices; Japanese → English and
Japanese typing use text. Typing can use kana or romaji; alternative source
readings are accepted. Short sessions prioritize difficult/missed words and
unseen words, repeat difficult cards once, then defer recently easy cards.
The rating is personal recall evidence, not a teacher grade or handwriting
assessment.

`japanese_reviewed` events store only word ID, mode, correctness, reveal state
and Easy/Okay/Hard. They use existing guest/account storage and idempotent sync.
Typed responses remain ephemeral and are absent from progress or product
analytics. The server validates each word ID. Account scope changes reset the
review UI so one account’s live session cannot carry into another account.

Product review-start/completion events contain only course, feature, broad
scope and success metadata. Existing consent and private aggregation boundaries
apply. Resources remind students to produce their own assessed class work;
the course does not generate submitted answers.

## Verification

Unit tests cover real-list completeness, alternate readings, strict text-free
events, scoped adaptive queues and unique choices. Server tests cover accepted
word IDs, cross-device sync and rejection of unknown words or typed payloads.
Browser tests cover combined lists, display persistence, stroke controls,
grammar availability, completion metadata, guest/account isolation and sync.
The Japanese visual test saves course, kana and review screenshots for both
themes at the configured phone and desktop viewports, with accessibility and
overflow checks. Manually inspect those captures before a release.
