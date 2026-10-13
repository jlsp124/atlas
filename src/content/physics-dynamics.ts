import type { Assignment, CompanionQuestion } from '../core/schema';
import type { GuideStep, KnownValue } from '../core/walkthrough';

export type ForceArrow = {
  label: string;
  direction: 'up' | 'down' | 'left' | 'right';
  size: number;
};
export type DynamicsLesson = {
  prompt: string;
  asking: string;
  page: string;
  axis: string;
  values: KnownValue[];
  target: string;
  clues: { word: string; explanation: string }[];
  steps: GuideStep[];
  forces?: ForceArrow[];
  result?: { value: number; unit: string; direction?: string };
  gap?: string;
};
const value = (
  symbol: string,
  n: number,
  unit: string,
  source = String(n),
): KnownValue => ({
  symbol,
  value: n,
  text:
    Number.isFinite(Number(source)) && Math.abs(Number(source)) === Math.abs(n)
      ? `${n < 0 ? '−' : ''}${source}`
      : String(n),
  unit,
  source,
});
const step = (title: string, text: string, write: string): GuideStep => ({
  title,
  text,
  write,
  phase: 'relationship',
});
const clue = (word: string, explanation: string) => ({ word, explanation });
const force = (
  label: string,
  direction: ForceArrow['direction'],
  size = 1,
): ForceArrow => ({ label, direction, size });
const horizontal = 'Take right/east as positive; left/west is negative.';
const vertical = 'Take up as positive; gravity acts downward.';
const lesson = (
  prompt: string,
  asking: string,
  page: string,
  values: KnownValue[],
  target: string,
  steps: GuideStep[],
  extra: Partial<DynamicsLesson> = {},
): DynamicsLesson => ({
  prompt,
  asking,
  page,
  values,
  target,
  steps,
  axis: horizontal,
  clues: [],
  ...extra,
});

// Each entry was checked against the captured Chapter 4 page. Missing numbers
// remain numbered positions in the same assignment, never reconstructed questions.
export const dynamicsLessons: Record<string, DynamicsLesson> = {
  '1': lesson(
    'A skydiver falls downward through air at constant velocity. Draw motion and free-body diagrams; identify the net force and acceleration.',
    'Separate the downward motion from the forces that change that motion.',
    '93',
    [],
    'Fnet and a',
    [
      step(
        'Identify the skydiver as the system',
        'Draw forces ON the skydiver. Earth pulls downward; air pushes upward. A velocity arrow is not a force.',
        'Fg down; Fair up; v down.',
      ),
      step(
        'Use constant velocity',
        'The speed and direction do not change. Therefore acceleration is zero. Newton’s second law then requires zero net force.',
        'a = 0 → Fnet = ma = 0 → Fair = Fg.',
      ),
      step(
        'Draw the motion separately',
        'Equal downward spacing at equal time intervals shows constant downward velocity. Use equal-length opposing force arrows.',
        'Equal downward motion arrows; equal upward/downward force arrows.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'constant velocity',
          'No change in velocity means a = 0, even while falling.',
        ),
      ],
      forces: [force('Fair', 'up'), force('Fg', 'down')],
    },
  ),
  '2': lesson(
    'Hold a softball on your palm, then toss it up. Draw the motion and force diagrams during the toss while the ball is still touching your hand.',
    'Explain the upward push while the hand is still accelerating the ball.',
    '93',
    [],
    'Fnet and a',
    [
      step(
        'Keep the stated part of the toss',
        'The ball starts from rest, but the hand gives it upward velocity before release. During this upward push its acceleration is upward.',
        'During the toss: v increases upward; a is upward.',
      ),
      step(
        'Compare the two forces on the ball',
        'Your hand pushes upward while Earth attracts the ball downward. To accelerate it up, the hand force must exceed its weight.',
        'Fhand − Fg = ma > 0 → Fhand > Fg.',
      ),
      step(
        'Draw both representations',
        'Draw upward motion dots with increasing spacing. The upward hand-force arrow is longer than the downward weight arrow. After release, remove the hand force.',
        'While in contact during the toss: Fnet up; a up.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'still touching your hand',
          'The contact force still accelerates the ball during the toss.',
        ),
      ],
      forces: [force('Fhand', 'up', 1.5), force('Fg', 'down')],
    },
  ),
  '3': lesson(
    'After the softball leaves your hand, it rises while slowing down. Ignore air resistance. Draw its motion and free-body diagrams.',
    'Explain why upward velocity can accompany downward acceleration.',
    '93',
    [],
    'Fnet and a',
    [
      step(
        'Remove the contact force',
        'Once the hand stops touching the ball, it no longer pushes on it. With air resistance ignored, only Earth’s gravitational force remains.',
        'Fg = mg downward; Fhand = 0.',
      ),
      step(
        'Connect force to acceleration',
        'Fnet = ma gives a = −g. The upward velocity decreases because this acceleration points against it.',
        'a = −9.8 m/s²; v is still upward.',
      ),
      step(
        'Show the slowing motion',
        'Draw upward motion dots with decreasing spacing and upward velocity arrows getting shorter. The force arrow continues downward.',
        'v up; a and Fnet down.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'leaves your hand',
          'No hand–ball contact means no force from the hand.',
        ),
      ],
      forces: [force('Fg', 'down')],
    },
  ),
  '4': lesson(
    'After the softball reaches its maximum height, it falls and speeds up. Ignore air resistance. Draw the motion and force diagrams.',
    'Keep gravity acting at the top and throughout the fall.',
    '93',
    [],
    'Fnet and a',
    [
      step(
        'Separate the turning instant',
        'Velocity is zero at the highest point for one instant. Gravity does not switch off there.',
        'At the top: v = 0, a = −9.8 m/s².',
      ),
      step(
        'Follow the fall',
        'After the top, velocity and acceleration both point down, so the downward speed increases.',
        'Fnet = Fg down; a down; v down.',
      ),
      step(
        'Draw increasing spacing',
        'Successive downward positions spread farther apart. Downward velocity arrows become longer; gravity’s force arrow stays the same.',
        'Only Fg belongs on the free-body diagram.',
      ),
    ],
    { axis: vertical, forces: [force('Fg', 'down')] },
  ),
  '5': lesson(
    'Catch the falling softball in your hand and bring it to rest. Ignore air resistance. Draw its motion and free-body diagrams during the catch.',
    'Find the force direction needed to remove downward velocity.',
    '93',
    [],
    'Fnet and a',
    [
      step(
        'Notice which velocity is being reduced',
        'The ball is moving down but slowing. Its acceleration therefore points up, opposite the downward velocity.',
        'v down; a up.',
      ),
      step(
        'Add the forces on the ball',
        'The hand pushes up and gravity pulls down. An upward net force requires the hand’s force to exceed the weight.',
        'Fnet = Fhand − mg > 0 → Fhand > mg.',
      ),
      step(
        'Distinguish catching from holding',
        'During stopping, the upward arrow is longer. Once the ball is held at rest, the arrows become equal.',
        'During catch: net force up. After stopping: net force zero.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'bring it to rest',
          'Stopping downward motion requires upward acceleration.',
        ),
      ],
      forces: [force('Fhand', 'up', 1.5), force('Fg', 'down')],
    },
  ),
  '6': lesson(
    'Horizontal forces of 225 N and 165 N act on a canoe in the same direction. Find the net horizontal force.',
    'Add forces that point together.',
    '96',
    [value('F1', 225, 'N'), value('F2', 165, 'N')],
    'Fnet',
    [
      step(
        'Choose the common direction as positive',
        'Both forces contribute positively on the same axis.',
        'Fnet = F1 + F2.',
      ),
      step(
        'Add the contributions',
        'Net force is the vector sum, not a separate extra push.',
        'Fnet = 225 + 165 = 390 N in their common direction.',
      ),
    ],
    {
      axis: 'Take the two forces’ common direction as positive.',
      clues: [
        clue('same direction', 'Add their magnitudes because the signs agree.'),
      ],
      result: { value: 390, unit: 'N', direction: 'in the common direction' },
    },
  ),
  '7': lesson(
    'The same 225 N and 165 N canoe forces now act in opposite directions. Find the net horizontal force and its direction.',
    'Subtract opposing forces using one axis.',
    '96',
    [value('F1', 225, 'N'), value('F2', -165, 'N', '165')],
    'Fnet',
    [
      step(
        'Choose the larger force’s direction',
        'The 225 N force is positive and the opposing 165 N force is negative.',
        'Fnet = +225 + (−165).',
      ),
      step(
        'Interpret the remaining force',
        'Only 60 N remains unbalanced. Its positive sign means the direction of the 225 N force.',
        'Fnet = 60 N toward the 225 N force.',
      ),
    ],
    {
      axis: 'Take the 225 N force’s direction as positive.',
      clues: [
        clue('opposite directions', 'Assign opposite signs before adding.'),
      ],
      result: { value: 60, unit: 'N', direction: 'toward the 225 N force' },
    },
  ),
  '8': lesson(
    'Three dogs pull a sled: Alutia pulls east with 35 N, Seward east with 42 N, and Kodiak west with 53 N. Find the net force.',
    'Combine all three signed forces.',
    '96',
    [value('FA', 35, 'N'), value('FS', 42, 'N'), value('FK', -53, 'N', '53')],
    'Fnet',
    [
      step(
        'Give west the opposite sign',
        'Eastward forces add; the westward pull removes some of their total.',
        'Fnet = FA + FS + FK.',
      ),
      step(
        'Combine before rounding',
        'The positive result means east on our chosen axis.',
        'Fnet = 35 + 42 − 53 = 24 N east.',
      ),
    ],
    {
      clues: [clue('west', 'West is negative when east is positive.')],
      result: { value: 24, unit: 'N', direction: 'east' },
    },
  ),
  '9': lesson(
    'A spring scale exerts a net force of 2.7 N on a cart of mass 0.64 kg. Find its acceleration.',
    'Connect net force with the change in motion.',
    '97',
    [value('Fnet', 2.7, 'N'), value('m', 0.64, 'kg')],
    'a',
    [
      step(
        'Start with the supplied formula',
        'Newton’s second law uses NET force: Fnet = ma. The question already supplies that net force.',
        'Fnet = ma.',
      ),
      step(
        'Undo multiplication by mass',
        'Divide both sides by m. This leaves acceleration alone.',
        'Fnet/m = a.',
      ),
      step(
        'Substitute and check units',
        'A newton is kg·m/s². Dividing by kilograms leaves m/s².',
        'a = 2.7/0.64 = 4.21875 ≈ 4.2 m/s² in the force’s direction.',
      ),
    ],
    {
      axis: 'Take the net force’s direction as positive.',
      result: {
        value: 2.7 / 0.64,
        unit: 'm/s²',
        direction: 'in the force’s direction',
      },
    },
  ),
  '10': lesson(
    'Kamaria has mass 27.2 kg and is pulled on ice with acceleration 0.80 m/s². Neglect resistance. What force must her mother exert?',
    'Use the absence of resistance to identify the horizontal net force.',
    '97',
    [value('m', 27.2, 'kg'), value('a', 0.8, 'm/s²', '0.80')],
    'Fpull',
    [
      step(
        'Separate the vertical and horizontal axes',
        'Weight and support balance vertically. With resistance neglected, the mother’s pull is the only horizontal force.',
        'Fnet(horizontal) = Fpull.',
      ),
      step(
        'Use the force–acceleration relationship',
        'Multiplying mass by acceleration gives the needed net force.',
        'Fpull = ma = (27.2)(0.80) = 21.76 ≈ 22 N along the pull.',
      ),
    ],
    {
      clues: [
        clue(
          'Neglect resistance',
          'No opposing horizontal force needs to be added.',
        ),
      ],
      result: { value: 27.2 * 0.8, unit: 'N', direction: 'along the pull' },
    },
  ),
  '11': lesson(
    'A crate experiences 317 N to the right and 173 N to the left. Initially at rest, it reaches 6.5 m/s to the right after five seconds. (a) Draw the forces. (b) Find the net force. (c) Find its mass.',
    'Combine a force sum with the observed change in velocity to find mass.',
    '97',
    [
      value('F1', 317, 'N'),
      value('F2', -173, 'N', '173'),
      value('vi', 0, 'm/s', 'at rest'),
      value('vf', 6.5, 'm/s'),
      value('Δt', 5, 's', 'five seconds'),
    ],
    'm',
    [
      step(
        'Draw the two horizontal forces',
        'The rightward arrow is longer. Keep both forces on the crate’s diagram.',
        'Fnet = 317 − 173 = 144 N right.',
      ),
      step(
        'Find the relationship we are missing',
        'Fnet = ma contains two unknowns: m and a. The velocity change and elapsed time let us express acceleration.',
        'a = (vf − vi)/Δt = 6.5/5 = 1.3 m/s² right.',
      ),
      step(
        'Substitute that acceleration into Newton’s law',
        'Replace a by its velocity–time expression. Now the force equation contains only one unknown, mass.',
        'Fnet = m(vf − vi)/Δt.',
      ),
      step(
        'Keep both sides equal',
        'Multiply by Δt, then divide by the velocity change. That removes the denominator and isolates m.',
        'FnetΔt = m(vf − vi) → m = FnetΔt/(vf − vi).',
      ),
      step(
        'Calculate mass, not weight',
        'Use the net force, not 317 N alone. N·s/(m/s) reduces to kg.',
        'm = (144)(5)/6.5 = 110.77 kg ≈ 1.1 × 10² kg.',
      ),
    ],
    {
      clues: [
        clue('Initially at rest', 'The initial velocity is zero.'),
        clue('after five seconds', 'The velocity change takes this interval.'),
      ],
      forces: [force('317 N', 'right', 1.6), force('173 N', 'left')],
      result: { value: (144 * 5) / 6.5, unit: 'kg' },
    },
  ),
  '16': lesson(
    'A watermelon of mass 4.0 kg sits on a spring scale calibrated in newtons. What does the scale read?',
    'A force scale reads weight, not kilograms.',
    '101',
    [value('m', 4, 'kg', '4.0'), value('g', 9.8, 'N/kg', 'Earth')],
    'FN',
    [
      step(
        'Use the stationary condition',
        'The watermelon does not accelerate vertically, so the upward scale force balances weight.',
        'FN − Fg = 0 → FN = Fg.',
      ),
      step(
        'Construct the weight relationship',
        'Gravity accelerates a freely falling mass at g. Applying F = ma to gravity gives Fg = mg.',
        'FN = mg = (4.0)(9.8) = 39.2 ≈ 39 N.',
      ),
    ],
    {
      axis: vertical,
      clues: [clue('calibrated in newtons', 'The scale reports force.')],
      result: { value: 4 * 9.8, unit: 'N' },
      forces: [force('FN', 'up'), force('Fg', 'down')],
    },
  ),
  '17': lesson(
    'A 22.50 kg television weighs 235.2 N on a spring scale. Find the gravitational field at that location.',
    'Infer g from weight and mass instead of assuming Earth’s usual value.',
    '101',
    [value('m', 22.5, 'kg', '22.50'), value('Fg', 235.2, 'N')],
    'g',
    [
      step(
        'Connect measured weight and mass',
        'The local gravitational field is the force per kilogram. The measured weight is Fg = mg.',
        'Fg = mg.',
      ),
      step(
        'Isolate the field',
        'Divide by the television’s mass. The kilograms cancel and leave N/kg.',
        'g = Fg/m = 235.2/22.50 = 10.4533 ≈ 10.45 N/kg, downward.',
      ),
    ],
    {
      axis: vertical,
      result: { value: 235.2 / 22.5, unit: 'N/kg', direction: 'down' },
    },
  ),
  '18': lesson(
    'A 0.50 kg guinea pig is lifted from the ground. What minimum upward force is needed?',
    'Find the threshold that balances its weight, then distinguish balance from acceleration.',
    '101',
    [value('m', 0.5, 'kg', '0.50'), value('g', 9.8, 'N/kg', 'Earth')],
    'Flift',
    [
      step(
        'Write the vertical force sum',
        'Lift acts up; weight acts down. At the threshold, they balance.',
        'Flift − mg = 0 → Flift = mg.',
      ),
      step(
        'Find the threshold force',
        'Exactly this force supports the animal without upward acceleration. Starting an upward lift requires a force slightly greater than this threshold.',
        'mg = (0.50)(9.8) = 4.9 N; Flift > 4.9 N to accelerate upward.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'minimum',
          'Find the balance threshold; a positive upward acceleration needs more.',
        ),
      ],
      result: { value: 0.5 * 9.8, unit: 'N', direction: 'up' },
    },
  ),
  '19': lesson(
    'A grocery sack tears above 230 N. It holds 15 kg and is lifted with acceleration 7.0 m/s². Will it tear?',
    'Compare the required sack force with its limit, including gravity.',
    '101',
    [
      value('Tmax', 230, 'N'),
      value('m', 15, 'kg'),
      value('a', 7, 'm/s²', '7.0'),
      value('g', 9.8, 'N/kg', 'Earth'),
    ],
    'T and whether it exceeds Tmax',
    [
      step(
        'Draw forces on the groceries',
        'The sack pulls up with T. Gravity pulls down with mg. The acceleration is upward.',
        'T − mg = ma.',
      ),
      step(
        'Why ma alone is not the sack force',
        'ma is the leftover force after gravity is subtracted. The sack must both support the weight AND produce this leftover.',
        'T = ma + mg.',
      ),
      step(
        'Build the working relationship',
        'Both terms contain the same mass. Factor m out to see how g and a contribute.',
        'T = m(a + g).',
      ),
      step(
        'Compare actual force with the limit',
        'The 252 N demand exceeds 230 N, so the ideal model predicts the sack tears.',
        'T = 15(7.0 + 9.8) = 252 N > 230 N → tears.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'acceleration',
          'The support force must exceed weight when accelerating up.',
        ),
      ],
      forces: [force('T', 'up', 1.7), force('mg', 'down')],
      result: { value: 15 * (7 + 9.8), unit: 'N', direction: 'up' },
    },
  ),
  '20': lesson(
    'You weigh 585 N on Earth. (a) Find your mass. (b) Find the scale reading on the Moon, where g = 1.60 N/kg.',
    'Mass stays the same when the gravitational field changes.',
    '102',
    [
      value('WE', 585, 'N'),
      value('gE', 9.8, 'N/kg', 'Earth'),
      value('gM', 1.6, 'N/kg', '1.60'),
    ],
    'm and WM',
    [
      step(
        'Use Earth’s reading to find mass',
        'The scale reading is weight. Divide by Earth’s field to remove the effect of gravity.',
        'WE = mgE → m = WE/gE = 585/9.8 = 59.6939 kg.',
      ),
      step(
        'Carry the same mass to the Moon',
        'Changing location changes g, not the amount of matter. Use WM = mgM with this same m.',
        'WM = mgM.',
      ),
      step(
        'Eliminate the intermediate mass',
        'We already have an expression for m. Substitute it into the Moon equation, keeping extra digits.',
        'WM = (WE/gE)gM = WE(gM/gE).',
      ),
      step(
        'Calculate the two requested answers',
        'The lower Moon field gives a lower weight. The units N/(N/kg) become kg in part a; multiplying by N/kg returns N in part b.',
        'm ≈ 59.7 kg; WM = 585(1.60/9.8) ≈ 95.5 N.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue('on the Moon', 'The field changes while mass stays constant.'),
      ],
      result: { value: (585 * 1.6) / 9.8, unit: 'N' },
    },
  ),
  '21': lesson(
    'Use Example Problem 3 to find the scale force in an elevator: (a) moving up at constant speed; (b) slowing while moving down at 2.0 m/s²; (c) speeding up while moving down at 2.0 m/s²; (d) moving down at constant speed; (e) stopping while moving down.',
    'Derive the scale force from acceleration; the example’s person mass is not captured.',
    '102',
    [value('g', 9.8, 'N/kg', 'Earth'), value('a0', 2, 'm/s²', '2.0')],
    'FN for parts a–e',
    [
      step(
        'Start with the forces on the person',
        'The scale force FN is upward and weight mg is downward. Velocity direction alone does not determine either force.',
        'FN − mg = ma → FN = m(g + a).',
      ),
      step(
        'Use constant speed for a and d',
        'In both directions, constant speed on this vertical path means zero acceleration.',
        '(a) FN = mg = 9.8m N. (d) FN = mg = 9.8m N.',
      ),
      step(
        'Slow downward motion in b',
        'Slowing a downward velocity requires UPWARD acceleration: a = +2.0 m/s². The scale force exceeds weight.',
        '(b) FN = m(9.8 + 2.0) = 11.8m N.',
      ),
      step(
        'Speed up downward motion in c',
        'Speeding up downward requires DOWNWARD acceleration: a = −2.0 m/s². The scale force is below weight.',
        '(c) FN = m(9.8 − 2.0) = 7.8m N.',
      ),
      step(
        'Reason about stopping in e',
        'Stopping downward motion needs upward acceleration, hence an upward net force. The deceleration magnitude is not given.',
        '(e) FN > mg. The net force points upward.',
      ),
      step(
        'Identify the missing source',
        'Example Problem 3’s person mass is not visible in the captured pages. Keep these expressions in m; numerical scale readings require that example.',
        'Missing: Example Problem 3 with the person’s mass. No mass has been invented.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue('constant speed', 'Acceleration is zero.'),
        clue('slowing while moving down', 'Acceleration points up.'),
      ],
      gap: 'Example Problem 3’s person mass; the stopping acceleration in part e is not specified.',
    },
  ),
  '28': lesson(
    'Lift a bowling ball with your hand, accelerating it upward. Identify forces on the ball, forces it exerts, and the objects receiving those forces.',
    'Keep forces ON the ball separate from third-law forces BY the ball.',
    '108',
    [],
    'the two interaction pairs',
    [
      step(
        'Draw the ball’s free-body diagram',
        'Hand force acts up and Earth’s gravitational force acts down. Upward acceleration requires the hand force to exceed weight.',
        'Fhand→ball > Fearth→ball; Fnet is upward.',
      ),
      step(
        'Find the hand interaction partner',
        'The ball pushes downward on the hand with a force equal in magnitude to the hand’s upward force on the ball.',
        'Hand on ball up ↔ ball on hand down.',
      ),
      step(
        'Find the gravitational partner',
        'The ball attracts Earth upward with a force equal in magnitude to Earth’s downward attraction on the ball. These act on different objects.',
        'Earth on ball down ↔ ball on Earth up.',
      ),
    ],
    {
      axis: vertical,
      forces: [force('Fhand', 'up', 1.5), force('Fg', 'down')],
    },
  ),
  '29': lesson(
    'A brick falls from a scaffold. Ignore air resistance. Identify forces on the brick, forces the brick exerts, and the receiving objects.',
    'Identify the gravitational interaction without inventing a contact force.',
    '108',
    [],
    'the gravitational pair',
    [
      step(
        'Choose the brick as the system',
        'After it leaves the scaffold there is no supporting contact. With air resistance ignored, Earth is the only force agent.',
        'Earth on brick: Fg downward.',
      ),
      step(
        'Name the third-law partner',
        'The brick attracts Earth upward with equal force. The partner does not act on the brick, so it cannot cancel the brick’s weight.',
        'Brick on Earth: same magnitude, opposite direction.',
      ),
      step(
        'Connect to acceleration',
        'Fnet = mg gives downward acceleration g. Earth has far more mass, so equal force gives Earth a much smaller acceleration.',
        'Brick: a = g downward. Different masses can have equal interaction forces.',
      ),
    ],
    { axis: vertical, forces: [force('Fg', 'down')] },
  ),
  '30': lesson(
    'A suitcase rests on a stationary airport luggage cart. Draw a free-body diagram for each object and identify the interaction pairs.',
    'Use a separate system boundary for suitcase and cart.',
    '108',
    [],
    'the force diagrams and pairs',
    [
      step(
        'Draw forces on the suitcase',
        'The cart pushes the suitcase up; Earth pulls it down. Since it rests, these forces balance.',
        'Suitcase: Ncart→case up; Wcase down; net force zero.',
      ),
      step(
        'Draw forces on the cart',
        'The floor supports the cart up. The cart’s own weight and the suitcase’s downward contact force both act on it.',
        'Cart: Nfloor→cart up; Wcart down; Ncase→cart down.',
      ),
      step(
        'Match interactions across diagrams',
        'The cart-on-suitcase and suitcase-on-cart contact forces form one pair. The floor/cart and Earth/object interactions each have partners acting on the other object.',
        'Cart ↔ suitcase; floor ↔ cart; Earth ↔ suitcase; Earth ↔ cart.',
      ),
      step(
        'Avoid the common pair mistake',
        'The suitcase’s weight and support balance on ONE object. They are not a third-law pair because their interaction partners act on Earth and the cart.',
        'Third-law pairs act on different objects.',
      ),
    ],
    { axis: vertical, forces: [force('Ncart', 'up'), force('Wcase', 'down')] },
  ),
  '31': lesson(
    'Toss a ball upward. After it leaves your hand, while it still moves up, draw its free-body diagram and identify forces it exerts on other objects. Ignore air resistance.',
    'Upward motion does not imply an upward force.',
    '108',
    [],
    'the ball–Earth interaction',
    [
      step(
        'Remove the hand from the diagram',
        'There is no hand contact after release. The upward velocity records earlier motion; it is not a present force.',
        'Only Earth’s Fg acts on the ball, downward.',
      ),
      step(
        'Name the force the ball exerts',
        'The ball attracts Earth upward. That equal opposite force acts on Earth, not on the ball.',
        'Earth on ball down ↔ ball on Earth up.',
      ),
      step(
        'Explain the slowing rise',
        'Downward net force means downward acceleration. This removes some upward velocity each second until the top is reached.',
        'v up; a down; speed decreases.',
      ),
    ],
    { axis: vertical, forces: [force('Fg', 'down')] },
  ),
  '32': lesson(
    'Mika pulls a stuck tire with 201 N and Diego pulls in the same direction with 31 N. It just starts to move off the wheel. Find the force magnitude between the tire and wheel.',
    'Combine the pulls and identify the opposing contact force at the threshold.',
    '110',
    [value('FM', 201, 'N'), value('FD', 31, 'N')],
    'the tire–wheel contact force',
    [
      step(
        'Add the pulls',
        'The pulls have the same direction, so their total is 232 N.',
        'Fpull = 201 + 31 = 232 N.',
      ),
      step(
        'Use the threshold of motion',
        'Just at the point of moving, the largest resisting contact force balances that combined pull. After motion begins it need not stay the same.',
        'Threshold resistance = 232 N, opposite the pull.',
      ),
      step(
        'Name both contact partners',
        'Wheel on tire and tire on wheel have equal magnitudes and opposite directions. The requested magnitude is the same for both.',
        'Force between tire and wheel: 232 N.',
      ),
    ],
    {
      axis: 'Take the common pulling direction as positive.',
      clues: [
        clue(
          'just starts to move',
          'Use the limiting resistance at the threshold.',
        ),
      ],
      result: { value: 232, unit: 'N' },
    },
  ),
  '33': lesson(
    'A rope lifts a 42 kg bucket of equipment. Its tension must not exceed 450 N. What is the greatest upward acceleration?',
    'Use the tension limit after accounting for the bucket’s weight.',
    '110',
    [
      value('Tmax', 450, 'N'),
      value('m', 42, 'kg'),
      value('g', 9.8, 'N/kg', 'Earth'),
    ],
    'amax',
    [
      step(
        'Write the actual net force',
        'Tension pulls upward; gravity pulls downward. F = ma uses their difference, not the whole 450 N.',
        'T − mg = ma.',
      ),
      step(
        'Use the largest allowed tension',
        'Increasing T increases upward acceleration for this fixed mass, so the maximum acceleration occurs at T = 450 N.',
        'Tmax − mg = mamax.',
      ),
      step(
        'Isolate acceleration visually',
        'Divide every term by m. The mass multiplying g cancels only within mg/m.',
        'amax = Tmax/m − mg/m = Tmax/m − g.',
      ),
      step(
        'Substitute without losing gravity',
        'The bucket’s weight is 411.6 N, leaving only 38.4 N for acceleration. Dividing that net force by 42 kg gives the answer.',
        'amax = 450/42 − 9.8 = 0.9143 ≈ 0.91 m/s² upward.',
      ),
    ],
    {
      axis: vertical,
      clues: [
        clue(
          'must not exceed 450 N',
          '450 N is the maximum tension, not the net force.',
        ),
      ],
      forces: [force('T', 'up', 1.2), force('mg', 'down')],
      result: { value: 450 / 42 - 9.8, unit: 'm/s²', direction: 'up' },
    },
  ),
};

for (const n of [12, 13, 14, 15, 22, 23, 24, 25, 26, 27]) {
  dynamicsLessons[String(n)] = lesson(
    `Question ${n} · source page needed`,
    'The question itself is not present in the supplied photographs.',
    n < 16 ? 'between 97 and 101' : 'between 102 and 108',
    [],
    'the original question',
    [
      step(
        'Identify the missing source',
        `The captured textbook pages skip question ${n}. Its wording, values and any figure must come from the original page.`,
        `Missing: a clear capture of question ${n}, including its figure and referenced example.`,
      ),
      step(
        'Keep this place in the assignment',
        'Questions 1–33 remain one assignment. This numbered place preserves the missing item until its real source arrives.',
        'No question, values or solution have been reconstructed.',
      ),
    ],
    { gap: `Question ${n} and any required figure/example.` },
  );
}

export const dynamicsQuestions: CompanionQuestion[] = Array.from(
  { length: 33 },
  (_, i) => {
    const n = String(i + 1),
      d = dynamicsLessons[n];
    return {
      id: `q-${n}`,
      number: n,
      section: `Chapter 4 · p.${d.page}`,
      prompt: d.prompt,
      asking: d.asking,
      concepts: ['acceleration', 'vector-sign'],
      input: 'text',
      clues: d.clues,
      steps: d.steps.map(({ title, text }) => ({ title, text })),
      hints: [d.steps[0].text],
      example: d.steps.map((s) => s.write).join('\n'),
      repair: {
        prompt: 'Which force belongs in F = ma?',
        choices: [
          'The net force on the chosen object',
          'Any one force, ignoring the others',
        ],
        answer: 'The net force on the chosen object',
        explanation:
          'Add forces with their direction signs on the same object before using Newton’s second law.',
      },
      checklist: [d.steps.at(-1)!.write!],
      ...(d.result
        ? {
            answer: {
              value: d.result.value,
              unit: d.result.unit,
              ...(d.result.direction
                ? { directions: [d.result.direction] }
                : {}),
              origin: 'atlas' as const,
              reasoning: d.steps.map((s) => `${s.text} ${s.write}`).join('\n'),
              commonMistake:
                'Using one applied force as the net force, or choosing acceleration direction from velocity alone.',
            },
          }
        : {}),
    };
  },
);

const material = (
  id: string,
  title: string,
  kind: Assignment['kind'],
): Assignment => ({
  id,
  title,
  kind,
  course: 'physics',
  edition: 'physics-fall-2026',
  teacher: 'Mr. Wadson',
  status: 'current',
  unit: 'dynamics',
  materialSet: 'forces-in-1d',
  summary: '',
  tasks: [
    {
      id: 'work',
      title: 'Original class material',
      instructions: 'Use the matching numbered work on your original sheet.',
    },
  ],
  concepts: ['acceleration', 'vector-sign'],
  prerequisites: [],
  sources: ['vault-physics', 'atlas-original'],
  difficulty: [],
  rights: 'original-companion',
  assistance: 'allowed',
  originalAvailability:
    'Original class captures are retained in the private source archive.',
  notes:
    'Capture order is preserved; class dates are not inferred from upload dates.',
});
export const dynamicsAssignment: Assignment = {
  ...material(
    'physics-forces-1-33',
    'Chapter 4 · Forces in 1D · Questions 1–33',
    'textbook',
  ),
  summary:
    'One assignment, questions 1–33. Available pages: 93, 96–97, 101–102, 108 and 110. Questions 12–15 and 22–27 are not captured. Question 21’s referenced person mass is also missing.',
  questionReferences: ['Chapter 4 #1–33'],
  companionQuestions: dynamicsQuestions,
};
export const dynamicsNotesAssignment: Assignment = {
  ...material(
    'physics-dynamics-notes',
    'Chapter 4 · Forces in 1D · Class notes',
    'notes',
  ),
  summary:
    'Completed Dynamics, force diagrams, net force, Newton’s laws and mass/weight portions. Inertia wording and a partly completed example retain explicit gaps. Later elevator/friction sheets are not filled in.',
};
