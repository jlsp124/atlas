export type TemperaturePoint = { time: number; temperature: number };
export function parseTemperaturePoints(text: string): {
  points: TemperaturePoint[];
  error?: string;
} {
  if (!text.trim()) return { points: [] };
  const points: TemperaturePoint[] = [];
  for (const line of text.trim().split(/\r?\n/)) {
    const values = line
      .trim()
      .split(/[\s,;]+/)
      .map(Number);
    if (
      values.length !== 2 ||
      values.some((n) => !Number.isFinite(n)) ||
      values[0] < 0 ||
      values[1] < -273.15
    )
      return {
        points: [],
        error: 'Use one time in minutes and one temperature in °C per line.',
      };
    points.push({ time: values[0], temperature: values[1] });
  }
  if (points.some((p, i) => i > 0 && p.time <= points[i - 1].time))
    return {
      points: [],
      error:
        'Times must increase; keep each reading at its actual recorded time.',
    };
  if (points.length > 300)
    return { points: [], error: 'Use at most 300 recorded readings.' };
  return { points };
}
