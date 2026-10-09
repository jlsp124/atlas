import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { assignments } from '../../src/content/catalog';
async function open(page: Page, path: string) {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('main astro-island[ssr]')).toHaveCount(0);
  if (path.startsWith('work/kinematics-review/')) {
    await expect(page.locator('.paper-workspace')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await expect(page.locator('.paper-workspace')).toHaveAttribute(
      'data-location-ready',
      'true',
    );
    if (path.includes('#q-'))
      await expect(page.locator('.walkthrough')).toBeVisible();
  }
  await page.waitForTimeout(180); // Let the native page snapshot finish before inspection.
}
async function finish(page: Page) {
  const guide = page.locator('.walkthrough');
  let safety = 30;
  while (
    await guide.getByRole('button', { name: 'Next', exact: true }).count()
  ) {
    if (!safety--) throw new Error('Walkthrough did not finish');
    await guide.getByRole('button', { name: 'Next', exact: true }).click();
  }
}
test('the generic Physics and Chemistry catalog opens as documents without answer forms', async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const a of assignments.filter(
    (a) =>
      (a.course === 'physics' || a.course === 'chemistry') &&
      !(
        a.course === 'physics' &&
        (a.kind === 'notes' ||
          a.kind === 'lab' ||
          [
            'physics-motion-packet',
            'physics-average-velocity',
            'physics-describing-acceleration',
            'physics-calculating-acceleration',
          ].includes(a.id))
      ),
  )) {
    await open(page, 'work/' + a.id + '/');
    await expect(page.locator('.assignment-document h1')).toHaveText(a.title);
    await expect(
      page.locator(
        '.assignment-document textarea:visible, .assignment-document input:not([type=checkbox]):visible',
      ),
    ).toHaveCount(0);
    await expect(page.locator('.document-question')).toHaveCount(
      a.companionQuestions?.length ?? 0,
    );
  }
});
test('unit filters find textbook work and show a useful empty state', async ({
  page,
}) => {
  await open(page, 'courses/chemistry/units/atomic/');
  await expect(
    page.getByRole('button', { name: 'Learn', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Textbook', exact: true }).click();
  expect(
    (await page.locator('.material-row').allTextContents()).join(' '),
  ).not.toContain('details only');
  await page
    .getByRole('textbox', { name: 'Find material in this unit', exact: true })
    .fill('no matching material');
  await expect(
    page.getByRole('heading', { name: 'No matching materials' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show all materials' }).click();
  await expect(page.locator('.material-row')).toContainText(['Hebden']);
});
test('Lewis electrons persist and move from the budget into bonds and lone pairs', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-lewis/');
  await page
    .getByRole('link', { name: 'Walk through question 86', exact: true })
    .click();
  const guide = page.locator('.walkthrough');
  const first = await page.locator('.moving-electron').first().elementHandle();
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('.electron-budget')).toContainText('8 to place');
  const start = await first!.getAttribute('style');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await first!.evaluate((el) => el.isConnected)).toBe(true);
  expect(await first!.getAttribute('style')).not.toBe(start);
  await expect(guide.locator('.electron-budget')).toContainText('4 in bonds');
  await expect(
    guide.locator('.moving-electron[data-atom=hydrogen][data-place=bond]'),
  ).toHaveCount(2);
  await expect(
    guide.locator('.moving-electron[data-atom=oxygen][data-place=bond]'),
  ).toHaveCount(2);
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('.moving-electron')).toHaveCount(8);
  await expect(guide.locator('.electron-budget')).toContainText(
    '4 in lone pairs',
  );
  await expect(
    guide.locator('.moving-electron[data-atom=oxygen][data-place=lone-pair]'),
  ).toHaveCount(4);
  await expect(guide.locator('figcaption').first()).toContainText(
    'Worked example',
  );
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide.locator('.electron-budget')).toContainText('4 to place');
});

test('Physics preserves a term through rearrangement and shows the resulting units', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?step=0#q-12');
  const guide = page.locator('.walkthrough');
  let limit = 20;
  while (!(await guide.locator('.live-equation').isVisible())) {
    if (!limit--) throw new Error('The formula did not appear');
    await guide.getByRole('button', { name: 'Next', exact: true }).click();
  }
  const initial = await guide
    .locator('[data-move-id=equation-vi-0]')
    .elementHandle();
  const fonts = await guide
    .locator('.live-equation .velocity-symbol sub')
    .evaluateAll((subs) =>
      subs.map((sub) => {
        const style = getComputedStyle(sub);
        return [
          style.fontFamily,
          style.fontSize,
          style.fontStyle,
          style.bottom,
        ];
      }),
    );
  expect(fonts).toHaveLength(2);
  expect(fonts[0]).toEqual(fonts[1]);
  const before = await initial!.boundingBox();
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('.live-equation')).toContainText('− 2 ×');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await initial!.evaluate((el) => el.isConnected)).toBe(true);
  expect(
    await initial!.evaluate((el) => el.getAnimations().length),
  ).toBeGreaterThan(0);
  await expect(guide.locator('.live-equation')).toContainText('vi = √');
  await finish(page);
  expect((await initial!.boundingBox())!.x).toBeLessThan(before!.x);
  await expect(guide.locator('.physics-unit-working')).toContainText(
    '√(m²/s²) = m/s',
  );
  await page
    .getByRole('button', { name: 'Whole assignment', exact: true })
    .click();
  await open(page, '');
  const onboarding = page.getByRole('button', {
    name: 'Look around without an account',
    exact: true,
  });
  await onboarding.click();
  await expect(
    page.getByRole('dialog', { name: 'Welcome to atlas', exact: true }),
  ).not.toBeVisible();
  const resume = page.locator('.continue-row');
  await expect(resume).toHaveAttribute(
    'href',
    /work\/kinematics-review\/\?step=\d+#q-12$/,
  );
  await resume.click();
  await expect(guide.locator('.calculated-result')).toContainText('9.4 m/s');
});
test('actual configurations fill to the correct total and rate units cancel', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-electrons/?step=0#q-27f');
  await finish(page);
  await expect(page.locator('.electron-count')).toContainText('18 placed');
  await expect(page.locator('.core-token')).toHaveText('[Ne]');
  await open(page, 'work/chemistry-hebden-conversions/?step=0#q-17l');
  await finish(page);
  await expect(page.locator('.conversion-result')).toContainText('0.01 g/L');
  await expect(page.locator('.cancel-unit[data-cancel=true]')).toHaveCount(4);
});
test('Biology uses brief evidence and paper response guidance without input', async ({
  page,
}) => {
  await open(page, 'work/bio-c17-sections/?step=0#q-17-2-4');
  await expect(page).toHaveURL(/bio-c17-2\/#q-17-2-4$/);
  await expect(
    page.locator('.life-assignment textarea, .life-assignment input'),
  ).toHaveCount(0);
  await expect(page.locator('#q-17-2-4 svg[role=img]')).toHaveAttribute(
    'aria-label',
    /bacterium/,
  );
  await expect(page.locator('#q-17-2-4 .life-answer-needs')).toContainText(
    'How the partnership began and lasted',
  );
  await expect(page.locator('#q-17-2-4 .life-main-idea')).toHaveAttribute(
    'href',
    '/atlas/courses/life-sciences/key-ideas/#endosymbiosis',
  );
});
test('completion is manual on the assignment list and survives refresh', async ({
  page,
}) => {
  await open(page, 'courses/physics/units/kinematics/');
  const row = page.locator('[data-material=physics-average-velocity]');
  const check = row.getByRole('button', { name: /Mark complete/ });
  await check.click();
  await page.reload();
  await expect(row.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  await row.getByRole('link').click();
  await expect(
    page.getByRole('combobox', { name: 'Assignment status' }),
  ).toHaveCount(0);
  await open(page, 'courses/physics/units/kinematics/');
  await row.getByRole('button').click();
  await expect(row.getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});
test('the 404 offers courses and working search', async ({ page }) => {
  await open(page, 'this-page-is-missing/');
  await expect(
    page.getByRole('heading', { name: 'This page isn’t here.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Search atlas', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search atlas', exact: true })
    .fill('Lewis');
  await expect(page.locator('.search-results a').first()).toBeVisible();
});

test('quick feedback includes the exact question and step and restores focus', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?step=4#q-7');
  const suggest = page.getByRole('button', { name: 'Suggest', exact: true });
  await suggest.click();
  const sheet = page.getByRole('dialog', {
    name: 'Help / Feedback',
    exact: true,
  });
  await expect(sheet.locator('.feedback-context')).toContainText('Question 7');
  await expect(sheet.locator('.feedback-context')).toContainText('Step 5');
  await expect(
    sheet.getByRole('button', { name: 'Suggest something', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const draft = `This animation needs a clearer direction label ${Date.now()}`;
  await sheet
    .getByRole('textbox', { name: 'What would make this better?' })
    .fill(draft);
  await page.keyboard.press('Escape');
  await expect(sheet).not.toBeVisible();
  await expect(suggest).toBeFocused();
  await suggest.click();
  await expect(
    sheet.getByRole('textbox', { name: 'What would make this better?' }),
  ).toHaveValue(draft);
  const sent = page.waitForResponse(
    (r) => r.url().endsWith('/requests') && r.request().method() === 'POST',
  );
  await sheet
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  const response = await sent;
  expect(response.status()).toBe(201);
  const payload = response.request().postDataJSON();
  expect(payload.kind).toBe('feature');
  expect(payload.course).toBe('physics');
  expect(payload.message).toContain(draft);
  expect(payload.message).toContain('Question 7');
  expect(payload.message).toContain(
    '/atlas/work/kinematics-review/?step=4#q-7',
  );
  await expect(
    sheet.getByRole('heading', { name: 'Feedback received.' }),
  ).toBeVisible();
  await expect(
    sheet.getByRole('link', { name: 'atlas@jovanpahal.com' }),
  ).toHaveAttribute('href', 'mailto:atlas@jovanpahal.com');
});

test('failed feedback keeps the draft and offers email with its context', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-lewis/?step=2#q-86');
  await page.route('http://localhost:8790/requests', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Temporarily unavailable' }),
    }),
  );
  await page
    .getByRole('button', { name: 'Help and feedback', exact: true })
    .click();
  const sheet = page.getByRole('dialog', {
    name: 'Help / Feedback',
    exact: true,
  });
  const text = sheet.getByRole('textbox', { name: 'What happened?' });
  await text.fill('The electron placement is hard to follow.');
  await sheet
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await expect(sheet.getByRole('alert')).toContainText(
    'Your draft is still here',
  );
  await expect(text).toHaveValue('The electron placement is hard to follow.');
  const mail = await sheet
    .getByRole('link', { name: 'Email atlas instead' })
    .getAttribute('href');
  expect(decodeURIComponent(mail!)).toContain('atlas@jovanpahal.com');
  expect(decodeURIComponent(mail!)).toContain('Question 86');
  expect(decodeURIComponent(mail!)).toContain(
    'The electron placement is hard to follow.',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('small phones reveal the new working and keep Japanese navigation visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'work/chemistry-hebden-electrons/?step=5#q-26a');
  const visibleAboveNavigation = async (selector: string) =>
    page.evaluate((selector) => {
      const target = document.querySelector(selector)!.getBoundingClientRect();
      const footer = document
        .querySelector('.walkthrough-footer')!
        .getBoundingClientRect();
      return target.top >= 0 && target.bottom <= footer.top;
    }, selector);
  await expect
    .poll(() => visibleAboveNavigation('.teaching-diagram'))
    .toBe(true);
  await page
    .locator('.walkthrough-footer')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await expect
    .poll(() => visibleAboveNavigation('.paper-instruction'))
    .toBe(true);
  await expect(page.locator('.topbar')).toBeInViewport({ ratio: 1 });
  const back = page
    .locator('.walkthrough-footer')
    .getByRole('button', { name: 'Back', exact: true });
  for (let i = 0; i < 6; i++) await back.click();
  await expect(page.locator('.transforming-question')).toBeInViewport({
    ratio: 1,
  });
  await expect(
    page.getByRole('button', { name: 'Whole assignment', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await open(page, 'work/greetings-practice/?step=0#q-5');
  await expect(
    page.getByRole('navigation', { name: 'Japanese sections' }),
  ).toBeVisible();
  await expect(page.locator('.jp-word-list')).toContainText('こんにちは');
  await expect(page.locator('.walkthrough-footer')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Review these words', exact: true })
    .click();
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  const ratings = await page
    .getByRole('group', { name: 'Rate recall difficulty' })
    .getByRole('button')
    .evaluateAll((buttons) =>
      buttons.map((b) => b.getBoundingClientRect().top),
    );
  expect(new Set(ratings).size).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test('focused paper is accessible and reflows in both themes with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 390, 820, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((theme) => {
        localStorage.setItem('atlas:theme', theme);
        const key = 'atlas:v1:guest';
        const data = JSON.parse(localStorage.getItem(key) || '{"events":[]}');
        data.events.push({
          id: crypto.randomUUID(),
          device: crypto.randomUUID(),
          at: new Date().toISOString(),
          type: 'theme_changed',
          payload: { theme },
        });
        localStorage.setItem(key, JSON.stringify(data));
      }, theme);
      await open(page, 'work/chemistry-hebden-lewis/?step=3#q-86');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await expect(page.locator('.transforming-question')).toBeVisible();
      await expect(
        page
          .locator('.walkthrough-footer')
          .getByRole('button', { name: 'Next', exact: true }),
      ).toBeInViewport();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  }
});
