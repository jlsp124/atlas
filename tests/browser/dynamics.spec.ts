import { test, expect } from '@playwright/test';

test('Dynamics is discoverable as a new unit with one 33-question assignment and reference notes', async ({
  page,
}) => {
  await page.goto('/atlas/courses/physics/');
  await page.getByRole('link', { name: /Dynamics.*Forces in 1D/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Dynamics',
  );
  await expect(page.locator('.physics-material-section')).toHaveCount(2);
  await page.getByRole('link', { name: /Questions 1–33/ }).click();
  await expect(page.locator('.document-question')).toHaveCount(33);
  await expect(page.locator('.assignment-document')).toContainText(
    'Questions 12–15 and 22–27 are not captured',
  );
  await page.goto('/atlas/work/physics-dynamics-notes/');
  await expect(page.locator('.physics-notes')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /mark|complete|walk through/i }),
  ).toHaveCount(0);
});

test('force working extracts values and explains gravity before isolating rope acceleration', async ({
  page,
}, info) => {
  await page.goto('/atlas/work/physics-forces-1-33/#q-33');
  await expect(page.locator('.walkthrough')).toBeVisible();
  const next = page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true });
  let safety = 30;
  while (
    !(await page
      .locator('.relationship-line')
      .filter({ hasText: 'Isolate acceleration visually' })
      .count())
  ) {
    if (!safety--) throw Error('Relationship was not reached');
    await next.click();
  }
  await expect(page.locator('.dynamics-working')).toContainText('Tmax/m − g');
  await expect(page.locator('.known-values')).toContainText('450');
  await expect(page.locator('[data-origin="source-Tmax"]')).toHaveAttribute(
    'data-on',
    'true',
  );
  await expect(page.locator('.force-diagram svg')).toHaveAttribute(
    'aria-label',
    /T up; mg down/,
  );
  await expect(page.locator('.force-diagram svg')).not.toBeVisible();
  const width = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport + 1);
  if (info.project.name === 'phone') {
    await expect(next).toBeVisible();
    await next.click();
    await expect(page.locator('.dynamics-working')).toContainText(
      '0.91 m/s² upward',
    );
  }
  const activeEquation = await page
    .locator('.relationship-line[data-current=true] .live-equation')
    .boundingBox();
  const footer = await page.locator('.walkthrough-footer').boundingBox();
  expect(activeEquation!.y + activeEquation!.height).toBeLessThanOrEqual(
    footer!.y + 1,
  );
  await page.screenshot({
    path: info.outputPath('dynamics-working.png'),
    fullPage: true,
  });
});

test('class diagram responses use dots and keep force sketches optional', async ({
  page,
}) => {
  await page.goto('/atlas/work/physics-forces-1-33/#q-3');
  const next = page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true });
  for (let i = 0; i < 4; i++) await next.click();
  await expect(page.locator('.dot-diagram svg')).toHaveAttribute(
    'aria-label',
    /Moving up: decreasing spacing/,
  );
  await expect(page.locator('.force-diagram svg')).not.toBeVisible();
  await page.getByText('Optional force sketch', { exact: true }).click();
  await expect(page.locator('.force-diagram svg')).toBeVisible();
});

test('missing textbook questions retain their places and do not acquire fabricated working', async ({
  page,
}) => {
  await page.goto('/atlas/work/physics-forces-1-33/#q-12');
  await expect(page.locator('.walkthrough')).toContainText(
    'not present in the supplied photographs',
  );
  await expect(page.locator('.known-value')).toHaveCount(0);
  await page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await expect(page.locator('.walkthrough')).toContainText(
    'clear capture of question 12',
  );
});
