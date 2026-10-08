export type GraphPoint = [number, number];
export type PhysicsGraphSpec = {
  title: string;
  xLabel: string;
  yLabel: string;
  description: string;
  series: {
    points: GraphPoint[];
    label?: string;
    dots?: boolean;
    line?: boolean;
  }[];
};
const curve = (
  end: number,
  fn: (t: number) => number,
  start = 0,
): GraphPoint[] =>
  Array.from({ length: 81 }, (_, i) => {
    const t = start + ((end - start) * i) / 80;
    return [t, fn(t)];
  });
const spec = (
  title: string,
  yLabel: string,
  description: string,
  points: GraphPoint[],
): PhysicsGraphSpec => ({
  title,
  xLabel: 'Time (s)',
  yLabel,
  description,
  series: [{ points, line: true }],
});
export function questionGraphs(
  assignment: string,
  question: string,
): PhysicsGraphSpec[] {
  if (assignment === 'kinematics-review' && question === 'q-9')
    return [
      spec(
        'Rocket position vs time',
        'Position from launch (m)',
        'Starts at zero; position = 12t². At 4 s it is at 192 m, and at 5 s at 300 m. Its increasing slope shows speeding up upward.',
        curve(5, (t) => 12 * t * t),
      ),
      spec(
        'Rocket velocity vs time',
        'Velocity (m/s)',
        'Starts from rest. The straight line has slope +24 m/s² and reaches +120 m/s at 5 s.',
        [
          [0, 0],
          [5, 120],
        ],
      ),
    ];
  if (assignment === 'physics-motion-review' && question === 'q-b10')
    return [
      spec(
        'Cyclist velocity vs time',
        'Velocity forward (m/s)',
        'The cyclist starts at +2.0 m/s, not zero, and reaches +10.0 m/s at 6.0 s. Average slope is (10 − 2)/6 = 1.33… m/s². The straight connection models uniform acceleration; only the endpoints are given.',
        [
          [0, 2],
          [6, 10],
        ],
      ),
    ];
  if (assignment !== 'physics-textbook-accelerated-motion') return [];
  if (question === 'q-4')
    return [
      spec(
        'Elevator velocity vs time',
        'Velocity upward (m/s)',
        'Velocity rises from 0 to +1 m/s in 2 s, stays at +1 until 14 s, then falls to 0 at 18 s. Total positive area is 15 m upward.',
        [
          [0, 0],
          [2, 1],
          [14, 1],
          [18, 0],
        ],
      ),
    ];
  if (question === 'q-16c')
    return [
      spec(
        'Golf ball velocity vs time',
        'Velocity uphill (m/s)',
        'Starts at +2 m/s and slopes down at −0.50 m/s². It crosses zero at 4 s and is −1 m/s at 6 s.',
        [
          [0, 2],
          [4, 0],
          [6, -1],
        ],
      ),
      spec(
        'Golf ball position vs time',
        'Position uphill (m)',
        'Position = 2t − 0.25t² from its starting point. Maximum position is 4 m at 4 s. It then rolls downhill to 3 m at 6 s.',
        curve(6, (t) => 2 * t - 0.25 * t * t),
      ),
    ];
  if (question === 'q-22a')
    return [
      spec(
        'Accelerating car velocity vs time',
        'Velocity east (m/s)',
        'East is positive. The car starts at rest and reaches −25 m/s west at 12 s. Slope is negative and area is −150 m.',
        [
          [0, 0],
          [12, -25],
        ],
      ),
    ];
  if (question === 'q-22c-d')
    return [
      spec(
        'Steady car velocity vs time',
        'Velocity east (m/s)',
        'The horizontal line is at −12.5 m/s for 12 s. Its rectangular area is −150 m, matching the accelerating car’s displacement.',
        [
          [0, -12.5],
          [12, -12.5],
        ],
      ),
    ];
  if (question === 'q-46') {
    const g = 9.8,
      t1 = Math.sqrt(3 / g),
      u1 = Math.sqrt(1.5 * g),
      t2 = t1 + (2 * u1) / g,
      u2 = Math.sqrt(0.5 * g),
      end = t2 + (2 * u2) / g;
    const position = [
      curve(t1, (t) => 0.5 * g * t * t),
      curve(t2, (t) => 1.5 - u1 * (t - t1) + 0.5 * g * (t - t1) ** 2, t1),
      curve(end, (t) => 1.5 - u2 * (t - t2) + 0.5 * g * (t - t2) ** 2, t2),
    ];
    const velocity: GraphPoint[][] = [
      [
        [0, 0],
        [t1, g * t1],
      ],
      [
        [t1, -u1],
        [t2, u1],
      ],
      [
        [t2, -u2],
        [end, u2],
      ],
    ];
    return [
      {
        ...spec(
          'Bouncing ball position vs time',
          'Position below release (m)',
          'This question defines down as positive. Floor = +1.5 m; rebound tops = +0.75 m and +1.25 m. Position stays continuous through contact; each flight curves upward.',
          [],
        ),
        series: position.map((points) => ({ points, line: true })),
      },
      {
        ...spec(
          'Bouncing ball velocity vs time',
          'Velocity downward (m/s)',
          'Between contacts the slope is +9.8 m/s². Each rebound changes velocity rapidly from positive downward to negative upward. Breaks mark idealized contacts, whose duration is unknown.',
          [],
        ),
        series: velocity.map((points) => ({ points, line: true })),
      },
    ];
  }
  return [];
}
