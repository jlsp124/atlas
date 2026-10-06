import { useEffect, useRef, useState } from 'react';
import type { Core } from 'cytoscape';
import { concepts, edges, questions } from '../content/catalog';
import { evidence, prerequisitePath } from '../core/learning';
import { useLearner, url, track } from '../client/store';

export default function Graph({
  course,
  unit,
  focus,
}: {
  course: string;
  unit?: string;
  focus?: string;
}) {
  const state = useLearner();
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<Core | null>(null);
  const eventEvidence = useRef(state.events);
  eventEvidence.current = state.events;
  const [chosen, setChosen] = useState(focus);
  const [filter, setFilter] = useState('connections');
  const [loaded, setLoaded] = useState(false);
  let nodes = concepts.filter(
    (c) => c.course === course && (!unit || c.unit === unit),
  );
  if (focus) {
    const related = new Set([
      focus,
      ...prerequisitePath(focus, concepts),
      ...concepts
        .filter((c) => c.prerequisites.includes(focus))
        .map((c) => c.id),
    ]);
    nodes = concepts.filter((c) => related.has(c.id));
  }
  if (filter === 'prerequisites' && chosen) {
    const set = new Set(prerequisitePath(chosen, concepts));
    nodes = nodes.filter((c) => set.has(c.id));
  }
  if (filter === 'unlocks' && chosen)
    nodes = nodes.filter(
      (c) => c.id === chosen || c.prerequisites.includes(chosen),
    );
  const ids = nodes.map((c) => c.id);
  const selected = concepts.find((c) => c.id === chosen);
  const signature = ids.join('|');
  useEffect(() => {
    let gone = false;
    let dispose = () => {};
    if (!container.current) return;
    void import('cytoscape')
      .then(({ default: cytoscape }) => {
        if (gone || !container.current) return;
        const cy = cytoscape({
          container: container.current,
          elements: [
            ...nodes.map((c) => ({
              data: {
                id: c.id,
                label:
                  c.title.length > 28 ? c.title.slice(0, 27) + '…' : c.title,
                state: evidence(c.id, eventEvidence.current, questions).state,
              },
            })),
            ...edges
              .filter((e) => ids.includes(e.from) && ids.includes(e.to))
              .map((e, i) => ({
                data: {
                  id: `edge-${i}`,
                  source: e.type === 'requires' ? e.to : e.from,
                  target: e.type === 'requires' ? e.from : e.to,
                  label: e.type === 'requires' ? 'builds toward' : e.type,
                },
              })),
          ],
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#dce8e0',
                label: 'data(label)',
                'font-family': 'Inter, Yu Gothic, sans-serif',
                'font-size': 11,
                color: '#18332a',
                'text-valign': 'center',
                'text-halign': 'center',
                width: 140,
                height: 46,
                shape: 'round-rectangle',
                'text-wrap': 'wrap',
                'text-max-width': '125px',
              },
            },
            {
              selector: 'node[state="stable"]',
              style: { 'background-color': '#256247', color: '#fff' },
            },
            {
              selector: 'node[state="conflict"]',
              style: { 'background-color': '#eed3ae' },
            },
            {
              selector: 'edge',
              style: {
                width: 1.3,
                'line-color': '#9baa9d',
                'target-arrow-color': '#9baa9d',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
              },
            },
            {
              selector: ':selected',
              style: { 'border-width': 2, 'border-color': '#226048' },
            },
          ],
          layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 28,
            spacingFactor: 1.2,
          },
          minZoom: 0.25,
          maxZoom: 2,
          wheelSensitivity: 0.15,
        });
        cy.on('tap', 'node', (event) => setChosen(event.target.id()));
        graph.current = cy;
        dispose = () => {
          cy.destroy();
          graph.current = null;
        };
        setLoaded(true);
        track('graph_opened', course, focus);
      })
      .catch(() => setLoaded(false));
    return () => {
      gone = true;
      dispose();
    };
    // Node signatures control layout; selection never restarts a force animation.
  }, [signature, course, focus]);
  useEffect(() => {
    graph.current?.nodes().forEach((node) => {
      node.data('state', evidence(node.id(), state.events, questions).state);
    });
  }, [state.events, loaded]);
  return (
    <div className="graph-block" id="map">
      <div className="section-heading">
        <h2>How it connects</h2>
        <label className="small">
          Show{' '}
          <select
            aria-label="Graph relationship filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="connections">Connections</option>
            <option value="prerequisites">Prerequisites</option>
            <option value="unlocks">What this unlocks</option>
            <option value="traps">Common traps</option>
          </select>
        </label>
      </div>
      <div
        className="graph-canvas"
        ref={container}
        role="img"
        aria-label="Interactive concept relationship map. Use the accessible list below for keyboard navigation."
      />
      {!loaded && (
        <p className="small muted">
          The relationship list below is always available.
        </p>
      )}
      {selected && (
        <div className="graph-inspector">
          <strong>{selected.title}</strong>
          <span className="badge">
            {evidence(selected.id, state.events, questions).state}
          </span>
          <p>{filter === 'traps' ? selected.trap : selected.model}</p>
          <ul className="semantic-relationships">
            {edges
              .filter((e) => e.from === selected.id || e.to === selected.id)
              .map((e, i) => {
                const other = concepts.find(
                  (c) => c.id === (e.from === selected.id ? e.to : e.from),
                )!;
                return (
                  <li key={i}>
                    <span className="small muted">
                      {e.type.replaceAll('-', ' ')} ·{' '}
                    </span>
                    <a href={url(`concepts/${other.id}/`)}>{other.title}</a>
                    <p className="small muted">{e.reason}</p>
                  </li>
                );
              })}
          </ul>
          <div className="button-row">
            <a href={url(`concepts/${selected.id}/`)}>Open concept →</a>
            <a
              href={url(
                `courses/${selected.course}/practice/?target=${selected.id}&mode=Review%20this%20branch`,
              )}
            >
              Review this branch
            </a>
          </div>
        </div>
      )}
      <details className="relationship-list" suppressHydrationWarning>
        <summary>Concepts & relationships · accessible list</summary>
        <ul>
          {nodes.map((c) => (
            <li key={c.id}>
              <button className="link-button" onClick={() => setChosen(c.id)}>
                {c.title}
              </button>{' '}
              <span className="small muted">
                {evidence(c.id, state.events, questions).state}
              </span>
              <p className="small">
                {c.prerequisites.length
                  ? `Builds on ${c.prerequisites.map((p) => concepts.find((x) => x.id === p)?.title).join(', ')}`
                  : 'Entry concept'}{' '}
                · <a href={url(`concepts/${c.id}/`)}>Read explanation</a>
              </p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
