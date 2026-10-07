import { createHash } from 'node:crypto';

export type IntakeCourse =
  'physics' | 'life-sciences' | 'japanese' | 'chemistry';
export type Publication = 'private' | 'reference-only' | 'original-companion';
export type RawCapture = {
  raw_id: string;
  sha256: string;
  sequence_index: number;
  original_filename: string;
  text: string;
  course?: IntakeCourse;
  document_key?: string;
  title?: string;
  page?: number;
  questions?: number[];
};
export type RegisteredSource = {
  source_id: string;
  course: IntakeCourse;
  teacher: string;
  edition: string;
  unit: string;
  material_set: string;
  title: string;
  kind: string;
  origin: string;
  original_url?: string;
  raw_ids: string[];
  raw_hashes: string[];
  normalized_content_hash: string;
  question_numbers: string[];
  publication: Publication;
  assistance: 'allowed' | 'independent-only';
  confidence: 'verified' | 'supported' | 'needs-review';
  supersedes?: string;
  same_material_as?: string;
  vault_links?: { path: string; sha256: string; relation: string }[];
  supplements: string[];
  atlas_content_ids: string[];
  assigned?: string;
  due?: string;
  raw_files?: {
    raw_id: string;
    original_path?: string;
    sequence_index?: number;
    [key: string]: unknown;
  }[];
};
export type SourceRegistry = {
  schema_version: 1;
  sources: RegisteredSource[];
  relationships: {
    from: string;
    to: string;
    relation: 'duplicate' | 'supersedes' | 'review';
  }[];
};

export function normalizeSourceText(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
export function contentHash(text: string) {
  return createHash('sha256').update(normalizeSourceText(text)).digest('hex');
}
export function stableSourceId(
  course: IntakeCourse,
  edition: string,
  identity: string,
) {
  return `src-${course}-${createHash('sha256')
    .update(`${edition}\n${normalizeSourceText(identity)}`)
    .digest('hex')
    .slice(0, 20)}`;
}
export function canonicalTeacherUrl(value?: string) {
  if (!value) return '';
  const url = new URL(value);
  const drive =
    url.pathname.match(/\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id');
  if (['drive.google.com', 'docs.google.com'].includes(url.hostname) && drive)
    return `https://drive.google.com/file/d/${drive}`;
  url.hash = '';
  for (const key of ['usp', 'authuser', 'utm_source', 'utm_medium'])
    url.searchParams.delete(key);
  return url.href.replace(/\/$/, '');
}
export function sourceRelation(a: RegisteredSource, b: RegisteredSource) {
  if (a.course !== b.course || a.edition !== b.edition)
    return 'different' as const;
  if (b.supersedes === a.source_id || a.supersedes === b.source_id)
    return 'supersedes' as const;
  if (b.same_material_as === a.source_id || a.same_material_as === b.source_id)
    return 'duplicate' as const;
  if (a.source_id === b.source_id) {
    if (
      a.normalized_content_hash !== b.normalized_content_hash &&
      !a.raw_hashes.some((hash) => b.raw_hashes.includes(hash))
    )
      return 'review' as const;
    return 'same-source' as const;
  }
  if (a.raw_hashes.some((hash) => b.raw_hashes.includes(hash)))
    return 'duplicate' as const;
  if (
    a.normalized_content_hash &&
    a.normalized_content_hash === b.normalized_content_hash
  )
    return 'duplicate' as const;
  const sameUrl =
    a.original_url &&
    canonicalTeacherUrl(a.original_url) === canonicalTeacherUrl(b.original_url);
  const sameTitle =
    a.unit === b.unit &&
    normalizeSourceText(a.title) === normalizeSourceText(b.title);
  const overlap = a.question_numbers.filter((n) =>
    b.question_numbers.includes(n),
  ).length;
  if (
    sameUrl ||
    (sameTitle &&
      overlap /
        Math.max(
          1,
          Math.min(a.question_numbers.length, b.question_numbers.length),
        ) >=
        0.6)
  )
    return 'review' as const;
  return 'different' as const;
}
export function mergeRegistry(
  previous: SourceRegistry,
  incoming: RegisteredSource[],
): SourceRegistry {
  const captures = (a: RegisteredSource, b: RegisteredSource) =>
    [
      ...new Map(
        [...(a.raw_files ?? []), ...(b.raw_files ?? [])].map((file) => [
          file.raw_id + (file.original_path ?? ''),
          file,
        ]),
      ).values(),
    ].sort(
      (a, b) =>
        (a.sequence_index ?? 0) - (b.sequence_index ?? 0) ||
        a.raw_id.localeCompare(b.raw_id),
    );
  const sources = previous.sources.map((source) => structuredClone(source));
  const relationships = [...previous.relationships];
  for (const source of [...incoming].sort((a, b) =>
    a.source_id.localeCompare(b.source_id),
  )) {
    const existing = sources.find(
      (candidate) => candidate.source_id === source.source_id,
    );
    if (existing) {
      if (sourceRelation(existing, source) === 'review')
        throw new Error(
          'Changed material needs a reviewed same_material_as relation or a distinct revision identity with supersedes: ' +
            source.source_id,
        );
      const index = sources.indexOf(existing);
      sources[index] = {
        ...existing,
        ...source,
        publication:
          existing.publication === 'private' || source.publication === 'private'
            ? 'private'
            : source.publication,
        raw_files: captures(existing, source),
        raw_ids: [...new Set([...existing.raw_ids, ...source.raw_ids])].sort(),
        raw_hashes: [
          ...new Set([...existing.raw_hashes, ...source.raw_hashes]),
        ].sort(),
        supplements: [
          ...new Set([...existing.supplements, ...source.supplements]),
        ].sort(),
        atlas_content_ids: [
          ...new Set([
            ...existing.atlas_content_ids,
            ...source.atlas_content_ids,
          ]),
        ].sort(),
        vault_links: [
          ...new Map(
            [
              ...(existing.vault_links ?? []),
              ...(source.vault_links ?? []),
            ].map((link) => [link.path, link]),
          ).values(),
        ].sort((a, b) => a.path.localeCompare(b.path)),
      };
      continue;
    }
    const duplicate = sources.find(
      (candidate) => sourceRelation(candidate, source) === 'duplicate',
    );
    if (duplicate) {
      duplicate.raw_ids = [
        ...new Set([...duplicate.raw_ids, ...source.raw_ids]),
      ].sort();
      duplicate.raw_files = captures(duplicate, source);
      duplicate.publication =
        duplicate.publication === 'private' || source.publication === 'private'
          ? 'private'
          : duplicate.publication;
      duplicate.supplements = [
        ...new Set([...duplicate.supplements, ...source.supplements]),
      ].sort();
      duplicate.raw_hashes = [
        ...new Set([...duplicate.raw_hashes, ...source.raw_hashes]),
      ].sort();
      duplicate.atlas_content_ids = [
        ...new Set([
          ...duplicate.atlas_content_ids,
          ...source.atlas_content_ids,
        ]),
      ].sort();
      duplicate.vault_links = [
        ...new Map(
          [...(duplicate.vault_links ?? []), ...(source.vault_links ?? [])].map(
            (link) => [link.path, link],
          ),
        ).values(),
      ].sort((a, b) => a.path.localeCompare(b.path));
      relationships.push({
        from: source.source_id,
        to: duplicate.source_id,
        relation: 'duplicate',
      });
      continue;
    }
    for (const candidate of sources) {
      const relation = sourceRelation(candidate, source);
      if (relation === 'review' || relation === 'supersedes')
        relationships.push({
          from: source.source_id,
          to: candidate.source_id,
          relation,
        });
    }
    sources.push({
      ...structuredClone(source),
      raw_files: captures(source, source),
      vault_links: source.vault_links ?? [],
      raw_ids: [...new Set(source.raw_ids)].sort(),
      raw_hashes: [...new Set(source.raw_hashes)].sort(),
      supplements: [...new Set(source.supplements)].sort(),
      atlas_content_ids: [...new Set(source.atlas_content_ids)].sort(),
    });
  }
  const uniqueRelations = new Map(
    relationships.map((item) => [JSON.stringify(item), item]),
  );
  return {
    schema_version: 1,
    sources: sources.sort((a, b) => a.source_id.localeCompare(b.source_id)),
    relationships: [...uniqueRelations.values()].sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b)),
    ),
  };
}
export function classifyCapture(text: string): IntakeCourse | undefined {
  if (
    /physics|kinematics|position.time|velocity.time|displacement|acceleration|free fall/i.test(
      text,
    )
  )
    return 'physics';
  if (/hiragana|katakana|japanese|[ぁ-ゟ]/i.test(text)) return 'japanese';
  if (
    /chemistry|hebden|glencoe|electron configuration|covalent|electronegativity|whmis/i.test(
      text,
    )
  )
    return 'chemistry';
  if (
    /biology|life sciences|fossil|cladogram|classification|endosymbio|paleozoic/i.test(
      text,
    )
  )
    return 'life-sciences';
  return undefined;
}
export function groupCaptures(captures: RawCapture[]) {
  const groups: {
    course?: IntakeCourse;
    key: string;
    captures: RawCapture[];
    needsReview: boolean;
  }[] = [];
  for (const capture of [...captures].sort(
    (a, b) => a.sequence_index - b.sequence_index,
  )) {
    const last = groups.at(-1);
    const identified = capture.course ?? classifyCapture(capture.text);
    const inherited =
      last &&
      !capture.title &&
      ((capture.document_key && last.key === capture.document_key) ||
        (!capture.document_key &&
          capture.page !== undefined &&
          last.captures.at(-1)?.page !== undefined &&
          capture.page === last.captures.at(-1)!.page! + 1) ||
        (!capture.document_key &&
          capture.questions?.[0] !== undefined &&
          capture.questions[0] ===
            (last.captures.at(-1)?.questions?.at(-1) ?? -2) + 1));
    const course = identified ?? (inherited ? last.course : undefined);
    const sameDocument =
      capture.document_key && last?.key === capture.document_key;
    const continuingPage =
      last &&
      course === last.course &&
      capture.page !== undefined &&
      last.captures.at(-1)?.page !== undefined &&
      capture.page === last.captures.at(-1)!.page! + 1;
    const continuingQuestions =
      last &&
      course === last.course &&
      !capture.title &&
      capture.questions?.[0] !== undefined &&
      last.captures.at(-1)?.questions?.at(-1) !== undefined &&
      capture.questions[0] === last.captures.at(-1)!.questions!.at(-1)! + 1;
    if (
      last &&
      course === last.course &&
      (sameDocument ||
        (!capture.document_key && (continuingPage || continuingQuestions)))
    )
      last.captures.push(capture);
    else
      groups.push({
        course,
        key: capture.document_key ?? `capture-${capture.raw_id}`,
        captures: [capture],
        needsReview: !course || !capture.document_key,
      });
  }
  return groups;
}

export const BLEECKER_ROOT =
  'https://sites.google.com/view/ecl-life-sciences-11/';
export function isBleeckerCoursePage(value: string) {
  try {
    const url = new URL(value, BLEECKER_ROOT);
    return (
      url.hostname === 'sites.google.com' &&
      url.pathname.startsWith('/view/ecl-life-sciences-11/') &&
      !/bio2|anatomy|life-sciences-12|biology-12/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}
const unescapeIcs = (value: string) =>
  value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
export function parseTeacherCalendar(
  text: string,
  start = '2026-09-08',
  end = '2027-01-29',
) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  return [...unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)]
    .map((match) => {
      const field = (name: string) =>
        unescapeIcs(
          match[1].match(
            new RegExp(`(?:^|\\n)${name}(?:;[^:]+)?:([^\\r\\n]*)`),
          )?.[1] ?? '',
        );
      const date = (value: string) =>
        value.length >= 8
          ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
          : '';
      const description = field('DESCRIPTION')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/ +/g, ' ')
        .trim();
      return {
        uid: field('UID'),
        title: field('SUMMARY'),
        start: date(field('DTSTART')),
        endExclusive: date(field('DTEND')),
        description,
        location: field('LOCATION'),
        assessmentScope: /test|quiz|exam/i.test(field('SUMMARY'))
          ? description
          : '',
      };
    })
    .filter((event) => event.start >= start && event.start <= end)
    .sort(
      (a, b) => a.start.localeCompare(b.start) || a.uid.localeCompare(b.uid),
    );
}
