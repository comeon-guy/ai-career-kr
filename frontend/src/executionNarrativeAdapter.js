/** Execution-narrative v1 overlay. Lookup by soc + scenario_id only — no SOC hardcoding. */

import payload from "./data/aiWorkingExecutionNarrative_pilot_v1.json" with { type: "json" };

export const EXECUTION_NARRATIVE_CONTRACT = "ai-working-execution-narrative-v1";

export function getExecutionNarrative(soc, scenarioId) {
  const socRow = payload?.socs?.[String(soc || "").trim()];
  const narrative = socRow?.anchor_narrative;
  if (!narrative || typeof narrative !== "object") return null;
  const sid = String(scenarioId || "").trim();
  if (sid && String(narrative.scenario_id || "").trim() !== sid) return null;
  return narrative;
}

export function resolveExecutionNarrative({ soc, scenarioId, scenario } = {}) {
  const attached = scenario?.execution_narrative_v1;
  const sid = String(scenarioId || scenario?.scenario_id || "").trim();
  if (attached && typeof attached === "object") {
    if (!sid || String(attached.scenario_id || "").trim() === sid) return attached;
  }
  return getExecutionNarrative(soc, sid);
}

export function enrichScenariosWithExecutionNarrative(scenarios, soc) {
  const list = Array.isArray(scenarios) ? scenarios : [];
  return list.map((sc) => {
    if (!sc || typeof sc !== "object") return sc;
    const narrative = getExecutionNarrative(soc, sc.scenario_id);
    if (!narrative) return sc;
    return { ...sc, execution_narrative_v1: narrative };
  });
}
