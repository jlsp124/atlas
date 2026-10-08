import type { Assignment, LearnerEvent } from './schema';
import { taskDone } from './learning';

export type WorkStatus = 'not-started' | 'in-progress' | 'complete';
export const statusLabel: Record<WorkStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  complete: 'Complete',
};

export function assignmentProgress(a: Assignment, events: LearnerEvent[]) {
  const entries = events.filter(
    (e) => e.type === 'assignment_progress' && e.payload.assignment === a.id,
  );
  const latest = entries.at(-1);
  const completed = new Set<string>();
  for (const e of entries) {
    if (e.type !== 'assignment_progress' || !e.payload.question) continue;
    if (e.payload.done === true) completed.add(e.payload.question);
    if (e.payload.done === false) completed.delete(e.payload.question);
  }
  const tasks = a.tasks.filter((t) => taskDone(a.id, t.id, events)).length;
  const status: WorkStatus =
    latest?.type === 'assignment_progress'
      ? latest.payload.status
      : a.tasks.length > 0 && tasks === a.tasks.length
        ? 'complete'
        : tasks ||
            events.some(
              (e) =>
                'assignment' in e.payload &&
                e.payload.assignment === a.id &&
                [
                  'companion_help',
                  'companion_attempt',
                  'difficulty_rated',
                ].includes(e.type),
            )
          ? 'in-progress'
          : 'not-started';
  const cursor = entries
    .filter((e) => e.type === 'assignment_progress' && e.payload.question)
    .at(-1);
  return {
    status,
    completed,
    question:
      cursor?.type === 'assignment_progress'
        ? cursor.payload.question
        : undefined,
    step:
      cursor?.type === 'assignment_progress' ? (cursor.payload.step ?? 0) : 0,
  };
}

export function questionStep(
  assignment: string,
  question: string,
  events: LearnerEvent[],
) {
  const latest = events
    .filter(
      (e) =>
        e.type === 'assignment_progress' &&
        e.payload.assignment === assignment &&
        e.payload.question === question,
    )
    .at(-1);
  return latest?.type === 'assignment_progress'
    ? (latest.payload.step ?? 0)
    : 0;
}

/** Self-rated recall is scheduled independently of demonstrated mastery. */
export function reviewDue(
  assignment: string,
  question: string,
  events: LearnerEvent[],
  now = Date.now(),
) {
  const rating = events
    .filter(
      (e) =>
        e.type === 'difficulty_rated' &&
        e.payload.assignment === assignment &&
        e.payload.checkpoint === question,
    )
    .at(-1);
  const attempt = events
    .filter(
      (e) =>
        e.type === 'companion_attempt' &&
        e.payload.assignment === assignment &&
        e.payload.question === question,
    )
    .at(-1);
  if (
    attempt?.type === 'companion_attempt' &&
    (!attempt.payload.correct ||
      attempt.payload.hints > 0 ||
      attempt.payload.revealed) &&
    (!rating || attempt.at > rating.at)
  )
    return true;
  if (rating?.type !== 'difficulty_rated') return true;
  const interval = { hard: 10 * 60000, okay: 86400000, easy: 4 * 86400000 };
  return now >= Date.parse(rating.at) + interval[rating.payload.rating];
}

export function dueQuestions(
  a: Assignment,
  events: LearnerEvent[],
  now = Date.now(),
) {
  return (a.companionQuestions ?? [])
    .filter((q) => reviewDue(a.id, q.id, events, now))
    .sort((first, second) => {
      const priority = (question: string) => {
        const attempt = events
          .filter(
            (e) =>
              e.type === 'companion_attempt' &&
              e.payload.assignment === a.id &&
              e.payload.question === question,
          )
          .at(-1);
        const rating = events
          .filter(
            (e) =>
              e.type === 'difficulty_rated' &&
              e.payload.assignment === a.id &&
              e.payload.checkpoint === question,
          )
          .at(-1);
        if (
          attempt?.type === 'companion_attempt' &&
          (!attempt.payload.correct ||
            attempt.payload.hints > 0 ||
            attempt.payload.revealed) &&
          (!rating || attempt.at > rating.at)
        )
          return 0;
        return rating?.type === 'difficulty_rated'
          ? { hard: 1, okay: 3, easy: 4 }[rating.payload.rating]
          : 2;
      };
      return priority(first.id) - priority(second.id);
    });
}
