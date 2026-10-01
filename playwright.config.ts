import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: ['site.spec.ts', 'admin.spec.ts'],
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4175', browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [320, 375, 768, 1024, 1440].map((width) => ({
    name: `${width}px`,
    use: { viewport: { width, height: width >= 1000 ? 1000 : 812 }, deviceScaleFactor: 1 },
  })),
  webServer: { command: 'node tests/fixture-server.ts', url: 'http://localhost:4175', reuseExistingServer: false },
})
