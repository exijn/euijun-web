export interface Config {
  origin: string
  clientId: string
  clientSecret: string
  ownerId: number
  repository: string
  contentToken: string
  secret: Buffer
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config | null {
  const keys = ['APP_ORIGIN', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_OWNER_ID', 'GITHUB_REPOSITORY', 'GITHUB_CONTENT_TOKEN', 'SESSION_SECRET'] as const
  if (keys.some((key) => !env[key]?.trim())) return null
  const origin = new URL(env.APP_ORIGIN!)
  const local = ['localhost', '127.0.0.1'].includes(origin.hostname) && env.NODE_ENV !== 'production' && !env.VERCEL
  if (!['http:', 'https:'].includes(origin.protocol) || (!local && origin.protocol !== 'https:') || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('Invalid APP_ORIGIN')
  const secret = Buffer.from(env.SESSION_SECRET!, 'base64')
  if (secret.length !== 32 || secret.toString('base64') !== env.SESSION_SECRET) throw new Error('SESSION_SECRET must be 32 random bytes in base64')
  if (!/^exijn\/[a-zA-Z0-9_.-]+$/.test(env.GITHUB_REPOSITORY!)) throw new Error('Repository must belong to exijn')
  const ownerId = Number(env.GITHUB_OWNER_ID)
  if (!Number.isSafeInteger(ownerId) || ownerId <= 0) throw new Error('Invalid owner ID')
  return { origin: origin.origin, clientId: env.GITHUB_CLIENT_ID!, clientSecret: env.GITHUB_CLIENT_SECRET!, ownerId, repository: env.GITHUB_REPOSITORY!, contentToken: env.GITHUB_CONTENT_TOKEN!, secret }
}
