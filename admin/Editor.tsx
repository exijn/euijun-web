import { useEffect, useId, useRef, useState } from 'react'
import { contentSchema, validationMessages, type SiteContent } from '../shared/content'
import { Site } from '../src/Site'

type FieldDefinition = { key: string; label: string; kind?: 'long' | 'list' | 'paragraphs' | 'number' | 'status' }
type Review = { reviewToken: string; changes: { path: string; before: string; after: string }[]; images: string[] }
type SaveResult = { number: number; url: string; message: string; phase: string }
type Upload = { projectId: string; data: string; preview: string }
type Tab = 'profile' | 'projects' | 'openSource' | 'activities' | 'skills'
const tabs: { key: Tab; label: string }[] = [{ key: 'profile', label: '소개·연락처' }, { key: 'projects', label: '프로젝트' }, { key: 'openSource', label: '오픈소스' }, { key: 'activities', label: '활동' }, { key: 'skills', label: '기술' }]
const profileFields: FieldDefinition[] = [
  { key: 'name', label: '이름' }, { key: 'englishName', label: '영문 이름' }, { key: 'handle', label: '워드마크' }, { key: 'role', label: '직무' },
  { key: 'tagline', label: '핵심 문구' }, { key: 'introduction', label: '첫 소개', kind: 'long' }, { key: 'school', label: '학교' }, { key: 'schoolDetail', label: '기수·학년' },
  { key: 'about', label: '소개 문단 (빈 줄로 구분, 최대 3개)', kind: 'paragraphs' }, { key: 'email', label: '공개 이메일' }, { key: 'github', label: 'GitHub URL' },
  { key: 'linkedin', label: 'LinkedIn URL (없으면 비워두세요)' }, { key: 'website', label: '사이트 URL' }, { key: 'domain', label: '표시할 도메인' }, { key: 'contactText', label: '연락 문구' },
]
const projectFields: FieldDefinition[] = [
  { key: 'id', label: '고유 ID' }, { key: 'name', label: '프로젝트명' }, { key: 'headline', label: '한 줄 설명' },
  { key: 'problem', label: '해결하려던 문제', kind: 'long' }, { key: 'role', label: '담당 역할' }, { key: 'result', label: '결과·운영 경험', kind: 'long' },
  { key: 'status', label: '확인된 현재 상태' }, { key: 'technologies', label: '핵심 기술 (한 줄에 하나)', kind: 'list' },
  { key: 'github', label: 'GitHub URL' }, { key: 'sourceUrl', label: '작업 근거 URL' }, { key: 'detailUrl', label: '상세 URL (선택)' },
  { key: 'image', label: '이미지 경로 (업로드 시 자동 지정)' }, { key: 'imageAlt', label: '이미지 설명 (alt)' }, { key: 'imageCaption', label: '이미지 캡션' },
  { key: 'description', label: '상세 설명 (원본 기록 보존)', kind: 'long' }, { key: 'category', label: '분류 (원본 기록 보존)' },
]
const contributionFields: FieldDefinition[] = [
  { key: 'id', label: '고유 ID' }, { key: 'name', label: '프로젝트명' }, { key: 'number', label: 'PR 번호', kind: 'number' },
  { key: 'description', label: '변경 내용', kind: 'long' }, { key: 'status', label: 'PR 상태', kind: 'status' }, { key: 'url', label: 'PR URL' }, { key: 'category', label: '분류' },
]

function Field({ field, value, change }: { field: FieldDefinition; value: unknown; change: (value: unknown) => void }) {
  const id = useId()
  const list = field.kind === 'list' || field.kind === 'paragraphs'
  const separator = field.kind === 'paragraphs' ? '\n\n' : '\n'
  const displayed = Array.isArray(value) ? value.join(separator) : String(value ?? '')
  return <label className={'editor-field ' + (field.kind === 'long' || list ? 'wide' : '')} htmlFor={id}><span>{field.label}</span>
    {field.kind === 'status' ? <select id={id} value={displayed} onChange={(event) => change(event.target.value)}><option value="merged">병합됨</option><option value="open">검토 중</option><option value="closed">종료됨</option><option value="reverted">되돌려짐 (공개 제외)</option></select>
      : field.kind === 'long' || list ? <textarea id={id} rows={field.kind === 'paragraphs' ? 6 : 3} value={displayed} onChange={(event) => change(list ? event.target.value.split(separator) : event.target.value)} />
        : <input id={id} type={field.kind === 'number' ? 'number' : 'text'} value={displayed} onChange={(event) => change(field.kind === 'number' ? Number(event.target.value) : event.target.value)} />}
  </label>
}

function Collection<T extends { id: string; published: boolean }>({ title, items, fields, change, make, extra }: {
  title: string; items: T[]; fields: FieldDefinition[]; change: (items: T[]) => void; make: () => T; extra?: (item: T, index: number) => React.ReactNode
}) {
  const move = (index: number, step: number) => { const next = [...items]; [next[index], next[index + step]] = [next[index + step], next[index]]; change(next) }
  return <div>{items.map((item, index) => <fieldset className="editor-item" key={index}><legend>{title} {index + 1}</legend>
    <div className="item-actions"><label className="checkbox-label"><input type="checkbox" checked={item.published} onChange={(event) => change(items.map((current, i) => i === index ? { ...current, published: event.target.checked } : current))} />공개</label>
      <button type="button" disabled={index === 0} aria-label={`${title} ${index + 1} 위로`} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === items.length - 1} aria-label={`${title} ${index + 1} 아래로`} onClick={() => move(index, 1)}>↓</button>
      <button type="button" className="danger" onClick={() => { if (window.confirm(`${title} ${index + 1}을 초안에서 삭제할까요? 저장 PR이 병합되기 전에는 공개 사이트가 바뀌지 않습니다.`)) change(items.filter((_, i) => i !== index)) }}>삭제</button></div>
    <div className="field-grid">{fields.map((field) => <Field key={field.key} field={field} value={(item as Record<string, unknown>)[field.key]} change={(value) => change(items.map((current, i) => i === index ? { ...current, [field.key]: value } : current))} />)}</div>{extra?.(item, index)}
  </fieldset>)}<button type="button" onClick={() => change([...items, make()])}>+ {title} 추가</button></div>
}

export function Editor() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [baseSha, setBaseSha] = useState('')
  const [branch, setBranch] = useState('')
  const [csrf, setCsrf] = useState('')
  const [tab, setTab] = useState<Tab>('profile')
  const [uploads, setUploads] = useState<Upload[]>([])
  const [review, setReview] = useState<Review | null>(null)
  const [result, setResult] = useState<SaveResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dirty, setDirty] = useState(false)
  const reviewRef = useRef<HTMLElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  async function request<T>(path: string, payload?: unknown): Promise<T> {
    const response = await fetch('/api/manage/' + path, { method: payload === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: payload === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: payload === undefined ? undefined : JSON.stringify(payload) })
    const value = await response.json()
    if (!response.ok) throw new Error(response.status === 404 ? '세션이 만료되었거나 접근 권한이 없습니다. 초안을 내보낸 후 다시 로그인하세요.' : value.error || '요청에 실패했습니다.')
    return value as T
  }
  async function load() {
    setBusy(true); setErrors([])
    try {
      const value = await request<{ content: unknown; baseSha: string; branch: string; csrf: string }>('content')
      setContent(contentSchema.parse(value.content)); setBaseSha(value.baseSha); setBranch(value.branch); setCsrf(value.csrf); setUploads([]); setReview(null); setResult(null); setDirty(false)
    } catch (error) { setErrors([error instanceof Error ? error.message : '불러오지 못했습니다.']) } finally { setBusy(false) }
  }
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])
  useEffect(() => { if (errors.length) errorRef.current?.focus() }, [errors])
  const update = (next: SiteContent) => { setContent(next); setDirty(true); setReview(null); setResult(null); setErrors([]) }
  const payload = () => ({ baseSha, content, uploads: uploads.filter((upload) => content?.projects.some((item) => item.id === upload.projectId)).map(({ projectId, data }) => ({ projectId, data })) })
  async function reviewChanges() {
    const messages = validationMessages(content)
    if (messages.length) { setErrors(messages); return }
    setBusy(true); setErrors([])
    try { setReview(await request<Review>('review', payload())); requestAnimationFrame(() => reviewRef.current?.focus()) }
    catch (error) { setErrors([error instanceof Error ? error.message : '검토 요청 실패']) } finally { setBusy(false) }
  }
  async function save() {
    if (!review || busy) return
    setBusy(true); setErrors([])
    try { setResult(await request<SaveResult>('save', { ...payload(), reviewToken: review.reviewToken })); setReview(null); setDirty(false) }
    catch (error) { setReview(null); setErrors([error instanceof Error ? error.message : '저장 실패']) } finally { setBusy(false) }
  }
  async function uploadImage(projectId: string, file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type) || file.size > 2 * 1024 * 1024) { setErrors(['정적 PNG·JPEG·WebP·AVIF 2 MB 이하 이미지를 선택하세요.']); return }
    const reader = new FileReader()
    reader.onload = () => {
      const preview = String(reader.result)
      setUploads((current) => [...current.filter((item) => item.projectId !== projectId), { projectId, data: preview.split(',')[1], preview }])
      setDirty(true); setReview(null); setResult(null)
    }
    reader.onerror = () => setErrors(['이미지를 읽지 못했습니다.'])
    reader.readAsDataURL(file)
  }
  function exportDraft() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'content-draft.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const newId = () => 'item-' + crypto.randomUUID().slice(0, 8)
  const button = (label: string, action: () => void, disabled = false) => <button type="button" onClick={action} disabled={busy || disabled}>{label}</button>

  return <div className="editor-shell"><header className="editor-header"><div><p className="editor-kicker">개인 콘텐츠 편집</p><h1>콘텐츠 관리</h1><p>기본 브랜치 {branch || '불러오는 중'} · {baseSha.slice(0, 8)}</p></div>{button('로그아웃', () => { if (!dirty || window.confirm('저장하지 않은 초안이 있습니다. 로그아웃할까요?')) void request('logout', {}).then(() => { window.location.href = '/manage' }).catch((error: Error) => setErrors([error.message])) })}</header>
    <div className="editor-notice">변경 내용은 검토 후 GitHub PR로 저장됩니다. PR 병합 전에는 공개 사이트가 바뀌지 않습니다. 비공개 설정은 사이트 노출을 제어하며 Git 저장소의 비밀 보관 기능은 아닙니다.</div>
    {errors.length > 0 && <div className="editor-errors" role="alert" ref={errorRef} tabIndex={-1}><h2>확인해 주세요</h2><ul>{errors.map((message, i) => <li key={i}>{message}</li>)}</ul><a href="/manage">인증 다시 시작</a></div>}
    {busy && <p role="status">처리 중입니다…</p>}
    {!content ? button('다시 불러오기', () => void load()) : <>
      <div className="editor-toolbar">{button(preview ? '편집으로 돌아가기' : '변경 미리보기', () => setPreview(!preview))}{button('최신 내용 다시 불러오기', () => { if (!dirty || window.confirm('로컬 초안을 덮어쓸까요? 필요하면 먼저 초안을 내보내세요.')) void load() })}{button('초안 내보내기', exportDraft)}<span>{dirty ? '저장하지 않은 변경 있음' : '변경 없음'}</span></div>
      {preview ? <section className="editor-preview" aria-label="공개 화면 미리보기"><Site preview content={{ ...content, projects: content.projects.map((project) => ({ ...project, image: uploads.find((image) => image.projectId === project.id)?.preview || project.image })) }} /></section> : <>
        <nav className="editor-tabs" aria-label="편집 항목">{tabs.map((item) => <button type="button" key={item.key} aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
        <form onSubmit={(event) => { event.preventDefault(); void reviewChanges() }}>
          <h2 className="editor-section-title">{tabs.find((item) => item.key === tab)?.label}</h2>
          <fieldset disabled={busy} className="editor-form">
            <legend className="sr-only">콘텐츠 필드</legend>
            {tab === 'profile' && <div className="field-grid">{profileFields.map((field) => <Field key={field.key} field={field} value={content.profile[field.key as keyof SiteContent['profile']]} change={(value) => update({ ...content, profile: { ...content.profile, [field.key]: value } })} />)}</div>}
            {tab === 'projects' && <Collection title="프로젝트" items={content.projects} fields={projectFields} change={(projects) => update({ ...content, projects })} make={() => ({ id: newId(), published: false, featured: false, name: '', headline: '', category: '', description: '', problem: '', role: '', result: '', status: '', technologies: [], image: '', imageAlt: '', imageCaption: '', github: '', sourceUrl: '', detailUrl: '' })} extra={(project, index) => <div className="upload-field"><label className="checkbox-label"><input type="checkbox" checked={project.featured} onChange={(event) => update({ ...content, projects: content.projects.map((item, i) => ({ ...item, featured: i === index ? event.target.checked : false })) })} />대표 프로젝트</label><label>프로젝트 이미지 업로드<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => void uploadImage(project.id, event.target.files?.[0])} /></label><p>최대 2 MB, 전체 요청 4 MB. 서버에서 WebP로 변환합니다. 위의 이미지 설명도 입력하세요.</p>{uploads.find((item) => item.projectId === project.id) && <><p>새 이미지 선택됨 · PR 저장 시 반영</p>{button('선택한 이미지 취소', () => { setUploads(uploads.filter((item) => item.projectId !== project.id)); setReview(null) })}</>}</div>} />}
            {tab === 'openSource' && <><div className="field-grid"><Field field={{ key: 'checkedAt', label: '공개 기록 확인일 (YYYY-MM-DD)' }} value={content.openSource.checkedAt} change={(value) => update({ ...content, openSource: { ...content.openSource, checkedAt: String(value) } })} /><Field field={{ key: 'activityUrl', label: '전체 기여 URL' }} value={content.openSource.activityUrl} change={(value) => update({ ...content, openSource: { ...content.openSource, activityUrl: String(value) } })} /></div><Collection title="기여" items={content.openSource.contributions} fields={contributionFields} change={(contributions) => update({ ...content, openSource: { ...content.openSource, contributions } })} make={() => ({ id: newId(), published: false, name: '', number: 1, description: '', status: 'open' as const, url: '', category: '' })} /></>}
            {tab === 'activities' && <Collection title="활동" items={content.activities} fields={[{ key: 'id', label: '고유 ID' }, { key: 'period', label: '기간' }, { key: 'title', label: '활동명' }, { key: 'description', label: '설명', kind: 'long' }]} change={(activities) => update({ ...content, activities })} make={() => ({ id: newId(), published: false, period: '', title: '', description: '' })} />}
            {tab === 'skills' && <Collection title="기술 분류" items={content.skills} fields={[{ key: 'id', label: '고유 ID' }, { key: 'name', label: '분류명' }, { key: 'items', label: '기술 (한 줄에 하나)', kind: 'list' }]} change={(skills) => update({ ...content, skills })} make={() => ({ id: newId(), published: false, name: '', items: [] })} />}
          </fieldset><div className="editor-save"><button className="primary" type="submit" disabled={busy || !dirty}>변경 내용 검토</button><p>저장 전 입력 검증과 최신 SHA 확인을 수행합니다.</p></div>
        </form>
      </>}
      {review && <section className="review-panel" ref={reviewRef} tabIndex={-1} aria-labelledby="review-title"><h2 id="review-title">저장 전 변경 확인</h2><p>{review.changes.length}개 항목 · 이미지 {review.images.length}개</p>{review.changes.map((change) => <details key={change.path}><summary>{change.path}</summary><div className="diff-columns"><div><h3>변경 전</h3><pre>{change.before}</pre></div><div><h3>변경 후</h3><pre>{change.after}</pre></div></div></details>)}<button className="primary" type="button" disabled={busy} onClick={() => void save()}>확인하고 PR 만들기</button>{button('검토 취소', () => setReview(null))}</section>}
      {result && <section className="save-result" aria-label="저장 결과" role="status"><h2>GitHub 저장 상태</h2><p>{result.message}</p><a className="link underlined" href={result.url} target="_blank" rel="noopener noreferrer">PR #{result.number} 보기 (새 탭)</a>{button('배포 상태 확인', () => { void request<{ phase: string; message: string }>('status?pr=' + result.number).then((status) => setResult({ ...result, ...status })).catch((error: Error) => setErrors([error.message])) })}</section>}
    </>}
  </div>
}
