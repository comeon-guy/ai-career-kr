/**
 * Task Analysis V2 H_share_resolved values for Position Map (2D).
 * X = AI_AUGMENTATION H_share_resolved
 * Y = HUMAN_JUDGMENT H_share_resolved
 * AUTOMATION supporting dimension is removed from Task Analysis path.
 * resolved=0 → unavailable (never coerce to 0).
 */

import { readV2PositionShares } from "./taskAnalysisV2Adapter.js";

export function toSharePercent(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  if (n > 1 && n <= 100) return Math.round(n);
  return null;
}

export function hasTaskRoleShareArtifact(profile, taskAnalysis) {
  if (taskAnalysis?.source === "task_analysis_v2" || taskAnalysis?.task_role_v2) {
    const shares = readV2PositionShares(taskAnalysis);
    return !shares.aiUnavailable || !shares.humanUnavailable;
  }
  if (taskAnalysis?.methodology?.task_role_artifact === "ABSENT") return false;
  if (profile?.task_role_v1_final === true) return true;
  if (profile?.score_construct?.legacy_aei_acs === false) return true;
  if (taskAnalysis?.task_role_v1_final === true) return true;
  return false;
}

/**
 * Position Map shares from V2 Task Analysis.
 * Returns { ai, human, auto: null }. auto is always null (AUTOMATION removed).
 * Unavailable axes stay null — never coerced to 0.
 */
export function readTaskRoleSharePercents(profile, taskAnalysis) {
  void profile;
  if (taskAnalysis?.source === "task_analysis_v2" || taskAnalysis?.v2_axes || taskAnalysis?.task_role_v2) {
    const shares = readV2PositionShares(taskAnalysis);
    return {
      ai: shares.aiUnavailable ? null : shares.ai,
      human: shares.humanUnavailable ? null : shares.human,
      auto: null,
      aiUnavailable: shares.aiUnavailable,
      humanUnavailable: shares.humanUnavailable,
      automation_used: false,
    };
  }
  return null;
}
