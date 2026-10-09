import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const api = 'http://localhost:8790';
const headers = {
  origin: 'http://localhost:4321',
  'x-atlas-client': 'atlas',
  'content-type': 'application/json',
};

test('private admin report copies aggregate JSON and keeps account and feedback details separate', async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const signIn = await page.request.post(`${api}/auth/login`, {
    headers,
    data: {
      username: 'Jovan',
      password: process.env.ATLAS_TEST_ADMIN_PASSWORD!,
    },
  });
  expect(signIn.status()).toBe(200);
  const auth = await signIn.json();
  const privateHeaders = { ...headers, 'x-csrf-token': auth.csrf };
  await page.request.post(`${api}/account/privacy`, {
    headers: privateHeaders,
    data: { analytics: true },
  });
  const session = randomUUID(),
    visitor = randomUUID();
  for (const type of [
    'route_viewed',
    'japanese_review_started',
    'japanese_review_completed',
  ]) {
    const response = await page.request.post(`${api}/analytics`, {
      headers: privateHeaders,
      data: {
        id: randomUUID(),
        session,
        visitor,
        type,
        consent: true,
        version: '0.1.2',
        device: 'mobile',
        course: 'japanese',
        route: '/courses/japanese/',
        feature: 'japanese-review',
        scope: 'colors-shapes',
        success: true,
      },
    });
    expect(response.status()).toBe(200);
  }
  const message = `Synthetic feedback ${randomUUID()}`;
  await page.request.post(`${api}/requests`, {
    headers: privateHeaders,
    data: {
      kind: 'feature',
      message,
      contact: 'fixture@example.invalid',
      course: 'japanese',
      route: '/courses/japanese/',
      version: '0.1.2',
      device: 'mobile',
    },
  });
  await page.goto('/atlas/admin/');
  await expect(
    page.getByRole('heading', { name: /How atlas is used/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Copy JSON', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Copy JSON', exact: true }).click();
  await expect(page.getByText('JSON copied.', { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('admin-product-use.png'),
    fullPage: true,
  });
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const report = JSON.parse(copied);
  expect(report.schema_version).toBe(1);
  expect(report.japanese_review.starts).toBeGreaterThan(0);
  for (const privateValue of [
    auth.user.id,
    'fixture@example.invalid',
    message,
    session,
    visitor,
    'password_hash',
    'csrf',
  ])
    expect(copied).not.toContain(privateValue);
  await page.getByRole('tab', { name: 'Accounts', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Account administration', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Jovan', { exact: true }).last()).toBeVisible();
  const accountRow = page
    .locator('.admin-product tbody tr')
    .filter({ hasText: auth.user.id });
  await accountRow.getByRole('button', { name: 'Recent activity' }).click();
  await expect(
    page.getByText('Latest activity · private account operation', {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('admin-accounts.png'),
    fullPage: true,
  });
  await page.getByRole('tab', { name: /Feedback/ }).click();
  const feedback = page.locator('.inbox-entry').filter({ hasText: message });
  await expect(feedback).toBeVisible();
  await feedback.getByLabel('Status').selectOption('fixed');
  await expect(feedback.getByLabel('Status')).toHaveValue('fixed');
  await page.screenshot({
    path: testInfo.outputPath('admin-feedback.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
});

test('ordinary accounts cannot request private reports or account lists', async ({
  request,
}) => {
  const result = await request.post(`${api}/auth/register`, {
    headers,
    data: {
      username: `fixture_${randomUUID().slice(0, 8)}`,
      password: `Synthetic_${randomUUID()}`,
    },
  });
  expect(result.status()).toBe(201);
  for (const path of ['/admin/report', '/admin/accounts', '/admin/requests']) {
    const response = await request.get(`${api}${path}`);
    expect(response.status()).toBe(403);
    expect(response.headers()['cache-control']).toBe('no-store');
  }
});

test('real opt-in navigation and search emit public metadata and pause active time when hidden or idle', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    if (!localStorage.getItem('atlas:v1:guest'))
      localStorage.setItem(
        'atlas:v1:guest',
        JSON.stringify({
          events: [],
          synced: [],
          cursor: 0,
          onboarding: true,
          analytics: false,
        }),
      );
  });
  const captured: Record<string, unknown>[] = [];
  page.on('request', (request) => {
    if (request.url() === `${api}/analytics` && request.method() === 'POST')
      captured.push(request.postDataJSON());
  });
  await page.goto('/atlas/account/');
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await page.getByText('Privacy', { exact: true }).click();
  const consent = page.getByRole('checkbox', {
    name: 'Share minimal usage to help improve atlas',
  });
  await expect(consent).not.toBeChecked();
  expect(captured).toHaveLength(0);
  await consent.check();
  await page.keyboard.press('Control+k');
  await expect(
    page.getByRole('dialog', { name: 'Search atlas', exact: true }),
  ).toBeVisible();
  const privateQuery = `synthetic-private-query-${randomUUID()}`;
  await page.locator('#atlas-search').fill(privateQuery);
  await page.clock.runFor(750);
  await expect
    .poll(() => captured.some((event) => event.type === 'search_zero_results'))
    .toBe(true);
  const search = captured.find((event) => event.type === 'search_performed');
  expect(search).toMatchObject({
    feature: 'search',
    resultBucket: '0',
    success: false,
  });
  expect(JSON.stringify(captured)).not.toContain(privateQuery);
  expect(
    captured.every(
      (event) =>
        !('query' in event) && !('answer' in event) && !('message' in event),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Close search', exact: true }).click();
  await page.goto('/atlas/courses/life-sciences/key-ideas/');
  await page.bringToFront();
  await expect(page.locator('.topbar')).toHaveAttribute('data-ready', 'true');
  await page.mouse.click(100, 160);
  await page.clock.runFor(15000);
  await expect
    .poll(() =>
      captured.some(
        (event) =>
          event.type === 'route_viewed' &&
          event.route === '/courses/life-sciences/key-ideas/' &&
          event.feature === 'key-ideas',
      ),
    )
    .toBe(true);
  await expect
    .poll(() => captured.some((event) => event.type === 'route_activity'))
    .toBe(true);
  // Synthetic browser visibility/focus conditions; server elapsed-time limits are tested independently.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.hasFocus = () => false;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const beforeHidden = captured.filter(
    (event) => event.type === 'route_activity',
  ).length;
  await page.clock.runFor(60000);
  expect(
    captured.filter((event) => event.type === 'route_activity'),
  ).toHaveLength(beforeHidden);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.hasFocus = () => true;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(120000);
  const afterIdle = captured.filter(
    (event) => event.type === 'route_activity',
  ).length;
  await page.clock.runFor(60000);
  expect(
    captured.filter((event) => event.type === 'route_activity'),
  ).toHaveLength(afterIdle);
  expect(JSON.stringify(captured)).not.toContain(privateQuery);
});
