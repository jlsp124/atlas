import { useMemo, useState } from 'react';
import type { Assignment } from '../core/schema';
import type { Guide } from '../core/guide';
import { visualGuide } from '../core/guide';
import { assignments, concepts } from '../content/catalog';
import { useCheckpoint } from '../client/checkpoint';
import { url } from '../client/store';
import StoryStage from './teaching/StoryStage';
import KanaStage from './teaching/KanaStage';
import Sheet from './Sheet';
import LearningVisual from './LearningVisual';
import Glossary from './Glossary';
import PercentError from './PercentError';
import { Icon } from './Icons';
import { focusStage } from './teaching/focusStage';
export default function FocusReading({
  assignment: a,
  index,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  assignment: Assignment;
  index: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const r = a.reading![index],
    { draft, update, flush, ready } = useCheckpoint(a.id, `reading-${index}`);
  const [term, setTerm] = useState('');
  const guide: Guide = useMemo(
    () =>
      visualGuide(r.concepts.slice(0, 1), r.heading + ' ' + r.text) ?? {
        kind: 'reasoning',
        steps: [
          {
            id: 'idea',
            action: 'derive',
            title: r.heading,
            text: concepts.find((c) => c.id === r.concepts[0])?.model ?? r.text,
          },
          {
            id: 'connection',
            action: 'student',
            title: 'Use this on your work',
            text: 'Keep the teacher’s wording and examples in mind. Use this idea on the matching question in your material.',
          },
        ],
      },
    [r],
  );
  const position = Math.min(draft.step, guide.steps.length - 1);
  const connected = assignments
    .filter(
      (material) =>
        material.id !== a.id &&
        material.course === a.course &&
        material.unit === a.unit &&
        !['notes', 'resource'].includes(material.kind ?? '') &&
        material.concepts.some((id) => r.concepts.includes(id)),
    )
    .slice(0, 3);
  return (
    <section
      className="focus-reading"
      id={`reading-${index}`}
      data-reading={index}
    >
      <div className="focus-meta">
        <p className="eyebrow">
          {a.kind === 'notes' ? 'Notes' : 'Material & context'} · Part{' '}
          {index + 1}
        </p>
        <span className="muted">{draft.complete ? 'Done' : 'In progress'}</span>
      </div>
      <h2 className="reading-heading">
        <Glossary text={r.heading} />
      </h2>
      {a.id === 'japanese-kana' ? (
        <>
          <p>{r.text}</p>
          <KanaStage
            code={draft.unit}
            step={draft.step}
            onChange={(code, step) => update({ unit: code, step }, true)}
          />
        </>
      ) : (
        <>
          <StoryStage
            prompt={r.text}
            guide={guide}
            step={position}
            active={draft.help}
            onConcept={setTerm}
          />
          {draft.help ? (
            <nav className="guide-navigation" aria-label="Notes reasoning">
              <button
                className="secondary"
                disabled={position === 0}
                onClick={() => update({ step: position - 1 }, true)}
              >
                <Icon name="back" />
                Back step
              </button>
              <span>
                {position + 1} / {guide.steps.length}
              </span>
              <button
                className="primary"
                disabled={position === guide.steps.length - 1}
                onClick={() => update({ step: position + 1 }, true)}
              >
                Next step
                <Icon name="arrow" />
              </button>
            </nav>
          ) : (
            <button
              className="secondary"
              disabled={!ready}
              onClick={() => {
                update({ help: true, step: 0 }, true);
                focusStage();
              }}
            >
              Explain this
              <Icon name="arrow" size={16} />
            </button>
          )}
          <label className="personal-notes">
            Your notes
            <textarea
              rows={3}
              value={draft.value}
              disabled={!ready}
              maxLength={8000}
              onChange={(e) => update({ value: e.target.value })}
              onBlur={flush}
              placeholder="An example, a connection, or a reminder for your work."
            />
          </label>
        </>
      )}
      {a.id === 'physics-basic-skills' && <PercentError />}
      {connected.length > 0 && (
        <div className="note-connections">
          <p className="eyebrow">Use this in your work</p>
          {connected.map((material) => (
            <a href={url(`work/${material.id}/`)} key={material.id}>
              {material.title}
              <Icon name="arrow" size={14} />
            </a>
          ))}
        </div>
      )}
      {a.download && (
        <div className="download-links">
          <a className="secondary" href={url(a.download)} download>
            Download practice template
            <Icon name="external" size={15} />
          </a>
          {a.id === 'wadson-formal-lab' && (
            <a
              className="quiet"
              href={url('downloads/wadson-formal-lab-template.html')}
              download
            >
              Download editable lab template
            </a>
          )}
        </div>
      )}
      <div className="question-finish">
        <label>
          <input
            type="checkbox"
            checked={draft.complete}
            disabled={!ready}
            onChange={(e) => update({ complete: e.target.checked }, true)}
          />
          Mark this part done
        </label>
      </div>
      <nav className="focus-navigation" aria-label="Material parts">
        <button
          className="secondary"
          disabled={!hasPrevious}
          onClick={() => {
            flush();
            onPrevious();
          }}
        >
          <Icon name="back" />
          Previous part
        </button>
        <button
          className="primary"
          onClick={() => {
            flush();
            onNext();
          }}
        >
          {hasNext ? 'Next part' : 'Back to overview'}
          <Icon name="arrow" />
        </button>
      </nav>
      <Sheet
        open={Boolean(term)}
        title="A quick connection"
        onClose={() => setTerm('')}
      >
        <h3>{term}</h3>
        <p>
          {term === 'ございます'
            ? 'You’ve seen this polite component in おはようございます and ありがとうございます. Use the complete expression for its situation.'
            : concepts.find((c) => c.id === r.concepts[0])?.model}
        </p>
        <LearningVisual id={r.concepts[0]} />
        <button className="primary" onClick={() => setTerm('')}>
          Back to this exact note
        </button>
      </Sheet>
    </section>
  );
}
