import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'

// SVG 원본을 PNG로 렌더링합니다. 브라우저 설치: npx playwright install chromium
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const svg = await readFile(new URL('../public/images/og.svg', import.meta.url), 'utf8')
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`)
  await page.screenshot({ path: 'public/images/og.png' })
} finally {
  await browser.close()
}
