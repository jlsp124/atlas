export type Measurement = { time: number; position: number };
export function analyzeTape(rows: Measurement[], unit: 'm' | 'mm') {
  if (rows.length < 3)
    throw new Error(
      'Provide at least three measured time/position pairs to compare interval velocities.',
    );
  if (
    rows.some(
      (r, i) =>
        !Number.isFinite(r.time) ||
        !Number.isFinite(r.position) ||
        r.time < 0 ||
        (i > 0 && r.time <= rows[i - 1].time),
    )
  )
    throw new Error(
      'Times must be nonnegative and strictly increasing. Every position must be a finite measurement.',
    );
  const data = rows.map((r) => ({
    time: r.time,
    position: r.position / (unit === 'mm' ? 1000 : 1),
  }));
  const intervals = data.slice(1).map((r, i) => {
    const start = data[i],
      duration = r.time - start.time,
      displacement = r.position - start.position;
    return {
      start: start.time,
      end: r.time,
      midpoint: (start.time + r.time) / 2,
      displacement,
      duration,
      velocity: displacement / duration,
    };
  });
  const meanT =
    intervals.reduce((s, r) => s + r.midpoint, 0) / intervals.length;
  const meanV =
    intervals.reduce((s, r) => s + r.velocity, 0) / intervals.length;
  const acceleration =
    intervals.reduce(
      (s, r) => s + (r.midpoint - meanT) * (r.velocity - meanV),
      0,
    ) / intervals.reduce((s, r) => s + (r.midpoint - meanT) ** 2, 0);
  const intercept = meanV - acceleration * meanT;
  const first = data[0],
    last = data.at(-1)!;
  return {
    data,
    intervals,
    acceleration,
    intercept,
    average: (last.position - first.position) / (last.time - first.time),
  };
}
export function parseMeasurements(text: string): Measurement[] {
  return text
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line, i) => {
      const cells = line.trim().split(/[\s,;]+/);
      if (
        cells.length !== 2 ||
        cells.some((c) => c === '' || !Number.isFinite(Number(c)))
      )
        throw new Error(
          `Row ${i + 1} needs exactly two numbers: time in seconds, then position.`,
        );
      return { time: Number(cells[0]), position: Number(cells[1]) };
    });
}
