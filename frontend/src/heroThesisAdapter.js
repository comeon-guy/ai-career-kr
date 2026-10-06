/** KR runtime: US Hero/7SOC overlays are inaccessible. Production narrative allowed. */

export const HERO_SUMMARY_CONTRACT = "hero-summary-v1";
/** @deprecated preserved for import continuity — empty in KR runtime */
export const HERO_THESIS_CONTRACT = "hero-thesis-v1";

export const GENERIC_INSIGHT_SHOWN_IN_UI = "";

/** Frozen empty — US 7SOC hero copy cannot resolve at KR runtime. */
export const HERO_THESIS_7SOC = Object.freeze({});

export function resolveHeroPresentation(report, lang = "ko") {
  const id = String(
    report?.profile?.occupation_id || report?.profile?.soc_code || "",
  ).trim();
  // Refuse US SOC-shaped keys and any 7SOC overlay path.
  if (/^\d{2}-\d{4}\.\d{2}$/.test(id)) {
    return {
      source: "kr_us_soc_blocked",
      contract: HERO_SUMMARY_CONTRACT,
      summary: "",
      code: "US_SOC_RUNTIME_BLOCKED",
    };
  }

  const useEn = lang === "en";
  const all = report?.all_soc_narrative;
  if (
    all &&
    (all.status === "MACHINE_PASS" || all.review_status === "REVIEW_PENDING")
  ) {
    const summary = String(
      all.section_01?.interpretation ||
        report?.career_positioning_body ||
        report?.job_one_line ||
        "",
    ).trim();
    if (summary) {
      return {
        source: "kr_production_narrative",
        contract: HERO_SUMMARY_CONTRACT,
        summary,
      };
    }
  }

  const fromReport = String(
    report?.career_positioning_body || report?.job_one_line || "",
  ).trim();
  if (fromReport && !useEn) {
    return {
      source: "kr_production_narrative",
      contract: HERO_SUMMARY_CONTRACT,
      summary: fromReport,
    };
  }

  return {
    source: "canonical_missing",
    contract: HERO_SUMMARY_CONTRACT,
    summary: "",
    code: "HERO_CANONICAL_ARTIFACT_MISSING",
  };
}
