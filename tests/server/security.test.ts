import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler } from '../../server/app.ts'
import { loadConfig } from '../../server/config.ts'
import { cookie, cookies, Limiter, OAUTH_COOKIE, random, readSession, seal, SESSION_COOKIE, unseal } from '../../server/security.ts'
import { mockGitHub, testConfig } from '../fixtures/github.ts'

async function fixture() {
  const mock = mockGitHub()
  const server = createServer(createHandler({ config: testConfig, fetcher: mock.fetcher }))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No server')
  const origin = 'http://127.0.0.1:' + address.port
  return { ...mock, origin, close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}
function sessionCookie(overrides = {}) {
  const now = Date.now()
  return cookie(SESSION_COOKIE, seal({ id: testConfig.ownerId, login: 'exijn', csrf: 'x'.repeat(43), issued: now, expires: now + 3600000, ...overrides }, 'session', testConfig), 3600).split(';')[0]
}

test('session encryption rejects tampering, wrong purpose, expiry and other owner', () => {
  const token = sessionCookie().split('=')[1]
  assert.ok(readSession(token, testConfig))
  assert.equal(readSession(token + 'a', testConfig), null)
  assert.equal(unseal(token, 'oauth', testConfig), null)
  assert.equal(readSession(sessionCookie({ expires: 1 }).split('=')[1], testConfig), null)
  assert.equal(readSession(sessionCookie({ id: 999 }).split('=')[1], testConfig), null)
  assert.match(cookie(SESSION_COOKIE, token, 3600), /HttpOnly; Secure; SameSite=Lax/)
})
test('configuration fails closed and requires a strong server secret', () => {
  assert.equal(loadConfig({}), null)
  assert.throws(() => loadConfig({ APP_ORIGIN: 'http://evil.test', GITHUB_CLIENT_ID: 'x', GITHUB_CLIENT_SECRET: 'x', GITHUB_OWNER_ID: '1', GITHUB_REPOSITORY: 'exijn/test', GITHUB_CONTENT_TOKEN: 'x', SESSION_SECRET: 'bad', NODE_ENV: 'production' }))
})
test('unauthenticated API and private bundles are unavailable', async () => {
  const app = await fixture()
  try {
    for (const path of ['/api/manage/content', '/api/manage/save', '/private-assets/assets/index.js', '/.private/index.html', '/server/config.ts']) {
      const res = await fetch(app.origin + path)
      assert.equal(res.status, 404, path)
      assert.doesNotMatch(await res.text(), /fixture-repo-token|fixture-oauth-secret|콘텐츠 관리/)
    }
    const login = await fetch(app.origin + '/manage')
    assert.match(login.headers.get('x-robots-tag')!, /noindex/)
    assert.match(login.headers.get('cache-control')!, /no-store/)
    assert.doesNotMatch(await login.text(), /private-assets|<script|콘텐츠 관리/)
  } finally { await app.close() }
})
test('mutations require both same origin and matching CSRF token', async () => {
  const app = await fixture()
  try {
    for (const [origin, csrf] of [['https://evil.test', 'x'.repeat(43)], [testConfig.origin, 'wrong'], ['', 'x'.repeat(43)]]) {
      const res = await fetch(app.origin + '/api/manage/save', { method: 'POST', headers: { Cookie: sessionCookie(), Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: '{}' })
      assert.equal(res.status, 403)
    }
    assert.equal(app.state.calls.length, 0)
  } finally { await app.close() }
})
test('authenticated content has CSRF but no provider secrets; malformed JSON is rejected', async () => {
  const app = await fixture()
  try {
    const response = await fetch(app.origin + '/api/manage/content', { headers: { Cookie: sessionCookie() } })
    assert.equal(response.status, 200)
    const text = await response.text(); assert.match(text, /csrf/); assert.doesNotMatch(text, /fixture-repo-token|fixture-oauth-secret|SESSION_SECRET/)
    const bad = await fetch(app.origin + '/api/manage/review', { method: 'POST', headers: { Cookie: sessionCookie(), Origin: testConfig.origin, 'X-CSRF-Token': 'x'.repeat(43), 'Content-Type': 'application/json' }, body: '{' })
    assert.equal(bad.status, 400)
  } finally { await app.close() }
})
test('OAuth requires state and PKCE, permits only matching login AND numeric ID', async () => {
  const app = await fixture()
  try {
    const invalid = await fetch(app.origin + '/auth/callback?state=wrong&code=x')
    assert.equal(invalid.status, 403)
    for (const identity of [{ id: 999, login: 'exijn' }, { id: testConfig.ownerId, login: 'other' }, { id: testConfig.ownerId, login: 'exijn' }]) {
      app.state.identity = identity
      const start = await fetch(app.origin + '/auth/github', { redirect: 'manual' })
      const location = new URL(start.headers.get('location')!)
      assert.equal(location.searchParams.get('code_challenge_method'), 'S256')
      const state = location.searchParams.get('state')!
      const stateCookie = start.headers.get('set-cookie')!.split(';')[0]
      assert.ok(cookies(stateCookie)[OAUTH_COOKIE])
      const callback = await fetch(app.origin + '/auth/callback?code=fixture&state=' + state, { headers: { Cookie: stateCookie }, redirect: 'manual' })
      assert.equal(callback.status, identity.id === testConfig.ownerId && identity.login === 'exijn' ? 303 : 403)
      if (callback.status === 303) {
        assert.equal(callback.headers.get('location'), '/manage')
        assert.match(callback.headers.get('set-cookie')!, /__Host-session=/)
        assert.doesNotMatch(callback.headers.get('set-cookie')!, /fixture-access-token/)
      }
    }
    assert.ok(app.state.calls.find((call) => call.path === '/login/oauth/access_token')?.body.code_verifier)
  } finally { await app.close() }
})
test('rate limiter enforces per-minute boundary', () => {
  const limiter = new Limiter()
  for (let i = 0; i < 10; i++) limiter.take('key', 10, 1000)
  assert.throws(() => limiter.take('key', 10, 1000), /요청이 많습니다/)
  assert.doesNotThrow(() => limiter.take('key', 10, 62000))
  assert.equal(random().length, 43)
})
