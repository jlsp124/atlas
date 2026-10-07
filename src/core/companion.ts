import type { CompanionQuestion, LearnerEvent } from './schema';
import { normalizeAnswer } from './learning';
import { vectorFeedback } from '../content/teacher-profiles';

export function checkCompanionAnswer(
  question: CompanionQuestion,
  value: string,
  unit = '',
  direction = '',
) {
  if (!question.answer)
    return {
      correct: null,
      feedback:
        'Compare your explanation with the checklist. Atlas cannot mark this written answer automatically.',
    };
  const answer = question.answer;
  if (question.input === 'numeric') {
    const parsed = value.trim().replace(/−/g, '-');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(parsed))
      return {
        correct: false,
        feedback:
          'Enter a number, then add its unit and direction where asked.',
      };
    const numeric = Number(parsed);
    const expected = Number(answer.value);
    if (answer.directions?.length) {
      const feedback = vectorFeedback(
        numeric,
        expected,
        direction,
        answer.directions,
        answer.tolerance,
      );
      if (feedback) return { correct: false, feedback };
    } else if (
      Math.abs(numeric - expected) >
      (answer.tolerance ?? 0.005) *
        Math.max(Number.EPSILON * 8, Math.abs(expected))
    )
      return { correct: false, feedback: question.hints[0] };
    const aliases: Record<string, string> = {
      'm/s^2': 'm/s²',
      'm/s2': 'm/s²',
      seconds: 's',
      sec: 's',
      metres: 'm',
      meters: 'm',
    };
    if ((aliases[unit.trim()] ?? unit.trim()) !== (answer.unit ?? ''))
      return {
        correct: false,
        feedback:
          'Your number is right. Check the unit for the quantity the question asks for.',
      };
    return {
      correct: true,
      feedback:
        'That matches. Check your written setup and significant figures before boxing the answer.',
    };
  }
  const expected = [answer.value, ...(answer.accepted ?? [])]
    .map(String)
    .map(normalizeAnswer);
  const correct = expected.includes(normalizeAnswer(value));
  return { correct, feedback: correct ? 'That matches.' : question.hints[0] };
}

export function latestDifficulty(
  assignment: string,
  checkpoint: string,
  events: LearnerEvent[],
) {
  const last = events
    .filter(
      (event) =>
        event.type === 'difficulty_rated' &&
        event.payload.assignment === assignment &&
        event.payload.checkpoint === checkpoint,
    )
    .at(-1);
  return last?.type === 'difficulty_rated' ? last.payload.rating : undefined;
}
export function difficultyLabel(rating?: 'easy' | 'okay' | 'hard') {
  return rating === 'hard'
    ? 'You marked this hard'
    : rating === 'okay'
      ? 'Worth reviewing'
      : rating === 'easy'
        ? 'Feels solid'
        : 'Haven’t seen this yet';
}
export function repairStage(attempts: number) {
  return attempts < 2 ? 'hint' : 'tiny-check';
}
