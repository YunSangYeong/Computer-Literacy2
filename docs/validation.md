# 1,000문항 확장 검증 기록 — 2026-10-19

작업 디렉터리 `/workspace/Computer-Literacy2`, Node 24.19.0, 시스템 Chromium 사용.
이전 60문항 버전의 결과는 [보존 기록](validation-60.md)과 구별한다.

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| 총 문항·과목별 수 | 통과 | 1,000개, 컴퓨터 일반 500·스프레드시트 일반 500 |
| 기존 60문항 보존 | 통과 | JSON 객체 전체 SHA-256 대조, 이전 ID·보기·정답·해설·메타데이터 동일 |
| 중복·등록 규격 | 통과 | 1,000 고유 ID·정규화 본문/보기, 보기 4개·정답 범위·권리·연도 null 검사 |
| 구성 구분 | 통과 | 개별 작성 340개, 조건 변형 660개=66유형×10, 기출·복원 0 |
| 조건 변형 | 통과 | 660개 모두 본문 파싱→독립 재계산→단위·표시·정답 번호·유일한 정답 검사 |
| 원고 재현 | 통과 | 동일 JSON·CSV/JSON 양식·집계 재생성 검사 |
| 단위 테스트 | 통과 | npm test, 697개 통과, exit 0 |
| 타입·빌드 | 통과(경고 있음) | npm run check / npm run test:e2e의 TypeScript+Vite, exit 0 |
| PC·모바일 | 통과 | Chromium Desktop Chrome/Pixel 7 에뮬레이션, 28개 통과, exit 0 |
| 이전 기록 호환 | 통과 | 예전 40문항 진행 시험·오답·북마크를 1,000문항 앱에서 복원 |
| 문자 보기 | 통과 | TRIM 보기의 공백과 따옴표·즉시 채점·Space 이동 확인 |
| 시험 핵심 규칙 | 직접 확인 | 대한상공회의소 안내·출제기준 PDF HTTPS 200; docs/official-rules.md |
| 전 범위·실제 난이도 재현 | 미입증 | 자체 학습 구성과 실제 시험 분포는 구별 |
| 문항 검수 | 내부 검토 | 원고·보기·해설 및 유형 검토, 외부 전문가 검수 미완료 |
| 실제 Excel 실행 | 미실행 | TypeScript 독립 함수 계산과 실제 Excel 실행은 구별 |
| 실기기·Safari·Firefox | 미실행 | PC·모바일 Chromium 에뮬레이션과 구별 |
| GitHub API 연결 | 확인 | 저장소 메타데이터 조회 가능, Pages 사이트 조회 404 |
| Pages 사이트 생성 | 차단 | POST /repos/YunSangYeong/Computer-Literacy2/pages → 403 Resource not accessible by integration |
| 원격 CI validate | 통과 | 07aa34c 커밋, run 39264662443의 validate 성공 |
| 원격 Pages deploy | 실패·설정 차단 | 같은 실행의 configure-pages 사이트 조회 404 |
| 공개 사이트 | HTTP 404 | 정상 게시되지 않았음을 별도 확인 |

`npm run check`의 697개는 기존 모델/예제 검사 34개와 신규 검사 663개
(660개 조건 변형 및 보존·구성·시험 추출 검사 3개)다.
697개가 개념 문항 697개에 대한 전문가 검수를 뜻하지 않는다.

브라우저 28개는 기존 시나리오 22개에 새 구성/검색/내보내기, 문자 공백,
이전 진행 시험 복원 시나리오 각 PC·모바일 6개를 추가했다.
시험 시간·제출·해설·오답·북마크·통계·등록·초기화·손상 저장 보호·백업·IME·
Space/포커스 보호를 유지한다. 500문항 랜덤 순회에서 ID 중복 방지도 단위 검사한다.

빌드의 은행 포함 JS는 약 1.36MB(압축 약 158KB)로 Vite의 500KB 청크 경고가 있다.
현재 브라우저 검사는 정상 완료했으며 경고를 설정으로 숨기지 않았다.

## 재현 자료

- 원고: scripts/build_bank.py, scripts/manuscripts/*.tsv, scripts/expanded_bank.py
- 결과: src/data/questions.json
- 전체 데이터 파일 SHA-256: `bf5c0d0868b1b27523c2ca83e46b315cc68c9d525f5e30758ffa91a234a70e87`
- 기존 60개 JSON 객체 SHA-256: `afcce64d36fb5fa49157b5ecc865418bface2ac3d97c19ba7b5973386ccd5a06`
- 생성: python scripts/build_bank.py
- 단위·빌드: npm run check
- 브라우저: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e

## 배포 제약

기존 플랫폼 인증으로 실제 Pages 사이트 생성을 시도했다. 저장소 메타데이터의
관리 권한 표시와 별개로, 해당 생성 API는 integration 권한 부족 403을 반환했다.
별도 토큰을 만들거나 값을 요구하지 않았다. 저장소 Settings → Pages → Source를
GitHub Actions로 설정해야 한다. 이 설정이 없으면 로컬 검사와 원격 validate가
성공하더라도 Pages 배포는 완료되지 않는다.

## 정확한 커밋의 원격 결과

- 앱·문항 커밋: `07aa34cdc6c64f03737e103b26182a67060e4fb0`
- 원격 main에 동일 SHA가 반영된 것을 git ls-remote로 확인했다.
- Actions: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39264662443
- validate 성공: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39264662443/job/118100992095
- deploy 실패: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39264662443/job/118101536785
- GitHub 웹의 실제 오류: `Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions`, `HttpError: Not Found`.
- 공개 예정 주소 https://YunSangYeong.github.io/Computer-Literacy2/ 의 실제 응답은 HTTP 404였다.
- 로그 압축 파일의 다운로드 도메인은 환경에서 Forbidden으로 차단되어 전체 원격 로그를 받지 못했다.
  원격 작업별 success/failure는 GitHub API와 웹 화면으로 확인했다. 테스트 개수 697/28은 로컬 실행 결과다.

사이트 활성화에는 현재 integration에 없는 Pages 관리 권한이 필요하다.
외부 설정을 묻거나 추가 토큰을 요구하지 않고, 수행 가능한 문항 확장·검토·로컬 검증·원격 반영을 완료했다.
이 기록만 추가한 후속 커밋은 [skip ci]로 저장하며, 위 앱 커밋의 CI 결과와 구별한다.
