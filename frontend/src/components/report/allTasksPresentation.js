export const ALL_TASKS_PAGE_SIZE = 5;

export const ALL_TASKS_SORT_KEYS = Object.freeze({
  DEFAULT: "default",
  IMPORTANCE: "importance_score",
  FREQUENCY: "frequency_score",
  JOB_SHARE: "job_share",
});

export function numericTaskMetric(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function canonicalTaskMetrics(task) {
  const metrics = task?.metrics && typeof task.metrics === "object" ? task.metrics : null;
  if (!metrics) {
    return {
      ratings_available: false,
      importance_score: null,
      frequency_score: null,
      job_share: null,
    };
  }
  return {
    ratings_available: metrics.ratings_available === true,
    importance_score: metrics.importance_score,
    frequency_score: metrics.frequency_score,
    job_share: metrics.job_share,
  };
}

/**
 * @deprecated Legacy 3-axis role_analysis — not used by Task Analysis V2 production path.
 */
export function canonicalTaskRoleAnalysis(task) {
  const role = task?.role_analysis && typeof task.role_analysis === "object" ? task.role_analysis : {};
  return {
    automation_suitability: role.automation_suitability ?? null,
    ai_augmentation_suitability: role.ai_augmentation_suitability ?? null,
    human_judgment_requirement: role.human_judgment_requirement ?? null,
    presentation_classification: role.presentation_classification ?? null,
    presentation_label_ko: role.presentation_label_ko ?? null,
    presentation_label_en: role.presentation_label_en ?? null,
  };
}

/**
 * V2 Task Analysis filter/sort — 2-axis only (ai_augmentation | human_judgment).
 * Filter "H" matches canonical label H (never HIGH mutation).
 */
export function filterSortTasksV2(tasks, filter = "ALL", sortKey = ALL_TASKS_SORT_KEYS.DEFAULT) {
  const indexed = (Array.isArray(tasks) ? tasks : []).map((task, originalIndex) => ({
    task,
    originalIndex,
  }));
  const filtered = indexed.filter(({ task }) => {
    if (filter === "ALL") return true;
    if (filter === "ai_augmentation") {
      return String(task.ai_augmentation || "").toUpperCase() === "H";
    }
    if (filter === "human_judgment") {
      return String(task.human_judgment || "").toUpperCase() === "H";
    }
    // Reject legacy automation / HIGH-axis filters on V2 path
    return false;
  });
  if (sortKey === ALL_TASKS_SORT_KEYS.DEFAULT) return filtered.map(({ task }) => task);
  return [...filtered]
    .sort((a, b) => {
      const aMetrics = canonicalTaskMetrics(a.task);
      const bMetrics = canonicalTaskMetrics(b.task);
      const aValue = aMetrics.ratings_available
        ? numericTaskMetric(aMetrics[sortKey])
        : null;
      const bValue = bMetrics.ratings_available
        ? numericTaskMetric(bMetrics[sortKey])
        : null;
      if (aValue == null && bValue == null) return a.originalIndex - b.originalIndex;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      return bValue - aValue || a.originalIndex - b.originalIndex;
    })
    .map(({ task }) => task);
}

/** @deprecated Prefer filterSortTasksV2 for Task Analysis production. */
export function filterSortTasks(tasks, filter = "ALL", sortKey = ALL_TASKS_SORT_KEYS.DEFAULT) {
  return filterSortTasksV2(tasks, filter, sortKey);
}
