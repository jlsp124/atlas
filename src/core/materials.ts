import type { Assignment, LearnerEvent } from './schema';
import { taskDone } from './learning';

export type CheckpointState = Extract<
  LearnerEvent,
  { type: 'checkpoint_saved' }
>['payload'];
export function savedCheckpoint(
  assignment: string,
  checkpoint: string,
  events: LearnerEvent[],
) {
  const event = events
    .filter(
      (e) =>
        e.type === 'checkpoint_saved' &&
        e.payload.assignment === assignment &&
        e.payload.checkpoint === checkpoint,
    )
    .at(-1);
  return event?.type === 'checkpoint_saved' ? event.payload : undefined;
}
export function materialCheckpoints(a: Assignment) {
  return [
    ...(a.companionQuestions ?? []).map((q) => ({
      id: q.id,
      label: q.number,
      title: q.prompt,
      section: q.section,
      kind: 'question' as const,
    })),
    ...(a.reading ?? []).map((r, i) => ({
      id: `reading-${i}`,
      label: String(i + 1),
      title: r.heading,
      section: a.kind === 'notes' ? 'Notes' : 'Material & context',
      kind: 'reading' as const,
    })),
  ];
}
export function checkpointComplete(
  a: Assignment,
  checkpoint: string,
  events: LearnerEvent[],
) {
  const saved = savedCheckpoint(a.id, checkpoint, events);
  if (saved) return saved.complete;
  const attempt = events
    .filter(
      (e) =>
        e.type === 'companion_attempt' &&
        e.payload.assignment === a.id &&
        e.payload.question === checkpoint,
    )
    .at(-1);
  return attempt?.type === 'companion_attempt' && attempt.payload.correct;
}
export function materialProgress(a: Assignment, events: LearnerEvent[]) {
  const checkpoints = materialCheckpoints(a);
  const completed = checkpoints.filter((q) =>
    checkpointComplete(a, q.id, events),
  ).length;
  const explicit = events
    .filter(
      (e) => e.type === 'material_completed' && e.payload.assignment === a.id,
    )
    .at(-1);
  const legacyComplete = a.tasks.every((t) => taskDone(a.id, t.id, events));
  const done =
    explicit?.type === 'material_completed'
      ? explicit.payload.done
      : legacyComplete;
  const started = events.some(
    (e) => 'assignment' in e.payload && e.payload.assignment === a.id,
  );
  return {
    completed,
    total: checkpoints.length,
    done,
    status: done ? 'Complete' : started ? 'In progress' : 'Not started',
    suggested:
      checkpoints.length > 0 && completed === checkpoints.length && !done,
  };
}
export function resumeCheckpoint(a: Assignment, events: LearnerEvent[]) {
  const ids = materialCheckpoints(a).map((q) => q.id);
  const latest = events
    .filter(
      (e) =>
        e.type === 'checkpoint_saved' &&
        e.payload.assignment === a.id &&
        ids.includes(e.payload.checkpoint),
    )
    .at(-1);
  return latest?.type === 'checkpoint_saved'
    ? latest.payload.checkpoint
    : (ids.find((id) => !checkpointComplete(a, id, events)) ?? ids[0]);
}
export function validCheckpoint(a: Assignment, checkpoint: string) {
  return (
    a.assistance !== 'independent-only' &&
    materialCheckpoints(a).some((q) => q.id === checkpoint)
  );
}
