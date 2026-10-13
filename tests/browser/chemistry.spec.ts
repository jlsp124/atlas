import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function open(page: Page, path: string) {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('main astro-island[ssr]')).toHaveCount(0);
}
test('Chemistry separates assignments, notes and actual SMG labs with source ranges', async ({
  page,
}) => {
  await open(page, 'courses/chemistry/');
  const nav = page.getByRole('navigation', { name: 'Chemistry sections' });
  await expect(nav.getByRole('link')).toHaveText([
    'Assignments',
    'Notes',
    'Labs',
  ]);
  await expect(
    page.locator('[data-material="chemistry-hebden-matter"]'),
  ).toContainText('Hebden · Matter');
  await expect(
    page.getByRole('button', { name: /todo|learn|mark as read/i }),
  ).toHaveCount(0);
  await nav.getByRole('link', { name: 'Labs', exact: true }).click();
  await expect(page.locator('.chem-material-row')).toHaveCount(3);
  await expect(page.locator('.chem-material-list')).toContainText(
    'Heating and Cooling Curves',
  );
  await page.locator('[data-material="chemistry-lab-2a"]').click();
  await expect(
    page.getByRole('navigation', { name: 'Lab stages' }).getByRole('link'),
  ).toHaveText(['Before', 'During', 'After']);
  await expect(page.locator('#before')).toContainText('50 mL');
  await expect(page.locator('#before')).toContainText('7.5 cm');
  await expect(page.locator('#before')).toContainText(
    'does not prove chlorine',
  );
  await page
    .getByRole('navigation', { name: 'Lab stages' })
    .getByRole('link', { name: 'After', exact: true })
    .click();
  await page.locator('#q-analysis-1 summary').click();
  await expect(page.locator('#q-analysis-1')).toContainText('phenolphthalein');
  await expect(page.locator('#q-analysis-1 .lab-data-needed')).toContainText(
    'your own colour',
  );
  await open(page, 'work/chemistry-lab-2c/');
  await expect(page.locator('#before')).toContainText(
    'No specific precipitate',
  );
  await page.locator('#q-analysis-1 summary').click();
  await expect(page.locator('#q-analysis-1 .lab-data-needed')).toContainText(
    'six actual pair observations',
  );
  await expect(page.locator('.chem-lab input, .chem-lab textarea')).toHaveCount(
    0,
  );
});
test('assigned questions stay separate from captured references and unusual Lewis help is contextual', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-bonding/');
  await expect(page.locator('#q-79a')).toBeVisible();
  await expect(page.locator('#q-82')).toBeVisible();
  await expect(page.locator('#q-80')).toHaveCount(0);
  await open(page, 'courses/chemistry/units/bonding/?view=notes');
  await page
    .getByRole('link', { name: /Other captured Hebden questions/ })
    .click();
  await expect(page.locator('.chem-question')).toHaveCount(3);
  await expect(page.locator('#q-79a')).toHaveCount(0);
  await open(page, 'work/chemistry-hebden-lewis/#q-86q');
  const diagram = page.locator('#q-86q .chem-lewis');
  await expect(diagram).toContainText('10 total');
  await diagram.getByRole('button', { name: 'Next', exact: true }).click();
  await diagram.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(diagram.locator('line')).toHaveCount(3);
  await expect(diagram).toContainText('6 in bonds');
  await expect(diagram).toContainText('4 in lone pairs');
  await open(page, 'work/chemistry-hebden-lewis/#q-86aa');
  await expect(page.locator('#q-86aa')).toContainText('23 electrons');
  await page.locator('#q-86aa .chem-prompt summary').click();
  await expect(page.locator('#q-86aa textarea')).toHaveValue(
    /23 valence electrons/,
  );
  await expect(page.locator('#q-86aa .chem-lewis')).toHaveCount(0);
  await open(page, 'work/chemistry-hebden-matter/#q-34');
  await expect(page.locator('#q-34')).toContainText(
    'Dissolved ingredients do not each create a new phase',
  );
});
test('lab curve plots use only entered readings, preserve independent process times and reject invalid data', async ({
  page,
}) => {
  await open(page, 'work/chemistry-lab-2b/');
  await expect(page.getByLabel('Heating readings')).toHaveValue('');
  await expect(page.locator('.lab-curves svg')).toHaveCount(0);
  await page.getByLabel('Heating readings').fill('0 28\n0.5 32\n1 37');
  await page.getByLabel('Cooling readings').fill('0 51\n0.5 47\n1 43');
  await expect(page.locator('.lab-curve-heating circle')).toHaveCount(3);
  await expect(page.locator('.lab-curve-cooling rect')).toHaveCount(3);
  await expect(page.locator('#before')).toContainText('not your measured');
  await page.getByLabel('Heating readings').fill('0 30\n0 34');
  await expect(page.getByRole('alert')).toContainText('Times must increase');
  await expect(page.locator('.lab-curve-heating circle')).toHaveCount(0);
});
test('recovered ions remove the outer shell first and valence questions use the actual source convention', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-electrons/#q-28i');
  const ion = page.locator('#q-28i .chem-ion');
  await expect(ion).toContainText('23 electrons');
  await ion.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(ion).toContainText('First remove the two 4s electrons');
  await ion.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(ion.locator('.chem-ion-result')).toContainText('[Ar] 3d⁵');
  await expect(ion.locator('.chem-ion-result')).toContainText(
    '18 in the core + 5 outside = 23',
  );
  await open(page, 'work/chemistry-hebden-electrons/#q-29c');
  await expect(page.locator('#q-29c')).toContainText('three d electrons');
  await open(page, 'work/chemistry-hebden-electrons/#q-29h');
  await expect(page.locator('#q-29h')).toContainText(
    'confirm whether the teacher expects',
  );
  await expect(
    page.locator('.chem-assignment input, .chem-assignment textarea'),
  ).toHaveCount(0);
});
test('private Chemistry notes keep tables, diagrams and source gaps without progress controls', async ({
  page,
}) => {
  await open(page, 'work/chemistry-matter-notes/');
  await expect(page.locator('.class-note-copy')).toHaveCount(0);
  await open(page, 'account/');
  await page.getByLabel('Username', { exact: true }).fill('Jovan');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.ATLAS_TEST_ADMIN_PASSWORD!);
  await page
    .locator('form')
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await expect(page.locator('.account-screen')).toContainText('Jovan');
  await open(page, 'work/chemistry-matter-notes/');
  await expect(page.locator('.class-note-copy')).toContainText(
    'Owner-only Chemistry fixture.',
  );
  await expect(page.locator('.class-note-copy table')).toContainText(
    '7 fixture units',
  );
  await expect(page.locator('.class-reference-sketch svg')).toHaveAttribute(
    'aria-label',
    'Test-only atom connections',
  );
  await expect(
    page.locator('.chem-notes input, .chem-notes textarea, .chem-notes button'),
  ).toHaveCount(0);
  await expect(page.locator('.source-gaps')).toContainText('blank remains');
  await open(page, 'work/chemistry-lab-2a/');
  await page.locator('.lab-observed-copy summary').click();
  await expect(page.locator('.lab-observed-copy')).toContainText(
    'Actual recorded observations',
  );
});
test('Chemistry layouts and diagrams reflow and remain accessible in both themes', async ({
  page,
}, info) => {
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(
      (theme) => localStorage.setItem('atlas:theme', theme),
      theme,
    );
    for (const path of [
      'courses/chemistry/?view=labs',
      'work/chemistry-hebden-lewis/#q-86z',
      'work/chemistry-hebden-electrons/#q-28i',
      'work/chemistry-lab-2b/',
    ]) {
      await open(page, path);
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
    }
  }
  await open(page, 'courses/chemistry/?view=labs');
  await page.screenshot({
    path: info.outputPath('chemistry-labs.png'),
    fullPage: true,
  });
});
