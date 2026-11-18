import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { random, seal, SESSION_COOKIE } from '../server/security'
import { testConfig } from './fixtures/github'

const png = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#bbbbbb' } }).png().toBuffer()

test('private editor: keyboard, validation, CRUD, ordering, preview, review and GitHub PR', async ({ page, context }, testInfo) => {
  const now = Date.now()
  await context.addCookies([{ name: SESSION_COOKIE, value: seal({ id: testConfig.ownerId, login: 'exijn', csrf: random(), issued: now, expires: now + 3600000 }, 'session', testConfig), domain: 'localhost', path: '/', secure: true, httpOnly: true, sameSite: 'Lax' }])
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/manage')
  await expect(page.getByLabel('이름', { exact: true })).toHaveValue('한의준')
  await page.getByLabel('이름', { exact: true }).focus()
  expect(await page.getByLabel('이름', { exact: true }).evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid')
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('')
  await page.getByLabel('이름', { exact: true }).fill('')
  await page.getByRole('button', { name: '변경 내용 검토', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('필수 항목')
  await page.getByLabel('이름', { exact: true }).fill('한의준')
  await page.getByLabel('첫 소개 문장').fill('테스트 소개 ' + testInfo.project.name)
  if (testInfo.project.name === '1440px') {
    await expect(page.getByLabel('PDF 업로드', { exact: true })).toBeVisible()
    await expect(page.getByText('스토리지 미설정')).toHaveCount(0)
    await page.getByLabel('사진 설명 (alt)', { exact: true }).fill('증명사진')
    await page.getByLabel('사진 업로드', { exact: true }).setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: await png(8, 8) })
    await expect(page.locator('.upload-field').filter({ hasText: '증명사진' })).toContainText('새 사진 선택됨')
  }
  await page.getByRole('button', { name: '프로젝트', exact: true }).click()
  await page.getByRole('button', { name: '+ 프로젝트 추가', exact: true }).click()
  const fourth = page.locator('.editor-item').nth(3)
  await fourth.getByLabel('프로젝트명', { exact: true }).fill('초안 프로젝트')
  await fourth.getByLabel('공개', { exact: true }).check()
  await expect(fourth.getByLabel('공개', { exact: true })).toBeChecked()
  page.once('dialog', (dialog) => dialog.dismiss())
  await fourth.getByRole('button', { name: '삭제', exact: true }).click()
  await expect(page.locator('.editor-item')).toHaveCount(4)
  page.once('dialog', (dialog) => dialog.accept())
  await fourth.getByRole('button', { name: '삭제', exact: true }).click()
  await expect(page.locator('.editor-item')).toHaveCount(3)
  await page.getByRole('button', { name: '프로젝트 2 아래로' }).click()
  await expect(page.locator('.editor-item').nth(1).getByLabel('프로젝트명', { exact: true })).toHaveValue('Washer')
  await page.getByRole('button', { name: '프로젝트 3 위로' }).click()
  if (testInfo.project.name === '375px') {
    const first = page.locator('.editor-item').first()
    await first.getByLabel('이미지 설명 (alt)', { exact: true }).fill('업로드 검증용 이미지')
    const buffer = await png(8, 8)
    await first.getByLabel('프로젝트 16:9 이미지 업로드', { exact: true }).setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer })
    await expect(first).toContainText('새 이미지 선택됨')
  }
  if (testInfo.project.name === '1440px') {
    // GOMS stays the first project through the reorder-then-unreorder above, and is selected by
    // default in the preview, so its screenshot/document show up without picking a project tab.
    const first = page.locator('.editor-item').first()
    await first.getByRole('button', { name: '+ 캡처 추가', exact: true }).click()
    await first.getByLabel('화면 설명 (alt)', { exact: true }).fill('세로 캡처 화면')
    await first.getByLabel('캡처 이미지 선택', { exact: true }).setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: await png(9, 16) })
    await expect(first).toContainText('새 이미지 선택됨')
    await first.getByRole('button', { name: '+ 문서 추가', exact: true }).click()
    await first.getByLabel('문서 이름', { exact: true }).fill('기능 명세 문서')
    await first.getByLabel('문서 URL (https://)', { exact: true }).fill('https://example.com/docs/goms')
  }
  await page.getByRole('button', { name: '변경 미리보기', exact: true }).click()
  await expect(page.getByRole('region', { name: '공개 화면 미리보기' })).toContainText('테스트 소개 ' + testInfo.project.name)
  if (testInfo.project.name === '375px') await expect(page.getByAltText('업로드 검증용 이미지')).toBeVisible()
  if (testInfo.project.name === '1440px') {
    const previewRegion = page.getByRole('region', { name: '공개 화면 미리보기' })
    await expect(previewRegion.locator('img.avatar')).toBeVisible()
    await expect(previewRegion.locator('.shot-thumb')).toHaveCount(1)
    await expect(previewRegion.getByRole('link', { name: /기능 명세 문서/ })).toHaveAttribute('href', 'https://example.com/docs/goms')
    await previewRegion.locator('.shot-thumb').click()
    const lightbox = previewRegion.locator('dialog.lightbox')
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByAltText('세로 캡처 화면')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(lightbox).toBeHidden()
  }
  await page.getByRole('button', { name: '편집으로 돌아가기' }).click()
  await page.getByRole('button', { name: '소개·연락처', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  await page.screenshot({ path: `docs/screenshots/redesign/${testInfo.project.name}-editor.png`, fullPage: true })
  await page.getByRole('button', { name: '변경 내용 검토', exact: true }).click()
  await expect(page.getByRole('heading', { name: '저장 전 변경 확인' })).toBeVisible()
  await page.getByText('profile.tagline', { exact: true }).click()
  await expect(page.locator('.review-panel')).toContainText('테스트 소개 ' + testInfo.project.name)
  await page.getByRole('button', { name: '확인하고 PR 만들기' }).click()
  await expect(page.getByRole('region', { name: '저장 결과' }).or(page.locator('.save-result'))).toContainText('변경 PR을 만들었습니다')
  await page.getByRole('button', { name: '배포 상태 확인' }).click()
  await expect(page.locator('.save-result')).toContainText('아직 공개 사이트에 반영되지 않았습니다')
  expect(errors).toEqual([])
})

test('unauthenticated editor renders only minimal entry and no private JavaScript', async ({ page, request }) => {
  const loaded: string[] = []
  page.on('request', (req) => loaded.push(req.url()))
  await page.goto('/manage')
  await expect(page.getByRole('link', { name: 'GitHub로 계속' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '콘텐츠 관리' })).toHaveCount(0)
  expect(loaded.some((url) => url.includes('private-assets'))).toBe(false)
  expect((await request.get('/api/manage/content')).status()).toBe(404)
})
