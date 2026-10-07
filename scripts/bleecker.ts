import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  isBleeckerCoursePage,
  parseTeacherCalendar,
  normalizeSourceText,
} from '../src/core/intake';

const site = 'https://sites.google.com/view/ecl-life-sciences-11/';
const pagePaths = [
  'home',
  'calendar',
  'course',
  'notes',
  'bio1/biol-vocab',
  'bio1/c17-origins',
  'bio1/c18-classification',
  'bio1/c18-classification/cladograms',
  'bio1/c18-classification/dichotomous-key-asst',
];
type Indexed = {
  id: string;
  type: string;
  url: string;
  finalUrl: string;
  checked: string;
  httpStatus: number;
  sha256: string;
  contentHash: string;
  author: string;
  rights: string;
  rawEvidence: string;
  linkedResources: string[];
  calendarEvents: ReturnType<typeof parseTeacherCalendar>;
  captionStatus: string;
  concepts: string[];
  inspection?: string;
  title?: string;
};
export function teacherLinks(html: string, base: string) {
  return [
    ...new Set(
      [...html.matchAll(/(?:href|src)="([^"<>]+)"/g)]
        .map((match) => match[1].replace(/&amp;/g, '&'))
        .filter((value) => /^(https:\/\/|\/view\/)/.test(value))
        .map((value) => new URL(value, base).href)
        .map((value) => {
          const url = new URL(value);
          return url.hostname === 'www.google.com' && url.pathname === '/url'
            ? (url.searchParams.get('q') ?? value)
            : value;
        })
        .filter(
          (value) =>
            isBleeckerCoursePage(value) ||
            /^(https:\/\/)(?:www\.)?(?:youtube\.com|youtu\.be|drive\.google\.com|docs\.google\.com|calendar\.google\.com)\//.test(
              value,
            ),
        ),
    ),
  ].sort();
}
export function visibleTeacherText(html: string) {
  return normalizeSourceText(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(?:nbsp|amp);/g, ' '),
  );
}
export async function refreshBleecker({
  apply = false,
  archive = process.env.ATLAS_SOURCE_ARCHIVE || 'evidence/atlas-sources',
} = {}) {
  const manifestPath = 'src/content/ingestion/bleecker.json';
  const previous = JSON.parse(
    await readFile(manifestPath, 'utf8').catch(() => '{"sources":[]}'),
  ) as { checked?: string; sources: Indexed[] };
  const checked = new Date().toISOString();
  const evidence = resolve(archive, 'teacher-fetches', 'bleecker');
  await mkdir(evidence, { recursive: true });
  const shortNames: Record<string, string> = {
    'bio1/c17-origins': 'c17',
    'bio1/c18-classification': 'c18',
    'bio1/c18-classification/cladograms': 'cladograms',
    'bio1/biol-vocab': 'vocab',
    calendar: 'calendar-page',
  };
  const targets = pagePaths.map((path) => ({
    id: 'bleecker-' + (shortNames[path] ?? path.replaceAll('/', '-')),
    type: 'page',
    url: site + path,
  }));
  targets.push({
    id: 'bleecker-ics',
    type: 'calendar',
    url: 'https://calendar.google.com/calendar/ical/q87773ofbdnsahhi3vmatr59t0%40group.calendar.google.com/public/basic.ics',
  });
  const sources: Indexed[] = [];
  const changed: string[] = [];
  const failures: string[] = [];
  for (const target of targets) {
    try {
      const response = await fetch(target.url, {
        signal: AbortSignal.timeout(20000),
      });
      if (
        !['sites.google.com', 'calendar.google.com'].includes(
          new URL(response.url).hostname,
        )
      )
        throw new Error('Unexpected teacher-source redirect');
      const text = await response.text();
      if (Buffer.byteLength(text) > 5000000)
        throw new Error('Teacher source exceeds 5 MB limit');
      const sha256 = createHash('sha256').update(text).digest('hex');
      const links =
        target.type === 'page' ? teacherLinks(text, response.url) : [];
      const events =
        target.type === 'calendar' ? parseTeacherCalendar(text) : [];
      const semantic = JSON.stringify({
        status: response.status,
        text: target.type === 'page' ? visibleTeacherText(text) : events,
        links,
      });
      const contentHash = createHash('sha256').update(semantic).digest('hex');
      await writeFile(resolve(evidence, `${target.id}-${sha256}.txt`), text);
      const old = previous.sources.find((source) => source.id === target.id);
      if (old?.contentHash === contentHash) {
        sources.push(old);
        continue;
      }
      changed.push(target.id);
      sources.push({
        ...target,
        finalUrl: response.url,
        checked,
        httpStatus: response.status,
        sha256,
        contentHash,
        author: 'J. Bleecker',
        rights: 'link-only',
        rawEvidence: 'Private archive; never publish',
        linkedResources: links,
        calendarEvents: events,
        captionStatus: 'Videos indexed separately; no transcript is claimed',
        concepts:
          target.type === 'calendar'
            ? [
                'fossilization',
                'half-life',
                'endosymbiosis',
                'evolution-patterns',
              ]
            : [],
      });
    } catch (error) {
      failures.push(`${target.id}: ${String(error)}`);
      const old = previous.sources.find((source) => source.id === target.id);
      if (old) sources.push(old);
    }
  }
  for (const source of previous.sources)
    if (!targets.some((target) => target.id === source.id))
      sources.push(source);
  const resources = [
    ['1R8D78l4DU3UM9OrzUkOVZV3o-PuXCchU', 'C17 viewing assignment'],
    ['1zt5PBw287SGhkYpwEXWJRCVVVFNlRX-q', 'C17 notes'],
    ['1aL3uDARae1f3amPw9E5f28r6fzAJL8Q5', 'C18 notes'],
    ['1OIN5XHbsno9QlYKmgUMD-DhjOgEWYofP', 'Dichotomous key activity'],
    ['1_4rzqVi3GEi4PSiI3bTwV6134sYtghlk', 'Biological vocabulary packet'],
    ['1VYtVAN5i5Hcj5_H5pEM5Ed5heLJyOx_X', 'Radioactive dating activity'],
  ];
  const inspections = JSON.parse(
    await readFile(
      resolve(archive, 'teacher-fetches/bleecker-resources/resources.json'),
      'utf8',
    ).catch(() => '[]'),
  ) as { id: string; sha256?: string; status: string }[];
  for (const [driveId, title] of resources) {
    const id = 'bleecker-drive-' + driveId,
      old = previous.sources.find((s) => s.id === id);
    try {
      const response = await fetch(
        'https://drive.google.com/uc?export=download&id=' + driveId,
        { signal: AbortSignal.timeout(20000) },
      );
      if (
        !['drive.google.com', 'drive.usercontent.google.com'].includes(
          new URL(response.url).hostname,
        )
      )
        throw new Error('Unexpected resource redirect');
      const reader = response.body?.getReader(),
        chunks: Uint8Array[] = [];
      let size = 0;
      if (!reader) throw new Error('Empty resource response');
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 128 * 1024 * 1024) {
          await reader.cancel();
          throw new Error('Resource exceeds 128 MB limit');
        }
        chunks.push(part.value);
      }
      const bytes = Buffer.concat(chunks);
      const pdf = response.ok && bytes.subarray(0, 5).toString() === '%PDF-';
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      // Failed response pages contain unstable tokens. Status is the semantic identity until a PDF is available.
      const hash = pdf ? sha256 : `unavailable-${response.status}`;
      const inspection = pdf
        ? inspections.some(
            (r) =>
              r.id === driveId &&
              r.status === 'inspected' &&
              r.sha256 === sha256,
          )
          ? 'Downloaded and privately inspected; approved derivative only'
          : 'Changed or new PDF: private content review required'
        : `Unavailable (${response.status}); no content inferred`;
      if (old?.contentHash === hash && old.inspection === inspection) continue;
      if (pdf) await writeFile(resolve(evidence, `${id}-${sha256}.pdf`), bytes);
      changed.push(id);
      const source: Indexed = {
        id,
        title,
        type: 'teacher-pdf',
        url: `https://drive.google.com/file/d/${driveId}/view`,
        finalUrl: response.url,
        checked,
        httpStatus: response.status,
        sha256: pdf ? sha256 : '',
        contentHash: hash,
        author: 'J. Bleecker',
        rights: 'link-only',
        rawEvidence: 'Private archive; never publish',
        linkedResources: [],
        calendarEvents: [],
        captionStatus: 'Not applicable',
        concepts: [],
        inspection,
      };
      const index = sources.findIndex((s) => s.id === id);
      if (index >= 0) sources[index] = source;
      else sources.push(source);
    } catch (error) {
      failures.push(`${id}: ${String(error)}`);
    }
  }
  const result = {
    checked: changed.length ? checked : previous.checked,
    scope:
      'Life Sciences 11 only; teacher descriptions and assessment scope retained; linked resources are an index, not redistribution permission.',
    sources,
  };
  if (apply && !failures.length)
    await writeFile(manifestPath, JSON.stringify(result, null, 2) + '\n');
  await writeFile(
    resolve(evidence, 'latest-fetch-status.json'),
    JSON.stringify({ fetched: checked, changed, failures }, null, 2) + '\n',
  );
  return { manifest: result, changed, failures };
}
