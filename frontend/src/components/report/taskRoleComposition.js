/**
 * Shared Task Role Composition — production "전체 업무 구성" shell.
 *
 * V2 production path: independent 2-axis (AI_AUGMENTATION + HUMAN_JUDGMENT).
 * AUTOMATION is not part of Task Analysis composition.
 *
 * Legacy stack/exclusive modes remain for historical helpers only — Task Analysis
 * production consumers must call selectV2IndependentComposition / selectTaskRoleCompositionV2.
 */

import { selectV2IndependentComposition } from "./taskAnalysisV2Adapter.js";

export const DISPLAY_ROLE_ORDER = [
  "AI_COLLABORATION",
  "HUMAN_JUDGMENT",
];

/** @deprecated Exclusive presentation labels — not Task Role V2 SoT. */
export const DISPLAY_ROLE_META = {
  AI_COLLABORATION: {
    labelKo: "AI 협업형",
    labelEn: "AI collaboration",
    tone: "ai",
  },
  HUMAN_JUDGMENT: {
    labelKo: "사람 판단 중심",
    labelEn: "Human judgment",
    tone: "human",
  },
};

/** V2 Task Analysis axes only — AUTOMATION excluded. */
export const AXIS_HIGH_ORDER = [
  "ai_augmentation",
  "human_judgment",
];

export const AXIS_HIGH_META = {
  ai_augmentation: {
    labelKo: "AI가 크게 도울 수 있는 업무 비중",
    labelEn: "Share of work AI can help a lot with",
    legendKo: "AI가 크게 도울 수 있는 업무",
    legendEn: "Work AI can help a lot with",
    filterKo: "AI 도움 H",
    filterEn: "AI help H",
    tone: "ai",
  },
  human_judgment: {
    labelKo: "사람 판단이 중요한 업무 비중",
    labelEn: "Judgment-critical work share",
    legendKo: "사람 판단이 중요한 업무",
    legendEn: "Judgment-critical work",
    filterKo: "사람 판단 H",
    filterEn: "Human H",
    tone: "human",
  },
};

/**
 * V2 production composition — independent axes from adapted task_analysis_v2.
 * Never merges AI+HUMAN into a single score. Never includes AUTOMATION.
 */
export function selectTaskRoleCompositionV2(payload, { lang = "ko" } = {}) {
  if (payload?.source === "task_analysis_v2" || payload?.task_role_v2 || payload?.v2_axes) {
    return selectV2IndependentComposition(payload, { lang });
  }
  throw new Error("Task Analysis composition requires task_analysis_v2 adapted payload");
}

/**
 * @deprecated Legacy HIGH-share profile path — not used by V2 Task Analysis production.
 */
export function selectTaskRoleAxisHighShares(payload, { lang = "ko" } = {}) {
  if (payload?.source === "task_analysis_v2" || payload?.v2_axes) {
    const composition = selectV2IndependentComposition(payload, { lang });
    const axes = (composition.categories || [])
      .filter((c) => !c.partial)
      .map((c) => ({
        key: c.axis || c.key,
        label: c.fullLabel || c.label,
        legendLabel: c.label,
        filterLabel: c.label,
        pct: c.unavailable ? null : c.percentage,
        share: c.unavailable || c.percentage == null ? null : c.percentage / 100,
        highTaskCount: 0,
        tone: c.tone,
        unavailable: Boolean(c.unavailable),
      }));
    return {
      axes,
      exclusiveCompositionDeprecated: true,
      meaning: "V2 H_share_resolved per axis (independent)",
      automation_used: false,
    };
  }
  return {
    axes: [],
    exclusiveCompositionDeprecated: true,
    meaning: "legacy occupation_profile HIGH shares unavailable on V2 path",
    automation_used: false,
  };
}

/**
 * Production "전체 업무 구성" — V2 independent bars.
 */
export function selectIndependentCompositionFromProfile(payload, { lang = "ko", totalHint = null } = {}) {
  if (payload?.source === "task_analysis_v2" || payload?.v2_axes || payload?.task_role_v2) {
    const result = selectV2IndependentComposition(payload, { lang });
    if (totalHint != null && Number.isFinite(totalHint) && !result.total) {
      return { ...result, total: totalHint };
    }
    return result;
  }
  // Fail-closed for Task Analysis production: no legacy AUTOMATION profile composition.
  return {
    mode: "independent",
    contract: "independent_v2",
    total: typeof totalHint === "number" ? totalHint : 0,
    categories: [],
    hasShares: false,
    exclusive_mapping_used: false,
    role_counts_used: false,
    automation_used: false,
    meaning: "V2 payload required; legacy profile composition disabled",
  };
}

/**
 * Production Task Analysis composition entry — V2 only.
 */
export function selectTaskRoleComposition(payload, { lang = "ko", labelByKey = null } = {}) {
  void labelByKey;
  if (payload?.source === "task_analysis_v2" || payload?.v2_axes || payload?.task_role_v2) {
    return selectTaskRoleCompositionV2(payload, { lang });
  }
  return {
    mode: "independent",
    contract: "independent_v2",
    total: Array.isArray(payload?.tasks) ? payload.tasks.length : 0,
    categories: [],
    hasShares: false,
    exclusive_mapping_used: false,
    role_counts_used: false,
    automation_used: false,
    meaning: "awaiting task_analysis_v2",
  };
}

/**
 * @deprecated Prefer axis labels from V2 presentation.
 */
export function labelOverridesFromTasks(tasks) {
  if (!Array.isArray(tasks)) return null;
  return null;
}
