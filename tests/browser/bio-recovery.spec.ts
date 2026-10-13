import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('recovered questions open their key idea and return to the same item', async ({
  page,
}) => {
  await page.goto('/atlas/courses/life-sciences/assignments/bio-c17-1/');
  await expect(page.locator('.life-question')).toHaveCount(6);
  await page.goto(
    '/atlas/courses/life-sciences/assignments/bio-c19-2/#q-19-2-2',
  );
  await expect(page.locator('#q-19-2-2')).toHaveAttribute('open', '');
  await page.locator('#q-19-2-2 .life-main-idea').click();
  await expect(page.locator('#viral-cycles')).toHaveAttribute('open', '');
  await page
    .locator('#viral-cycles .life-backlinks a')
    .filter({ hasText: '19.2 questions · 2' })
    .click();
  await expect(page).toHaveURL(/bio-c19-2\/#q-19-2-2$/);
  await expect(
    page.locator('.life-assignment input, .life-assignment textarea'),
  ).toHaveCount(0);
});
test('both video assignments expose verified links and distinguish factual and reasoning responses', async ({
  page,
}, info) => {
  for (const [material, count, video] of [
    ['bio-c17-nova', 15, 'IuqmtcogwsE'],
    ['bio-virus-video', 18, '8q68qHiKKYw'],
  ] as const) {
    await page.goto(`/atlas/courses/life-sciences/assignments/${material}/`);
    await expect(page.locator('.life-video-question')).toHaveCount(count);
    await expect(page.locator('.life-video-links a').first()).toHaveAttribute(
      'href',
      new RegExp(video),
    );
    await expect(page.locator('.life-timestamp').first()).toHaveAttribute(
      'href',
      new RegExp(`${video}&t=\\d+s`),
    );
    await expect(
      page.locator('.life-video-evidence[data-kind=reasoning]').first(),
    ).toBeVisible();
    await expect(
      page.locator('.life-assignment input, .life-assignment textarea'),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await expect(page.locator('#q-16')).toContainText(
    'no matching caption segment',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath('virus-video.png'),
    fullPage: true,
  });
});
