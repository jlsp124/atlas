import { snapshot, schedule } from '../content/catalog';
export function schoolDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: snapshot.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day']
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join('-');
}
export function displayDate(s: string, full = false) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    month: full ? 'long' : 'short',
    day: 'numeric',
    ...(full ? { year: 'numeric' as const } : {}),
  }).format(new Date(`${s}T12:00:00Z`));
}
export function dayDifference(a: string, b: string) {
  return Math.round(
    (Date.parse(`${b}T12:00Z`) - Date.parse(`${a}T12:00Z`)) / 86400000,
  );
}
export function isSchoolDay(day: string) {
  const weekday = new Date(`${day}T12:00Z`).getUTCDay();
  return (
    weekday !== 0 &&
    weekday !== 6 &&
    day >= '2026-09-08' &&
    day <= '2027-01-29' &&
    !schedule.some(
      (e) =>
        e.type === 'holiday' &&
        e.start &&
        day >= e.start &&
        day <= (e.end ?? e.start),
    )
  );
}
export function schoolDaysThrough(day: string) {
  let count = 0;
  const stop = day < '2027-01-29' ? day : '2027-01-29';
  for (
    let d = new Date('2026-09-08T12:00Z');
    d.toISOString().slice(0, 10) <= stop;
    d = new Date(d.getTime() + 86400000)
  )
    if (isSchoolDay(d.toISOString().slice(0, 10))) count++;
  return count;
}
