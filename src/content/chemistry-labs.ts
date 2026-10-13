import type { Assignment, Concept, Edge } from '../core/schema';

export type LabQuestion = {
  number: string;
  prompt: string;
  help: string;
  needsData?: string;
};
export type LabGuide = {
  id: string;
  number: string;
  title: string;
  pages: string;
  source: string;
  purpose: string;
  chemistry: string[];
  before: string[];
  safety: string[];
  expected: {
    label: string;
    text: string;
    equation?: string;
    sources: string[];
  }[];
  during: string[];
  record: string[];
  questions: LabQuestion[];
  references: { title: string; url: string }[];
};
const zinc = 'https://www.webelements.com/zinc/chemistry.html';
const calcium =
  'https://www.leifichemie.de/aufbau-der-materie/periodensystem/versuche/reaktion-von-calcium-mit-wasser-und-untersuchung-des-reaktionsproduktes';
const copper =
  'https://www.flinnsci.com/api/library/Download/3cc55cb8c55c42b79da3f291e19a4c9e';
const acs =
  'https://www.acs.org/middleschoolchemistry/lessonplans/chapter6/lesson5.html';
const lauric = 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C143077&Mask=4';
export const chemistryLabs: LabGuide[] = [
  {
    id: 'chemistry-lab-2a',
    number: '2A',
    title: 'Making Observations',
    pages: '9–12',
    source: 'SMG Lab Books · Essential Experiments for Chemistry',
    purpose:
      'Practice describing real changes in words and with measurements while comparing zinc/water, calcium/water and aluminum/copper(II) chloride.',
    chemistry: [
      'A qualitative observation describes a feature such as colour or bubbling. A quantitative observation includes a measured number and unit.',
      'An observation reports what happened. An interpretation explains it. Bubbles alone show gas formation, not the identity of the gas.',
    ],
    before: [
      'Part I uses separate water-filled beakers A and B and inverted, completely water-filled test tubes. Zinc goes in A; calcium in B. Add two drops of phenolphthalein after observing each metal.',
      'For Part II, use the teacher’s modified quantities: 50 mL copper(II) chloride solution in a 150 mL beaker and a 7.5 cm × 7.5 cm foil square rolled into a tube. The class sheet directs this part to the fume hood.',
      'Record the solution temperature before adding foil and when visible changes have ended. Record observations as the reaction happens.',
    ],
    safety: [
      'Wear the lab apron and safety goggles specified on the sheet. Pick up calcium with tweezers; do not touch it.',
      'Copper(II) chloride is harmful; avoid splashes and wash them away with plenty of water as instructed. Do not sniff the beaker to identify a gas.',
      'Use the fume hood for Part II. The reaction can get hot and can release flammable hydrogen; do not add a flame test that is not part of your teacher’s procedure.',
      'Follow the teacher’s designated waste containers for remaining metals and all Part II liquids/solids; wash hands after cleanup.',
    ],
    expected: [
      {
        label: 'Zinc in room-temperature water',
        text: 'Little or no visible change is normally expected with this zinc/water setup over a short observation. This does not establish that every zinc sample under every condition is inert.',
        sources: [zinc],
      },
      {
        label: 'Calcium in water',
        text: 'Hydrogen bubbles and calcium hydroxide formation are expected. The hydroxide can make the water cloudy and basic; phenolphthalein can then turn pink.',
        equation: 'Ca + 2 H₂O → Ca(OH)₂ + H₂',
        sources: [calcium],
      },
      {
        label: 'Aluminum in copper(II) chloride',
        text: 'Reddish-brown copper forms, aluminum is consumed and the solution warms. Its blue/green copper-ion colour can fade as those ions are used up. Reaction may start slowly while the surface oxide is breached.',
        equation: '2 Al + 3 CuCl₂ → 2 AlCl₃ + 3 Cu',
        sources: [copper, acs],
      },
      {
        label: 'Bubbles in Part II',
        text: 'Hydrogen can form in a side reaction involving aluminum and the acidic solution. The main copper-displacement equation above produces no gas. Bubbling or an incidental smell does not prove chlorine was produced.',
        equation: '2 Al + 6 H⁺ → 2 Al³⁺ + 3 H₂',
        sources: [copper],
      },
    ],
    during: [
      'Distinguish bubbles that continue to form from air trapped when equipment is moved. Watch the water level in the inverted tube as gas collects.',
      'Record colour before and after adding the indicator. Cloudiness or a solid deposit can be easy to miss if you only record the final colour.',
      'In Part II, watch the foil surface, the colour of the solution and any new solid. Record temperature with the thermometer, not by touching the beaker.',
      'A mass of a whole beaker setup is not the mass of the reacting metal. Label exactly what was weighed and whether material was added or lost.',
    ],
    record: [
      'For each of the three tests: qualitative observations and any corresponding numerical measurements with units.',
      'Part II initial and final temperature; useful observed reaction times if measured.',
      'Mass or other measurements only when actually taken; include what equipment and contents were measured.',
    ],
    questions: [
      {
        number: 'Analysis 1',
        prompt: 'In which tests did you observe a colour change?',
        help: 'Name every test and state its before/after colours. Adding phenolphthalein is a separate step: a pink calcium mixture counts as an observed indicator colour change, even if the metal/water mixture was initially colourless.',
        needsData: 'Use your own colour records, including the indicator step.',
      },
      {
        number: 'Analysis 2a',
        prompt: 'In which tests did you observe gas formation?',
        help: 'Identify the tests in which bubbles were continuously generated or gas accumulated. Theory suggests calcium/water and possible Part II hydrogen, but your answer must report the tests you actually observed.',
        needsData: 'Your bubbling and gas-collection observations.',
      },
      {
        number: 'Analysis 2b',
        prompt: 'Which observations show that gas was produced?',
        help: 'Use visible evidence: new bubbles and gas replacing water in the inverted tube. These establish gas formation; they do not by themselves identify its chemistry.',
        needsData: 'The actual evidence seen in your setup.',
      },
      {
        number: 'Analysis 3',
        prompt: 'In which test did you observe no change?',
        help: 'Specify what stayed the same over your observation time. “No visible change” is a valid qualitative observation; do not claim that no molecular process could have occurred.',
        needsData: 'Your actual no-change record.',
      },
      {
        number: 'Follow-up 1',
        prompt:
          'How could you collect and measure the volume of gas from a reaction?',
        help: 'Use a gas syringe, or collect it over water in an inverted graduated cylinder if the gas is not too soluble/reactive with water. The displaced water volume gives collected gas volume. Describe the collection path and read the calibrated scale; the lab’s ungraduated test tube collects gas but does not itself provide an accurate volume.',
      },
      {
        number: 'Follow-up 2',
        prompt: 'What is phenolphthalein and what is it commonly used for?',
        help: 'It is an acid–base indicator: colourless in acidic/near-neutral solution and pink in a suitable basic range. It is commonly used to indicate endpoints in titrations. In this lab it indicates the basic calcium-hydroxide solution.',
      },
      {
        number: 'Conclusion',
        prompt:
          'Give one significant qualitative and quantitative observation for each test.',
        help: 'Pair a real description with a real number and unit for zinc, calcium and aluminum/copper chloride. A lack of temperature change can be meaningful if you measured it. Do not replace an observed value with a reference or expected value.',
        needsData: 'Your three sets of observations and measurements.',
      },
    ],
    references: [
      { title: 'WebElements · zinc reactions', url: zinc },
      { title: 'LEIFIchemie · observed calcium/water reaction', url: calcium },
      { title: 'Flinn Scientific · Foiled Again! (pp.10–13)', url: copper },
      {
        title:
          'ACS · aluminum, copper ions and chloride (related sulfate demonstration)',
        url: acs,
      },
    ],
  },
  {
    id: 'chemistry-lab-2b',
    number: '2B',
    title: 'Heating and Cooling Curves of a Pure Substance',
    pages: '13–17',
    source: 'SMG Lab Books · Essential Experiments for Chemistry',
    purpose:
      'Heat solid dodecanoic acid until it melts, cool the liquid until it solidifies, and compare melting and freezing temperatures from your curves.',
    chemistry: [
      'Dodecanoic acid is also called lauric acid. Melting and freezing are physical changes: the substance retains its chemical identity.',
      'During a phase change, energy changes intermolecular arrangement rather than steadily changing temperature. A pure sample near equilibrium can show a plateau at the transition temperature.',
    ],
    before: [
      'The source uses a test tube of solid dodecanoic acid with a thermometer embedded in it, clamped in a ring stand, and a water bath.',
      'Heat the water bath to 55–60 °C, lower to low heat, then immerse the sample below the water line. Keep the bath above 55 °C while taking sample readings.',
      'Record sample temperature every 30 seconds until it exceeds 50 °C. Note when melting begins and ends; stir gently only as the source directs during melting.',
      'For cooling, replace the hot bath water with room-temperature water. Record every 30 seconds until the sample is near 25 °C and note when solidification begins/ends.',
    ],
    safety: [
      'Wear the source’s apron and safety goggles. Handle hot water, the hot plate and glass carefully; clamp the test tube securely.',
      'Do not force the thermometer through solid acid. The source warns that a broken glass thermometer requires the instructor; if it contains mercury, treat the spill as instructed.',
      'Return the resealed test-tube assembly for reuse rather than discarding the acid; wash hands after cleanup.',
    ],
    expected: [
      {
        label: 'Reference transition temperature',
        text: 'Pure lauric acid has a melting transition near 44 °C; NIST lists modern measurements around 316.6–317.9 K. This is reference evidence, not your measured melting/freezing point.',
        sources: [lauric],
      },
      {
        label: 'Curve shapes',
        text: 'Temperature normally rises during heating and falls during cooling, with a flatter interval while solid and liquid coexist. Supercooling, heat transfer, impurities or thermometer lag can make the real curves differ.',
        sources: [
          'https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions',
        ],
      },
    ],
    during: [
      'Read the thermometer in the acid, not the water-bath thermometer, for the plotted data.',
      'Keep time intervals consistent and continue through the entire transition. A plateau needs several readings; one repeated value is not enough.',
      'Record visual melting/solidification times along with temperatures. Note any temperature dip before crystals form or recovery as crystallization releases energy.',
    ],
    record: [
      'Time in minutes at 0, 0.5, 1.0, 1.5…; sample temperature in °C for both heating and cooling.',
      'Observation of melting and solidification beginning and ending.',
      'Unusual curve features and equipment/reading limitations actually noticed.',
    ],
    questions: [
      {
        number: 'Heating 1–2',
        prompt:
          'Graph temperature versus time and indicate the start and end of melting.',
        help: 'Put time on the horizontal axis and temperature on the vertical axis. Use circles for heating readings and a smooth trend through the measured points. Mark melting times from your observations, not guessed points.',
        needsData:
          'Your measured heating time/temperature pairs and phase observations.',
      },
      {
        number: 'Heating 3',
        prompt: 'Determine the melting point from your curve.',
        help: 'Estimate the transition temperature from the flatter melting interval. State an appropriate value/range with units and acknowledge a poorly defined plateau.',
        needsData: 'Your heating curve.',
      },
      {
        number: 'Cooling 1–2',
        prompt:
          'Add the cooling curve on the same graph and mark solidification.',
        help: 'Use squares for cooling readings and the same axis scales. Begin the cooling time sequence at its recorded start. Mark actual observed beginning/end of solidification.',
        needsData: 'Your cooling measurements and observations.',
      },
      {
        number: 'Cooling 3',
        prompt: 'Determine the freezing point from your curve.',
        help: 'Use the freezing interval. If the sample briefly supercools, the lowest dip is not automatically the equilibrium freezing point; examine the temperature during sustained solidification.',
        needsData: 'Your cooling curve.',
      },
      {
        number: 'Cooling 4',
        prompt:
          'Compare your transition points and other groups’ results. Explain differences.',
        help: 'Compare actual numerical estimates and uncertainty. Identify plausible effects of heat-transfer rate, thermometer placement, lag, impurities or supercooling, and explain how each could affect a curve.',
        needsData: 'Your two estimates and any other group’s real results.',
      },
      {
        number: 'Cooling 5',
        prompt:
          'What can you conclude about a pure substance’s melting and freezing points?',
        help: 'At the same pressure near equilibrium, they describe the same solid–liquid transition temperature. Explain whether your measured estimates agree within experimental limits.',
      },
      {
        number: 'Follow-up 1',
        prompt: 'Explain the plateaus on the heating and cooling curves.',
        help: 'While melting, added energy separates intermolecular arrangements; while freezing, forming those arrangements releases energy. Temperature can stay approximately constant while the proportions of solid and liquid change.',
      },
      {
        number: 'Follow-up 2',
        prompt: 'Sketch how a larger sample would change the heating curve.',
        help: 'At a comparable heating rate, more material needs more energy, so warming is slower and the melting plateau lasts longer. The same pure substance’s transition temperature stays the same; do not invent a new data table.',
      },
      {
        number: 'Conclusion',
        prompt:
          'State and compare the measured melting and freezing points (Objective 3).',
        help: 'Give your two estimates with °C, compare them, and explain their agreement or discrepancy using the real curves. Keep the reference value near 44 °C separate.',
        needsData: 'Your measured transition temperatures.',
      },
    ],
    references: [
      {
        title: 'NIST Chemistry WebBook · dodecanoic acid phase-change data',
        url: lauric,
      },
      {
        title: 'OpenStax Chemistry 2e · phase transitions',
        url: 'https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions',
      },
    ],
  },
  {
    id: 'chemistry-lab-2c',
    number: '2C',
    title: 'Chemical and Physical Change',
    pages: '18–20',
    source: 'SMG Lab Books · Essential Experiments for Chemistry',
    purpose:
      'Mix each distinct pair of four unknown solutions and use observed evidence to distinguish chemical from physical changes.',
    chemistry: [
      'A chemical change produces new substances. A physical change changes state, distribution or concentration without changing substance identity.',
      'Mixing two solutions changes their concentrations even if there is no visible reaction. A colour change alone can be dilution; gas, a new insoluble solid or heat can support a chemical interpretation when the context fits.',
    ],
    before: [
      'Label separate test tubes and clean droppers A, B, C and D. The source uses a clean glass square over a paper grid for one-drop tests.',
      'There are six distinct pairs: AB, AC, AD, BC, BD and CD. Reversing a pair repeats the same combination; mixing a solution with itself is not a new pair.',
      'Keep each dropper with its own solution and each mixture in its own clean grid position. The source asks for brief notes even when no visible change occurs.',
    ],
    safety: [
      'Wear the source’s apron and safety goggles. Treat A–D as unknowns and minimize contact; the source notes that some may be corrosive.',
      'Wash off spills/splashes with plenty of water and notify the instructor. Use the teacher’s current waste instructions; the source’s disposal line is not a substitute for identification and local handling rules.',
      'Wash hands after cleanup. Do not smell, taste or combine the unknowns beyond the assigned pairs.',
    ],
    expected: [
      {
        label: 'What can be predicted from this source?',
        text: 'The identities and concentrations of A–D are not supplied. No specific precipitate, gas, colour or reacting pair can be predicted reliably. Use your observations; a teacher-supplied identity list would permit a reaction-specific check.',
        sources: [],
      },
      {
        label: 'If no visible reaction occurs',
        text: 'Mixing still changes the distribution and concentration of the solutions. That is a physical change under the source’s post-lab discussion; absence of a visible signal alone does not prove that no chemical process occurred.',
        sources: [],
      },
    ],
    during: [
      'Record initial solution colours, the immediate appearance after mixing and delayed changes.',
      'Look for persistent bubbles, new cloudiness/solid, a changed colour distinct from dilution, or a measurable temperature change if the teacher provides a suitable method.',
      'Keep observations separate from interpretations: “white solid formed” is an observation; “an insoluble product formed” is the explanation.',
    ],
    record: [
      'One observation record for each of AB, AC, AD, BC, BD and CD.',
      'Any time or temperature values only if actually measured.',
      'A classification and supporting reason for each mixture.',
    ],
    questions: [
      {
        number: 'Analysis 1',
        prompt: 'Classify the change for each solution combination.',
        help: 'For each of the six pairs, state physical or chemical and cite your observed evidence. A new insoluble solid supports a chemical change; simple dilution supports a physical change. Explain ambiguous evidence rather than inventing reagent identities.',
        needsData:
          'Your six actual pair observations; identities/concentrations if the teacher supplied them.',
      },
      {
        number: 'Follow-up 1',
        prompt:
          'Describe two everyday chemical changes and two physical changes.',
        help: 'For chemical examples, explain the formation of new substances, such as rusting or combustion. For physical examples, explain retained identity, such as melting ice or cutting paper. Give two of each with short reasons.',
      },
      {
        number: 'Conclusion',
        prompt:
          'State recognizable characteristics of chemical changes (Objective 3).',
        help: 'Use the changes you actually saw and explain why they suggest new substances. Common evidence includes new solid, gas, energy changes or a contextual colour change; each sign needs interpretation.',
        needsData:
          'The chemical-change evidence actually seen in your mixtures.',
      },
    ],
    references: [
      {
        title: 'OpenStax Chemistry 2e · physical and chemical properties',
        url: 'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties',
      },
    ],
  },
];
export const chemistryLabAssignments: Assignment[] = chemistryLabs.map(
  (lab) => ({
    id: lab.id,
    title: `Lab ${lab.number} · ${lab.title}`,
    course: 'chemistry',
    edition: 'chemistry-fall-2026',
    teacher: 'Mrs. Cote',
    status: 'current',
    unit: 'matter',
    materialSet: 'smg-matter-labs',
    kind: 'lab',
    assistance: 'allowed',
    summary: lab.purpose,
    tasks: [
      {
        id: 'experiment',
        title: 'Use the real lab sheet',
        instructions:
          'Prepare, observe and interpret using the source instructions and your own measured results.',
      },
    ],
    concepts: ['observing-matter', 'physical-chemical-change'],
    prerequisites: [],
    sources: ['chem-oct12-sources'],
    difficulty: ['Separate expected results from observed evidence.'],
    rights: 'original-companion',
    originalAvailability: `${lab.source}, Experiment ${lab.number}, pp.${lab.pages}. Raw sheets remain in the private archive.`,
    notes:
      'The supplied lab sheets are undated; no lab/deadline dates inferred. Student results are private and never used as shared expected measurements.',
    companionQuestions: lab.questions.map((q) => ({
      id: 'q-' + q.number.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      number: q.number,
      section: `Lab ${lab.number} · After`,
      prompt: q.prompt,
      asking: q.needsData ?? 'Explain the chemistry using the real experiment.',
      concepts: ['observing-matter', 'physical-chemical-change'],
      input: 'text',
      clues: [],
      steps: [{ title: 'Use the evidence', text: q.help }],
      hints: [q.help],
      example: q.help,
      repair: {
        prompt: 'Which values belong in the lab report?',
        choices: [
          'My actual measured results',
          'Invented expected measurements',
        ],
        answer: 'My actual measured results',
        explanation: 'Keep observation and expectation separate.',
      },
      checklist: [q.needsData ?? q.help],
    })),
  }),
);
export const labConcepts: Concept[] = [
  [
    'observing-matter',
    'Observations & interpretations',
    'Qualitative observations use descriptions; quantitative observations include measured numbers and units. An interpretation explains evidence, while an observation records it.',
  ],
  [
    'physical-chemical-change',
    'Physical & chemical change',
    'A physical change retains substance identity. A chemical change produces different substances. Observable signs support an interpretation but must be checked in context.',
  ],
  [
    'classification-of-matter',
    'Matter, phases & properties',
    'A phase has uniform composition and properties. Pure substances have fixed composition; mixtures combine substances. Intensive properties describe material under specified conditions, while extensive properties depend on sample amount or extent.',
  ],
].map(([id, title, model]) => ({
  id,
  title,
  model,
  course: 'chemistry',
  unit: 'matter',
  kind: 'concept',
  practiceMode: 'assignment',
  why: 'These distinctions help explain the results of the actual SMG classroom labs.',
  representation:
    'Separate an observed description from a proposed chemical explanation.',
  example: { prompt: 'Explain a change in the real lab.', steps: [model] },
  trap: 'A bubble or colour change alone does not identify a substance or prove a chemical reaction.',
  prerequisites: [],
  depth: 'core',
  memorize:
    'Observation, interpretation, qualitative, quantitative, physical and chemical.',
  derive: 'Connect evidence to a change without replacing actual measurements.',
  reference: 'SMG Experiments 2A, 2B and 2C.',
  review: [title],
  deeper: 'Use the actual lab sheet and the cited chemistry references.',
  aliases: [],
  annotations: [],
  sources: ['chem-oct12-sources'],
  status: 'publishable',
}));
export const labEdges: Edge[] = [
  {
    from: 'classification-of-matter',
    to: 'observing-matter',
    type: 'requires',
    reason:
      'Classifying a sample requires comparing its observed regions, composition and properties.',
  },
  {
    from: 'physical-chemical-change',
    to: 'observing-matter',
    type: 'requires',
    reason:
      'Classifying a change needs recorded evidence and a supported interpretation.',
  },
  {
    from: 'physical-chemical-change',
    to: 'intermolecular-forces',
    type: 'explains',
    reason:
      'Changing intermolecular arrangements explains physical phase transitions.',
  },
];
