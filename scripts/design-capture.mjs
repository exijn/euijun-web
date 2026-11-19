// Standalone screenshot capture for the design-review baseline/after comparison.
// Not part of the committed test suite — run manually, output goes to docs/design-review/{before,after}.
import { createServer } from 'node:http'
import { chromium } from '@playwright/test'
import { createHandler } from '../server/app.ts'
import { mockGitHub, testConfig } from '../tests/fixtures/github.ts'
import { random, seal, SESSION_COOKIE } from '../server/security.ts'

const PORT = 4176
const stage = process.argv[2]
if (stage !== 'before' && stage !== 'after') {
  console.error('usage: node scripts/design-capture.mjs <before|after>')
  process.exit(1)
}

const { fetcher } = mockGitHub()
const server = createServer(createHandler({ config: testConfig, fetcher, blobToken: undefined })).listen(PORT, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))

const browser = await chromium.launch()
const outDir = `docs/design-review/${stage}`

const publicWidths = [320, 375, 390, 768, 1024, 1440]
for (const width of publicWidths) {
  const page = await browser.newPage({ viewport: { width, height: width >= 1000 ? 1000 : 812 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${outDir}/public-${width}.png`, fullPage: true })
  await page.close()
}

const adminWidths = [390, 1440]
for (const width of adminWidths) {
  const context = await browser.newContext({ viewport: { width, height: width >= 1000 ? 1000 : 812 }, deviceScaleFactor: 1 })
  const now = Date.now()
  await context.addCookies([{
    name: SESSION_COOKIE,
    value: seal({ id: testConfig.ownerId, login: 'exijn', csrf: random(), issued: now, expires: now + 3600000 }, 'session', testConfig),
    domain: 'localhost', path: '/', secure: true, httpOnly: true, sameSite: 'Lax',
  }])
  const page = await context.newPage()
  await page.goto(`http://localhost:${PORT}/manage`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${outDir}/admin-${width}.png`, fullPage: true })
  await context.close()
}

await browser.close()
server.close()
console.log(`Captured ${stage} screenshots into ${outDir}/`)
