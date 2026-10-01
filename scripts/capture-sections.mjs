import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// 별도 터미널에서 npm run preview 실행 후 주요 섹션을 원본 크기로 캡처합니다.
const browser = await chromium.launch()
try {
  await mkdir('docs/screenshots/redesign', { recursive: true })
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await page.goto('http://127.0.0.1:4173')
    for (const [name, selector] of [
      ['project', '#work'], ['open-source', '#open-source'],
      ['activities', '#activities'], ['contact', '#contact'],
    ]) {
      await page.locator(selector).screenshot({
        path: `docs/screenshots/redesign/${width}px-${name}.png`,
        // 섹션 캡처 시 고정 헤더/skip link가 캡처 영역 위로 겹치지 않게 처리합니다.
        style: '.header, .skip-link { visibility: hidden !important; }',
      })
    }
    await page.close()
  }
} finally {
  await browser.close()
}
