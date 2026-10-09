import { useEffect, useState } from 'react';
import {
  lifeIdeas,
  lifeIdeaBacklinks,
  lifeIdeaPath,
  lifeMaterialPath,
} from '../content/life-sciences';
import { url } from '../client/store';
import { Icon } from './Icons';
import { LifeNavigation, LifeNotesLink } from './LifeSciences';
import LifeIdeaVisual from './LifeIdeaVisual';
import '../styles/life-sciences.css';

export default function LifeSciencesIdeas() {
  const [query, setQuery] = useState('');
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!lifeIdeas.some((i) => i.id === id)) return;
      setQuery('');
      requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target instanceof HTMLDetailsElement) {
          target.open = true;
          target.scrollIntoView({ block: 'start' });
        }
      });
    };
    reveal();
    addEventListener('hashchange', reveal);
    return () => removeEventListener('hashchange', reveal);
  }, []);
  const visible = lifeIdeas.filter((i) =>
    `${i.title} ${i.simple}`.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = [...new Set(visible.map((i) => i.group))];
  return (
    <div className="life-screen" data-course="life-sciences">
      <header className="life-page-heading">
        <p className="meta">Life Sciences 11</p>
        <h1>Key ideas</h1>
        <p className="muted">
          The small ideas behind the work. Open just the one you need.
        </p>
      </header>
      <LifeNavigation current="key-ideas" />
      <label className="life-idea-search">
        <Icon name="search" size={18} />
        <span className="sr-only">Find a key idea</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an idea…"
        />
      </label>
      {groups.map((group) => (
        <section className="life-idea-group" key={group}>
          <h2>{group}</h2>
          {visible
            .filter((i) => i.group === group)
            .map((i) => {
              const backlinks = lifeIdeaBacklinks(i.id);
              return (
                <details
                  className="life-idea"
                  id={i.id}
                  key={i.id}
                  onToggle={(event) => {
                    if (event.currentTarget.open)
                      dispatchEvent(
                        new CustomEvent('atlas:product-event', {
                          detail: {
                            type: 'key_idea_opened',
                            course: 'life-sciences',
                            feature: 'key-ideas',
                            concept: i.concept,
                          },
                        }),
                      );
                  }}
                >
                  <summary>
                    <span>{i.title}</span>
                    <span className="life-disclosure" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="life-idea-body">
                    <p>{i.simple}</p>
                    {i.cue && <p className="life-idea-cue">{i.cue}</p>}
                    <LifeIdeaVisual kind={i.visual} />
                    {!!i.related?.length && (
                      <div className="life-related">
                        <span className="meta">Related</span>
                        {i.related.map((id) => (
                          <a key={id} href={url(lifeIdeaPath(id))}>
                            {lifeIdeas.find((item) => item.id === id)?.title}
                            <Icon name="arrow" size={13} />
                          </a>
                        ))}
                      </div>
                    )}
                    {backlinks.length > 0 && (
                      <div className="life-backlinks">
                        <p className="meta">In your work</p>
                        {backlinks.map(({ material, question }) => (
                          <a
                            href={url(
                              `${lifeMaterialPath(material.id)}#${question.id}`,
                            )}
                            key={`${material.id}-${question.id}`}
                          >
                            {material.title} · {question.number}
                            <Icon name="arrow" size={13} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
        </section>
      ))}
      {!visible.length && (
        <p className="muted">No matching key ideas. Try a shorter word.</p>
      )}
      <LifeNotesLink />
    </div>
  );
}
