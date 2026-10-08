import type { GuideStep } from '../core/walkthrough';
type Point = GuideStep;
const point = (title: string, text: string, write: string): Point => ({
  title,
  text,
  write,
  phase: 'working',
});
const unavailable = (item: string): Point =>
  point(
    'Source needed',
    `The available capture does not contain ${item}. A clear image of that part, including headings, axis scales and units, is needed to fill the actual sheet accurately.`,
    `Missing: ${item}. No numerical answer is supported yet.`,
  );
export const packetGuides: Record<string, Record<string, Point[]>> = {
  'physics-motion-packet': {
    'q-8-1': [
      point(
        'Scalar / vector',
        'A scalar gives magnitude only: distance, speed and elapsed time. A vector includes direction: position, displacement, velocity and acceleration. A negative component is a calculation sign; write the final direction in words.',
        'Scalar: magnitude. Vector: magnitude and direction.',
      ),
      point(
        'Distance / displacement',
        'Distance adds the lengths of every part of a path. Displacement compares finish and start: Δd = d𝒇 − dᵢ. With right positive, a leftward movement contributes a negative displacement. An out-and-back trip can have positive distance and zero displacement.',
        'Distance = total path length. Displacement = final position − initial position.',
      ),
      point(
        'Position–time graphs',
        'Position goes on the vertical axis and time on the horizontal axis. A rising straight line means constant positive velocity; a falling straight line means constant negative velocity. A horizontal line means the position does not change.',
        'Slope = Δd/Δt = velocity. Horizontal position–time line → at rest.',
      ),
      point(
        'Uniform motion',
        'Uniform motion keeps velocity constant: equal displacements in equal time intervals with the same direction. Steady speed while turning is not constant velocity.',
        'Uniform motion → constant velocity; acceleration = 0.',
      ),
      unavailable(
        'the original pp.147–153 blank sentences, numbered paths, coordinates and diagrams',
      ),
    ],
  },
  'physics-average-velocity': {
    'q-156': [
      point(
        'Average velocity',
        'Use the signed change in position for the entire interval and divide by elapsed time. Average speed instead uses total distance; the two can differ after a reversal.',
        'vavg = Δd/Δt; Δd = vavgΔt; Δt = Δd/vavg.',
      ),
      point(
        'Keep units consistent',
        'For metres and seconds the answer is m/s. For kilometres and hours it is km/h. Convert minutes to hours by dividing by 60, keeping the conversion exact.',
        'Write the displacement sign from direction, then a positive elapsed time.',
      ),
      unavailable('p.156’s table entries and full numerical word problems'),
    ],
    'q-157': [
      point(
        'What slope means',
        'On a position–time graph, slope is change in position divided by elapsed time. A straight line has constant slope, so the velocity is constant. A horizontal line has zero slope, so the object is stopped.',
        'v = (d₂ − d₁)/(t₂ − t₁), in position units per time unit.',
      ),
      point(
        'Rise and run',
        'Choose two readable points on the same line, far apart. Subtract their position coordinates for rise and their time coordinates for run. Falling lines have negative rise and therefore negative velocity.',
        'Rise = d₂ − d₁. Run = t₂ − t₁. Slope = rise/run.',
      ),
      unavailable(
        'the numerical coordinates and axis scales of lines A–D on p.157',
      ),
    ],
    'q-158': [
      point(
        'Use each printed interval',
        'The captured interval boundaries are 0–2, 2–5, 5–7, 7–12, 12–14, 14–16, 16–18, 18–19 and 19–20 s. Each interval has its own starting and ending position.',
        'Durations: 2, 3, 2, 5, 2, 2, 2, 1, 1 s.',
      ),
      point(
        'Calculate from the endpoints',
        'For each row subtract starting position from ending position, then divide by that row’s duration. Do not divide every displacement by 20 s: that would describe the whole trip.',
        'Δdrow = dend − dstart; vrow = Δdrow/Δtrow.',
      ),
      unavailable(
        'the girl’s graph positions at those boundary times on p.158',
      ),
    ],
    'q-159': [
      point(
        'Squirrel / runners',
        'Velocity is the slope of each position–time segment. Two runners meet where their position–time lines intersect, because they are at the same position at the same time. The steeper line has the greater velocity magnitude.',
        'A flat position–time segment means a stop; a negative slope means motion in the negative direction.',
      ),
      unavailable(
        'the squirrel and runner graphs, coordinates, scales and full subquestions on p.159',
      ),
    ],
    'q-160-161': [
      point(
        'Construct the requested graph',
        'Place time horizontally and position vertically. Plot each supplied time/position pair. Connect according to the described motion: straight segments for constant velocity, a curve if velocity changes. The initial point must be the supplied initial position, which need not be zero.',
        'Title: Position vs Time. Axes: time with units; position with units and positive direction.',
      ),
      unavailable('the numerical data and motion descriptions for pp.160–161'),
    ],
    'q-162-163': [
      point(
        'Match table and graph',
        'For constant velocity, Δd = vΔt and a position–time graph is straight. If a table gives positions, subtract successive positions before calculating interval velocities. A negative slope describes direction; it does not automatically mean slowing down.',
        'Use the signed displacement and the actual elapsed time for each row.',
      ),
      unavailable(
        'the assessment tables, graphs and complete questions on pp.162–163',
      ),
    ],
  },
  'physics-describing-acceleration': {
    'q-164-166': [
      point(
        'Acceleration',
        'Velocity changes when speed changes, direction changes, or both. Slowing down is acceleration. Constant velocity has zero acceleration. Turning at a steady speed still changes velocity.',
        'Acceleration = change in velocity / elapsed time.',
      ),
      point(
        'Free fall',
        'Ignore air resistance only when the model allows it. Up is positive, so gravity points down: a = −9.8 m/s² using Wadson’s supplied sheet. Gravity does not stop at the highest point.',
        'At the top: v = 0 for an instant; a = −9.8 m/s².',
      ),
      unavailable(
        'the exact vocabulary blanks and original diagrams on pp.164–166',
      ),
    ],
    'q-167': [
      point(
        'Signed change',
        'Subtract initial velocity from final velocity: Δv = vf − vi. Subtracting a negative adds its magnitude. A velocity sign describes direction; compare magnitudes to decide if speed increases.',
        'Δv = vf − vi.',
      ),
      point(
        'Supported table entries',
        'The captured values support these rows (m/s): +14 → +5 gives Δv = −9; +8 with Δv = 0 ends at +8; ending at +25 with Δv = +12 starts at +13; +20 → −30 gives Δv = −50; −38 with Δv = −10 ends at −48; ending at −16 with Δv = 0 starts at −16; −3 → +22 gives Δv = +25.',
        'Δv values: −9, 0, +12, −50, −10, 0, +25 m/s; preserve the row match on your actual table.',
      ),
      point(
        'Reversals',
        'The +20 to −30 and −3 to +22 rows reverse direction. They pass through zero velocity if the change is continuous. Do not call the entire interval simply “speeding up” or “slowing down”.',
        'A sign reversal means a change in direction.',
      ),
      unavailable(
        'the complete printed p.167 table layout and any additional rows',
      ),
    ],
    'q-168-169': [
      point(
        'Compare velocity and acceleration',
        'Same signs mean speed increases; opposite signs mean speed decreases until a possible reversal. Positive acceleration can slow a left-moving object, because its velocity is negative.',
        'v > 0, a > 0: speeds up. v > 0, a < 0: slows. v < 0, a < 0: speeds up. v < 0, a > 0: slows.',
      ),
      point(
        'Zero cases',
        'Zero acceleration means velocity stays constant, which can be nonzero. Zero velocity describes an instant and does not require zero acceleration.',
        'v = 0 at a turning point can occur with a ≠ 0.',
      ),
      unavailable('the exact cases and printed answer spaces on pp.168–169'),
    ],
  },
  'physics-calculating-acceleration': {
    'q-170-171': [
      point(
        'Velocity–time slope',
        'Acceleration is rise in velocity divided by run in time. A horizontal velocity–time line means zero acceleration; its height can still show nonzero velocity. Above/below zero tells velocity direction.',
        'a = (vf − vi)/(tf − ti).',
      ),
      point(
        'Gravity',
        'For vertical free fall with up positive, a = −9.8 m/s² on Wadson’s formula sheet. Rising objects lose upward velocity; falling objects gain downward speed under the same downward acceleration.',
        'Gravity remains downward throughout the flight.',
      ),
      unavailable(
        'the actual graph coordinates and marked stages on pp.170–171',
      ),
    ],
    'q-172': [
      point(
        'Solve the missing quantity',
        'Start from vf = vi + aΔt. Subtract vi to find Δv, divide Δv by Δt to find acceleration, or divide Δv by acceleration to find elapsed time. A negative numerator divided by a negative acceleration can give a positive time.',
        'a = (vf − vi)/Δt; vf = vi + aΔt; vi = vf − aΔt; Δt = (vf − vi)/a.',
      ),
      unavailable('p.172’s numerical table entries and full word problems'),
    ],
    'q-173': [
      point(
        'Analyze each segment',
        'Read the velocity at each labelled endpoint, then divide the velocity change by that interval’s duration. A zero crossing marks a stop and possible reversal. The line’s slope, not whether it is above zero, sets the acceleration sign.',
        'For each marked interval: a = Δv/Δt in m/s².',
      ),
      point(
        'Direction and speed',
        'A negative velocity with positive slope describes motion in the negative direction while slowing. After crossing zero with that same slope, it moves in the positive direction and speeds up.',
        'Write acceleration magnitude plus direction in the final vector answer.',
      ),
      unavailable(
        'the original p.173 ball graph’s marked times, velocities and axis scales',
      ),
    ],
    'q-174-176': [
      point(
        'Build the correct graph',
        'On velocity–time, constant acceleration produces a straight line beginning at the actual initial velocity. Constant velocity is horizontal. On position–time, constant acceleration produces a curve whose slope changes.',
        'Velocity–time slope = acceleration; signed velocity–time area = displacement.',
      ),
      point(
        'Displacement / distance',
        'Area below the time axis counts negatively for displacement. For total distance, add area magnitudes on both sides of the axis.',
        'Do not cancel leftward and rightward distances.',
      ),
      unavailable(
        'the motion data, figures and precise graph requests on pp.174–176',
      ),
    ],
  },
  'physics-ticker-lab': {
    'q-analysis': [
      point(
        'Use the recorded tape',
        'The inclined-cart lab timer makes 60 dots/s; every sixth dot is 0.100 s. Use the lab analysis below to load your private captured positions or paste your own measured pairs. The faint later marks and an unconfirmed zero point are excluded.',
        'Use measured positions, in order, with their actual times.',
      ),
      point(
        'Calculate intervals',
        'Subtract consecutive positions, convert mm to metres if needed, and divide by the actual interval duration. Put each velocity at its interval midpoint, not at its ending time.',
        'v = (d₂ − d₁)/(t₂ − t₁); midpoint = (t₁ + t₂)/2.',
      ),
      point(
        'Interpret your fit',
        'The velocity–time slope estimates acceleration. Scatter and uncertainty decide how strongly the tape supports constant acceleration. A first-to-last slope can differ from a least-squares fit.',
        'Missing faint readings, ruler uncertainty and setup observations must come from your own evidence.',
      ),
    ],
  },
  'physics-uniform-lab': {
    'q-1-2': [
      point(
        'Work from your car run',
        'No measured toy-car table is available here. Use your own time/position pairs from at least ten intervals, as required by the captured formal-lab instructions. Do not reuse the separate informal sprint or incline tape.',
        'Needed: the car’s measured times and positions, origin, direction and instrument uncertainty.',
      ),
      point(
        'Interval / total average',
        'For each interval, v = (d₂ − d₁)/(t₂ − t₁). For the whole run use only the first and last recorded positions and times. Equal-duration intervals can be averaged; unequal ones need time weighting.',
        'vavg,total = (dlast − dfirst)/(tlast − tfirst).',
      ),
      point(
        'Show a sample',
        'Write one interval’s actual substitution with units. Put all repeated interval calculations in a labelled table, and compare the variation with measurement uncertainty.',
        'No numerical velocities can be calculated until your actual run is supplied.',
      ),
    ],
    'q-3-4': [
      point(
        'Position–time',
        'Plot the measured points with time horizontal and position vertical. Use a justified best fit, not an automatic curve. Constant velocity is consistent with a straight position–time fit.',
        'Slope = velocity, in m/s; use widely separated points on the fit for the graphical slope.',
      ),
      point(
        'Velocity–time',
        'Plot each interval velocity at the midpoint of its start and end times. Approximately uniform motion gives a horizontal best fit; scatter must be considered with uncertainty.',
        'Needed: measured times/positions to calculate points and a slope.',
      ),
      point(
        'Interpret the actual data',
        'Compare graphical and computer slopes as required. Discuss specific timing or position errors and their effect rather than assuming the car’s motion was uniform.',
        'Use your own report data; no graph or result is fabricated here.',
      ),
    ],
  },
};
