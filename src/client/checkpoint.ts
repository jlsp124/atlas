import { useEffect, useRef, useState } from 'react';
import { emit, getState, useLearner } from './store';
import { savedCheckpoint, type CheckpointState } from '../core/materials';

// Drafts are ordinary idempotent learner events, in the existing guest/account scope.
// Debounce text, flush before navigation, and never overwrite an active local edit.
export function useCheckpoint(assignment: string, checkpoint: string) {
  const learner = useLearner();
  const owner = learner.user?.id ?? 'guest';
  const priorAttempt = learner.events
    .filter(
      (e) =>
        e.type === 'companion_attempt' &&
        e.payload.assignment === assignment &&
        e.payload.question === checkpoint,
    )
    .at(-1);
  const blank: CheckpointState = {
    assignment,
    checkpoint,
    value: '',
    unit: '',
    direction: '',
    step: 0,
    help: false,
    complete:
      priorAttempt?.type === 'companion_attempt' &&
      priorAttempt.payload.correct,
  };
  const [draft, setDraft] = useState<CheckpointState>(blank);
  const active = useRef(draft),
    dirty = useRef(false),
    last = useRef('');
  const scope = useRef(owner);
  const incoming = savedCheckpoint(assignment, checkpoint, learner.events);
  useEffect(() => {
    if (!learner.ready) return;
    if (scope.current !== owner) {
      dirty.current = false;
      scope.current = owner;
      last.current = '';
    }
    if (!dirty.current) {
      const restored = incoming ?? blank;
      const serialized = JSON.stringify(restored);
      if (last.current !== serialized) {
        active.current = restored;
        last.current = serialized;
        setDraft(restored);
      }
    }
  }, [learner.ready, owner, incoming]);
  function flush() {
    if (
      !dirty.current ||
      !getState().ready ||
      scope.current !== (getState().user?.id ?? 'guest')
    )
      return;
    dirty.current = false;
    last.current = JSON.stringify(active.current);
    emit('checkpoint_saved', active.current);
  }
  function update(patch: Partial<CheckpointState>, immediate = false) {
    const next = { ...active.current, ...patch };
    if (JSON.stringify(next) === JSON.stringify(active.current)) return;
    active.current = next;
    dirty.current = true;
    setDraft(next);
    if (immediate) flush();
  }
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(flush, 400);
    return () => window.clearTimeout(timer);
  }, [draft]);
  useEffect(() => {
    const save = () => flush();
    const hide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', hide);
    return () => {
      flush();
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [assignment, checkpoint, owner]);
  return { draft, update, flush, ready: learner.ready };
}
