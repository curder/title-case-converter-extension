import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // 扩展运行在同一个 persistent context 中，用例串行执行
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 30_000,
  reporter: 'list',
  webServer: {
    command: 'node e2e/server.mjs',
    url: 'http://127.0.0.1:4173/form.html',
    reuseExistingServer: !process.env.CI,
  },
});
