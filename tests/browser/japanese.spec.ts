import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes } from 'node:crypto';

async function open(page: Page, path = 'courses/japanese/') {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('main astro-island[ssr]')).toHaveCount(0);
  await expect(page.locator('.japanese-screen')).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
async function review(page: Page, sets = 'colors', mode = 'Recognition') {
  await open(page, `courses/japanese/?view=review&sets=${sets}`);
  await page.getByRole('button', { name: mode, exact: true }).click();
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expect(page.locator('.jp-review-session')).toBeVisible();
}

test('legacy word links scroll to the vocabulary row after hydration', async ({
  page,
}) => {
  await open(page, 'work/greetings-practice/#q-15');
  await expect(page).toHaveURL(/view=vocabulary&sets=greetings#jp-basics-15$/);
  const word = page.locator('#jp-basics-15');
  await expect(word).toBeInViewport({ ratio: 1 });
  await expect(word).toContainText('ありがとうございます');
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.reload();
  await expect(word).toBeInViewport({ ratio: 1 });
});

test('Japanese opens a weekly focus and combines real vocabulary groups', async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole('heading', { name: 'Colors & shapes', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.current-work-band, .unit-list, .walkthrough'),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'See the word list', exact: true })
    .click();
  await expect(page.locator('.jp-word-row')).toHaveCount(18);
  await expect(page.locator('.jp-word-list')).toContainText('さんかっけい');
  await expect(page.locator('.jp-word-list')).toContainText('sankakkei');
  await page.getByRole('button', { name: /^Colors/ }).click();
  await expect(page.locator('.jp-word-row')).toHaveCount(6);
  await page.getByRole('button', { name: /^Greetings/ }).click();
  await expect(page.locator('.jp-word-row')).toHaveCount(24);
  await page
    .getByRole('combobox', { name: 'Reading display' })
    .selectOption('japanese');
  await expect(page.locator('.jp-word-list .jp-romaji')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Reading display' }),
  ).toHaveValue('japanese');
  await expect(page.locator('.jp-word-row')).toHaveCount(24);
  await page
    .getByRole('combobox', { name: 'Reading display' })
    .selectOption('reading-aids');
  await expect(
    page.locator('.jp-romaji').filter({ hasText: /^konnichiwa$/ }),
  ).toBeVisible();
  await noOverflow(page);
});

test('review scopes, typing, difficulty and repeat selection persist without typed content', async ({
  page,
}) => {
  await open(page, 'courses/japanese/?view=review');
  await page.getByRole('button', { name: 'All words', exact: true }).click();
  await expect(page.locator('.jp-review-start')).toContainText('75 words');
  await page
    .getByRole('button', { name: 'Colors + Shapes', exact: true })
    .click();
  await expect(page.locator('.jp-review-start')).toContainText('18 words');
  await page
    .getByRole('button', { name: 'Type Japanese', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Type with' })
    .selectOption('romaji');
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await page.getByRole('textbox', { name: 'Japanese answer' }).fill('iro');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.locator('.jp-review-answer')).toContainText('That’s right');
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('atlas:v1:guest')!).events.filter(
      (event: { type: string }) => event.type === 'japanese_reviewed',
    ),
  );
  expect(persisted).toHaveLength(1);
  expect(persisted[0].payload).toEqual({
    word: 'jp-color-shape-1',
    mode: 'typing',
    correct: true,
    rating: 'hard',
    revealed: false,
  });
  await page.reload();
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expect(page.locator('.jp-review-question')).toContainText('いろ');
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await page.getByRole('button', { name: 'Okay', exact: true }).click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('atlas:v1:guest')!).events.filter(
      (event: { type: string }) => event.type === 'japanese_reviewed',
    ),
  );
  expect(after[1].payload).toMatchObject({
    word: 'jp-color-shape-1',
    correct: false,
    revealed: true,
    rating: 'okay',
  });
  expect(Object.keys(after[1].payload).sort()).toEqual([
    'correct',
    'mode',
    'rating',
    'revealed',
    'word',
  ]);
  await noOverflow(page);
});

test('vowel strokes and kana rows work while grammar waits for real material', async ({
  page,
}) => {
  await open(page, 'courses/japanese/?view=kana');
  await expect(
    page
      .getByRole('group', { name: 'Five confirmed vowels' })
      .getByRole('button'),
  ).toHaveCount(5);
  await expect(page.locator('.kana-stage')).toContainText('0/3');
  await page.getByRole('button', { name: 'Next stroke', exact: true }).click();
  await expect(page.locator('.kana-stage')).toContainText('1/3');
  await page.getByRole('button', { name: 'い i', exact: true }).click();
  await expect(page.locator('.kana-stage')).toContainText('0/2');
  await page
    .locator('.jp-kana-reference summary')
    .filter({ hasText: 'K row' })
    .click();
  await expect(page.locator('.jp-kana-row:visible')).toContainText('か');
  await expect(page.locator('.jp-kana-row:visible')).toContainText('ka');
  await page.getByRole('link', { name: 'Grammar', exact: true }).click();
  await expect(page.locator('.jp-content')).toContainText(
    'first grammar sheet hasn’t been added',
  );
  await expect(page.locator('.jp-familiar-piece')).toContainText('おはよう');
  await expect(page.locator('.jp-familiar-piece')).toContainText('ございます');
  await expect(page.locator('.jp-grammar-lesson')).toHaveCount(0);
  await noOverflow(page);
  await review(page, 'vowels');
  await expect(page.locator('.jp-review-question .jp-romaji')).toHaveCount(0);
});

test('a short review completes and emits only product metadata', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const events: unknown[] = [];
    Object.assign(window, { japaneseProductEvents: events });
    window.addEventListener('atlas:product-event', (event) =>
      events.push((event as CustomEvent).detail),
    );
  });
  await review(page, 'vowels');
  const meanings: Record<string, string> = {
    あ: 'a',
    い: 'i',
    う: 'u',
    え: 'e',
    お: 'o',
  };
  for (let index = 0; index < 5; index++) {
    const character = await page
      .locator('.jp-review-question .jp-written')
      .innerText();
    await page
      .locator('.jp-review-choices')
      .getByRole('button', { name: meanings[character], exact: true })
      .click();
    await page.getByRole('button', { name: 'Easy', exact: true }).click();
  }
  await expect(
    page.getByRole('heading', { name: '5 words reviewed', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { japaneseProductEvents: unknown[] })
          .japaneseProductEvents,
    ),
  ).toEqual([
    {
      type: 'japanese_review_started',
      course: 'japanese',
      feature: 'japanese-review',
      scope: 'vowels',
      success: true,
    },
    {
      type: 'japanese_review_completed',
      course: 'japanese',
      feature: 'japanese-review',
      scope: 'vowels',
      success: true,
    },
  ]);
});

test('review outcomes sync to another account device and guest history stays separate', async ({
  page,
  browser,
}) => {
  const username = 'jp_' + randomBytes(5).toString('hex');
  const password = randomBytes(18).toString('base64url');
  await page.goto('/atlas/account/');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .first()
    .click();
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('heading', { name: `Hi, ${username}.` }),
  ).toBeVisible();
  await review(page, 'shapes');
  await page.getByRole('button', { name: 'circle', exact: true }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.goto('/atlas/account/');
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  const peerContext = await browser.newContext();
  try {
    const peer = await peerContext.newPage();
    await peer.goto('http://localhost:4321/atlas/account/');
    await peer.getByLabel('Username', { exact: true }).fill(username);
    await peer.getByLabel('Password', { exact: true }).fill(password);
    await peer
      .getByRole('button', { name: 'Sign in', exact: true })
      .last()
      .click();
    await expect(
      peer.getByRole('heading', { name: `Hi, ${username}.` }),
    ).toBeVisible();
    await review(peer, 'shapes');
    await expect(peer.locator('.jp-review-question')).toContainText('えんけい');
    const histories = await peer.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('atlas:v1:account:'))
        .map((key) =>
          JSON.parse(localStorage.getItem(key)!).events.filter(
            (event: { type: string }) => event.type === 'japanese_reviewed',
          ),
        ),
    );
    expect(histories.flat()).toHaveLength(1);
    expect(histories.flat()[0].payload).toMatchObject({
      word: 'jp-color-shape-13',
      rating: 'hard',
      correct: true,
    });
  } finally {
    await peerContext.close();
  }
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await open(page, 'courses/japanese/?view=review&sets=shapes');
  expect(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('atlas:v1:guest') || '{"events":[]}',
      ).events.filter(
        (event: { type: string }) => event.type === 'japanese_reviewed',
      ),
    ),
  ).toEqual([]);
});

test('Japanese course, kana and review are accessible and reflow in both themes', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark'] as const) {
    await page.addInitScript((theme) => {
      localStorage.setItem('atlas:theme', theme);
      const data = JSON.parse(
        localStorage.getItem('atlas:v1:guest') || '{"events":[]}',
      );
      data.events.push({
        id: crypto.randomUUID(),
        device: crypto.randomUUID(),
        at: new Date().toISOString(),
        type: 'theme_changed',
        payload: { theme },
      });
      localStorage.setItem('atlas:v1:guest', JSON.stringify(data));
    }, theme);
    for (const section of ['this-week', 'kana', 'review']) {
      await open(page, `courses/japanese/?view=${section}`);
      if (section === 'review')
        await page
          .getByRole('button', { name: 'Start review', exact: true })
          .click();
      await noOverflow(page);
      expect(
        (await new AxeBuilder({ page }).include('main').analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`japanese-${section}-${theme}.png`),
        fullPage: true,
      });
    }
  }
});
