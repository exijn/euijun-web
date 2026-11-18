import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler } from '../../server/app.ts'
import { cookie, seal, SESSION_COOKIE } from '../../server/security.ts'
import { getStoreId, publicBlobHost, portfolioUploadConstraints, verifyPortfolioUrl } from '../../server/blob.ts'
import { mockGitHub, testConfig, testBlobToken, testBlobHost } from '../fixtures/github.ts'

test('getStoreId/publicBlobHost parse the store id out of a read-write token', () => {
  assert.equal(getStoreId(testBlobToken), 'fixturestoreid1234')
  assert.equal(publicBlobHost(testBlobToken), testBlobHost)
  assert.throws(() => getStoreId('not-a-token'))
})

test('portfolioUploadConstraints only allows portfolio/*.pdf and caps size at 20MB', () => {
  const ok = portfolioUploadConstraints('portfolio/portfolio.pdf')
  assert.deepEqual(ok.allowedContentTypes, ['application/pdf'])
  assert.equal(ok.maximumSizeInBytes, 20 * 1024 * 1024)
  assert.equal(ok.addRandomSuffix, true)
  assert.throws(() => portfolioUploadConstraints('other/file.pdf'))
  assert.throws(() => portfolioUploadConstraints('portfolio/file.png'))
  assert.throws(() => portfolioUploadConstraints('portfolio/../../etc/passwd.pdf'))
})

test('verifyPortfolioUrl rejects a host that does not match the configured store', async () => {
  const fetcher = async () => new Response(new Uint8Array(Buffer.from('%PDF-1.4')), { status: 200 })
  await assert.rejects(verifyPortfolioUrl(`https://other-store.public.blob.vercel-storage.com/portfolio/x.pdf`, testBlobToken, fetcher), /Blob 스토어/)
})

test('verifyPortfolioUrl rejects a file whose bytes are not a real PDF', async () => {
  const fetcher = async () => new Response(new Uint8Array(Buffer.from('not a pdf at all')), { status: 200 })
  await assert.rejects(verifyPortfolioUrl(`https://${testBlobHost}/portfolio/x.pdf`, testBlobToken, fetcher), /유효한 PDF/)
})

test('verifyPortfolioUrl accepts a matching host with a real PDF signature', async () => {
  const fetcher = async () => new Response(new Uint8Array(Buffer.from('%PDF-1.7 rest of file')), { status: 200 })
  await verifyPortfolioUrl(`https://${testBlobHost}/portfolio/x.pdf`, testBlobToken, fetcher)
})

test('verifyPortfolioUrl surfaces network failure without claiming success', async () => {
  const fetcher = async () => { throw new Error('network down') }
  await assert.rejects(verifyPortfolioUrl(`https://${testBlobHost}/portfolio/x.pdf`, testBlobToken, fetcher), /확인하지 못했습니다/)
})

async function fixture(blobToken: string | null = testBlobToken) {
  const mock = mockGitHub()
  const server = createServer(createHandler({ config: testConfig, fetcher: mock.fetcher, blobToken }))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No server')
  const origin = 'http://127.0.0.1:' + address.port
  return { ...mock, origin, close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}
function sessionCookie() {
  const now = Date.now()
  return cookie(SESSION_COOKIE, seal({ id: testConfig.ownerId, login: 'exijn', csrf: 'x'.repeat(43), issued: now, expires: now + 3600000 }, 'session', testConfig), 3600).split(';')[0]
}

test('blob-upload endpoint: unauthenticated is 404, wrong CSRF is 403', async () => {
  const app = await fixture()
  try {
    const anon = await fetch(app.origin + '/api/manage/blob-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(anon.status, 404)
    const noCsrf = await fetch(app.origin + '/api/manage/blob-upload', { method: 'POST', headers: { Cookie: sessionCookie(), Origin: testConfig.origin, 'X-CSRF-Token': 'wrong'.padEnd(43, 'x'), 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(noCsrf.status, 403)
  } finally { await app.close() }
})

test('blob-upload endpoint is 404 when BLOB_READ_WRITE_TOKEN is not configured, independent of the rest of the editor', async () => {
  const app = await fixture(null)
  try {
    const res = await fetch(app.origin + '/api/manage/blob-upload', { method: 'POST', headers: { Cookie: sessionCookie(), Origin: testConfig.origin, 'X-CSRF-Token': 'x'.repeat(43), 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'portfolio/portfolio.pdf', clientPayload: null, multipart: false } }) })
    assert.equal(res.status, 404)
    const content = await fetch(app.origin + '/api/manage/content', { headers: { Cookie: sessionCookie() } })
    assert.equal((await content.json()).blobEnabled, false)
  } finally { await app.close() }
})

test('blob-upload endpoint issues a client token for an authenticated, valid request and reports blobEnabled', async () => {
  const app = await fixture()
  try {
    const content = await fetch(app.origin + '/api/manage/content', { headers: { Cookie: sessionCookie() } })
    assert.equal((await content.json()).blobEnabled, true)
    const res = await fetch(app.origin + '/api/manage/blob-upload', {
      method: 'POST', headers: { Cookie: sessionCookie(), Origin: testConfig.origin, 'X-CSRF-Token': 'x'.repeat(43), 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'portfolio/portfolio.pdf', clientPayload: null, multipart: false } }),
    })
    assert.equal(res.status, 200)
    const body = await res.json() as { type: string; clientToken: string }
    assert.equal(body.type, 'blob.generate-client-token')
    assert.ok(body.clientToken.startsWith('vercel_blob_client_'))
  } finally { await app.close() }
})

test('blob-upload endpoint rejects a pathname outside portfolio/*.pdf', async () => {
  const app = await fixture()
  try {
    const res = await fetch(app.origin + '/api/manage/blob-upload', {
      method: 'POST', headers: { Cookie: sessionCookie(), Origin: testConfig.origin, 'X-CSRF-Token': 'x'.repeat(43), 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'projects/sneaky.png', clientPayload: null, multipart: false } }),
    })
    assert.equal(res.status, 422)
  } finally { await app.close() }
})
