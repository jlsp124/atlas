import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes } from 'node:crypto';
async function open(page: Page, path: string) {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
}
async function next(page: Page, count = 1) {
  for (let i = 0; i < count; i++)
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
}
test('units lead with real school materials and old view links resolve to the same list', async ({
  page,
}) => {
  await open(page, 'courses/physics/');
  await expect(page.locator('.current-work-band')).toContainText(
    'Kinematics Review',
  );
  await open(page, 'courses/physics/units/kinematics/?view=learn');
  await expect(page).toHaveURL(/\/kinematics\/$/);
  await expect(
    page.getByRole('heading', { name: 'Current work', exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-material=kinematics-review]')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^(Learn|Classwork)$/ }),
  ).toHaveCount(0);
  await open(page, 'courses/physics/learn/');
  await expect(page).toHaveURL(/\/units\/kinematics\/$/);
});
test('overview, focus, completion and question deep links preserve student control', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  await expect(page.locator('.v3-assignment')).toHaveAttribute(
    'data-mode',
    'overview',
  );
  await expect(page.locator('.companion-question')).toHaveCount(0);
  await expect(page.locator('.checkpoint-row')).toHaveCount(37);
  await page
    .getByRole('button', { name: 'Mark assignment complete', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('.material-completion strong')).toHaveText(
    'Complete',
  );
  await page
    .getByRole('button', { name: 'Mark incomplete', exact: true })
    .click();
  await page
    .locator('.checkpoint-row')
    .filter({ hasText: 'A ball is dropped.' })
    .click();
  await expect(page).toHaveURL(/#q-10$/);
  await expect(page.locator('.companion-question')).toHaveCount(1);
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.checkpoint-row')).toHaveCount(37);
});
test('clue, known data and formula substitution keep the same question and equation tokens', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?focus=1#q-10');
  await expect(page.locator('.story-workspace')).toHaveCount(0);
  await page.getByLabel('Your answer', { exact: true }).fill('-19.6');
  await page.getByLabel('Unit', { exact: true }).fill('m/s');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await expect(page.locator('.question-token.is-highlighted')).toHaveText(
    'dropped',
  );
  await next(page);
  await expect(page.locator('[data-motion=known-vi]')).toContainText('0');
  await page
    .getByRole('button', { name: 'Explain dropped', exact: true })
    .click();
  const sheet = page.getByRole('dialog', {
    name: 'A quick connection',
    exact: true,
  });
  await expect(sheet).toContainText('released from rest');
  await sheet
    .getByRole('button', { name: 'Back to question 10', exact: true })
    .click();
  await expect(page.locator('.story-stage')).toHaveAttribute(
    'data-guide-step',
    '1',
  );
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(
    '-19.6',
  );
  await next(page, 4);
  await expect(page.locator('.equation-stage')).toHaveAttribute(
    'data-formula-frame',
    '0',
  );
  await page.locator('[data-token=vi]').evaluate((el) => {
    (el as HTMLElement).dataset.identity = 'same-node';
  });
  await next(page);
  await expect(page.locator('[data-token=vi]')).toHaveAttribute(
    'data-identity',
    'same-node',
  );
  await expect(page.locator('[data-token=vi]')).toHaveText('0');
  await expect(page.locator('[data-token=a]')).toHaveText('9.8');
  await expect(page.locator('[data-token=t]')).toHaveText('2.0');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.question-feedback')).toContainText('direction');
  await page.getByLabel('Direction in words', { exact: true }).fill('downward');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.locator('.question-feedback')).toContainText(
    'That matches',
  );
  await page.getByRole('button', { name: 'Okay', exact: true }).click();
  await open(page, 'courses/physics/');
  await page
    .locator('.current-work-footer')
    .getByRole('link', { name: 'Continue', exact: true })
    .click();
  await expect(page.locator('.companion-question')).toHaveAttribute(
    'data-question',
    'q-10',
  );
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(
    '-19.6',
  );
  await expect(page.locator('.story-stage')).toHaveAttribute(
    'data-guide-step',
    '6',
  );
  await expect(
    page.getByRole('button', { name: 'Okay', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
test('algebra moves a stable denominator token into the numerator and back', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/?focus=1#q-4');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 5);
  await expect(page.locator('.equation-stage')).toHaveAttribute(
    'data-formula-frame',
    '0',
  );
  const before = await page.locator('[data-token=two]').evaluate((el) => ({
    top: (el as HTMLElement).style.top,
    left: (el as HTMLElement).style.left,
  }));
  await next(page);
  await expect(page.locator('.equation-stage')).toHaveAttribute(
    'data-formula-frame',
    '1',
  );
  const after = await page.locator('[data-token=two]').evaluate((el) => ({
    top: (el as HTMLElement).style.top,
    left: (el as HTMLElement).style.left,
  }));
  expect(after.top).not.toBe(before.top);
  await page.getByRole('button', { name: 'Back step', exact: true }).click();
  await expect(page.locator('.equation-stage')).toHaveAttribute(
    'data-formula-frame',
    '0',
  );
  expect(
    await page
      .locator('[data-token=two]')
      .evaluate((el) => (el as HTMLElement).style.top),
  ).toBe(before.top);
});

test('the student turn keeps the setup and brings the answer into a short laptop or phone viewport', async ({
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
    await page
      .getByRole('button', { name: 'Help me start', exact: true })
      .click();
    await next(page, 8);
    await expect(page.locator('.story-stage')).toHaveAttribute(
      'data-guide-action',
      'student',
    );
    await page.locator('.story-stage').evaluate(async (el) => {
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      );
    });
    await expect(page.locator('.persistent-question')).toBeVisible();
    await expect(page.locator('.equation-stage')).toHaveAttribute(
      'data-formula-frame',
      '2',
    );
    await expect(page.locator('.formula-options')).not.toBeVisible();
    await expect(async () => {
      const question = await page.locator('.persistent-question').boundingBox();
      const answer = await page
        .getByLabel('Your answer', { exact: true })
        .boundingBox();
      const navigation = await page.locator('.focus-navigation').boundingBox();
      expect(question!.y).toBeGreaterThan(0);
      const bottomInset = viewport.width < 400 ? 64 : 16;
      expect(answer!.y + answer!.height).toBeLessThan(
        viewport.height - bottomInset,
      );
      expect(navigation!.y).toBeGreaterThan(answer!.y + answer!.height);
    }).toPass();
    await page.getByRole('button', { name: 'Back step', exact: true }).click();
    await expect(page.locator('.formula-options')).toBeVisible();
    await context.close();
  }
});
test('C17 notes correlate fossil layers and a real written question builds endosymbiosis evidence', async ({
  page,
}) => {
  await open(page, 'courses/life-sciences/units/origins/');
  await expect(page.locator('.v3-unit-context')).toContainText('endosymbiosis');
  await open(page, 'work/bio-c17-notes/?focus=1#reading-2');
  await page.getByRole('button', { name: 'Explain this', exact: true }).click();
  await next(page, 2);
  await expect(page.locator('.matched-layer')).toHaveCount(2);
  await expect(page.locator('.guide-caption')).toContainText('relative order');
  await open(page, 'work/bio-c17-sections/?focus=1#q-17-2-4');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 2);
  await expect(page.locator('.scene-cell')).toContainText('DNA');
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill(
      'Bacterial-like DNA and ribosomes support an origin from bacteria retained within a larger cell.',
    );
  await page
    .getByRole('button', { name: 'Self-check response', exact: true })
    .click();
  await expect(page.locator('.self-check-stage')).toContainText(
    'binary fission',
  );
  await page
    .getByRole('button', { name: 'I’ve checked my response', exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByLabel('Your explanation', { exact: true }),
  ).toHaveValue(/Bacterial-like/);
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
test('reduced motion gives identical formula states and narrow stages never overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await open(page, 'work/kinematics-review/?focus=1#q-11');
    if (
      await page
        .getByRole('button', { name: 'Help me start', exact: true })
        .count()
    )
      await page
        .getByRole('button', { name: 'Help me start', exact: true })
        .click();
    await next(page, width === 360 ? 7 : 0);
    await expect(page.locator('.story-stage')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );
    await expect(page.locator('.equation-stage')).toHaveAttribute(
      'data-formula-frame',
      '2',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('.story-stage')
        .evaluate((el) => el.getAnimations({ subtree: true }).length),
    ).toBe(0);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
test('account drafts, guide position and material completion sync between independent devices', async ({
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
  await open(page, 'work/kinematics-review/?focus=1#q-10');
  await page.getByLabel('Your answer', { exact: true }).fill('-19.6');
  await page.getByLabel('Unit', { exact: true }).fill('m/s');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 3);
  await page
    .getByRole('button', { name: 'Mark assignment complete', exact: true })
    .click();
  await open(page, 'account/');
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  const context = await browser.newContext(),
    peer = await context.newPage();
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
  await peer.goto(
    'http://localhost:4321/atlas/work/kinematics-review/?focus=1#q-10',
  );
  await expect(peer.getByLabel('Your answer', { exact: true })).toHaveValue(
    '-19.6',
  );
  await expect(peer.locator('.story-stage')).toHaveAttribute(
    'data-guide-step',
    '3',
  );
  await expect(peer.locator('.material-completion strong')).toHaveText(
    'Complete',
  );
  await page.route('http://localhost:8787/**', (route) => route.abort());
  await open(page, 'work/kinematics-review/?focus=1#q-10');
  await page.getByLabel('Direction in words', { exact: true }).fill('downward');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await open(page, 'account/');
  await expect(page.locator('.sync-status')).toContainText('waiting to sync');
  await page.unroute('http://localhost:8787/**');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  await peer.reload();
  await expect(
    peer.getByLabel('Direction in words', { exact: true }),
  ).toHaveValue('downward');
  await expect(peer.locator('.story-stage')).toHaveAttribute(
    'data-guide-step',
    '4',
  );
  await context.close();
});
test('offline V3 focus keeps a typed answer and reasoning position after refresh', async ({
  page,
}) => {
  await page.goto(
    'http://localhost:4322/atlas/work/kinematics-review/?focus=1#q-10',
  );
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
  await page.getByLabel('Your answer', { exact: true }).fill('19.6');
  await page
    .getByRole('button', { name: 'Help me start', exact: true })
    .click();
  await next(page, 2);
  await page.reload();
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(
    '19.6',
  );
  await expect(page.locator('.story-stage')).toHaveAttribute(
    'data-guide-step',
    '2',
  );
  await page.context().setOffline(false);
});
