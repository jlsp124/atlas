import { concepts } from './catalog';
import { topicTitle } from './workspaces';
export type Definition = {
  term: string;
  definition: string;
  concept: string;
  aliases?: string[];
};
export const definitions: Definition[] = [
  {
    term: 'index fossil',
    aliases: ['index fossils'],
    concept: 'relative-dating',
    definition:
      'A fossil from a species that lived for a short time but was found in lots of places: it was widespread. It helps compare the ages of rock layers.',
  },
  {
    term: 'displacement',
    concept: 'displacement',
    definition:
      'How far your finish is from your start, and in which direction. Walking out and back can give zero displacement even though you travelled.',
  },
  {
    term: 'velocity',
    concept: 'velocity',
    definition: 'How quickly position changes, and in which direction.',
  },
  {
    term: 'acceleration',
    concept: 'acceleration',
    definition:
      'How quickly velocity changes. Its sign tells you the direction of that change.',
  },
  {
    term: 'half-life',
    aliases: ['half life'],
    concept: 'half-life',
    definition:
      'The time for half the radioactive parent atoms to change into daughter atoms. Each new half-life halves the parent atoms still left.',
  },
  {
    term: 'shielding',
    concept: 'periodic-trends',
    definition:
      'Inner electrons reduce the nuclear attraction felt by outer electrons.',
  },
  {
    term: 'lone pair',
    aliases: ['lone pairs'],
    concept: 'lewis-structures',
    definition:
      'A pair of valence electrons on one atom that is not shared in a bond.',
  },
  {
    term: 'valence electrons',
    concept: 'valence-electrons',
    definition:
      'The outer electrons that take part in bonding. For the main-group atoms here, these are in the highest occupied shell.',
  },
  {
    term: 'electronegativity',
    concept: 'electronegativity',
    definition: 'How strongly an atom attracts the shared electrons in a bond.',
  },
  {
    term: 'isotopes',
    concept: 'atomic-identity',
    definition:
      'Atoms of the same element with different numbers of neutrons. Their proton count stays the same.',
  },
  {
    term: 'signed area',
    concept: 'motion-graphs',
    definition:
      'Area above zero contributes positively; area below zero contributes negatively. On a velocity–time graph, it gives displacement.',
  },
  {
    term: 'clade',
    concept: 'cladograms',
    definition: 'A common ancestor and all of its descendants.',
  },
  {
    term: 'endosymbiosis',
    concept: 'endosymbiosis',
    definition:
      'A long-term relationship in which one organism lives inside another. Evidence supports this origin for mitochondria and chloroplasts.',
  },
  {
    term: 'relative dating',
    concept: 'relative-dating',
    definition:
      'Placing rocks or events in order from older to younger without assigning a numerical age.',
  },
  ...concepts
    .filter((c) => c.course === 'japanese' && c.kind === 'vocabulary')
    .map((c) => ({
      term: c.title,
      definition: c.annotations[0].definition + '. ' + c.example.prompt,
      concept: c.id,
    })),
];
for (const c of concepts)
  if (!definitions.some((d) => d.concept === c.id))
    definitions.push({
      term: topicTitle(c.id),
      definition: c.model.split(/(?<=[.!?])\s/)[0],
      concept: c.id,
    });
