import { chemistryLabs } from '../content/chemistry-labs';
import { useClassSource } from '../client/class-source';
import { url } from '../client/store';
import { Icon } from './Icons';
import { ChemistryNavigation } from './Chemistry';
import ReadableText from './ReadableText';
import ClassNoteCopy from './ClassNoteCopy';
import LabCurves from './LabCurves';

export default function ChemLab({ id }: { id: string }) {
  const lab = chemistryLabs.find((l) => l.id === id)!,
    archive = useClassSource(id);
  const list = (items: string[]) => (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <ReadableText text={item} />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="chem-screen chem-lab" data-course="chemistry">
      <div className="breadcrumbs">
        <a href={url('courses/chemistry/?view=labs')}>
          <Icon name="back" size={16} />
          Labs
        </a>
      </div>
      <p className="meta">
        {lab.source} · pp.{lab.pages}
      </p>
      <h1>
        Lab {lab.number} · {lab.title}
      </h1>
      <ChemistryNavigation view="labs" />
      <p className="chem-intro">{lab.purpose}</p>
      <p className="chem-source-note">
        The real sheet controls the procedure. These captures are undated;
        confirm the class timing.
      </p>
      <nav className="chem-lab-navigation" aria-label="Lab stages">
        <a href="#before">Before</a>
        <a href="#during">During</a>
        <a href="#after">After</a>
      </nav>
      <section id="before" className="chem-lab-stage">
        <h2>Before</h2>
        <h3>The chemistry</h3>
        {list(lab.chemistry)}
        <h3>What you’ll do</h3>
        {list(lab.before)}
        <details className="lab-safety">
          <summary>Handling points from the instructions</summary>
          {list(lab.safety)}
        </details>
        <h3>Expected chemistry</h3>
        <p className="lab-evidence-note">
          These are theoretical expectations. Your actual observation can differ
          and must stay in your report.
        </p>
        {lab.expected.map((expected) => (
          <section className="lab-expected" key={expected.label}>
            <h4>{expected.label}</h4>
            <p>
              <ReadableText text={expected.text} />
            </p>
            {expected.equation && (
              <p className="lab-equation">
                <ReadableText text={expected.equation} />
              </p>
            )}
            {expected.sources.map((source, i) => (
              <a href={source} key={source} target="_blank" rel="noreferrer">
                {expected.sources.length > 1
                  ? `Research source ${i + 1}`
                  : 'Research source'}{' '}
                <Icon name="external" size={12} />
              </a>
            ))}
          </section>
        ))}
      </section>
      <section id="during" className="chem-lab-stage">
        <h2>During</h2>
        <h3>What to watch for</h3>
        {list(lab.during)}
        <h3>What to record</h3>
        {list(lab.record)}
      </section>
      <section id="after" className="chem-lab-stage">
        <h2>After</h2>
        <p>
          Use the evidence in your notebook. If a result differs from the
          expectation, explain the difference; keep the original observation.
        </p>
        {archive?.source && (
          <details className="lab-observed-copy">
            <summary>Your captured observations · private owner copy</summary>
            <p className="lab-evidence-note">
              Actual recorded observations, not shared expected results.
            </p>
            <ClassNoteCopy source={archive.source} />
          </details>
        )}
        {lab.questions.map((q) => (
          <details
            className="chem-lab-question"
            id={'q-' + q.number.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
            key={q.number}
          >
            <summary>
              <span className="meta">{q.number}</span>
              <span>{q.prompt}</span>
              <span aria-hidden="true">+</span>
            </summary>
            <div>
              <p>
                <ReadableText text={q.help} />
              </p>
              {q.needsData && (
                <p className="lab-data-needed">
                  <strong>Use your data:</strong> {q.needsData}
                </p>
              )}
            </div>
          </details>
        ))}
        {id === 'chemistry-lab-2b' && <LabCurves />}
      </section>
      <details className="chem-lab-references">
        <summary>Chemistry research sources</summary>
        {lab.references.map((r) => (
          <p key={r.url}>
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.title} <Icon name="external" size={14} />
            </a>
          </p>
        ))}
      </details>
    </div>
  );
}
