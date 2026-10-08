import type { Assignment } from '../core/schema';
import { url } from '../client/store';
import { unitTitle, unitUrl } from '../content/workspaces';
import { packetGuides } from '../content/physics-packets';
import ReadableText from './ReadableText';
import PhysicsPrompt from './PhysicsPrompt';
import { Icon } from './Icons';
export default function PhysicsPacket({
  assignment: a,
}: {
  assignment: Assignment;
}) {
  return (
    <div className="physics-packet" data-course="physics">
      <div className="breadcrumbs">
        <a href={url(unitUrl('physics', a.unit!))}>
          <Icon name="back" size={16} />
          {unitTitle('physics', a.unit!)}
        </a>
        <span>/</span>
        <span>Assignments</span>
      </div>
      <h1>{a.title}</h1>
      <p className="packet-source-note">
        Reference key for the captured topics and page ranges. The original
        pages and complete blank wording are unavailable here, so this is an
        original explanation alongside your sheet. Unverified blanks and figures
        are identified below.
      </p>
      {a.companionQuestions?.map((q) => (
        <section className="packet-section" id={q.id} key={q.id}>
          <h2>
            {q.number.includes('–')
              ? 'Pages'
              : q.number === '8.1'
                ? 'Section'
                : 'Page'}{' '}
            {q.number}
          </h2>
          {packetGuides[a.id]?.[q.id]?.map((p, i) => (
            <div
              className={
                p.title === 'Source needed' ? 'packet-gap' : 'packet-answer'
              }
              key={i}
            >
              <h3>{p.title}</h3>
              <p>
                <ReadableText text={p.text} />
              </p>
              {p.title !== 'Source needed' && (
                <p className="packet-key">
                  <ReadableText text={p.write ?? ''} />
                </p>
              )}
            </div>
          ))}
          <PhysicsPrompt
            prompt={`Help me with Mr. Wadson’s Physics 11 ${a.title}, ${q.number}. First ask for a clear picture of the actual page and any graph/table (including axis labels, units, scales and all subquestions). Wait for it before solving missing numerical parts. The source Atlas has does not include the complete original page. Use my picture to identify the exact blanks/questions in order; explain the words, values, right/up-positive signs, formula, substitution and final direction. Use Δd for displacement and Wadson’s supplied formula sheet. Do not invent coordinates, teacher wording or precision requirements, or create extra exercises. Help fill or solve the real sheet one part at a time.`}
          />
        </section>
      ))}
    </div>
  );
}
