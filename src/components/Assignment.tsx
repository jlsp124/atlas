import { useEffect, useState } from 'react';
import AssignmentWorkspace from './AssignmentWorkspace';
import LegacyAssignment from './LegacyAssignment';
import { assignments } from '../content/catalog';
import PhysicsNotes from './PhysicsNotes';
import PhysicsLab from './PhysicsLab';
import PhysicsPacket from './PhysicsPacket';
import LifeSciencesAssignment from './LifeSciencesAssignment';
import JapaneseMaterial from './JapaneseMaterial';
import ChemAssignment from './ChemAssignment';
import ChemNotes from './ChemNotes';
import ChemLab from './ChemLab';
import { chemistryLabs } from '../content/chemistry-labs';
import { url } from '../client/store';
import { Icon } from './Icons';

export default function Assignment({ id }: { id: string }) {
  const [savedFocus, setSavedFocus] = useState(false);
  useEffect(() => {
    setSavedFocus(new URLSearchParams(location.search).get('focus') === '1');
  }, []);
  const a = assignments.find((a) => a.id === id)!;
  if (a.course === 'japanese') return <JapaneseMaterial id={id} />;
  if (a.course === 'life-sciences') return <LifeSciencesAssignment id={id} />;
  if (a.course === 'chemistry') {
    if (a.assistance === 'independent-only')
      return <ChemAssignment assignment={a} />;
    if (chemistryLabs.some((lab) => lab.id === id)) return <ChemLab id={id} />;
    if (a.kind === 'notes') return <ChemNotes assignment={a} />;
    if (a.kind === 'resource')
      return (
        <div className="chem-screen" data-course="chemistry">
          <div className="breadcrumbs">
            <a href={url('courses/chemistry/?view=notes')}>
              <Icon name="back" size={16} />
              References
            </a>
          </div>
          <h1>{a.title}</h1>
          <p>{a.originalAvailability}</p>
          <p>{a.summary}</p>
          {a.id === 'chemistry-lab-preparation' && (
            <a href={url('courses/chemistry/?view=labs')}>
              Open the actual lab sheets <Icon name="arrow" size={16} />
            </a>
          )}
          {a.originalUrl && (
            <a href={a.originalUrl} target="_blank" rel="noreferrer">
              Original resource <Icon name="external" size={16} />
            </a>
          )}
        </div>
      );
    return <ChemAssignment assignment={a} />;
  }
  if (a.course === 'physics') {
    if (a.kind === 'lab' || id === 'wadson-formal-lab')
      return <PhysicsLab assignment={a} />;
    if (a.kind === 'notes') return <PhysicsNotes assignment={a} />;
    if (
      [
        'physics-motion-packet',
        'physics-average-velocity',
        'physics-describing-acceleration',
        'physics-calculating-acceleration',
      ].includes(id)
    )
      return <PhysicsPacket assignment={a} />;
    return <AssignmentWorkspace id={id} />;
  }
  // Preserve focused links and answer drafts from the previous published release.
  return savedFocus ? (
    <LegacyAssignment id={id} />
  ) : (
    <AssignmentWorkspace id={id} />
  );
}
