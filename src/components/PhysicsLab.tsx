import type { Assignment } from '../core/schema';
import { url } from '../client/store';
import { unitTitle, unitUrl } from '../content/workspaces';
import {
  formalLabFormat,
  formalLabOrder,
  physicsLabPrompt,
} from '../content/physics-labs';
import { Icon } from './Icons';
import ReadableText from './ReadableText';
import PhysicsPrompt from './PhysicsPrompt';
import TickerAnalysis from './TickerAnalysis';
export default function PhysicsLab({
  assignment: a,
}: {
  assignment: Assignment;
}) {
  const formal = a.id === 'wadson-formal-lab' || a.id === 'physics-uniform-lab';
  return (
    <div className="physics-lab" data-course="physics">
      <div className="breadcrumbs">
        <a href={url(unitUrl('physics', a.unit!))}>
          <Icon name="back" size={16} />
          {unitTitle('physics', a.unit!)}
        </a>
        <span>/</span>
        <span>Labs</span>
      </div>
      <h1>{a.title}</h1>
      {formal && (
        <section className="lab-resources">
          <h2>Your formal report</h2>
          <p>Start with the blank template and your own measurements.</p>
          <div className="resource-links">
            <a
              className="primary"
              href={url('downloads/wadson-formal-lab-template.docx')}
              download
            >
              Download editable Word template <Icon name="document" size={16} />
            </a>
            <a
              className="secondary"
              href={url('downloads/wadson-formal-lab-template.pdf')}
              target="_blank"
              rel="noreferrer"
            >
              Open fillable PDF <Icon name="document" size={16} />
            </a>
          </div>
          <p className="source-meta">
            The Word document has the title page, blank reverse, report
            sections, Times New Roman 12 pt, single spacing and 1-inch margins
            already set up. Open it in Word and write your own report. The PDF
            has fillable fields.
          </p>
        </section>
      )}
      {a.reading?.map((r) => (
        <section className="lab-instructions" key={r.heading}>
          <h2>{r.heading}</h2>
          <p>
            <ReadableText text={r.text} />
          </p>
        </section>
      ))}
      {formal && (
        <details className="formal-format">
          <summary>Wadson’s report format</summary>
          <p>{formalLabFormat}</p>
          <ol>
            {formalLabOrder.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p>
            The teacher’s boiling-point example and full original instructions
            are not included in the public archive. Use the class resource
            alongside your report.
          </p>
        </details>
      )}
      <a
        className="quiet"
        href="https://cwadson.wixsite.com/mrwadson/physics-11-1"
        target="_blank"
        rel="noreferrer"
      >
        Teacher instructions / examples <Icon name="external" size={15} />
      </a>
      <PhysicsPrompt prompt={physicsLabPrompt(a.id, a.title)} lab />
      {a.id === 'physics-ticker-lab' && <TickerAnalysis id={a.id} />}
    </div>
  );
}
