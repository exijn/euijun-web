import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { readFileSync, readdirSync } from 'node:fs'
import { contentSchema, publicContent } from '../../shared/content.ts'
import { renderMetadata } from '../../shared/metadata.ts'
import { ContentService, prepare } from '../../server/content-service.ts'
import { GitHub } from '../../server/github.ts'
import { initialContent, mockGitHub, testConfig } from '../fixtures/github.ts'

function fixture() {
  const mock = mockGitHub()
  const github = new GitHub(testConfig, mock.fetcher)
  const service = new ContentService(github, testConfig)
  const content = structuredClone(initialContent); content.profile.tagline = '수정한 소개 문구'
  return { ...mock, github, service, draft: { baseSha: mock.state.head, content, uploads: [] as { projectId: string; data: string }[] } }
}

test('metadata escapes edited content, preserves dollar strings, removes empty contact links', () => {
  const profile = { ...initialContent.profile, name: '<script>$&</script>', tagline: '$1 & "소개"', email: '', github: '', linkedin: '' }
  const html = renderMetadata(readFileSync('index.html', 'utf8'), profile)
  assert.ok(html.includes('&lt;script&gt;$&amp;&lt;/script&gt;'))
  assert.ok(html.includes('$1 &amp; &quot;소개&quot;'))
  assert.doesNotMatch(html, /mailto:|hanej090224@gmail.com/)
  const data = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]
  assert.deepEqual(JSON.parse(data).sameAs, [])
  assert.doesNotMatch(data, /<script>/)
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
  const { draft, service, state } = fixture()
  draft.content.projects[0].imageAlt = '테스트 프로젝트 화면'
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#bbbbbb' } }).png().toBuffer()
  draft.uploads = [{ projectId: draft.content.projects[0].id, data: png.toString('base64') }]
  const prepared = await prepare(draft)
  assert.match(prepared.content.projects[0].image, /^\/images\/projects\/uploads\/[a-f0-9]{64}\.webp$/)
  assert.equal((await sharp(prepared.files[0].data).metadata()).format, 'webp')
  const review = await service.review(draft)
  await service.save({ ...draft, reviewToken: review.reviewToken })
  const tree = state.calls.find((call) => call.path === '/git/trees')?.body.tree as unknown[]
  assert.equal(tree.length, 2)
  draft.uploads[0].data = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')
  await assert.rejects(prepare(draft), /이미지 형식/)
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
