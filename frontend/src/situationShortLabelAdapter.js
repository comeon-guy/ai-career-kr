/** Short selector labels for 7-SOC representative work situations. Presentation only. */

export const SITUATION_SHORT_LABEL_CONTRACT = "situation-short-label-v2-problem";

/**
 * title = full title (preserved from artifact).
 * title_short = selector row 1 (quick ID / 업무명).
 * title_subtitle = selector row 2 = core problem / judgment (short).
 * core_problem_detail = scenario header problem (same meaning, slightly fuller).
 * Keys: soc -> scenario_id -> pack
 */
/** Contamination guard — empty. Blocks US Scenario content entry (not a content fallback). */
export const SITUATION_SHORT_LABELS_7SOC = Object.freeze({});


export function getSituationShortLabelPack(soc, scenarioId, lang = "ko") {
  const row = SITUATION_SHORT_LABELS_7SOC[String(soc || "").trim()]?.[String(scenarioId || "").trim()];
  if (!row) return null;
  const useEn = lang === "en";
  const coreProblemShort = useEn
    ? row.title_subtitle_en || row.title_subtitle
    : row.title_subtitle;
  return {
    title_short: useEn ? row.title_short_en : row.title_short,
    core_problem_short: coreProblemShort,
    title_subtitle: coreProblemShort,
    title_full: row.title_full,
    core_problem_detail: useEn
      ? row.core_problem_detail_en || row.core_problem_detail || row.title_subtitle_en || row.title_subtitle
      : row.core_problem_detail || row.title_subtitle,
  };
}

/** Add title_short / core_problem_short / core_problem_detail. Preserves title as full title. */
export function enrichSituationShortLabels(scenarios, soc, lang = "ko") {
  const list = Array.isArray(scenarios) ? scenarios : [];
  return list.map((sc) => {
    if (!sc || typeof sc !== "object") return sc;
    const sid = String(sc.scenario_id || "").trim();
    const pack = getSituationShortLabelPack(soc, sid, lang);
    if (!pack) return sc;
    const out = { ...sc };
    if (!out.title && pack.title_full) out.title = pack.title_full;
    if (!out.title_full && out.title) out.title_full = out.title;
    // Pack is empty in KR (contamination guard). Never invent US short labels.
    if (pack.title_short) out.title_short = pack.title_short;
    if (pack.core_problem_short) out.core_problem_short = pack.core_problem_short;
    if (pack.title_subtitle) out.title_subtitle = pack.title_subtitle;
    if (pack.core_problem_detail) out.core_problem_detail = pack.core_problem_detail;
    return out;
  });
}
