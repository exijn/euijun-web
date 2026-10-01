import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { contentSchema } from '../shared/content.ts'
import type { Config } from './config.ts'
import { GitHub, type Fetcher } from './github.ts'
import { ContentService } from './content-service.ts'
import { cookie, cookies, equal, HttpError, Limiter, OAUTH_COOKIE, random, readSession, seal, SESSION_COOKIE, unseal } from './security.ts'

const MAX_BODY = 4 * 1024 * 1024
const contentTypes: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' }
function send(res: ServerResponse, status: number, value: unknown) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value))
}
async function body(req: IncomingMessage) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'CONTENT_TYPE', 'JSON 요청만 허용합니다.')
  if (Number(req.headers['content-length'] ?? 0) > MAX_BODY) throw new HttpError(413, 'BODY_SIZE', '전체 요청은 4 MB 이하여야 합니다.')
  const supplied = (req as IncomingMessage & { body?: unknown }).body
  if (supplied !== undefined) {
    if (Buffer.byteLength(JSON.stringify(supplied)) > MAX_BODY) throw new HttpError(413, 'BODY_SIZE', '전체 요청은 4 MB 이하여야 합니다.')
    return supplied
  }
  const chunks: Buffer[] = []; let size = 0
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk); size += bytes.length
    if (size > MAX_BODY) throw new HttpError(413, 'BODY_SIZE', '전체 요청은 4 MB 이하여야 합니다.')
    chunks.push(bytes)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown } catch { throw new HttpError(400, 'JSON', 'JSON 형식이 올바르지 않습니다.') }
}

export function createHandler({ config, root = process.cwd(), fetcher = fetch }: { config: Config | null; root?: string; fetcher?: Fetcher }) {
  const limiter = new Limiter()
  const github = config ? new GitHub(config, fetcher) : null
  const service = github && config ? new ContentService(github, config) : null
  async function serve(res: ServerResponse, directory: string, path: string, head = false) {
    const base = resolve(root, directory)
    const filename = resolve(base, '.' + path)
    if (!filename.startsWith(base + sep)) throw new HttpError(404, 'NOT_FOUND', 'Not found')
    let data: Buffer
    try { data = await readFile(filename) } catch { throw new HttpError(404, 'NOT_FOUND', 'Not found') }
    res.setHeader('Content-Type', contentTypes[extname(filename)] ?? 'application/octet-stream')
    res.end(head ? undefined : data)
  }
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const path = decodeURIComponent(url.pathname)
      const privateRoute = path === '/manage' || path.startsWith('/manage/') || path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/private-assets/')
      if (!privateRoute) {
        if (!['GET', 'HEAD'].includes(req.method ?? '')) throw new HttpError(405, 'METHOD', 'Method not allowed')
        if (!/^\/(?:$|index\.html$|favicon\.svg$|robots\.txt$|sitemap\.xml$|assets\/[a-zA-Z0-9_.-]+$|images\/[a-zA-Z0-9/_.-]+$)/.test(path) || path.includes('..') || path.includes('\\')) throw new HttpError(404, 'NOT_FOUND', 'Not found')
        return await serve(res, 'dist', path === '/' ? '/index.html' : path, req.method === 'HEAD')
      }
      res.setHeader('Cache-Control', 'private, no-store, max-age=0')
      res.setHeader('Vary', 'Cookie')
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
      res.setHeader('Referrer-Policy', 'no-referrer')
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
      if (!config || !github || !service) throw new HttpError(404, 'NOT_FOUND', 'Not found')
      // 클라이언트가 보낸 Host로 인증 URL을 만들지 않습니다.
      const stored = cookies(req.headers.cookie)
      const session = readSession(stored[SESSION_COOKIE], config)
      const redirect = (location: string) => { res.statusCode = 303; res.setHeader('Location', location); res.end() }
      if (path === '/auth/github' && req.method === 'GET') {
        limiter.take('oauth', 10)
        const state = random(); const verifier = random()
        res.setHeader('Set-Cookie', cookie(OAUTH_COOKIE, seal({ state, verifier, expires: Date.now() + 600000 }, 'oauth', config), 600))
        const query = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.origin + '/auth/callback', state, scope: 'read:user', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', allow_signup: 'false' })
        return redirect('https://github.com/login/oauth/authorize?' + query)
      }
      if (path === '/auth/callback' && req.method === 'GET') {
        limiter.take('oauth-callback', 10)
        res.setHeader('Set-Cookie', cookie(OAUTH_COOKIE, '', 0))
        const flow = z.object({ state: z.string(), verifier: z.string(), expires: z.number() }).safeParse(unseal(stored[OAUTH_COOKIE], 'oauth', config))
        const code = url.searchParams.get('code')
        if (!flow.success || flow.data.expires <= Date.now() || !equal(flow.data.state, url.searchParams.get('state') ?? '') || !code || code.length > 200) throw new HttpError(403, 'OAUTH_STATE', '인증을 다시 시작하세요.')
        const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', {
          method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(12000),
          body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: config.origin + '/auth/callback', code_verifier: flow.data.verifier }),
        })
        if (!tokenResponse.ok) throw new HttpError(502, 'OAUTH_EXCHANGE', '인증 공급자 응답을 확인하지 못했습니다.')
        const token = z.object({ access_token: z.string().min(1), token_type: z.literal('bearer') }).safeParse(await tokenResponse.json())
        if (!token.success) throw new HttpError(403, 'OAUTH_EXCHANGE', 'GitHub 인증에 실패했습니다.')
        const userResponse = await fetcher('https://api.github.com/user', { headers: { Authorization: `Bearer ${token.data.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'euijun-content-editor' }, redirect: 'error', signal: AbortSignal.timeout(12000) })
        if (!userResponse.ok) throw new HttpError(403, 'IDENTITY', '계정을 확인하지 못했습니다.')
        const user = z.object({ id: z.number(), login: z.string() }).parse(await userResponse.json())
        if (user.id !== config.ownerId || user.login.toLowerCase() !== 'exijn') throw new HttpError(403, 'FORBIDDEN', '접근할 수 없습니다.')
        const now = Date.now()
        const value = seal({ id: user.id, login: 'exijn', csrf: random(), issued: now, expires: now + 3600000 }, 'session', config)
        res.setHeader('Set-Cookie', [cookie(OAUTH_COOKIE, '', 0), cookie(SESSION_COOKIE, value, 3600)])
        return redirect('/manage')
      }
      if (path === '/manage' && req.method === 'GET' && !session) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>계속하기</title><body><main><h1>계속하기</h1><p><a href="/auth/github">GitHub로 계속</a></p></main></body></html>')
      }
      if (!session) throw new HttpError(404, 'NOT_FOUND', 'Not found')
      limiter.take('session:' + session.csrf, 120)
      if (req.method === 'POST') {
        if (req.headers.origin !== config.origin || !equal(String(req.headers['x-csrf-token'] ?? ''), session.csrf)) throw new HttpError(403, 'CSRF', '요청 출처 또는 세션을 확인하세요.')
        limiter.take('write:' + session.csrf, 12)
      }
      if (path === '/manage' && req.method === 'GET') return await serve(res, '.private', '/index.html')
      if (/^\/private-assets\/assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(path) && req.method === 'GET') return await serve(res, '.private', path.replace('/private-assets', ''))
      if (path === '/api/manage/content' && req.method === 'GET') {
        const snapshot = await github.snapshot()
        return send(res, 200, { content: contentSchema.parse(snapshot.content), baseSha: snapshot.sha, branch: snapshot.branch, csrf: session.csrf })
      }
      if (path === '/api/manage/review' && req.method === 'POST') return send(res, 200, await service.review(await body(req)))
      if (path === '/api/manage/save' && req.method === 'POST') return send(res, 201, await service.save(await body(req)))
      if (path === '/api/manage/logout' && req.method === 'POST') { res.setHeader('Set-Cookie', cookie(SESSION_COOKIE, '', 0)); return send(res, 200, { ok: true }) }
      if (path === '/api/manage/status' && req.method === 'GET' && /^\d{1,9}$/.test(url.searchParams.get('pr') ?? '')) return send(res, 200, await github.status(Number(url.searchParams.get('pr'))))
      throw new HttpError(404, 'NOT_FOUND', 'Not found')
    } catch (error) {
      if (res.headersSent) { res.end(); return }
      if (error instanceof HttpError) return send(res, error.status, { code: error.code, error: error.message })
      return send(res, 500, { code: 'SERVER_ERROR', error: '요청을 처리하지 못했습니다. 저장 결과가 불명확하다면 GitHub를 확인하세요.' })
    }
  }
}
