import { getValueShiftPresentation } from "../../utils/getValueShiftPresentation.js";
import { parseSection2ValueShift } from "../report/section2ValueShiftParse.js";
import {
  hasOccupationCareerCompetitiveness,
  resolveCareerCompetitivenessPresentation,
} from "../../careerCompetitivenessOccupationAdapter.js";
import {
  hasRepresentativeChain,
  selectRepresentativeSituations,
} from "../report/selectRepresentativeSituations.js";
import { isReviewContractParam, isValidatedReviewSoc } from "../../reviewContract.js";
import { isProductionFinalSoc } from "../../productionFinalSocs.js";
import { getAiWorkingV3 } from "../../aiWorkingV3Adapter.js";
import {
  REPORT_NUMBERED_SECTIONS,
  resolveReportNumberedSections,
} from "../../reportStructure.js";
import { resolveAiWorkingSectionPresentation } from "../../sectionNarrativePresentation.js";

function parseUiStructured(report) {
  let ui = report?.ui_structured_json;
  if (!ui) return null;
  if (typeof ui === "string") {
    try {
      ui = JSON.parse(ui);
    } catch {
      return null;
    }
  }
  return ui && typeof ui === "object" ? ui : null;
}

function section2FromReport(report, lang) {
  const ui = parseUiStructured(report);
  if (!ui) return null;
  const raw = ui.section_2_value_shift ?? ui.report_ui?.section_2_value_shift;
  return parseSection2ValueShift(raw, { lang });
}

/** Default editorial report section anchors (non-pilot). */
export const REPORT_SECTION_DEFS = REPORT_NUMBERED_SECTIONS;

export function readReviewModeFromSearch(search = "") {
  const qs =
    search ||
    (typeof window !== "undefined" ? window.location.search : "");
  return isReviewContractParam(new URLSearchParams(qs).get("review_contract"));
}

function scenarioHasAiWorkingV3(sc, soc) {
  if (sc?.ai_working_v3) return true;
  const sid = String(sc?.scenario_id || "").trim();
  if (!sid) return false;
  return Boolean(getAiWorkingV3(soc, sid));
}

/**
 * True when final Representative Scenario + AI Working should render.
 * Production-final SOCs: require ai-working-v3 on every default scenario (no v2 classic substitute).
 * Never treats report.tasks fallback as AI Working.
 */
export function hasAIWorkingSection(report, { reviewMode = false, lang = "ko" } = {}) {
  if (!report) return false;
  if (report?.FULL_REPORT_PASS === false || report?.report_publication?.status === "REPORT_PUBLICATION_BLOCKED") {
    return false;
  }
  const soc = String(report?.profile?.occupation_id || report?.profile?.occupation_id || report?.profile?.soc_code || "").trim();
  if (resolveAiWorkingSectionPresentation({ soc, lang, report })) return true;
  const pick = selectRepresentativeSituations(report, { reviewMode });
  if (!pick.scenarios.length) return false;
  if (isProductionFinalSoc(soc) || isValidatedReviewSoc(soc) || hasRepresentativeChain(report)) {
    return pick.scenarios.every((s) => scenarioHasAiWorkingV3(s, soc));
  }
  return false;
}

export function hasValueShiftSection(report, lang = "ko") {
  if (!report) return false;
  if (report?.FULL_REPORT_PASS === false || report?.report_publication?.status === "REPORT_PUBLICATION_BLOCKED") {
    return false;
  }
  const section2FromApi = section2FromReport(report, lang);
  const valueDeclineTasks = Array.isArray(report.value_decline_tasks)
    ? report.value_decline_tasks.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const valueRiseTasks = Array.isArray(report.value_rise_tasks)
    ? report.value_rise_tasks.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const valueDeclineInterpretation = String(report.value_decline_interpretation || "").trim();
  const valueRiseInterpretation = String(report.value_rise_interpretation || "").trim();
  const data = getValueShiftPresentation({
    section2FromApi,
    valueDeclineTasks,
    valueRiseTasks,
    valueDeclineInterpretation,
    valueRiseInterpretation,
    report,
    lang,
  });
  return Boolean(data);
}

export function hasPositionSection(report) {
  return Boolean(report?.profile);
}

export function hasEvidenceSection(report) {
  return Boolean(report?.profile);
}

/** Alias — reference area is the evidence / sources block at report bottom. */
export function hasReportReferenceArea(report) {
  return hasEvidenceSection(report);
}

export function hasCareerCompetitivenessSection(report, { reviewMode = false } = {}) {
  if (report?.FULL_REPORT_PASS === false || report?.report_publication?.status === "REPORT_PUBLICATION_BLOCKED") {
    return false;
  }
  const soc = String(report?.profile?.occupation_id || report?.profile?.occupation_id || report?.profile?.soc_code || "").trim();
  void reviewMode;
  if (resolveCareerCompetitivenessPresentation({ soc, report })) return true;
  return hasOccupationCareerCompetitiveness(soc);
}

/**
 * Content-driven section list for report navigation.
 * Story-flow pilot (accountant): roleChange → valueShift → aiWorking → competitiveness.
 * @returns {{ id: string, ko: string, en: string, label?: string, number?: string, key?: string }[]}
 */
export function deriveReportSections(report, { lang = "ko", reviewMode } = {}) {
  if (!report) return [];
  void reviewMode;

  const isKo = lang === "ko";
  const soc = String(report?.profile?.occupation_id || report?.profile?.occupation_id || report?.profile?.soc_code || "").trim();
  const defs = resolveReportNumberedSections(soc);
  const visible = [];

  // Latest shell: keep 01–04 even when an individual field is thin.
  // Do not fall back to the legacy numbered template.
  if (hasPositionSection(report)) {
    visible.push(defs[0], defs[1], defs[2], defs[3]);
  }

  return visible.map((item) => ({
    ...item,
    label: `${item.number} ${isKo ? item.ko : item.en}`,
  }));
}
