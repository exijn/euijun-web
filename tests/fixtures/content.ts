import type { SiteContent, Project } from '../../shared/content.ts'

// 운영 콘텐츠를 편집해도 CMS 회귀 테스트의 시작 상태는 바뀌지 않습니다.
const project = (id: string, name: string, featured = false): Project => ({
  id, name, featured, published: true, category: '', description: '테스트용 상세 설명',
  headline: '테스트용 서비스', problem: '테스트용 문제', role: 'Backend', result: '테스트용 결과', status: '검증용',
  technologies: ['Kotlin'], image: '', imageAlt: '', imageCaption: '',
  github: 'https://github.com/exijn', sourceUrl: '', detailUrl: '',
})

export const fixtureContent: SiteContent = {
  schemaVersion: 1,
  profile: {
    name: '한의준', englishName: 'EUIJUN HAN', handle: 'exijn', role: 'Backend Developer',
    tagline: '편집 기능 검증용 소개입니다.', introduction: '합성 데이터로 편집 기능을 확인합니다.',
    school: '테스트 학교', schoolDetail: '검증용', email: 'test@example.com', github: 'https://github.com/exijn',
    linkedin: '', website: 'https://example.com', domain: 'example.com', about: ['테스트용 소개 문단입니다.'], contactText: '테스트용 연락 문구입니다.',
  },
  projects: [project('goms', 'GOMS', true), project('gsmc', 'GSMC'), project('washer', 'Washer')],
  openSource: {
    checkedAt: '2026-10-01', activityUrl: 'https://github.com/exijn',
    contributions: [{ id: 'sample', published: true, name: '테스트 기여', number: 1, url: 'https://github.com/example/example/pull/1', category: '', description: '합성 기여 데이터입니다.', status: 'merged' }],
  },
  activities: [{ id: 'sample', published: true, period: '2026', title: '테스트 활동', description: '합성 활동 데이터입니다.' }],
  skills: [{ id: 'main', published: true, name: 'Main', items: ['Kotlin', 'Java'] }],
}
