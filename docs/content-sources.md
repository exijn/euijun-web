# 콘텐츠 확인 기록

확인일: **2026-10-01**. 대표 프로젝트·오픈소스 링크는 **2026-10-14**에 작성자와 병합 상태를 다시 확인했습니다. 공개 GitHub REST API, `gh search prs`, PR 타임라인과 commit 검색을 사용했습니다. 방문 시마다 GitHub API를 호출하지 않는 정적 스냅샷입니다.

## 기본 정보

- [exijn 프로필](https://github.com/exijn), [프로필 README](https://github.com/exijn/exijn): 이름, 학교, Kotlin·Java·Spring Boot 기반 개발, 운영 관심사를 확인했습니다.
- 학교 9기·2학년, 2026–2027 전교 학생회장, 교내 동아리, 2025 AI·SW 축전, 「내가 회장이 된 방법」 발표는 사용자가 직접 제공한 확인된 정보입니다.
- 공개 GitHub 이메일과 사용자가 지정한 이메일이 달라 **사용자가 지정한 `hanej090224@gmail.com`**을 사용했습니다.
- LinkedIn은 확인된 주소가 없어 빈 문자열로 두고 화면에서는 숨깁니다. 전화번호는 수집·표시하지 않습니다.

## 프로젝트

| 프로젝트 | 확인한 자료 | 반영 범위 |
| --- | --- | --- |
| GOMS | [README](https://github.com/team-haribo/GOMS-Backend-V3), [build.gradle](https://github.com/team-haribo/GOMS-Backend-V3/blob/main/build.gradle), [PR #94](https://github.com/team-haribo/GOMS-Backend-V3/pull/94), [배포 PR #80](https://github.com/team-haribo/GOMS-Backend-V3/pull/80) | 교내 외출 관리, Kotlin/Spring Boot/MariaDB/Redis, 백엔드·배포·정합성 개선. 교내 운영 여부는 사용자 제공 정보와 배포 PR을 함께 근거로 사용 |
| GSMC | [V4 저장소](https://github.com/team-incube/GSMC-Server-V4), [V3 개발자 API #16](https://github.com/team-incube/GSMC-server-V3/pull/16), [V4 프로젝트 관리 #106](https://github.com/team-incube/GSMC-Server-V4/pull/106), [파일 업로드 연결 점유 개선 #222](https://github.com/team-incube/GSMC-Server-V4/pull/222) | V3는 archived, V4는 활성 저장소. Kotlin/Spring Boot/GraphQL/JPA, 확인된 담당 기능만 기재 |
| Washer | [저장소](https://github.com/team-washer/Washer-Backend-v2), [build.gradle.kts](https://github.com/team-washer/Washer-Backend-v2/blob/master/build.gradle.kts), [예약 경합 #208](https://github.com/team-washer/Washer-Backend-v2/pull/208), [FCM 토큰 정리 #171](https://github.com/team-washer/Washer-Backend-v2/pull/171) | Java/Spring Boot/MySQL/Redis, 예약 경합 방지·알림 개선. 예약→작동 확인→사용→완료 흐름은 사용자 설명 및 예약 lifecycle PR에 근거 |

최신 활성 사용자 수, 팀 리드 직함, 정확한 운영 시작일은 공개 자료로 확인하지 못해 표시하지 않았습니다. GSMC V4와 Washer의 현재 배포·가동 여부는 PR 병합만으로 단정하지 않고 개발·개선 상태로 표시했습니다. GETI는 제외했습니다.

확인한 세 백엔드 저장소의 README/기본 브랜치 트리에는 재사용할 프로젝트 화면 이미지가 없었습니다. 리디자인에서는 기존 콘셉트 SVG를 제거했습니다. 실제 화면이 준비되기 전에는 프로젝트 이미지 영역을 표시하지 않습니다.

## 오픈소스 집계

아래 **9개 프로젝트의 10개 병합 PR**을 확인했습니다. `10+`는 PR 기여 건수이며, 10개 이상의 프로젝트라는 뜻이 아닙니다. 자체/교내 저장소와 단순 브랜치 동기화 PR은 포함하지 않습니다.

| 프로젝트 | PR | 병합일 |
| --- | --- | --- |
| Gradle | [#38952](https://github.com/gradle/gradle/pull/38952) | 2026-08-26 |
| Jackson Databind | [#6173](https://github.com/FasterXML/jackson-databind/pull/6173) | 2026-09-28 |
| Springdoc OpenAPI | [#3334](https://github.com/springdoc/springdoc-openapi/pull/3334) | 2026-09-06 |
| ktlint | [#3369](https://github.com/ktlint/ktlint/pull/3369) | 2026-08-28 |
| Java Operator SDK | [#3536](https://github.com/operator-framework/java-operator-sdk/pull/3536), [#3513](https://github.com/operator-framework/java-operator-sdk/pull/3513) | 2026-08-11, 2026-07-29 |
| Vaadin Flow | [#25048](https://github.com/vaadin/flow/pull/25048) | 2026-08-26 |
| JOSDK Spring Boot Starter | [#320](https://github.com/operator-framework/josdk-spring-boot-starter/pull/320) | 2026-08-11 |
| GraphQL Java | [#4418](https://github.com/graphql-java/graphql-java/pull/4418) | 2026-08-14 |
| detekt | [#9660](https://github.com/detekt/detekt/pull/9660) | 2026-08-25 |

대표 기여는 Gradle, Jackson Databind, Java Operator SDK입니다. 모든 항목에서 `merged: true`, 병합 날짜를 확인하고 공개 타임라인 및 revert commit 검색을 확인했습니다. 위 10건에 직접 연결된 revert는 발견하지 못했습니다. 검색은 공개 인덱스와 타임라인 범위이며, 모든 후속 코드를 의미적으로 감사한 결과는 아닙니다.

리디자인 때 위 PR들의 병합 여부와 작성자를 다시 확인했습니다. 홈페이지는 통계 문구 대신 대표 3개 PR 번호·변경 내용·상태만 보여줍니다. 기존 활동 명칭인 `2025 AI·SW 축전`은 사용자 확인 없이 페스티벌로 바꾸지 않았습니다. 원본 데이터는 `docs/archive/initial-content.json`에 보존했습니다. 관리자에서 이후 편집하는 내용은 소유자가 근거를 확인해야 하며 서버가 PR 성과를 자동 인증하지는 않습니다.

**JJWT [#1066](https://github.com/jwtk/jjwt/pull/1066)은 제외**했습니다. 병합 SHA `95d00223113df6c7e5dca8304e4acc697e445c43`를 되돌린 [revert commit](https://github.com/jwtk/jjwt/commit/1b768013e8bf58775564209021d86b1cfc473b81)이 실제로 존재합니다. 프로필 README에 남아 있어도 대표 기여·집계에는 포함하지 않습니다.

## 도구 버전

[Vite 공식 가이드](https://vite.dev/guide/), [React 공식 가이드](https://react.dev/learn/build-a-react-app-from-scratch), npm registry의 stable 버전과 peerDependencies를 확인했습니다. React 19.3.0, Vite 8.3.1, plugin-react 6.1.1을 고정했고 TypeScript는 typescript-eslint 8.71.0의 지원 범위(`<6.1`)에 맞춰 6.0.3을 사용합니다. 설치 결과는 `package-lock.json`으로 재현됩니다.
