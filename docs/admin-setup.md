# 비공개 콘텐츠 편집 설정

## 먼저 알아둘 점

코드는 GitHub `exijn/euijun-web`의 `main` 브랜치에 있습니다. OAuth App 생성, 토큰 등록, Vercel 프로젝트·도메인 연결과 실제 배포는 아직 진행하지 않았습니다. 이 설정은 소유자가 직접 준비해야 합니다.

공개 화면은 정적 빌드입니다. 편집기는 서버에서 GitHub 기본 브랜치를 읽습니다. 브랜치에 이 코드와 `content/site.json`이 존재해야 사용할 수 있습니다. GitHub Pages에는 서버가 없어 안전한 편집 기능을 올릴 수 없습니다.

## 환경 변수

`.env.example`을 참고해 로컬에서는 Git에서 제외된 `.env`, 운영에서는 플랫폼의 **서버 환경 변수**에 설정합니다. `VITE_` 접두사나 소스 코드에 값을 넣지 마세요.

| 이름 | 설정 내용 |
| --- | --- |
| APP_ORIGIN | 실제 HTTPS origin. 경로·쿼리 없이 `https://exijn.kr` 형태 |
| GITHUB_CLIENT_ID | 직접 만든 GitHub OAuth App의 Client ID |
| GITHUB_CLIENT_SECRET | 해당 OAuth App의 Client secret |
| GITHUB_OWNER_ID | `gh api users/exijn --jq .id`로 확인한 숫자 ID |
| GITHUB_REPOSITORY | 콘텐츠 저장소의 `exijn/저장소이름` |
| GITHUB_CONTENT_TOKEN | 해당 저장소만 선택한 fine-grained PAT |
| SESSION_SECRET | 암호학적 난수 32바이트의 base64 |
| PORT / HOST | 독립 Node 서버만 선택 설정. 기본 4174 / 127.0.0.1 |

PowerShell에서 키를 **본인 터미널에서만** 생성한 후 안전하게 보관합니다. 결과를 채팅·로그·커밋에 넣지 마세요.

```powershell
@'
import { randomBytes } from 'node:crypto'
console.log(randomBytes(32).toString('base64'))
'@ | node --input-type=module
```

필수 설정이 하나라도 없으면 관리·인증 API는 404로 닫힙니다. 잘못된 origin·키·저장소 설정은 서버 시작 오류로 처리합니다. 관리자 허용 이메일은 사용하지 않습니다.

## GitHub OAuth와 저장 토큰

1. GitHub 개발자 설정에서 **OAuth App**을 직접 만듭니다.
2. Homepage URL을 APP_ORIGIN으로, callback을 정확히 `APP_ORIGIN/auth/callback`으로 설정합니다.
3. OAuth 권한은 `read:user`입니다. 저장소 쓰기 권한을 로그인 토큰에 요청하지 않습니다.
4. 로그인 때 GitHub `/user`에서 **login=exijn + 숫자 ID**를 확인합니다. 같은 이름만 맞거나 다른 ID이면 거절합니다.
5. 별도 fine-grained PAT는 해당 콘텐츠 저장소 **하나만** 선택합니다. Contents와 Pull requests는 Read and write, Deployments는 Read-only, Metadata는 기본 Read-only입니다. 만료일을 설정하고 주기적으로 갱신하세요.
6. GitHub 저장소의 PR 생성 정책·브랜치 보호 규칙을 확인합니다. 토큰은 워크플로 파일 수정 권한이 필요 없습니다.

서버는 OAuth state와 PKCE(S256)를 검증합니다. OAuth 공급자 토큰은 계정 확인 직후 버리고 브라우저에 전달하지 않습니다. 콘텐츠 PAT도 서버에서만 GitHub 고정 호스트에 전송합니다.

## Vercel 구성 (준비된 권장 경로)

1. GitHub `exijn/euijun-web` 저장소를 Vercel Git 연동으로 연결합니다.
2. Root Directory는 저장소 루트, Node.js **24.x**, Build Command는 `npm run build`, Output Directory는 `dist`입니다. `vercel.json`의 설정을 사용합니다.
3. `api/index.ts`가 Node 함수입니다. 인증된 관리 HTML·JS·CSS는 `.private/**`에서 함수가 읽습니다. **`.private`를 정적 공개 폴더에 복사하지 마세요.** 공개 페이지의 JS에는 관리 코드가 없습니다.
4. 서버 비밀 값은 **Production 환경에만** 등록하고, 외부 기여자 PR·fork·검증되지 않은 Preview에는 제공하지 마세요. 빌드 코드는 환경 변수에 접근할 수 있으므로 신뢰할 수 없는 코드를 secret이 있는 환경에서 실행하지 않습니다.
5. Production Branch를 GitHub 저장소의 실제 기본 브랜치로 지정합니다. 서버는 API로 기본 브랜치를 매번 조회하며 main/master를 하드코딩하지 않습니다.
6. 도메인 DNS와 HTTPS, OAuth callback을 확인합니다. 공개 URL을 바꾸면 콘텐츠의 website/domain과 APP_ORIGIN·OAuth callback도 함께 변경합니다.
7. 기본 브랜치에 변경 PR을 병합하면 Git 연동 배포가 실행되도록 플랫폼을 설정합니다. 이 코드는 배포 토큰으로 직접 배포하지 않습니다.
8. API 응답의 `Cache-Control: private, no-store`, `Vary: Cookie`, `X-Robots-Tag: noindex`가 CDN에서 보존되는지 확인합니다.
9. 실제 배포 후 비로그인으로 관리 API와 private-assets가 404인지, `dist`에만 정적 접근이 가능한지 확인합니다.

관리 경로는 공개 sitemap·robots·navigation에 나열하지 않습니다. 해당 경로에만 noindex 헤더를 적용하므로 robots 파일로 경로를 공개하지 않습니다. Vercel 설정 파일은 준비했지만 실제 플랫폼 빌드·OAuth 왕복·DNS는 아직 검증하지 않았습니다.

## 독립 Node 서버

`npm ci` → `npm run build` → `npm start`로 실행합니다. 운영에서는 `NODE_ENV=production`, HTTPS 리버스 프록시, 프로세스 재시작·로그 관리, 신뢰할 수 있는 네트워크 바인딩이 필요합니다. CDN/프록시는 관리 경로를 캐시하면 안 됩니다.

기본 HOST는 127.0.0.1입니다. 컨테이너에서는 필요한 경우 HOST를 0.0.0.0으로 설정하되 직접 인터넷에 HTTP로 노출하지 마세요. 운영 APP_ORIGIN에는 HTTPS만 허용됩니다.

로컬 OAuth 검증은 별도 개발용 App과 `http://localhost:4174` callback을 사용하세요. 쿠키는 로컬에서도 Secure를 유지합니다. localhost 예외를 지원하는 Chromium에서 확인하고, 브라우저가 거절하면 로컬 HTTPS를 사용합니다. 개발 편의를 위한 인증 우회는 없습니다.

## 편집 방법

1. 공개 UI에 없는 `/manage`에 직접 접속하고 GitHub로 인증합니다.
2. 소개·연락처 / 프로젝트 / 오픈소스 / 활동 / 기술 탭에서 필드를 수정합니다.
3. 추가·삭제·위아래 이동, 공개 여부, 대표 프로젝트, 이미지 선택을 사용할 수 있습니다. 삭제는 확인 대화상자를 거칩니다.
4. 변경 미리보기는 현재 브라우저의 초안입니다. 실제 공개 화면에는 아직 반영되지 않습니다.
5. 변경 내용 검토에서 validation과 최신 SHA를 검사하고 변경 전·후 및 이미지 수를 보여줍니다.
6. 확인하고 PR 만들기를 누르면 서버가 검토한 내용만 커밋합니다. 검토 표는 10분 후 만료됩니다.
7. PR을 검토·병합하고 배포 상태 확인을 누릅니다. 다음 편집 전 기존 PR을 병합하고 최신 내용을 다시 불러오는 것을 권장합니다.

화면을 새로고침하면 저장 전 초안은 사라집니다. 초안 내보내기로 JSON을 보관할 수 있습니다. 자동 가져오기 기능은 없으며 복구 시 내보낸 content를 `content/site.json`에 검토 후 반영합니다. 이미지 data에는 원본이 포함되므로 초안도 공개 공유하지 마세요.

## GitHub 동기화·충돌·실패

- 단일 `content/site.json`과 이미지들을 Git blobs → 한 tree → 한 commit으로 만듭니다. 따라서 콘텐츠만 반영되고 이미지가 빠지는 부분 저장을 피합니다.
- 메시지는 `content: update site content`이며 이미지가 있으면 그 사실을 덧붙입니다.
- 검토 내용과 기준 SHA를 암호화된 검토 토큰에 묶고 저장 시 재검증합니다.
- 기본 브랜치의 최신 SHA가 다르면 409로 중단합니다. Git 객체 생성 중 변경도 다시 검사합니다.
- 기본 브랜치를 직접 PATCH/force update하지 않습니다. 내용 digest로 만든 `content/...` 브랜치를 새로 만들고 실제 기본 브랜치 대상으로 PR을 생성합니다.
- 최종 검사와 PR 생성 사이에 원격 변경이 생길 수 있어 **브랜치 보호에서 최신 브랜치·필수 CI 검사를 요구**하세요. PR이므로 최신 기본 브랜치를 강제로 덮어쓰지는 않습니다.
- `.github/workflows/check.yml`은 읽기 전용 권한으로 lint·타입·빌드·테스트를 실행하며 운영 secret을 사용하지 않습니다. 2026-10-01 `main` 실행의 `Site checks`는 성공했습니다. branch protection을 설정한다면 필수 검사로 `checks`를 선택하세요.
- 같은 저장 재전송은 같은 브랜치로 향하며 기존 브랜치를 덮어쓰지 않습니다.
- 네트워크/PR API 오류는 성공 처리하지 않습니다. 브랜치 또는 PR이 생성됐을 가능성을 알리므로 GitHub에서 확인한 뒤 복구하세요. 무조건 다시 저장하면 중복 브랜치 오류가 날 수 있습니다.
- 기본 브랜치 변경 시 초안 내보내기 → 최신 내용 다시 불러오기 → 비교·재적용 순으로 처리합니다.
- 삭제는 콘텐츠 항목 제거이며 예전 이미지와 커밋 기록을 자동 삭제하지 않습니다.
- 병합과 Production deployment 성공은 별도 상태입니다. GitHub Deployments에 기록되지 않는 플랫폼은 병합 완료/상태 확인 불가로 표시하며 배포 성공을 추정하지 않습니다. 실제 URL 최종 확인은 별도로 필요합니다.

## 보안 경계·운영 점검

- HttpOnly + Secure + SameSite=Lax, __Host- 쿠키, AES-256-GCM 세션, 1시간 만료입니다. 모든 관리 요청마다 계정·만료·서명을 재검증합니다.
- 변경 API는 정확한 Origin + 세션별 CSRF 토큰을 검사합니다. CSP, 프레임 차단, nosniff, private/no-store 헤더를 적용합니다.
- 요청 제한은 **프로세스/함수 인스턴스별**입니다: 인증 시작/콜백 각 10회/분, 세션당 120회/분, 수정 12회/분. 분산 서버리스 전체의 제한은 플랫폼 WAF의 IP별 인증/쓰기 rate limit으로 보완해야 합니다. 사용자 헤더에서 임의 IP를 신뢰하지 않습니다.
- 무상태 세션이므로 로그아웃은 해당 브라우저 쿠키를 지웁니다. 이미 탈취된 쿠키를 개별 취소하는 중앙 저장소는 없습니다. 의심 시 SESSION_SECRET을 교체해 전 세션을 무효화하고 PAT/OAuth secret도 필요에 따라 폐기하세요.
- 공개 여부는 콘텐츠 노출 제어입니다. 저장소 기록·public 이미지 자체의 접근 통제가 아니므로 개인정보·비밀 문서를 업로드하지 마세요.
- 이미지 포맷·magic bytes·해상도를 검사하고 WebP 재인코딩합니다. HTML/SVG/스크립트 파일을 업로드할 수 없습니다.
- 저장된 일반 텍스트는 React가 escape합니다. 링크는 HTTPS, 이미지 경로는 허용된 프로젝트 raster 경로만 받습니다.
- `tests/fixture-server.ts`는 로컬 합성 테스트 서버입니다. 운영 진입점은 `server/index.ts` 또는 `api/index.ts`뿐입니다. fixture 서버를 배포하지 마세요.
- 릴리스 전 토큰 최소 권한, GitHub branch protection, 플랫폼 WAF, CDN 캐시, 실제 계정 거부, 토큰 만료·갱신, 복구 절차를 확인하세요.

## 공식 자료

[GitHub OAuth 웹 흐름](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) · [Git tree API](https://docs.github.com/en/rest/git/trees) · [Git refs API](https://docs.github.com/en/rest/git/refs) · [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js) · [Vercel 프로젝트 설정](https://vercel.com/docs/project-configuration) · [Sharp 입력 제한](https://sharp.pixelplumbing.com/api-constructor/)
