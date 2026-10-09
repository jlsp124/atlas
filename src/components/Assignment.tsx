import { useEffect, useState } from 'react';
import AssignmentWorkspace from './AssignmentWorkspace';
import LegacyAssignment from './LegacyAssignment';
import { assignments } from '../content/catalog';
import PhysicsNotes from './PhysicsNotes';
import PhysicsLab from './PhysicsLab';
import PhysicsPacket from './PhysicsPacket';
import LifeSciencesAssignment from './LifeSciencesAssignment';

export default function Assignment({ id }: { id: string }) {
  const [savedFocus, setSavedFocus] = useState(false);
  useEffect(() => {
    setSavedFocus(new URLSearchParams(location.search).get('focus') === '1');
  }, []);
  const a = assignments.find((a) => a.id === id)!;
  if (a.course === 'life-sciences') return <LifeSciencesAssignment id={id} />;
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
