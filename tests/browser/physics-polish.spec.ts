import { test, expect, type Page } from '@playwright/test';
import { makeWalkthrough } from '../../src/core/walkthrough';
import { assignments } from '../../src/content/catalog';
import { atlasVersion } from '../../src/content/product';
async function open(page: Page, path: string, preview = false) {
  await page.goto(`${preview ? 'http://localhost:4322' : ''}/atlas/${path}`);
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
async function advance(page: Page, a: string, q: string, phase: string) {
  const material = assignments.find((x) => x.id === a)!,
    question = material.companionQuestions!.find((x) => x.id === q)!;
  const target = makeWalkthrough(material, question).steps.findIndex(
    (s) => s.phase === phase,
  );
  let safety = 30;
  while (
    Number(await page.locator('.walkthrough').getAttribute('data-step')) <
    target
  ) {
    if (!safety--) throw Error('Walkthrough stuck');
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .click();
  }
}
test('Home is sparse, shows verified context and facts, and the logo animates the sidebar', async ({
  page,
}, info) => {
  await open(page, '');
  await page
    .getByRole('button', {
      name: 'Look around without an account',
      exact: true,
    })
    .click();
  await expect(page.locator('.school-context')).toHaveCount(0);
  await expect(page.locator('.home-screen')).not.toContainText(
    'College Heights',
  );
  await expect(page.locator('.home-details')).toContainText(
    `atlas. ${atlasVersion}`,
  );
  await expect(page.locator('.home-details')).toContainText('lines of code');
  await expect(page.locator('.home-details')).toContainText('updates');
  await expect(
    page.locator('.home-details a[href*="sd57.bc.ca"]'),
  ).toContainText('school year elapsed');
  await expect(
    page.locator('.home-screen .event-list, .home-screen .up-next'),
  ).toHaveCount(0);
  await expect(page.locator('.home-screen')).not.toContainText(
    'assignments completed',
  );
  if (info.project.name === 'desktop') {
    const logo = page.locator('.sidebar-toggle');
    const initial = await logo.getAttribute('aria-expanded');
    await logo.click();
    await expect(logo).toHaveAttribute(
      'aria-expanded',
      initial === 'true' ? 'false' : 'true',
    );
    await logo.click();
    await expect(logo).toHaveAttribute('aria-expanded', initial!);
    await expect(page.locator('.sidebar')).toContainText('Calendar');
  } else {
    await expect(page.locator('.sidebar')).not.toBeVisible();
    await expect(page.locator('.sidebar-toggle')).not.toBeVisible();
    expect(
      await page.locator('.mobile-nav a,.mobile-nav button').allTextContents(),
    ).toEqual(['Home', 'Calendar', 'Search', 'You']);
    await expect(page.locator('.mobile-nav a').first()).toHaveAttribute(
      'href',
      '/atlas/',
    );
    await page.locator('.mobile-wordmark').click();
    await expect(page).toHaveURL(/\/atlas\/$/);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
test('production CSS leaves all substitution tokens in flow with operators intact', async ({
  page,
}) => {
  for (const item of [
    {
      a: 'kinematics-review',
      q: 'q-1',
      expected: 'Δd = ((24 + 18) / 2) × 3.00',
    },
    {
      a: 'kinematics-review',
      q: 'q-12',
      expected: 'vi = √(0² − 2 × (−9.8) × 4.5)',
    },
    {
      a: 'physics-textbook-accelerated-motion',
      q: 'q-7a',
      expected: 'a = (0 − (−25)) / 3.0',
    },
  ]) {
    await open(page, `work/${item.a}/?step=0#${item.q}`, true);
    await advance(page, item.a, item.q, 'substitute');
    await expect(page.locator('.live-equation')).toHaveText(item.expected);
    await page.locator('.walkthrough').evaluate(async (el) => {
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const layout = await page
      .locator('.live-equation > span')
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            position: getComputedStyle(n).position,
            text: n.textContent,
          };
        }),
      );
    for (let i = 0; i < layout.length; i++) {
      expect(layout[i].position).toBe('static');
      if (i && Math.abs(layout[i].top - layout[i - 1].top) < 2)
        expect(layout[i].left).toBeGreaterThanOrEqual(
          layout[i - 1].right - 0.75,
        );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await advance(page, item.a, item.q, 'finish');
    await expect(
      page.getByRole('button', { name: 'Done on paper', exact: true }),
    ).toHaveCount(0);
  }
});
test('packet keys name unavailable coordinates and notes have no lesson or completion controls', async ({
  page,
}) => {
  await open(page, 'work/physics-motion-packet/');
  await expect(page.locator('.packet-key')).toContainText([
    'Scalar: magnitude',
    'Distance = total path',
  ]);
  await expect(page.locator('.packet-gap')).toContainText('pp.147–153');
  await expect(
    page.getByRole('button', {
      name: /Walk through|Mark complete|Mark.*finished/,
    }),
  ).toHaveCount(0);
  await open(page, 'work/physics-average-velocity/');
  await expect(page.locator('.packet-section')).toHaveCount(6);
  await expect(page.locator('#q-158')).toContainText('0–2, 2–5');
  await expect(page.locator('#q-158 .packet-gap')).toContainText(
    'girl’s graph positions',
  );
  await open(page, 'work/physics-motion-notes/');
  await expect(page.locator('.physics-notes')).toBeVisible();
  await expect(page.locator('.physics-notes')).toContainText(
    'archive is private',
  );
  await expect(page.locator('.physics-notes')).not.toContainText(
    'A point that motion',
  );
  await expect(
    page.locator(
      '.physics-notes .walkthrough, .physics-notes textarea, .physics-notes input',
    ),
  ).toHaveCount(0);
});
test('owner login opens the private faithful note fixture, with no source copied into public pages', async ({
  page,
}) => {
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
  await open(page, 'work/physics-motion-notes/');
  await expect(page.locator('.class-note-copy')).toContainText(
    'Owner-only test fixture text.',
  );
  await expect(page.locator('.physics-notes')).not.toContainText(
    'Walk through',
  );
  await expect(page.locator('.source-gaps')).toContainText('Parts missing');
});
test('labs expose usable blank documents and gather evidence before report writing', async ({
  page,
}) => {
  await open(page, 'work/wadson-formal-lab/');
  await expect(
    page.getByRole('link', { name: 'Download editable Word template' }),
  ).toHaveAttribute('href', /\.docx$/);
  await expect(
    page.getByRole('link', { name: 'Open fillable PDF' }),
  ).toHaveAttribute('href', /\.pdf$/);
  await page.getByText('Help me with this lab', { exact: true }).click();
  const prompt = page.getByRole('textbox', { name: 'Lab help prompt' });
  await expect(prompt).toHaveValue(/Do not start writing a report/);
  await expect(prompt).toHaveValue(/wait for my answers/);
  await page.goto('/atlas/downloads/wadson-formal-lab-template.html');
  await page.locator('h1[contenteditable]').fill('My own investigation');
  await page.reload();
  await expect(page.locator('h1[contenteditable]')).toHaveText(
    'My own investigation',
  );
});
test('ticker tape uses entered measurements and correct midpoint graphs; the review tape requests its missing image', async ({
  page,
}) => {
  await open(page, 'work/physics-ticker-lab/');
  await page
    .getByRole('textbox', { name: 'Time (s), position (mm)' })
    .fill('0.1,10\n0.2,30\n0.3,60');
  await expect(page.locator('.tape-results')).toContainText('0.15');
  await expect(page.locator('.tape-results')).toContainText('a ≈ 1 m/s²');
  await expect(page.locator('.physics-graph')).toHaveCount(2);
  await expect(page.locator('.physics-graph svg').first()).toHaveAttribute(
    'aria-label',
    /No unrecorded origin/,
  );
  await open(page, 'work/physics-motion-review/?step=0#q-e20');
  await advance(page, 'physics-motion-review', 'q-e20', 'point-0');
  await expect(page.locator('.walkthrough')).toContainText('0.050');
  await expect(page.locator('.physics-prompt')).toContainText(
    'Help with the missing source',
  );
  await expect(page.locator('.walkthrough .physics-graph')).toHaveCount(0);
});
test('correct graph shapes and directions are attached to the exact question', async ({
  page,
}) => {
  for (const [q, count, phrase] of [
    ['q-4', 1, '18 s'],
    ['q-16c', 3, 'Maximum position is 4 m'],
    ['q-22a', 1, '−150 m'],
    ['q-46', 2, 'Floor = +1.5 m'],
  ] as const) {
    await open(page, `work/physics-textbook-accelerated-motion/?step=0#${q}`);
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .click();
    await expect(page.locator('.walkthrough .physics-graph')).toHaveCount(
      count,
    );
    await expect(
      page.locator('.walkthrough .physics-graph').filter({ hasText: phrase }),
    ).toBeVisible();
    for (const graph of await page
      .locator('.walkthrough .physics-graph svg')
      .all())
      await expect(graph).toHaveAttribute('aria-label', /.+/);
  }
});
