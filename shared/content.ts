import { z } from 'zod'

const text = (max = 500) => z.string().trim().max(max).refine((value) => ![...value].some((char) => char.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(char)), '제어 문자는 사용할 수 없습니다.')
const required = (max = 100) => text(max).min(1, '필수 항목입니다.')
const link = text(500).refine((value) => {
  if (!value) return true
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}, 'https:// 주소를 입력하세요.')
const requiredUrl = (max = 500) => text(max).min(1, '필수 항목입니다.').refine((value) => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}, 'https:// 주소를 입력하세요.')
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'ID는 영문 소문자·숫자·하이픈 40자 이내입니다.')
const imagePath = (prefix: string) => z.string().max(200).refine((value) => !value || new RegExp(`^/images/${prefix}/[a-z0-9/_-]+\\.(webp|avif|png|jpe?g)$`).test(value), '이미지 경로를 확인하세요.')
const image = imagePath('projects')
const color = z.string().regex(/^#[0-9a-f]{6}$/i, '색상은 #rrggbb 형식의 16진수입니다.')
// Vercel Blob public URL host is <storeId>.public.blob.vercel-storage.com; the exact storeId for this
// deployment is verified separately in server/content-service.ts against the configured blob token.
const portfolioUrl = z.string().max(500).refine((value) => !value || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/portfolio\/[a-zA-Z0-9/_.-]+\.pdf$/.test(value), 'Vercel Blob의 portfolio/ 경로 PDF 주소만 허용합니다.')
const base = { id, published: z.boolean() }

export const projectSchema = z.object({
  ...base, name: required(60), headline: required(150), team: text(60), role: required(150), status: text(60), color,
  technologies: z.array(required(50)).max(8), work: z.array(required(200)).min(1).max(8), note: text(400),
  image, imageAlt: text(200), github: link,
  screenshots: z.array(z.object({ ...base, image, alt: required(200), caption: text(300) }).strict()).max(4),
  documents: z.array(z.object({ ...base, label: required(100), url: requiredUrl() }).strict()).max(8),
}).strict().refine((value) => !value.image || Boolean(value.imageAlt), { message: '이미지 설명(alt)을 입력하세요.', path: ['imageAlt'] })

export const waySchema = z.object({ ...base, title: required(100), sub: text(150), text: required(500) }).strict()

const photoSchema = z.object({ image: imagePath('profile'), alt: text(200) }).strict()
  .refine((value) => !value.image || Boolean(value.alt), { message: '사진 설명(alt)을 입력하세요.', path: ['alt'] })
const portfolioSchema = z.object({ label: text(100), url: portfolioUrl, updatedAt: z.union([z.literal(''), z.iso.date()]) }).strict()
  .refine((value) => !value.url || Boolean(value.label), { message: '포트폴리오 PDF 라벨을 입력하세요.', path: ['label'] })

export const contentSchema = z.object({
  schemaVersion: z.literal(3),
  profile: z.object({
    name: required(50), englishName: required(80), role: required(80),
    tagline: required(200), introduction: required(600), school: required(150), schoolShort: required(60),
    email: z.union([z.literal(''), z.email().max(150)]), github: link, linkedin: link,
    website: z.url().refine((value) => {
      try {
        const url = new URL(value)
        return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
      } catch { return false }
    }, 'https:// 도메인 주소만 입력하세요.'), domain: required(100),
    contactText: required(300), photo: photoSchema, portfolio: portfolioSchema,
  }).strict(),
  projects: z.array(projectSchema).max(12),
  ways: z.array(waySchema).max(6),
  openSource: z.object({
    checkedAt: z.iso.date(),
    contributions: z.array(z.object({
      ...base, name: required(100), repo: text(150), description: required(300),
      url: z.url().refine((value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value), 'GitHub PR 주소를 입력하세요.'),
      number: z.number().int().positive(), status: z.enum(['merged', 'open', 'closed', 'reverted']),
    }).strict().refine((item) => item.url.endsWith('/pull/' + item.number), { message: 'PR 번호와 URL이 일치해야 합니다.', path: ['number'] })).max(50),
  }).strict(),
  activities: z.array(z.object({ ...base, period: text(80), title: required(150), description: text(600) }).strict()).max(30),
  skills: z.array(z.object({ ...base, name: required(60), items: z.array(required(60)).min(1).max(20) }).strict()).max(8),
}).strict().superRefine((content, ctx) => {
  for (const [path, items] of [
    [['projects'], content.projects], [['ways'], content.ways], [['openSource', 'contributions'], content.openSource.contributions],
    [['activities'], content.activities], [['skills'], content.skills],
  ] as const) {
    const ids = new Set<string>()
    items.forEach((item, index) => {
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [...path, index, 'id'], message: 'ID가 중복되었습니다.' })
      ids.add(item.id)
    })
  }
  content.projects.forEach((project, projectIndex) => {
    for (const [key, items] of [['screenshots', project.screenshots], ['documents', project.documents]] as const) {
      const ids = new Set<string>()
      items.forEach((item, index) => {
        if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: ['projects', projectIndex, key, index, 'id'], message: 'ID가 중복되었습니다.' })
        ids.add(item.id)
      })
    }
  })
})

export type SiteContent = z.infer<typeof contentSchema>
export type Project = z.infer<typeof projectSchema>
export type Way = z.infer<typeof waySchema>
export type Screenshot = Project['screenshots'][number]
export type ProjectDocument = Project['documents'][number]

// 빌드 전에 비공개 항목을 제거합니다. 브라우저에서 단순히 숨기는 방식이 아닙니다.
export function publicContent(content: SiteContent): SiteContent {
  return {
    ...content,
    projects: content.projects.filter((item) => item.published).map((item) => ({
      ...item,
      screenshots: item.screenshots.filter((shot) => shot.published),
      documents: item.documents.filter((doc) => doc.published),
    })),
    ways: content.ways.filter((item) => item.published),
    openSource: { ...content.openSource, contributions: content.openSource.contributions.filter((item) => item.published && item.status !== 'reverted') },
    activities: content.activities.filter((item) => item.published),
    skills: content.skills.filter((item) => item.published),
  }
}

export function validationMessages(value: unknown): string[] {
  const result = contentSchema.safeParse(value)
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')} — ${issue.message}`)
}
