import type { Assignment } from '../core/schema';
import { url, useLearner } from '../client/store';
import { usePhysicsSource } from '../client/physics-source';
import { unitTitle, unitUrl } from '../content/workspaces';
import ReadableText from './ReadableText';
import { Icon } from './Icons';

export default function PhysicsNotes({
  assignment: a,
}: {
  assignment: Assignment;
}) {
  const state = useLearner();
  const archive = usePhysicsSource(a.id),
    source = archive?.source;
  return (
    <div className="physics-notes" data-course="physics">
      <div className="breadcrumbs">
        <a href={url(unitUrl('physics', a.unit!))}>
          <Icon name="back" size={16} />
          {unitTitle('physics', a.unit!)}
        </a>
        <span>/</span>
        <span>Notes</span>
      </div>
      <h1>{source?.title ?? a.title}</h1>
      {source ? (
        <>
          <p className="source-meta">
            Class sheet · captured {source.captured}
            {source.status === 'partial-transcription'
              ? ' · partial transcription'
              : ''}
          </p>
          {source.gaps.length > 0 && (
            <details className="source-gaps">
              <summary>Parts missing from this source</summary>
              <ul>
                {source.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </details>
          )}
          <article className="class-note-copy">
            {source.sections.map((section, i) => (
              <section key={i}>
                <h2>{section.heading}</h2>
                <p>
                  <ReadableText text={section.text} />
                </p>
              </section>
            ))}
          </article>
        </>
      ) : (
        <div className="notes-source-state">
          <p>
            A complete, word-for-word copy of this sheet is not available in the
            published source. The original class notes remain the source for its
            wording and blanks.
          </p>
          {state.user?.role !== 'admin' && (
            <p>
              The captured class archive is private.{' '}
              <a href={url('account/')}>Sign in to your owner account</a> to
              open the transcriptions that are available.
            </p>
          )}
          <a
            className="secondary"
            href="https://cwadson.wixsite.com/mrwadson/physics-11-1"
            target="_blank"
            rel="noreferrer"
          >
            Wadson’s class resources <Icon name="external" size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
