import { dayDifference } from './dates';
// SD57's approved district calendar, checked 2026-10-08. The secondary
// semester dates are course dates; this count uses the district's student days.
export const schoolCalendar = {
  year: '2026–2027',
  first: '2026-09-08',
  last: '2027-06-29',
  winter: '2026-12-21',
  source:
    'https://sd57.bc.ca/wp-content/uploads/2026/08/2026-2027-Calendar-Approved-June-25-2024.pdf',
  closures: [
    ['2026-09-28', '2026-09-28'],
    ['2026-09-30', '2026-09-30'],
    ['2026-10-12', '2026-10-12'],
    ['2026-10-23', '2026-10-23'],
    ['2026-11-11', '2026-11-11'],
    ['2026-11-27', '2026-11-27'],
    ['2026-12-21', '2027-01-01'],
    ['2027-02-01', '2027-02-01'],
    ['2027-02-15', '2027-02-15'],
    ['2027-03-15', '2027-03-29'],
    ['2027-04-16', '2027-04-16'],
    ['2027-05-14', '2027-05-14'],
    ['2027-05-24', '2027-05-24'],
  ],
};
export function schoolYearDetails(today: string) {
  if (today < schoolCalendar.first || today > schoolCalendar.last) return;
  const days: string[] = [];
  const date = new Date(schoolCalendar.first + 'T12:00:00Z');
  while (date.toISOString().slice(0, 10) <= schoolCalendar.last) {
    const iso = date.toISOString().slice(0, 10);
    if (
      date.getUTCDay() !== 0 &&
      date.getUTCDay() !== 6 &&
      !schoolCalendar.closures.some(
        ([start, end]) => iso >= start && iso <= end,
      )
    )
      days.push(iso);
    date.setUTCDate(date.getUTCDate() + 1);
  }
  const elapsed = days.filter((date) => date < today).length;
  return {
    elapsed,
    total: days.length,
    percent: ((elapsed / days.length) * 100).toFixed(1),
    winterDays:
      today < schoolCalendar.winter
        ? dayDifference(today, schoolCalendar.winter)
        : undefined,
  };
}
