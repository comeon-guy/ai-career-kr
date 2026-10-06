/**
 * Narrative Role & Direction Contract v1 — shared presentation.
 * Same direction strings as backend narrative_role_direction.py.
 * No SOC-specific branches.
 */

export const NARRATIVE_ROLE_DIRECTION_CONTRACT =
  "NARRATIVE_ROLE_DIRECTION_CONTRACT_V1";

export const NARRATIVE_ROLE_DIRECTIONS = Object.freeze({
  hero: Object.freeze({
    ko: "처리 → 검증 → 판단·설명",
    en: "Process → Verify → Judge & explain",
    questionKo: "AI가 들어오면서 이 직무에서 무엇이 달라지는가?",
    logic: "WHAT_CHANGES",
  }),
  competitiveness: Object.freeze({
    ko: "신호 구분 → 근거 확인 → 판단 → 설명",
    en: "Separate signals → Check evidence → Judge → Explain",
    questionKo: "그 변화 때문에 사람이 무엇을 더 잘해야 하는가?",
    logic: "WHAT_BECOMES_VALUABLE",
  }),
  aiWorking: Object.freeze({
    ko: "상황 → AI → 검증 → 결정",
    en: "Situation → AI → Verify → Decide",
    questionKo: "실제 업무에서는 AI와 사람이 어떻게 문제를 해결하는가?",
    logic: "HOW_IT_WORKS_IN_PRACTICE",
  }),
});

export function narrativeRoleDirection(sectionKey, lang = "ko") {
  const row = NARRATIVE_ROLE_DIRECTIONS[sectionKey];
  if (!row) return "";
  return lang === "en" ? row.en : row.ko;
}
