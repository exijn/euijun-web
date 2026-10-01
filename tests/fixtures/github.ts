import type { Config } from '../../server/config.ts'
import type { Fetcher } from '../../server/github.ts'
import { fixtureContent } from './content.ts'

// 테스트 전용 합성 자격값. 운영 코드에는 이 fixture나 인증 우회 경로가 없습니다.
export const testConfig: Config = { origin: 'http://localhost:4175', clientId: 'fixture-client', clientSecret: 'fixture-oauth-secret', ownerId: 218341304, repository: 'exijn/fixture-repo', contentToken: 'fixture-repo-token', secret: Buffer.alloc(32, 7) }
export const initialContent = fixtureContent
export function mockGitHub() {
  const state = {
    head: 'a'.repeat(40), headReads: 0, advanceAt: 0, failPath: '', identity: { id: testConfig.ownerId, login: 'exijn' },
    calls: [] as { method: string; path: string; body: Record<string, unknown> }[],
    refs: new Map<string, string>(), content: structuredClone(initialContent), merged: false, deployment: '',
  }
  const fetcher: Fetcher = async (input, init) => {
    const url = new URL(String(input)); const path = url.pathname.replace('/repos/' + testConfig.repository, '') + url.search
    const method = init?.method ?? 'GET'; const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {}
    state.calls.push({ method, path, body })
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
    if (state.failPath && path.startsWith(state.failPath)) return json({ secret: 'must-not-leak' }, 403)
    if (url.hostname === 'github.com' && path === '/login/oauth/access_token') return json({ access_token: 'fixture-access-token', token_type: 'bearer' })
    if (url.hostname !== 'api.github.com') throw new Error('Unexpected outbound host in test')
    if (path === '/user') return json(state.identity)
    if (path === '') return json({ default_branch: 'trunk' })
    if (path === '/git/ref/heads/trunk') {
      state.headReads++
      if (state.advanceAt && state.headReads >= state.advanceAt) state.head = 'b'.repeat(40)
      return json({ object: { sha: state.head } })
    }
    if (path.startsWith('/contents/content/site.json?')) return json({ encoding: 'base64', content: Buffer.from(JSON.stringify(state.content)).toString('base64') })
    if (path.startsWith('/git/commits/') && method === 'GET') return json({ tree: { sha: 'c'.repeat(40) } })
    if (path === '/git/blobs') return json({ sha: 'd'.repeat(40) })
    if (path === '/git/trees') return json({ sha: 'e'.repeat(40) })
    if (path === '/git/commits') return json({ sha: 'f'.repeat(40) })
    if (path === '/git/refs' && method === 'POST') {
      if (state.refs.has(String(body.ref))) return json({}, 422)
      state.refs.set(String(body.ref), String(body.sha)); return json({ ref: body.ref })
    }
    if (path === '/pulls' && method === 'POST') return json({ number: 42, html_url: 'https://github.com/exijn/fixture-repo/pull/42' })
    if (path === '/pulls/42') return json({ state: 'open', merged: state.merged, html_url: 'https://github.com/exijn/fixture-repo/pull/42', merge_commit_sha: state.merged ? '1'.repeat(40) : null, head: { ref: 'content/fixture', repo: { full_name: testConfig.repository } }, base: { repo: { full_name: testConfig.repository } } })
    if (path.startsWith('/deployments?')) return json(state.deployment ? [{ id: 1, environment: 'Production' }] : [])
    if (path.startsWith('/deployments/1/statuses')) return json([{ state: state.deployment }])
    throw new Error('Unexpected GitHub request: ' + method + ' ' + path)
  }
  return { state, fetcher }
}
