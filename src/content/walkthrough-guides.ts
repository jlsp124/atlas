import type { GuideStep } from '../core/walkthrough';
import { physicsWrittenGuides } from './physics-support';
import { packetGuides } from './physics-packets';
const step = (title: string, text: string, write: string): GuideStep => ({
  title,
  text,
  write,
  phase: 'working',
});
/** Multi-part setups are written explicitly. Never infer the content of a missing figure. */
export const writtenGuides: Record<string, Record<string, GuideStep[]>> = {
  'kinematics-review': {
    'q-5': [
      step(
        'Keep the units you were given',
        'Miles and miles per hour already fit together. You can leave both as they are.',
        'd = 7.0 miles; v = 2.0 miles/hour',
      ),
      step(
        'Put time on its own',
        'Speed is distance divided by time. Multiply both sides by time, then divide by speed.',
        'v = d / Δt → vΔt = d → Δt = d / v',
      ),
      step(
        'Substitute, then cancel miles',
        'The miles on top cancel the miles in the speed. Hours remain.',
        'Δt = 7.0 miles / (2.0 miles/hour) = 3.5 hours',
      ),
    ],
    'q-15': [
      step(
        'Split the trip at the top',
        'It returns to the same height. With no air resistance, the upward and downward parts take equal time.',
        'Δt(up) = 4.0 / 2 = 2.0 s',
      ),
      step(
        'Find the launch velocity',
        'At the top, the velocity is zero. Take up as positive, so acceleration is −9.8 m/s².',
        '0 = vᵢ + (−9.8)(2.0) → vᵢ = 19.6 m/s',
      ),
      step(
        'Use the two-second upward part',
        'The height is the upward displacement. Include both the starting velocity and gravity.',
        'Δd = vᵢΔt + ½aΔt² = (19.6)(2.0) + ½(−9.8)(2.0)²',
      ),
      step(
        'Subtract the effect of gravity',
        'The first term gives 39.2 m. Gravity subtracts 19.6 m during that same time.',
        'Maximum height = 19.6 m above release',
      ),
    ],
    'q-17': [
      step(
        'Use one direction for both balls',
        'Take up as positive. The downward ball starts at −16 m/s and the upward ball at +16 m/s. Both have acceleration −9.8 m/s².',
        'Δd = −42 m; a = −9.8 m/s²; vᵢ = −16 or +16 m/s',
      ),
      step(
        'Write a separate equation for each',
        'They cover the same displacement but start with different velocities. Time is squared, so solve each equation for its positive time.',
        '−42 = −16t − 4.9t²; −42 = +16t − 4.9t²',
      ),
      step(
        'Choose the positive root',
        'A negative root describes a time before release. These landing times are about 1.720 s and 4.985 s.',
        't(down) = (−16 + √(16² + 4×4.9×42)) / 9.8; t(up) = (16 + √(16² + 4×4.9×42)) / 9.8',
      ),
      step(
        'Compare the two times',
        'Subtract the earlier landing time from the later one. The square-root terms cancel in the difference.',
        'Difference = 32 / 9.8 ≈ 3.265 s',
      ),
    ],
  },
  'physics-motion-review': {
    'q-c13': [
      step(
        'Find the speed in the first part',
        'The first 250 m takes 20.0 s. That speed is also the starting speed for the accelerating part.',
        'vᵢ = 250 / 20.0 = 12.5 m/s',
      ),
      step(
        'Work out the second displacement',
        'Only the next 10.0 s uses the acceleration of 2.0 m/s².',
        'Δd(second) = (12.5)(10.0) + ½(2.0)(10.0)² = 225 m',
      ),
      step(
        'Add both parts of the trip',
        'The question asks for the whole distance. The first 250 m still counts.',
        'Total distance = 250 + 225 = 475 m',
      ),
    ],
    'q-d17': [
      step(
        'Separate reacting from braking',
        'During the 0.80 s reaction time, the car is still moving at 22.0 m/s. Braking has not begun.',
        'd(reaction) = (22.0)(0.80) = 17.6 m',
      ),
      step(
        'Work out the braking distance',
        'Take forward as positive. Braking acceleration is −6.0 m/s² and the final velocity is zero.',
        '0² = 22.0² + 2(−6.0)Δd → Δd = 484 / 12 = 40.333… m',
      ),
      step(
        'Add the distances before rounding',
        'The car moves during both parts. Compare the total with the deer’s position, not just the braking distance.',
        'd(stop) = 17.6 + 40.333… = 57.933… m',
      ),
      step(
        'Use the distance to answer the situation',
        'The deer is only 40.0 m ahead. The ideal stopping distance is about 57.93 m, so the car cannot stop before that point.',
        '57.93 m > 40.0 m',
      ),
    ],
    'q-d18': [
      step(
        'Use the average velocity',
        'It slows uniformly to zero. Its average velocity is half its starting velocity.',
        'Δd = ((vᵢ + 0) / 2)Δt',
      ),
      step(
        'Put the starting velocity on its own',
        'Multiply both sides by 2, then divide by elapsed time.',
        'vᵢ = 2Δd / Δt = 2(185.0) / 10.2 = 36.2745… m/s',
      ),
      step(
        'Convert to the requested unit',
        'Multiply metres per second by 3.6 to get kilometres per hour. Keep the extra digits from the first calculation.',
        'vᵢ = 36.2745… × 3.6 ≈ 130.6 km/h',
      ),
    ],
  },
  'physics-textbook-accelerated-motion': {
    'q-44b': [
      step(
        'Bring in the launch velocity',
        'From 44a, the ball starts upward at 22.5 m/s. At the top it is momentarily at rest.',
        'vᵢ = 22.5 m/s; v𝒇 = 0; a = −9.8 m/s²',
      ),
      step(
        'Find time to the top',
        'Subtract the starting velocity, then divide by acceleration. The two negative signs give a positive time.',
        'Δt(up) = (0 − 22.5) / (−9.8) = 2.2959… s',
      ),
      step(
        'Include the trip back down',
        'It returns to its launch height. With no air resistance, the downward part takes the same time.',
        'Δt(total) = 2 × 2.2959… ≈ 4.592 s',
      ),
    ],
    'q-45c': [
      step(
        'Bring in the speed from 45b',
        'The coin rose 0.25 m. Its launch speed was √(2×9.8×0.25) m/s. Keep that square-root value unrounded.',
        'vᵢ = √(2×9.8×0.25) = 2.21359… m/s',
      ),
      step(
        'Find the time to the top',
        'Take up as positive. At the top, the velocity is zero.',
        'Δt(up) = (0 − vᵢ) / (−9.8)',
      ),
      step(
        'Double it for the return trip',
        'The coin is caught at its release height. In this ideal model, the two parts take equal time.',
        'Δt(total) = 2 × √(2×9.8×0.25) / 9.8 ≈ 0.4518 s',
      ),
    ],
  },
  'chemistry-hebden-conversions': {
    'q-18a': [
      step(
        'Use seconds with metres per second',
        'The speed is 3.00 × 10⁸ m/s. Convert 8.3 minutes before multiplying.',
        'Δt = 8.3 min × (60 s / 1 min) = 498 s',
      ),
      step(
        'Connect distance, speed and time',
        'Every second adds another 3.00 × 10⁸ metres. Multiplying by the number of seconds gives the distance.',
        'd = vΔt = (3.00 × 10⁸ m/s)(498 s)',
      ),
      step(
        'Cancel seconds and calculate',
        'Seconds divide out. Keep metres for the answer. Round only the last line to the precision your assignment requires.',
        'd = 1.494 × 10¹¹ m before final rounding',
      ),
    ],
    'q-18b': [
      step(
        'Match kilometres to the speed unit',
        'The speed uses metres per second, so first turn the distance into metres.',
        'd = 3.8 × 10⁵ km × (1000 m / 1 km) = 3.8 × 10⁸ m',
      ),
      step(
        'Put time on its own',
        'Speed is distance divided by time. Rearrange before substituting.',
        'v = d / Δt → Δt = d / v',
      ),
      step(
        'Cancel metres, leaving seconds',
        'Divide the distance by the distance travelled in one second.',
        'Δt = (3.8 × 10⁸ m) / (3.00 × 10⁸ m/s) = 1.2666… s before final rounding',
      ),
    ],
    'q-18c': [
      step(
        'Convert the distance to metres',
        'Use the same distance unit as the speed.',
        'd = 7.83 × 10⁷ km × (1000 m / 1 km) = 7.83 × 10¹⁰ m',
      ),
      step(
        'Divide distance by speed',
        'This first gives seconds. The question asks for minutes, so there is one more conversion.',
        'Δt = (7.83 × 10¹⁰ m) / (3.00 × 10⁸ m/s) = 261 s',
      ),
      step(
        'Change seconds into minutes',
        'Put seconds underneath the conversion factor so they cancel.',
        '261 s × (1 min / 60 s) = 4.35 min',
      ),
    ],
  },
};

for (const [assignment, guides] of Object.entries(physicsWrittenGuides)) {
  writtenGuides[assignment] = { ...writtenGuides[assignment], ...guides };
}

for (const [assignment, guides] of Object.entries(packetGuides))
  writtenGuides[assignment] = { ...writtenGuides[assignment], ...guides };
const finalLines: [string, string, string, string][] = [
  [
    'kinematics-review',
    'q-15',
    'Use the sheet’s two significant figures for g = 9.8. Keep 19.6 m in the working, then round the final height to two significant figures.',
    'Maximum height = 2.0 × 10¹ m above release.',
  ],
  [
    'kinematics-review',
    'q-17',
    'The two 16 m/s launch speeds and g = 9.8 limit the time difference to two significant figures.',
    'Landing-time difference = 3.3 s.',
  ],
  [
    'physics-motion-review',
    'q-c13',
    'The first distance is written 250 m without a decimal point. By the reminder-sheet spacing-zero rule it has two significant figures (tens precision). The second distance is also limited to tens by a = 2.0. Add the unrounded distances, then round to tens.',
    'Total distance = 4.8 × 10² m (unrounded: 475 m).',
  ],
  [
    'physics-motion-review',
    'q-d17',
    'The reaction and braking calculations are limited by 0.80 s and 6.0 m/s². Keep both distances unrounded when adding, then give the total to the nearest metre. It exceeds the deer’s 40.0 m position.',
    'Stopping distance ≈ 58 m; the car cannot stop before the deer.',
  ],
  [
    'physics-motion-review',
    'q-d18',
    'The distance has four significant figures and time has three. The m/s-to-km/h factor 3.6 is exact, so the final speed keeps three significant figures.',
    'Starting speed ≈ 131 km/h.',
  ],
  [
    'physics-textbook-accelerated-motion',
    'q-44b',
    'The supplied g = 9.8 has two significant figures; keep the unrounded upward time when doubling. The factor 2 comes from symmetry and is exact.',
    'Total flight time ≈ 4.6 s.',
  ],
  [
    'physics-textbook-accelerated-motion',
    'q-45c',
    'Height 0.25 m and g = 9.8 each have two significant figures. Use the unrounded launch speed, then round the last time value.',
    'Total flight time ≈ 0.45 s.',
  ],
];
for (const [assignment, question, text, write] of finalLines)
  writtenGuides[assignment][question].push(
    step('Round the final line', text, write),
  );
