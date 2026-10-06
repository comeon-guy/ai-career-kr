export const CANONICAL_PRESENTATION_CONTRACT =
  "27-soc-canonical-presentation-v1";

export const VALUE_SHIFT_ITEM_COUNT = 4;
export const VALUE_SHIFT_SENTENCE_SHAPE = "complete-sentence";

/** @deprecated fixed semantic count removed — use MIN/MAX UI bounds */
export const COMPETITIVENESS_TAKEAWAY_COUNT = 3;
/** Evidence-driven competency count; these are UI bounds only (not generator hard counts). */
export const COMPETITIVENESS_TAKEAWAY_COUNT_MIN = 2;
export const COMPETITIVENESS_TAKEAWAY_COUNT_MAX = 5;
/** Soft reading aids only — presentation must not truncate to force short copy. */
export const COMPETITIVENESS_SUMMARY_MAX_SENTENCES = 8;
export const COMPETITIVENESS_TAKEAWAY_MAX_SENTENCES = 8;
export const AI_WORKING_WORKFLOW_COUNT_MIN = 2;
export const AI_WORKING_WORKFLOW_COUNT_MAX = 6;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function toCanonicalValueShiftSentence(value, lang = "ko") {
  const text = clean(value);
  if (!text) return "";
  if (/[.!?]$/u.test(text)) return text;
  return lang === "en" ? `${text}.` : `${text}입니다.`;
}

export function canonicalValueShiftItems(values, lang = "ko") {
  return (Array.isArray(values) ? values : [])
    .map((value) => toCanonicalValueShiftSentence(value, lang))
    .filter(Boolean)
    .slice(0, VALUE_SHIFT_ITEM_COUNT);
}

export function splitSentences(value) {
  const text = clean(value);
  if (!text) return [];
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/gu);
  return (matches || []).map(clean).filter(Boolean);
}

export function limitSentences(value, maxSentences) {
  return splitSentences(value).slice(0, maxSentences).join(" ");
}

/**
 * Value Shift reason block contract:
 * key judgment (1 sentence) → optional supporting explanation.
 * Content is never deleted; only reading hierarchy is applied.
 */
export function splitLeadAndSupport(value) {
  const sentences = splitSentences(value);
  if (!sentences.length) {
    return { lead: "", support: "" };
  }
  return {
    lead: sentences[0],
    support: sentences.slice(1).join(" "),
  };
}

export function canonicalAiWorkingProblemFields(scenario, v3) {
  const shortTitle = String(scenario?.title_short || "").trim();
  const fullTitle = String(scenario?.title || "").trim();
  const titleStem = fullTitle
    .replace(/하는\s*(?:경영|관리)?\s*상황$/u, "")
    .replace(/\s*상황$/u, "")
    .trim();
  return {
    presentation_contract:
      v3?.presentation_contract || CANONICAL_PRESENTATION_CONTRACT,
    core_problem_short:
      String(v3?.core_problem_short || "").trim() ||
      (shortTitle ? `${shortTitle}에서 무엇을 판단할까?` : ""),
    core_problem_detail:
      String(v3?.core_problem_detail || "").trim() ||
      (titleStem ? `${titleStem}할 때 무엇을 우선하고 최종 판단해야 할까?` : ""),
  };
}
