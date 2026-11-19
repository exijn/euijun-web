import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { readFileSync, readdirSync } from 'node:fs'
import { contentSchema, publicContent } from '../../shared/content.ts'
import { renderMetadata } from '../../shared/metadata.ts'
import { ContentService, prepare } from '../../server/content-service.ts'
import { GitHub } from '../../server/github.ts'
import { initialContent, mockGitHub, testConfig, testBlobToken, testBlobHost } from '../fixtures/github.ts'

type DraftUpload = { kind: string; projectId?: string; screenshotId?: string; data: string }
function fixture() {
  const mock = mockGitHub()
  const github = new GitHub(testConfig, mock.fetcher)
  const service = new ContentService(github, testConfig, testBlobToken, mock.fetcher)
  const content = structuredClone(initialContent); content.profile.tagline = '수정한 소개 문구'
  return { ...mock, github, service, draft: { baseSha: mock.state.head, content, uploads: [] as DraftUpload[] } }
}

test('metadata escapes edited content, preserves dollar strings, removes empty contact links', () => {
  const profile = { ...initialContent.profile, name: '<script>$&</script>', tagline: '$1 & "소개"', email: '', github: '' }
  const html = renderMetadata(readFileSync('index.html', 'utf8'), profile)
  assert.ok(html.includes('&lt;script&gt;$&amp;&lt;/script&gt;'))
  assert.ok(html.includes('$1 &amp; &quot;소개&quot;'))
  assert.doesNotMatch(html, /mailto:|hanej090224@gmail.com/)
  const data = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]
  assert.deepEqual(JSON.parse(data).sameAs, [])
  assert.doesNotMatch(data, /<script>/)
})
test('production metadata and sitemap use the configured domain', () => {
  const { profile } = contentSchema.parse(JSON.parse(readFileSync('content/site.json', 'utf8')))
  const html = readFileSync('dist/index.html', 'utf8')
  const person = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])
  assert.equal(person.url, profile.website)
  assert.ok(html.includes(`rel="canonical" href="${profile.website}/"`))
  assert.ok(html.includes(`property="og:url" content="${profile.website}/"`))
  assert.ok(html.includes(`property="og:image" content="${profile.website}/images/og.png"`))
  assert.ok(readFileSync('dist/robots.txt', 'utf8').includes(`${profile.website}/sitemap.xml`))
  assert.ok(readFileSync('dist/sitemap.xml', 'utf8').includes(`<loc>${profile.website}/</loc>`))
})
test('runtime schema rejects scripts in links, unknown fields, traversal, duplicate IDs', () => {
  const content = structuredClone(initialContent)
  content.profile.github = 'javascript:alert(1)'; assert.equal(contentSchema.safeParse(content).success, false)
  content.profile.github = initialContent.profile.github
  content.projects[0].image = '/images/projects/../../secret.png'; assert.equal(contentSchema.safeParse(content).success, false)
  content.projects[0].image = ''
  content.projects.push(content.projects[0]); assert.equal(contentSchema.safeParse(content).success, false)
  assert.equal(contentSchema.safeParse({ ...initialContent, token: 'secret' }).success, false)
  assert.equal(contentSchema.safeParse({ ...initialContent, profile: { ...initialContent.profile, website: 'not-a-url' } }).success, false)
})
test('screenshots cap at 4, require alt, reject http documents and non-blob portfolio URLs', () => {
  const content = structuredClone(initialContent)
  const shot = { id: 'shot-1', published: true, image: '', alt: '화면', caption: '' }
  content.projects[0].screenshots = [shot, shot, shot, shot]
  assert.equal(contentSchema.safeParse(content).success, false, 'duplicate ids among 4 should fail first')
  content.projects[0].screenshots = [0, 1, 2, 3].map((i) => ({ ...shot, id: `shot-${i}` }))
  assert.equal(contentSchema.safeParse(content).success, true)
  content.projects[0].screenshots.push({ ...shot, id: 'shot-5' })
  assert.equal(contentSchema.safeParse(content).success, false, 'a 5th screenshot should be rejected')
  content.projects[0].screenshots = [{ ...shot, alt: '' }]
  assert.equal(contentSchema.safeParse(content).success, false, 'empty alt should be rejected')
  content.projects[0].screenshots = []
  content.projects[0].documents = [{ id: 'doc-1', published: true, label: '문서', url: 'http://example.com/doc' }]
  assert.equal(contentSchema.safeParse(content).success, false, 'http document URL should be rejected')
  content.projects[0].documents = [{ id: 'doc-1', published: true, label: '문서', url: 'https://example.com/doc' }]
  assert.equal(contentSchema.safeParse(content).success, true)
  content.projects[0].documents = []
  content.profile.portfolio = { label: '포트폴리오', url: 'https://example.com/not-a-blob-host.pdf', updatedAt: '2026-01-01' }
  assert.equal(contentSchema.safeParse(content).success, false, 'a non-blob-host portfolio URL should be rejected')
  content.profile.portfolio = { label: '포트폴리오', url: 'https://mystore.public.blob.vercel-storage.com/portfolio/file.pdf', updatedAt: '2026-01-01' }
  assert.equal(contentSchema.safeParse(content).success, true)
})
test('unpublished and reverted data is removed before public bundling', () => {
  const content = structuredClone(initialContent)
  content.projects[0].published = false
  content.openSource.contributions[0].status = 'reverted'
  const result = publicContent(content)
  assert.equal(result.projects.some((item) => item.id === content.projects[0].id), false)
  assert.equal(result.openSource.contributions.some((item) => item.status === 'reverted'), false)
})
test('review then save creates a single atomic content tree and PR on discovered default branch', async () => {
  const { draft, service, state } = fixture()
  const review = await service.review(draft)
  assert.ok(review.changes.some((item) => item.path === 'profile.tagline'))
  const result = await service.save({ ...draft, reviewToken: review.reviewToken })
  assert.equal(result.phase, 'review')
  assert.equal(state.calls.find((call) => call.path === '/pulls')?.body.base, 'trunk')
  assert.equal(state.calls.filter((call) => call.path === '/git/trees').length, 1)
  assert.equal(state.calls.some((call) => call.method === 'PATCH'), false)
  const entries = state.calls.find((call) => call.path === '/git/trees')?.body.tree as { path: string }[]
  assert.deepEqual(entries.map((entry) => entry.path), ['content/site.json'])
})
test('concurrent edits and changed review payload never overwrite the latest branch', async () => {
  const { draft, service, state } = fixture()
  const review = await service.review(draft)
  draft.content.profile.name = '다른 이름'
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /다시 확인/)
  draft.content.profile.name = initialContent.profile.name
  state.head = 'b'.repeat(40)
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /기본 브랜치/)
  assert.equal(state.calls.some((call) => call.method === 'POST'), false)
})
test('branch change during Git object creation aborts before ref creation', async () => {
  const { draft, service, state } = fixture()
  const review = await service.review(draft)
  state.advanceAt = 3
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /기본 브랜치/)
  assert.equal(state.refs.size, 0)
})
test('GitHub failure is surfaced and never reported as success', async () => {
  const { draft, service, state } = fixture()
  const review = await service.review(draft)
  state.failPath = '/git/trees'
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /GitHub 요청 실패/)
  assert.equal(state.refs.size, 0)
})
test('PR failure leaves an explicit recoverable branch error; duplicate saves do not force update', async () => {
  const { draft, service, state } = fixture()
  const review = await service.review(draft)
  state.failPath = '/pulls'
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /브랜치.*생성/)
  assert.equal(state.refs.size, 1)
  state.failPath = ''
  await assert.rejects(service.save({ ...draft, reviewToken: review.reviewToken }), /GitHub 요청 실패/)
  assert.equal(state.calls.some((call) => call.method === 'PATCH'), false)
})
test('image upload checks file content, reencodes WebP and puts content+image in same commit', async () => {
  const { draft, service, state, fetcher } = fixture()
  draft.content.projects[0].imageAlt = '테스트 프로젝트 화면'
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#bbbbbb' } }).png().toBuffer()
  draft.uploads = [{ kind: 'projectImage', projectId: draft.content.projects[0].id, data: png.toString('base64') }]
  const prepared = await prepare(draft, testBlobToken, fetcher)
  assert.match(prepared.content.projects[0].image, /^\/images\/projects\/uploads\/[a-f0-9]{64}\.webp$/)
  assert.equal((await sharp(prepared.files[0].data).metadata()).format, 'webp')
  const review = await service.review(draft)
  await service.save({ ...draft, reviewToken: review.reviewToken })
  const tree = state.calls.find((call) => call.path === '/git/trees')?.body.tree as unknown[]
  assert.equal(tree.length, 2)
  draft.uploads[0].data = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')
  await assert.rejects(prepare(draft), /이미지 형식/)
})
test('profile photo and project screenshot uploads resize to their own bounds and land at the right content path', async () => {
  const { draft } = fixture()
  draft.content.profile.photo.alt = '프로필 사진'
  const landscapeShot = { id: 'shot-1', published: true, image: '', alt: '화면 1', caption: '' }
  draft.content.projects[0].screenshots = [landscapeShot]
  const photoPng = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#aabbcc' } }).png().toBuffer()
  const shotPng = await sharp({ create: { width: 800, height: 2400, channels: 3, background: '#112233' } }).png().toBuffer()
  draft.uploads = [
    { kind: 'profilePhoto', data: photoPng.toString('base64') },
    { kind: 'projectScreenshot', projectId: draft.content.projects[0].id, screenshotId: 'shot-1', data: shotPng.toString('base64') },
  ]
  const prepared = await prepare(draft)
  assert.match(prepared.content.profile.photo.image, /^\/images\/profile\/uploads\/[a-f0-9]{64}\.webp$/)
  const photoMeta = await sharp(prepared.files.find((f) => f.path.includes('/profile/'))!.data).metadata()
  assert.ok(photoMeta.width! <= 800 && photoMeta.height! <= 800)
  assert.match(prepared.content.projects[0].screenshots[0].image, /^\/images\/projects\/uploads\/[a-f0-9]{64}\.webp$/)
  const shotMeta = await sharp(prepared.files.find((f) => f.path.includes('/projects/'))!.data).metadata()
  // Portrait capture: the long edge (height) must be capped at 1600 while aspect ratio is preserved.
  assert.ok(shotMeta.height! <= 1600 && shotMeta.width! < shotMeta.height!)
})
test('uploads targeting the same screenshot or project twice in one save are rejected', async () => {
  const { draft } = fixture()
  draft.content.projects[0].screenshots = [{ id: 'shot-1', published: true, image: '', alt: 'a', caption: '' }]
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).png().toBuffer()
  const data = png.toString('base64')
  draft.uploads = [
    { kind: 'projectScreenshot', projectId: draft.content.projects[0].id, screenshotId: 'shot-1', data },
    { kind: 'projectScreenshot', projectId: draft.content.projects[0].id, screenshotId: 'shot-1', data },
  ]
  await assert.rejects(prepare(draft), /중복/)
})
test('portfolio URL is verified against the configured blob store before it is accepted', async () => {
  const { draft, service, state } = fixture()
  draft.content.profile.portfolio = { label: '포트폴리오', url: `https://${testBlobHost}/portfolio/portfolio.pdf`, updatedAt: '2026-01-01' }
  const review = await service.review(draft)
  assert.ok(review.changes.some((item) => item.path === 'profile.portfolio.url'))
  await service.save({ ...draft, reviewToken: review.reviewToken })
  state.portfolioPdfValid = false
  const draft2 = { ...draft, content: structuredClone(draft.content) }
  draft2.content.profile.portfolio.url = `https://${testBlobHost}/portfolio/other.pdf`
  draft2.baseSha = state.head
  await assert.rejects(service.review(draft2), /유효한 PDF/)
})
test('a portfolio URL is rejected outright when no blob store is configured', async () => {
  const { draft, fetcher } = fixture()
  draft.content.profile.portfolio = { label: '포트폴리오', url: `https://${testBlobHost}/portfolio/portfolio.pdf`, updatedAt: '2026-01-01' }
  await assert.rejects(prepare(draft, null, fetcher), /설정되지 않아/)
})
test('merge and deployment are distinguished; absent records never mean deployed', async () => {
  const { github, state } = fixture()
  assert.equal((await github.status(42)).phase, 'review')
  state.merged = true
  assert.equal((await github.status(42)).phase, 'merged')
  state.deployment = 'pending'
  assert.equal((await github.status(42)).phase, 'deploying')
  state.deployment = 'success'
  assert.equal((await github.status(42)).phase, 'deployed')
  state.deployment = 'failure'
  assert.equal((await github.status(42)).phase, 'failed')
})
test('production public artifacts contain no private routes, schema validator or secrets', () => {
  const files = readdirSync('dist/assets').filter((name) => name.endsWith('.js'))
  const bundle = files.map((name) => readFileSync('dist/assets/' + name, 'utf8')).join('\n')
  assert.doesNotMatch(bundle, /\/api\/manage|\/private-assets|GITHUB_CONTENT_TOKEN|GITHUB_CLIENT_SECRET|SESSION_SECRET|변경 내용 검토|fixture-repo-token/)
  for (const file of ['dist/index.html', 'dist/robots.txt', 'dist/sitemap.xml']) assert.doesNotMatch(readFileSync(file, 'utf8'), /manage|private-assets|auth\/github/)
  assert.ok(readdirSync('.private/assets').some((name) => name.endsWith('.js')))
})
test('the Vercel function bundle is self-contained: no unresolved local .ts imports, deps left external, no secrets', () => {
  const bundle = readFileSync('api/index.js', 'utf8')
  // Relative imports with an explicit .ts extension are exactly what breaks Vercel's Node function
  // builder (it transpiles files but doesn't rewrite .ts extensions in import specifiers, so the
  // compiled output ends up requiring a file that no longer exists). The bundle must contain none.
  assert.doesNotMatch(bundle, /from ["']\.\.?\/[^"']*\.ts["']/)
  // The server's own code (not just its export) must actually be inlined, not just re-exported.
  assert.match(bundle, /createHandler/)
  assert.match(bundle, /verifyPortfolioUrl|portfolioUploadConstraints/)
  // npm dependencies stay external so Vercel traces them from node_modules (sharp needs its native
  // platform binary, which a bundler cannot inline).
  for (const dep of ['"sharp"', '"zod"', '"@vercel/blob/client"']) assert.match(bundle, new RegExp(`from ${dep}`))
  // process.env.GITHUB_CONTENT_TOKEN etc. (the var *names*) are expected — the server reads them at
  // runtime. Only a literal secret *value* (e.g. a test fixture) leaking in would be a real problem.
  assert.doesNotMatch(bundle, /fixture-repo-token|fixture-oauth-secret/)
})
