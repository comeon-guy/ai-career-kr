/**
 * Analysis Method page section anchors — match HTML v3.
 * Route: ?tab=method  (project convention)
 */

export const ANALYSIS_METHOD_TAB = "method";

export const ANALYSIS_METHOD_SECTIONS = [
  { id: "job-data", anchorLabelKo: "직무 데이터", anchorLabelEn: "Job data" },
  { id: "ai-impact", anchorLabelKo: "AI 영향도", anchorLabelEn: "AI impact" },
  { id: "human-judgment", anchorLabelKo: "사람 판단 중요도", anchorLabelEn: "Human judgment" },
  { id: "score-meaning", anchorLabelKo: "점수 해석", anchorLabelEn: "How to read scores" },
  { id: "report-use", anchorLabelKo: "리포트 연결", anchorLabelEn: "In the report" },
];

/** @param {"ai"|"human"} scoreKey */
export function analysisMethodHashForScore(scoreKey) {
  return scoreKey === "ai" ? "ai-impact" : "human-judgment";
}
