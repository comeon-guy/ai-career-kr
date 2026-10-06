/**
 * Section 01 common contract: one-line relative position reading.
 * Explains task-share composition — does not label the whole occupation.
 * Numbers/KPI restatement are forbidden. Dynamic from occupation shares only.
 *
 * V2 Task Analysis path: AI + HUMAN H_share_resolved only (no AUTOMATION).
 */

export const POSITION_INTERPRETATION_CONTRACT =
  "canonical-position-interpretation-v1";

function toPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n <= 1 ? n * 100 : n;
}

function axisHigh(pct) {
  return pct != null && pct >= 50;
}

/**
 * Resolve from V2 adapted Task Analysis shares when present.
 * @param {{ profile?: object | null, taskAnalysis?: object | null, lang?: string }} args
 * @returns {string}
 */
export function resolvePositionInterpretation({
  profile = null,
  taskAnalysis = null,
  lang = "ko",
} = {}) {
  let aiPct = null;
  let humanPct = null;

  if (taskAnalysis?.v2_axes) {
    const ai = taskAnalysis.v2_axes.ai_augmentation?.H;
    const human = taskAnalysis.v2_axes.human_judgment?.H;
    if (ai?.available) aiPct = ai.pct;
    if (human?.available) humanPct = human.pct;
  } else {
    aiPct = toPct(
      profile?.AI_AUGMENTATION_HIGH_SHARE ??
        profile?.ai_augmentation_high_share ??
        profile?.aei_job ??
        profile?.AEI_job,
    );
    humanPct = toPct(
      profile?.HUMAN_JUDGMENT_HIGH_SHARE ??
        profile?.human_judgment_high_share ??
        profile?.acs_job ??
        profile?.ACS_job,
    );
  }

  if (aiPct == null || humanPct == null) return "";

  const aiHigh = axisHigh(aiPct);
  const humanHigh = axisHigh(humanPct);
  const ko = lang !== "en";

  if (aiHigh && humanHigh) {
    return ko
      ? "이 직무에는 AI가 크게 도울 수 있는 업무와 사람 판단이 중요한 업무가 함께 포함되어 있습니다."
      : "This occupation includes a sizable share of tasks AI can help with a lot, and tasks where human judgment matters.";
  }
  if (aiHigh && !humanHigh) {
    return ko
      ? "이 직무에는 AI가 크게 도울 수 있는 업무 비중이 상대적으로 크고, 사람 판단이 중요한 업무 비중은 상대적으로 작습니다."
      : "This occupation has a relatively larger share of tasks AI can help with a lot, and a smaller share where human judgment is critical.";
  }
  if (!aiHigh && humanHigh) {
    return ko
      ? "이 직무에는 사람 판단이 중요한 업무 비중이 상대적으로 크고, AI가 크게 도울 수 있는 업무 비중은 상대적으로 작습니다."
      : "This occupation has a relatively larger share of judgment-critical tasks, and a smaller share where AI can help a lot.";
  }
  return ko
    ? "이 직무에는 AI가 크게 도울 수 있는 업무와 사람 판단이 중요한 업무의 비중이 모두 상대적으로 작습니다."
    : "This occupation sits relatively lower on both AI-help and judgment-critical task shares.";
}
