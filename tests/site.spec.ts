import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { contentSchema, publicContent } from '../shared/content'

const content = publicContent(contentSchema.parse(JSON.parse(readFileSync('content/site.json', 'utf8'))))

test('page layout, assets, links and accessibility', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
  await expect(page).toHaveTitle(`${content.profile.name} · ${content.profile.role}`)
  await expect(page.locator('.ptab')).toHaveCount(content.projects.length)
  await expect(page.locator('.prow')).toHaveCount(content.projects.length + (content.openSource.contributions.length > 0 ? 1 : 0))
  await expect(page.locator('.shot')).toHaveCount(content.projects[0]?.image ? 1 : 0)
  // Media fields are all unset in the current production content, so their regions must not render at all.
  await expect(page.locator('.card img.avatar')).toHaveCount(content.profile.photo.image ? 1 : 0)
  await expect(page.locator('.card .avatar:not(img)')).toHaveCount(content.profile.photo.image ? 0 : 1)
  await expect(page.getByRole('link', { name: /포트폴리오 PDF/ })).toHaveCount(content.profile.portfolio.url ? 2 : 0)
  await expect(page.locator('.shots')).toHaveCount((content.projects[0]?.screenshots.length ?? 0) > 0 ? 1 : 0)
  await expect(page.locator('.docs')).toHaveCount((content.projects[0]?.documents.length ?? 0) > 0 ? 1 : 0)

  // Scroll normally through the complete page to load deferred images and reveal content.
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let position = 0; position < height; position += 550) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), position)
    await page.waitForTimeout(80)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(800)
  const layout = await page.evaluate(() => {
    const width = document.documentElement.clientWidth
    return {
      overflow: document.documentElement.scrollWidth > width,
      outside: [...document.querySelectorAll('main h1, main h2, main h3, main p, main img, main a')].filter((node) => {
        const rect = node.getBoundingClientRect()
        return rect.width > 0 && (rect.right > width + 1 || rect.left < -1)
      }).map((node) => node.textContent || node.getAttribute('src')),
      missingImages: [...document.images].filter((img) => img.getBoundingClientRect().width > 0 && (!img.complete || img.naturalWidth === 0)).map((img) => img.src),
      brokenAnchors: [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter((link) => !document.getElementById(link.hash.slice(1))).map((link) => link.hash),
      blankLinks: [...document.querySelectorAll('a')].filter((link) => !link.getAttribute('href')?.trim()).length,
      unsafeLinks: [...document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')].filter((link) => !link.rel.includes('noopener') || !link.rel.includes('noreferrer')).length,
    }
  })
  expect(layout).toEqual({ overflow: false, outside: [], missingImages: [], brokenAnchors: [], blankLinks: 0, unsafeLinks: 0 })
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0)
  await expect(page.locator('a[href*="manage"], a[href*="auth/"], a[href*="private-assets"]')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
  await page.screenshot({ path: `docs/screenshots/redesign/${testInfo.project.name}-full.png`, fullPage: true })
  await page.screenshot({ path: `docs/screenshots/redesign/${testInfo.project.name}-hero.png` })
})

test('keyboard navigation, mobile menu and active section', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: '본문으로 바로가기' })
  await expect(skip).toBeFocused()
  expect(await skip.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  const mobile = (page.viewportSize()?.width ?? 1440) < 760
  if (mobile) {
    const toggle = page.getByRole('button', { name: /메뉴 (열기|닫기)/ })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('Enter')
  }
  // The desktop nav persists in the DOM (hidden via CSS) even when the mobile panel is open,
  // so active-section assertions always read it; only the click target differs by viewport.
  const desktopNav = page.locator('nav[aria-label="주요 섹션"]')
  const clickTarget = (mobile ? page.locator('#mobile-menu') : desktopNav).locator('a[href="#projects"]')
  await clickTarget.click()
  await expect(page).toHaveURL(/#projects$/)
  if (mobile) {
    await expect(page.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#projects')).toBeFocused()
  }
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
  await expect(desktopNav.locator('a[href="#projects"]')).toHaveAttribute('aria-current', 'location')
  const projectsTop = await page.locator('#projects').evaluate((node) => node.getBoundingClientRect().top)
  expect(projectsTop).toBeGreaterThanOrEqual(64)
  await page.locator('#contact').evaluate((node) => node.scrollIntoView({ behavior: 'instant' }))
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
  await expect(desktopNav.locator('a[href="#contact"]')).toHaveAttribute('aria-current', 'location')
  await page.getByRole('link', { name: '맨 위로 ↑' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100)
})

test('reduced motion keeps content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(await page.locator('.enter').first().evaluate((node) => getComputedStyle(node).animationName)).toBe('none')
  expect(await page.locator('html').evaluate((node) => getComputedStyle(node).scrollBehavior)).toBe('auto')
  const sections = ['projects', 'about', 'contact']
  if (content.openSource.contributions.length) sections.push('oss')
  if (content.activities.length) sections.push('activity')
  for (const section of sections) {
    const target = page.locator(`#${section}`)
    await target.scrollIntoViewIfNeeded()
    await expect(target).toBeVisible()
  }
})
