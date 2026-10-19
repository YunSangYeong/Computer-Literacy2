# 컴퓨터활용능력 2급 필기 CBT

React + TypeScript + Vite로 만든 비공식 필기 학습용 사이트다.
표준 앱 YunSangYeong/electrician-cbt의 고정 커밋
`b9a682ccff1b460334b78d5bfad9375b7ec4fbb6`에서 화면·상태 관리·테스트 구조를 재사용했다.
원본 MIT 고지는 LICENSE에 보존했다. CBT 전용 스킬 전체는
`.agents/skills/cbt-site-standard/`에 복사하고 루트 AGENTS.md에서 연결했다.

## 시험 규칙과 자료의 한계

현재 학습용 잠정 설정은 컴퓨터 일반/스프레드시트 일반 각 20문항,
4지선다 40문항, 40분, 평균 60점 이상 및 각 과목 40점 이상이다.
과목별 점수는 정답 수/20 × 100, 총점은 두 과목 평균이다. 미응답은 오답이다.
과락은 표시 점수 반올림 전 비율로 판정한다. 실기는 제공하지 않는다.
설정은 `src/qualification.json`에서 관리한다.

**공식 규칙 직접 대조는 미완료**다. 대한상공회의소 공식 안내
https://license.korcham.net/co/examguide.do?cd=0103&mm=21
요청이 환경 프록시 CONNECT 403으로 차단되어 `rulesVerificationStatus: pending`이며
화면에도 이를 표시한다. 최신 출제기준 전체 반영이나 공식 시험 재현을 보증하지 않는다.

자체 제작 60문항: 컴퓨터 일반 30개, 스프레드시트 일반 30개.
원문 기출 0개·복원 0개·숫자 조건 변형 0개이며 외부 전문가 검수는 미완료다.
숫자 결과 문항 12개, 나머지 개념/참조/문자·논리 함수 문항 48개다.
AI 일반 지식 기반으로 작성한 문항과 해설의 내부 검토, 수치·문자·논리 독립 재계산
15개를 구별한다. 실제 Excel 실행 검증은 하지 않았다.
[작성·검토 기록](docs/content-review.md)에서 근거와 한계를 확인할 수 있다.
문항과 등록 양식은 CC BY 4.0, 가져온 외부 자료는 각 자료의 권리를 따른다.

## 기능

- 실전 모의시험과 전체/과목별 랜덤 문제풀이, 버전 선택 메뉴 없음
- 과목별 무작위 20문항, 중복 ID 제외, 시험 중 정답·해설 비공개
- 절대 종료 시각, 새로고침 후 답안 복원, 시간 만료 자동 제출, 과락 채점
- 두 모드 답안 선택 후 Space 이동, 마지막 문제 자동 제출 방지
- 오답노트·북마크·과목별 통계·최근 시험·시험 오답만 복습
- JSON/CSV 등록·중복 제거·검증 대기·근거 입력 후 로컬 승인·검색·내보내기
- 기록 JSON 백업과 확인 후 초기화(백업 UI 복원 기능은 없음)

localStorage namespace는 `computer-literacy-2:cbt:v1`이다.
최근 응답 5,000개와 시험 30회를 보존하며 통계도 보관된 응답 기준이다.
오답과 북마크·로컬 등록 문항은 초기화 전까지 유지한다.
로컬 등록은 공용 GitHub 문제은행에 자동 게시되지 않는다.
저장소 손상은 원본을 덮어쓰지 않고 경고한다. 브라우저/기기/origin별 기록은 별개이며
시크릿 모드와 iframe의 저장 제한 때문에 기록이 유지되지 않을 수 있다.

## 개발과 재현

Node.js 24.19.0(`.node-version`), Python 3, Chromium을 사용한다.

```sh
cd /workspace/Computer-Literacy2
npm ci --cache /tmp/computer-literacy-npm-cache --no-audit --no-fund
npm run dev
npm run check
# 시스템 Chromium이 없는 환경에서는 npx playwright install --with-deps chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
python scripts/build_bank.py
```

`npm run check`는 단위 테스트와 TypeScript/프로덕션 빌드를 실행한다.
브라우저 테스트는 빌드 후 preview 서버를 자동 실행한다.
기존 체크아웃을 사용하며 별도 worktree를 만들 필요가 없다.
원고 재생성은 결정적이며 기본 문항/양식만 갱신한다. 문항을 확장해도 기존 ID를 보존한다.

## 배포

대상 저장소는 `YunSangYeong/Computer-Literacy2`, Vite base는 `/Computer-Literacy2/`다.
GitHub Pages 기본 주소(실제 배포 확인은 아래 검증 기록 참고):
https://YunSangYeong.github.io/Computer-Literacy2/

`.github/workflows/pages.yml`은 main의 단위 테스트·빌드·PC/모바일 브라우저 테스트가
통과해야 Pages artifact를 업로드하고 배포한다. 저장소 Settings → Pages의
Source는 GitHub Actions여야 하며 Actions와 Pages 배포 권한이 필요하다.
API 접근이 차단되면 설정 확인·변경 및 실행 상태의 API 조회가 제한된다.
워크플로 파일 존재·푸시만으로 배포 성공을 주장하지 않는다.

기본 주소는 업데이트 후에도 유지한다. 블로그 iframe도 같은 주소를 사용한다.
iframe 내부 클릭 후 Space 동작과 해당 브라우저의 저장 허용 여부를 확인해야 한다.

## 검증 결과

[검증·배포 기록](docs/validation.md)에 실제 실행 결과와 남은 작업을 기록한다.
