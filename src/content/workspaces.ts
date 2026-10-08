import {
  assignments,
  concepts,
  courses,
  coverageItems,
  editions,
  schedule,
} from './catalog';
import type { Assignment, ScheduleEvent } from '../core/schema';
import { prerequisitePath } from '../core/learning';
export const workspaceCourses = [
  'physics',
  'chemistry',
  'life-sciences',
  'japanese',
].map((id) => courses.find((c) => c.id === id)!);
export const unitTitle = (course: string, unit: string) =>
  courses
    .find((c) => c.id === course)
    ?.units.find((u) => u.id === unit)
    ?.title.split(' · ')
    .at(-1) ?? unit;
export const unitLabel = (course: string, unit: string) => {
  const title =
    courses.find((c) => c.id === course)?.units.find((u) => u.id === unit)
      ?.title ?? '';
  return title.includes(' · ') ? title.split(' · ')[0] : '';
};
export const unitUrl = (course: string, unit: string, view = 'materials') =>
  `courses/${course}/units/${unit}/${view === 'classwork' ? '?view=classwork' : ''}`;
export const unitTopics = (course: string, unit: string) =>
  concepts.filter(
    (c) => c.course === course && c.unit === unit && c.status === 'publishable',
  );
export const unitItems = (course: string, unit: string) =>
  coverageItems.filter((c) => c.course === course && c.unit === unit);
export const unitDescriptions: Record<string, string> = {
  'basic-skills':
    'A few tools you’ll use every time: units, algebra and graph slopes.',
  kinematics: 'Describe how things move, from direction to free fall.',
  measurement: 'Make numbers, units and precision work together.',
  atomic: 'Get to know the atom, then follow its electrons.',
  bonding: 'Why atoms attract, bond and interact.',
  shape: 'Turn an electron picture into a three-dimensional molecule.',
  classification: 'Read the relationships between living things.',
  origins: 'Use fossils and other evidence to understand the history of life.',
  microorganisms:
    'Viruses, bacteria and disease. Open the class resources as this unit begins.',
  writing: 'Match the written form to the sound, one small piece at a time.',
  greetings: 'Useful words and phrases for everyday situations.',
  numbers:
    'Build and recall the numbers used in class, including irregular readings.',
  colours:
    'Connect the colour and shape words, then recall them independently.',
  matter:
    'Use the matter notes and supplied lab preparation beside the original instructions.',
};
const titles: Record<string, string> = {
  'vector-sign': 'Direction',
  displacement: 'Position & displacement',
  velocity: 'Velocity',
  acceleration: 'Acceleration',
  'motion-graphs': 'Motion graphs',
  'kinematic-equations': 'Equations of motion',
  'free-fall': 'Free fall',
  'algebra-rearrangement': 'Rearranging equations',
  'physics-units': 'Units',
  'graph-slope': 'Slope',
  fossilization: 'Fossils',
  'relative-dating': 'Relative dating',
  'half-life': 'Half-life',
  'geologic-time': 'Geologic time',
  'early-earth': 'Early Earth',
  endosymbiosis: 'Endosymbiosis',
  'evolution-patterns': 'Patterns of evolution',
};
export const topicTitle = (id: string) =>
  titles[id] ?? concepts.find((c) => c.id === id)?.title ?? id;
export const assignmentUnits: Record<string, string> = {
  'kinematics-review': 'kinematics',
  'electronic-structure': 'atomic',
  'c17-research': 'origins',
  'greetings-practice': 'greetings',
  ...Object.fromEntries(assignments.map((a) => [a.id, a.unit ?? ''])),
};
export const assignmentTitles: Record<string, string> = {};
export const assignmentTitle = (id: string) =>
  assignmentTitles[id] ?? assignments.find((a) => a.id === id)?.title ?? id;
export function learningPlan(a: Assignment) {
  const required = new Set([...a.prerequisites, ...a.concepts]);
  return [
    ...new Set(
      [...required].flatMap((id) =>
        prerequisitePath(id, concepts).filter((p) => required.has(p)),
      ),
    ),
  ];
}
export const teacherUnitResources: Record<
  string,
  { title: string; url: string }[]
> = {
  classification: [
    {
      title: 'Classification · class resources',
      url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification',
    },
    {
      title: 'Dichotomous key assignment',
      url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/dichotomous-key-asst',
    },
    {
      title: 'Cladograms',
      url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/cladograms',
    },
  ],
  origins: [
    {
      title: 'Origins · class resources',
      url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c17-origins',
    },
  ],
  microorganisms: [
    {
      title: 'Viruses & bacteria · teacher guide',
      url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c19-microbes',
    },
  ],
};
export const eventTitle = (e: ScheduleEvent) =>
  ({
    'c17-test-oct7': 'C17 test',
    'c19-quiz-oct9': 'C19 quiz',
    'c19-research': 'C19 research',
    'chem-quiz-oct5': 'Trends & bonding quiz',
  })[e.id] ?? e.title.replace(' · no classes', '');
export function eventUnit(e: ScheduleEvent) {
  if (e.id.startsWith('c19')) return 'microorganisms';
  return (
    concepts.find((c) => e.concepts.includes(c.id))?.unit ??
    editions.find((x) => x.course === e.course)?.currentUnit
  );
}
export function eventNote(e: ScheduleEvent) {
  if (!e.start)
    return 'I’m still checking the test date. It may be Oct. 7 or 9; check the classroom board.';
  if (e.id.startsWith('c19'))
    return 'I haven’t added Chapter 19 yet. Use the teacher’s guide for now.';
  if (e.id === 'chem-test-oct16')
    return 'I have the date, but I’m still checking exactly what’s on it. You can review the material we’ve covered.';
  if (e.id === 'physics-quiz-oct6')
    return 'A formula sheet is allowed. Practise choosing and using the right equation.';
  if (e.id === 'anime-project') return 'I haven’t added the rubric yet.';
  return e.notes
    .replace('Teacher scope includes', 'Includes')
    .replace('School holiday in the approved district calendar.', 'No classes.')
    .replace('No classes; teacher calendar snapshot.', 'No classes.');
}
export const eventPath = (e: ScheduleEvent) =>
  e.assignment
    ? `work/${e.assignment}/`
    : e.type === 'test' || e.type === 'quiz'
      ? `prepare/${e.id}/`
      : e.course
        ? unitUrl(e.course, eventUnit(e)!, 'classwork')
        : `calendar/?date=${e.start ?? ''}`;
export type SearchResult = {
  group: 'Learn' | 'Classwork' | 'Other';
  title: string;
  detail: string;
  path: string;
  course?: string;
};
const normalize = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\-–—·/]+/g, '');
export function searchAtlas(
  query: string,
  selected = workspaceCourses.map((c) => c.id),
): SearchResult[] {
  const needle = normalize(query.trim());
  if (!needle) return [];
  const matches = (s: string) => normalize(s).includes(needle);
  const topics = concepts.filter(
    (c) =>
      selected.includes(c.course) &&
      matches(
        [
          c.title,
          topicTitle(c.id),
          c.formula ?? '',
          ...c.aliases,
          ...c.annotations.map((a) => a.term),
        ].join(' '),
      ),
  );
  const topicIds = new Set(topics.map((c) => c.id));
  const results: SearchResult[] = topics.map((c) => ({
    group: 'Learn',
    title: topicTitle(c.id),
    detail: `${courses.find((x) => x.id === c.course)!.shortTitle} · ${unitTitle(c.course, c.unit)}`,
    path: `learn/${c.id}/`,
    course: c.course,
  }));
  for (const a of assignments.filter((a) => selected.includes(a.course)))
    if (
      matches(
        `${a.title} ${a.summary} ${a.tasks.map((t) => t.title).join(' ')}`,
      ) ||
      a.concepts.some((id) => topicIds.has(id))
    )
      results.push({
        group: 'Classwork',
        title: assignmentTitle(a.id),
        detail: unitTitle(a.course, assignmentUnits[a.id]),
        path: `work/${a.id}/`,
        course: a.course,
      });
  for (const c of workspaceCourses.filter((c) => selected.includes(c.id))) {
    for (const u of c.units)
      if (matches(u.title))
        results.push({
          group: 'Other',
          title: unitTitle(c.id, u.id),
          detail: c.shortTitle,
          path: unitUrl(c.id, u.id),
          course: c.id,
        });
    const edition = editions.find((e) => e.course === c.id)!;
    if (matches(`${c.title} ${edition.teacher} resources`))
      results.push({
        group: 'Other',
        title: `${c.shortTitle} resources`,
        detail: edition.teacher,
        path: `courses/${c.id}/?resources=1`,
        course: c.id,
      });
    for (const resource of c.units.flatMap(
      (u) => teacherUnitResources[u.id] ?? [],
    ))
      if (matches(resource.title))
        results.push({
          group: 'Other',
          title: resource.title,
          detail: c.shortTitle,
          path: resource.url,
          course: c.id,
        });
  }
  for (const e of schedule.filter(
    (e) => !e.course || selected.includes(e.course),
  ))
    if (
      matches(`${e.title} ${e.start ?? ''}`) ||
      e.concepts.some((id) => topicIds.has(id))
    )
      results.push({
        group: 'Other',
        title: eventTitle(e),
        detail: e.start ?? 'Date to confirm',
        path: eventPath(e),
        course: e.course,
      });
  return results;
}
