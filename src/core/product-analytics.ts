import { z } from 'zod';
import { assignments, concepts, courses, schedule } from '../content/catalog';
import { lifeMaterials } from '../content/life-sciences';

export const productEventTypes = [
  'session_started',
  'route_viewed',
  'route_activity',
  'route_exited',
  'feature_entered',
  'feature_exited',
  'course_opened',
  'concept_opened',
  'assignment_opened',
  'assignment_completed',
  'quiz_started',
  'quiz_completed',
  'question_answered',
  'hint_used',
  'confusion_marked',
  'graph_opened',
  'graph_path_started',
  'gap_repair_started',
  'gap_repair_completed',
  'ai_prompt_copied',
  'search_performed',
  'search_zero_results',
  'request_submitted',
  'key_idea_opened',
  'notes_opened',
  'lab_opened',
  'walkthrough_started',
  'walkthrough_completed',
  'japanese_review_started',
  'japanese_review_completed',
  'client_error',
  'route_performance',
] as const;
export const productFeatures = [
  'home',
  'calendar',
  'search',
  'account',
  'help',
  'feedback',
  'assignments',
  'notes',
  'labs',
  'walkthrough',
  'key-ideas',
  'definitions',
  'japanese-this-week',
  'japanese-vocabulary',
  'japanese-review',
  'kana',
  'grammar',
  'resources',
  'tutor-help',
  'review',
  'navigation',
] as const;
export const reviewScopes = [
  'all',
  'this-week',
  'colors',
  'shapes',
  'colors-shapes',
  'greetings',
  'classroom',
  'numbers',
  'kana',
  'vowels',
  'selected',
] as const;
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export const releaseSchema = z
  .string()
  .regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}(?:-[a-z0-9.]{1,20})?$/);
export const deviceSchema = z.enum(['mobile', 'tablet', 'desktop']);
export const productMetadataSchema = z
  .object({
    course: z
      .enum(['physics', 'chemistry', 'life-sciences', 'japanese'])
      .optional(),
    material: id.optional(),
    concept: id.optional(),
    question: id.optional(),
    feature: z.enum(productFeatures).optional(),
    scope: z.enum(reviewScopes).optional(),
    success: z.boolean().optional(),
    resultBucket: z.enum(['0', '1-5', '6-20', '21+']).optional(),
    durationBucket: z
      .enum(['under-1s', '1-3s', '3-10s', '10s-plus'])
      .optional(),
    errorCode: z
      .enum([
        'runtime-error',
        'unhandled-rejection',
        'api-failed',
        'offline',
        'resource-failed',
      ])
      .optional(),
    activeSeconds: z
      .union([
        z.literal(5),
        z.literal(10),
        z.literal(15),
        z.literal(20),
        z.literal(25),
        z.literal(30),
      ])
      .optional(),
  })
  .strict();
export const productEventSchema = productMetadataSchema
  .extend({
    id: z.uuid(),
    session: z.uuid(),
    visitor: z.uuid(),
    type: z.enum(productEventTypes),
    version: releaseSchema,
    device: deviceSchema,
    consent: z.literal(true),
    route: z.string().max(200),
    previousRoute: z.string().max(200).optional(),
  })
  .strict()
  .superRefine((event, ctx) => {
    if (
      !validPublicRoute(event.route) ||
      (event.previousRoute && !validPublicRoute(event.previousRoute))
    )
      ctx.addIssue({ code: 'custom', message: 'Unknown public route' });
    if (
      event.material &&
      !assignments.some(
        (a) =>
          a.id === event.material &&
          (!event.course || a.course === event.course),
      ) &&
      !lifeMaterials.some(
        (m) =>
          m.id === event.material &&
          (!event.course || event.course === 'life-sciences'),
      )
    )
      ctx.addIssue({ code: 'custom', message: 'Unknown material' });
    if (
      event.concept &&
      !concepts.some(
        (c) =>
          c.id === event.concept &&
          (!event.course || c.course === event.course),
      )
    )
      ctx.addIssue({ code: 'custom', message: 'Unknown concept' });
    if (
      event.question &&
      (!event.material ||
        (!assignments
          .find((a) => a.id === event.material)
          ?.companionQuestions?.some((q) => q.id === event.question) &&
          !lifeMaterials
            .find((m) => m.id === event.material)
            ?.questions.includes(event.question)))
    )
      ctx.addIssue({ code: 'custom', message: 'Unknown question' });
    if (event.activeSeconds !== undefined && event.type !== 'route_activity')
      ctx.addIssue({
        code: 'custom',
        message: 'Activity requires an activity event',
      });
    if (event.type === 'route_activity' && event.activeSeconds === undefined)
      ctx.addIssue({ code: 'custom', message: 'Activity bucket required' });
  });
export type ProductEvent = z.infer<typeof productEventSchema>;
export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type ProductEventType = (typeof productEventTypes)[number];

// Only reviewed public IDs survive. URLs, queries, fragments and unknown paths do not.
export function validPublicRoute(route: string) {
  if (!/^\/[a-z0-9/-]*$/.test(route) || !route.endsWith('/')) return false;
  if (
    [
      '/',
      '/other/',
      '/courses/',
      '/calendar/',
      '/account/',
      '/help/',
      '/about/',
      '/privacy/',
      '/sources/',
      '/updates/',
      '/search/',
      '/admin/',
      '/glossary/',
      '/coverage/',
    ].includes(route)
  )
    return true;
  const parts = route.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'work')
    return assignments.some((a) => a.id === parts[1]);
  if (
    parts.length === 2 &&
    ['learn', 'practice', 'concepts'].includes(parts[0])
  )
    return concepts.some((c) => c.id === parts[1]);
  if (parts.length === 2 && parts[0] === 'prepare')
    return schedule.some((s) => s.id === parts[1]);
  if (
    parts.length === 4 &&
    parts[0] === 'courses' &&
    parts[1] === 'life-sciences' &&
    parts[2] === 'assignments'
  )
    return lifeMaterials.some((m) => m.id === parts[3]);
  if (parts[0] === 'courses' && courses.some((c) => c.id === parts[1])) {
    if (parts.length === 2) return true;
    if (parts.length === 4 && parts[2] === 'units')
      return (
        courses
          .find((c) => c.id === parts[1])
          ?.units.some((u) => u.id === parts[3]) ?? false
      );
    return (
      parts.length === 3 &&
      [
        'key-ideas',
        'review',
        'vocabulary',
        'kana',
        'grammar',
        'resources',
      ].includes(parts[2])
    );
  }
  return false;
}
export function publicRoute(path: string, base = '') {
  const stripped = path.startsWith(base + '/') ? path.slice(base.length) : path;
  const route = stripped.endsWith('/') ? stripped : stripped + '/';
  return validPublicRoute(route) ? route : '/other/';
}
export function routeMetadata(route: string): ProductMetadata {
  const parts = route.split('/').filter(Boolean);
  const material =
    parts[0] === 'work'
      ? assignments.find((a) => a.id === parts[1])
      : undefined;
  const concept = ['learn', 'practice', 'concepts'].includes(parts[0])
    ? concepts.find((c) => c.id === parts[1])
    : undefined;
  const life =
    parts[0] === 'courses' &&
    parts[1] === 'life-sciences' &&
    parts[2] === 'assignments'
      ? lifeMaterials.find((m) => m.id === parts[3])
      : undefined;
  const preparation =
    parts[0] === 'prepare'
      ? schedule.find((s) => s.id === parts[1])
      : undefined;
  const course = life
    ? 'life-sciences'
    : (material?.course ??
      concept?.course ??
      preparation?.course ??
      courses.find((c) => c.id === parts[1])?.id);
  const sectionFeature: ProductMetadata['feature'] =
    parts[0] === 'courses' && parts[1] === 'life-sciences'
      ? ({ 'key-ideas': 'key-ideas', review: 'definitions' } as const)[
          parts[2] as 'key-ideas' | 'review'
        ]
      : undefined;
  const feature: ProductMetadata['feature'] =
    sectionFeature ??
    (life
      ? 'assignments'
      : preparation
        ? 'review'
        : material
          ? material.kind === 'notes'
            ? 'notes'
            : material.kind === 'lab'
              ? 'labs'
              : 'assignments'
          : concept
            ? 'key-ideas'
            : (
                {
                  '': 'home',
                  calendar: 'calendar',
                  account: 'account',
                  help: 'help',
                  search: 'search',
                } as const
              )[parts[0] as '' | 'calendar' | 'account' | 'help' | 'search']);
  return {
    ...(course ? { course: course as ProductMetadata['course'] } : {}),
    ...(life
      ? { material: life.id }
      : material
        ? { material: material.id }
        : {}),
    ...(concept ? { concept: concept.id } : {}),
    ...(feature ? { feature } : {}),
  };
}

/** Conservative active-time estimator: inactivity beyond 60 s, hidden or unfocused pages earn zero time. */
export function activeTimeSeconds(
  previous: number,
  now: number,
  lastInteraction: number,
  visible: boolean,
  focused: boolean,
) {
  if (!visible || !focused || now - lastInteraction >= 60000) return 0;
  return Math.max(
    0,
    Math.min(
      30,
      Math.floor((Math.min(now, lastInteraction + 60000) - previous) / 5000) *
        5,
    ),
  );
}
