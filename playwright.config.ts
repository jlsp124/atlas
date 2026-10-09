import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';
const adminPassword =
  process.env.ATLAS_TEST_ADMIN_PASSWORD ||
  randomBytes(24).toString('base64url');
process.env.ATLAS_TEST_ADMIN_PASSWORD = adminPassword;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321/atlas/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1365, height: 900 } },
    },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: [
    {
      command: 'npx tsx scripts/test-server.ts',
      url: 'http://localhost:8790/health',
      env: { NODE_ENV: 'test', ATLAS_TEST_ADMIN_PASSWORD: adminPassword },
      reuseExistingServer: false,
    },
    {
      // Exercise the production bundles and CSS, with an isolated test API.
      command:
        'npx astro build --outDir .atlas-test-dist && npx pagefind --site .atlas-test-dist && npx astro preview --outDir .atlas-test-dist --host 127.0.0.1 --port 4321 --ignore-lock',
      url: 'http://localhost:4321/atlas/',
      env: { PUBLIC_API_URL: 'http://localhost:8790', NODE_ENV: 'production' },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run preview -- --port 4322 --ignore-lock',
      url: 'http://localhost:4322/atlas/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
