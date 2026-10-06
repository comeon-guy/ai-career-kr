/**
 * 직무 구성 변화(요약 카드)와 동일한 규칙으로 AI 영향 버킷·비중(%)을 계산한다.
 * (업무 비중 weight_norm 합, getAiLevelByMode 기준 — ReportIntegrated 기존 로직과 동일)
 */

/**
 * @param {object[]} tasksInput
 * @param {(t: object) => string} getAiLevelByMode
 * @returns {{
 *   highImpact: object[];
 *   midImpact: object[];
 *   lowImpact: object[];
 *   displayComposition: { automation_pct: number; collaboration_pct: number; human_pct: number };
 * }}
 */
export function resolveAiImpactBuckets(tasksInput, getAiLevelByMode) {
  const tasks = Array.isArray(tasksInput) ? tasksInput.map((t) => ({ ...t })) : [];
  const impactLevelOf = (t) => getAiLevelByMode(t);
  let highImpact = tasks.filter((t) => impactLevelOf(t) === "high");
  let midImpact = tasks.filter((t) => impactLevelOf(t) === "medium");
  let lowImpact = tasks.filter((t) => impactLevelOf(t) === "low");
  if (highImpact.length === 0 && midImpact.length === 0 && tasks.length > 0) {
    const sorted = [...tasks].sort((a, b) => (Number(b.weight_norm) || 0) - (Number(a.weight_norm) || 0));
    const n = sorted.length;
    const nHigh = Math.max(1, Math.floor(n / 3));
    const nMid = Math.max(1, Math.floor((n - nHigh) / 2));
    sorted.forEach((t, i) => {
      t._derived_level = i < nHigh ? "high" : i < nHigh + nMid ? "medium" : "low";
    });
    highImpact = sorted.filter((t) => t._derived_level === "high");
    midImpact = sorted.filter((t) => t._derived_level === "medium");
    lowImpact = sorted.filter((t) => t._derived_level === "low");
  }
  const wHigh = highImpact.reduce((s, t) => s + (Number(t.weight_norm) || 0), 0);
  const wMid = midImpact.reduce((s, t) => s + (Number(t.weight_norm) || 0), 0);
  const wLow = lowImpact.reduce((s, t) => s + (Number(t.weight_norm) || 0), 0);
  const tot = wHigh + wMid + wLow || 1;
  const autoPct = Math.round((wHigh / tot) * 100);
  const collabPct = Math.round((wMid / tot) * 100);
  const humanPct = Math.max(0, 100 - autoPct - collabPct);
  return {
    highImpact,
    midImpact,
    lowImpact,
    displayComposition: {
      automation_pct: autoPct,
      collaboration_pct: collabPct,
      human_pct: humanPct,
    },
  };
}
