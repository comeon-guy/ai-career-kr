/**
 * `section_2_value_shift` 스키마 샘플 (API 연결 전 UI 검증용).
 * `report.ui_structured_json.section_2_value_shift`에 동일 구조로 넣으면 새 UI가 표시됩니다.
 * @type {import("./section2ValueShift.types.js").Section2ValueShiftData}
 */
export const SECTION_2_VALUE_SHIFT_MOCK_KO = {
  hero_insight: {
    eyebrow: "핵심 변화",
    headline_segments: [
      { text: "앞으로 더 중요한 사람은 " },
      { text: "자료를 많이 만드는 사람", emphasize: true },
      { text: "이 아니라, " },
      { text: "자료와 관계와 책임을 연결하는 사람", emphasize: true },
      { text: "입니다." },
    ],
    supporting_text:
      "AI가 초안·정리 시간을 줄여 주면, ‘무엇을 만들었는가’보다 ‘누구에게 어떻게 설득하고 책임지는가’가 경쟁 우위로 이동합니다.",
    tags: ["전략 판단", "관계 형성", "설득과 신뢰", "책임 있는 선택"],
  },
  gravity_shift: {
    title: "역할의 무게 중심 이동",
    from_box: {
      label: "AI·자동화 도구가 선행하기 쉬운 영역",
      text: "정리 · 초안 · 반복 생산",
    },
    to_box: {
      label: "사람에게 남는 영역",
      text: "판단 · 관계 · 설득 · 책임",
    },
    footer_note:
      "산출물의 양보다 ‘누구에게, 어떤 맥락으로, 어떤 책임으로 연결되는가’가 더 큰 차이를 만듭니다.",
  },
  comparison_rows: [
    {
      work_area: "자료 준비",
      decline_focus: "형식 맞춘 초안·단순 정리 반복",
      rise_focus: "자료를 전략 질문·의사결정에 연결하는 해석",
    },
    {
      work_area: "기부자 관리",
      decline_focus: "기록·알림·표면적 리포트 작성",
      rise_focus: "신뢰 형성·갈등 조정·장기 관계 설계",
    },
    {
      work_area: "캠페인 운영",
      decline_focus: "반복 일정·단순 채널 운영",
      rise_focus: "메시지 우선순위·리스크 판단·성과 해석",
    },
  ],
  decline_work: {
    bullets: [
      "형식에 맞춘 문서 초안을 반복해서 만드는 업무",
      "정해진 양식에 데이터를 옮겨 적는 단순 정리",
      "승인 없이 실행 가능한 수준의 표준 보고",
      "이메일·스프레드시트 단위의 단편적 업데이트",
    ],
    accordions: [
      {
        title: "왜 낮아지나",
        body: "AI·자동화가 초안·정리·단순 보고의 속도와 비용을 크게 낮추기 때문에, 동일 활동의 한계 효용이 줄어듭니다.",
      },
      {
        title: "그래도 완전히 사라지지 않는 이유",
        body: "최종 문맥 검증, 예외 상황, 조직 내부 정치·윤리 판단 등은 사람의 감독 없이 대체되기 어렵습니다.",
      },
    ],
  },
  rise_work: {
    bullets: [
      "모호한 요구를 질문으로 바꾸고 범위를 정의하는 일",
      "이해관계자 설득·신뢰 회복·갈등 조정",
      "데이터가 말하지 않는 ‘그래서 무엇을 할지’ 제안",
      "리스크·윤리·책임이 따르는 선택과 커뮤니케이션",
      "장기 파트너십·브랜드·기금 전략을 잇는 내러티브",
    ],
    accordions: [
      {
        title: "왜 높아지나",
        body: "자동화가 표준 작업을 덜어낼수록, 남은 가치는 판단·관계·책임이 큰 영역으로 이동합니다.",
      },
      {
        title: "어떤 역량이 중요해지나",
        body: "문제 정의, 스토리텔링, 협상, 검증 설계, 책임 있는 의사결정이 상대적으로 더 중요해집니다.",
      },
    ],
  },
};

/** @type {import("./section2ValueShift.types.js").Section2ValueShiftData} */
export const SECTION_2_VALUE_SHIFT_MOCK_EN = {
  hero_insight: {
    eyebrow: "Core shift",
    headline_segments: [
      { text: "What matters more is not " },
      { text: "who produces the most artifacts", emphasize: true },
      { text: ", but " },
      { text: "who connects data, relationships, and accountability", emphasize: true },
      { text: "." },
    ],
    supporting_text:
      "As AI shortens drafting and organizing time, competitive edge shifts toward judgment, trust, and how outcomes are owned.",
    tags: ["Strategic judgment", "Relationship building", "Persuasion & trust", "Accountable choices"],
  },
  gravity_shift: {
    title: "Shift in the center of gravity",
    from_box: {
      label: "What AI absorbs",
      text: "Tidying · first drafts · repetitive production",
    },
    to_box: {
      label: "What stays with people",
      text: "Judgment · relationships · persuasion · accountability",
    },
    footer_note:
      "‘For whom and how’ matters more than ‘how much was produced’.",
  },
  comparison_rows: [
    {
      work_area: "Materials prep",
      decline_focus: "Formatting drafts and simple repetitive tidying",
      rise_focus: "Turning materials into decisions and strategic questions",
    },
    {
      work_area: "Donor stewardship",
      decline_focus: "Logging, reminders, surface-level reporting",
      rise_focus: "Trust building, tension handling, long-term relationship design",
    },
    {
      work_area: "Campaign ops",
      decline_focus: "Routine scheduling and low-level channel chores",
      rise_focus: "Message prioritization, risk judgment, interpreting results",
    },
  ],
  decline_work: {
    bullets: [
      "Repeating template-first drafting work",
      "Moving data into fixed forms with little judgment",
      "Standard reports that can run without approval",
      "Fragmented inbox/spreadsheet updates without synthesis",
    ],
    accordions: [
      {
        title: "Why value declines",
        body: "Automation and AI reduce the cost and time of drafting and tidying, so marginal value of the same activity falls.",
      },
      {
        title: "Why it does not fully disappear",
        body: "Final context checks, exceptions, and organizational ethics still need human oversight.",
      },
    ],
  },
  rise_work: {
    bullets: [
      "Turning fuzzy asks into scoped questions",
      "Persuasion, trust repair, and stakeholder alignment",
      "Proposing what to do when data alone is silent",
      "Communication where risk, ethics, and accountability attach",
      "Narratives that connect partnerships, brand, and funding strategy",
    ],
    accordions: [
      {
        title: "Why value rises",
        body: "As standard tasks are peeled off, remaining value concentrates in judgment-heavy work.",
      },
      {
        title: "Which capabilities matter more",
        body: "Problem framing, storytelling, negotiation, verification design, and accountable decisions gain weight.",
      },
    ],
  },
};
