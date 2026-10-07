export const wadson = {
  vectorDirection: {
    required: true,
    explanation:
      'Write the direction in words. A minus sign on its own is incomplete.',
    acceptsSignedMagnitudeWithDirection: true,
    evidence: [
      'classroom vector marking',
      'teacher instructions supplied for this milestone',
    ],
  },
  percentError: {
    formula: '|experimental - accepted| / |accepted| × 100',
    denominator: 'accepted',
    absolute: true,
    outputUnit: '%',
    applies:
      'Compare an experimental result with a known accepted value in the same unit.',
    rounding:
      'Carry unrounded values through the calculation. Follow the precision stated for that lab; the water model reports 0.49%. No universal decimal-place rule is established.',
    evidence: [
      'teacher conversion reference',
      'formal report calculations guide',
      'boiling-point model',
    ],
  },
  lab: {
    paper: 'Letter paper; 1 inch margins; 12 point Times Roman; single spaced.',
    titlePage:
      'Title centered one third down; blank student, partner, course, date and teacher fields at lower right; leave the reverse blank.',
    sections: [
      'Objective',
      'Introduction',
      'Materials',
      'Procedure',
      'Results',
      'Calculations',
      'Discussion',
      'Conclusion',
      'Literature Cited',
    ],
    procedure:
      'Impersonal third-person past tense; enough detail to repeat what was done, including precautions.',
    results:
      'Numbered tables and figures with descriptive captions, units and actual measurement uncertainties; labeled graph axes and relevant fit information.',
    calculations:
      'One worked example of each calculation type, with significant figures and units; put repeated calculated results in a table.',
    discussion:
      'Interpret results, compare with theory where applicable, and explain how specific sources of error affect the result.',
    conclusion:
      'Brief purpose, important results and meaning, limitations and improvements; impersonal past tense.',
    citations:
      'Cite borrowed information in the text and list sources alphabetically on a separate final page.',
  },
} as const;

export const questionWordClues = [
  {
    words: ['dropped', 'released from rest', 'from rest'],
    meaning: 'It starts without moving.',
    quantity: 'vi = 0',
  },
  {
    words: ['comes to rest', 'stops', 'stopping'],
    meaning: 'It finishes without moving.',
    quantity: 'vf = 0',
  },
  {
    words: ['constant velocity', 'uniform velocity'],
    meaning: 'Its speed and direction stay the same.',
    quantity: 'a = 0',
  },
] as const;

export function percentError(experimental: number, accepted: number) {
  if (
    !Number.isFinite(experimental) ||
    !Number.isFinite(accepted) ||
    accepted === 0
  )
    throw new Error(
      'Percent error needs finite values and a nonzero accepted value.',
    );
  return Math.abs((experimental - accepted) / accepted) * 100;
}

export function vectorFeedback(
  value: number,
  expectedMagnitude: number,
  direction: string,
  allowed: string[],
  tolerance = 0.005,
) {
  if (
    !Number.isFinite(value) ||
    Math.abs(Math.abs(value) - Math.abs(expectedMagnitude)) >
      tolerance * Math.max(Number.EPSILON * 8, Math.abs(expectedMagnitude))
  )
    return 'Check the values and the relationship you used.';
  if (!direction.trim())
    return 'Your number is right, but Wadson wants the direction written too.';
  if (
    !allowed.some(
      (word) => word.toLowerCase() === direction.trim().toLowerCase(),
    )
  )
    return 'Your number is right. Check which way the object is moving.';
  return null;
}
