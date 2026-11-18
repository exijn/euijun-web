import type { SiteContent, Project } from '../../shared/content.ts'

// 운영 콘텐츠를 편집해도 CMS 회귀 테스트의 시작 상태는 바뀌지 않습니다.
const project = (id: string, name: string): Project => ({
  id, name, published: true, headline: '테스트용 서비스', team: '약 5명', role: 'Backend',
  status: '', color: '#dce2f0', technologies: ['Kotlin'], work: ['테스트용 작업'], note: '',
  image: '', imageAlt: '', github: 'https://github.com/exijn',
})

export const fixtureContent: SiteContent = {
  schemaVersion: 2,
  profile: {
    name: '한의준', englishName: 'EUIJUN HAN', role: 'Backend Developer',
    tagline: '편집 기능 검증용 소개입니다.', introduction: '합성 데이터로 편집 기능을 확인합니다.',
    school: '테스트 학교 소프트웨어학과 재학', schoolShort: '테스트 학교', email: 'test@example.com', github: 'https://github.com/exijn', linkedin: '',
    website: 'https://example.com', domain: 'example.com', contactText: '테스트용 연락 문구입니다.',
  },
  projects: [project('goms', 'GOMS'), project('gsmc', 'GSMC'), project('washer', 'Washer')],
  ways: [{ id: 'sample', published: true, title: '테스트 항목', sub: 'GOMS', text: '합성 항목 데이터입니다.' }],
  openSource: {
    checkedAt: '2026-10-01',
    contributions: [{ id: 'sample', published: true, name: '테스트 기여', repo: 'example/example', number: 1, url: 'https://github.com/example/example/pull/1', description: '합성 기여 데이터입니다.', status: 'merged' }],
  },
  activities: [{ id: 'sample', published: true, period: '2026', title: '테스트 활동', description: '합성 활동 데이터입니다.' }],
  skills: [{ id: 'main', published: true, name: 'Main', items: ['Kotlin', 'Java'] }],
}
