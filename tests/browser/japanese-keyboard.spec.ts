import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { japaneseWords } from '../../src/content/japanese';

async function openReview(
  page: Page,
  mode: string,
  script = 'kana',
  sets = 'colors,shapes',
) {
  await page.goto(`/atlas/courses/japanese/?view=review&sets=${sets}`);
  await expect(page.locator('main astro-island[ssr]')).toHaveCount(0);
  await page.getByRole('button', { name: mode, exact: true }).click();
  if (mode === 'Type Japanese')
    await page.getByLabel('Type with').selectOption(script);
  await page.getByRole('button', { name: 'Start review', exact: true }).click();
  await expect(page.locator('.jp-review-session')).toBeVisible();
}
async function viewport(page: Page, height: number, top = 12) {
  await page.evaluate(
    ({ height, top }) => {
      (
        window as unknown as {
          setReviewViewport: (h: number, t: number) => void;
        }
      ).setReviewViewport(height, top);
    },
    { height, top },
  );
  await expect(page.locator('.jp-review-session')).toHaveCSS(
    'height',
    `${height}px`,
  );
  await expect(page.locator('.jp-review-session')).toHaveCSS('top', `${top}px`);
}
async function visibleAboveKeyboard(page: Page, height: number, top = 12) {
  for (const selector of [
    '.jp-review-question',
    '#jp-answer',
    '.jp-review-controls',
  ]) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box!.y, selector).toBeGreaterThanOrEqual(top);
    expect(box!.y + box!.height, selector).toBeLessThanOrEqual(
      top + height + 1,
    );
    expect(box!.height, selector).toBeGreaterThan(15);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

test('a complete typed review preserves its input, focus and geometry above a simulated iPhone keyboard', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    let height = innerHeight,
      top = 0;
    const view = new EventTarget();
    Object.defineProperties(view, {
      height: { get: () => height },
      offsetTop: { get: () => top },
      width: { get: () => innerWidth },
      scale: { get: () => 1 },
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: view,
    });
    Object.assign(window, {
      setReviewViewport: (h: number, t: number) => {
        height = h;
        top = t;
        view.dispatchEvent(new Event('resize'));
        view.dispatchEvent(new Event('scroll'));
      },
      answerBlurs: 0,
    });
    document.addEventListener('focusout', (e) => {
      if ((e.target as HTMLElement)?.id === 'jp-answer') {
        const current = window as unknown as { answerBlurs: number };
        current.answerBlurs++;
      }
    });
  });
  for (const variant of [
    { mode: 'Type Japanese', script: 'kana' },
    { mode: 'Type Japanese', script: 'romaji' },
    { mode: 'Japanese → English', script: 'kana' },
    { mode: 'Type Japanese', script: 'romaji', sets: 'greetings' },
    { mode: 'Japanese → English', script: 'kana', sets: 'greetings' },
  ]) {
    await openReview(page, variant.mode, variant.script, variant.sets);
    const input = page.locator('#jp-answer');
    await expect(input).toBeFocused();
    await input.evaluate((node) =>
      Object.assign(window, { originalAnswerInput: node }),
    );
    await viewport(page, 355);
    await visibleAboveKeyboard(page, 355);
    await viewport(page, 355, 32);
    await visibleAboveKeyboard(page, 355, 32);
    await expect(input).toBeFocused();
    await viewport(page, 355);
    const inputY = (await input.boundingBox())!.y;
    const questionY = (await page.locator('.jp-review-question').boundingBox())!
      .y;
    const scroll = await page.evaluate(() => scrollY);
    let cards = 0;
    while (await page.locator('.jp-review-session').count()) {
      const id = await page
        .locator('.jp-review-session')
        .getAttribute('data-word');
      const word = japaneseWords.find((w) => w.id === id)!;
      await expect(input).toBeFocused();
      await expect(input).toBeEnabled();
      expect(await input.getAttribute('readonly')).toBeNull();
      expect(
        await input.evaluate(
          (node) =>
            node ===
            (window as unknown as { originalAnswerInput: HTMLElement })
              .originalAnswerInput,
        ),
      ).toBe(true);
      expect((await input.boundingBox())!.y).toBeCloseTo(inputY, 0);
      expect(
        (await page.locator('.jp-review-question').boundingBox())!.y,
      ).toBeCloseTo(questionY, 0);
      expect(
        await page
          .locator('.jp-review-question')
          .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(scroll);
      await input.fill(
        variant.mode === 'Japanese → English'
          ? word.englishAnswers[0]
          : variant.script === 'romaji'
            ? word.romaji.split(' / ')[0]
            : word.alternatives[0],
      );
      if (cards % 2) await input.press('Enter');
      else {
        const button = page.getByRole('button', { name: 'Check', exact: true });
        if (info.project.name === 'phone') await button.tap();
        else await button.click();
      }
      await expect(page.locator('.jp-review-answer')).toContainText(
        'That’s right',
      );
      await expect(input).toBeFocused();
      await expect(input).toBeEnabled();
      await visibleAboveKeyboard(page, 355);
      expect((await input.boundingBox())!.y).toBeCloseTo(inputY, 0);
      expect(
        await page.evaluate(
          () => (window as unknown as { answerBlurs: number }).answerBlurs,
        ),
      ).toBe(0);
      if (cards === 0) {
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
        ).toEqual([]);
        await page.screenshot({
          path: info.outputPath(
            `keyboard-${variant.mode === 'Japanese → English' ? 'english' : variant.script}.png`,
          ),
        });
      }
      const rating = page.getByRole('button', {
        name: cards === 0 ? 'Hard' : 'Easy',
        exact: true,
      });
      if (info.project.name === 'phone') await rating.tap();
      else await rating.click();
      cards++;
      expect(cards).toBeLessThanOrEqual(13);
    }
    expect(cards).toBe(13); // One hard card returns without remounting the input.
    await expect(page.locator('.jp-review-finished')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-japanese-review',
      'open',
    );
    await expect(
      page.getByRole('navigation', { name: 'Japanese sections' }),
    ).toBeVisible();
  }
});

test('viewport panning, IME confirmation, reveal and the no-VisualViewport fallback preserve review focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.addInitScript(() =>
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    }),
  );
  await openReview(page, 'Type Japanese', 'kana', 'vowels');
  await page.setViewportSize({ width: 375, height: 340 });
  await expect(page.locator('.jp-review-session')).toHaveCSS('height', '340px');
  await visibleAboveKeyboard(page, 340, 0);
  const input = page.locator('#jp-answer');
  await input.dispatchEvent('compositionstart');
  await input.fill('あ');
  await input.press('Enter');
  await expect(page.locator('.jp-review-answer')).not.toContainText(
    'That’s right',
  );
  await input.dispatchEvent('compositionend');
  await input.press('Enter');
  await expect(page.locator('.jp-review-answer')).toContainText('That’s right');
  await expect(input).toBeFocused();
  await page.getByRole('button', { name: 'Okay', exact: true }).click();
  await expect(input).toBeFocused();
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await expect(input).toBeFocused();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await expect(input).toBeFocused();
  await visibleAboveKeyboard(page, 340, 0);
  await page.getByRole('button', { name: 'End review', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-japanese-review',
    'open',
  );
  await expect(page.locator('.jp-review-setup')).toBeVisible();
});

test('recognition and English to Japanese finish on a narrow phone without hiding the prompt or choices', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 667 });
  for (const mode of ['Recognition', 'English → Japanese']) {
    await openReview(page, mode, 'kana', 'vowels');
    for (let card = 0; card < 5; card++) {
      const id = await page
        .locator('.jp-review-session')
        .getAttribute('data-word');
      const word = japaneseWords.find((w) => w.id === id)!;
      await expect(page.locator('.jp-review-question')).toBeInViewport({
        ratio: 1,
      });
      await expect(page.locator('.jp-review-choices')).toBeInViewport({
        ratio: 1,
      });
      const correct = mode === 'Recognition' ? word.meaning : word.japanese;
      await page
        .locator('.jp-review-choices button')
        .filter({ hasText: correct })
        .click();
      await expect(page.locator('.jp-review-answer')).toContainText(
        'That’s right',
      );
      await page.getByRole('button', { name: 'Easy', exact: true }).click();
    }
    await expect(page.locator('.jp-review-finished')).toBeVisible();
  }
});
