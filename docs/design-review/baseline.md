# 디자인 베이스라인 (수정 전)

측정일: 2026-11-19. 빌드: `npm run build` 결과(`dist/`, `.private/`, `api/index.js`), 캡처는 `docs/design-review/before/`.

## 0. 방법

- 설치한 스킬 3종: Impeccable `4.10.0`(엔진 `0.1.27` win64), `web-design-guidelines`(vercel-labs/agent-skills, commit `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`), `frontend-design`(anthropics/skills, commit `e4bb5d960d87126ff3b3a8af1a104b7db67560ba`). 모두 `.git/info/exclude`로 추적 제외.
- `/impeccable init` → `PRODUCT.md` 신규 작성. `impeccable context`가 `ACCOUNT: not signed in`을 보고했지만, 이 프로젝트는 계정 로그인 없이 로컬 critique/audit만 사용하기로 함(클라우드 동기화는 선택 사항이며 불필요). 인터뷰는 사용자가 작업 지시에 이미 명시한 고정 제약과 `content/site.json`만 근거로 직접 작성했고(AskUserQuestion 라운드 생략), 이 대체 사실을 여기에 명시함(스킬 프로토콜이 요구하는 공개).
- `/impeccable document` → `DESIGN.md` 신규 작성(스캔 모드, 현재 `src/styles.css` 토큰 기준).
- `/impeccable critique`: 서브에이전트 2개(Assessment A 디자인 리뷰 / Assessment B 디텍터+브라우저 증거)를 병렬 격리 실행 — dual-agent 경로, 디그레이드 아님. 둘 다 라이브 브라우저 자동화 도구에 접근하지 못해(비대화형 서브에이전트 컨텍스트) 사전 캡처한 정적 스크린샷으로 대체했고, 각자 보고서에 이를 명시함.
- `npx impeccable detect --json`을 `src/`, `dist/`, `admin/`에 개별 실행.
- `web-design-guidelines`: 공식 저장소에서 받은 최신 룰셋을 `src/Site.tsx`, `src/components/*.tsx`, `admin/Editor.tsx`, `src/styles.css`, `admin/editor.css`에 직접 적용(파일:라인 형식).
- 기존 Playwright+axe-core e2e 스위트(`npm run test:e2e`, 25개 테스트, 320/375/768/1024/1440px) 전체 통과 — accessibility(wcag2a/aa/21aa) 위반 0건 확인.

## 1. 캡처

| 대상 | 경로 |
|---|---|
| 공개 320/375/390/768/1024/1440px | `docs/design-review/before/public-<width>.png` |
| 편집 화면 390/1440px | `docs/design-review/before/admin-<width>.png` |
| detect 원본 JSON | `docs/design-review/before/detect-{src,dist,admin}.json` |

## 2. Impeccable Critique — Design Health Score

Method: dual-agent (A: general-purpose subagent · B: general-purpose subagent)

| # | Heuristic | Score |핵심 이슈 |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 스크롤-스파이/탭 `aria-pressed`/상태 배지 동작하나 "최신 확인일" 신호 없음 |
| 2 | Match System/Real World | 4 | 자연스러운 한국어, PR 상태 라벨 현지화 |
| 3 | User Control and Freedom | 3 | 모바일 메뉴 Esc/포커스 복귀 양호, 프로젝트 탭 전환이 히스토리에 안 쌓임 |
| 4 | Consistency and Standards | 3 | `.board`가 DESIGN.md 자체 규칙(카드는 상세판넬·연락카드만)을 위반 |
| 5 | Error Prevention | 4 | 파괴적 동작 없음, 외부 링크 rel 안전 |
| 6 | Recognition Rather Than Recall | 4 | 아이콘 전용 내비 없음, 라벨 헤더/보드 중복 표기 |
| 7 | Flexibility and Efficiency | n/a | 단일 세션 정보형 페이지 |
| 8 | Aesthetic and Minimalist Design | 3 | 전반 절제됐으나 히어로가 프로젝트명을 두 번 중복 노출 |
| 9 | Error Recovery | 3 | 테스트할 에러 상태 자체가 없어 소극적 만점 지양 |
| 10 | Help and Documentation | n/a | 정적 정보 페이지에 불필요 |
| **합계** | | **27/32 (84%) — Good** | |

**Design Specificity**: 대체로 저자성 있음(오픈소스 PR 증거 모델, `--brand-1`/`--brand-2`를 명함 앞/뒷면으로 명명한 CSS 주석) — 다만 2단 히어로+고정 탭+카드 그리드+연락 카드라는 구조 자체는 범용 개발자 포트폴리오 골격이며, 특수성은 콘텐츠와 색상 네이밍에만 있음.

**우선순위 이슈(critique)**
| 등급 | 이슈 | 근거 |
|---|---|---|
| P1 | 히어로가 스크롤 전 최대 7개 클릭 타겟(CTA 2–3 + 보드 4행) 노출 — PRODUCT.md 원칙 "한 번에 하나의 주요 행동"과 정면 충돌, 인지부하 체크리스트 3개 항목 실패 | Assessment A |
| P2 | `.board`(히어로 프로젝트 목록)가 DESIGN.md가 스스로 금지한 카드 스타일(배경+테두리+radius)을 실제로 사용 중 | Assessment A, 감사 교차 확인 |
| P2 | 프로젝트 탭 전환이 URL/히스토리에 반영 안 됨(북마크/뒤로가기 불가) | Assessment A — **범위 밖으로 기록**: 인터랙션 플로우 변경이라 이번 디자인 전용 패스에서 구현하지 않음 |
| P2 | `학교 활동`에서 `team`은 빈 값에 `'—'` 대체가 있으나 `period`/`description`은 없어 빈 셀이 버그처럼 보임 | Assessment A |
| P3 | 연락 카드 링크 텍스트가 모바일에서 말줄임 처리되어 실제 URL을 가림 | Assessment A |

**페르소나 레드플래그(요약)**: Jordan(PR 상태 용어에 색/아이콘 구분 없음), Riley(탭 전환 후 뒤로가기 무반응, 빈 활동 행), Casey/QR 명함 방문자(연락까지 거의 2개 화면, 연락 섹션이 맨 마지막, GitHub/LinkedIn/포트폴리오가 시각적으로 동일해 "증거 링크"와 "연락 링크" 구분이 안 됨).

## 3. Impeccable Audit — Technical Health Score

| # | 영역 | 점수 | 핵심 발견 |
|---|---|---|---|
| 1 | Accessibility | 3/4 | axe 위반 0건(Good) — 단, 연락처 필드에 `type=email/url`·`autoComplete` 없음, Lightbox `<img>`에 width/height 없음, 에러가 필드 옆이 아닌 전역 블록으로만 표시 |
| 2 | Performance | 3/4 | 공개 번들 75.55 KB gzip, 편집 133.12 KB gzip — 과도하지 않으나 실측 Lighthouse는 미실행. 이미지 lazy-loading 이미 적용 |
| 3 | Theming | 2/4 | detect 기준 토큰 이탈 86건(advisory 84 + warning 2), 편집 화면이 공개 화면과 다른 토큰 이름(`--accent`/`--secondary`/`--elevated` vs `--brand-1`/`--muted`/`--surface2`)을 별도로 사용 |
| 4 | Responsive Design | 3/4 | 320px에서 프로젝트 탭 "Washer" 라벨이 단어 중간에서 줄바꿈됨(실제 버그, Assessment B 스크린샷으로 확인) |
| 5 | Implementation Integrity | 3/4 | detect 경고 2건 모두 확인 결과 오탐(허위 양성) — `.orepo`의 모노스페이스 폰트는 의도된 코드 스타일 레이블. 유일한 실질 이슈는 `.board` 카드 자기모순 |
| **합계** | | **14/20 — Good(경계)** | |

## 4. `impeccable detect` — 안티패턴 수

| 대상 | 총계 | advisory | warning |
|---|---|---|---|
| `src/` | 46 | 45 | 1 |
| `dist/` | 23 | 22 | 1 |
| `admin/` | 17 | 17 | 0 |
| **합계** | **86** | **84** | **2** |

패턴별: `design-system-font-size` 47건, `design-system-radius` 21건, `design-system-color` 16건, `design-system-font` 2건(둘 다 오탐 — `.orepo`의 의도된 모노스페이스).

**실질 드리프트로 판단**(DESIGN.md 문서화 스케일과 교차 확인):
- font-size: 11개의 서로 다른 값(12–40px)이 문서화된 7단계 사이사이에 흩어져 있음 → 타이포 스케일 통합 필요.
- radius: 8개의 서로 다른 값(2–20px)이 문서화된 5단계 근처에 산재(8px vs 7px 토큰, 9px vs 10px, 12px는 10/14 사이) → 눈대중 px값으로 보임.
- `#17181d`, `rgba(10,11,14,.78)`, `#4a4e5a` — 토큰과 근접하지만 불일치하는 하드코딩 색상.

**오탐으로 판단**: `Cascadia Code`(의도된 코드 레이블), `#9cc3e6`/`#c0b0e3`(CSS가 아니라 `content/site.json`의 프로젝트 식별 색상 데이터), 편집 화면 전용 그레이(`#515151` 등 — 별도 내부 도구 토큰, 이번 Step 33에서 공개 토큰으로 통합 예정이므로 지금은 오탐 처리).

## 5. web-design-guidelines 적용 결과

```
## src/components/Lightbox.tsx
src/components/Lightbox.tsx:51 - img 태그에 명시적 width/height 없음 (다이얼로그 내부라 CLS 영향은 낮지만 권장 위반)

## src/styles.css
src/styles.css:163 - .lightbox-body에 overscroll-behavior: contain 없음 (모바일에서 배경 페이지로 스크롤 체이닝 가능)
src/styles.css:97,114,129 - .hero h1/.sec-hd h2/.pd-top h3에 text-wrap: balance 없음 (좁은 화면에서 한글 제목 마지막 줄 고아 글자 발생 가능)

## admin/Editor.tsx
admin/Editor.tsx:23-25,56-61 - 이메일/GitHub/LinkedIn/웹사이트 필드가 type="text"로만 렌더링(Field 컴포넌트에 email/url kind 없음), autoComplete 속성도 없음
admin/Editor.tsx:101,118 - 폼 에러가 필드별 인라인이 아닌 전역 블록으로만 표시 — 구조 변경 필요해 이번 패스 범위 밖으로 기록(편집 화면 인터랙션 플로우는 유지해야 함)

## admin/editor.css
admin/editor.css:1-11 - 공개 화면과 다른 토큰 이름(--accent/--secondary/--elevated/--danger) 사용, :root 전역 스코프 — Step 33 정렬 대상
admin/editor.css:14 - h1 font-size 26px, 공개 화면 문서화 스케일과 불일치

## src/Site.tsx, src/components/Header.tsx, src/components/ExternalLink.tsx
✓ pass — 아이콘 aria-hidden 일괄 처리, 폼 라벨, 시맨틱 헤딩 순서, 포커스 트랩/복귀, prefers-reduced-motion, color-scheme/theme-color 메타 모두 기존에 올바르게 구현됨
```

파일:라인 발견 수: **9건** (실질 수정 대상 7건 + 범위 밖 기록 2건).

## 6. 우선순위 그룹 매핑 (Step 4에서 사용)

| 그룹 | 반영할 발견 |
|---|---|
| [첫 화면 위계] | 히어로 7-타겟 인지부하(P1), 960–1100px 구간 히어로 밀집 |
| [타이포 스케일·한글 가독성] | font-size 47건 드리프트, heading `text-wrap: balance` 부재, 상태 점 색상이 상태값과 무관 |
| [간격 리듬·비율] | spacing 6–76px 비정리 상태(DESIGN.md Layout 섹션에 이미 기록) |
| [카드·테두리 남용] | `.board` 카드 스타일이 DESIGN.md 자체 규칙 위반 |
| [색 대비·틴트] | radius/color 드리프트(근접 미스매치 색상 3건), 대비 자체는 AA 통과(계산치 4.9–8.6:1) |
| [모바일] | 320px "Washer" 탭 라벨 줄바꿈 버그(실제 버그), 연락 링크 말줄임, lightbox overscroll-behavior |
| [편집 화면] | 토큰 이름 불일치(`--accent` 등), h1 26px 스케일 불일치, 폼 필드 type/autoComplete 부재 |

**범위 밖(이번 패스에서 구현하지 않음, 인터랙션/기능 변경이므로)**: 프로젝트 탭 URL 동기화, 편집기 에러의 필드별 인라인 표시, `학교 활동` 빈 period 처리(→ 이것은 사실 표시 로직이라 포함할지 재검토 — 아래 참고).

> `학교 활동` 빈 period 처리는 **포함**: `team` 필드처럼 `'—'` 대체만 추가하는 것으로 콘텐츠 사실을 바꾸지 않는 순수 표시 로직 수정이라 Step 4 범위에 포함.

## 7. 베이스라인 수치 요약 (재측정 비교용)

| 지표 | 베이스라인 |
|---|---|
| Critique 총점 | 27/32 (84%, Good) |
| Audit 총점 | 14/20 (Good 경계) |
| detect 안티패턴 | 86건 (84 advisory + 2 warning, 2건은 오탐 확인됨) |
| web-design-guidelines 발견 | 9건 (실질 7 + 범위밖 기록 2) |
| axe-core 위반 | 0건 (25/25 e2e 통과) |
