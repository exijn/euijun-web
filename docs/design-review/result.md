# 디자인 재측정 결과 (수정 후)

측정일: 2026-11-19. 동일한 빌드·캡처 방법을 `baseline.md`와 동일하게 재적용함(`npm run build` → 고정 포트 프리뷰 서버 → Playwright 캡처 → Impeccable critique(이중 서브에이전트)/detect → web-design-guidelines 재검토).

## 0. 요약 표

| 지표 | 수정 전 | 수정 후 | 비고 |
|---|---|---|---|
| Critique 총점 | 27/32 (84%, Good) | 26/32 (81%, Good) | 거의 동일 — 아래 "점수가 오르지 않은 이유" 참고 |
| Audit 총점 | 14/20 (Good 경계) | **18/20 (Excellent)** | Theming 2→4, Responsive 3→4, Implementation Integrity 3→4 |
| detect 안티패턴 | 86건 (84 advisory+2 warning) | **3건** (전부 확인된 오탐) | src 46→0, dist 23→3, admin 17→0 |
| web-design-guidelines 발견 | 9건 (실질 7 + 범위밖 2) | 실질 7건 중 **4건 해결**, 1건 검토 후 변경 불필요, 2건 범위밖 유지 | 아래 5절 |
| axe-core 위반 | 0건 (25/25 e2e 통과) | 0건 (25/25 e2e 통과, 전 과정 재검증) | 유지 |
| 320px "Washer" 탭 줄바꿈 버그 | 재현됨 | **수정 확인** | Assessment B 2회 모두 확인 |
| 번들 크기(공개, gzip) | 75.55 KB JS / 3.58 KB CSS | 75.55 KB JS / 3.75 KB CSS | 사실상 동일(토큰 주석 추가분) |

## 1. 점수가 오르지 않은 이유 (정직하게 보고)

Critique 총점은 27/32 → 26/32로 **1점 낮아졌습니다.** 목표(점수 상승)를 완전히 달성하지 못했으므로 있는 그대로 보고합니다.

이전에 지적된 두 가지 우선 이슈는 재측정에서 **해결로 확인**되었습니다:
- [P1] 히어로 인지부하(최대 7개 동시 타겟) → `.board` 카드 제거로 시각적 비중이 줄어 체크리스트 8항목 중 실패 0–1개로 개선.
- [P2] `.board`가 DESIGN.md 자체 규칙(카드는 상세판넬·연락카드만) 위반 → 완전히 해결, 코드로 확인됨.

하지만 재검토(Assessment A)가 **이번에 새로 포착한 이슈**가 점수를 깎았습니다: 프로젝트별 식별 색상 점(`project.color`: 주황 `#e3b183`, 파랑 `#9cc3e6`, 보라 `#c0b0e3`)이 `.prow i`(히어로 보드), `.ptab-name i`(탭), `.pd-top h3 i`(상세 제목)에 쓰이고 있는데, 이는 "브랜드 색 3개만" 제약 및 DESIGN.md의 "The One Accent Rule"(색은 상호작용에만)과 충돌합니다.

**이 색상 점은 이번 작업에서 새로 추가한 것이 아니라 기존 콘텐츠 기능**(`content/site.json`의 `project.color` 필드, README에 "프로젝트 탭·보드의 식별 점 색상"으로 이미 문서화됨)입니다. 사실을 바꾸지 않는 범위에서 디자인만 다듬는다는 이번 작업 원칙상 콘텐츠 스키마 필드나 기존 식별 기능을 제가 임의로 제거·변경하지 않았습니다. 따라서 이는 **6절의 "사용자가 결정할 사항"**으로 넘기고, 점수에는 반영된 채로 정직하게 보고합니다.

## 2. Impeccable Audit — 기술 건전성 재측정

| # | 영역 | 수정 전 | 수정 후 | 근거 |
|---|---|---|---|---|
| 1 | Accessibility | 3/4 | 3/4 | axe 0건 유지. 편집기 필드 type/autoComplete, 인라인 에러는 범위 밖으로 유지(그대로) |
| 2 | Performance | 3/4 | 3/4 | 번들 크기 사실상 동일, 실측 Lighthouse는 이번에도 미실행 |
| 3 | Theming | 2/4 | **4/4** | detect 토큰 이탈 86→3(전부 오탐 확인), 편집·공개 화면 토큰 완전 통합(`:root` 공유) |
| 4 | Responsive Design | 3/4 | **4/4** | 320px "Washer" 줄바꿈 버그 수정 확인(Assessment B 재검증) |
| 5 | Implementation Integrity | 3/4 | **4/4** | `.board` 자기모순 해결, detect 경고 0건(src/admin) |
| **합계** | | **14/20** | **18/20 (Excellent)** | |

## 3. `impeccable detect` — 수정 전후

| 대상 | 수정 전 | 수정 후 |
|---|---|---|
| `src/` | 46 | **0** |
| `dist/` | 23 | **3** (전부 확인된 오탐) |
| `admin/` | 17 | **0** |
| **합계** | **86** | **3** |

남은 3건(모두 `dist/`, 생성 산출물):
1–2. `design-system-color` advisory, `#9cc3e6`/`#c0b0e3` — `content/site.json`의 프로젝트 식별 색상 **데이터**가 번들에 포함된 것으로, CSS가 아니라 1절의 "사용자가 결정할 사항"과 동일한 근원.
3. `design-system-font` warning, `Cascadia Code` — `.orepo`(저장소 경로) 전용 의도된 모노스페이스. `src/styles.css`에 `impeccable-disable-next-line` 주석으로 근거와 함께 억제 처리했으나(소스 기준 0건 달성), 별도로 재생성되는 `dist/` 번들에는 이 주석이 전파되지 않아 그대로 나타남 — 빌드할 때마다 반복되는, 설명 가능한 잔여치.

목표("0건, 또는 모든 잔여 건에 근거 명시")는 **달성**: 남은 3건 모두 근거가 있습니다.

## 4. 수정 내역 (그룹별)

| 그룹 | 조치 |
|---|---|
| [첫 화면 위계] | 히어로 보드를 카드에서 상단 구분선만 있는 조용한 목록으로 격하, 72→76px 패딩 정렬로 하나의 리듬에 편입 |
| [타이포 스케일·한글 가독성] | 14개 산발적 font-size → 9단계 `--fs-*` 토큰(13–52px)으로 통합, 제목 3곳에 `text-wrap: balance` 추가 |
| [간격 리듬·비율] | `--space-section`(76px) / `--space-section-sm`(60px) / `--space-block`(32px) 3단계 토큰화 |
| [카드·테두리 남용] | `.board` 카드 스타일(배경+테두리+radius) 완전 제거 — 카드는 `.pdetail`·`.card` 두 곳만 |
| [색 대비·틴트] | 근접 미스매치 하드코딩 색 3건(`#17181d`,`#4a4e5a`,`rgba(10,11,14,.78)`,`#ffffff`)을 토큰화, 13개 산발적 border-radius → 7단계 `--radius-*` 토큰으로 통합 |
| [모바일] | 320px "Washer" 탭 라벨 중간 줄바꿈 버그 수정(`word-break: keep-all` 적용), 연락 카드 링크 말줄임 제거(전체 URL 표시), lightbox `overscroll-behavior: contain` 추가, `학교 활동` 빈 기간에 `'—'` 대체 |
| [편집 화면] | `admin/editor.css`의 독자 토큰 세트(`--accent`/`--secondary`/`--elevated`) 제거, 공개 화면과 동일한 `:root` 토큰 공유로 통합. 편집기 전용 `--danger`만 유지. 인터랙션 흐름은 변경하지 않음 |

## 5. web-design-guidelines 재검토

| 원 발견 | 상태 |
|---|---|
| `src/components/Lightbox.tsx:51` img width/height 없음 | 검토 후 **변경 불필요** — 다이얼로그 내부라 일반 문서 흐름에 없어 CLS 영향이 사실상 없음(처음부터 레이아웃을 예약할 필요가 없는 위치) |
| `.lightbox-body` overscroll-behavior 없음 | **해결** |
| 제목 3곳 text-wrap:balance 없음 | **해결** |
| 편집기 이메일/URL 필드 type·autoComplete 없음 | **범위 밖 유지** — 편집 화면은 토큰/타이포만 맞추기로 했고 필드 동작 변경은 포함하지 않음. 6절에 사용자 결정 사항으로 기록 |
| 편집기 폼 에러가 필드별 인라인이 아님 | **범위 밖 유지** — 동일한 이유 |
| `admin/editor.css` 토큰 이름 불일치 | **해결** |
| `admin/editor.css` h1 26px 스케일 불일치 | **해결** |

실질 7건 중 4건 해결, 1건 검토 후 불필요 확인, 2건은 처음부터 범위 밖으로 명시한 대로 유지.

## 6. 사용자가 결정할 사항

1. **프로젝트 식별 색상 점**(주황/파랑/보라, `content/site.json`의 `project.color`): 현재 "브랜드 색 3개만" 원칙과 기술적으로 충돌하지만, 이미 있던 콘텐츠 기능이라 이번 작업에서 임의로 없애거나 단색으로 바꾸지 않았습니다. ― 그대로 유지할지, 단일 중립색(`--brand-2`/`--soft`)으로 통일할지, 색상을 공식적으로 4번째 "식별용" 토큰으로 DESIGN.md에 추가할지 결정이 필요합니다.
2. **한글 웹폰트(Pretendard) 자가 호스팅 여부**: PRODUCT.md/DESIGN.md가 "No-Webfont Gap"으로 기록한 그대로이며, 이번 작업에서는 외부 폰트 추가 없이 시스템 폰트 스택을 유지했습니다. 적용하면 타이포그래피 "AI가 만든 느낌"을 더 줄일 수 있지만, 폰트 파일 크기·라이선스 포함 작업이 별도로 필요해 이번 범위에 포함하지 않았습니다.
3. **편집기 폼 필드 개선**(이메일/URL 타입, autoComplete, 인라인 에러): 낮은 위험도의 접근성 개선이지만 "편집 화면은 토큰/타이포만" 지시를 엄격히 지키기 위해 이번에는 건드리지 않았습니다. 진행 여부를 알려주시면 별도 커밋으로 처리할 수 있습니다.
4. **프로젝트 탭의 URL 동기화 부재**(뒤로가기로 탭 전환이 되돌려지지 않음): 인터랙션 변경이라 이번 디자인 전용 패스 범위 밖으로 기록만 했습니다.

## 7. 대표 캡처 경로

| 상태 | 폭 | 경로 |
|---|---|---|
| 수정 전 | 1440px | `docs/design-review/before/public-1440.png` |
| 수정 전 | 390px | `docs/design-review/before/public-390.png` |
| 수정 후 | 1440px | `docs/design-review/after/public-1440.png` |
| 수정 후 | 390px | `docs/design-review/after/public-390.png` |
| 수정 후 | 320px(탭 줄바꿈 수정 확인) | `docs/design-review/after/public-320.png` |
