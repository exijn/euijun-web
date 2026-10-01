import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { Config } from './config.ts'

export class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code }
}
export const random = () => randomBytes(32).toString('base64url')
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
export function equal(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }
export function seal(value: unknown, purpose: string, config: Config) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', config.secret, iv)
  cipher.setAAD(Buffer.from(purpose))
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [iv, data, cipher.getAuthTag()].map((part) => part.toString('base64url')).join('.')
}
export function unseal(token: string | undefined, purpose: string, config: Config): unknown {
  if (!token || token.length > 4096) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [iv, data, tag] = parts.map((part) => Buffer.from(part, 'base64url'))
    if (iv.length !== 12 || tag.length !== 16) return null
    const cipher = createDecipheriv('aes-256-gcm', config.secret, iv)
    cipher.setAAD(Buffer.from(purpose)); cipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8'))
  } catch { return null }
}
export const SESSION_COOKIE = '__Host-session'
export const OAUTH_COOKIE = '__Host-oauth'
export function cookie(name: string, value: string, age: number) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}` }
export function cookies(header = '') {
  const result: Record<string, string> = {}
  for (const part of header.split(';')) { const at = part.indexOf('='); if (at > 0) result[part.slice(0, at).trim()] = part.slice(at + 1).trim() }
  return result
}
const sessionSchema = z.object({ id: z.number().int(), login: z.literal('exijn'), csrf: z.string().min(40), expires: z.number(), issued: z.number() }).strict()
export type Session = z.infer<typeof sessionSchema>
export function readSession(token: string | undefined, config: Config, now = Date.now()): Session | null {
  const session = sessionSchema.safeParse(unseal(token, 'session', config))
  if (!session.success || session.data.id !== config.ownerId || session.data.expires <= now || session.data.issued > now || session.data.expires - session.data.issued > 3600000) return null
  return session.data
}

// 프로세스별 요청 상한. 서버리스 전체 인스턴스의 공통 제한은 배포 플랫폼 WAF로 보완합니다.
export class Limiter {
  entries = new Map<string, { count: number; until: number }>()
  take(key: string, max: number, now = Date.now()) {
    for (const [id, value] of this.entries) if (value.until <= now) this.entries.delete(id)
    const value = this.entries.get(key) ?? { count: 0, until: now + 60000 }
    value.count++
    this.entries.set(key, value)
    if (value.count > max) throw new HttpError(429, 'RATE_LIMIT', '요청이 많습니다. 잠시 후 다시 시도하세요.')
  }
}
