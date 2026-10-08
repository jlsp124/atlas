import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.iso.date();
export const courseSchema = z.object({
  id,
  title: z.string(),
  shortTitle: z.string(),
  symbol: z.string(),
  description: z.string(),
  units: z.array(
    z.object({
      id,
      title: z.string(),
      status: z.enum(['current', 'review', 'upcoming']),
    }),
  ),
});
export const editionSchema = z.object({
  id,
  course: id,
  teacher: z.string(),
  term: z.string(),
  period: z.number().int().min(1).max(4),
  start: date,
  end: date,
  status: z.enum(['active', 'archived']),
  verified: date,
  currentUnit: id,
  notes: z.string(),
  resources: z.array(z.url()),
});
export const sourceSchema = z.object({
  id,
  title: z.string(),
  type: z.enum([
    'vault-notes',
    'teacher-site',
    'teacher-calendar',
    'reference',
    'original',
  ]),
  url: z.url().optional(),
  reference: z.string().optional(),
  author: z.string(),
  checked: date,
  rights: z.enum(['link-only', 'original', 'licensed']),
  status: z.enum(['checked', 'unavailable', 'snapshot']),
  notes: z.string(),
});
export const conceptSchema = z.object({
  id,
  course: id,
  unit: id,
  title: z.string(),
  kind: z.enum(['concept', 'procedure', 'vocabulary', 'kana', 'situation']),
  model: z.string().min(15),
  why: z.string().min(20),
  representation: z.string(),
  formula: z.string().optional(),
  example: z.object({ prompt: z.string(), steps: z.array(z.string()).min(1) }),
  trap: z.string(),
  prerequisites: z.array(id),
  depth: z.enum(['core', 'preview', 'optional']),
  memorize: z.string(),
  derive: z.string(),
  reference: z.string(),
  review: z.array(z.string()),
  deeper: z.string(),
  aliases: z.array(z.string()),
  annotations: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
      concept: id.optional(),
    }),
  ),
  sources: z.array(id).min(1),
  status: z.enum(['draft', 'reviewed', 'publishable']),
});
export const edgeSchema = z.object({
  from: id,
  to: id,
  type: z.enum([
    'requires',
    'causes',
    'explains',
    'leads-to',
    'represented-by',
    'used-in',
    'contrasts-with',
    'example-of',
    'part-of',
    'commonly-confused-with',
    'preview-of',
    'means',
    'written-as',
    'pronounced-as',
    'situation-fit',
    'formal-version-of',
  ]),
  reason: z.string(),
});
export const questionSchema = z.object({
  id,
  course: id,
  unit: id,
  concepts: z.array(id).min(1),
  coverage: z.array(id).min(1),
  level: z.enum(['recognition', 'construction', 'transfer']),
  purpose: z.enum([
    'diagnostic',
    'teaching-check',
    'mastery',
    'transfer',
    'retention',
    'coverage',
  ]),
  format: z.enum(['choice', 'text', 'numeric']),
  archetype: id,
  prompt: z.string(),
  choices: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string()), z.number()]),
  unitLabel: z.string().optional(),
  tolerance: z.number().nonnegative().optional(),
  precision: z.enum(['significant-figures', 'decimal-places']).optional(),
  notation: z.literal('scientific').optional(),
  explanation: z.string(),
  hint: z.string(),
  diagnosis: id,
  sources: z.array(id).min(1),
  status: z.enum(['draft', 'reviewed', 'publishable']),
  template: z
    .enum(['velocity', 'acceleration', 'conversion', 'half-life'])
    .optional(),
});
export const coverageSchema = z.object({
  id,
  course: id,
  unit: id,
  concept: id,
  title: z.string(),
  required: z.boolean(),
  type: z.enum([
    'concept',
    'term',
    'procedure',
    'representation',
    'convention',
    'edge-item',
    'preview',
  ]),
  sources: z.array(id).min(1),
});
export const companionQuestionSchema = z.object({
  id,
  number: z.string(),
  section: z.string(),
  prompt: z.string(),
  asking: z.string(),
  concepts: z.array(id).min(1),
  input: z.enum(['choice', 'numeric', 'text', 'japanese']),
  choices: z.array(z.string()).optional(),
  clues: z.array(z.object({ word: z.string(), explanation: z.string() })),
  steps: z.array(z.object({ title: z.string(), text: z.string() })),
  hints: z.array(z.string()).min(1),
  example: z.string(),
  repair: z.object({
    prompt: z.string(),
    choices: z.array(z.string()),
    answer: z.string(),
    explanation: z.string(),
  }),
  answer: z
    .object({
      value: z.union([z.string(), z.number()]),
      accepted: z.array(z.string()).optional(),
      unit: z.string().optional(),
      directions: z.array(z.string()).optional(),
      tolerance: z.number().optional(),
      origin: z.enum(['teacher', 'atlas', 'student']),
      reasoning: z.string(),
      commonMistake: z.string(),
    })
    .optional(),
  checklist: z.array(z.string()).optional(),
});
export type CompanionQuestion = z.infer<typeof companionQuestionSchema>;
export const assignmentSchema = z.object({
  id,
  course: id,
  edition: id,
  title: z.string(),
  teacher: z.string(),
  assigned: date.optional(),
  due: date.optional(),
  status: z.enum(['current', 'past', 'upcoming']),
  summary: z.string(),
  tasks: z
    .array(z.object({ id, title: z.string(), instructions: z.string() }))
    .min(1),
  concepts: z.array(id).min(1),
  prerequisites: z.array(id),
  sources: z.array(id).min(1),
  difficulty: z.array(z.string()),
  rights: z.literal('original-companion'),
  originalUrl: z.url().optional(),
  originalAvailability: z.string(),
  notes: z.string(),
  unit: id.optional(),
  materialSet: id.optional(),
  kind: z
    .enum([
      'notes',
      'worksheet',
      'textbook',
      'lab',
      'review',
      'resource',
      'independent-study',
      'formal-assignment',
    ])
    .optional(),
  assistance: z.enum(['allowed', 'independent-only']).optional(),
  questionReferences: z.array(z.string()).optional(),
  companionQuestions: z.array(companionQuestionSchema).optional(),
  reading: z
    .array(
      z.object({
        heading: z.string(),
        text: z.string(),
        concepts: z.array(id),
      }),
    )
    .optional(),
  download: z.string().optional(),
});
export const scheduleSchema = z.object({
  id,
  course: id.optional(),
  edition: id.optional(),
  title: z.string(),
  type: z.enum([
    'test',
    'quiz',
    'assignment',
    'project',
    'research',
    'holiday',
    'milestone',
  ]),
  start: date.optional(),
  end: date.optional(),
  dateNote: z.string().optional(),
  confidence: z.enum(['teacher-confirmed', 'student-confirmed', 'unverified']),
  status: z.enum(['scheduled', 'date-unconfirmed', 'past']),
  sources: z.array(id).min(1),
  verified: date,
  notes: z.string(),
  concepts: z.array(id),
  assignment: id.optional(),
  public: z.literal(true),
});
export type Course = z.infer<typeof courseSchema>;
export type Edition = z.infer<typeof editionSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type Edge = z.infer<typeof edgeSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CoverageItem = z.infer<typeof coverageSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type ScheduleEvent = z.infer<typeof scheduleSchema>;

const base = { id: z.uuid(), device: z.uuid(), at: z.iso.datetime() };
export const eventSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...base,
      type: z.literal('assignment_progress'),
      payload: z
        .object({
          assignment: id,
          status: z.enum(['not-started', 'in-progress', 'complete']),
          question: id.optional(),
          step: z.number().int().min(0).max(100).optional(),
          done: z.boolean().optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('material_completed'),
      payload: z.object({ assignment: id, done: z.boolean() }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('checkpoint_saved'),
      payload: z
        .object({
          assignment: id,
          checkpoint: id,
          value: z.string().max(8000),
          unit: z.string().max(80),
          direction: z.string().max(80),
          step: z.number().int().min(0).max(100),
          help: z.boolean(),
          complete: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('question_answered'),
      payload: z
        .object({
          question: id,
          concept: id,
          correct: z.boolean(),
          hints: z.number().int().min(0).max(10),
          seed: z.number().int().nonnegative(),
          durationMs: z.number().int().min(0).max(3600000),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.enum([
        'concept_marked_confused',
        'concept_self_reported_known',
        'lesson_viewed',
      ]),
      payload: z.object({ concept: id }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('assignment_task'),
      payload: z
        .object({ assignment: id, task: id, done: z.boolean() })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('difficulty_rated'),
      payload: z
        .object({
          assignment: id,
          checkpoint: id,
          concept: id,
          rating: z.enum(['easy', 'okay', 'hard']),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('companion_attempt'),
      payload: z
        .object({
          assignment: id,
          question: id,
          concept: id,
          correct: z.boolean(),
          hints: z.number().int().min(0).max(10),
          revealed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('companion_help'),
      payload: z
        .object({
          assignment: id,
          question: id,
          concept: id,
          action: z.enum([
            'asking',
            'hint',
            'example',
            'explanation',
            'reveal',
          ]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('courses_selected'),
      payload: z.object({ courses: z.array(id).max(30) }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal('theme_changed'),
      payload: z
        .object({ theme: z.enum(['system', 'light', 'dark']) })
        .strict(),
    })
    .strict(),
]);
export type LearnerEvent = z.infer<typeof eventSchema>;
export type EvidenceState =
  'unseen' | 'exposed' | 'developing' | 'stable' | 'review due' | 'conflict';
