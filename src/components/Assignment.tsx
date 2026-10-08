import { useEffect, useState } from 'react';
import AssignmentWorkspace from './AssignmentWorkspace';
import LegacyAssignment from './LegacyAssignment';

export default function Assignment({ id }: { id: string }) {
  const [savedFocus, setSavedFocus] = useState(false);
  useEffect(() => {
    setSavedFocus(new URLSearchParams(location.search).get('focus') === '1');
  }, []);
  // Preserve focused links and answer drafts from the previous published release.
  return savedFocus ? (
    <LegacyAssignment id={id} />
  ) : (
    <AssignmentWorkspace id={id} />
  );
}
