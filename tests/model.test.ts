import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  answerExam,
  BASE_BANK,
  checkPractice,
  createExam,
  emptyStore,
  fingerprint,
  grade,
  importQuestions,
  nextPractice,
  parseCsv,
  remainingSeconds,
  restoreStore,
  startPractice,
  SUBJECTS,
  submitExam,
  validateQuestion,
  type Question,
} from "../src/model";
const bank = BASE_BANK;
describe("컴퓨터활용능력 2급 문제은행", () => {
  it("자체 제작 1,000문항, 과목별 500문항, 고유 ID와 본문 및 출처", () => {
    expect(bank).toHaveLength(1000);
    expect(new Set(bank.map(q => q.id)).size).toBe(1000);
    expect(new Set(bank.map(fingerprint)).size).toBe(1000);
    for (const subject of SUBJECTS) expect(bank.filter(q=>q.subject===subject)).toHaveLength(500);
    for (const q of bank) {
      expect(()=>validateQuestion(q)).not.toThrow();
      expect(q.type).toBe("original");
      expect(q.year).toBeNull(); expect(q.session).toBeNull();
      expect(q.verificationStatus).toBe("reviewed");
      expect(q.explanation.length).toBeGreaterThan(30);
      expect(q.reviewNote).toContain("외부 자료 직접 대조 및 전문가 검수 미완료");
      expect(q.rights).toContain("CC BY 4.0");
      if (!q.exercise) expect(q.family).toBeUndefined();
    }
  });
  it("원고 재생성이 JSON 및 등록 양식을 바꾸지 않는다", () => {
    const files = ["src/data/questions.json", "public/templates/questions.json", "public/templates/questions.csv", "docs/bank-composition.json"];
    const before = files.map(f=>readFileSync(f,"utf8"));
    execFileSync("python", ["scripts/build_bank.py"]);
    expect(files.map(f=>readFileSync(f,"utf8"))).toEqual(before);
  });
  // Independently stated inputs and evaluators; not imported from the manuscript/compiler.
  const examples: [string, () => string | number][] = [
    ["C-005",()=>4*8], ["C-006",()=>parseInt("1011",2)],
    ["S-006",()=>2+3*4], ["S-007",()=>[2,4,6].reduce((a,b)=>a+b,0)],
    ["S-008",()=>[10,20,30].reduce((a,b)=>a+b,0)/3],
    ["S-009",()=>[2,5,"사과",null].filter(x=>typeof x==="number").length],
    ["S-010",()=>[2,5,"사과",null].filter(x=>x!==null).length],
    ["S-011",()=>70>=60?"합격":"불합격"],
    ["S-012",()=>[10,20,30,40].filter(x=>x>=30).length],
    ["S-013",()=>[{label:"사과",value:2},{label:"배",value:5},{label:"사과",value:3}].filter(x=>x.label==="사과").reduce((a,b)=>a+b.value,0)],
    ["S-014",()=>Math.round(12.346*100)/100], ["S-015",()=>17%5],
    ["S-016",()=>"COMPUTER".slice(0,3)], ["S-017",()=>"A B".length],
    ["S-021",()=>String([5>3,2>4].every(Boolean)).toUpperCase()],
  ];
  for (const [suffix,evaluate] of examples) it(`수치·문자·논리 독립 재계산 CL2-${suffix}`,()=>{
    const q = bank.find(q=>q.id===`CL2-${suffix}`)!;
    const expected=String(evaluate());
    const normalize=(s:string)=>s.replace(/비트$/u,"");
    expect(normalize(q.choices[q.answer-1])).toBe(expected);
    expect(q.choices.filter(c=>normalize(c)===expected)).toHaveLength(1);
  });
});
describe("모의시험 및 절대 시간", () => {
  it("40개 고유 문항을 균형 있게 추출하며 검증 대기는 제외한다", () => {
    const exam = createExam(
      [...bank, { ...bank[0], id: "pending", verificationStatus: "pending" }],
      "main",
      1000,
    );
    expect(exam.questions).toHaveLength(40);
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(40);
    SUBJECTS.forEach((s) =>
      expect(exam.questions.filter((q) => q.subject === s)).toHaveLength(20),
    );
    expect(exam.deadline).toBe(2401000);
    expect(exam.questions.some((q) => q.id === "pending")).toBe(false);
  });
  it("기본 모의시험에서는 같은 숫자 변형 유형을 중복 출제하지 않는다", () => {
    for (let round = 0; round < 20; round++) {
      const exam = createExam(bank, "main");
      const families = exam.questions.flatMap((q) =>
        q.family ? [q.family] : [],
      );
      expect(new Set(families).size).toBe(families.length);
    }
  });
  it("수입 문항의 유형이 20개 미만이어도 문항 수가 충분하면 40문항 시험을 구성한다", () => {
    const imported = bank.map((q) => ({ ...q, family: `only-${q.subject}` }));
    const exam = createExam(imported, "main");
    expect(exam.questions).toHaveLength(40);
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(40);
  });
  it("미준비 버전과 과목 문항 부족은 시험 시작을 차단한다", () => {
    expect(() => createExam(bank, "unavailable" as never)).toThrow();
    expect(() =>
      createExam(
        bank.filter((q) => q.subject !== "컴퓨터 일반"),
        "main",
      ),
    ).toThrow();
  });
  it("23개 정답 불합격, 양 과목 12개씩이면 평균 60점 합격", () => {
    const e=createExam(bank,"main");
    const [a,b]=SUBJECTS.map(s=>e.questions.filter(q=>q.subject===s));
    [...a.slice(0,12),...b.slice(0,11)].forEach(q=>e.answers[q.id]=q.answer);
    expect(grade(e)).toMatchObject({passed:false,score:57.5});
    e.answers[b[11].id]=b[11].answer;
    expect(grade(e)).toMatchObject({passed:true,score:60,correct:24,wrong:16,unanswered:16});
  });
  it("평균 67.5점이어도 한 과목 35점은 과락, 40점이면 통과", () => {
    const e=createExam(bank,"main");
    const [a,b]=SUBJECTS.map(s=>e.questions.filter(q=>q.subject===s));
    [...a,...b.slice(0,7)].forEach(q=>e.answers[q.id]=q.answer);
    expect(grade(e)).toMatchObject({score:67.5,passed:false});
    e.answers[b[7].id]=b[7].answer;
    expect(grade(e)).toMatchObject({score:70,passed:true});
    expect(grade(e).subjects.map(s=>s.total)).toEqual([20,20]);
  });
  it("답안 변경을 허용하고 종료 시각 이후 변경은 차단한다", () => {
    let state = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const id = state.exam.questions[0].id;
    let s = answerExam(state, id, 1, 2000);
    s = answerExam(s, id, 2, 3000);
    expect(s.exam?.answers[id]).toBe(2);
    s = answerExam(s, id, 3, 2401000);
    expect(s.exam).toBeNull();
    expect(s.results[0].answers[id]).toBe(2);
    expect(s.results[0].reason).toBe("timeout");
  });
  it("새로고침 후 절대 시각으로 복원하고 백그라운드 지연을 더하지 않는다", () => {
    const s = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const restored = restoreStore(JSON.stringify(s));
    expect(remainingSeconds(restored.exam!.deadline, 1000)).toBe(2400);
    expect(remainingSeconds(restored.exam!.deadline, 1201000)).toBe(1200);
    expect(remainingSeconds(restored.exam!.deadline, 2400999)).toBe(1);
    expect(remainingSeconds(restored.exam!.deadline, 2401000)).toBe(0);
    expect(remainingSeconds(restored.exam!.deadline, 9999999)).toBe(0);
  });
  it("제출은 한 번만 기록되고 미응답은 오답노트에 들어간다", () => {
    const s = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const submitted = submitExam(s, 4000);
    expect(submitted.attempts).toHaveLength(40);
    expect(submitted.wrongIds).toHaveLength(40);
    expect(submitted.results).toHaveLength(1);
    expect(submitExam(submitted, 5000)).toEqual(submitted);
  });
});
describe("랜덤 학습", () => {
  it("한 과목의 모든 문항을 순회하기 전에는 중복이 없다", () => {
    let p = startPractice(bank, "main", "컴퓨터 일반");
    const ids = new Set<string>();
    for (let i = 0; i < 500; i++) {
      expect(ids.has(p.currentId)).toBe(false);
      ids.add(p.currentId);
      p = nextPractice(p, bank);
    }
    expect(ids.size).toBe(500);
    expect(p.subject).toBe("컴퓨터 일반");
  });
  it("즉시 채점·연속 정답·통계를 저장하며 중복 채점을 방지한다", () => {
    const p = startPractice(bank, "main");
    const q = bank.find((q) => q.id === p.currentId)!;
    const s = checkPractice(
      {
        ...emptyStore(),
        wrongIds: [q.id],
        practice: { ...p, selected: q.answer },
      },
      bank,
      1234,
    );
    expect(s.practice).toMatchObject({
      revealed: true,
      streak: 1,
      correct: 1,
      answered: 1,
    });
    expect(s.attempts).toHaveLength(1);
    expect(s.wrongIds).not.toContain(q.id);
    expect(checkPractice(s, bank, 3000)).toEqual(s);
    const next = nextPractice(s.practice!, bank);
    const q2 = bank.find((q) => q.id === next.currentId)!;
    const wrong = checkPractice(
      { ...s, practice: { ...next, selected: (q2.answer % 4) + 1 } },
      bank,
    );
    expect(wrong.practice?.streak).toBe(0);
    expect(wrong.wrongIds).toContain(q2.id);
  });
  it("오답만 선택한 복습에서는 해당 문항만 출제하며 1개 문제도 재학습할 수 있다", () => {
    const p = startPractice(bank, "main", "전체", [bank[0].id]);
    expect(p.currentId).toBe(bank[0].id);
    expect(nextPractice({ ...p, revealed: true }, bank)).toMatchObject({
      currentId: bank[0].id,
      revealed: false,
    });
  });
});
describe("가져오기 및 복구", () => {
  const example = {
    ...bank[0],
    id: "CUSTOM-001",
    question: "사용자가 작성한 고유한 질문",
  };
  it("JSON은 검증 대기로 등록하며 ID 및 보기 순서가 다른 동일 문항을 중복 제거한다", () => {
    expect(importQuestions([example], bank).added[0].verificationStatus).toBe(
      "pending",
    );
    expect(
      importQuestions(
        [
          bank[0],
          {
            ...bank[0],
            id: "OTHER",
            choices: [...bank[0].choices].reverse(),
            answer: 5 - bank[0].answer,
          },
        ],
        bank,
      ),
    ).toMatchObject({ added: [], duplicates: 2 });
  });
  it("CSV의 쉼표·줄바꿈·따옴표를 보존하며 JSON과 동등한 문항을 읽는다", () => {
    const q = { ...example, question: '쉼표, 따옴표 "테스트"\n다음 줄' };
    const { choices, ...rest } = q;
    const entries = {
      ...rest,
      choice1: choices[0],
      choice2: choices[1],
      choice3: choices[2],
      choice4: choices[3],
    };
    const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv =
      Object.keys(entries).join(",") +
      "\n" +
      Object.values(entries).map(escape).join(",");
    const parsed = parseCsv(csv);
    expect(importQuestions(parsed, bank).added[0].question).toBe(q.question);
  });
  it("가짜 연도, 잘못된 정답, 중복 보기, 위험한 출처 URL, 미완결 CSV는 차단한다", () => {
    for (const value of [
      { ...example, year: 2020 },
      { ...example, answer: 5 },
      { ...example, choices: ["a", "a", "b", "c"] },
      { ...example, sourceUrl: "javascript:alert(1)" },
      { ...example, sourceUrl: "https://example.com", session: "1" },
    ])
      expect(() => importQuestions([value], bank)).toThrow();
    expect(() => parseCsv('id,question\n"open')).toThrow();
    expect(() => parseCsv("id,id\nx,x")).toThrow();
    expect(() => parseCsv("id,question\none")).toThrow();
  });
  it("1개 오류라도 전체 등록을 중단한다", () => {
    expect(() =>
      importQuestions(
        [example, { ...example, id: "invalid", answer: 99 }],
        bank,
      ),
    ).toThrow("2번 문항");
  });
  it("존재하는 기록은 보존하고 손상된 저장소 형식은 거부한다", () => {
    expect(restoreStore(null)).toEqual(emptyStore());
    expect(restoreStore(JSON.stringify(emptyStore()))).toEqual(emptyStore());
    expect(() => restoreStore("{bad")).toThrow();
    expect(() =>
      restoreStore(
        JSON.stringify({ ...emptyStore(), exam: { questions: [] } }),
      ),
    ).toThrow();
    expect(() =>
      restoreStore(
        JSON.stringify({ ...emptyStore(), practice: { currentId: "invalid" } }),
      ),
    ).toThrow();
  });
});
