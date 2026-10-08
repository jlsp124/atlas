import type { GuideStep } from '../core/walkthrough';
const s = (title: string, text: string, write: string): GuideStep => ({
  title,
  text,
  write,
  phase: 'working',
});
const missing = (figure: string, relation: string, meaning: string) => [
  s(
    'The source we still need',
    `Atlas has the question reference but not ${figure}. Send a clear photo showing its labels, axes, scale and all relevant rows; those values cannot be reconstructed from the question title.`,
    `Missing source: ${figure}.`,
  ),
  s('What the calculation will use', meaning, relation),
  s(
    'Keep the result tied to the source',
    'Once the real readings are available, substitute those readings, keep their signs and units, and round the final result. There is no numerical result to report before that evidence arrives.',
    'Use the exact question and source image in the help prompt below.',
  ),
];
export const physicsWrittenGuides: Record<
  string,
  Record<string, GuideStep[]>
> = {
  'kinematics-review': {
    'q-9': [
      s(
        'Use the same rocket as 7 and 8',
        'The rocket starts at the origin, at rest, with net upward acceleration 24 m/s². Up is positive.',
        'vi = 0; a = +24 m/s²; dᵢ = 0.',
      ),
      s(
        'Calculate each table row',
        'Position is ½at² = 12t²; velocity is at = 24t. Square time only in the position column.',
        't (s): 0, 1, 2, 3, 4, 5\nΔd (m): 0, 12, 48, 108, 192, 300\nv (m/s): 0, 24, 48, 72, 96, 120',
      ),
      s(
        'Connect the graphs to motion',
        'The position curve starts horizontal and becomes steeper: its slope is an increasing upward velocity. The velocity graph starts at zero and rises in a straight line with slope 24 m/s².',
        'Position vs time: upward curve. Velocity vs time: straight line through (0, 0).',
      ),
    ],
  },
  'physics-motion-review': {
    'q-a1': [
      s(
        'Count the path',
        'For a walk 5 m right then 8 m left, distance counts both parts regardless of direction.',
        'Distance = 5 + 8 = 13 m.',
      ),
      s(
        'Compare finish with start',
        'Right is positive. Add the signed changes: +5 + (−8) = −3 m. The finish is left of the start.',
        'Δd = −3 m → 3 m left.',
      ),
      s(
        'State the distinction',
        'Distance is a scalar path length. Displacement is a vector change in position. An out-and-back trip can have nonzero distance and zero displacement.',
        'Distance: magnitude. Displacement: magnitude and direction.',
      ),
    ],
    'q-a2': [
      s(
        'Read the vertical axis',
        'On a position–time graph, a horizontal line stays at the same position while time passes.',
        'Position is constant.',
      ),
      s(
        'Calculate its slope',
        'There is no change in position, so rise is zero. Dividing zero by elapsed time gives zero velocity.',
        'v = Δd/Δt = 0 m/s.',
      ),
      s(
        'Describe the motion',
        'The object is stopped relative to this origin. A horizontal velocity–time line would have a different meaning, so the axis matters.',
        'The object is at rest.',
      ),
    ],
    'q-a3': [
      s(
        'Choose the north axis',
        'Take north as positive. The car’s northward velocity is positive; the negative acceleration points south.',
        'v > 0; a < 0.',
      ),
      s(
        'Explain what changes',
        'Southward acceleration removes northward velocity each second, so the car slows while it is still moving north.',
        'Acceleration opposes velocity → speed decreases.',
      ),
      s(
        'Do not assume it stops accelerating',
        'If that acceleration continues after v reaches zero, the car reverses and gains southward speed. The wording does not give a duration, so do not invent a stopping time.',
        'Initially slows northward; continued acceleration could reverse the motion.',
      ),
    ],
    'q-a4': [
      s(
        'Start at the origin',
        'Put time horizontally and displacement vertically. Forward is positive.',
        'Begin at Δd = 0.',
      ),
      s(
        'Draw each stage',
        'Going forward raises displacement. Rest leaves it unchanged. Returning decreases displacement until it reaches zero.',
        'Rising segment → horizontal segment → falling segment ending at zero.',
      ),
      s(
        'Match slope to velocity',
        'Positive slope means forward motion; zero slope means rest; negative slope means returning. No durations or speeds are specified, so this is a qualitative sketch.',
        'Label the three stages; do not add invented measurements.',
      ),
    ],
    'q-a5': [
      s(
        'Choose a vertical throw',
        'At the highest point of a freely thrown ball, its upward motion has just stopped before the downward part begins.',
        'v = 0 m/s at the top.',
      ),
      s(
        'Keep gravity acting',
        'Gravity does not switch off at the top. With up positive, acceleration is still −9.8 m/s² on Wadson’s formula sheet.',
        'a = −9.8 m/s² downward.',
      ),
      s(
        'Explain the instant',
        'Zero velocity describes one instant. Nonzero acceleration explains why the velocity immediately becomes downward.',
        'Momentarily at rest, while still accelerating downward.',
      ),
    ],
    'q-b6': [
      s(
        'Use the axes',
        'Rise is change in position; run is elapsed time. Their ratio is velocity.',
        'Slope = Δd/Δt = v.',
      ),
      s(
        'Keep direction',
        'A negative slope means motion in the negative direction. A horizontal position line means zero velocity.',
        'Slope unit: m/s.',
      ),
      s(
        'Distinguish average and instantaneous',
        'A line through two readings gives average velocity over that interval. A tangent gives velocity at one instant.',
        'Secant: interval average; tangent: instantaneous velocity.',
      ),
    ],
    'q-b7': [
      s(
        'Use the axes',
        'Rise is the change in velocity, not the velocity itself. Run is elapsed time.',
        'Slope = (vf − vi)/Δt = a.',
      ),
      s(
        'Follow units',
        'Metres per second divided by seconds gives metres per second squared.',
        'Slope unit: m/s².',
      ),
      s(
        'Read the sign',
        'An upward slope is positive acceleration even below the time axis. A horizontal velocity line is zero acceleration.',
        'Slope tells acceleration; vertical position tells velocity direction.',
      ),
    ],
    'q-b8': [
      s(
        'Use area rather than slope',
        'Each thin time strip contributes velocity × elapsed time. Adding the strips gives displacement.',
        'Area unit: (m/s) × s = m.',
      ),
      s(
        'Keep the sign of each region',
        'Area above zero velocity is positive; area below zero is negative. Add signed areas to find displacement.',
        'Δd = signed area under the velocity–time graph.',
      ),
      s(
        'Separate distance',
        'Distance adds the magnitudes of those areas, so opposite-direction parts do not cancel.',
        'Distance = sum of absolute areas.',
      ),
    ],
    'q-b9': [
      s(
        'Label the known times',
        'Velocity starts at zero. It rises during 0–4 s, then stays constant during 4–7 s.',
        'Time axis: 0, 4, 7 s.',
      ),
      s(
        'Draw the final stage',
        'The velocity then slopes down to zero. The final duration and peak speed are not given, so mark them symbolically rather than inventing them.',
        'Peak velocity = vₘₐₓ (not specified); final time not specified.',
      ),
      s(
        'Explain the slopes',
        'Rising velocity means positive acceleration; the flat segment has zero acceleration; the final falling segment has negative acceleration while the object is still moving forward.',
        'Positive slope → zero slope → negative slope.',
      ),
    ],
    'q-b11': missing(
      'the velocity–time graph for B11, including its plotted coordinates over 0–6 s',
      'Δd₀₋₃ = signed area from 0 to 3 s; Δd₀₋₆ = signed area from 0 to 6 s.',
      'Use rectangles (vΔt), triangles (½base×height) or trapezoids (½(vᵢ+v𝒇)Δt) for each straight segment. Areas below zero velocity are negative.',
    ),
    'q-b12': missing(
      'the position–time graph for B12, including the segment around 3.7 s and every turning point',
      'Distance = Σ|d₂−d₁|; speed at 3.7 s = |local slope|; Δd = d(6)−d(0).',
      'Distance counts every change in position. Displacement compares only the endpoints. The furthest point has the largest |d(t)−d(0)|, not necessarily the largest positive position.',
    ),
    'q-c12': [
      s(
        'At the highest point',
        'Up is positive. The ball starts at +12.0 m/s, gravity is −9.8 m/s² and vf = 0 at the top.',
        'vi = +12.0 m/s; vf = 0; a = −9.8 m/s².',
      ),
      s(
        'Find the rise',
        'Time is unnecessary for height. Rearrange vf² = vi² + 2aΔd, then substitute.',
        'Δd = (0² − 12.0²)/(2×−9.8) = 7.3469… m.',
      ),
      s(
        'Find time to the top',
        'Use the change in velocity divided by acceleration. Both numerator and denominator are negative, leaving a positive elapsed time.',
        'Δt = (0 − 12.0)/(−9.8) = 1.22449… s.',
      ),
      s(
        'Format the two answers',
        'These are height and elapsed time, so use nonnegative magnitudes and units. The formula sheet’s g = 9.8 limits the calculation to two significant figures.',
        'Maximum height ≈ 7.3 m above release; time to the top ≈ 1.2 s.',
      ),
    ],
    'q-d19': [
      s(
        'Use one origin for both balls',
        'Take ground level as d = 0 and up as positive. The dropped ball starts at 60 m; the other starts at ground level with velocity +20 m/s. Both have a = −9.8 m/s².',
        'd₁ = 60 − 4.9t²; d₂ = 20t − 4.9t².',
      ),
      s(
        'Set positions equal',
        'They meet when they have the same position at the same time. Their identical gravity terms cancel.',
        '60 − 4.9t² = 20t − 4.9t² → 60 = 20t → t = 3 s.',
      ),
      s(
        'Find the meeting position',
        'Use that same time in either position equation. They meet above ground, so neither has hit the ground first.',
        'd = 20(3) − 4.9(3)² = 15.9 m above ground.',
      ),
      s(
        'Check the physical timing',
        'The dropped ball reaches ground after √(120/9.8) ≈ 3.50 s. The upward ball returns after 40/9.8 ≈ 4.08 s. Both times exceed the 3 s meeting time.',
        'Yes, they meet at t = 3 s, 15.9 m above ground before final rounding. The printed 60 and 20 do not specify trailing-zero precision.',
      ),
    ],
    'q-e20': missing(
      'a ruler-scale image or measured positions of the review-package tape, and the dot indexes for each reading',
      'Δt = number of dot gaps × 0.050 s; v = Δd/Δt; tₘᵢd = (tᵢ+t𝒇)/2; a = slope of v vs t.',
      'This review tape uses 0.050 s per dot. The separate cart lab uses 1/60 s per dot; do not reuse its timing or measurements here. Count gaps, not the number of dots, and do not assume zero starting velocity.',
    ),
    'q-e21': missing(
      'the paired height and shoe-size values for E21, with height units',
      'x = shoe size; y = height (with the given unit).',
      'Plot every actual pair, then describe the trend and scatter. A trend is not an exact prediction for each person; a fit needs the real pairs before a slope or intercept can be calculated.',
    ),
  },
  'physics-textbook-accelerated-motion': {
    'q-1': missing(
      'Figure 8 and its timed object positions',
      'Velocity arrow direction follows motion; arrow length reflects displacement per equal time interval.',
      'Equal spacing at equal time means steady speed. Increasing spacing means speeding up; decreasing spacing means slowing. The figure is required to know which is actually shown.',
    ),
    'q-2': missing(
      'Figure 9 with axes, scale and segment endpoints',
      'a = slope = Δv/Δt.',
      'Horizontal v–t portions have steady velocity. Positive slope is positive acceleration. The steepest downward slope is the greatest negative acceleration; a negative velocity by itself is not negative acceleration.',
    ),
    'q-3': missing(
      'Figure 9’s velocity readings at 0, 5, 15, 20 and 40 s',
      'a₀₋₅ = [v(5)−v(0)]/5; a₁₅₋₂₀ = [v(20)−v(15)]/5; a₀₋₄₀ = [v(40)−v(0)]/40.',
      'Subtract final minus initial velocity for each requested interval. Keep signed readings. Do not average unweighted segment slopes over the whole trip.',
    ),
    'q-4': [
      s(
        'Accelerate upward from rest',
        'Up is positive. Over the first 2 s, a = +0.5 m/s², so velocity reaches +1.0 m/s.',
        'v(0)=0; v(2)=+1.0 m/s.',
      ),
      s(
        'Cruise for twelve seconds',
        'The velocity stays at +1.0 m/s from t = 2 to 14 s. A horizontal v–t line represents moving, not stopped.',
        'v = +1.0 m/s for 2–14 s.',
      ),
      s(
        'Slow while still moving up',
        'Acceleration points down, so a = −0.25 m/s². After 4 more seconds, v = 1.0 − 0.25(4) = 0.',
        'Draw a straight line from (14 s, 1.0 m/s) to (18 s, 0).',
      ),
      s(
        'Check area and continuity',
        'The signed areas are 1 m, 12 m and 2 m. Velocity remains positive until the final stop; position increases continuously by 15 m.',
        'Total upward displacement = ½(2)(1) + 12(1) + ½(4)(1) = 15 m.',
      ),
    ],
    'q-7b': [
      s(
        'Keep the same velocity change',
        'The bus starts at −25 m/s west and finishes at zero. Its change in velocity is +25 m/s east.',
        'Δv = 0 − (−25) = +25 m/s.',
      ),
      s(
        'Double only the time',
        'Average acceleration is velocity change divided by time. Twice the denominator makes the result half as large.',
        'a = 25/6.0 ≈ +4.2 m/s².',
      ),
      s(
        'Keep the direction',
        'The acceleration still points east, opposite the westward motion. Positive acceleration slows this bus.',
        'Half the magnitude; still eastward.',
      ),
    ],
    'q-16c': [
      s(
        'Find when it stops',
        'Take toward the hole/uphill as positive. v = 2.0 − 0.50t reaches zero at t = 4.0 s.',
        'Turnaround: 0 = 2.0 − 0.50t → t = 4.0 s.',
      ),
      s(
        'Describe both parts',
        'Before 4.0 s it goes uphill while slowing. After 4.0 s the same downhill acceleration makes it return downhill while speeding up.',
        'At 6.0 s, v = −1.0 m/s → 1.0 m/s away from the hole.',
      ),
      s(
        'Place the motion dots',
        'Position is d = 2t − 0.25t². At t = 0,1,2,3,4,5,6 s the positions are 0,1.75,3,3.75,4,3.75,3 m.',
        'Dots get closer going uphill, stop at 4 m, then spread in the downhill direction.',
      ),
      s(
        'Use arrows with the right signs',
        'Velocity points uphill before the turnaround and downhill after it. Acceleration points downhill throughout, including when velocity is momentarily zero.',
        'v changes direction; a remains −0.50 m/s².',
      ),
    ],
    'q-20': missing(
      'Figure 13’s cyclist velocity–time curves and interval endpoints',
      'Δd for each cyclist = signed area under that cyclist’s curve.',
      'Split each actual curve into rectangles, triangles and trapezoids. Use the axis scale to calculate each area in metres; subtract any below-zero area.',
    ),
    'q-21': missing(
      'Figure 14’s walker velocity readings and time-axis scale over the 4 s interval',
      'Δd = ½(vᵢ+v𝒇)Δt for a straight segment; add signed areas if there are multiple segments.',
      'Displacement comes from velocity–time area, not the height or slope of the line. The figure is needed to obtain each walker’s velocities.',
    ),
    'q-22a': [
      s(
        'Choose east as positive',
        'The car is going west, so its velocity changes from 0 to −25 m/s over 12 s.',
        'Draw (0 s, 0) to (12 s, −25 m/s).',
      ),
      s(
        'Connect with a straight line',
        'Uniform acceleration gives a constant slope: −25/12 ≈ −2.08 m/s².',
        'The v–t line slopes down below zero.',
      ),
      s(
        'Check the signed area',
        'The triangle below zero has area −½(12)(25) = −150 m. Its negative sign means westward displacement.',
        'Δd = −150 m → 150 m west.',
      ),
    ],
    'q-22c-d': [
      s(
        'Keep the same displacement and duration',
        'From 22b: displacement is −150 m over 12.0 s. A steady-speed car must have that same signed graph area.',
        'v = Δd/Δt = −150/12.0 = −12.5 m/s.',
      ),
      s(
        'Draw constant velocity',
        'Draw a horizontal line at −12.5 m/s from 0 to 12 s. It lies below zero because the car travels west.',
        'Unrounded velocity = 12.5 m/s west.',
      ),
      s(
        'Compare the areas',
        'The rectangle −12.5×12 and the accelerating car’s triangle both have area −150 m. Equal area means equal displacement, even with different motion.',
        'Steady speed = average speed of the uniformly accelerating car: 12.5 m/s west before final rounding. To two significant figures, the captured “round even” reminder gives 12 m/s; half-up gives 13 m/s. The printed teacher tie rule is unavailable.',
      ),
    ],
    'q-42': [
      s(
        'Keep the actual motion the same',
        'Our usual convention takes up as positive. This question explicitly asks you to reverse the axis, so take down as positive just for this comparison.',
        'Old: a = −9.8 m/s². Reversed axis: a = +9.8 m/s².',
      ),
      s(
        'Recalculate the signed values',
        'For the brick dropped over 4.0 s, vf = +9.8(4.0) = +39.2 m/s; Δd = ½(9.8)(4.0)² = +78.4 m.',
        'The signed numbers reverse; their magnitudes are unchanged.',
      ),
      s(
        'Keep the physical direction',
        'The brick still falls downward. Written direction makes the final vectors independent of the chosen axis.',
        '39 m/s downward; displacement 78 m downward (2 significant figures).',
      ),
    ],
    'q-45a': [
      s(
        'Find the instant at the top',
        'The coin has finished going up and has not yet begun going down, so its vertical velocity is zero.',
        'v = 0 m/s.',
      ),
      s(
        'Keep the force of gravity',
        'Gravity is still downward at that instant. Up is positive, so its acceleration remains negative.',
        'a = −9.8 m/s² → 9.8 m/s² downward.',
      ),
      s(
        'Separate velocity from acceleration',
        'Velocity says how it moves now. Acceleration says how that velocity changes next. Zero velocity does not imply zero acceleration.',
        'Momentarily stopped; still accelerating downward.',
      ),
    ],
    'q-46': [
      s(
        'Use the axis in this question',
        'This question explicitly defines down as positive. Start at the release point, d = 0; the floor is d = +1.5 m.',
        'a = +9.8 m/s² between bounces.',
      ),
      s(
        'Draw the first fall',
        'd = ½gt² curves upward from zero to +1.5 m. v = gt rises from zero to about +5.42 m/s at 0.553 s.',
        'Position is continuous; its slope is the downward velocity.',
      ),
      s(
        'Represent the first bounce',
        'At contact, velocity changes rapidly from positive/down to negative/up. Reaching 0.75 m above the floor requires an upward rebound speed √(2g×0.75) ≈ 3.83 m/s.',
        'After bounce: v ≈ −3.83 m/s; position falls to d = 0.75 m at the top.',
      ),
      s(
        'Represent the smaller bounce',
        'The next rebound rises only 0.25 m above the floor: upward rebound speed ≈ 2.21 m/s and the next top is d = 1.25 m. Gravity stays positive between contacts.',
        'Velocity jumps at contacts, then slopes upward; position has sharp changes in slope, with no position jumps.',
      ),
      s(
        'Label the ideal model',
        'The sketches use brief idealized contacts. Bounce duration is not given, so do not claim a measured contact time or infinite physical acceleration.',
        'Floor d = 1.5 m; bounce tops d = 0.75 m and 1.25 m.',
      ),
    ],
  },
  'physics-basic-skills': {
    'q-percent-error': missing(
      'the experimental measurement and accepted comparison value from the actual measurement exercise',
      'Percent error = |experimental − accepted| / |accepted| × 100%.',
      'Use the accepted value in the denominator and the same units for both measurements. The result is nonnegative and has %, not metres or seconds. Neither value is supplied in this public question.',
    ),
  },
};
