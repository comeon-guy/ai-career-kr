/**
 * Latest Report Shell (01–04 story flow) — KR runtime.
 * US accountant SOC constant removed; shell is universal.
 */

export const REPORT_STORY_FLOW_CONTRACT =
  "KR_REPORT_STORY_FLOW_V1";

/** @deprecated US pilot SOC removed from KR runtime */
export const REPORT_STORY_FLOW_PILOT_SOC = "";

export const REPORT_STORY_FLOW_STATUS =
  "KR_ACCOUNTANT_GOLDEN_REVIEW";

export const REPORT_STORY_FLOW_SECTIONS = Object.freeze([
  Object.freeze({
    key: "roleChange",
    id: "overview",
    number: "01",
    ko: "AI 시대의 역할 변화",
    en: "Role change in the AI era",
    embeds: Object.freeze(["positionMap"]),
  }),
  Object.freeze({
    key: "valueShift",
    id: "er-shift",
    number: "02",
    ko: "업무 가치 변화",
    en: "How work value may change",
  }),
  Object.freeze({
    key: "aiWorking",
    id: "sec-work-scenarios",
    number: "03",
    ko: "AI를 활용하는 방식",
    en: "How AI can be used in work",
    presentation: "occupation_step_flow",
  }),
  Object.freeze({
    key: "competitiveness",
    id: "sec-career-competitiveness",
    number: "04",
    ko: "앞으로 중요한 경쟁력",
    en: "Capabilities that matter going forward",
  }),
]);

export const REPORT_STORY_FLOW_BY_KEY = Object.freeze(
  Object.fromEntries(REPORT_STORY_FLOW_SECTIONS.map((row) => [row.key, row])),
);

/** US accountant golden SOC branch disabled in KR runtime. */
export function isAccountantGoldenSoc(_id) {
  return false;
}

export function isLatestReportShellSoc(_id, _report) {
  return true;
}

export function isReportStoryFlowPilotSoc(id, report) {
  return isLatestReportShellSoc(id, report);
}

export function resolveReportStoryFlowSections(_id) {
  return REPORT_STORY_FLOW_SECTIONS;
}

export const STORY_FLOW_ROLE_CHANGE_INTRO = Object.freeze({
  ko: "AI 활용이 확대되면 이 직무의 역할은 어떤 방향으로 달라질 수 있을까?",
  en: "As AI use expands, how might this occupation’s role shift?",
});

export const STORY_FLOW_VALUE_CHANGE_INTRO = Object.freeze({
  ko: "역할 변화 속에서 어떤 업무의 상대적 가치가 달라질 수 있을까?",
  en: "As roles shift, which tasks may change in relative value?",
});

export const STORY_FLOW_AI_USAGE_INTRO = Object.freeze({
  ko: "그렇다면 실제 업무에서는 AI를 어디에 활용하고 무엇을 사람이 판단하게 될까?",
  en: "So in real work, where can AI be used, and what still needs human judgment?",
});

export const STORY_FLOW_COMPETITIVENESS_INTRO = Object.freeze({
  ko: "이러한 역할과 업무 방식의 변화 속에서 무엇을 잘하는 것이 경쟁력이 될까?",
  en: "Given these shifts in role and work practice, what capabilities may matter more?",
});

export const STORY_FLOW_INDEPENDENT_AXES_NOTE = Object.freeze({
  ko: "오른쪽 세 지표는 독립적인 분석축입니다. 한 업무가 여러 기준에 동시에 해당할 수 있으므로 세 비율의 합이 100%일 필요는 없습니다.",
  en: "The three metrics on the right are independent axes. One task can count toward more than one share, so the three percentages need not add to 100%.",
});

export const STORY_FLOW_TRAINING_CTA = Object.freeze({
  ko: Object.freeze({
    title: "이 경쟁력을 실제 업무 상황에서 연습해볼 수 있습니다.",
    body: "6가지 AI 활용역량을 활용한 훈련으로 이어갈 수 있습니다.",
    button: "AI 업무 훈련 시작하기 →",
  }),
  en: Object.freeze({
    title: "You can practice these capabilities in real work situations.",
    body: "Continue into training that uses the six shared AI work competencies.",
    button: "Start AI work training →",
  }),
});

/** Unused in KR runtime (isAccountantGoldenSoc always false). Kept for import continuity. */
export const ACCOUNTANT_AI_USAGE_STEP_TITLES = Object.freeze([]);
