import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const checked = new Date().toISOString();
const targets = [
  {
    id: 'bleecker-home',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/home',
  },
  {
    id: 'bleecker-calendar-page',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/calendar',
  },
  {
    id: 'bleecker-c18',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification',
  },
  {
    id: 'bleecker-c17',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c17-origins',
  },
  {
    id: 'bleecker-cladograms',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/c18-classification/cladograms',
  },
  {
    id: 'bleecker-vocab',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/bio1/biol-vocab',
  },
  {
    id: 'bleecker-notes',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/notes',
  },
  {
    id: 'bleecker-course',
    type: 'page',
    url: 'https://sites.google.com/view/ecl-life-sciences-11/course',
  },
  {
    id: 'bleecker-ics',
    type: 'calendar',
    url: 'https://calendar.google.com/calendar/ical/q87773ofbdnsahhi3vmatr59t0%40group.calendar.google.com/public/basic.ics',
  },
  {
    id: 'bleecker-playlist',
    type: 'video-playlist',
    url: 'https://tinyurl.com/mp2rdru',
  },
];
await mkdir('evidence/bleecker', { recursive: true });
await mkdir('src/content/ingestion', { recursive: true });
const manifest = [];
for (const t of targets) {
  const r = await fetch(t.url, { signal: AbortSignal.timeout(20000) });
  const text = await r.text();
  if (text.length > 5000000)
    throw new Error('Source exceeds bounded ingestion size');
  const allowed = [
    'sites.google.com',
    'calendar.google.com',
    'tinyurl.com',
    'www.youtube.com',
  ];
  if (!allowed.includes(new URL(r.url).hostname))
    throw new Error('Unexpected source redirect: inspect before ingesting');
  await writeFile(`evidence/bleecker/${t.id}.txt`, text);
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const events =
    t.type === 'calendar'
      ? [...unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)]
          .map((m) => {
            const field = (key: string) =>
              m[1].match(
                new RegExp(`(?:^|\\n)${key}(?:;[^:]+)?:([^\\r\\n]*)`),
              )?.[1] ?? '';
            const compact = (s: string) =>
              `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
            return {
              title: field('SUMMARY').replace(/\\n/g, ' ').replace(/\\,/g, ','),
              start: compact(field('DTSTART')),
              endExclusive: compact(field('DTEND')),
            };
          })
          .filter((e) => e.start >= '2026-09-08' && e.start <= '2027-01-29')
      : [];
  const links =
    t.type === 'page'
      ? [
          ...new Set(
            [...text.matchAll(/(?:href|src)="([^"<>]+)"/g)]
              .map((m) => m[1].replace(/&amp;/g, '&'))
              .filter((x) => /^(https:\/\/|\/view\/)/.test(x)),
          ),
        ]
          .filter((x) =>
            /ecl-life-sciences|youtube|drive.google|docs.google|calendar.google/.test(
              x,
            ),
          )
          .map((x) => new URL(x, r.url).href)
      : [];
  manifest.push({
    ...t,
    finalUrl: r.url,
    checked,
    httpStatus: r.status,
    sha256: createHash('sha256').update(text).digest('hex'),
    author: 'J. Bleecker',
    rights: 'link-only',
    rawEvidence: 'ignored evidence directory; never publish',
    linkedResources: links,
    calendarEvents: events,
    captionStatus:
      t.type === 'video-playlist'
        ? 'Unavailable: saved shortlink returns 404; no captions ingested'
        : 'Not applicable',
    concepts:
      t.type === 'calendar'
        ? ['fossilization', 'half-life', 'endosymbiosis', 'evolution-patterns']
        : [],
  });
}
await writeFile(
  'src/content/ingestion/bleecker.json',
  JSON.stringify(
    {
      checked,
      scope:
        'Bounded public source index; original atlas content requires manual review',
      sources: manifest,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  manifest
    .map(
      (x) =>
        `${x.id}: HTTP ${x.httpStatus}; ${x.calendarEvents.length} current-term events; ${x.linkedResources.length} links`,
    )
    .join('\n'),
);
