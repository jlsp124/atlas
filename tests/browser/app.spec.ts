import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes } from 'node:crypto';
import { questions } from '../../src/content/catalog';
import { variant } from '../../src/core/learning';
async function open(page: Page, path = '') {
  await page.goto('/atlas/' + path);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
}
async function skip(page: Page) {
  await open(page);
  await page
    .getByRole('button', { name: 'Look around without an account' })
    .click();
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await open(page);
}
async function answer(page: Page, correct = true) {
  const node = page.locator('.question-session:visible');
  const id = await node.getAttribute('data-question'),
    seed = Number(await node.getAttribute('data-seed'));
  const q = variant(
    questions.find((q) => q.id === id)!,
    seed,
  );
  const value = Array.isArray(q.answer) ? q.answer[0] : String(q.answer);
  if (q.format === 'choice')
    await node
      .getByRole('radio', {
        name: correct ? value : q.choices!.find((c) => c !== value)!,
        exact: true,
      })
      .check();
  else {
    await node
      .getByLabel('Your answer', { exact: true })
      .fill(correct ? value : '99999999');
    if (q.unitLabel)
      await node.getByLabel('Unit', { exact: true }).fill(q.unitLabel);
  }
  await page
    .locator('.flow-footer:visible')
    .last()
    .getByRole('button', { name: 'Check answer', exact: true })
    .click();
  await expect(page.locator('.question-feedback:visible')).toBeVisible();
}
test('dedicated onboarding chooses independent courses, saves locally and replays', async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole('heading', { name: /Everything from class/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What are you taking?' }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', { name: 'Chemistry 11', exact: true })
    .uncheck();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Save your setup' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep it on this device' }).click();
  await expect(page).toHaveURL(/\/atlas\/courses\/$/);
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await expect(page.locator('.course-row strong')).toHaveCount(3);
  await expect(
    page.getByRole('link', { name: /Chemistry 11/, exact: false }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await open(page, 'account/');
  await page.getByText('Your data', { exact: true }).click();
  await page.getByRole('button', { name: 'Replay introduction' }).click();
  await expect(
    page.getByRole('button', { name: 'Get started', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.guided-tour')).toHaveCount(0);
});
test('first launch account option opens the existing registration flow', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page
    .getByRole('button', { name: 'Create an account', exact: true })
    .click();
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create account', exact: true }).last(),
  ).toBeVisible();
});
test('V1 saved courses, theme, worksheet tasks and question evidence survive V2', async ({
  page,
}) => {
  const device = 'b8c73297-fba0-453d-87f4-9d1b8b679e16';
  const events = [
    {
      id: '81cec3d9-993e-4d78-a033-b8bb5ee71811',
      device,
      at: '2026-10-04T19:00:00.000Z',
      type: 'courses_selected',
      payload: { courses: ['physics', 'life-sciences'] },
    },
    {
      id: '81cec3d9-993e-4d78-a033-b8bb5ee71812',
      device,
      at: '2026-10-04T19:01:00.000Z',
      type: 'theme_changed',
      payload: { theme: 'dark' },
    },
    {
      id: '81cec3d9-993e-4d78-a033-b8bb5ee71813',
      device,
      at: '2026-10-04T19:02:00.000Z',
      type: 'assignment_task',
      payload: { assignment: 'kinematics-review', task: 'signs', done: true },
    },
    {
      id: '81cec3d9-993e-4d78-a033-b8bb5ee71814',
      device,
      at: '2026-10-04T19:03:00.000Z',
      type: 'question_answered',
      payload: {
        question: questions.find((q) => q.concepts.includes('velocity'))!.id,
        concept: 'velocity',
        correct: true,
        hints: 0,
        seed: 10,
        durationMs: 3000,
      },
    },
  ];
  await page.addInitScript(
    ({ events, device }) => {
      if (localStorage.getItem('atlas:v1:guest')) return;
      localStorage.setItem('atlas:device', device);
      localStorage.setItem('atlas:theme', 'dark');
      localStorage.setItem(
        'atlas:v1:guest',
        JSON.stringify({
          events,
          synced: [],
          cursor: 0,
          onboarding: true,
          analytics: false,
        }),
      );
    },
    { events, device },
  );
  await open(page);
  await expect(page.locator('.onboarding')).not.toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('.course-row strong').allTextContents()).toEqual([
    'Physics 11',
    'Life Sciences 11',
  ]);
  await open(page, 'work/kinematics-review/');
  await page.getByText('Mark a section finished', { exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Set a direction convention' }),
  ).toBeChecked();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('atlas:v1:guest')!),
  );
  expect(saved.events).toEqual(expect.arrayContaining(events));
  expect(await page.evaluate(() => localStorage.getItem('atlas:device'))).toBe(
    device,
  );
});
test('home and course fit desktop and units open real materials', async ({
  page,
}, info) => {
  await skip(page);
  await expect(
    page.getByRole('heading', { name: 'Your atlas', exact: true }),
  ).toBeVisible();
  expect(await page.locator('.course-row strong').allTextContents()).toEqual([
    'Physics 11',
    'Chemistry 11',
    'Life Sciences 11',
    'Introductory Japanese 11',
  ]);
  if (info.project.name === 'desktop')
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(900);
  await open(page, 'courses/physics/');
  await expect(page.getByRole('link', { name: /Basic Skills/ })).toBeVisible();
  await page.getByRole('link', { name: /Kinematics.*materials/ }).click();
  await expect(
    page.getByRole('button', { name: 'All materials', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Kinematics Review/ }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toContainText(
    /P1|Verified|coverage|Graph relationship/i,
  );
  if (info.project.name === 'desktop') {
    await open(page, 'learn/velocity/');
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await open(page);
      await expect(page.locator('.continue-row')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBeLessThanOrEqual(viewport.height);
    }
  }
});
test('assignment tasks, paper status and walkthrough history survive refresh', async ({
  page,
}) => {
  await open(page, 'work/kinematics-review/');
  await page.getByText('Mark a section finished', { exact: true }).click();
  const task = page.getByRole('checkbox', {
    name: /Set a direction convention/,
  });
  await task.check();
  await page.reload();
  await page.getByText('Mark a section finished', { exact: true }).click();
  await expect(task).toBeChecked();
  await task.uncheck();
  await page.reload();
  await page.getByText('Mark a section finished', { exact: true }).click();
  await expect(task).not.toBeChecked();
  await expect(page.locator('.assignment-document textarea')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Assignment status', exact: true })
    .selectOption('complete');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Assignment status', exact: true }),
  ).toHaveValue('complete');
  await page
    .getByRole('link', { name: 'Walk through question 2', exact: true })
    .click();
  await page
    .locator('.walkthrough')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('.walkthrough')).toHaveAttribute(
    'data-question',
    'q-2',
  );
  await expect(page.locator('.walkthrough')).toHaveAttribute('data-step', '1');
});

test('definitions give useful context and backlinks without a graph', async ({
  page,
}) => {
  await open(page, 'work/bio-c17-sections/');
  const term = page
    .getByRole('button', {
      name: 'Define index fossils',
      exact: true,
    })
    .first();
  await term.click();
  const inspector = page.getByRole('dialog', {
    name: 'Definition: index fossil',
  });
  await expect(inspector).toContainText('short time');
  await expect(
    inspector.getByRole('link', { name: 'Learn this', exact: true }),
  ).toHaveAttribute('href', '/atlas/learn/relative-dating/');
  await expect(
    inspector.getByRole('link', { name: /Chapter 17/ }).first(),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(inspector).not.toBeVisible();
  await expect(term).toBeFocused();
  await expect(page.locator('.graph-canvas')).toHaveCount(0);
});
test('learn teaches one step, renders math, keeps confusion evidence and secondary AI', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, 'learn/acceleration/');
  await expect(page.locator('.katex')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Copy AI tutor prompt' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'I don’t understand this', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Check what I’m missing' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.katex')).toBeVisible();
  await page
    .getByRole('button', { name: 'Need more help?', exact: true })
    .click();
  await page.getByRole('button', { name: /Ask an AI/ }).click();
  await page.getByRole('button', { name: 'Copy AI tutor prompt' }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Ask what is confusing');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('atlas:v1:guest')!).events.some(
        (e: { type: string }) => e.type === 'concept_marked_confused',
      ),
    ),
  ).toBe(true);
  await open(page, 'learn/half-life/');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeInViewport();
});
test('self-report cannot create mastery and leads to a real foundation check', async ({
  page,
}) => {
  await open(page, 'learn/velocity/');
  await page.getByRole('button', { name: 'I know this', exact: true }).click();
  await expect(
    page.getByText('Before this, let’s check one thing.'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('atlas:v1:guest')!).events.filter(
          (e: { type: string }) => e.type === 'question_answered',
        ).length,
    ),
  ).toBe(0);
  await answer(page, false);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'This is probably the part getting in your way.',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fix this first' }).click();
  await expect(page.locator('.teaching-block')).toHaveCount(0);
  await expect(page.locator('.question-session .step-meta')).toHaveText(
    '1 of 1',
  );
  await answer(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.question-session')).toHaveAttribute(
    'data-question',
    /velocity/,
  );
});
test('wrong practice answer repairs a foundation and retries the original question', async ({
  page,
}) => {
  await open(page, 'courses/physics/practice/?target=velocity');
  await page.getByRole('button', { name: 'Start quick check' }).click();
  const original = await page
    .locator('.question-session')
    .getAttribute('data-question');
  const seed = await page
    .locator('.question-session')
    .getAttribute('data-seed');
  await answer(page, false);
  await page.getByRole('button', { name: 'Fix this first' }).click();
  await expect(page.locator('.teaching-block')).toHaveCount(0);
  const originalQuestion = questions.find((q) => q.id === original)!;
  const tinyQuestion = questions.find(
    (q) =>
      q.id !== original &&
      q.concepts.includes(originalQuestion.diagnosis) &&
      q.level === 'recognition' &&
      q.format === 'choice',
  );
  if (tinyQuestion)
    await page
      .locator('.tiny-repair')
      .getByRole('radio', { name: String(tinyQuestion.answer), exact: true })
      .check();
  await page
    .getByRole('button', { name: 'Back to the original question', exact: true })
    .click();
  await expect(page.locator('.question-session:visible')).toHaveAttribute(
    'data-question',
    original!,
  );
  await expect(page.locator('.question-session:visible')).toHaveAttribute(
    'data-seed',
    seed!,
  );
  await expect(
    page.getByRole('button', { name: 'Check answer', exact: true }),
  ).toBeVisible();
});
test('hinted answers remain worth reviewing rather than declaring independent success', async ({
  page,
}) => {
  await open(page, 'courses/physics/practice/?target=velocity');
  await page.getByRole('button', { name: 'Start quick check' }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole('button', { name: 'Give me a hint', exact: true })
      .click();
    await answer(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await expect(
    page.getByRole('heading', { name: 'Worth another look', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Review', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Looks good', exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('atlas:v1:guest')!)
        .events.filter(
          (e: { type: string; payload: { hints: number } }) =>
            e.type === 'question_answered',
        )
        .every((e: { payload: { hints: number } }) => e.payload.hints === 1),
    ),
  ).toBe(true);
});
test('contextual help preserves the current Japanese input and paper position', async ({
  page,
}) => {
  await open(page, 'work/greetings-practice/');
  await page.getByText('Mark a section finished', { exact: true }).click();
  await page.getByRole('checkbox').first().check();
  await page
    .getByRole('link', { name: 'Review question 5', exact: true })
    .click();
  const question = page.locator('.companion-question');
  await question
    .getByLabel('Write in Japanese', { exact: true })
    .fill('こんにちは');
  const help = question.getByRole('button', {
    name: 'What do I need to know?',
    exact: true,
  });
  await help.scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await help.click();
  const modal = page.getByRole('dialog', {
    name: 'Explain this idea',
    exact: true,
  });
  await expect(modal).toBeVisible();
  expect(await modal.locator('.tiny-lesson').count()).toBeLessThanOrEqual(3);
  await expect(modal.locator('.question-session')).toHaveCount(0);
  await modal
    .getByRole('button', { name: 'Back to assignment', exact: true })
    .click();
  await expect(modal).not.toBeVisible();
  await expect(
    question.getByLabel('Write in Japanese', { exact: true }),
  ).toHaveValue('こんにちは');
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThanOrEqual(2);
  await page
    .getByRole('button', { name: 'Whole assignment', exact: true })
    .click();
  await page.getByText('Mark a section finished', { exact: true }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});

test('typed Japanese stays focused and assessed-work safeguards remain in AI context', async ({
  page,
  context,
}) => {
  await open(page, 'courses/japanese/practice/?target=jp-konnichiwa');
  await page.getByRole('button', { name: 'Start quick check' }).click();
  await answer(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your answer', { exact: true }).fill('こんにちは');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'That’s it.' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(
    /prohibits AI|Independent study only/,
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, 'learn/jp-sumimasen/');
  await page.getByRole('button', { name: 'Need more help?' }).click();
  await page.getByRole('button', { name: /Ask an AI/ }).click();
  await page.getByRole('button', { name: 'Copy AI tutor prompt' }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Do not produce a submit-ready assessed assignment answer.');
});
test('search groups a topic, related worksheet and prep; kana and Escape work', async ({
  page,
}) => {
  await open(page, 'learn/hiragana/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('textbox', {
    name: 'Search atlas',
    exact: true,
  });
  await input.fill('half life');
  const results = page.locator('.search-results');
  await expect(results).toContainText('Half-life');
  await expect(results).toContainText('Chapter 17 section assessments');
  await expect(results).toContainText('C17 test');
  await input.fill('こんにちは');
  await expect(results).toContainText('こんにちは');
  await input.fill('zzzznevermaterial');
  await expect(results).toContainText('Nothing here yet');
  await page.keyboard.press('Escape');
  await expect(page.locator('.search-dialog')).not.toBeVisible();
});
test('calendar dates open prep and unconfirmed scope never creates pretend content', async ({
  page,
}) => {
  await open(page, 'calendar/?date=2026-10-05');
  await page.getByRole('button', { name: /C17 test/ }).click();
  await page.getByRole('link', { name: 'Prepare', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What’s on it', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Prepare', exact: true }),
  ).toBeVisible();
  await open(page, 'prepare/c19-quiz-oct9/');
  await expect(
    page.getByRole('button', { name: 'Prepare', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /teacher guide/ }),
  ).toHaveAttribute('href', /bio1\/c19-microbes/);
  await open(page, 'calendar/?date=2026-12-28');
  await expect(
    page.locator('.calendar-event').filter({ hasText: 'Winter break' }),
  ).toHaveCount(5);
  await page.getByRole('button', { name: 'Month', exact: true }).click();
  await expect(page.locator('.calendar-grid')).toHaveAttribute(
    'data-view',
    'month',
  );
});
test('themes persist, narrow layouts reflow and mobile has four destinations', async ({
  page,
}) => {
  await open(page, 'account/');
  const theme = page.getByRole('combobox', { name: 'Theme', exact: true });
  await theme.selectOption('dark');
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
    .toBe('rgb(24, 25, 29)');
  await page.addStyleTag({
    content:
      '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}',
  });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(page.locator('.mobile-nav')).toBeInViewport();
    expect(await page.locator('.mobile-nav a,.mobile-nav button').count()).toBe(
      4,
    );
  }
});
for (const theme of ['light', 'dark'] as const)
  test(
    'accessible ' + theme + ' student routes and overlays',
    async ({ page }) => {
      test.setTimeout(120000);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await open(page);
      for (const action of [
        'Get started',
        'Continue',
        'Keep it on this device',
      ]) {
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
        ).toEqual([]);
        await page.getByRole('button', { name: action, exact: true }).click();
      }
      await expect(page.locator('.onboarding')).not.toBeVisible();
      for (const path of [
        '',
        'courses/',
        'courses/physics/',
        'courses/physics/units/kinematics/',
        'learn/motion-graphs/',
        'learn/jp-sumimasen/',
        'work/kinematics-review/',
        'calendar/',
        'prepare/c17-test-oct7/',
        'account/',
        'help/',
        'about/',
        'privacy/',
        'sources/',
      ]) {
        await open(page, path);
        await expect(page.locator('#main h1')).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(result.violations).toEqual([]);
      }
      await open(page, 'courses/physics/practice/?target=velocity');
      await page.getByRole('button', { name: 'Start quick check' }).click();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await answer(page);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await open(page, 'work/bio-c17-sections/');
      await page
        .getByRole('button', { name: 'Define index fossils', exact: true })
        .first()
        .click();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Control+k');
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    },
  );
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
}) => {
  const name = 'browser_' + randomBytes(4).toString('hex');
  const password = randomBytes(20).toString('base64url');
  await open(page, 'work/kinematics-review/');
  await page.getByText('Mark a section finished', { exact: true }).click();
  await page
    .getByRole('checkbox', { name: /Set a direction convention/ })
    .check();
  await page
    .getByRole('link', { name: 'Walk through question 1', exact: true })
    .click();
  while (
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .count()
  )
    await page
      .locator('.walkthrough')
      .getByRole('button', { name: 'Next', exact: true })
      .click();
  await page
    .getByText('Keep this question for review', { exact: true })
    .click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
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
  await peer.getByText('Mark a section finished', { exact: true }).click();
  await peer
    .getByRole('button', { name: 'Continue question 1', exact: true })
    .click();
  await expect(peer.locator('.walkthrough')).toHaveAttribute('data-step', '10');
  await peer
    .getByText('Keep this question for review', { exact: true })
    .click();
  await expect(
    peer.getByRole('button', { name: 'Hard', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await peer
    .getByRole('button', { name: 'Whole assignment', exact: true })
    .click();
  await peer.getByText('Mark a section finished', { exact: true }).click();
  await expect(
    peer.getByRole('checkbox', { name: /Set a direction convention/ }),
  ).toBeChecked();
  await page.route('http://localhost:8787/**', (route) => route.abort());
  await open(page, 'concepts/vector-sign/');
  await page
    .getByRole('button', { name: 'I don’t understand this', exact: true })
    .click();
  await open(page, 'account/');
  await expect(page.locator('.sync-status')).toContainText('waiting to sync');
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
  const session = await (
    await page.request.get('http://localhost:8787/session')
  ).json();
  await expect
    .poll(async () => {
      const response = await page.request.post('http://localhost:8787/sync', {
        headers: {
          origin: 'http://localhost:4321',
          'x-atlas-client': 'atlas',
          'x-csrf-token': session.csrf,
        },
        data: { events: [], cursor: 0 },
      });
      const data = await response.json();
      return (data.events ?? []).filter(
        (e: { type: string; payload: { concept?: string } }) =>
          e.type === 'concept_marked_confused' &&
          e.payload.concept === 'vector-sign',
      ).length;
    })
    .toBe(1);
  await peer.reload();
  await peer.goto('http://localhost:4321/atlas/concepts/vector-sign/');
  await expect
    .poll(() =>
      peer.evaluate(() =>
        Object.entries(localStorage).some(
          ([key, value]) =>
            key.startsWith('atlas:v1:account:') &&
            JSON.parse(value).events.some(
              (e: { type: string; payload: { concept?: string } }) =>
                e.type === 'concept_marked_confused' &&
                e.payload.concept === 'vector-sign',
            ),
        ),
      ),
    )
    .toBe(true);
  await open(page, 'account/');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Save your setup' }),
  ).toBeVisible();
  await open(page, 'concepts/vector-sign/');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('atlas:v1:guest')!).events.some(
        (e: { type: string }) => e.type === 'concept_marked_confused',
      ),
    ),
  ).toBe(false);
  await other.close();
});

test('request inbox and admin summaries use real authorized backend data', async ({
  page,
}, testInfo) => {
  const message = `Browser QA (${testInfo.project.name}): please keep the unit classwork easy to reach.`;
  await open(page, 'help/');
  await page.getByLabel('What do you need?').selectOption('feature');
  await page.getByLabel('Tell me a little more').fill(message);
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
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.learning-figure')).toBeVisible();
  await page.reload();
  await expect(page.locator('#main h1')).toContainText('Half-life');
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
  await page.keyboard.press('Control+k');
  await page
    .getByRole('textbox', { name: 'Search atlas', exact: true })
    .fill('half-life');
  await expect(page.locator('.search-results a').first()).toHaveAttribute(
    'href',
    /\/atlas\//,
  );
  await page.keyboard.press('Escape');
  await page.context().setOffline(true);
  await page.goto('http://localhost:4322/atlas/concepts/cladograms/');
  await expect(page.locator('#main h1')).toContainText(
    'Read the common ancestor',
  );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.learning-figure')).toBeVisible();
  await page.goto('http://localhost:4322/atlas/work/c17-research/');
  await page.getByText('Mark a section finished', { exact: true }).click();
  await page.getByRole('checkbox').first().check();
  await page.reload();
  await page.getByText('Mark a section finished', { exact: true }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.context().setOffline(false);
});

test('an installed waiting update remains actionable after navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const register = navigator.serviceWorker.register.bind(
      navigator.serviceWorker,
    );
    navigator.serviceWorker.register = (script, options) =>
      register(
        location.pathname === '/atlas/' ? `${script}?initial-worker=1` : script,
        options,
      );
  });
  await page.goto('http://localhost:4322/atlas/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true,
        }),
      );
  });
  await page.goto('http://localhost:4322/atlas/about/');
  await page.waitForFunction(async () =>
    Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
  );
  await expect(page.locator('.update-notice')).toBeVisible();
  await page.goto('http://localhost:4322/atlas/courses/physics/');
  await expect(page.locator('.update-notice')).toBeVisible();
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await page.waitForFunction(() =>
    navigator.serviceWorker.controller?.scriptURL.endsWith('/atlas/sw.js'),
  );
  await expect(page.locator('.update-notice')).not.toBeVisible();
  await expect(page.locator('#main h1')).toContainText('Physics 11');
});
