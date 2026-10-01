import sharp from 'sharp'
import { z } from 'zod'
import { contentSchema, type SiteContent } from '../shared/content.ts'
import { GitHub } from './github.ts'
import { digest, equal, HttpError, seal, unseal } from './security.ts'
import type { Config } from './config.ts'

const inputSchema = z.object({
  baseSha: z.string().regex(/^[a-f0-9]{40}$/), content: contentSchema,
  uploads: z.array(z.object({ projectId: z.string().regex(/^[a-z0-9-]{1,40}$/), data: z.string().max(2800000).regex(/^[A-Za-z0-9+/]+={0,2}$/) }).strict()).max(3),
  reviewToken: z.string().max(4096).optional(),
}).strict()
export interface Change { path: string; before: string; after: string }
function differences(before: unknown, after: unknown, path = ''): Change[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return []
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    const a = before as Record<string, unknown>; const b = after as Record<string, unknown>
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) => differences(a[key], b[key], path ? `${path}.${key}` : key))
  }
  return [{ path, before: JSON.stringify(before ?? null, null, 2), after: JSON.stringify(after ?? null, null, 2) }]
}
export async function prepare(value: unknown) {
  const parsed = inputSchema.safeParse(value)
  if (!parsed.success) throw new HttpError(422, 'VALIDATION', parsed.error.issues.map((item) => `${item.path.join('.')}: ${item.message}`).join('\n'))
  const input = parsed.data
  const content = structuredClone(input.content)
  const files: { path: string; data: Buffer }[] = []
  const ids = new Set<string>()
  for (const upload of input.uploads) {
    const project = content.projects.find((item) => item.id === upload.projectId)
    if (!project || ids.has(upload.projectId)) throw new HttpError(422, 'IMAGE_PROJECT', '이미지의 프로젝트 ID가 없거나 중복되었습니다.')
    ids.add(upload.projectId)
    const bytes = Buffer.from(upload.data, 'base64')
    if (bytes.length > 2 * 1024 * 1024) throw new HttpError(413, 'IMAGE_SIZE', '이미지는 2 MB 이하여야 합니다.')
    const raster = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) || (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') || (bytes.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(bytes.toString('ascii', 8, 12)))
    if (!raster) throw new HttpError(422, 'IMAGE_FORMAT', '지원하지 않는 이미지 형식입니다. SVG는 허용하지 않습니다.')
    try {
      const image = sharp(bytes, { limitInputPixels: 24000000, animated: false, failOn: 'warning' })
      const meta = await image.metadata()
      if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format ?? '') || (meta.pages ?? 1) > 1) throw new Error('Invalid format')
      const data = await image.rotate().resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      const path = `public/images/projects/uploads/${digest(data)}.webp`
      project.image = path.replace(/^public/, '')
      files.push({ path, data })
    } catch { throw new HttpError(422, 'IMAGE_FORMAT', '유효한 정적 JPEG·PNG·WebP·AVIF 이미지만 사용할 수 있습니다. SVG·애니메이션·과도한 해상도는 허용하지 않습니다.') }
  }
  const validated = contentSchema.safeParse(content)
  if (!validated.success) throw new HttpError(422, 'VALIDATION', '업로드 이미지에 alt 설명을 입력하세요.')
  const fingerprint = digest(JSON.stringify({ baseSha: input.baseSha, content, files: files.map((file) => [file.path, digest(file.data)]) }))
  return { input, content, files, fingerprint }
}

export class ContentService {
  github: GitHub
  config: Config
  constructor(github: GitHub, config: Config) { this.github = github; this.config = config }
  async review(value: unknown) {
    const prepared = await prepare(value)
    const snapshot = await this.github.snapshot()
    if (snapshot.sha !== prepared.input.baseSha) throw new HttpError(409, 'STALE_HEAD', '기본 브랜치가 변경되었습니다. 초안을 보관한 뒤 최신 내용을 다시 불러와 비교하세요.')
    const original = contentSchema.parse(snapshot.content)
    const changes = differences(original, prepared.content)
    if (!changes.length && !prepared.files.length) throw new HttpError(422, 'NO_CHANGES', '변경 사항이 없습니다.')
    const reviewToken = seal({ digest: prepared.fingerprint, expires: Date.now() + 600000 }, 'review', this.config)
    return { changes, images: prepared.files.map((file) => file.path), reviewToken }
  }
  async save(value: unknown) {
    const prepared = await prepare(value)
    const ticket = z.object({ digest: z.string(), expires: z.number() }).safeParse(unseal(prepared.input.reviewToken, 'review', this.config))
    if (!ticket.success || ticket.data.expires <= Date.now() || !equal(ticket.data.digest, prepared.fingerprint)) throw new HttpError(409, 'REVIEW_REQUIRED', '변경 내용을 다시 확인한 뒤 저장하세요.')
    const head = await this.github.head()
    if (head.sha !== prepared.input.baseSha) throw new HttpError(409, 'STALE_HEAD', '기본 브랜치가 변경되어 저장을 중단했습니다. 최신 내용을 다시 불러오세요.')
    const commit = await this.github.request<{ tree: { sha: string } }>(`/git/commits/${head.sha}`)
    const entries: { path: string; mode: string; type: string; sha: string }[] = []
    for (const file of [{ path: 'content/site.json', data: Buffer.from(JSON.stringify(prepared.content, null, 2) + '\n') }, ...prepared.files]) {
      const blob = await this.github.request<{ sha: string }>('/git/blobs', 'POST', { content: file.data.toString('base64'), encoding: 'base64' })
      entries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha })
    }
    const tree = await this.github.request<{ sha: string }>('/git/trees', 'POST', { base_tree: commit.tree.sha, tree: entries })
    const message = 'content: update site content' + (prepared.files.length ? ' and project images' : '')
    const next = await this.github.request<{ sha: string }>('/git/commits', 'POST', { message, tree: tree.sha, parents: [head.sha] })
    if ((await this.github.head()).sha !== head.sha) throw new HttpError(409, 'STALE_HEAD', '저장 중 기본 브랜치가 변경되었습니다. 브랜치·PR을 생성하지 않았습니다.')
    // 기본 브랜치에 PATCH/force push하지 않습니다. 같은 review 재전송은 동일 브랜치로 수렴합니다.
    const branch = `content/${prepared.fingerprint.slice(0, 24)}`
    await this.github.request('/git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: next.sha })
    if ((await this.github.head()).sha !== head.sha) throw new HttpError(409, 'STALE_HEAD', `기본 브랜치가 변경되어 PR 생성을 중단했습니다. ${branch} 브랜치는 보존했습니다.`)
    try {
      const pr = await this.github.request<{ number: number; html_url: string }>('/pulls', 'POST', {
        title: message, head: branch, base: head.branch,
        body: `웹 편집기에서 검토한 콘텐츠 변경입니다.\n\n- 기준 SHA: ${head.sha}\n- 변경 파일: content/site.json${prepared.files.length ? ', 프로젝트 이미지' : ''}\n- 서버 스키마·권한·CSRF·이미지 검증 통과\n\n미리보기와 CI를 확인한 뒤 병합하세요. 기본 브랜치 병합 후 Git 연동 배포가 시작됩니다.`,
      })
      return { number: pr.number, url: pr.html_url, commit: next.sha, phase: 'review', message: '변경 PR을 만들었습니다. 병합 전까지 공개 콘텐츠는 바뀌지 않습니다.' }
    } catch { throw new HttpError(502, 'PR_UNCERTAIN', `콘텐츠 브랜치 ${branch}는 생성되었습니다. PR 결과를 확인하지 못했으므로 GitHub에서 먼저 확인하세요. 자동 재시도하지 않습니다.`) }
  }
}

export type Draft = { baseSha: string; content: SiteContent; uploads: { projectId: string; data: string }[] }
