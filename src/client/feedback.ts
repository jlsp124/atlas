import { assignments, concepts, courses } from '../content/catalog';
import { assignmentUnits, unitTitle } from '../content/workspaces';
import { base } from './store';

export type FeedbackKind = 'bug' | 'feature' | 'assignment-help';
export type FeedbackContext = {
  course?: string;
  trail: string[];
  page: string;
};

// Capture public navigation context only. Never read inputs, answers or user data.
export function feedbackContext(): FeedbackContext {
  const location = new URL(window.location.href);
  const path = location.pathname.slice(base.length).replace(/^\//, '');
  const parts = path.split('/');
  const assignment =
    parts[0] === 'work'
      ? assignments.find((a) => a.id === parts[1])
      : undefined;
  const concept =
    parts[0] === 'learn' ? concepts.find((c) => c.id === parts[1]) : undefined;
  const course = courses.find(
    (c) => c.id === (assignment?.course ?? concept?.course ?? parts[1]),
  );
  const unit = assignment
    ? assignmentUnits[assignment.id]
    : (concept?.unit ?? (parts[2] === 'units' ? parts[3] : undefined));
  const trail: string[] = course ? [course.shortTitle] : [];
  if (course && unit) trail.push(unitTitle(course.id, unit));
  if (assignment) trail.push(assignment.title);
  if (concept) trail.push(concept.title);
  const question = assignment?.companionQuestions?.find(
    (q) => '#' + q.id === location.hash,
  );
  let suffix = '';
  if (question) {
    trail.push(`Question ${question.number}`);
    suffix = location.hash;
    const step = Number(location.searchParams.get('step'));
    const title = document.querySelector('.step-narration h3')?.textContent;
    if (
      location.searchParams.has('step') &&
      Number.isSafeInteger(step) &&
      step >= 0 &&
      step <= 100 &&
      title
    ) {
      trail.push(`Step ${step + 1}: ${title}`);
      suffix = `?step=${step}${suffix}`;
    }
  }
  if (!trail.length)
    trail.push(
      (
        {
          '': 'Home',
          courses: 'Your courses',
          calendar: 'Calendar',
          account: 'Your setup',
          help: 'Help',
          about: 'About atlas',
        } as Record<string, string>
      )[parts[0]] ?? 'Atlas',
    );
  return { course: course?.id, trail, page: location.pathname + suffix };
}

export function feedbackMessage(context: FeedbackContext, text: string) {
  return `${text.trim()}\n\nAtlas context\n${context.trail.join(' → ')}\n${context.page}`;
}

export function openFeedback(kind?: FeedbackKind) {
  window.dispatchEvent(new CustomEvent('atlas:feedback', { detail: { kind } }));
}
