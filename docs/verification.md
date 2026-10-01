# 검증 결과

2026-10-01 · Windows · Node.js 24.11.0 · npm 11.6.1 · Playwright Chromium.

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| npm install | 의존성 설치 완료, lockfile 갱신 |
| npm run typecheck | 통과 |
| npm run lint | 통과 |
| npm run build | 공개·관리 번들 모두 통과 |
| npm test | 서버·스키마·메타데이터 테스트 **18개 통과** |
| npm run test:e2e | 5개 화면 폭 × 5개 테스트, **25개 통과** |
| npm audit --audit-level=low | 취약점 0건 |
| node scripts/render-og.mjs | 중성 회색 OG PNG 생성 완료 |
| node scripts/capture-sections.mjs | 모바일·데스크톱 섹션 캡처 완료 |
| npm start | 공개 페이지·robots·sitemap 200, 설정 없는 관리/API 404 확인 |
| git diff --check | 오류 없음. 단, HEAD 없는 untracked 저장소이므로 tracked diff는 없음 |

공개 JS 235.61 KB / gzip 74.42 KB, CSS 10.00 KB / gzip 2.82 KB. 관리자 JS 331.29 KB / gzip 101.30 KB는 별도 인증 번들이며 공개 첫 화면에서 로드하지 않습니다. 외부 폰트·대형 애니메이션 라이브러리는 사용하지 않습니다.

텍스트 소스·문서·설정의 UTF-8 유효성 및 BOM 없음, 알려진 토큰/개인 키 패턴·디버깅 코드 미검출을 확인했습니다. 실제 secret은 생성·등록하지 않았습니다. 기존 줄바꿈을 일괄 변환하지 않았습니다.

## 공개·관리 브라우저 검사

320 / 375 / 768 / 1024 / 1440px에서 다음을 확인했습니다.

- 가로 넘침, 주요 텍스트·이미지의 뷰포트 이탈, 누락 이미지 없음.
- 빈 링크·전화번호 링크·공개 관리 링크 없음. 설정되지 않은 LinkedIn 숨김.
- 내부 anchor, 모바일 메뉴·Escape, skip link, focus-visible, 현재 섹션 표시, 맨 위로 이동.
- reduced motion에서 콘텐츠 표시, 애니메이션·smooth scroll 해제.
- 공개 페이지와 관리자 폼의 axe WCAG 2 A/AA·2.1 AA 자동 검사 위반 0건.
- 관리자 필드 validation, 프로젝트 추가·삭제 취소/확인·순서 변경·공개 토글·미리보기.
- 이미지 파일 선택·미리보기 → 서버 WebP 변환 → 검토 → PR 저장 흐름 (375px, 합성 API).
- 변경 전후 확인, 저장 결과, PR 검토 대기와 배포 성공 구분.
- 비인증 화면에는 최소 인증 진입만 있고 관리자 JS 요청 없음. 관리 API는 404.
- 최종 정상 흐름에서 브라우저 console/runtime 오류 없음.

업로드 검증을 추가할 때 손상된 테스트용 PNG가 정상적으로 거절되는 것을 확인했고, 유효한 PNG fixture로 수정 후 전체 검사를 다시 통과했습니다. 테스트를 통과시키기 위해 서버 검증을 완화하지 않았습니다.

편집기 테스트에는 운영 콘텐츠와 분리한 합성 데이터를 사용합니다. 공개 페이지 테스트는 실제 content/site.json을 읽으므로 정상적인 프로필·LinkedIn·프로젝트 변경을 잘못된 하드코딩 기대값으로 거절하지 않습니다.

## 서버 보안·저장 검사

- 세션 변조·만료·용도 혼동·다른 소유자 거절.
- 필수 설정 누락 시 fail closed, 강한 세션 키 확인.
- 비인증 API·관리 번들 차단, 비밀 값 응답/공개 번들 미포함.
- OAuth state·PKCE, 허용 login과 숫자 ID 동시 확인.
- 수정 API의 Origin + CSRF 검사, 요청 제한.
- 잘못된 JSON, script URL, 경로 traversal, 중복 ID, 추가 필드 거절.
- HTML/JSON-LD escaping, 빈 연락처 제거, 달러 기호 치환 회귀 검사.
- 비공개·reverted 항목은 공개 번들 생성 전에 제거.
- 콘텐츠·이미지 단일 Git tree 저장, 기본 브랜치 자동 발견 (fixture는 trunk).
- 검토 뒤 변조·최신 SHA 변경·저장 도중 변경 시 중단.
- GitHub 실패와 부분 PR 실패를 성공으로 표시하지 않음. 재전송 시 force update 없음.
- 업로드 magic bytes/포맷 검증, WebP 재인코딩, SVG 거절.
- PR 병합과 Production 배포 기록 구분.

## 화면 캡처

다섯 폭의 첫 화면과 모바일·데스크톱 전체 페이지, 편집기 화면을 육안 확인했습니다. 큰 서버 그래픽·통계 카드·가짜 UI를 제거했고 한국어 소개에서 프로젝트로 바로 이어지는 구성을 확인했습니다. 이후 이미지 캡션 등 수정 후 자동 캡처를 다시 생성했습니다.

- [320px 첫 화면](screenshots/redesign/320px-hero.png)
- [375px 첫 화면](screenshots/redesign/375px-hero.png) · [전체 페이지](screenshots/redesign/375px-full.png) · [관리 화면](screenshots/redesign/375px-editor.png)
- [768px 첫 화면](screenshots/redesign/768px-hero.png)
- [1024px 첫 화면](screenshots/redesign/1024px-hero.png)
- [1440px 첫 화면](screenshots/redesign/1440px-hero.png) · [전체 페이지](screenshots/redesign/1440px-full.png) · [관리 화면](screenshots/redesign/1440px-editor.png)
- [모바일 프로젝트](screenshots/redesign/375px-project.png) · [오픈소스](screenshots/redesign/375px-open-source.png) · [활동](screenshots/redesign/375px-activities.png)

redesign 밖의 기존 캡처는 이전 버전 기록으로 보존합니다. 관리자 캡처의 데이터·SHA·브랜치는 테스트용이며 실제 저장 기록이 아닙니다.

## 검증하지 못한 부분·배포 조건

- 실제 GitHub OAuth 왕복, 운영 자격값·권한, 실제 commit/PR/병합/배포는 실행하지 않았습니다. 저장 관련 네트워크는 **합성 GitHub API**로 검증했습니다.
- 원격 저장소는 비어 있습니다. 초기 코드 등록과 OAuth/PAT·서버 환경 설정은 소유자 작업이 필요합니다.
- Vercel 함수·rewrite·includeFiles 설정은 준비했으나 실제 플랫폼 빌드·CDN·쿠키 전달은 배포 후 확인해야 합니다.
- GitHub Actions 파일은 준비했지만 원격 실행은 하지 않았습니다. Windows 로컬 검증을 Linux runner 실행으로 간주하지 않습니다.
- 요청 제한은 인스턴스 단위입니다. 분산 WAF 제한과 최신 브랜치/CI를 요구하는 보호 규칙 설정이 필요합니다.
- 무상태 세션에는 개별 원격 취소 기능이 없습니다. 키 교체로 전체 세션을 무효화할 수 있습니다.
- GitHub 프로필·프로젝트·기여는 공개 기록을 확인했습니다. [콘텐츠 근거](content-sources.md)를 참고하세요.
- 사용자 수·팀장·운영 기간·GSMC/Washer 현재 실가동 여부는 새로 단정하지 않았습니다. 학교·활동은 사용자 제공 기록을 보존했습니다.
- 이메일 발송, DNS/HTTPS·QR 스캔, 실배포 OG 크롤러, 실물 모바일·Safari·Firefox·스크린리더 수동 검사, Lighthouse·실사용 성능 측정은 하지 않았습니다.

기존 .idea와 원본 콘텐츠 보존. Git branch main, HEAD 없음, 전체 소스는 untracked 상태입니다. commit/push/실제 PR/remote 변경/배포/secret 등록은 하지 않았습니다.
