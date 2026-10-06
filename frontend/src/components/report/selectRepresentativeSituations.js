/**
 * Source of truth for "AI와 일하는 방식".
 * Review / 7-SOC verification must never render report.tasks.
 */
import { REVIEW_SOCS, isReviewContractParam } from "../../reviewContract.js";
import { enrichSituationShortLabels } from "../../situationShortLabelAdapter.js";
import { enrichScenariosWithAiWorkingV3 } from "../../aiWorkingV3Adapter.js";
import { enrichScenariosWithExecutionNarrative } from "../../executionNarrativeAdapter.js";

export function isScenarioId(id) {
  return /^WS\d+/i.test(String(id || "").trim());
}

export function isReviewVerificationSoc(soc) {
  const c = String(soc || "").trim();
  return REVIEW_SOCS.some((x) => x.soc === c);
}

export function hasRepresentativeChain(report) {
  const sel = report?.representative_selection;
  const list = Array.isArray(report?.work_scenarios) ? report.work_scenarios : [];
  if (!sel || typeof sel !== "object") return false;
  if (!sel.anchor_situation && !sel.presentation_order) return false;
  return list.some((s) => isScenarioId(s?.scenario_id));
}

export function readReviewModeFromWindow() {
  if (typeof window === "undefined") return false;
  return isReviewContractParam(new URLSearchParams(window.location.search).get("review_contract"));
}

/**
 * @returns {{
 *   scenarios: object[];
 *   otherValid: object[];
 *   selection: object | null;
 *   source: "representative_selection" | "work_scenarios" | "missing_contract" | "none";
 * }}
 */
export function selectRepresentativeSituations(report, { reviewMode = false } = {}) {
  const soc = report?.profile?.occupation_id || report?.profile?.occupation_id || report?.profile?.soc_code || "";
  const forbidTaskFallback = reviewMode || isReviewVerificationSoc(soc);
  const raw = Array.isArray(report?.work_scenarios) ? report.work_scenarios.filter(Boolean) : [];
  const otherRaw = Array.isArray(report?.other_valid_situations) ? report.other_valid_situations.filter(Boolean) : [];
  const selection = report?.representative_selection && typeof report.representative_selection === "object"
    ? report.representative_selection
    : null;

  const scenarios = enrichScenariosWithExecutionNarrative(
    enrichScenariosWithAiWorkingV3(
      enrichSituationShortLabels(
        raw.filter((s) => isScenarioId(s.scenario_id)),
        soc,
      ),
      soc,
    ),
    soc,
  );
  const otherValid = enrichScenariosWithExecutionNarrative(
    enrichScenariosWithAiWorkingV3(
      enrichSituationShortLabels(
        otherRaw.filter((s) => isScenarioId(s.scenario_id) && !scenarios.some((d) => d.scenario_id === s.scenario_id)),
        soc,
      ),
      soc,
    ),
    soc,
  );

  if (forbidTaskFallback) {
    return {
      scenarios,
      otherValid,
      selection,
      source: scenarios.length ? "representative_selection" : "missing_contract",
    };
  }
  // Non-validated SOCs: only expose final AI Working when representative chain exists (894+).
  const allowProductionScenarios = scenarios.length > 0 && hasRepresentativeChain(report);
  if (allowProductionScenarios) {
    return { scenarios, otherValid, selection, source: "work_scenarios" };
  }
  return { scenarios: [], otherValid: [], selection: null, source: "none" };
}

export function situationRenderLog(scenarios, otherValid, selection) {
  return {
    source: selection?.review_contract || selection?.contract || null,
    anchor: selection?.anchor_situation || null,
    presentation_order: selection?.presentation_order || [],
    protect: selection?.protect_from_demotion || [],
    default: (Array.isArray(scenarios) ? scenarios : []).map((s) => ({
      scenario_id: s?.scenario_id,
      title: s?.title,
      title_short: s?.title_short,
    })),
    other_valid: (Array.isArray(otherValid) ? otherValid : []).map((s) => ({
      scenario_id: s?.scenario_id,
      title: s?.title,
      title_short: s?.title_short,
    })),
  };
}
