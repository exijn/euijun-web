import type { Config } from './config.ts'
import { HttpError } from './security.ts'

export type Fetcher = typeof fetch
export class GitHub {
  config: Config
  fetcher: Fetcher
  constructor(config: Config, fetcher: Fetcher = fetch) { this.config = config; this.fetcher = fetcher }
  async request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
    let response: Response
    try {
      response = await this.fetcher(`https://api.github.com/repos/${this.config.repository}${path}`, {
        method, headers: { Authorization: `Bearer ${this.config.contentToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'User-Agent': 'euijun-content-editor' },
        body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(12000), redirect: 'error',
      })
    } catch { throw new HttpError(502, 'GITHUB_UNCERTAIN', 'GitHub 응답을 확인하지 못했습니다. 변경이 생성되었을 수 있으니 저장소의 PR·브랜치를 먼저 확인하세요.') }
    if (!response.ok) {
      if (response.status === 409) throw new HttpError(409, 'GITHUB_CONFLICT', '저장소가 비어 있거나 변경이 충돌했습니다. 기본 브랜치를 확인하세요.')
      throw new HttpError(502, 'GITHUB_ERROR', `GitHub 요청 실패 (${response.status}). 권한·요청 제한·저장소 상태를 확인하세요. 성공으로 처리하지 않았습니다.`)
    }
    return response.json() as Promise<T>
  }
  async head() {
    const repo = await this.request<{ default_branch: string }> ('')
    const ref = await this.request<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(repo.default_branch)}`)
    return { branch: repo.default_branch, sha: ref.object.sha }
  }
  async snapshot() {
    const head = await this.head()
    const file = await this.request<{ content: string; encoding: string }>(`/contents/content/site.json?ref=${head.sha}`)
    if (file.encoding !== 'base64') throw new HttpError(502, 'CONTENT_FORMAT', '콘텐츠 파일 형식을 확인하세요.')
    return { ...head, content: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as unknown }
  }
  async status(number: number) {
    const pr = await this.request<{ state: string; merged: boolean; html_url: string; merge_commit_sha: string | null; head: { ref: string; repo: { full_name: string } }; base: { repo: { full_name: string } } }>(`/pulls/${number}`)
    if (!pr.head.ref.startsWith('content/') || pr.head.repo.full_name !== this.config.repository || pr.base.repo.full_name !== this.config.repository) throw new HttpError(404, 'NOT_FOUND', 'Not found')
    if (!pr.merged || !pr.merge_commit_sha) return { phase: pr.state === 'closed' ? 'closed' : 'review', message: pr.state === 'closed' ? '병합하지 않고 종료되었습니다.' : 'PR 검토 대기 중입니다. 아직 공개 사이트에 반영되지 않았습니다.', url: pr.html_url }
    try {
      const deployments = await this.request<{ id: number; environment: string }[]>(`/deployments?sha=${pr.merge_commit_sha}&per_page=10`)
      const production = deployments.find((deployment) => deployment.environment.toLowerCase() === 'production')
      if (!production) return { phase: 'merged', message: '병합 완료. Production 배포 기록은 아직 없습니다.', url: pr.html_url }
      const statuses = await this.request<{ state: string }[]>(`/deployments/${production.id}/statuses?per_page=1`)
      const state = statuses[0]?.state
      return { phase: state === 'success' ? 'deployed' : ['failure', 'error'].includes(state) ? 'failed' : 'deploying', message: state === 'success' ? 'GitHub Production 배포 성공 기록을 확인했습니다.' : ['failure', 'error'].includes(state) ? '배포가 실패했습니다. 배포 플랫폼 로그를 확인하세요.' : '배포 진행 중입니다.', url: pr.html_url }
    } catch { return { phase: 'unknown', message: '병합은 완료됐지만 배포 상태를 조회하지 못했습니다. 배포 플랫폼을 확인하세요.', url: pr.html_url } }
  }
}
