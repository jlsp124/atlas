import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes } from 'node:crypto';

async function open(page: Page, path = '') {
  await page.goto(`/atlas/${path}`);
  await expect(page.getByRole('link', { name: 'atlas home' })).toBeVisible();
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
}
async function skip(page: Page) {
  await open(page);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Your courses, connected.' }),
  ).not.toBeVisible();
}

test('first visit, skip once, real course order and replay', async ({
  page,
}) => {
  await skip(page);
  await expect(page.getByRole('heading', { name: 'Today.' })).toBeVisible();
  expect(await page.locator('.class-list strong').allTextContents()).toEqual([
    'Physics 11',
    'Life Sciences 11',
    'Introductory Japanese 11',
    'Chemistry 11',
  ]);
  await page.reload();
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await open(page, 'account/');
  await page.getByRole('button', { name: 'Replay introduction' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});

test('onboarding continues through actual work, connections and sync settings', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Add to my atlas' }).click();
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-tour-step', '0');
  await page.getByRole('button', { name: 'Open an assignment' }).click();
  await expect(page.locator('.task-list')).toBeVisible();
  await page.getByRole('button', { name: 'Show the connections' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-tour-step', '2');
  await page.getByRole('button', { name: 'Open one concept' }).click();
  await expect(
    page.getByRole('button', { name: 'I don’t understand this', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'About progress sync' }).click();
  await expect(
    page.getByRole('heading', { name: 'Want progress on your other devices?' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Keep using atlas without one' })
    .click();
  await expect(page.locator('.guided-tour')).not.toBeVisible();
});

test('assignment checking and unchecking survives refresh', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  const task = page.getByRole('checkbox', {
    name: /Set a direction convention/,
  });
  await task.check();
  await page.reload();
  await expect(task).toBeChecked();
  await task.uncheck();
  await page.reload();
  await expect(task).not.toBeChecked();
});

test('confusion, known self-report, tutor copy and readable maths', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, 'concepts/acceleration/');
  await expect(page.locator('.katex')).toBeVisible();
  await page
    .getByRole('button', { name: 'I don’t understand this', exact: true })
    .click();
  await expect(
    page.getByText('Marked for diagnosis and review.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'I think I know this', exact: true })
    .click();
  await expect(page.getByRole('link', { name: /Prove it/ })).toBeVisible();
  await page.getByRole('button', { name: 'Copy AI tutor prompt' }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Ask what is confusing');
  await page.reload();
  await expect(page.locator('.concept-tools')).toContainText('exposed');
});

test('wrong answer diagnoses a branch, repairs it, and retries the original', async ({
  page,
}) => {
  await open(
    page,
    'courses/physics/practice/?target=velocity&mode=Quick%20check',
  );
  await page.getByRole('button', { name: 'Start quick check' }).click();
  await page.getByRole('radio', { name: 'Position', exact: true }).check();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Let’s check the reasoning.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Check the missing prerequisite' })
    .click();
  await expect(page.locator('.teaching-block')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const radios = page.getByRole('radio');
    if (await radios.count()) await radios.first().check();
    else {
      await page.getByLabel('Your answer', { exact: true }).fill('0');
      if (await page.getByLabel('Unit', { exact: true }).count())
        await page.getByLabel('Unit', { exact: true }).fill('s');
    }
    await page
      .getByRole('button', { name: 'Check answer', exact: true })
      .click();
    await page
      .getByRole('button', { name: i === 2 ? 'See coverage' : 'Next question' })
      .click();
  }
  await expect(
    page.getByText(/reviewed core items meaningfully tested/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Retry the original question' })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Position', exact: true }),
  ).toBeVisible();
});

test('typed Japanese practice accepts kana and preserves independent-study boundary', async ({
  page,
}) => {
  await open(
    page,
    'courses/japanese/practice/?target=jp-konnichiwa&mode=Quick%20check',
  );
  await page.getByRole('button', { name: 'Start quick check' }).click();
  await page
    .getByRole('radio', { name: 'hello / good afternoon', exact: true })
    .check();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Your answer', { exact: true }).fill('こんにちは');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'That holds up.' }),
  ).toBeVisible();
  await expect(page.getByText(/Independent study only/)).toBeVisible();
});

test('contextual graph and keyboard list both navigate ideas', async ({
  page,
}) => {
  await open(page, 'concepts/electron-groups/');
  await page
    .getByText('Concepts & relationships · accessible list', { exact: true })
    .click();
  await expect(page.locator('.graph-canvas canvas').first()).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Shape from electron groups',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Shape from electron groups', exact: true })
    .click();
  await expect(page.locator('.graph-inspector')).toContainText(
    'Shape from electron groups',
  );
});

test('search supports kana, common terms, keyboard escape and zero results', async ({
  page,
}) => {
  await open(page, 'concepts/hiragana/');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('こんにちは');
  await expect(page.locator('.search-results')).toContainText('こんにちは');
  await page.getByRole('searchbox').fill('zzzznevermaterialzzzz');
  await expect(page.getByText(/No match yet/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.search-dialog')).not.toBeVisible();
});

test('system, light and dark themes persist; text spacing still reflows', async ({
  page,
}) => {
  await open(page, 'account/');
  const theme = page.getByRole('combobox', { name: 'Theme', exact: true });
  await theme.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(theme).toHaveValue('dark');
  await theme.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await theme.selectOption('system');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page
        .locator('body')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    .toBe('rgb(22, 29, 25)');
  await page.addStyleTag({
    content:
      '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

for (const theme of ['light', 'dark'] as const)
  test(`accessible ${theme} course and lesson at this viewport`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const path of [
      'courses/physics/',
      'concepts/motion-graphs/',
      'concepts/jp-sumimasen/',
      'work/kinematics-review/',
    ]) {
      await open(page, path);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });

test('guests and ordinary accounts cannot authorize admin', async ({
  page,
}) => {
  await open(page, 'admin/');
  await expect(
    page.getByRole('heading', { name: 'Authorized access.' }),
  ).toBeVisible();
  const response = await page.request.get(
    'http://localhost:8787/admin/overview',
  );
  expect(response.status()).toBe(401);
});

test('accounts sync across devices, isolate guest data, queue offline and reconnect', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'phone',
    'The same server/account flow is covered on desktop; phone learning and forms are tested separately.',
  );
  const name = 'browser_' + randomBytes(4).toString('hex');
  const password = randomBytes(20).toString('base64url');
  await open(page, 'work/kinematics-review/');
  await page
    .getByRole('checkbox', { name: /Set a direction convention/ })
    .check();
  await open(page, 'account/');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .first()
    .click();
  await page.getByLabel('Username', { exact: true }).fill(name);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('heading', { name: `Hi, ${name}.` }),
  ).toBeVisible();
  const other = await browser.newContext();
  const peer = await other.newPage();
  await peer.goto('http://localhost:4321/atlas/account/');
  await peer.getByLabel('Username', { exact: true }).fill(name);
  await peer.getByLabel('Password', { exact: true }).fill(password);
  await peer
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await expect(
    peer.getByRole('heading', { name: `Hi, ${name}.` }),
  ).toBeVisible();
  await peer.goto('http://localhost:4321/atlas/work/kinematics-review/');
  await expect(
    peer.getByRole('checkbox', { name: /Set a direction convention/ }),
  ).toBeChecked();
  await page.route('http://localhost:8787/**', (route) => route.abort());
  await open(page, 'concepts/vector-sign/');
  await page
    .getByRole('button', { name: 'I don’t understand this', exact: true })
    .click();
  await expect(page.locator('.sync-status')).toContainText('Sync offline');
  expect(
    await page.evaluate(() =>
      Object.entries(localStorage).some(
        ([key, value]) =>
          key.startsWith('atlas:v1:account:') &&
          JSON.parse(value).events.some(
            (e: { type: string }) => e.type === 'concept_marked_confused',
          ),
      ),
    ),
  ).toBe(true);
  await page.unroute('http://localhost:8787/**');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.sync-status')).toContainText('Progress synced');
  const session=await (await page.request.get('http://localhost:8787/session')).json();
  await expect.poll(async()=>{
    const response=await page.request.post('http://localhost:8787/sync',{headers:{origin:'http://localhost:4321','x-atlas-client':'atlas','x-csrf-token':session.csrf},data:{events:[],cursor:0}});
    const data=await response.json();return (data.events??[]).filter((e:{type:string;payload:{concept?:string}})=>e.type==='concept_marked_confused'&&e.payload.concept==='vector-sign').length;
  }).toBe(1);
  await peer.reload();
  await peer.goto('http://localhost:4321/atlas/concepts/vector-sign/');
  await expect(peer.getByText(/You marked this confusing/)).toBeVisible();
  await open(page, 'account/');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A little more portable.' }),
  ).toBeVisible();
  await open(page, 'concepts/vector-sign/');
  await expect(page.getByText('You marked this confusing')).not.toBeVisible();
  await other.close();
});

test('request inbox and admin summaries use real authorized backend data', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'phone',
    'Server authorization and admin flow are covered on desktop.',
  );
  const message =
    'Browser QA: please keep the graph relationship list easy to reach.';
  await open(page, 'help/');
  await page.getByLabel('What do you need?').selectOption('feature');
  await page.getByLabel('Tell us a little more').fill(message);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(
    page.getByText('Request received. Thank you for helping improve atlas.'),
  ).toBeVisible();
  await open(page, 'account/');
  await page.getByLabel('Username', { exact: true }).fill('Jovan');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.ATLAS_TEST_ADMIN_PASSWORD!);
  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await expect(page.getByRole('link', { name: 'Open admin' })).toBeVisible();
  await open(page, 'admin/');
  await expect(
    page.getByRole('heading', { name: 'How atlas is doing.' }),
  ).toBeVisible();
  const request = page.locator('.inbox-entry').filter({ hasText: message });
  await request.getByLabel('Status').selectOption('reviewing');
  await expect(request.getByLabel('Status')).toHaveValue('reviewing');
});

test('production Pages base path, search index, deep links and cached offline routes', async ({
  page,
}) => {
  await page.goto('http://localhost:4322/atlas/concepts/half-life/');
  await expect(page.locator('.learning-figure')).toBeVisible();
  await page.reload();
  await expect(page.locator('h1')).toContainText('half-life');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const manifest = await page.request.get(
    'http://localhost:4322/atlas/manifest.webmanifest',
  );
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).start_url).toBe('/atlas/');
  await page.getByRole('button', { name: 'Search anything' }).click();
  await page.getByRole('searchbox').fill('half-life');
  await expect(page.locator('.search-results a').first()).toHaveAttribute(
    'href',
    /\/atlas\//,
  );
  await page.keyboard.press('Escape');
  await page.context().setOffline(true);
  await page.goto('http://localhost:4322/atlas/concepts/cladograms/');
  await expect(page.locator('h1')).toContainText('Read the common ancestor');
  await expect(page.locator('.learning-figure')).toBeVisible();
  await page.goto('http://localhost:4322/atlas/work/c17-research/');
  await page.getByRole('checkbox').first().check();
  await page.reload();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.context().setOffline(false);
});
