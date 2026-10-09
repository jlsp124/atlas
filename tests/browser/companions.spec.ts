import { test, expect } from '@playwright/test';
async function open(page: import('@playwright/test').Page, path: string) {
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
}

test('real worksheet guides the paper working, saves the step and returns to the document', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  await expect(
    page.locator(
      '.assignment-document input:not([type=checkbox]), .assignment-document textarea',
    ),
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Walk through question 1', exact: true })
    .click();
  const guide = page.locator('.walkthrough');
  await expect(guide).toHaveAttribute('data-question', 'q-1');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('mark[data-active=true]')).toContainText('slows');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  const at = await guide.getAttribute('data-step');
  await page.reload();
  await expect(guide).toHaveAttribute('data-step', at!);
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide).toHaveAttribute('data-step', String(Number(at) - 1));
  while (await guide.getByRole('button', { name: 'Next', exact: true }).count())
    await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('.calculated-result')).toContainText('63 m');
  await guide
    .getByRole('button', { name: 'Next question', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Whole assignment', exact: true })
    .click();
  await expect(page.locator('.document-question')).toHaveCount(37);
  await expect(page.locator('.assignment-resume')).not.toContainText(
    'done on paper',
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Continue question 2', exact: true }),
  ).toBeVisible();
});

test('formal Chemistry hand-ins expose metadata without solution controls', async ({
  page,
}) => {
  for (const id of [
    'electronic-structure',
    'chemistry-hand-in-1',
    'chemistry-hand-in-2',
  ]) {
    await open(page, 'work/' + id + '/');
    await expect(page.locator('.restricted-work')).toBeVisible();
    await expect(page.locator('.companion-question')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Learn this first', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /hint|answer|AI tutor/i }),
    ).toHaveCount(0);
  }
});

test('Japanese material links reach dedicated kana, vocabulary and weekly review', async ({
  page,
}) => {
  await open(page, 'work/japanese-kana/');
  await expect(page).toHaveURL(/courses\/japanese\/\?view=kana/);
  await expect(page.locator('.kana-stage')).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.locator('.kana-stage')).toContainText('0/3');
  await page.getByRole('button', { name: 'Next stroke', exact: true }).click();
  await expect(page.locator('.kana-stage')).toContainText('1/3');
  await open(page, 'work/greetings-practice/#q-5');
  await expect(page).toHaveURL(/view=vocabulary&sets=greetings#jp-basics-5/);
  await expect(page.locator('#jp-basics-5')).toContainText('konnichiwa');
  await open(page, 'courses/japanese/units/greetings/');
  await expect(page.locator('.jp-word-row')).toHaveCount(37);
  await expect(page.locator('.jp-word-list')).not.toContainText('さんかっけい');
  await open(page, 'courses/japanese/units/colours/');
  await expect(
    page.getByRole('heading', { name: 'Colors & shapes', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'See the word list', exact: true })
    .click();
  await expect(page.locator('.jp-word-list')).toContainText('sankakkei');
  await expect(page.locator('.jp-word-list')).toContainText('ハート');
});

test('percent error uses the accepted denominator and has a percent result', async ({
  page,
}) => {
  await open(page, 'work/physics-basic-skills/');
  await page
    .getByText('Check your percent-error calculation', { exact: true })
    .click();
  await page.getByLabel('Experimental value', { exact: true }).fill('90');
  await page.getByLabel('Accepted value', { exact: true }).fill('100');
  await expect(page.locator('.companion-reading [role=status]')).toContainText(
    '10%',
  );
});

test('phone worksheet reflows and tiled desktop keeps Help and About reachable', async ({
  page,
}) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await open(page, 'work/kinematics-review/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 820, height: 620 });
  await open(page, 'work/kinematics-review/');
  const help = page.getByRole('link', { name: 'Help', exact: true });
  await help.scrollIntoViewIfNeeded();
  await expect(help).toBeVisible();
  await help.click();
  await expect(page).toHaveURL(/help/);
  const about = page.getByRole('link', { name: 'About', exact: true });
  await about.scrollIntoViewIfNeeded();
  await expect(about).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
