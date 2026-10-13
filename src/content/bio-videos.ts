import { bioQuestion, bioAssignment } from './bio-source-questions';

export type VideoEvidence = {
  seconds?: number;
  kind: 'fact' | 'reasoning';
  text: string;
  include?: string[];
};
export const lifeVideos = {
  'c17-research': {
    title: 'NOVA · Origins: How Life Began',
    url: 'https://www.youtube.com/watch?v=IuqmtcogwsE',
    transcript: 'https://www.pbs.org/wgbh/nova/space/origins-life-began.html',
    evidence:
      'Teacher handout links matched to public English captions and the official PBS transcript.',
  },
  'bio-virus-video': {
    title: 'Understanding Viruses',
    url: 'https://www.youtube.com/watch?v=8q68qHiKKYw',
    evidence:
      'The worksheet’s tinyurl.com/3deupuck resolves to this upload. Public English auto captions were reviewed; timestamps mark supporting segments.',
  },
} as const;
export const novaRows = [
  [
    'q-pre-1',
    'Pre 1',
    'Pre-watching',
    'Predict four chemical elements you would use as ingredients for life.',
    'early-earth',
    'Make a prediction before watching, then compare it with the film’s CHON segment.',
  ],
  [
    'q-pre-2',
    'Pre 2',
    'Pre-watching',
    'Has Earth’s life always been as visibly diverse as BC’s forests and oceans? Explain your initial view.',
    'early-earth',
    'Give your own prediction and reason; the later microbial history lets you revisit it.',
  ],
  [
    'q-1',
    '1',
    'During the video',
    'Describe early Earth’s sky and ocean colours and explain their causes.',
    'early-earth',
    'Connect appearance to the atmosphere and ocean composition described.',
  ],
  [
    'q-2',
    '2',
    'During the video',
    'What was the heavy bombardment, and how did it affect surface life?',
    'early-earth',
    'Explain the impacts and their effect on habitable conditions.',
  ],
  [
    'q-3',
    '3',
    'During the video',
    'Name the four elements emphasized and explain carbon’s central role.',
    'early-earth',
    'Name CHON and explain carbon’s bonding versatility.',
  ],
  [
    'q-4',
    '4',
    'During the video',
    'What did Miller’s experiment simulate, and which building blocks did it make?',
    'early-earth',
    'Separate making organic molecules from creating life.',
  ],
  [
    'q-5',
    '5',
    'During the video',
    'What was found in the Murchison meteorite, and what origin of ingredients does it support?',
    'early-earth',
    'Connect the discovery to delivery of ingredients from space.',
  ],
  [
    'q-6',
    '6',
    'During the video',
    'What happened to amino acids in Jennifer Blank’s impact experiment, and why was it surprising?',
    'early-earth',
    'Explain survival and molecular joining under the test conditions.',
  ],
  [
    'q-7',
    '7',
    'During the video',
    'How do South African deep-mine microbes survive without sunlight?',
    'early-earth',
    'Identify chemical energy rather than sunlight.',
  ],
  [
    'q-8',
    '8',
    'During the video',
    'Why could hydrothermal vents offer a cradle for life during bombardment?',
    'early-earth',
    'Connect protection with energy and ingredients.',
  ],
  [
    'q-9',
    '9',
    'During the video',
    'What are stromatolites, and why do the Western Australian examples matter?',
    'fossilization',
    'Connect layered microbial structures to evidence of ancient life.',
  ],
  [
    'q-10',
    '10',
    'During the video',
    'How did cyanobacterial oxygen change Earth’s geology?',
    'early-earth',
    'Explain the iron reaction and resulting deposits.',
  ],
  [
    'q-11',
    '11',
    'During the video',
    'When do humans appear in the film’s 24-hour analogy?',
    'geologic-time',
    'Use the film’s clock, which differs from the textbook’s 12-hour model.',
  ],
  [
    'q-12',
    '12',
    'Post-watching',
    'How was rising oxygen both a catastrophe and an opportunity?',
    'early-earth',
    'Explain one harmful effect and one new advantage.',
  ],
  [
    'q-13',
    '13',
    'Post-watching',
    'Explain microbial dominance through much of Earth’s history and reflect on dominance today.',
    'geologic-time',
    'Use the long microbial interval, then give your own interpretation of dominance.',
  ],
] as const;
export const novaQuestions = novaRows.map(
  ([id, number, section, prompt, concept, asking]) =>
    bioQuestion(id, number, section, [prompt, concept, asking, asking]),
);
const novaEvidence: Record<string, VideoEvidence> = {
  'q-pre-1': {
    kind: 'reasoning',
    seconds: 865,
    text: 'Write your initial prediction. After watching, compare it with carbon, hydrogen, oxygen and nitrogen.',
  },
  'q-pre-2': {
    kind: 'reasoning',
    seconds: 2906,
    text: 'Give your own starting view. The film’s clock places visible complex life late in Earth’s history.',
  },
  'q-1': {
    kind: 'fact',
    seconds: 451,
    text: 'A reddish sky from a carbon-dioxide-rich atmosphere; greenish oceans containing dissolved iron.',
  },
  'q-2': {
    kind: 'fact',
    seconds: 488,
    text: 'Repeated large impacts could melt surface rock and boil oceans, disrupting surface habitats.',
  },
  'q-3': {
    kind: 'fact',
    seconds: 865,
    text: 'Carbon, hydrogen, oxygen and nitrogen. Carbon forms many different molecular frameworks through its bonds.',
  },
  'q-4': {
    kind: 'fact',
    seconds: 923,
    text: 'Water, gases and sparks modeled proposed conditions and produced amino acids, not living cells.',
  },
  'q-5': {
    kind: 'fact',
    seconds: 1453,
    text: 'Amino acids: some ingredients for life can form in space and arrive in meteorites.',
  },
  'q-6': {
    kind: 'fact',
    seconds: 1802,
    text: 'Amino acids survived high-pressure impacts and joined into larger linked molecules rather than all being destroyed.',
  },
  'q-7': {
    kind: 'fact',
    seconds: 1984,
    text: 'They use chemical energy associated with rock, water and gases rather than sunlight.',
  },
  'q-8': {
    kind: 'fact',
    seconds: 2202,
    text: 'Deep water offered protection, with heat and chemical resources around vents.',
  },
  'q-9': {
    kind: 'fact',
    seconds: 2403,
    text: 'Layered structures built by microbial communities; ancient examples preserve evidence of early microbial life.',
  },
  'q-10': {
    kind: 'fact',
    seconds: 2645,
    text: 'Oxygen reacted with dissolved iron, forming iron-oxide deposits: the planet’s “rusting.”',
  },
  'q-11': {
    kind: 'fact',
    seconds: 2906,
    text: 'Less than the final 30 seconds before midnight on the film’s 24-hour clock.',
  },
  'q-12': {
    kind: 'reasoning',
    seconds: 2645,
    text: 'Follow two consequences of oxygen. It could damage organisms adapted to anaerobic conditions; organisms able to use aerobic respiration gained an energy advantage.',
    include: [
      'A harmful effect on anaerobes.',
      'A new opportunity through aerobic metabolism.',
      'The cause linking cyanobacteria to rising oxygen.',
    ],
  },
  'q-13': {
    kind: 'reasoning',
    seconds: 2906,
    text: 'Use the clock to contrast the long microbial interval with the late arrival of large organisms. Then define what you mean by dominance—abundance, ecological influence or visibility—and defend your own view.',
    include: [
      'The long microbial history.',
      'Your definition of dominance and a supported reflection.',
    ],
  },
};
const virusRows: [string, string, string, string][] = [
  [
    'Why can a virus be considered nonliving outside a host? Give two reasons.',
    'viral-structure',
    'Give two independent limits on what it can do alone.',
    'No independent metabolism or replication machinery; it depends on host cells.',
  ],
  [
    'Which 1930s technological advance made viruses visible?',
    'viral-structure',
    'Identify the instrument and why ordinary microscopes were insufficient.',
    'Electron microscopy resolved particles too small for ordinary light microscopy.',
  ],
  [
    'What two basic components make up a virus?',
    'viral-structure',
    'Name its genetic core and coat.',
    'DNA or RNA inside a protein coat called a capsid.',
  ],
  [
    'Why do viruses target specific cells? Relate this to rabies, mumps and hepatitis.',
    'viral-structure',
    'Explain receptor compatibility and identify the tissues named in the film.',
    'Matching host molecules permit entry: rabies targets nervous tissue, mumps salivary glands, hepatitis the liver.',
  ],
  [
    'How does the T4 bacteriophage use a bacterium to reproduce?',
    'viral-cycles',
    'Put attachment, entry, production and release in order.',
    'T4 attaches, injects DNA, redirects bacterial machinery, assembles copies and releases them by cell lysis.',
  ],
  [
    'Why does the film compare viruses with biological smart bombs?',
    'viral-structure',
    'Explain the metaphor without treating viruses as conscious agents.',
    'Their attachment mechanisms can selectively target suitable cells; this is molecular specificity, not deliberate planning.',
  ],
  [
    'How did World War I help spread the 1918 influenza pandemic?',
    'viral-emergence',
    'Connect wartime movement and crowded conditions to transmission.',
    'Troop travel and crowded wartime conditions carried infection between populations and across borders.',
  ],
  [
    'What entry route did some 1918 protections overlook?',
    'viral-structure',
    'Identify the respiratory route emphasized by the film.',
    'The nose was an entry route too; protection focused on the mouth could leave it exposed.',
  ],
  [
    'Why could Jenner’s use of cowpox protect against smallpox?',
    'immune-memory',
    'Explain cross-recognition and immune memory.',
    'Related viral antigens trained protective responses that could also recognize smallpox; later exposure met a prepared immune system.',
  ],
  [
    'What do antibodies and memory cells do?',
    'immune-memory',
    'Distinguish immediate recognition from lasting readiness.',
    'Antibodies bind specific antigens. Memory cells persist and support a faster response on later exposure.',
  ],
  [
    'Why does the film contrast stable DNA viruses with changing influenza RNA?',
    'viral-emergence',
    'Explain the molecular spelling-checker model and its limit.',
    'Copying errors change viral antigens. The film contrasts DNA proofreading with influenza’s less accurate RNA copying; not every RNA virus lacks proofreading.',
  ],
  [
    'How can ducks and pigs contribute to new influenza strains?',
    'viral-emergence',
    'Explain a mixing vessel through coinfection.',
    'Ducks carry influenza; pigs can host different strains. Coinfection can mix genome segments, producing new combinations.',
  ],
  [
    'How can rainforest destruction and expansion produce viral emergence?',
    'viral-emergence',
    'Trace the new contact rather than claiming people create a virus.',
    'Human expansion increases contact with wildlife and their viruses, allowing some infections to cross into new populations.',
  ],
  [
    'How did used tires help spread Asian tiger mosquitoes and dengue risk?',
    'viral-emergence',
    'Connect a water-holding container with transport of a vector.',
    'Water-holding used tires support mosquito breeding; international shipment can move their eggs or larvae to new places.',
  ],
  [
    'What retroviral property lets HIV hide from immune attack?',
    'viral-cycles',
    'Explain integration and periods of low viral expression.',
    'HIV copies RNA into DNA and integrates it into host DNA; latent infected cells can evade immune recognition.',
  ],
  [
    'Give one argument for and one against destroying remaining smallpox stocks.',
    'immune-memory',
    'Make a balanced ethical argument using the worksheet’s scenario.',
    'Compare reducing accidental release risk with retaining material for research on protective tools. Smallpox eradication refers to natural transmission, not destruction of every laboratory sample.',
  ],
  [
    'How can modified cold-virus vectors help gene-therapy research on cystic fibrosis?',
    'viral-structure',
    'Describe gene delivery and distinguish the film’s experiment from a promised cure.',
    'Researchers modify viruses to carry a functioning gene into cells. The film presents a delivery strategy, not guaranteed successful treatment.',
  ],
  [
    'Will humans ever win against viruses, or is a truce more realistic?',
    'viral-emergence',
    'Write your own paragraph using at least two documentary concepts.',
    'Connect ongoing viral variation with human contact, travel or vector movement. Weigh these against vaccines and other tools, then justify your own conclusion.',
  ],
];
const virusSeconds = [
  100,
  299,
  325,
  430,
  459,
  510,
  609,
  719,
  795,
  843,
  1018,
  1084,
  1930,
  2165,
  2352,
  undefined,
  2774,
  2922,
];
export const virusQuestions = virusRows.map(
  ([prompt, concept, asking, reasoning], i) =>
    bioQuestion(
      i === 17 ? 'q-reflection' : `q-${i + 1}`,
      i === 17 ? 'Reflection' : String(i + 1),
      i === 17
        ? 'Critical thinking'
        : i < 6
          ? 'Virus structure & infection'
          : i < 8
            ? 'History & pandemics'
            : i < 11
              ? 'Immunity & vaccines'
              : i < 14
                ? 'Emergence & environment'
                : 'Modern challenges',
      [prompt, concept, asking, reasoning],
    ),
);
export const videoEvidence: Record<string, Record<string, VideoEvidence>> = {
  'c17-research': novaEvidence,
  'bio-virus-video': Object.fromEntries(
    virusRows.map(([, , , text], i) => [
      virusQuestions[i].id,
      {
        kind: [8, 10, 11, 12, 15, 16, 17].includes(i) ? 'reasoning' : 'fact',
        seconds: virusSeconds[i],
        text,
        include: virusQuestions[i].checklist,
      },
    ]),
  ),
};
export const virusAssignment = bioAssignment(
  'bio-virus-video',
  'Understanding Viruses · video worksheet',
  'microorganisms',
  virusQuestions,
  'All four worksheet pages are captured; the teacher-linked upload and public captions have been matched. Ethical and reflection questions remain reasoned responses.',
  'worksheet',
);
virusAssignment.originalUrl = lifeVideos['bio-virus-video'].url;
