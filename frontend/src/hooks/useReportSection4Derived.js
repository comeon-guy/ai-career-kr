import { useMemo } from "react";
import { parseSection4TaskAiRole } from "../components/report/Section4TaskAiRole.jsx";
import { mergeSection4ReportCardsWithNarrative } from "../components/report/section4MergeNarrative.js";
import {
  buildSection4TaskPayloadFromReportTasks,
  applyCompositionToSection4Data,
  buildSection4TaskCardsFromReportTasks,
} from "../components/report/section4FromReportTasks.js";
import {
  SECTION_4_TASK_AI_ROLE_MOCK_EN,
  SECTION_4_TASK_AI_ROLE_MOCK_KO,
} from "../components/report/section4TaskAiRole.mock.js";
import { resolveAiImpactBuckets } from "../utils/taskAiImpactComposition.js";
import { getAiLevelByMode, getAiReasonByMode, getFrequencyScore } from "../utils/reportTaskAiHelpers.js";

function parseUiStructured(report) {
  if (!report) return null;
  let ui = report.ui_structured_json;
  if (typeof ui === "string") {
    try {
      ui = JSON.parse(ui);
    } catch {
      return null;
    }
  }
  return ui && typeof ui === "object" ? ui : null;
}

const EMPTY = {
  displayComposition: null,
  highImpact: [],
  lowImpact: [],
  section4TaskAiRoleData: null,
  section4TaskCardsForFilters: [],
  hasSection4TaskAiRoleUi: false,
};

/**
 * Section4 UI 파생 데이터 (report·lang 변경 시에만 재계산)
 * @param {object | null} report
 * @param {object | null} profile
 * @param {string} lang
 */
export function useReportSection4Derived(report, profile, lang) {
  const socCode =
    profile?.occupation_id ||
    profile?.soc_code ||
    report?.profile?.occupation_id ||
    report?.profile?.soc_code ||
    "";
  const tasks = report?.tasks;
  const tasksLen = Array.isArray(tasks) ? tasks.length : 0;
  const taskCapabilityTable = report?.task_capability_table;
  const uiStructuredParsed = useMemo(() => parseUiStructured(report), [report?.ui_structured_json, socCode]);

  return useMemo(() => {
    if (!report || !Array.isArray(tasks) || !tasks.length) {
      return EMPTY;
    }

    const title =
      profile?.occupation_title ||
      profile?.occupation_id ||
      profile?.soc_code ||
      report?.profile?.occupation_title ||
      "";
    const { highImpact, lowImpact, displayComposition } = resolveAiImpactBuckets(tasks, getAiLevelByMode);

    const section4TaskAiRoleRaw =
      uiStructuredParsed?.section_4_task_ai_role ?? uiStructuredParsed?.report_ui?.section_4_task_ai_role ?? null;
    const section4Lang = lang === "en" ? "en" : "ko";
    const section4FromApi = parseSection4TaskAiRole(section4TaskAiRoleRaw, section4Lang, report);

    const allowSection4Mock = String(import.meta.env.VITE_SECTION4_MOCK || "").toLowerCase() === "true";
    const section4MockPayload = lang !== "en" ? SECTION_4_TASK_AI_ROLE_MOCK_KO : SECTION_4_TASK_AI_ROLE_MOCK_EN;
    const section4FromMock = parseSection4TaskAiRole(section4MockPayload, section4Lang, report);

    const section4PayloadFromTasks = buildSection4TaskPayloadFromReportTasks(tasks, lang, {
      occupationTitle: title,
      taskCapabilityTable: taskCapabilityTable || [],
      getAiLevelByMode,
      getFrequencyScore,
      getHumanOwnsRationale: (t) => getAiReasonByMode(t, lang),
      composition: displayComposition,
    });
    const section4FromTasks = parseSection4TaskAiRole(section4PayloadFromTasks, section4Lang, report);

    const section4TaskAiRoleDataRaw =
      section4FromApi ?? section4FromTasks ?? (allowSection4Mock ? section4FromMock : null);
    const section4TaskAiRoleData = section4TaskAiRoleDataRaw
      ? applyCompositionToSection4Data(section4TaskAiRoleDataRaw, displayComposition)
      : null;

    const section4ReportCards = buildSection4TaskCardsFromReportTasks(tasks, lang, {
      taskCapabilityTable: taskCapabilityTable || [],
      getAiLevelByMode,
      getFrequencyScore,
      getHumanOwnsRationale: (t) => getAiReasonByMode(t, lang),
    });

    const section4InterpretedRaw =
      section4TaskAiRoleRaw?.interpreted_task_cards ?? section4FromApi?.interpreted_task_cards ?? [];

    const section4TaskCardsForFilters = mergeSection4ReportCardsWithNarrative(
      section4ReportCards,
      section4FromApi?.task_cards ?? section4TaskAiRoleDataRaw?.task_cards,
      lang === "en" ? "en" : "ko",
      { interpretedTaskCards: section4InterpretedRaw },
    );

    return {
      displayComposition,
      highImpact,
      lowImpact,
      section4TaskAiRoleData,
      section4TaskCardsForFilters,
      hasSection4TaskAiRoleUi: Boolean(section4TaskAiRoleData),
    };
  }, [report, profile, lang, socCode, tasksLen, taskCapabilityTable, uiStructuredParsed]);
}
