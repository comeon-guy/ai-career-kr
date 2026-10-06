/** Canonical AI Working presentation overlay for all production-final SOCs. */

import payload from "./data/aiWorkingV3_7soc.json" with { type: "json" };
import { canonicalAiWorkingProblemFields } from "./canonicalPresentationContract.js";

export const AI_WORKING_V3_CONTRACT = "ai-working-v3";

export function getAiWorkingV3(soc, scenarioId) {
  const socRow = payload?.socs?.[String(soc || "").trim()];
  if (!socRow) return null;
  return socRow.scenarios?.[String(scenarioId || "").trim()] || null;
}

export function enrichScenariosWithAiWorkingV3(scenarios, soc) {
  const list = Array.isArray(scenarios) ? scenarios : [];
  return list.map((sc) => {
    if (!sc || typeof sc !== "object") return sc;
    const v3 = getAiWorkingV3(soc, sc.scenario_id);
    // The canonical static payload wins over stale report-embedded copies.
    if (!v3) return sc;
    const problemFields = canonicalAiWorkingProblemFields(sc, v3);
    return {
      ...sc,
      ...problemFields,
      ai_working_v3: { ...v3, ...problemFields },
    };
  });
}
