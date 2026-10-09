import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, path: string) {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('main astro-island[ssr]')).toHaveCount(0);
}
test('Life Sciences separates real work, notes and key ideas', async ({
  page,
}, testInfo) => {
  await open(page, 'courses/life-sciences/');
  await expect(
    page.getByRole('link', { name: /Class notes Mr. Bleecker’s site/ }),
  ).toHaveAttribute(
    'href',
    'https://sites.google.com/view/ecl-life-sciences-11/notes',
  );
  for (const title of [
    '17.1 questions',
    '17.2 questions',
    '17.3 questions',
    '17.4 questions',
    'NOVA video questions',
    'Chapter study guide',
    'Chapter assessment',
    'Standardized test prep',
  ])
    await expect(
      page
        .locator('.life-chapter')
        .first()
        .getByRole('link', { name: new RegExp(title.replaceAll('.', '\\.')) })
        .first(),
    ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'To do', exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('a[href$="work/bio-c17-notes/"]')).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('life-course.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: /17\.2 questions/ }).click();
  await expect(
    page.getByRole('heading', { name: '17.2 questions', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.life-question')).toHaveCount(5);
  await expect(
    page.locator('.life-assignment input, .life-assignment textarea'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Easy|Okay|Hard|Help me start/ }),
  ).toHaveCount(0);
  await page.locator('#q-17-2-4 summary').click();
  await expect(page.locator('#q-17-2-4')).toHaveAttribute('open', '');
  await expect(page.locator('#q-17-2-4 .life-answer-needs')).toContainText(
    'Evidence for bacterial ancestry',
  );
  await expect(page.locator('#q-17-2-4 svg[role=img]')).toHaveAttribute(
    'aria-label',
    /bacterium/,
  );
  await page.screenshot({
    path: testInfo.outputPath('life-question.png'),
    fullPage: true,
  });
  await page
    .locator('#q-17-2-4')
    .getByRole('link', { name: /Main idea.*Endosymbiosis/ })
    .click();
  await expect(page).toHaveURL(/key-ideas\/#endosymbiosis$/);
  await expect(page.locator('#endosymbiosis')).toHaveAttribute('open', '');
  await expect(page.locator('#endosymbiosis')).toContainText('binary fission');
  await page.screenshot({
    path: testInfo.outputPath('life-ideas.png'),
    fullPage: true,
  });
  await page.locator('#endosymbiosis .life-backlinks a').click();
  await expect(page).toHaveURL(/bio-c17-2\/#q-17-2-4$/);
  await expect(page.locator('#q-17-2-4')).toHaveAttribute('open', '');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('legacy question links resolve and factual video work stays compact', async ({
  page,
}) => {
  await open(page, 'work/bio-c17-sections/?focus=1#q-17-2-4');
  await expect(page).toHaveURL(/bio-c17-2\/#q-17-2-4$/);
  await expect(page.locator('#q-17-2-4')).toHaveAttribute('open', '');
  await page.locator('#q-17-2-2 summary').click();
  await expect(page.locator('#q-17-2-2')).toHaveAttribute('open', '');
  await expect(page.locator('#q-17-2-4')).not.toHaveAttribute('open', '');
  await open(page, 'work/bio-c17-notes/?focus=1#reading-2');
  await expect(page.locator('.life-notes-link')).toBeVisible();
  await expect(page.locator('.scene-layers, .focus-reading')).toHaveCount(0);
  await open(page, 'work/c17-research/');
  await expect(
    page.getByRole('heading', { name: 'NOVA video questions', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.life-video-question')).toHaveCount(15);
  await expect(page.locator('.life-video-links')).toContainText(
    'A checked filled version is not available yet',
  );
  await expect(
    page.locator(
      '.life-assignment textarea, .life-assignment input, .walkthrough',
    ),
  ).toHaveCount(0);
});
test('unreviewed source work is labeled and definitions practice is separate', async ({
  page,
}) => {
  await open(page, 'courses/life-sciences/assignments/bio-c17-assessment/');
  await expect(page.locator('.life-reference')).toContainText(
    'not a confirmed assignment',
  );
  await expect(page.locator('.life-question')).toHaveCount(0);
  await page.getByRole('link', { name: 'Review', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Definitions review', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.life-review-definition')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Show definition', exact: true })
    .click();
  await expect(page.locator('.life-review-definition')).toContainText(
    'nonliving, cell-like compartments',
  );
  await page.getByRole('button', { name: 'Next term', exact: true }).click();
  await expect(page.locator('.life-review-definition')).toHaveCount(0);
});
