import { assignments } from './catalog';
import type { CompanionQuestion } from '../core/schema';

export const lifeNotesUrl =
  'https://sites.google.com/view/ecl-life-sciences-11/notes';
export const lifeCourseUrl =
  'https://sites.google.com/view/ecl-life-sciences-11/home';

/** Presentation slices keep the existing source and checkpoint identities intact. */
export type LifeMaterial = {
  id: string;
  assignment: string;
  unit: string;
  title: string;
  detail: string;
  questions: string[];
  kind: 'questions' | 'video' | 'reference';
  originalUrl?: string;
  availability?: string;
};
const section = (
  chapter: number,
  part: number,
  detail: string,
): LifeMaterial => {
  const assignment = `bio-c${chapter}-sections`;
  return {
    id: `bio-c${chapter}-${part}`,
    assignment,
    unit: chapter === 17 ? 'origins' : 'classification',
    title: `${chapter}.${part} questions`,
    detail,
    kind: 'questions',
    questions:
      assignments
        .find((a) => a.id === assignment)
        ?.companionQuestions?.filter((q) =>
          q.id.startsWith(`q-${chapter}-${part}-`),
        )
        .map((q) => q.id) ?? [],
  };
};
export const lifeMaterials: LifeMaterial[] = [
  {
    ...section(17, 1, 'The fossil record'),
    kind: 'reference',
    availability:
      'The source inventory includes 17.1, but its numbered questions have not been reviewed for this companion. Use your textbook and the linked key ideas.',
  },
  section(17, 2, 'Earth’s early history'),
  section(17, 3, 'Evolution of multicellular life · p.434'),
  section(17, 4, 'Patterns of evolution · p.440'),
  {
    id: 'bio-c17-nova',
    assignment: 'c17-research',
    unit: 'origins',
    title: 'NOVA video questions',
    detail: 'Origins of Life & the Microscopic Revolution',
    kind: 'video',
    questions:
      assignments
        .find((a) => a.id === 'c17-research')
        ?.companionQuestions?.map((q) => q.id) ?? [],
    originalUrl:
      'https://drive.google.com/file/d/1R8D78l4DU3UM9OrzUkOVZV3o-PuXCchU/view',
  },
  {
    id: 'bio-c17-study-guide',
    assignment: 'bio-c17-sections',
    unit: 'origins',
    title: 'Chapter study guide',
    detail: 'p.442 · review reference',
    kind: 'reference',
    questions: [],
    availability:
      'The photographed study guide covers sections 17.1–17.4. Use the page beside the key ideas for a compact review.',
  },
  {
    id: 'bio-c17-assessment',
    assignment: 'bio-c17-sections',
    unit: 'origins',
    title: 'Chapter assessment',
    detail: 'pp.443–444 · available review material',
    kind: 'reference',
    questions: [],
    availability:
      'The source inventory includes pp.443–444; the vault capture confirms questions 1–26 on p.443. The whole assessment is available review material, not a confirmed assignment. Numbered help is not yet reviewed.',
  },
  {
    id: 'bio-c17-test-prep',
    assignment: 'bio-c17-sections',
    unit: 'origins',
    title: 'Standardized test prep',
    detail: 'p.445 · available review material',
    kind: 'reference',
    questions: [],
    availability:
      'p.445 is recorded in the source inventory. Its individual questions and assignment status have not been verified for this companion.',
  },
  section(18, 1, 'Finding order in diversity'),
  section(18, 2, 'Modern evolutionary classification'),
  section(18, 3, 'Kingdoms and domains'),
  {
    id: 'bio-vocabulary',
    assignment: 'bio-word-parts',
    unit: 'classification',
    title: 'Biological word parts',
    detail: 'Prefixes, roots and suffixes worksheet',
    kind: 'questions',
    questions: ['q-words'],
  },
  {
    id: 'bio-dichotomous-key',
    assignment: 'bio-classification-tools',
    unit: 'classification',
    title: 'Dichotomous key activity',
    detail: 'Identify insects and build a leaf key',
    kind: 'questions',
    questions: ['q-key-1', 'q-key-2'],
    originalUrl:
      'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/dichotomous-key-asst',
  },
  {
    id: 'bio-cladogram',
    assignment: 'bio-classification-tools',
    unit: 'classification',
    title: 'Cladogram worksheet',
    detail: 'Trait table and evolutionary relationships',
    kind: 'questions',
    questions: ['q-cladogram'],
    originalUrl:
      'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/cladograms',
  },
  {
    id: 'bio-cladogram-instructions',
    assignment: 'bio-classification-tools',
    unit: 'classification',
    title: 'How to make a cladogram',
    detail: 'Separate class reference',
    kind: 'reference',
    questions: [],
    originalUrl:
      'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/cladograms',
    availability:
      'A separate construction guide is recorded in the source inventory. Use the class resource for its original diagrams and instructions.',
  },
  {
    id: 'bio-c18-study-guide',
    assignment: 'bio-c18-sections',
    unit: 'classification',
    title: 'Chapter study guide',
    detail: 'p.466 · review reference',
    kind: 'reference',
    questions: [],
    availability:
      'Use the original p.466 beside the classification key ideas. Its individual prompts have not been reviewed for this companion.',
  },
  {
    id: 'bio-c18-assessment',
    assignment: 'bio-c18-sections',
    unit: 'classification',
    title: 'Chapter assessment',
    detail: 'p.467 · available review material',
    kind: 'reference',
    questions: [],
    availability:
      'p.467 is recorded in the source inventory. Use the original page; assignment status and numbered help are not yet confirmed.',
  },
];
export const lifeMaterialPath = (id: string) =>
  `courses/life-sciences/assignments/${id}/`;
export const lifeIdeaPath = (id?: string) =>
  `courses/life-sciences/key-ideas/${id ? `#${id}` : ''}`;
export function lifeQuestions(material: LifeMaterial) {
  return (
    assignments.find((a) => a.id === material.assignment)?.companionQuestions ??
    []
  ).filter((q) => material.questions.includes(q.id));
}

export type LifeIdea = {
  id: string;
  concept: string;
  group: string;
  unit: string;
  title: string;
  simple: string;
  cue?: string;
  visual?: 'layers' | 'half-life' | 'symbiosis' | 'evolution' | 'eras';
  related?: string[];
};
const idea = (
  id: string,
  concept: string,
  group: string,
  title: string,
  simple: string,
  options: Partial<LifeIdea> = {},
): LifeIdea => ({
  id,
  concept,
  group,
  title,
  simple,
  unit: group === 'Classification' ? 'classification' : 'origins',
  ...options,
});
export const lifeIdeas: LifeIdea[] = [
  idea(
    'early-earth',
    'early-earth',
    'Early Earth',
    'Early Earth',
    'Earth was hot and had very little free oxygen. As it cooled, a solid crust and lasting oceans could form. Those conditions were different from today.',
    { related: ['miller-urey', 'first-cells'] },
  ),
  idea(
    'miller-urey',
    'early-earth',
    'Early Earth',
    'Miller–Urey',
    'Simple chemicals plus energy can make some of life’s building blocks. The experiment made organic molecules, including amino acids. It did not make a living cell.',
    {
      cue: 'Water + methane + ammonia + hydrogen → spark energy → organic molecules',
      related: ['microspheres'],
    },
  ),
  idea(
    'microspheres',
    'early-earth',
    'Early Earth',
    'Proteinoid microspheres',
    'These are nonliving, cell-like compartments. Their boundaries let some substances through more easily than others. A boundary is useful for a cell, but a boundary alone is not life.',
    { related: ['first-cells'] },
  ),
  idea(
    'first-cells',
    'early-earth',
    'First cells',
    'Prokaryotes before eukaryotes',
    'The first cells were prokaryotes: cells without a nucleus. Eukaryotic cells, which have a nucleus, appeared later.',
    { related: ['endosymbiosis'] },
  ),
  idea(
    'oxygen',
    'early-earth',
    'First cells',
    'Oxygen: danger and opportunity',
    'Oxygen harmed many organisms that lived without it. Organisms able to use oxygen could release more energy from food. One environmental change can hurt some life and help other life.',
  ),
  idea(
    'endosymbiosis',
    'endosymbiosis',
    'First cells',
    'Endosymbiosis',
    'A larger cell kept smaller bacteria inside it. The partners survived together over many generations. The bacteria’s descendants became mitochondria and chloroplasts.',
    {
      cue: 'Own DNA, bacterial-like ribosomes and division by binary fission are clues to bacterial ancestry.',
      visual: 'symbiosis',
      related: ['mitochondria', 'chloroplasts'],
    },
  ),
  idea(
    'mitochondria',
    'endosymbiosis',
    'First cells',
    'Mitochondria',
    'Mitochondria release usable energy from food. Endosymbiotic theory connects them to oxygen-using bacteria that lived inside larger cells.',
    { related: ['endosymbiosis'] },
  ),
  idea(
    'chloroplasts',
    'endosymbiosis',
    'First cells',
    'Chloroplasts',
    'Chloroplasts carry out photosynthesis. Endosymbiotic theory connects them to photosynthetic bacteria that lived inside larger cells.',
    { related: ['endosymbiosis'] },
  ),
  idea(
    'fossilization',
    'fossilization',
    'Fossils & dating',
    'Fossilization',
    'Remains or traces can be buried by sediment and preserved as that sediment becomes rock. Most organisms never fossilize, so the fossil record has gaps.',
    { cue: 'Burial → preservation → rock formation → later exposure' },
  ),
  idea(
    'relative-dating',
    'relative-dating',
    'Fossils & dating',
    'Relative dating',
    'Relative dating puts events in order: older or younger. In undisturbed sedimentary layers, the lower layer is older. It does not give an age in years.',
    { visual: 'layers', related: ['index-fossils', 'radioactive-dating'] },
  ),
  idea(
    'index-fossils',
    'relative-dating',
    'Fossils & dating',
    'Index fossils',
    'A useful index fossil is easy to recognize, widespread and from a species that lived for a short geologic time. Finding it at two places can connect layers from the same narrow time interval.',
    { related: ['relative-dating'] },
  ),
  idea(
    'radioactive-dating',
    'half-life',
    'Fossils & dating',
    'Radioactive dating',
    'Radioactive atoms change at a known rate. Measuring the parent atoms left can help estimate an age in years, with the right material and assumptions. Suitable nearby rocks can date a fossil’s layer.',
    { related: ['half-life'] },
  ),
  idea(
    'half-life',
    'half-life',
    'Fossils & dating',
    'Half-life',
    'A half-life is the time for half the remaining parent atoms to decay. The amount halves again each equal interval.',
    {
      visual: 'half-life',
      cue: 'Age = number of half-lives × length of one half-life',
      related: ['radioactive-dating'],
    },
  ),
  idea(
    'geologic-time',
    'geologic-time',
    'History of life',
    'Eras & periods',
    'Eras are large parts of geologic time; periods are smaller parts inside them. Earth is about 4.6 billion years old. The class uses Paleozoic → Mesozoic → Cenozoic as its main era anchors.',
    { visual: 'eras' },
  ),
  idea(
    'macroevolution',
    'evolution-patterns',
    'Evolution',
    'Macroevolution',
    'Macroevolution means large-scale evolutionary patterns across species and long spans of time. Extinction and adaptive radiation are two such patterns.',
    { related: ['extinction', 'adaptive-radiation'] },
  ),
  idea(
    'extinction',
    'evolution-patterns',
    'Evolution',
    'Extinction',
    'A species becomes extinct when none of its members remain. A mass extinction removes many lineages. Survivors may then diversify into newly available ways of living.',
    { related: ['adaptive-radiation'] },
  ),
  idea(
    'adaptive-radiation',
    'evolution-patterns',
    'Evolution',
    'Adaptive radiation & divergence',
    'Descendants of one ancestor become different as they adapt to different niches. Adaptive radiation is diversification into many forms; divergence describes relatives becoming less alike.',
    { visual: 'evolution', related: ['convergent-evolution'] },
  ),
  idea(
    'convergent-evolution',
    'evolution-patterns',
    'Evolution',
    'Convergent evolution',
    'Separate lineages independently develop similar features because they face similar pressures. Similar shape alone does not prove close ancestry.',
    {
      cue: 'Sharks and dolphins both have streamlined bodies, but their shared shape arose independently.',
      related: ['adaptive-radiation', 'phylogeny'],
    },
  ),
  idea(
    'coevolution',
    'evolution-patterns',
    'Evolution',
    'Coevolution',
    'Two interacting species affect each other’s evolution. A change in one can favour a matching change in the other.',
  ),
  idea(
    'evolution-pace',
    'evolution-patterns',
    'Evolution',
    'Gradualism & punctuated equilibrium',
    'Gradualism describes slow, continuing change. Punctuated equilibrium describes long periods of little change interrupted by comparatively rapid change. Both describe patterns over evolutionary time.',
  ),
  idea(
    'hox-genes',
    'evolution-patterns',
    'Evolution',
    'Hox genes',
    'Developmental control genes help organize the body as an embryo grows. Small changes in when or where these genes act can produce large changes in body structure.',
    {
      cue: 'Gene activity during development → body-plan variation → natural selection can act on that variation',
    },
  ),
  idea(
    'word-parts',
    'bio-roots',
    'Classification',
    'Biological word parts',
    'A prefix, root or suffix can give a clue to a word. Bio means life; morph refers to form. Check the whole scientific definition after using the clue.',
  ),
  idea(
    'classification',
    'classification',
    'Classification',
    'Classification hierarchy',
    'Classification organizes organisms in groups within groups. Each rank gets more specific as you move toward species.',
    {
      cue: 'Kingdom → Phylum → Class → Order → Family → Genus → Species',
      related: ['scientific-names', 'domains-kingdoms'],
    },
  ),
  idea(
    'dichotomous-keys',
    'classification',
    'Classification',
    'Dichotomous keys',
    'A dichotomous key gives two contrasting descriptions at each step. Choose the one that matches the organism and follow its next instruction. Keep going until you reach an identification.',
    {
      cue: 'For your own key, use observable features and test that every organism reaches one clear endpoint.',
    },
  ),
  idea(
    'scientific-names',
    'binomial-names',
    'Classification',
    'Scientific names',
    'A scientific species name has two parts: genus and specific epithet. Capitalize the genus, lowercase the epithet, and italicize both when typed.',
    {
      cue: 'Panthera leo: Panthera is the genus; leo is the specific epithet.',
    },
  ),
  idea(
    'phylogeny',
    'phylogeny',
    'Classification',
    'Ancestry & molecular evidence',
    'Phylogeny describes evolutionary history. Inherited DNA similarities can help test relationships. Estimating time from sequence changes also needs a calibrated rate.',
    { related: ['cladograms', 'convergent-evolution'] },
  ),
  idea(
    'cladograms',
    'cladograms',
    'Classification',
    'Cladograms & shared traits',
    'A cladogram shows a proposed pattern of ancestry. Follow branches back to their shared ancestor. A shared derived trait is an inherited change that helps identify a branch.',
    {
      cue: 'The most recent common branch point matters; the spacing of the tips does not.',
      related: ['phylogeny'],
    },
  ),
  idea(
    'domains-kingdoms',
    'domains-kingdoms',
    'Classification',
    'Domains & six kingdoms',
    'The three domains are Bacteria, Archaea and Eukarya. This class uses six kingdoms: Eubacteria, Archaebacteria, Protista, Fungi, Plantae and Animalia. Domain Archaea and kingdom Archaebacteria are different rank names.',
  ),
];

const questionIdeas: Record<string, string> = {
  'q-17-2-1': 'early-earth',
  'q-17-2-2': 'miller-urey',
  'q-17-2-3': 'oxygen',
  'q-17-2-4': 'endosymbiosis',
  'q-17-2-5': 'early-earth',
  'q-17-4-1': 'macroevolution',
  'q-17-4-2': 'extinction',
  'q-17-4-3': 'convergent-evolution',
  'q-17-4-4': 'hox-genes',
  'q-17-4-5': 'evolution-pace',
  'q-18-1-2': 'scientific-names',
  'q-18-1-5': 'scientific-names',
  'q-key-1': 'dichotomous-keys',
  'q-key-2': 'dichotomous-keys',
  'q-cladogram': 'cladograms',
  'q-words': 'word-parts',
};
export function lifeQuestionIdea(q: CompanionQuestion) {
  const id = questionIdeas[q.id];
  return (
    lifeIdeas.find((i) => i.id === id) ??
    lifeIdeas.find((i) => i.concept === q.concepts[0])
  );
}
export function lifeIdeaBacklinks(id: string) {
  return lifeMaterials.flatMap((material) =>
    lifeQuestions(material)
      .filter((q) => lifeQuestionIdea(q)?.id === id)
      .map((q) => ({ material, question: q })),
  );
}

export const lifeQuestionHelp: Record<
  string,
  { simple: string; include: string[] }
> = {
  'q-key-1': {
    simple:
      'Read the pair of descriptions on your original key. Choose the one that fits the insect, follow its number, and repeat until the key gives an identification.',
    include: [
      'The identification reached for each insect.',
      'Observable features that support your choices when a reason is requested.',
    ],
  },
  'q-key-2': {
    simple:
      'At each step, give two contrasting descriptions of an observable leaf feature. Each choice should lead to another pair or to one identified leaf.',
    include: [
      'Pairs that clearly separate the leaves.',
      'A clear endpoint for every leaf.',
      'A test of every route through your key.',
    ],
  },
  'q-18-1-2': {
    simple:
      'Linnaeus’s naming system gives each species a two-part scientific name. Explain what the first and second parts mean, then show how the name is written.',
    include: [
      'Genus plus specific epithet forms the full species name.',
      'Capitalized genus and lowercase specific epithet; italicize both when typed or underline each when handwritten.',
    ],
  },
  'q-18-1-5': {
    simple:
      'Binomial means two names. The full species name combines the genus with its specific epithet; the second word alone is not the full species name.',
    include: [
      'The two parts of the scientific name and how they identify a species.',
    ],
  },
  'q-17-2-1': {
    simple:
      'Use the proposed early atmosphere in your class text. It had very little free oxygen; the broader atmosphere list and the Miller–Urey gas mixture are different lists.',
    include: [
      'The gases named in the class text.',
      'How that atmosphere differed from today.',
    ],
  },
  'q-17-2-2': {
    simple:
      'The experiment made building blocks that cells use. Making an organic molecule is different from making a living organism.',
    include: [
      'The kind of products formed.',
      'What the result supports, without claiming that life was created.',
    ],
  },
  'q-17-2-3': {
    simple:
      'A change can harm one group and help another. Think about organisms that could not tolerate oxygen, then organisms that could use it for energy.',
    include: ['One harmful effect.', 'One new opportunity.'],
  },
  'q-17-2-4': {
    simple:
      'Explain a lasting partnership: smaller bacteria lived inside a larger cell. Then connect each kind of bacterium to the organelle it became.',
    include: [
      'How the partnership began and lasted.',
      'Which bacteria connect to mitochondria and chloroplasts.',
      'Evidence for bacterial ancestry if the question asks for support.',
    ],
  },
  'q-17-2-5': {
    simple:
      '“It happened once” is not enough. Compare the environments: today has oxygen and existing life that would consume or alter new organic material.',
    include: [
      'Relevant differences between early and present-day Earth.',
      'A conclusion supported by those differences.',
    ],
  },
  'q-17-3-1': {
    simple:
      'This asks for the environment where the life was found, not a continent’s name. Check the early Paleozoic part of the era diagram.',
    include: ['The main environment.'],
  },
  'q-17-3-2': {
    simple:
      'Look for the change in where vertebrates could live during the Devonian.',
    include: ['The animal group and its move into a new environment.'],
  },
  'q-17-3-3': {
    simple:
      'Choose two events from the Mesozoic section. Be precise about whether a group first appeared or became dominant.',
    include: ['Two separate events.', 'The organisms involved.'],
  },
  'q-17-3-4': {
    simple:
      'Use the Cenozoic’s pattern of mammal diversification. Choose concrete fossil examples that fit the era instead of saying “recent animals.”',
    include: [
      'Specific kinds of organisms.',
      'How their adaptations fit the environments described in the section.',
    ],
  },
  'q-17-4-1': {
    simple:
      'First define the scale of macroevolution. Then choose two patterns and explain what happens in each.',
    include: [
      'A definition.',
      'Two named patterns, each with a short explanation.',
    ],
  },
  'q-17-4-2': {
    simple:
      'Follow the cause and effect: many lineages disappear, then survivors face new opportunities and different competition.',
    include: [
      'The losses caused by mass extinction.',
      'How surviving lineages can diversify afterward.',
    ],
  },
  'q-17-4-3': {
    simple:
      'The key is independent similarity. Your example needs separate lineages with similar adaptations, rather than close relatives inheriting the same trait.',
    include: [
      'A definition.',
      'An example and the shared pressure that helps explain it.',
    ],
  },
  'q-17-4-4': {
    simple:
      'Hox genes influence development. Explain how changing where or when a control gene acts can change the adult body.',
    include: [
      'The gene’s role in development.',
      'How a small change can create body-structure variation.',
    ],
  },
  'q-17-4-5': {
    simple:
      'Compare the pace of change. Both describe evolution; they differ in whether the record shows steady change or long quiet intervals with faster changes.',
    include: [
      'What both models describe.',
      'The difference in their patterns of change.',
    ],
  },
};

export const lifeReviewTerms = lifeIdeas.filter((i) =>
  [
    'index-fossils',
    'relative-dating',
    'radioactive-dating',
    'half-life',
    'microspheres',
    'endosymbiosis',
    'adaptive-radiation',
    'convergent-evolution',
    'coevolution',
    'hox-genes',
    'cladograms',
    'classification',
  ].includes(i.id),
);
