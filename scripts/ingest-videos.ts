import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const index = JSON.parse(
  await readFile('src/content/ingestion/bleecker.json', 'utf8'),
) as { sources: { id: string; linkedResources: string[] }[] };
const ids = new Map<string, Set<string>>();
for (const source of index.sources)
  for (const link of source.linkedResources) {
    const url = new URL(link);
    if (!['www.youtube.com', 'youtube.com'].includes(url.hostname)) continue;
    const id = url.searchParams.get('v');
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      const pages = ids.get(id) ?? new Set<string>();
      pages.add(source.id);
      ids.set(id, pages);
    }
  }
if (ids.size > 10)
  throw new Error(
    'Review the bounded video manifest before expanding beyond 10 videos',
  );
await mkdir('evidence/bleecker/videos', { recursive: true });
async function bounded(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
  });
  const body = await response.text();
  if (Buffer.byteLength(body) > 2 * 1024 * 1024)
    throw new Error('Source exceeds 2 MiB limit');
  return { status: response.status, body };
}
const checked = new Date().toISOString();
const videos = [];
for (const [id, pages] of ids) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  let title: string | null = null;
  let author: string | null = null;
  let metadataStatus: number | string;
  try {
    const response = await bounded(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    metadataStatus = response.status;
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      title = typeof data.title === 'string' ? data.title : null;
      author = typeof data.author_name === 'string' ? data.author_name : null;
    }
  } catch (e) {
    metadataStatus = (e as Error).name;
  }
  let captionStatus =
    'No publicly retrievable caption track at the checked endpoint; availability is unverified';
  let captionHash: string | null = null;
  let language: string | null = null;
  try {
    const tracks = await bounded(
      `https://www.youtube.com/api/timedtext?type=list&v=${id}`,
    );
    const english = tracks.body.match(/<track\b[^>]*lang_code="en"[^>]*>/);
    if (tracks.status === 200 && english) {
      const name = english[0].match(/\bname="([^"]*)"/)?.[1] ?? '';
      const kind = english[0].match(/\bkind="([^"]*)"/)?.[1];
      const track = new URL('https://www.youtube.com/api/timedtext');
      track.searchParams.set('v', id);
      track.searchParams.set('lang', 'en');
      track.searchParams.set('name', name);
      if (kind) track.searchParams.set('kind', kind);
      const captions = await bounded(track.href);
      if (captions.status === 200 && captions.body.includes('<text ')) {
        await writeFile(`evidence/bleecker/videos/${id}.xml`, captions.body);
        captionHash = createHash('sha256').update(captions.body).digest('hex');
        language = 'en';
        captionStatus =
          'English caption evidence saved privately; no transcript is published or automatically normalized';
      }
    }
    if (tracks.status !== 200)
      captionStatus = `Public caption endpoint HTTP ${tracks.status}; no captions captured`;
  } catch (e) {
    captionStatus = `Public caption lookup unavailable (${(e as Error).name}); no captions captured`;
  }
  videos.push({
    id,
    url,
    title,
    author,
    checked,
    metadataStatus,
    sourcePages: [...pages],
    rights: 'link-only',
    captionStatus,
    captionHash,
    language,
    segmentMapping: 'Not reviewed; no timestamp-to-concept claims',
  });
  console.log(
    `${id}: metadata ${metadataStatus}; ${captionHash ? 'caption evidence captured' : 'captions unavailable through public lookup'}`,
  );
}
await writeFile(
  'src/content/ingestion/videos.json',
  JSON.stringify(
    {
      checked,
      scope:
        'Bounded linked-video metadata and permitted public-caption availability check; raw captions remain ignored internal evidence',
      videos,
    },
    null,
    2,
  ) + '\n',
);
