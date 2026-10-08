import type { LearnerEvent } from './schema';

// The API retains its 128 KiB request limit. Written drafts can be much larger
// than the previous evidence events; budget UTF-8 JSON bytes as well as count.
export function syncBatch(events: LearnerEvent[]) {
  const batch: LearnerEvent[] = [];
  const encoder = new TextEncoder();
  let bytes = 0;
  for (const event of events.slice(0, 100)) {
    const size = encoder.encode(JSON.stringify(event)).byteLength + 1;
    if (batch.length > 0 && bytes + size > 96 * 1024) break;
    batch.push(event);
    bytes += size;
  }
  return batch;
}
