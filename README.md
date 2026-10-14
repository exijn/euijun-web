# exijn.kr · 한의준

React + TypeScript + Vite 개인 홈페이지입니다. 중성 회색, 짧은 소개, 프로젝트 중심의 단일 페이지와 서버 인증을 거치는 별도 콘텐츠 편집기로 구성됩니다.

## 실행

Node.js 24 이상과 npm을 사용합니다.

```powershell
npm ci
npm run dev
```

공개 화면 개발: http://127.0.0.1:5173

```powershell
npm run build
npm start
```

전체 서버: http://localhost:4174. 설정 전에는 공개 페이지만 열리고 관리 경로는 404입니다. `npm run preview`는 공개 정적 빌드만 확인하며 인증·저장 API는 제공하지 않습니다.

## 콘텐츠 수정

콘텐츠의 기준은 GitHub 기본 브랜치의 **`content/site.json`**입니다. 웹 편집기는 이 파일을 읽고 변경 PR을 만듭니다. 로컬 파일을 수정하는 경우에도 빌드에서 같은 스키마를 검사합니다.

| 수정할 내용 | 위치 |
| --- | --- |
| 이름·직무·소개·학교 | `profile` |
| GitHub·이메일·LinkedIn·도메인 | `profile.github / email / linkedin / website / domain` |
| 프로젝트 | `projects` 배열 |
| 오픈소스 | `openSource.contributions` 배열 |
| 활동 | `activities` 배열 |
| 기술 분류 | `skills` 배열 |

- 배열의 항목을 추가·삭제·이동하면 목록이 바뀝니다. `id`는 같은 목록에서 중복되지 않는 영문 소문자·숫자·하이픈입니다.
- `published: false`는 공개 빌드에서 항목을 제외합니다. Git 기록이나 이미지 파일 자체를 비밀로 만드는 기능은 아닙니다.
- 대표 프로젝트는 `featured: true` 하나만 설정합니다. 나머지는 배열 순서로 표시합니다.
- 빈 GitHub·이메일·LinkedIn은 버튼을 표시하지 않습니다. 전화번호 필드는 없습니다.
- 오픈소스는 공개 항목 중 앞의 3개만 표시합니다. `reverted`는 자동 제외됩니다. PR URL과 번호가 일치해야 합니다.
- 상세 설명·분류는 향후 상세 페이지용으로 보존하며 홈페이지에는 문제·역할·결과를 간결하게 표시합니다.
- 색상·폰트는 `src/tokens.css`, 간격·레이아웃은 `src/styles.css`를 수정합니다.
- title·description·canonical·OG 텍스트·Person·noscript·robots·sitemap은 빌드 시 프로필에서 생성됩니다. 도메인 변경 시 `website`와 `domain`을 함께 변경하세요.

## 이미지 교체

실제 화면이 확인되지 않은 프로젝트에는 이미지 영역을 표시하지 않습니다. 검증된 이미지를 추가하면 프로젝트에 표시됩니다.

- 권장: **4:3**, 960×720 또는 1600×1200, 가능하면 200 KB 안팎의 WebP/AVIF. 표시 영역은 4:3으로 크롭되므로 중요한 부분은 중앙에 두세요.
- 직접 수정: `public/images/projects/goms/cover.webp` 등에 파일을 추가하고 해당 프로젝트의 `image`를 `/images/projects/goms/cover.webp`로 설정합니다. `imageAlt`는 필수, `imageCaption`은 선택입니다. GSMC·Washer도 같은 방식입니다.
- 웹 편집: 프로젝트의 이미지 업로드에서 선택하고 alt를 입력합니다. 서버가 검증·메타데이터 제거·최대 1600×1200 WebP 변환 후 `public/images/projects/uploads/<hash>.webp`에 저장합니다.
- 정적 PNG/JPEG/WebP/AVIF만 허용합니다. 각 2 MB, 한 번에 최대 3개, 전체 JSON 요청 4 MB 제한입니다. SVG·움직이는 이미지·24 MP 초과 이미지는 거절됩니다.
- 이미지를 지우려면 선택 중인 업로드를 취소하고 이미지 경로를 비웁니다. 기존 Git 파일은 자동 삭제하지 않아 복구할 수 있습니다.
- 공유 이미지: `public/images/og.svg`를 수정하고 아래 명령으로 `og.png`를 다시 만드세요. OG 이미지의 문자 자체는 자동 갱신되지 않습니다. favicon은 `public/favicon.svg`입니다.

```powershell
npx playwright install chromium
node scripts/render-og.mjs
npm run build
```

## 비공개 편집·배포 설정

**[관리자 설정 안내](docs/admin-setup.md)**를 먼저 읽으세요. 필요한 값은 `.env.example`에 이름과 설명만 있습니다. 실제 자격값은 만들거나 등록하지 않았습니다.

- 공개 페이지에는 관리 링크가 없습니다. 편집기는 별도 번들로 빌드되며 HTML·JS·CSS 모두 서버 인증 뒤에만 제공됩니다.
- GitHub OAuth 계정 이름 `exijn`과 설정한 숫자 ID를 함께 검사합니다.
- 변경 검토 → SHA 충돌 검사 → GitHub 콘텐츠 브랜치·PR → 사용자 병합 → Git 연동 재배포 순서입니다.
- 코드는 GitHub `exijn/euijun-web`의 `main` 브랜치에 있습니다. 편집 기능은 아래 운영 환경 변수와 OAuth App을 설정한 뒤 사용할 수 있습니다.
- `vercel.json`은 공개 정적 파일과 Node 서버리스 인증/API 구성을 준비합니다. 실제 배포·프로젝트 연결은 하지 않았습니다. GitHub Pages만으로는 편집 기능을 사용할 수 없습니다.

## 검사

```powershell
npm run typecheck
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

테스트는 외부 GitHub 쓰기 없이 합성 API로 실행합니다. 브라우저 테스트는 localhost:4175를 사용하며 해당 포트가 비어 있어야 합니다. 320 / 375 / 768 / 1024 / 1440px에서 공개·관리 화면을 확인하고 `docs/screenshots/redesign/`에 캡처합니다.

[검증 기록](docs/verification.md) · [콘텐츠 근거](docs/content-sources.md)

## 주요 구조

- `src/Site.tsx`: 공개 화면·인증된 관리자 미리보기
- `content/site.json`: 편집 가능한 콘텐츠
- `shared/content.ts`: TypeScript 타입·런타임 검증·비공개 항목 필터
- `admin/`: 별도 편집 UI (빌드 결과 `.private/`, 공개 배포 폴더가 아님)
- `server/`: OAuth·세션·CSRF·이미지 검증·GitHub 저장
- `api/index.ts`, `vercel.json`: 서버리스 연결
- `tests/`: 보안·동시 수정·이미지·브라우저 회귀 검사
- `docs/archive/initial-content.json`: 리디자인 전 실제 콘텐츠 보존본

UTF-8을 사용하며 불필요한 BOM·줄바꿈 변경은 피합니다. 기존 `.idea`는 보존하고 추적에서 제외했습니다. 빌드·의존성·실제 환경 파일은 Git에서 제외합니다.
