/* Reviewed setups for the existing public questions. Related-part values retain
 * an explicit explanation; this file does not ingest private source material. */
type Setup = {
  values: Record<string, number>;
  target?: string;
  family?: 'velocity' | 'average' | 'squared' | 'distance';
  context?: string;
  axis?: string;
  velocityUnit?: string;
};
const kinematics: Record<string, Setup> = {
  'q-13': { values: { vi: 12, vf: 0, a: -9.8 }, axis: 'Take up as positive.' },
  'q-12': {
    values: { vf: 0, a: -9.8, Δx: 4.5 },
    target: 'vi',
    axis: 'Take up as positive.',
  },
  'q-14b': {
    values: { vi: 27, a: -9.8, Δt: 3.5 },
    context: 'From 14a: the snowball starts at 27 m/s upward. Up is positive.',
    axis: 'Take up as positive.',
  },
  'q-16': {
    values: { vi: 0, Δx: 32, Δt: 1.2 },
    family: 'distance',
    axis: 'Take down as positive.',
  },
  'q-20': {
    values: { vi: 0, a: 9.8, Δx: 300.5 },
    family: 'distance',
    axis: 'Take down as positive.',
  },
  'q-21': {
    values: { vi: 0, vf: 98.5, a: 9.8 },
    family: 'squared',
    axis: 'Take down as positive.',
  },
  'q-23b': {
    values: { vi: 0, a: -9.8, Δt: 4 },
    context: 'From 23a: the rock is released from rest. Up is positive.',
    axis: 'Take up as positive.',
  },
  'q-24b': {
    values: { vi: -8, a: -9.8, Δt: 4 },
    context:
      'From 24a: the rock starts downward at 8 m/s. Up is positive, so vᵢ = −8 m/s.',
    axis: 'Take up as positive.',
  },
  'q-25b': {
    values: { vi: 8, a: -9.8, Δt: 4 },
    context: 'From 25a: the rock starts upward at 8 m/s. Up is positive.',
    axis: 'Take up as positive.',
  },
  'q-26a-height': {
    values: { vi: 8, vf: 3, a: -9.8 },
    context:
      'From 26a: the book leaves at 8 m/s upward and is caught while moving at 3 m/s upward.',
    axis: 'Take up as positive.',
  },
  'q-26c-height': {
    values: { vi: 8, vf: -3, a: -9.8 },
    context:
      'From 26c: the book leaves at 8 m/s upward and is caught while moving at 3 m/s downward.',
    axis: 'Take up as positive.',
  },
  'q-27a': {
    values: { vi: 10, vf: 0, a: -9.8 },
    context: 'At the highest point, the vertical velocity is zero.',
    axis: 'Take up as positive.',
  },
  'q-27b': {
    values: { vi: 10, vf: 0, a: -9.8 },
    context:
      'From 27a: the rock starts at 10 m/s upward. At the highest point, v𝒇 = 0.',
    axis: 'Take up as positive.',
  },
};
const review: Record<string, Setup> = {
  'q-b10': { values: { vi: 2, vf: 10, Δt: 6 }, family: 'velocity' },
  'q-c11': { values: { vi: 0, a: 3.5, Δt: 4 } },
  'q-c14a': {
    values: { vi: 15, vf: 0, Δx: 50 },
    context: 'Convert first: 54 km/h ÷ 3.6 = 15 m/s.',
  },
  'q-c14b': {
    values: { vi: 15, vf: 0, a: -2.25 },
    context: 'From 14a: vᵢ = 15 m/s, v𝒇 = 0 and a = −2.25 m/s².',
  },
  'q-c15': {
    values: { vi: 0, a: 9.8, Δt: 3.2 },
    axis: 'Take down as positive.',
  },
  'q-d16': {
    values: { vi: 0, a: 9.8, Δx: 10.2 },
    context: 'Steps off means the initial vertical velocity is zero.',
    axis: 'Take down as positive.',
  },
};
const textbook: Record<string, Setup> = {
  'q-5': { values: { vi: 4, vf: 36, Δt: 4 } },
  'q-6': { values: { vi: 36, vf: 15, Δt: 3 } },
  'q-7a': { values: { vi: 25, vf: 0, Δt: 3 }, axis: 'Take west as positive.' },
  'q-8': {
    values: { vi: -3, vf: 4.5, Δt: 2.5 },
    axis: 'Take uphill as positive.',
  },
  'q-9': {
    values: { vi: 3.5, vf: 0.75, Δt: 10 },
    axis: 'Take east as positive.',
  },
  'q-10': { values: { vi: 1, vf: 0.5, Δt: 1 }, velocityUnit: 'cm/year' },
  'q-16a': {
    values: { vi: 2, a: -0.5, Δt: 2 },
    axis: 'Take toward the hole as positive.',
  },
  'q-16b': {
    values: { vi: 2, a: -0.5, Δt: 6 },
    context: 'From 16a: vᵢ = 2.0 m/s toward the hole and a = −0.50 m/s².',
    axis: 'Take toward the hole as positive.',
  },
  'q-17': {
    values: { vi: 30 / 3.6, a: 1.5, Δt: 6.8 },
    context:
      'Convert first: 30.0 km/h ÷ 3.6 = 8.333… m/s. Keep the extra digits for the calculation.',
    axis: 'Take east as positive.',
  },
  'q-18': {
    values: { vi: 0, a: 5.5, vf: 28 },
    axis: 'Take north as positive.',
  },
  'q-19': { values: { vi: 22, vf: 3, a: -2.1 } },
  'q-22b': {
    values: { vi: 0, vf: 25, Δt: 12 },
    family: 'average',
    axis: 'Take west as positive.',
  },
  'q-23': {
    values: { vi: 1.75, vf: 0, a: -0.2 },
    axis: 'Take uphill as positive.',
  },
  'q-24': { values: { vi: 44, vf: 22, Δt: 11 } },
  'q-25': { values: { vi: 15, vf: 25, Δx: 125 } },
  'q-26': {
    values: { vf: 7.5, Δt: 4.5, Δx: 19 },
    target: 'vi',
    axis: 'Take north as positive.',
  },
  'q-41a': { values: { vi: 0, a: 9.8, Δt: 4 }, axis: 'Take down as positive.' },
  'q-41b': {
    values: { vi: 0, a: 9.8, Δt: 4 },
    context: 'From 41a: the brick is dropped, so vᵢ = 0. It falls for 4.0 s.',
    axis: 'Take down as positive.',
  },
  'q-43': {
    values: { vi: 0, a: 9.8, Δx: 3.5 },
    axis: 'Take down as positive.',
  },
  'q-44a': {
    values: { vi: 22.5, vf: 0, a: -9.8 },
    context: 'At maximum height, the ball is momentarily at rest.',
    axis: 'Take up as positive.',
  },
  'q-45b': {
    values: { vf: 0, a: -9.8, Δx: 0.25 },
    target: 'vi',
    context: 'At the top, v𝒇 = 0. Up is positive.',
    axis: 'Take up as positive.',
  },
};
export const physicsSetups: Record<string, Record<string, Setup>> = {
  'kinematics-review': kinematics,
  'physics-motion-review': review,
  'physics-textbook-accelerated-motion': textbook,
};
