/**
 * task_structure_summary 기반 Section1 메시지 — hero 1문장 / 직무 변화 방향은 별도 각도
 */
import {
  firstInsightSentence,
  stripPercentRestatement,
  textsAreRedundant,
} from "./narrativeSanitize.js";
import { polishInsightText } from "./narrativeQuality.js";

/** Section3 fallback: 역할 이동(일하는 방식) 한 줄만 */
export function buildSection3WorkStyleFallbackChips(report, lang = "ko") {
  const tss = report?.task_structure_summary;
  if (!tss || typeof tss !== "object") return [];
  const isKo = lang !== "en";
  const interp =
    (isKo ? tss.structure_interpretation_ko : tss.structure_interpretation_en) ||
    tss.structure_interpretation;
  if (!interp || typeof interp !== "object") return [];
  const val = polishInsightText(String(interp.role_shift_interpretation || ""), lang);
  return val ? [val] : [];
}

/** @param {unknown} items @param {string} lang */
export function cleanLegacyProofItems(items, lang = "ko") {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    const s = polishInsightText(String(item || ""), lang);
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/**
 * @param {object} report
 * @param {string} lang
 * @returns {{ heroInsight: string; positioningBody: string; structureTags: string[] } | null}
 */
export function buildStructureBasedTopMessages(report, lang = "ko") {
  const tss = report?.task_structure_summary;
  if (!tss || typeof tss !== "object") return null;

  const isKo = lang !== "en";
  const interp =
    (isKo ? tss.structure_interpretation_ko : tss.structure_interpretation_en) ||
    tss.structure_interpretation;
  const tags = isKo ? tss.structure_tags_ko : tss.structure_tags_en;

  if (interp && typeof interp === "object") {
    const hero = firstInsightSentence(String(interp.hero_insight || ""));
    const positioning = polishInsightText(
      String(interp.positioning_rationale || interp.positioning_body || ""),
      lang,
    );
    if (!hero && !positioning) return null;
    const positioningBody =
      positioning && !textsAreRedundant(hero, positioning) ? positioning : "";
    return {
      heroInsight: hero,
      positioningBody,
      structureTags: Array.isArray(tags) ? tags.filter(Boolean) : [],
    };
  }

  return null;
}
