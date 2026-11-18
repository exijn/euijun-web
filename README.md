# exijn.com · 한의준

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
| GitHub·LinkedIn·이메일·도메인 | `profile.github / linkedin / email / website / domain` |
| 증명사진·포트폴리오 PDF | `profile.photo`, `profile.portfolio` |
| 프로젝트 | `projects` 배열 |
| 프로젝트 화면 캡처·관련 문서 | `project.screenshots`, `project.documents` 배열 |
| 해 온 일 | `ways` 배열 |
| 오픈소스 | `openSource.contributions` 배열 |
| 활동 | `activities` 배열 |
| 기술 분류 (공개 화면에는 표시되지 않음) | `skills` 배열 |

- 배열의 항목을 추가·삭제·이동하면 목록이 바뀝니다. `id`는 같은 목록에서 중복되지 않는 영문 소문자·숫자·하이픈입니다.
- `published: false`는 공개 빌드에서 항목을 제외합니다. Git 기록이나 이미지 파일 자체를 비밀로 만드는 기능은 아닙니다. 아직 확인하지 못한 프로젝트 상태나 오픈소스 기여는 `published: false`로 두거나 `status`를 빈 문자열로 둡니다.
- 프로젝트 순서가 그대로 첫 화면 보드와 탭 순서로 표시됩니다.
- 빈 GitHub·LinkedIn·이메일은 버튼을 표시하지 않습니다. 전화번호 필드는 없습니다.
- 오픈소스는 공개(`published: true`)이고 `reverted`가 아닌 전체 항목을 표시합니다. PR URL과 번호가 일치해야 합니다.
- 프로젝트의 `color`는 `#rrggbb` 형식이며 프로젝트 탭·보드의 식별 점 색상입니다.
- 색상 변수는 `src/styles.css`의 `.site` 블록 상단(`--brand-1`, `--brand-2`, `--on-brand` 등)에서, 간격·레이아웃도 같은 파일에서 수정합니다.
- title·description·canonical·OG 텍스트·Person·noscript·robots·sitemap은 빌드 시 프로필에서 생성됩니다. 도메인 변경 시 `website`와 `domain`을 함께 변경하세요.

## 이미지 교체

실제 화면이 확인되지 않은 프로젝트에는 이미지 영역을 표시하지 않습니다. 검증된 이미지를 추가하면 프로젝트에 표시됩니다. 용도별 저장 시 최대 치수는 다음과 같으며 모두 비율을 유지하고 자르지 않습니다.

| 용도 | 최대 치수 | 비고 |
| --- | --- | --- |
| 프로젝트 대표 목업 (`project.image`) | 1600×900 (16:9) | 16:9 틀에 `object-fit: contain` |
| 프로젝트 화면 캡처 (`project.screenshots`, 최대 4장) | 긴 변 1600 | 세로(앱)·가로(웹) 모두 가능, 썸네일 클릭 시 확대 보기 |
| 증명사진 (`profile.photo`) | 800×800 | 연락 카드에는 정사각형으로 `object-fit: cover` 표시 |

- 직접 수정: `public/images/projects/goms/cover.webp` 등에 파일을 추가하고 해당 프로젝트의 `image`를 `/images/projects/goms/cover.webp`로 설정합니다. `imageAlt`는 필수입니다. 캡처는 `screenshots[].image`, 사진은 `profile.photo.image`에 같은 방식으로 지정하며 각각 alt가 필수입니다.
- 웹 편집: 해당 업로드 버튼에서 선택하고 alt를 입력합니다. 서버가 검증·메타데이터 제거 후 용도별 최대 치수 안에서 비율을 유지해 WebP로 변환하고 `public/images/<projects|profile>/uploads/<hash>.webp`에 저장합니다.
- 정적 PNG/JPEG/WebP/AVIF만 허용합니다. 개별 이미지는 2 MB, 한 번에 최대 6개(대표 목업 1 + 캡처 최대 4 + 증명사진 1), 전체 JSON 요청은 4 MB 이하입니다. 편집기가 선택 즉시 브라우저에서 WebP로 줄여 보내므로 실제 전송량은 이보다 작습니다. SVG·움직이는 이미지·24 MP 초과 이미지는 거절됩니다.
- 이미지를 지우려면 선택 중인 업로드를 취소하고 이미지 경로를 비웁니다. 기존 Git 파일은 자동 삭제하지 않아 복구할 수 있습니다.
- 공유 이미지: `public/images/og.svg`를 수정하고 아래 명령으로 `og.png`를 다시 만드세요. OG 이미지의 문자 자체는 자동 갱신되지 않습니다. favicon은 `public/favicon.svg`입니다.

## 포트폴리오 PDF

- `profile.portfolio`에 `label`(버튼 문구), `url`(Vercel Blob 공개 주소), `updatedAt`을 저장합니다. 비어 있으면 첫 화면과 연락 카드의 포트폴리오 버튼 자체가 보이지 않습니다.
- 웹 편집의 "소개·연락처" 탭에서 PDF를 선택하면 서버를 거치지 않고 브라우저에서 Vercel Blob으로 바로 올라갑니다(client upload, 최대 20 MB, `portfolio/` 경로). 저장(PR 생성) 시 서버가 URL이 이 프로젝트의 Blob 스토어 호스트인지, 파일이 실제 PDF(`%PDF-`로 시작)인지 다시 확인한 뒤에만 `content/site.json`에 반영합니다.
- `BLOB_READ_WRITE_TOKEN`이 설정되지 않으면 업로드 버튼이 "스토리지 미설정" 안내로 바뀌고 나머지 편집 기능은 그대로 동작합니다. 설정 방법은 [관리자 설정 안내](docs/admin-setup.md)를 참고하세요.
- 업로드된 PDF는 업로드 즉시 추측하기 어려운 공개 URL로 접근할 수 있지만, 공개 화면에 실제로 반영되는 것은 PR 병합 후입니다. 예전 PDF는 자동 삭제되지 않습니다.

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
- `server/`: OAuth·세션·CSRF·이미지 검증·GitHub 저장·Vercel Blob 업로드 토큰 발급(`server/blob.ts`)
- `api/index.ts`, `vercel.json`: 서버리스 연결
- `tests/`: 보안·동시 수정·이미지·브라우저 회귀 검사
- `docs/archive/initial-content.json`: 리디자인 전 실제 콘텐츠 보존본

UTF-8을 사용하며 불필요한 BOM·줄바꿈 변경은 피합니다. 기존 `.idea`는 보존하고 추적에서 제외했습니다. 빌드·의존성·실제 환경 파일은 Git에서 제외합니다.
