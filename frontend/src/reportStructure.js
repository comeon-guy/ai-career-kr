/**
 * Canonical production report structure.
 * Menu, body headings, anchors, saved-report viewer, and print order use this source.
 * Latest shell is REPORT_STORY_FLOW_SECTIONS for every SOC.
 */

import {
  isReportStoryFlowPilotSoc,
  REPORT_STORY_FLOW_BY_KEY,
  REPORT_STORY_FLOW_SECTIONS,
  resolveReportStoryFlowSections,
} from "./reportStoryFlowPilot.js";

export const REPORT_HERO = Object.freeze({
  key: "hero",
  id: "overview",
  number: null,
  ko: "AI 시대의 역할 변화",
  en: "Role change in the AI era",
});

/** Latest production order (universal Report Shell). */
export const REPORT_NUMBERED_SECTIONS = REPORT_STORY_FLOW_SECTIONS;

export const REPORT_FOOTER = Object.freeze({
  key: "footer",
  id: "sec-report-reference",
  number: null,
  ko: "분석 기준 및 데이터 출처",
  en: "Analysis criteria and data sources",
});

export const REPORT_SECTION_BY_KEY = Object.freeze(
  Object.fromEntries(
    [REPORT_HERO, ...REPORT_NUMBERED_SECTIONS, REPORT_FOOTER].map((item) => [
      item.key,
      item,
    ]),
  ),
);

export function resolveReportNumberedSections(_soc = "") {
  return resolveReportStoryFlowSections(_soc) || REPORT_NUMBERED_SECTIONS;
}

export function reportSectionLabel(key, lang = "ko", _soc = "") {
  const story = REPORT_STORY_FLOW_BY_KEY[key];
  if (story) return lang === "en" ? story.en : story.ko;
  if (key === "hero" || key === "roleChange" || key === "position") {
    const role = REPORT_STORY_FLOW_BY_KEY.roleChange;
    return lang === "en" ? role.en : role.ko;
  }
  const item = REPORT_SECTION_BY_KEY[key];
  if (!item) return "";
  return lang === "en" ? item.en : item.ko;
}

export function reportSectionNumber(key, _soc = "") {
  if (key === "hero" || key === "roleChange" || key === "position") {
    return REPORT_STORY_FLOW_BY_KEY.roleChange.number;
  }
  return REPORT_STORY_FLOW_BY_KEY[key]?.number || REPORT_SECTION_BY_KEY[key]?.number || "";
}

export { REPORT_STORY_FLOW_SECTIONS, isReportStoryFlowPilotSoc };

/** Canonical report-footer CTA copy. Count is supplied by the canonical task source. */
export function buildAllTasksReportCta(taskCount, lang = "ko") {
  return lang === "en"
    ? `View analysis of all ${taskCount} tasks →`
    : `전체 업무 ${taskCount}개 분석 보기 →`;
}
