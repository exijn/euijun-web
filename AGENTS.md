# 작업 지침

## 시작 전

- 현재 경로, 저장소, 브랜치, HEAD, `git status`, remote 및 원격 브랜치 상태를 확인한다. 관련 이력과 `README.md`, `docs/`, `PRODUCT.md`, `DESIGN.md` 및 작업 대상 코드를 먼저 읽는다.
- 기존 미커밋 변경과 다른 worktree를 보존한다. 변경의 소유자와 범위가 불명확하면 덮어쓰지 않는다. 별도 worktree가 필요할 때는 경로와 기준 브랜치를 먼저 확인한다.

## Git과 배포

- 기본 작업 브랜치는 `portfolio-ui`다. 작업 전후 `origin/main`과 `origin/portfolio-ui`의 상태를 확인하고, 원격 브랜치가 있으면 변경을 통합하기 전에 이력을 검토한다.
- 이 프로젝트에서는 `main`에 직접 push하지 않는다. 요청된 범위에서 의미 있는 단위로 커밋하고 `portfolio-ui`를 push한다. merge와 운영 배포는 별도 명시적 요청이 있을 때만 수행한다. 해당 작업에 더 엄격한 사용자 지시가 있으면 그것을 따른다.
- `reset --hard`, `clean`, `stash`, force push와 사용자 변경 삭제를 임의로 실행하지 않는다. 스테이징 전에 대상 파일과 diff를 확인하고, 관련 없는 변경과 비밀값을 커밋하지 않는다.

## 구조와 계약

- `content/site.json`은 콘텐츠 기준이고 `shared/content.ts`는 검증과 공개 항목 필터를 담당한다. 확인되지 않은 성과를 만들어내지 않는다. 공개 페이지와 관리자 미리보기는 같은 콘텐츠 렌더러를 사용하도록 유지한다.
- `admin/`, `server/`, `api/`의 OAuth, 세션, CSRF, 이미지 검증, GitHub PR 저장 및 SHA 충돌 방지 계약을 보존한다. 비공개 콘텐츠 필터, 메타데이터, robots/sitemap 및 `vercel.json`의 배포 경계도 변경 시 함께 확인한다. 현재 브랜치의 실제 구현과 차이가 있으면 복원 계획과 검증을 먼저 세운다.
- React, TypeScript, Vite와 기존 스타일·테스트 패턴을 우선한다. UTF-8, 기존 줄바꿈을 유지하고 불필요한 의존성과 무관한 리팩터링을 피한다. 비밀값을 읽거나 출력하거나 커밋하지 않는다.

## 검증과 보고

- 코드 변경 시 `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`를 실행한다. Playwright는 Chromium과 localhost:4175를 사용한다. UI 변경은 320, 375, 768, 1024, 1440px 캡처와 키보드, axe, reduced motion을 확인한다. 문서만 수정하면 문서 diff와 링크·명령의 정확성을 확인하고 실행하지 않은 검사를 명시한다.
- 완료 보고에는 브랜치/worktree, 변경 내용과 주요 파일, 실행한 검사와 결과, 미검증 사항, 커밋 및 push 결과를 포함한다. 실제 OAuth·운영 배포·실물 기기 검증을 합성 테스트와 구분한다.

## 디자인 스킬

- 설치된 경우에만 해당 `SKILL.md`를 읽어 적용한다. 프로젝트 목적과 사용자 지시를 우선하고 서로 충돌하는 지침을 동시에 적용하지 않는다.
- Taste Skill은 시각 방향 탐색, Impeccable은 선택한 방향의 타이포그래피·여백·반응형 정교화, web-design-guidelines는 구현 후 접근성·UX 검토에 각각 사용한다.
- 미설치 시 공식 안내만 참고한다: [Impeccable](https://impeccable.style/docs/) `npx impeccable install`, [Taste Skill](https://github.com/Leonxlnx/taste-skill) `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend`, [web-design-guidelines](https://github.com/vercel-labs/web-interface-guidelines) `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`. 설치 범위와 지침을 확인하고 승인 없이 전역 설치하지 않는다.
