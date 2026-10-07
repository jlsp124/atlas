import { test, expect } from '@playwright/test';
async function open(page: import('@playwright/test').Page, path: string) {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
}

test('real worksheet retries one tiny idea, rates locally and returns to the next real question', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  const q = page.locator('.companion-question').first();
  await q
    .getByRole('button', { name: 'What is this asking?', exact: true })
    .click();
  await expect(q).toContainText('while its speed changes');
  await q.getByLabel('Your answer', { exact: true }).fill('4');
  await q.getByLabel('Unit', { exact: true }).fill('m');
  await q.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(q.locator('.tiny-repair')).toHaveCount(0);
  await q.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(q.locator('.tiny-repair')).toBeVisible();
  await q
    .locator('.tiny-repair')
    .getByRole('radio', {
      name: '(initial velocity + final velocity) / 2',
      exact: true,
    })
    .check();
  await q.getByRole('button', { name: 'Check this idea', exact: true }).click();
  await expect(q.locator('.tiny-repair')).toHaveCount(0);
  await expect(q).toHaveAttribute('data-question', 'q-1');
  await q.getByLabel('Your answer', { exact: true }).fill('63');
  await q.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(q.getByRole('status')).toContainText('That matches');
  await q.getByRole('button', { name: 'Okay', exact: true }).click();
  await page.reload();
  await expect(
    q.getByRole('button', { name: 'Okay', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await q
    .getByRole('link', { name: 'Next real question', exact: true })
    .click();
  await expect(page).toHaveURL(/#q-2$/);
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

test('Japanese has authentic strokes, useful component connections and real Japanese input', async ({
  page,
}) => {
  await open(page, 'work/japanese-kana/');
  await expect(page.locator('.kana-practice')).toHaveCount(5);
  const vowel = page.locator('.kana-practice').first();
  await vowel.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(vowel).toContainText('0/3');
  await vowel.getByRole('button', { name: 'Next stroke', exact: true }).click();
  await expect(vowel).toContainText('1/3');
  await open(page, 'work/greetings-practice/');
  await expect(page.locator('.phrase-connection').first()).toContainText(
    'ございます',
  );
  await expect(page.locator('.phrase-connection').last()).toContainText(
    'Useful next',
  );
  const q = page.locator('.companion-question').first();
  await expect(
    q.getByLabel('Write in Japanese', { exact: true }),
  ).toHaveAttribute('lang', 'ja');
  await q.getByLabel('Write in Japanese', { exact: true }).fill('にほん');
  await q.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(q.getByRole('status')).toContainText('That matches');
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
