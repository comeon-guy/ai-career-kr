/** @type {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} */
export const SECTION_4_TASK_AI_ROLE_MOCK_KO = {
  section_title: "업무 구조와 AI 역할 분담",
  integrated_insight: {
    eyebrow: "통합 인사이트",
    headline_segments: [
      { text: "같은 업무도 " },
      { text: "무엇을 맡기고, 무엇을 책임질지", emphasize: true },
      { text: "에 따라 " },
      { text: "커리어 가치가 달라집니다.", emphasize: true },
    ],
    supporting_text:
      "중요도·수행빈도·비중은 ‘얼마나 하는가’이고, AI 역할 유형은 ‘누가 어떤 판단을 맡는가’입니다. 아래 카드에서 두 축을 한 번에 확인하세요.",
  },
  portfolio: {
    title: "직무 구성 변화",
    segments: [
      { kind: "human", percent: 26, label: "26%", sublabel: "사람 중심 / 판단·관계·책임" },
      { kind: "collab", percent: 33, label: "33%", sublabel: "AI 협업형 / 초안·제안 + 판단" },
      { kind: "automation", percent: 41, label: "41%", sublabel: "자동화 지원형 / 정형·반복·처리" },
    ],
  },
  filters: [
    { id: "important", label: "중요도 높은 업무", default: true },
    { id: "human", label: "사람 중심" },
    { id: "collab", label: "AI 협업형" },
    { id: "automation", label: "자동화 지원형" },
  ],
  task_cards: [
    {
      id: "t1",
      filter_group: ["important", "collab"],
      order: 1,
      title: "기부 캠페인 메시지 초안 작성 및 채널별 변형",
      ai_role_type: "collab",
      metrics: { importance: 87, frequency_display: 82, weight_percent: 8 },
      capabilities: ["비판적 사고", "설득", "협상"],
      ai_helps:
        "채널별 톤 변형, 문장 다듬기, A/B 문안 후보 생성, 반복 섹션의 1차 초안을 빠르게 제시합니다.",
      human_owns:
        "메시지의 방향·근거·윤리, 최종 승인과 책임, 이해관계자 설득과 타이밍 판단은 사람이 유지합니다.",
    },
    {
      id: "t2",
      filter_group: ["important", "human"],
      order: 2,
      title: "주요 기부자 관계 관리 및 갈등·요청 조정",
      ai_role_type: "human",
      metrics: { importance: 91, frequency_display: 74, weight_percent: 12 },
      capabilities: ["관계 형성", "갈등 조정", "책임 있는 판단"],
      ai_helps: "일정·요약·이력 조회를 보조하고, 과거 대화 맥락을 정리해 제시할 수 있습니다.",
      human_owns: "신뢰 형성, 민감한 대화, 약속 이행과 최종 의사결정은 사람의 영역입니다.",
    },
    {
      id: "t3",
      filter_group: ["important", "automation"],
      order: 3,
      title: "정해진 양식의 월간 성과 리포트 집계",
      ai_role_type: "automation",
      metrics: { importance: 62, frequency_display: 88, weight_percent: 15 },
      capabilities: ["데이터 정리", "품질 검수"],
      ai_helps: "원천 데이터 병합, 표·그래프 초안, 숫자 검산 초안을 자동화합니다.",
      human_owns: "지표 정의, 예외 처리, 경영진에게 전달할 해석과 권고는 사람이 책임집니다.",
    },
    {
      id: "t4",
      filter_group: ["collab"],
      order: 4,
      title: "캠페인 성과 데이터 해석 및 개선안 도출",
      ai_role_type: "collab",
      metrics: { importance: 79, frequency_display: 70, weight_percent: 10 },
      capabilities: ["분석", "스토리텔링"],
      ai_helps: "세그먼트 비교, 이상치 탐지, 개선 가설 후보를 제시합니다.",
      human_owns: "우선순위, 실행 계획, 조직 내 설득과 실행 책임은 사람이 가집니다.",
    },
  ],
  career_insights: [
    {
      number: 1,
      title: "중요도와 AI 영향은 다릅니다",
      body: "자주 하고 중요한 업무라도 AI가 대체하기 쉬운 층이 있고, 비중은 작아도 판단 책임이 큰 업무가 남습니다.",
    },
    {
      number: 2,
      title: "업무는 사라지기보다 층이 나뉩니다",
      body: "같은 이름의 업무도 ‘실행·초안’ 층과 ‘판단·관계’ 층으로 나뉘며, 후자가 커리어 가치의 중심이 됩니다.",
    },
    {
      number: 3,
      title: "커리어 전략은 역할 분담에서 나옵니다",
      body: "어디까지 AI에 맡기고 어디부터 사람이 소유할지 정하는 설계가 개인·팀의 경쟁력을 만듭니다.",
    },
  ],
};

/** @type {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} */
export const SECTION_4_TASK_AI_ROLE_MOCK_EN = {
  section_title: "Work structure and AI–human role split",
  integrated_insight: {
    eyebrow: "Integrated insight",
    headline_segments: [
      { text: "The same work changes in career value based on " },
      { text: "what you delegate and what you own", emphasize: true },
      { text: "." },
    ],
    supporting_text:
      "Importance, frequency, and share describe how much you do; AI role type describes who owns judgment. Each card links both.",
  },
  portfolio: {
    title: "Role composition change",
    segments: [
      { kind: "human", percent: 26, label: "26%", sublabel: "Human-centric / judgment & relationships" },
      { kind: "collab", percent: 33, label: "33%", sublabel: "AI collaboration / drafts + judgment" },
      { kind: "automation", percent: 41, label: "41%", sublabel: "Automation-ready / structured repetition" },
    ],
  },
  filters: [
    { id: "important", label: "High-importance tasks", default: true },
    { id: "human", label: "Human-centric" },
    { id: "collab", label: "AI collaboration" },
    { id: "automation", label: "Automation-ready" },
  ],
  task_cards: [
    {
      id: "t1",
      filter_group: ["important", "collab"],
      order: 1,
      title: "Draft campaign messaging and channel variants",
      ai_role_type: "collab",
      metrics: { importance: 87, frequency_display: 82, weight_percent: 8 },
      capabilities: ["Critical thinking", "Persuasion", "Negotiation"],
      ai_helps: "Tone variants, copy polish, A/B drafts, and fast first passes on repetitive sections.",
      human_owns: "Direction, evidence, ethics, approvals, and stakeholder timing stay with people.",
    },
    {
      id: "t2",
      filter_group: ["important", "human"],
      order: 2,
      title: "Steward major donor relationships and mediate requests",
      ai_role_type: "human",
      metrics: { importance: 91, frequency_display: 74, weight_percent: 12 },
      capabilities: ["Relationship building", "Mediation", "Accountable judgment"],
      ai_helps: "Scheduling, summaries, and surfacing prior context as a reference layer.",
      human_owns: "Trust, sensitive conversations, commitments, and final calls remain human-led.",
    },
    {
      id: "t3",
      filter_group: ["important", "automation"],
      order: 3,
      title: "Monthly performance pack in a fixed template",
      ai_role_type: "automation",
      metrics: { importance: 62, frequency_display: 88, weight_percent: 15 },
      capabilities: ["Data hygiene", "Quality check"],
      ai_helps: "Merging sources, draft tables/charts, and first-pass numeric checks.",
      human_owns: "Metric definitions, exceptions, and executive interpretation stay owned by people.",
    },
    {
      id: "t4",
      filter_group: ["collab"],
      order: 4,
      title: "Interpret campaign performance and propose improvements",
      ai_role_type: "collab",
      metrics: { importance: 79, frequency_display: 70, weight_percent: 10 },
      capabilities: ["Analysis", "Storytelling"],
      ai_helps: "Segment comparisons, anomaly hints, and candidate hypotheses.",
      human_owns: "Priorities, plans, and org-wide persuasion and accountability.",
    },
  ],
  career_insights: [
    {
      number: 1,
      title: "Importance ≠ AI impact",
      body: "Frequent, important work can still have layers that are easy to delegate to AI—and thin slices that stay uniquely human.",
    },
    {
      number: 2,
      title: "Work splits into layers more than it disappears",
      body: "The same job title often separates into execution/draft layers versus judgment/relationship layers.",
    },
    {
      number: 3,
      title: "Strategy comes from the split",
      body: "Clarifying what AI carries versus what you own is the core career and team design move.",
    },
  ],
};
