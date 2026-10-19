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
| GitHub Actions/Pages | 대기 | 원격 반영 후 별도 확인 |

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
