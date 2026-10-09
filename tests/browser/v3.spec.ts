import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes } from 'node:crypto';
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
}
async function next(page: Page, count = 1) {
  for (let i = 0; i < count; i++)
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
}
test('Physics opens a sparse unit list and old view links reach the same material sections', async ({
  page,
}) => {
  await open(page, 'courses/physics/');
  await expect(page.locator('.current-work-band')).toHaveCount(0);
  await expect(page.locator('.unit-row')).toHaveCount(2);
  await open(page, 'courses/physics/units/kinematics/?view=learn');
  await expect(page).toHaveURL(/\/kinematics\/$/);
  await expect(page.locator('.physics-unit')).toBeVisible();
  await expect(page.locator('[data-material=kinematics-review]')).toBeVisible();
  for (const name of ['Assignments', 'Notes', 'Labs'])
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: /^(All materials|To do|Learn|Classwork)$/,
    }),
  ).toHaveCount(0);
  await open(page, 'courses/physics/learn/');
  await expect(page).toHaveURL(/\/units\/kinematics\/$/);
});
test('Physics overview and both old and current focus deep links preserve the actual question', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  await expect(page.locator('.document-question')).toHaveCount(37);
  await expect(
    page.getByRole('combobox', { name: 'Assignment status' }),
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Walk through question 10', exact: true })
    .click();
  await expect(page).toHaveURL(/#q-10$/);
  await expect(page.locator('.walkthrough')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Whole assignment', exact: true })
    .click();
  await open(page, 'work/kinematics-review/?focus=1#q-q-10');
  await expect(page.locator('.walkthrough')).toHaveAttribute(
    'data-question',
    'q-10',
  );
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveCount(0);
});
test('dropped highlighting selects the word and keeps signed gravity in the substitution', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?focus=1#q-10');
  const guide = page.locator('.walkthrough');
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.locator('mark[data-active=true]')).toHaveText('dropped');
  await expect(guide.locator('.narration-copy')).toContainText(
    'initial velocity is 0',
  );
  let safety = 20;
  while (
    !(await guide.locator('.narration-copy h3').innerText()).includes(
      'Put each value',
    )
  ) {
    if (!safety--) throw Error('No substitution');
    await guide.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(guide.locator('.live-equation')).toHaveText(
    'vf = 0 + (−9.8) × 2.0',
  );
  await expect(guide.locator('.live-equation')).toHaveAttribute(
    'aria-label',
    /−9.8/,
  );
  await page.reload();
  await expect(guide.locator('.live-equation')).toHaveText(
    'vf = 0 + (−9.8) × 2.0',
  );
});
test('average-velocity algebra and substitutions preserve operators and parentheses', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?focus=1#q-1');
  const guide = page.locator('.walkthrough');
  let safety = 20;
  while (
    !(await guide.locator('.narration-copy h3').innerText()).includes(
      'Put each value',
    )
  ) {
    if (!safety--) throw Error('No substitution');
    await guide.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(guide.locator('.live-equation')).toHaveText(
    'Δd = ((24 + 18) / 2) × 3.00',
  );
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide.locator('.live-equation')).toHaveText(
    'Δd = ((vi + vf) / 2) × Δt',
  );
});
test('focused Physics working and navigation fit short desktop and phone viewports', async ({
  browser,
}) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    const context = await browser.newContext({
      baseURL: 'http://localhost:4321',
      viewport,
      isMobile: viewport.width < 400,
      hasTouch: viewport.width < 400,
    });
    const page = await context.newPage();
    await open(page, 'work/kinematics-review/?focus=1#q-11');
    let safety = 20;
    while (
      await page
        .locator('.walkthrough')
        .getByRole('button', { name: 'Next', exact: true })
        .count()
    ) {
      if (!safety--) throw Error('No finish');
      await page
        .locator('.walkthrough')
        .getByRole('button', { name: 'Next', exact: true })
        .click();
    }
    await expect(page.locator('.calculated-result')).toContainText('2.4 s');
    await expect(
      page.getByRole('button', { name: 'Done on paper', exact: true }),
    ).toHaveCount(0);
    const bounds = await page.locator('.walkthrough-footer').boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
      viewport.height - (viewport.width < 400 ? 68 : 0),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(page.locator('.transforming-question')).toBeVisible();
    await context.close();
  }
});
test('Life Sciences links to teacher notes and preserves a paper-only question deep link', async ({
  page,
}) => {
  await open(page, 'courses/life-sciences/units/origins/');
  await expect(page.locator('.life-notes-link')).toHaveAttribute(
    'href',
    'https://sites.google.com/view/ecl-life-sciences-11/notes',
  );
  await open(page, 'work/bio-c17-notes/?focus=1#reading-2');
  await expect(page.locator('.life-notes-link')).toBeVisible();
  await open(page, 'work/bio-c17-sections/?focus=1#q-17-2-4');
  await expect(page).toHaveURL(/bio-c17-2\/#q-17-2-4$/);
  await expect(page.locator('#q-17-2-4')).toHaveAttribute('open', '');
  await expect(page.locator('#q-17-2-4 .life-question-body')).toContainText(
    'lasting partnership',
  );
  await expect(
    page.locator('.life-assignment textarea, .life-assignment input'),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#q-17-2-4')).toHaveAttribute('open', '');
});
test('Hebden unit cancellation and Lewis/VSEPR build progressively while formal hand-ins stay restricted', async ({
  page,
}) => {
  await open(page, 'work/chemistry-hebden-conversions/?focus=1#q-16c');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 2);
  await expect(page.locator('.cancelled-unit').first()).toHaveText('cm');
  await expect(page.locator('.remaining-unit').last()).toContainText('mm');
  await page.getByLabel('Your answer', { exact: true }).fill('158');
  await page.getByLabel('Unit', { exact: true }).fill('mm');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.question-feedback')).toContainText(
    'That matches',
  );
  await open(page, 'work/chemistry-hebden-lewis/?focus=1#q-86');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 3);
  await expect(page.locator('.scene-lewis')).toContainText(
    '0 electrons remain',
  );
  await expect(page.locator('.guide-caption')).toContainText(
    'bent molecular shape',
  );
  await open(page, 'work/electronic-structure/?focus=1#reading-0');
  await expect(page.locator('.restricted-work')).toBeVisible();
  await expect(page.locator('.story-stage')).toHaveCount(0);
});
test('reduced motion keeps the same signed formula and narrow Physics stages remain accessible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await open(page, 'work/kinematics-review/?step=0#q-11');
    let safety = 20;
    while (
      await page
        .locator('.walkthrough')
        .getByRole('button', { name: 'Next', exact: true })
        .count()
    ) {
      if (!safety--) throw Error('No finish');
      await page
        .locator('.walkthrough')
        .getByRole('button', { name: 'Next', exact: true })
        .click();
    }
    await expect(page.locator('.live-equation')).toContainText('−28');
    expect(
      await page
        .locator('.walkthrough')
        .evaluate((el) => el.getAnimations({ subtree: true }).length),
    ).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
test('Physics walkthrough position and list completion sync between independent devices', async ({
  page,
  browser,
}) => {
  const username = 'v3_' + randomBytes(4).toString('hex'),
    password = randomBytes(20).toString('base64url');
  await open(page, 'account/?create=1');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('heading', { name: `Hi, ${username}.` }),
  ).toBeVisible();
  await open(page, 'work/kinematics-review/?step=0#q-10');
  for (let i = 0; i < 3; i++)
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .click();
  await open(page, 'courses/physics/units/kinematics/');
  await page
    .locator('[data-material=kinematics-review]')
    .getByRole('button', { name: /^Mark complete:/ })
    .click();
  await open(page, 'account/');
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  const context = await browser.newContext(),
    peer = await context.newPage();
  await peer.goto('http://localhost:4321/atlas/account/');
  await peer.getByLabel('Username', { exact: true }).fill(username);
  await peer.getByLabel('Password', { exact: true }).fill(password);
  await peer
    .locator('form')
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await expect(
    peer.getByRole('heading', { name: `Hi, ${username}.` }),
  ).toBeVisible();
  await open(peer, 'courses/physics/units/kinematics/');
  await expect(
    peer.locator('[data-material=kinematics-review] button'),
  ).toHaveAttribute('aria-pressed', 'true');
  await open(peer, 'work/kinematics-review/');
  await peer
    .getByRole('button', { name: 'Continue question 10', exact: true })
    .click();
  await expect(peer.locator('.walkthrough')).toHaveAttribute('data-step', '3');
  await expect(peer.getByLabel('Your answer', { exact: true })).toHaveCount(0);
  await page.route('http://localhost:8790/**', (route) => route.abort());
  await open(page, 'work/kinematics-review/');
  await page
    .getByRole('button', { name: 'Continue question 10', exact: true })
    .click();
  await page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await open(page, 'account/');
  await expect(page.locator('.sync-status')).toContainText('waiting to sync');
  await page.unroute('http://localhost:8790/**');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  await open(peer, 'work/kinematics-review/');
  await peer
    .getByRole('button', { name: 'Continue question 10', exact: true })
    .click();
  await expect(peer.locator('.walkthrough')).toHaveAttribute('data-step', '4');
  await context.close();
});
test('offline Physics keeps the walkthrough position after refresh', async ({
  page,
}) => {
  await page.goto(
    'http://localhost:4322/atlas/work/kinematics-review/?step=0#q-10',
  );
  await expect(page.locator('.walkthrough')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator('.walkthrough')).toHaveAttribute('data-step', '0');
  for (let i = 0; i < 2; i++)
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .click();
  await page.reload();
  await expect(page.locator('.walkthrough')).toHaveAttribute('data-step', '2');
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveCount(0);
  await page.context().setOffline(false);
});
