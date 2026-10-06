/**
 * Task Analysis V2 adapter — presentation only.
 * Canonical labels stay H|M|L|PARTIAL (never rewritten to HIGH/MEDIUM/LOW in data).
 * Fail-closed: no legacy task_analysis fallback, no AUTOMATION.
 */

export const V2_TASK_ANALYSIS_CONTRACT = "KR_TASK_2AXIS_RUNTIME_PROJECTION_V1";
export const V2_CANONICAL_LABELS = Object.freeze(["H", "M", "L", "PARTIAL"]);

const FORBIDDEN_KEYS = Object.freeze([
  "automation_suitability",
  "AUTOMATION_HIGH_SHARE",
  "automation_high_share",
  "AI_AUGMENTATION_HIGH_SHARE",
  "HUMAN_JUDGMENT_HIGH_SHARE",
  "ai_augmentation_suitability",
  "human_judgment_requirement",
  "axis_snapshot",
]);

/**
 * @param {string} code H|M|L|PARTIAL
 * @param {boolean} isKo
 */
export function presentV2Label(code, isKo = true) {
  const c = String(code || "").trim().toUpperCase();
  if (c === "H") return { code: "H", label: isKo ? "높음" : "High", cls: "high", pending: false };
  if (c === "M") return { code: "M", label: isKo ? "보통" : "Medium", cls: "medium", pending: false };
  if (c === "L") return { code: "L", label: isKo ? "낮음" : "Low", cls: "low", pending: false };
  if (c === "PARTIAL") {
    return {
      code: "PARTIAL",
      label: isKo ? "판정 보류" : "Pending adjudication",
      cls: "pending",
      pending: true,
      hint: isKo
        ? "원문만으로 H/M/L을 확정하기 어려운 업무"
        : "Source text alone is insufficient to fix H/M/L",
    };
  }
  return { code: c || "—", label: "—", cls: "low", pending: false };
}

function assertNoForbiddenKeys(obj, path = "root") {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => assertNoForbiddenKeys(item, `${path}[${i}]`));
    return;
  }
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.includes(key) || key === "automation" || key === "AUTOMATION") {
      throw new Error(`V2 Task Analysis forbids key ${key} at ${path}`);
    }
    assertNoForbiddenKeys(obj[key], `${path}.${key}`);
  }
}

function shareOrUnavailable(value) {
  if (value == null || value === "") return { available: false, share: null, pct: null };
  const n = Number(value);
  if (!Number.isFinite(n)) return { available: false, share: null, pct: null };
  return { available: true, share: n, pct: Math.round(n * 100) };
}

/**
 * Unwrap vite `/task-analysis-v2` payload or raw task_analysis_v2 object.
 * @param {unknown} json
 */
export function extractTaskAnalysisV2(json) {
  if (!json || typeof json !== "object") return null;
  if (json.task_analysis_v2 && typeof json.task_analysis_v2 === "object") {
    return json.task_analysis_v2;
  }
  if (json.contract_version && Array.isArray(json.tasks) && json.aggregation) {
    return json;
  }
  return null;
}

/**
 * Adapt canonical task_analysis_v2 → Task Analysis UI model.
 * @param {object} taV2
 * @param {{ lang?: string, scenarioLinkagesV2?: unknown }} [opts]
 */
export function adaptTaskAnalysisV2(taV2, opts = {}) {
  const isKo = opts.lang !== "en";
  if (!taV2 || typeof taV2 !== "object") {
    throw new Error("task_analysis_v2 missing");
  }
  assertNoForbiddenKeys(taV2, "task_analysis_v2");

  const tasksIn = Array.isArray(taV2.tasks) ? taV2.tasks : [];
  if (!tasksIn.length) throw new Error("task_analysis_v2.tasks empty");

  const tasks = tasksIn.map((t) => {
    const tid = String(t.task_id || "").trim();
    if (!tid) throw new Error("V2 Task missing task_id");
    const ai = String(t.ai_augmentation || "").trim();
    const human = String(t.human_judgment || "").trim();
    if (!V2_CANONICAL_LABELS.includes(ai) || !V2_CANONICAL_LABELS.includes(human)) {
      throw new Error(`invalid V2 label for ${tid}`);
    }
    // Forbidden: coerce PARTIAL or invent LONG labels on the record.
    const text = String(t.analysis_text || "").trim();
    return {
      task_id: tid,
      analysis_text: text,
      task_text: text,
      task_text_ko: text,
      task_text_en: "",
      role_context: t.role_context ?? null,
      ai_augmentation: ai,
      human_judgment: human,
      // lineage only — not rendered as user-facing code
      review_flag: t.review_flag ?? null,
      metrics: {
        ratings_available: false,
        importance_score: null,
        frequency_score: null,
        job_share: null,
      },
      presentation: {
        ai: presentV2Label(ai, isKo),
        human: presentV2Label(human, isKo),
      },
    };
  });

  const agg = taV2.aggregation || {};
  const aiAgg = agg.ai_augmentation || {};
  const huAgg = agg.human_judgment || {};
  const aiResolved = Number(aiAgg.resolved_task_count);
  const huResolved = Number(huAgg.resolved_task_count);

  const v2_axes = {
    ai_augmentation: {
      H: shareOrUnavailable(aiResolved > 0 ? aiAgg.H_share_resolved : null),
      M: shareOrUnavailable(aiResolved > 0 ? aiAgg.M_share_resolved : null),
      L: shareOrUnavailable(aiResolved > 0 ? aiAgg.L_share_resolved : null),
      partial: shareOrUnavailable(aiAgg.partial_share_total),
      resolved_task_count: Number.isFinite(aiResolved) ? aiResolved : 0,
      resolved_available: aiResolved > 0,
      counts: {
        H: Number(aiAgg.H_count) || 0,
        M: Number(aiAgg.M_count) || 0,
        L: Number(aiAgg.L_count) || 0,
        PARTIAL: Number(aiAgg.partial_count) || 0,
      },
    },
    human_judgment: {
      H: shareOrUnavailable(huResolved > 0 ? huAgg.H_share_resolved : null),
      M: shareOrUnavailable(huResolved > 0 ? huAgg.M_share_resolved : null),
      L: shareOrUnavailable(huResolved > 0 ? huAgg.L_share_resolved : null),
      partial: shareOrUnavailable(huAgg.partial_share_total),
      resolved_task_count: Number.isFinite(huResolved) ? huResolved : 0,
      resolved_available: huResolved > 0,
      counts: {
        H: Number(huAgg.H_count) || 0,
        M: Number(huAgg.M_count) || 0,
        L: Number(huAgg.L_count) || 0,
        PARTIAL: Number(huAgg.partial_count) || 0,
      },
    },
  };

  return {
    source: "task_analysis_v2",
    contract_version: taV2.contract_version || V2_TASK_ANALYSIS_CONTRACT,
    jobCd: taV2.jobCd,
    occupation_id: taV2.jobCd,
    soc_code: taV2.jobCd,
    total_task_count: Number(taV2.total_task_count) || tasks.length,
    tasks,
    aggregation: {
      ai_augmentation: { ...aiAgg },
      human_judgment: { ...huAgg },
    },
    v2_axes,
    summary: {
      total_tasks: Number(taV2.total_task_count) || tasks.length,
      rated_tasks: 0,
      unrated_tasks: Number(taV2.total_task_count) || tasks.length,
    },
    provenance: taV2.provenance || null,
    scenario_linkages_v2: opts.scenarioLinkagesV2 || null,
    task_role_v2: true,
    methodology: {
      exclusive_task_type_mapping: false,
      source: "V2_CANONICAL",
      axes: ["ai_augmentation", "human_judgment"],
    },
    // Explicit: no legacy occupation_profile HIGH shares
    occupation_profile: null,
  };
}

/**
 * Position Map / interpretation: X/Y = H_share_resolved (unavailable if resolved=0).
 */
export function readV2PositionShares(adapted) {
  const ai = adapted?.v2_axes?.ai_augmentation?.H;
  const human = adapted?.v2_axes?.human_judgment?.H;
  return {
    ai: ai?.available ? ai.pct : null,
    human: human?.available ? human.pct : null,
    aiUnavailable: !ai?.available,
    humanUnavailable: !human?.available,
    auto: null,
  };
}

/**
 * Independent 2-axis composition for existing shell (no combined AI+HUMAN score).
 */
export function selectV2IndependentComposition(adapted, { lang = "ko" } = {}) {
  const isKo = lang !== "en";
  const total = adapted?.summary?.total_tasks || adapted?.tasks?.length || 0;
  const axes = adapted?.v2_axes || {};
  const categories = [];

  const pushAxis = (axisKey, labelKo, labelEn, tone) => {
    const axis = axes[axisKey];
    if (!axis) return;
    const h = axis.H;
    categories.push({
      key: `${axisKey}_H`,
      axis: axisKey,
      label: isKo ? `${labelKo} (H)` : `${labelEn} (H)`,
      fullLabel: isKo ? labelKo : labelEn,
      count: h?.available ? h.pct : null,
      percentage: h?.available ? h.pct : null,
      unavailable: !h?.available,
      tone,
      independent: true,
    });
    const p = axis.partial;
    if (p?.available && p.share > 0) {
      categories.push({
        key: `${axisKey}_PARTIAL`,
        axis: axisKey,
        label: isKo ? `${labelKo} (판정 보류)` : `${labelEn} (pending)`,
        fullLabel: isKo ? "판정 보류" : "Pending adjudication",
        count: p.pct,
        percentage: p.pct,
        unavailable: false,
        tone: "pending",
        independent: true,
        partial: true,
      });
    }
  };

  pushAxis("ai_augmentation", "AI가 크게 도울 수 있는 업무", "Work AI can help a lot with", "ai");
  pushAxis("human_judgment", "사람 판단이 중요한 업무", "Judgment-critical work", "human");

  return {
    mode: "independent",
    contract: "independent_v2",
    total,
    categories,
    hasShares: categories.some((c) => c.percentage != null && c.percentage > 0),
    exclusive_mapping_used: false,
    role_counts_used: false,
    automation_used: false,
    meaning: "V2 H_share_resolved per axis (+ PARTIAL share_total); not normalized to 100",
  };
}

/** Scan adapted payload keys for forbidden AUTOMATION / legacy Task Analysis fields. */
export function assertTaskAnalysisV2ConsumerSafe(adapted) {
  assertNoForbiddenKeys(adapted, "adapted");
  if (adapted?.source !== "task_analysis_v2") {
    throw new Error("Task Analysis source must be task_analysis_v2");
  }
  if (adapted?.occupation_profile) {
    throw new Error("legacy occupation_profile must not appear on V2 adapted payload");
  }
}
