import { expect, it } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from '../server/app';
import { openDatabase } from '../server/database';
import { japaneseWords } from '../src/content/japanese';

it('syncs Japanese review outcomes across devices without storing typed responses', async () => {
  const db = openDatabase('', true);
  const origin = 'http://localhost:4321';
  const app = await createServer({ db, origin, secure: false });
  const user = randomUUID(),
    cookie = randomUUID(),
    csrf = randomUUID(),
    at = new Date().toISOString();
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(
    user,
    `review_${user.slice(0, 8)}`,
    'synthetic-only',
    'user',
    at,
    at,
    0,
  );
  db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').run(
    createHash('sha256').update(cookie).digest('hex'),
    user,
    csrf,
    Date.now() + 600000,
    at,
  );
  const headers = {
    origin,
    'x-atlas-client': 'atlas',
    'x-csrf-token': csrf,
    cookie: `atlas-dev=${cookie}`,
  };
  const event = {
    id: randomUUID(),
    device: randomUUID(),
    at,
    type: 'japanese_reviewed',
    payload: {
      word: japaneseWords[0].id,
      mode: 'typing',
      correct: true,
      revealed: false,
      rating: 'okay',
    },
  };
  try {
    const post = (events: unknown[]) =>
      app.inject({
        method: 'POST',
        url: '/sync',
        headers,
        payload: { events, cursor: 0 },
      });
    expect(
      (
        await post([
          {
            ...event,
            payload: { ...event.payload, answer: 'private typed response' },
          },
        ])
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await post([
          { ...event, payload: { ...event.payload, word: 'unreviewed-word' } },
        ])
      ).statusCode,
    ).toBe(400);
    expect((await post([event])).statusCode).toBe(200);
    expect((await post([event])).statusCode).toBe(200);
    const peer = await post([]);
    expect(peer.json().events).toEqual([event]);
    expect(JSON.stringify(peer.json())).not.toContain('private typed response');
  } finally {
    await app.close();
  }
});
