import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const origin = process.env.ATLAS_QA_ORIGIN ?? 'http://127.0.0.1:4331/atlas/';
const directory = 'evidence/v3-visual';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const sizes = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];
const scenes = [
  { id: 'home', path: '' },
  { id: 'physics-course', path: 'courses/physics/' },
  { id: 'physics-unit', path: 'courses/physics/units/kinematics/' },
  { id: 'kinematics-overview', path: 'work/kinematics-review/' },
  {
    id: 'dropped-clue',
    path: 'work/kinematics-review/?focus=1#q-10',
    help: true,
    next: 0,
  },
  {
    id: 'dropped-knowns',
    path: 'work/kinematics-review/?focus=1#q-10',
    help: true,
    next: 4,
  },
  {
    id: 'formula-transform',
    path: 'work/kinematics-review/?focus=1#q-11',
    help: true,
    next: 6,
  },
  {
    id: 'substitution',
    path: 'work/kinematics-review/?focus=1#q-11',
    help: true,
    next: 7,
  },
  {
    id: 'student-turn',
    path: 'work/kinematics-review/?focus=1#q-11',
    help: true,
    next: 8,
  },
  { id: 'bio-c17', path: 'courses/life-sciences/units/origins/' },
  {
    id: 'bio-written',
    path: 'work/bio-c17-sections/?focus=1#q-17-2-4',
    help: true,
    next: 2,
  },
  {
    id: 'bio-layers',
    path: 'work/bio-c17-notes/?focus=1#reading-2',
    help: true,
    next: 2,
  },
  {
    id: 'chem-conversion',
    path: 'work/chemistry-hebden-conversions/?focus=1#q-16c',
    help: true,
    next: 2,
  },
  {
    id: 'chem-lewis',
    path: 'work/chemistry-hebden-lewis/?focus=1#q-86',
    help: true,
    next: 3,
  },
  {
    id: 'japanese-phrase',
    path: 'work/greetings-practice/?focus=1#q-4',
    help: true,
    next: 2,
  },
  {
    id: 'japanese-kana',
    path: 'work/japanese-kana/?focus=1#reading-0',
    strokes: 2,
  },
];
const receipts: {
  file: string;
  scene: string;
  width: number;
  theme: string;
  reduced: boolean;
  overflow: boolean;
  nodes: number;
}[] = [];
const errors: string[] = [];
for (const size of sizes)
  for (const theme of ['light', 'dark'] as const) {
    const context = await browser.newContext({
      viewport: size,
      colorScheme: theme,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
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
      localStorage.removeItem('atlas:theme');
    });
    page.on('pageerror', (e) => errors.push(e.message));
    for (const reduced of [false, true]) {
      if (reduced && ![1440, 360].includes(size.width)) continue;
      await page.emulateMedia({
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      for (const scene of scenes) {
        await page.goto(origin + scene.path);
        // A repeated exact URL is a same-document navigation. Reload so the
        // fresh guest setup also resets guide position for each QA scene.
        await page.reload();
        await page.locator('.topbar[data-ready=true]').waitFor();
        if (scene.help) {
          await page
            .getByRole('button', { name: /^(Help me start|Explain this)$/ })
            .click();
          for (let i = 0; i < (scene.next ?? 0); i++)
            await page
              .getByRole('button', { name: 'Next step', exact: true })
              .click();
        }
        if (scene.strokes) {
          await page
            .getByRole('button', { name: 'Start', exact: true })
            .click();
          for (let i = 0; i < scene.strokes; i++)
            await page
              .getByRole('button', { name: 'Next stroke', exact: true })
              .click();
        }
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await page.waitForTimeout(reduced ? 60 : 480);
        if (scene.help || scene.strokes)
          await page
            .locator('.focus-meta')
            .evaluate((el) =>
              scrollTo(0, el.getBoundingClientRect().top + scrollY - 20),
            );
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          nodes: document.querySelectorAll('*').length,
        }));
        const file = `${scene.id}-${size.width}-${theme}${reduced ? '-reduced' : ''}.png`;
        await page.screenshot({ path: `${directory}/${file}` });
        receipts.push({
          file,
          scene: scene.id,
          width: size.width,
          theme,
          reduced,
          ...metrics,
        });
      }
    }
    await context.close();
    console.log(`Captured: ${size.width} × ${size.height}, ${theme}`);
  }
await browser.close();
await writeFile(
  `${directory}/receipts.json`,
  JSON.stringify({ origin, receipts, errors }, null, 2),
);
await writeFile(
  `${directory}/gallery.html`,
  `<!doctype html><html><meta charset="utf-8"><title>atlas V3 visual QA</title><style>body{background:#18191d;color:#efeee9;font:15px system-ui;margin:30px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:30px}img{width:100%;border:1px solid #555}a{color:inherit}p{font-size:12px}</style><h1>atlas V3 · ${receipts.length} captures</h1><main>${receipts.map((r) => `<a href="${r.file}"><img src="${r.file}"><p>${r.scene} · ${r.width} · ${r.theme}${r.reduced ? ' · reduced motion' : ''}</p></a>`).join('')}</main></html>`,
);
for (const width of [1440, 360])
  for (const theme of ['light', 'dark']) {
    const selected = receipts.filter(
      (r) => r.width === width && r.theme === theme && !r.reduced,
    );
    const thumbW = width === 360 ? 230 : 400,
      thumbH = width === 360 ? 511 : 250;
    const columns = 3,
      cellH = thumbH + 32;
    const composite = await Promise.all(
      selected.map(async (r, i) => ({
        input: await sharp(`${directory}/${r.file}`)
          .resize(thumbW, thumbH)
          .png()
          .toBuffer(),
        left: (i % columns) * thumbW,
        top: Math.floor(i / columns) * cellH,
      })),
    );
    await sharp({
      create: {
        width: columns * thumbW,
        height: Math.ceil(selected.length / columns) * cellH,
        channels: 3,
        background: '#666666',
      },
    })
      .composite(composite)
      .png()
      .toFile(`${directory}/contact-${width}-${theme}.png`);
  }
console.log(
  JSON.stringify({
    screenshots: receipts.length,
    errors,
    overflow: receipts.filter((r) => r.overflow),
    maxNodes: Math.max(...receipts.map((r) => r.nodes)),
  }),
);
