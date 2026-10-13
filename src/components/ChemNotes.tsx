import type { Assignment } from '../core/schema';
import { useClassSource } from '../client/class-source';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
import ClassNoteCopy from './ClassNoteCopy';

export default function ChemNotes({
  assignment: a,
}: {
  assignment: Assignment;
}) {
  const archive = useClassSource(a.id),
    source = archive?.source,
    state = useLearner();
  return (
    <div className="chem-screen chem-notes" data-course="chemistry">
      <div className="breadcrumbs">
        <a href={url(`courses/chemistry/units/${a.unit}/?view=notes`)}>
          <Icon name="back" size={16} />
          Notes
        </a>
      </div>
      <h1>{source?.title ?? a.title}</h1>
      {source ? (
        <>
          <p className="source-meta">
            Class sheet · captured {source.captured}
            {source.status === 'partial-transcription'
              ? ' · source gaps preserved'
              : ''}
          </p>
          {source.gaps.length > 0 && (
            <details className="source-gaps">
              <summary>Parts missing or unclear in this source</summary>
              <ul>
                {source.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </details>
          )}
          <ClassNoteCopy source={source} />
        </>
      ) : (
        <div className="notes-source-state">
          <p>
            Faithful class-sheet transcriptions are kept in the private owner
            archive. Clear handwritten fills are retained; unsupported blanks
            stay blank.
          </p>
          {state.user?.role !== 'admin' ? (
            <a className="secondary" href={url('account/')}>
              Sign in to open the available class copy
            </a>
          ) : (
            <p>
              {archive?.missing
                ? 'The private copy could not be loaded. The class-source server or this sheet is currently unavailable.'
                : 'Loading the private class copy…'}
            </p>
          )}
          <p>{a.originalAvailability}</p>
          <p>{a.notes}</p>
          <a
            href="https://mrstcote.wordpress.com/"
            target="_blank"
            rel="noreferrer"
          >
            Mrs. Cote’s class resources <Icon name="external" size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
