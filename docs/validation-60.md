# 검증 기록 — 2026-10-19

작업 디렉터리 `/workspace/Computer-Literacy2`, Node 24.19.0.

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| 표준 적용 | 통과 | 고정 커밋의 App/model/styles/config/tests 재사용, 스킬 폴더 전체와 AGENTS 연결 |
| 공식 규칙 대조 | 차단 | license.korcham.net HTTPS CONNECT 403, 잠정 규칙 표시 |
| 기본 문제은행 | 내부 검토 완료 | 자체 제작 60개, 과목별 30, 기출·복원·숫자 변형 0 |
| 외부 문항/출제기준 검수 | 미완료 | docs/content-review.md, 전문가 검수·실제 Excel 실행 없음 |
| 설치 | 통과 | npm ci --cache /tmp/computer-literacy-npm-cache --no-audit --no-fund, exit 0 |
| 단위 검사 | 통과 | npm run check: 34개 통과, exit 0 |
| 빌드 | 통과 | TypeScript + Vite 프로덕션 빌드, exit 0 |
| PC/모바일 브라우저 | 통과 | 시스템 Chromium, Desktop Chrome/Pixel 7 에뮬레이션 총 22개, exit 0 |
| 실기기/Safari/Firefox | 미실행 | Chromium 에뮬레이션과 구별 |
| GitHub API | 차단 | gh api repos/YunSangYeong/Computer-Literacy2: Forbidden |
| 원격 커밋 | 통과 | main: 10cfbd56cbb2a7938cb3f10fb0a640da727bb160 원격 조회 확인 |
| GitHub Actions validate | 통과 | run 39261361587, validate 성공/Pages artifact 1개 업로드 |
| GitHub Pages deploy | 차단 | 같은 실행의 configure-pages 사이트 조회 404 Not Found |
| 공개 사이트 동작 | 미확인 | 배포 실패, 기존 공개 사이트 동작을 추정하지 않음 |
| 로컬 iframe | 통과/제한 확인 | 같은 origin: Space+저장 정상, opaque parent: Space 정상·저장 제한 경고 |

브라우저 시나리오는 버전 메뉴 부재, 40문항 답변/60점 합격, 북마크·복원·해설,
오답 복습·통계, 40분 자동 제출/만료 재접속/중복 방지/만료 후 답안 차단,
즉시 채점, JSON/CSV 등록·중복·검수·오류 원자성·초기화,
손상 저장 원본 보존, 두 모드의 실제 Space keydown/keyup·포커스,
미응답/길게 누르기/수정키/컨트롤/대화상자/마지막 문제 보호를 확인했다.
추가 브라우저 검사로 평균 67.5점 과락 결과, 답안 변경 즉시 저장, JSON 백업 내용,
IME/수정키 보호, 저장 공간 부족 경고를 확인했다.
과락 경계는 단위 검사에서 평균 67.5점·한 과목 35점 불합격과 과목 40점 합격을 확인했다.

네트워크 초안에 license.korcham.net, support.microsoft.com, api.github.com,
yunsangyeong.github.io를 추가했다. 이 초안 저장은 현재 실행 환경에의 적용이나
환경 게시를 뜻하지 않는다. 접근 허용 후 공식 규칙·문항 근거 대조와 배포 결과 확인이 남는다.

## 원격 결과와 필요한 외부 설정

앱 커밋: `10cfbd56cbb2a7938cb3f10fb0a640da727bb160`

실행: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39261361587

- validate 성공: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39261361587/job/118089554202
- deploy 실패: https://github.com/YunSangYeong/Computer-Literacy2/actions/runs/39261361587/job/118090126470
- 오류: `HttpError: Not Found`, `Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions`.
- 공식 actions/configure-pages v5의 action.yml을 읽어 `enablement`에는 기본 GITHUB_TOKEN 외의 토큰과 관리 권한이 필요함을 확인했다. 검증되지 않은 토큰 우회 설정을 넣지 않았다.

저장소 Settings → Pages → Source를 GitHub Actions로 설정하고 위 실행의 실패한
작업을 다시 실행해야 한다. 이 환경에서는 api.github.com이 차단되어 설정 변경을
수행하지 못했다. 토큰 값을 채팅으로 제공할 필요는 없다.
공식 규칙 대조를 계속하려면 환경 설정에 저장한 도메인 변경을 검토·저장하고
환경을 게시해야 한다. 초안에는 install_script와 start_skill도 저장되어 있다.
공식 자료 직접 대조와 실제 공개 사이트 검증은 이 작업에서 완료되지 않았다.

이 문서의 원격 결과는 위 앱 커밋에 관한 것이며 이후 문서 전용 커밋의
CI/배포 성공을 의미하지 않는다. 문서 전용 결과 기록은 CI를 재실행하지 않는다.
