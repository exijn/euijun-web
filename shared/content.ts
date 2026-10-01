import { z } from 'zod'

const text = (max = 500) => z.string().trim().max(max).refine((value) => ![...value].some((char) => char.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(char)), '제어 문자는 사용할 수 없습니다.')
const required = (max = 100) => text(max).min(1, '필수 항목입니다.')
const link = text(500).refine((value) => {
  if (!value) return true
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}, 'https:// 주소를 입력하세요.')
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'ID는 영문 소문자·숫자·하이픈 40자 이내입니다.')
const image = z.string().max(200).refine((value) => !value || /^\/images\/projects\/[a-z0-9/_-]+\.(webp|avif|png|jpe?g)$/.test(value), '프로젝트 이미지 경로를 확인하세요.')
const base = { id, published: z.boolean() }
export const projectSchema = z.object({
  ...base, name: required(), category: text(100), headline: required(150), description: text(1000),
  problem: required(600), role: required(200), result: required(800), status: text(100),
  technologies: z.array(required(50)).max(12), image, imageAlt: text(200), imageCaption: text(200),
  github: link, detailUrl: link, sourceUrl: link, featured: z.boolean(),
}).strict().refine((value) => !value.image || Boolean(value.imageAlt), { message: '이미지 설명(alt)을 입력하세요.', path: ['imageAlt'] })

export const contentSchema = z.object({
  schemaVersion: z.literal(1),
  profile: z.object({
    name: required(50), englishName: required(80), handle: required(40), role: required(80),
    tagline: required(200), introduction: required(600), school: required(100), schoolDetail: text(100),
    email: z.union([z.literal(''), z.email().max(150)]), github: link, linkedin: link,
    website: z.url().refine((value) => {
      try {
        const url = new URL(value)
        return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
      } catch { return false }
    }, 'https:// 도메인 주소만 입력하세요.'), domain: required(100),
    about: z.array(required(1200)).min(1).max(3), contactText: required(300),
  }).strict(),
  projects: z.array(projectSchema).max(20),
  openSource: z.object({
    checkedAt: z.iso.date(), activityUrl: link,
    contributions: z.array(z.object({
      ...base, name: required(100), category: text(100), description: required(600),
      url: z.url().refine((value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value), 'GitHub PR 주소를 입력하세요.'),
      number: z.number().int().positive(), status: z.enum(['merged', 'open', 'closed', 'reverted']),
    }).strict().refine((item) => item.url.endsWith('/pull/' + item.number), { message: 'PR 번호와 URL이 일치해야 합니다.', path: ['number'] })).max(50),
  }).strict(),
  activities: z.array(z.object({ ...base, period: text(80), title: required(150), description: text(600) }).strict()).max(30),
  skills: z.array(z.object({ ...base, name: required(60), items: z.array(required(60)).min(1).max(20) }).strict()).max(8),
}).strict().superRefine((content, ctx) => {
  for (const [path, items] of [
    [['projects'], content.projects], [['openSource', 'contributions'], content.openSource.contributions],
    [['activities'], content.activities], [['skills'], content.skills],
  ] as const) {
    const ids = new Set<string>()
    items.forEach((item, index) => {
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [...path, index, 'id'], message: 'ID가 중복되었습니다.' })
      ids.add(item.id)
    })
  }
  if (content.projects.filter((project) => project.featured).length > 1) ctx.addIssue({ code: 'custom', path: ['projects'], message: '대표 프로젝트는 하나만 선택하세요.' })
})

export type SiteContent = z.infer<typeof contentSchema>
export type Project = z.infer<typeof projectSchema>

// 빌드 전에 비공개 항목을 제거합니다. 브라우저에서 단순히 숨기는 방식이 아닙니다.
export function publicContent(content: SiteContent): SiteContent {
  return {
    ...content,
    projects: content.projects.filter((item) => item.published),
    openSource: { ...content.openSource, contributions: content.openSource.contributions.filter((item) => item.published && item.status !== 'reverted') },
    activities: content.activities.filter((item) => item.published),
    skills: content.skills.filter((item) => item.published),
  }
}

export function validationMessages(value: unknown): string[] {
  const result = contentSchema.safeParse(value)
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')} — ${issue.message}`)
}
