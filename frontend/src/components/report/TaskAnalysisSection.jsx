import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveApiBase } from "../../apiBase.js";
import {
  REVIEW_CONTRACT_PRODUCTION_CANDIDATE,
  REVIEW_SOCS,
  isProductionCandidateReviewParam,
  productionCandidateReviewUrl,
} from "../../reviewContract.js";
import { DATA_CONTRACT_TASK_ROLE_FINAL, isTaskRoleFinalDataContract } from "../../dataContract.js";
import {
  ALL_TASKS_PAGE_SIZE,
  ALL_TASKS_SORT_KEYS,
  canonicalTaskMetrics,
  filterSortTasksV2,
  numericTaskMetric,
} from "./allTasksPresentation.js";
import {
  adaptTaskAnalysisV2,
  assertTaskAnalysisV2ConsumerSafe,
  extractTaskAnalysisV2,
  presentV2Label,
} from "./taskAnalysisV2Adapter.js";
import "./task-analysis-section.css";

export { ALL_TASKS_PAGE_SIZE, ALL_TASKS_SORT_KEYS, filterSortTasksV2 as filterSortTasks, numericTaskMetric };

/** Presentation only — does not recompute API metrics. */
export function formatImportanceScore(value) {
  const numeric = numericTaskMetric(value);
  return numeric == null ? "—" : String(Math.round(numeric));
}

export function formatFrequencyScore(value) {
  const numeric = numericTaskMetric(value);
  return numeric == null ? "—" : String(Math.round(numeric));
}

/** job_share is a 0–1 fraction; display as whole-number percent (e.g. 0.0554 → 6%). */
export function formatJobShare(value) {
  const numeric = numericTaskMetric(value);
  return numeric == null ? "—" : `${Math.round(numeric * 100)}%`;
}

export function readTaskMetrics(task) {
  return canonicalTaskMetrics(task);
}

/**
 * Fetch V2 Task Analysis only. Legacy task_analysis fallback is forbidden.
 */
export function useTaskAnalysis(socCode, lang = "ko", reviewContract = null, dataContract = null) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = String(socCode || "").trim();
    if (!code) {
      setData(null);
      setError(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const base = resolveApiBase();
    const params = new URLSearchParams();
    params.set("lang", lang === "en" ? "en" : "ko");
    if (isTaskRoleFinalDataContract(dataContract)) {
      params.set("data_contract", DATA_CONTRACT_TASK_ROLE_FINAL);
    } else if (reviewContract) {
      params.set("review_contract", reviewContract);
    }
    const url = `${base}/jobs/${encodeURIComponent(code)}/task-analysis-v2?${params.toString()}`;
    setLoading(true);
    setError(null);
    fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const raw = extractTaskAnalysisV2(json);
        if (!raw) throw new Error("task_analysis_v2 missing from response");
        const adapted = adaptTaskAnalysisV2(raw, {
          lang,
          scenarioLinkagesV2: json?.scenario_linkages_v2 ?? null,
        });
        assertTaskAnalysisV2ConsumerSafe(adapted);
        setData(adapted);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [socCode, lang, reviewContract, dataContract]);

  return { data, error, loading };
}

/**
 * Production Task Analysis — V2 canonical 2-axis (AI_AUGMENTATION + HUMAN_JUDGMENT).
 * AUTOMATION axis / legacy task_analysis are out of scope for this path.
 */
export default function TaskAnalysisSection({
  socCode,
  lang = "ko",
  onBack = null,
  focusTaskIds = null,
  occupationTitle = "",
  taskCountHint = null,
  reviewContract = null,
}) {
  const isKo = lang !== "en";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rcFromUrl = searchParams.get("review_contract");
  const dcFromUrl = searchParams.get("data_contract");
  const activeReviewContract =
    reviewContract ||
    (isProductionCandidateReviewParam(rcFromUrl) ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE : null);
  const candidateReview = isProductionCandidateReviewParam(activeReviewContract);
  const finalDataContract = isTaskRoleFinalDataContract(dcFromUrl)
    ? DATA_CONTRACT_TASK_ROLE_FINAL
    : null;
  const { data, error, loading } = useTaskAnalysis(
    socCode,
    lang,
    finalDataContract ? null : activeReviewContract,
    finalDataContract,
  );

  const [filter, setFilter] = useState("ALL");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortKey, setSortKey] = useState(ALL_TASKS_SORT_KEYS.DEFAULT);
  const [page, setPage] = useState(1);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const titleRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    titleRef.current?.focus?.();
  }, []);

  const summary = useMemo(() => {
    const s = data?.summary || {};
    const axes = data?.v2_axes || {};
    const hint =
      typeof taskCountHint === "number" && Number.isFinite(taskCountHint) && taskCountHint > 0
        ? taskCountHint
        : null;
    return {
      total: s.total_tasks ?? data?.tasks?.length ?? hint ?? 0,
      rated: s.rated_tasks ?? 0,
      unrated: s.unrated_tasks ?? 0,
      aiH: axes.ai_augmentation?.counts?.H ?? 0,
      humanH: axes.human_judgment?.counts?.H ?? 0,
      priority: s.review_priority_count ?? 0,
    };
  }, [data, taskCountHint]);

  const displayTitle =
    String(occupationTitle || data?.occupation_title_ko || data?.occupation_title || "").trim() ||
    (isKo ? "이" : "this");

  const focusSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(focusTaskIds)) {
      for (const id of focusTaskIds) {
        const s = String(id || "").trim();
        if (s) set.add(s);
      }
    }
    return set;
  }, [focusTaskIds]);

  useEffect(() => {
    if (!focusSet.size || loading) return;
    const first = [...focusSet][0];
    if (!first) return;
    window.setTimeout(() => {
      document
        .querySelector(`[data-evidence-task-id="${CSS.escape(first)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }, [focusSet, loading, data]);

  const canonicalTasks = useMemo(
    () => (Array.isArray(data?.tasks) ? data.tasks : []),
    [data],
  );

  const axisFilterCounts = useMemo(() => {
    const counts = { ai_augmentation: 0, human_judgment: 0 };
    for (const task of canonicalTasks) {
      if (String(task.ai_augmentation || "").toUpperCase() === "H") counts.ai_augmentation += 1;
      if (String(task.human_judgment || "").toUpperCase() === "H") counts.human_judgment += 1;
    }
    return counts;
  }, [canonicalTasks]);

  const filteredTasks = useMemo(() => {
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const priorityFiltered =
      priorityOnly && candidateReview ? tasks.filter((task) => task.review_priority) : tasks;
    return filterSortTasksV2(priorityFiltered, filter, sortKey);
  }, [data, filter, sortKey, priorityOnly, candidateReview]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ALL_TASKS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTasks = useMemo(() => {
    const start = (currentPage - 1) * ALL_TASKS_PAGE_SIZE;
    return filteredTasks.slice(start, start + ALL_TASKS_PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [socCode]);

  useEffect(() => {
    if (!focusSet.size || !filteredTasks.length) return;
    const focusedIndex = filteredTasks.findIndex((task) =>
      focusSet.has(String(task.task_id || "").trim()),
    );
    if (focusedIndex >= 0) setPage(Math.floor(focusedIndex / ALL_TASKS_PAGE_SIZE) + 1);
  }, [focusSet, filteredTasks]);

  const filterItems = [
    ["ALL", isKo ? `전체 (${summary.total})` : `All (${summary.total})`],
    [
      "ai_augmentation",
      `${isKo ? "AI 도움 높음" : "High AI help"} (${axisFilterCounts.ai_augmentation})`,
    ],
    [
      "human_judgment",
      `${isKo ? "사람 판단 높음" : "High human judgment"} (${axisFilterCounts.human_judgment})`,
    ],
  ];

  const totalLabel = summary.total || "—";
  const colCount = 3;
  const axes = data?.v2_axes || null;

  const onSocChange = (nextSoc) => {
    const c = String(nextSoc || "").trim();
    if (!c || c === socCode) return;
    navigate(productionCandidateReviewUrl(c, { tab: "analysis", view: "all-tasks" }));
  };

  const formatAxisShare = (slot) => {
    if (!slot?.available) return "—";
    return `${slot.pct}%`;
  };

  return (
    <section
      className="fc-task-analysis"
      id="taskAnalysis"
      data-task-analysis-source="jobs-task-analysis-v2"
      data-shell-view="all-tasks"
      data-review-contract={candidateReview ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE : undefined}
      data-task-role-v2="1"
      data-data-contract={finalDataContract || undefined}
      aria-labelledby={titleId}
    >
      {typeof onBack === "function" ? (
        <button type="button" className="fc-task-analysis__back" onClick={onBack}>
          {isKo ? "← 리포트로 돌아가기" : "← Back to report"}
        </button>
      ) : null}

      {candidateReview ? (
        <div className="fc-review-bar" aria-label={isKo ? "최종 검토 도구" : "Acceptance review tools"}>
          <span className="fc-review-badge">{isKo ? "최종 검토용 데이터" : "Production Candidate Review"}</span>
          <label className="fc-review-soc">
            <span className="fc-review-soc__label">{isKo ? "검토 직무" : "Occupation"}</span>
            <select
              className="fc-review-soc__select"
              value={String(socCode || "")}
              onChange={(e) => onSocChange(e.target.value)}
            >
              {REVIEW_SOCS.map((item) => (
                <option key={item.soc} value={item.soc}>
                  {isKo ? item.titleKo : item.titleEn}
                </option>
              ))}
            </select>
          </label>
          <div className="fc-review-priority-filters" role="group" aria-label={isKo ? "검토 범위" : "Review scope"}>
            <button
              type="button"
              className={`fc-filter${!priorityOnly ? " is-active" : ""}`}
              onClick={() => {
                setPriorityOnly(false);
                setPage(1);
              }}
            >
              {isKo ? "전체" : "All"}
            </button>
            <button
              type="button"
              className={`fc-filter${priorityOnly ? " is-active" : ""}`}
              onClick={() => {
                setPriorityOnly(true);
                setPage(1);
              }}
            >
              {isKo ? `검토 우선 업무 (${summary.priority})` : `Priority review (${summary.priority})`}
            </button>
          </div>
          {axes ? (
            <p className="fc-review-profile" aria-label={isKo ? "직무 프로필" : "Occupation profile"}>
              {isKo ? "H 비중" : "H share"} · {isKo ? "AI 도움" : "AI help"}{" "}
              {formatAxisShare(axes.ai_augmentation?.H)} · {isKo ? "사람 판단" : "Human judgment"}{" "}
              {formatAxisShare(axes.human_judgment?.H)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="fc-section-head fc-section-head--reference">
        <div className="fc-intro-grid">
          <div className="fc-intro-grid__copy">
            <h2 id={titleId} ref={titleRef} className="fc-title" tabIndex={-1}>
              {isKo ? `전체 업무 ${totalLabel}개 분석` : `All ${totalLabel} tasks analysis`}
            </h2>
            <div className={`fc-desc${isKo ? " fc-desc--inline" : ""}`}>
              {isKo ? (
                <>
                  <p>한국 직업정보(Work24) 수행직무 {totalLabel}개를 분석했습니다.</p>
                  <p>각 업무의 AI 도움·사람 판단 특성을 함께 확인할 수 있습니다.</p>
                </>
              ) : (
                <>
                  <p>Work24 lists the job tasks that make up each occupation.</p>
                  <p>
                    {displayTitle} has {totalLabel} registered tasks, and this report analyzes the full
                    set—not only a few representative ones.
                  </p>
                  <p>Task-level AI role information follows AI-CAREER V2 analysis criteria.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fc-toolbar">
        <div className="fc-filters" aria-label={isKo ? "업무 역할 특성 필터" : "Task role filters"}>
          {filterItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`fc-filter${filter === key ? " is-active" : ""}`}
              data-filter={key}
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="fc-toolbar__right">
          <button
            type="button"
            className="fc-criteria-btn"
            aria-expanded={criteriaOpen}
            aria-controls={`${titleId}-criteria`}
            onClick={() => setCriteriaOpen((open) => !open)}
          >
            {isKo ? `표시 기준 안내 ${criteriaOpen ? "−" : "+"}` : `Display guide ${criteriaOpen ? "−" : "+"}`}
          </button>
        </div>
      </div>

      <section
        id={`${titleId}-criteria`}
        className={`fc-criteria${criteriaOpen ? " is-open" : ""}`}
        hidden={!criteriaOpen}
      >
        {[
          [
            isKo ? "AI가 도울 수 있는 정도" : "How much AI can help",
            isKo
              ? "분석·비교·정리·탐색·초안 작성 등에서 AI가 실질적으로 도움을 줄 수 있는 정도입니다. (H/M/L)"
              : "How much AI can materially help with analysis, comparison, organization, search, or drafting. (H/M/L)",
          ],
          [
            isKo ? "사람 판단 중요도" : "Human judgment importance",
            isKo
              ? "예외 해석과 전문 판단, 책임 있는 최종 결정이 얼마나 중요한지 보여줍니다. (H/M/L)"
              : "How important interpretation, professional judgment, and accountable final decisions are. (H/M/L)",
          ],
          [
            isKo ? "판정 보류" : "Pending adjudication",
            isKo
              ? "원문만으로 H/M/L을 확정하기 어려운 업무입니다."
              : "Source text alone is insufficient to fix H/M/L.",
          ],
        ].map(([heading, body]) => (
          <div key={heading}>
            <strong>{heading}</strong>
            <span>{body}</span>
          </div>
        ))}
      </section>

      <div className="fc-table-wrap">
        <table
          className="fc-flat-table fc-flat-table--axes-only"
          aria-label={isKo ? "전체 업무 분석 표" : "All tasks analysis table"}
        >
          <colgroup>
            <col className="col-task" />
            <col className="col-role" />
            <col className="col-role" />
          </colgroup>
          <thead>
            <tr className="fc-thead-group">
              <th rowSpan={2} scope="col" className="fc-th-task">
                {isKo ? "업무" : "Task"}
              </th>
              <th colSpan={2} scope="colgroup" className="fc-th-group fc-th-group--ai">
                {isKo ? "업무 역할 특성" : "Task role characteristics"}
              </th>
            </tr>
            <tr className="fc-thead-cols">
              <th scope="col" className="fc-th-sub fc-th-axis">
                {isKo ? "AI가 도울 수 있는 정도" : "How much AI can help"}
              </th>
              <th scope="col" className="fc-th-sub fc-th-axis">
                {isKo ? "사람 판단 중요도" : "Human judgment importance"}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="fc-loading">
                  {isKo ? "업무 데이터를 불러오는 중입니다." : "Loading task analysis…"}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={colCount} className="fc-error">
                  {isKo
                    ? "Task Analysis API를 불러오지 못했습니다."
                    : "Could not load Task Analysis API."}
                </td>
              </tr>
            ) : !filteredTasks.length ? (
              <tr>
                <td colSpan={colCount} className="fc-empty">
                  {isKo ? "표시할 업무가 없습니다." : "No tasks to show."}
                </td>
              </tr>
            ) : (
              visibleTasks.map((task) => {
                const tid = String(task.task_id || "").trim();
                const aiCode = String(task.ai_augmentation || "").trim();
                const humanCode = String(task.human_judgment || "").trim();
                const ai = task.presentation?.ai || presentV2Label(aiCode, isKo);
                const human = task.presentation?.human || presentV2Label(humanCode, isKo);
                const focused = tid && focusSet.has(tid);
                const primary =
                  String(task.analysis_text || task.task_text || task.task_text_ko || "").trim() ||
                  (isKo ? "업무 설명을 표시할 수 없습니다." : "Task description is unavailable.");
                const axisHint = (pres) => {
                  if (pres?.pending) return pres.hint || "";
                  return "";
                };
                return (
                  <tr
                    key={tid || primary}
                    className={`fc-main-row${focused ? " is-evidence-focus" : ""}${
                      task.review_priority ? " is-review-priority" : ""
                    }`}
                    id={tid ? `evidence-task-${tid}` : undefined}
                    data-evidence-task-id={tid || undefined}
                    data-review-priority={task.review_priority ? "true" : "false"}
                    data-ai={aiCode || undefined}
                    data-human={humanCode || undefined}
                  >
                    <td className="fc-td-task">
                      <div className="fc-task-copy">
                        <div className="fc-task-ko">{primary}</div>
                      </div>
                    </td>
                    {[
                      ["ai_augmentation", ai, aiCode],
                      ["human_judgment", human, humanCode],
                    ].map(([axis, level, code]) => (
                      <td
                        key={axis}
                        className="fc-td-axis"
                        data-evidence-axis={axis}
                        data-axis-level={code || undefined}
                        data-canonical-label={code || undefined}
                      >
                        <p className="fc-role-level">
                          <span className={`fc-level fc-level--${level.cls}`}>{level.label}</span>
                        </p>
                        {axisHint(level) ? (
                          <p className="fc-role-reason">{axisHint(level)}</p>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="fc-pagination-footer">
        <nav className="fc-pagination" aria-label={isKo ? "업무 페이지" : "Task pages"}>
          <button
            type="button"
            className="fc-page-btn"
            disabled={currentPage === 1}
            aria-label={isKo ? "이전 페이지" : "Previous page"}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`fc-page-btn${pageNumber === currentPage ? " is-current" : ""}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
              aria-label={isKo ? `${pageNumber}페이지` : `Page ${pageNumber}`}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="fc-page-btn"
            disabled={currentPage === totalPages}
            aria-label={isKo ? "다음 페이지" : "Next page"}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            ›
          </button>
        </nav>
      </div>
    </section>
  );
}
