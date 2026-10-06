/**
 * Occupation-level Career Competitiveness presentation.
 * Canonical ownership synthesis only — scenario_legacy production path removed.
 * Item count is evidence-driven; UI only enforces soft min/max bounds.
 */

import payload from "./data/careerCompetitivenessOccupation_v1.json" with { type: "json" };
import {
  CANONICAL_PRESENTATION_CONTRACT,
  COMPETITIVENESS_TAKEAWAY_COUNT_MAX,
} from "./canonicalPresentationContract.js";
import { section04PresentationFromNarrative } from "./allSocNarrativeUi.js";

export const CAREER_COMPETITIVENESS_OCCUPATION_CONTRACT =
  "career-competitiveness-ownership-synthesis-v1";

export function getOccupationCareerCompetitiveness(soc) {
  const row = payload?.socs?.[String(soc || "").trim()];
  if (!row || typeof row !== "object") return null;
  const cc =
    row.career_competitiveness && typeof row.career_competitiveness === "object"
      ? row.career_competitiveness
      : row.summary || row.takeaways
        ? { summary: row.summary, takeaways: row.takeaways }
        : null;
  if (!cc) return null;
  const summary = String(cc.summary || "").trim();
  const takeaways = Array.isArray(cc.takeaways) ? cc.takeaways : [];
  if (!summary && !takeaways.length) return null;
  return {
    ...cc,
    ownership: row.ownership || "occupation",
    status: row.status || null,
    lock: Boolean(row.lock),
    soc: row.soc || String(soc || "").trim(),
  };
}

/**
 * Resolve UI content for section 03.
 * Occupation artifact only. scenario_legacy is never used in production.
 * Summary must be an occupation-level overview of all takeaways — never only the first item.
 * Does not truncate sentence count; does not force exactly 3 items.
 */
export function resolveCareerCompetitivenessPresentation({ soc, report } = {}) {
  const overlay = section04PresentationFromNarrative(report?.all_soc_narrative);
  if (overlay) {
    const takeaways = Array.isArray(overlay.takeaways)
      ? overlay.takeaways
          .map((t) => ({
            title: String(t?.title || "").trim(),
            body: String(t?.description || t?.body || "")
              .replace(/\s+/g, " ")
              .trim(),
          }))
          .filter((t) => t.title && t.body)
          .slice(0, COMPETITIVENESS_TAKEAWAY_COUNT_MAX)
      : [];
    const summary = String(overlay.summary || "")
      .replace(/\s+/g, " ")
      .trim();
    if (
      summary &&
      takeaways.length >= 1
    ) {
      return {
        source: "all_soc_narrative_v1",
        presentationContract: CANONICAL_PRESENTATION_CONTRACT,
        summary,
        headline: "",
        takeaways,
        status: report?.all_soc_narrative?.status,
        lock: false,
      };
    }
  }
  const occupation = getOccupationCareerCompetitiveness(soc);
  if (!occupation) return null;
  const takeaways = Array.isArray(occupation.takeaways)
    ? occupation.takeaways
        .map((t) => ({
          title: String(t?.title || "").trim(),
          body: String(t?.description || t?.body || "")
            .replace(/\s+/g, " ")
            .trim(),
        }))
        .filter((t) => t.title && t.body)
        .slice(0, COMPETITIVENESS_TAKEAWAY_COUNT_MAX)
    : [];
  const summary = String(occupation.summary || "")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !summary ||
    !takeaways.length
  ) {
    return null;
  }
  return {
    source: "occupation",
    presentationContract: CANONICAL_PRESENTATION_CONTRACT,
    summary,
    headline: "",
    takeaways,
    status: occupation.status,
    lock: occupation.lock,
  };
}

export function getOccupationValueShiftBasis(soc) {
  const row = payload?.socs?.[String(soc || "").trim()];
  const basis = row?.synthesis_basis;
  if (!basis || typeof basis !== "object") return null;
  return basis;
}

export function hasOccupationCareerCompetitiveness(soc) {
  return Boolean(getOccupationCareerCompetitiveness(soc));
}
