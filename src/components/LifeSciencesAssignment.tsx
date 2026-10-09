import { useEffect, useMemo, useState } from 'react';
import { assignments } from '../content/catalog';
import {
  lifeCourseUrl,
  lifeMaterials,
  lifeQuestions,
  lifeQuestionIdea,
  lifeQuestionHelp,
  lifeIdeaPath,
  lifeMaterialPath,
} from '../content/life-sciences';
import { url } from '../client/store';
import { Icon } from './Icons';
import {
  LifeNavigation,
  LifeMaterialList,
  LifeNotesLink,
} from './LifeSciences';
import LifeIdeaVisual from './LifeIdeaVisual';
import '../styles/life-sciences.css';

export default function LifeSciencesAssignment({
  id,
  material: materialId,
}: {
  id?: string;
  material?: string;
}) {
  const [focused, setFocused] = useState('');
  const material =
    lifeMaterials.find((m) => m.id === materialId) ??
    (id === 'c17-research'
      ? lifeMaterials.find((m) => m.id === 'bio-c17-nova')
      : undefined);
  const original = assignments.find(
    (a) => a.id === (material?.assignment ?? id),
  );
  const questions = useMemo(
    () => (material ? lifeQuestions(material) : []),
    [material],
  );
  useEffect(() => {
    delete document.documentElement.dataset.pendingQuestion;
    const reveal = () => {
      const checkpoint = decodeURIComponent(location.hash.slice(1));
      if (questions.some((q) => q.id === checkpoint)) {
        setFocused(checkpoint);
        const target = document.getElementById(checkpoint);
        requestAnimationFrame(() => target?.scrollIntoView({ block: 'start' }));
      } else if (
        !material &&
        original?.companionQuestions?.some((q) => q.id === checkpoint)
      ) {
        const destination = lifeMaterials.find(
          (m) =>
            m.assignment === original.id && m.questions.includes(checkpoint),
        );
        if (destination)
          location.replace(
            url(`${lifeMaterialPath(destination.id)}#${checkpoint}`),
          );
      }
    };
    reveal();
    addEventListener('hashchange', reveal);
    return () => removeEventListener('hashchange', reveal);
  }, [material, original, questions]);
  if (!material)
    return (
      <div className="life-screen" data-course="life-sciences">
        <div className="breadcrumbs">
          <a href={url('courses/life-sciences/')}>
            <Icon name="back" size={16} />
            Life Sciences
          </a>
        </div>
        <header className="life-page-heading">
          <p className="meta">Mr. Bleecker</p>
          <h1>
            {id?.includes('notes')
              ? 'Class notes'
              : (original?.title ?? 'Life Sciences material')}
          </h1>
        </header>
        <LifeNavigation current="assignments" />
        {id?.includes('notes') ? (
          <LifeNotesLink />
        ) : (
          <>
            <p className="muted">
              Choose the separate assignment you’re working on.
            </p>
            <LifeMaterialList assignment={id} />
          </>
        )}
      </div>
    );
  const sections = [...new Set(questions.map((q) => q.section))];
  return (
    <div className="life-screen life-assignment" data-course="life-sciences">
      <div className="breadcrumbs">
        <a href={url(`courses/life-sciences/units/${material.unit}/`)}>
          <Icon name="back" size={16} />
          {material.unit === 'origins' ? 'Chapter 17' : 'Chapter 18'}
        </a>
      </div>
      <header className="life-page-heading">
        <p className="meta">Mr. Bleecker · Life Sciences 11</p>
        <h1>{material.title}</h1>
        <p className="muted">{material.detail}</p>
      </header>
      <LifeNavigation current="assignments" />
      {(material.originalUrl || original?.originalUrl) && (
        <a
          className="life-source-link"
          href={material.originalUrl ?? original?.originalUrl}
          target="_blank"
          rel="noreferrer"
          data-atlas-feature="notes"
        >
          Original class material
          <Icon name="external" size={15} />
        </a>
      )}
      {material.kind === 'reference' ? (
        <section className="life-reference">
          <p>{material.availability}</p>
          <a href={url(lifeIdeaPath())}>
            Related key ideas
            <Icon name="arrow" size={16} />
          </a>
          <a href={lifeCourseUrl} target="_blank" rel="noreferrer">
            Mr. Bleecker’s course site
            <Icon name="external" size={15} />
          </a>
        </section>
      ) : material.kind === 'video' ? (
        <>
          <p className="life-assignment-intro">
            Use the original handout beside the video. The timestamps help you
            find the evidence; write short facts on your paper.
          </p>
          <div className="life-video-links">
            <a
              href="https://www.youtube.com/watch?v=IuqmtcogwsE"
              target="_blank"
              rel="noreferrer"
            >
              Watch NOVA
              <Icon name="external" size={15} />
            </a>
            <small>A checked filled version is not available yet.</small>
          </div>
          {sections.map((section) => (
            <section className="life-video-section" key={section}>
              <h2>{section}</h2>
              {questions
                .filter((q) => q.section === section)
                .map((q) => (
                  <article className="life-video-question" id={q.id} key={q.id}>
                    <span className="life-question-number">{q.number}</span>
                    <div>
                      <h3>{q.prompt}</h3>
                      <p>{q.asking}</p>
                    </div>
                  </article>
                ))}
            </section>
          ))}
        </>
      ) : (
        <>
          <p className="life-assignment-intro">
            Keep your original assignment beside you. Open the question you need
            help with, then write your answer on your paper.
          </p>
          <div className="life-questions">
            {questions.map((q) => {
              const idea = lifeQuestionIdea(q);
              const help = lifeQuestionHelp[q.id];
              const include = help?.include ??
                q.checklist ?? [
                  'Answer each part asked in the original question.',
                  'Give a reason or evidence when requested.',
                ];
              return (
                <details
                  className="life-question"
                  id={q.id}
                  key={q.id}
                  open={focused === q.id}
                  onToggle={(e) => {
                    if (e.currentTarget.open && focused !== q.id)
                      setFocused(q.id);
                  }}
                >
                  <summary>
                    <span className="life-question-number">
                      {q.number.includes('.')
                        ? q.number.split('.').at(-1)
                        : q.number}
                    </span>
                    <span>{q.prompt}</span>
                    <span className="life-disclosure" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="life-question-body">
                    <p className="life-asking">
                      <strong>What it’s asking</strong>
                      {q.asking}
                    </p>
                    {idea && (
                      <a
                        className="life-main-idea"
                        href={url(lifeIdeaPath(idea.id))}
                        data-atlas-feature="key-ideas"
                        onClick={() =>
                          dispatchEvent(
                            new CustomEvent('atlas:product-event', {
                              detail: {
                                type: 'key_idea_opened',
                                course: 'life-sciences',
                                feature: 'key-ideas',
                                concept: idea.concept,
                                material: material.assignment,
                              },
                            }),
                          )
                        }
                      >
                        Main idea
                        <Icon name="arrow" size={13} />
                        {idea.title}
                      </a>
                    )}
                    <p>{help?.simple ?? q.hints[0]}</p>
                    {q.id === 'q-17-2-4' && <LifeIdeaVisual kind="symbiosis" />}
                    <div className="life-answer-needs">
                      <p className="meta">Your answer needs</p>
                      <ul>
                        {include.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
