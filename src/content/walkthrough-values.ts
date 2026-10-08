/* Reviewed, signed setups for every single-stage numerical Physics question.
 * Δx is a stable internal key; the student-facing displacement symbol is Δd.
 * Related questions carry their missing values explicitly, never by guessing. */
export type Setup = {
  values: Record<string, number>;
  target: string;
  family: 'velocity' | 'average' | 'squared' | 'distance';
  context?: string;
  axis?: string;
  velocityUnit?: string;
  significantFigures?: number;
  precisionNote?: string;
  finalValue?: string;
};
const up = 'Take up as positive; down is negative.';
const right = 'Take right/forward as positive; left/backward is negative.';
const setup = (
  values: Record<string, number>,
  target: string,
  family: Setup['family'],
  significantFigures = 2,
  axis = right,
  context?: string,
): Setup => ({ values, target, family, significantFigures, axis, context });
const g = -9.8; // Wadson’s supplied 2026 formula sheet, rather than an assumed 9.81.
export const physicsSetups: Record<string, Record<string, Setup>> = {
  'kinematics-review': {
    'q-1': setup({ vi: 24, vf: 18, Δt: 3 }, 'Δx', 'average'),
    'q-2': setup({ vi: 17, a: 3, Δt: 4 }, 'vf', 'velocity'),
    'q-3': setup({ vi: 24, vf: 0, Δx: 196 }, 'a', 'squared'),
    'q-4': setup({ vi: 8, vf: 14, Δx: 55 }, 'Δt', 'average'),
    'q-6': setup({ vi: 20, vf: 0, a: -8 }, 'Δx', 'squared'),
    'q-7': setup({ vi: 0, a: 24, Δx: 192 }, 'Δt', 'distance', 2, up),
    'q-8': setup(
      { vi: 0, a: 24, Δx: 192 },
      'vf',
      'squared',
      2,
      up,
      'From question 7: the rocket starts from rest and has a net upward acceleration of 24 m/s². Gravity is already accounted for in that net acceleration.',
    ),
    'q-10': setup({ vi: 0, a: g, Δt: 2 }, 'vf', 'velocity', 2, up),
    'q-11': setup({ vi: 0, a: g, Δx: -28 }, 'Δt', 'distance', 2, up),
    'q-12': setup({ vf: 0, a: g, Δx: 4.5 }, 'vi', 'squared', 2, up),
    'q-13': setup({ vi: 12, vf: 0, a: g }, 'Δx', 'squared', 2, up),
    'q-14a': setup({ vi: 27, a: g, Δt: 3.5 }, 'Δx', 'distance', 2, up),
    'q-14b': setup(
      { vi: 27, a: g, Δt: 3.5 },
      'vf',
      'velocity',
      2,
      up,
      'From 14a: the snowball starts at 27 m/s upward and has been moving for 3.5 s.',
    ),
    'q-16': setup(
      { vi: 0, Δx: -32, Δt: 1.2 },
      'a',
      'distance',
      2,
      up,
      'This is another planet. Its acceleration is the unknown, so do not insert Earth’s gravity.',
    ),
    'q-18a': setup(
      { vi: 0, a: g, Δt: 1.1 },
      'vf',
      'velocity',
      3,
      up,
      'The penny reaches the ground after 1.10 s. Its signed impact velocity is downward; the requested speed is its positive magnitude.',
    ),
    'q-18b': setup(
      { vi: 0, a: g, Δt: 1.1 },
      'Δx',
      'distance',
      3,
      up,
      'Use the same 1.10 s total fall as part 18a. The penny’s displacement is negative because it falls; the roof height is the positive magnitude of that displacement.',
    ),
    'q-19': setup({ vi: 0, a: g, Δt: 3.34 }, 'Δx', 'distance', 3, up),
    'q-20': setup({ vi: 0, a: g, Δx: -300.5 }, 'Δt', 'distance', 3, up),
    'q-21': setup({ vi: 0, vf: -98.5, a: g }, 'Δx', 'squared', 3, up),
    'q-22a': setup({ vi: 0, a: g, Δt: 5.66 }, 'vf', 'velocity', 3, up),
    'q-22b': setup(
      { vi: 0, a: g, Δt: 5.66 },
      'Δx',
      'distance',
      3,
      up,
      'From 22a: the log is released from rest and falls for 5.66 s.',
    ),
    'q-23a': setup({ vi: 0, a: g, Δt: 4 }, 'vf', 'velocity', 2, up),
    'q-23b': setup(
      { vi: 0, a: g, Δt: 4 },
      'Δx',
      'distance',
      2,
      up,
      'From 23a: the rock starts from rest; use the same 4.0 s interval.',
    ),
    'q-24a': setup({ vi: -8, a: g, Δt: 4 }, 'vf', 'velocity', 1, up),
    'q-24b': setup(
      { vi: -8, a: g, Δt: 4 },
      'Δx',
      'distance',
      1,
      up,
      'From 24a: the starting velocity is −8 m/s, so the rock is already moving downward.',
    ),
    'q-25a': setup({ vi: 8, a: g, Δt: 4 }, 'vf', 'velocity', 1, up),
    'q-25b': setup(
      { vi: 8, a: g, Δt: 4 },
      'Δx',
      'distance',
      1,
      up,
      'From 25a: the starting velocity is +8 m/s upward; after 4.0 s it is below its release point.',
    ),
    'q-26a': setup({ vi: 8, vf: 3, a: g }, 'Δt', 'velocity', 2, up),
    'q-26a-height': setup(
      { vi: 8, vf: 3, a: g },
      'Δx',
      'squared',
      2,
      up,
      'From 26a: launch velocity +8.0 m/s; catch velocity +3.0 m/s while still going up.',
    ),
    'q-26c': setup({ vi: 8, vf: -3, a: g }, 'Δt', 'velocity', 2, up),
    'q-26c-height': setup(
      { vi: 8, vf: -3, a: g },
      'Δx',
      'squared',
      2,
      up,
      'From 26c: launch velocity +8.0 m/s; catch velocity −3.0 m/s on the way down.',
    ),
    'q-27a': setup(
      { vi: 10, vf: 0, a: g },
      'Δx',
      'squared',
      3,
      up,
      'The cliff’s 20.0 m height is not needed for the rise above the launch point. At the top, vf = 0.',
    ),
    'q-27b': setup(
      { vi: 10, vf: 0, a: g },
      'Δt',
      'velocity',
      3,
      up,
      'From 27a: launch velocity +10.0 m/s; the rock reaches vf = 0 at the top.',
    ),
  },
  'physics-motion-review': {
    'q-b10': setup({ vi: 2, vf: 10, Δt: 6 }, 'a', 'velocity', 2),
    'q-c11': setup({ vi: 0, a: 3.5, Δt: 4 }, 'Δx', 'distance', 2),
    'q-c14a': setup(
      { vi: 15, vf: 0, Δx: 50 },
      'a',
      'squared',
      2,
      right,
      'Convert 54 km/h × (1000 m / 1 km) × (1 h / 3600 s) = 15 m/s. The conversion factors are exact.',
    ),
    'q-c14b': setup(
      { vi: 15, vf: 0, a: -2.25 },
      'Δt',
      'velocity',
      2,
      right,
      'From C14a: vi = 15 m/s, vf = 0 and the unrounded acceleration is −2.25 m/s².',
    ),
    'q-c15': setup({ vi: 0, a: g, Δt: 3.2 }, 'Δx', 'distance', 3, up),
    'q-d16': setup({ vi: 0, a: g, Δx: -10.2 }, 'vf', 'squared', 3, up),
  },
  'physics-textbook-accelerated-motion': {
    'q-5': setup({ vi: 4, vf: 36, Δt: 4 }, 'a', 'velocity'),
    'q-6': setup({ vi: 36, vf: 15, Δt: 3 }, 'a', 'velocity'),
    'q-7a': setup(
      { vi: -25, vf: 0, Δt: 3 },
      'a',
      'velocity',
      2,
      'Take east/right as positive; west is negative.',
    ),
    'q-8': setup(
      { vi: -3, vf: 4.5, Δt: 2.5 },
      'a',
      'velocity',
      2,
      'Take uphill as positive; downhill is negative.',
    ),
    'q-9': setup(
      { vi: 3.5, vf: 0.75, Δt: 10 },
      'a',
      'velocity',
      2,
      'Take east/right as positive; west is negative.',
    ),
    'q-10': {
      ...setup(
        { vi: 1, vf: 0.5, Δt: 1 },
        'a',
        'velocity',
        1,
        'Take the original drift direction as positive.',
      ),
      velocityUnit: 'cm/year',
    },
    'q-16a': setup(
      { vi: 2, a: -0.5, Δt: 2 },
      'vf',
      'velocity',
      2,
      'Take uphill/toward the hole as positive; downhill/away is negative.',
    ),
    'q-16b': setup(
      { vi: 2, a: -0.5, Δt: 6 },
      'vf',
      'velocity',
      2,
      'Take uphill/toward the hole as positive; downhill/away is negative.',
      'From 16a: vi = 2.0 m/s toward the hole and a = −0.50 m/s². The acceleration continues after the ball stops at 4.0 s, so it reverses.',
    ),
    'q-17': setup(
      { vi: 30 / 3.6, a: 1.5, Δt: 6.8 },
      'vf',
      'velocity',
      2,
      'Take east/right as positive; west is negative.',
      'Convert 30.0 km/h ÷ 3.6 = 8.333… m/s. Keep that unrounded value when calculating.',
    ),
    'q-18': setup(
      { vi: 0, a: 5.5, vf: 28 },
      'Δt',
      'velocity',
      2,
      'Take north as positive; south is negative.',
    ),
    'q-19': setup({ vi: 22, vf: 3, a: -2.1 }, 'Δt', 'velocity'),
    'q-22b': setup(
      { vi: 0, vf: -25, Δt: 12 },
      'Δx',
      'average',
      2,
      'Take east/right as positive; west is negative.',
    ),
    'q-23': setup(
      { vi: 1.75, vf: 0, a: -0.2 },
      'Δt',
      'velocity',
      2,
      'Take uphill as positive; downhill is negative.',
    ),
    'q-24': setup({ vi: 44, vf: 22, Δt: 11 }, 'Δx', 'average'),
    'q-25': {
      ...setup({ vi: 15, vf: 25, Δx: 125 }, 'Δt', 'average'),
      finalValue: '6.2',
      precisionNote:
        'The unrounded time is 6.25 s. Your captured class reminder says “round even”: at this exact halfway case that gives 6.2 s to two significant figures. Half-up would give 6.3 s; the teacher’s printed tie rule is not independently available.',
    },
    'q-26': {
      ...setup(
        { vf: 7.5, Δt: 4.5, Δx: 19 },
        'vi',
        'average',
        1,
        'Take north as positive; south is negative.',
      ),
      precisionNote:
        '2Δd/Δt gives 8.444… m/s, limited to tenths by 19 m and 4.5 s. Subtracting 7.5 m/s also limits the result to tenths: 0.9 m/s north. Keep extra digits until this last subtraction.',
    },
    'q-41a': setup({ vi: 0, a: g, Δt: 4 }, 'vf', 'velocity', 2, up),
    'q-41b': setup(
      { vi: 0, a: g, Δt: 4 },
      'Δx',
      'distance',
      2,
      up,
      'From 41a: the brick starts from rest and falls for 4.0 s.',
    ),
    'q-43': setup({ vi: 0, a: g, Δx: -3.5 }, 'vf', 'squared', 2, up),
    'q-44a': setup({ vi: 22.5, vf: 0, a: g }, 'Δx', 'squared', 3, up),
    'q-45b': setup({ vf: 0, a: g, Δx: 0.25 }, 'vi', 'squared', 2, up),
  },
};
for (const questions of Object.values(physicsSetups))
  for (const s of Object.values(questions)) {
    if (s.values.a === g) {
      s.significantFigures = 2;
      s.precisionNote =
        'Wadson’s formula sheet gives g = 9.8 m/s² (two significant figures). Apply the reminder-sheet multiply/divide rule: the least precise factor limits the final result. A stated rest/stop condition is an exact zero; retain extra digits in the working.';
    }
  }
