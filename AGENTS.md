# 작업 지침

## 작업 시작 전

- 현재 경로, 저장소, 브랜치, HEAD, `git status`, remote 및 관련 원격 브랜치(`origin/main`과 작업 브랜치)의 최신 상태를 확인한다. 관련 이력과 `README.md`, `docs/`, 작업 대상 코드를 먼저 읽고 `PRODUCT.md`, `DESIGN.md`가 있으면 UI 변경 전에 함께 읽는다.
- 기존 미커밋 변경과 다른 worktree를 보존한다. 변경의 소유자와 범위가 불명확하면 덮어쓰지 않는다. 기존 PR과 작업 브랜치는 별도 요청 없이 병합하거나 닫지 않는다.

## Git과 배포

- 작업은 `main` 브랜치에서 하고, 검증을 통과한 커밋은 PR 없이 `origin/main`에 직접 push한다.
- `main` push는 곧 Vercel 운영 배포(exijn.com)다. 그래서 push 전에 `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, `git diff --check`를 모두 실행하고 통과해야 한다. 하나라도 실패하면 push하지 않고 보고한다.
- push 직전에 `git fetch`로 `origin/main`을 확인한다. 원격이 앞서 있으면 `git pull --rebase`로 내 커밋을 위에 올리고, 충돌이 나면 멈추고 보고한다. force push는 하지 않는다.
- 커밋은 의미 있는 단위로 나누고, 파일은 명시적으로 `git add`한다(`git add -A`, `git add .` 금지). Secret, `.env`, 임시 파일, 디자인 전달용 파일(zip, `docs/design/`)은 커밋하지 않는다.
- push 후 GitHub Actions(checks)와 Vercel 운영 배포 상태를 확인해서 보고한다. 실패하면 원인을 보고하고, 되돌릴지(`git revert` 후 push) 사용자에게 묻는다.
- 큰 작업이나 되돌리기 어려운 변경(스키마 마이그레이션, 의존성 대규모 변경, 인증·보안 코드 변경)은 push 전에 변경 요약을 보여주고 사용자 확인을 받는다.
- Vercel 환경 변수·DNS·OAuth App 변경은 사용자가 해당 작업에서 명시적으로 요청했을 때만 수행한다. 사용자가 다른 절차를 명시하면 그 지시를 우선한다.
- `reset --hard`, `git clean`, `stash`, force push와 사용자 변경 삭제, 검증 우회를 임의로 실행하지 않는다. 스테이징 전에 대상 파일과 diff를 확인하고, 관련 없는 변경과 비밀값을 커밋하지 않는다.

## 구조와 계약

- `content/site.json`은 콘텐츠 기준이고 `shared/content.ts`는 검증과 공개 항목 필터를 담당한다. 확인되지 않은 성과를 만들어내지 않는다. 공개 페이지와 관리자 미리보기는 같은 콘텐츠 렌더러를 사용하도록 유지한다.
- `admin/`, `server/`, `api/`의 OAuth, 세션, CSRF, 이미지 검증, GitHub PR 기반 콘텐츠 저장 및 SHA 충돌 방지 계약을 보존한다. 비공개 콘텐츠 필터, 메타데이터, robots/sitemap 및 `vercel.json`의 배포 경계도 변경 시 함께 확인한다. 실제 구현과 차이가 있으면 복원 계획과 검증을 먼저 세운다.
- React, TypeScript, Vite와 기존 스타일·테스트 패턴을 우선한다. UTF-8과 기존 줄바꿈을 유지하고 불필요한 의존성과 무관한 리팩터링을 피한다. 비밀값을 읽거나 출력하거나 커밋하지 않는다.

## 검증과 보고

- 코드 변경 시 `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`를 실행한다. Playwright는 Chromium과 localhost:4175를 사용한다. UI 변경은 320, 375, 768, 1024, 1440px 화면과 키보드, axe, reduced motion을 확인한다. 문서만 수정하면 문서 diff와 링크·명령의 정확성을 확인하고 실행하지 않은 검사를 명시한다.
- 완료 보고에는 push한 커밋 해시와 배포 상태, 변경 내용과 주요 파일, 실행한 검사와 결과, 미검증 사항, 커밋 및 push 결과를 포함한다. 실제 OAuth·운영 배포·실물 기기 검증을 합성 테스트와 구분한다.

## 디자인 스킬

- 설치된 경우에만 해당 `SKILL.md`를 읽어 적용한다. 프로젝트 목적과 사용자 지시를 우선하고 서로 충돌하는 지침을 동시에 적용하지 않는다.
- Taste Skill은 시각 방향 탐색, Impeccable은 선택한 방향의 타이포그래피·여백·반응형 정교화, web-design-guidelines는 구현 후 접근성·UX 검토에 각각 사용한다.
- 미설치 시 공식 안내만 참고한다: [Impeccable](https://impeccable.style/docs/) `npx impeccable install`, [Taste Skill](https://github.com/Leonxlnx/taste-skill) `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`, [web-design-guidelines](https://github.com/vercel-labs/web-interface-guidelines) `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`. 설치 범위와 지침을 확인하고 승인 없이 전역 설치하지 않는다.
