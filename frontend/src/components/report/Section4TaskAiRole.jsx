import { Fragment, useEffect, useId, useMemo, useState } from "react";
import "./section4-task-ai-role.css";
import { textToScanBullets } from "./section4CardScanFields.js";
import { applyCanonicalSection4Labels } from "./section4CanonicalUi.js";

/**
 * @param {{ id?: string; default?: boolean }[]} filters
 */
function defaultFilterId(filters) {
  if (!Array.isArray(filters) || !filters.length) return "all";
  const d = filters.find((f) => f && f.default === true && typeof f.id === "string");
  if (d) return d.id;
  const all = filters.find((f) => f && f.id === "all");
  if (all) return "all";
  const first = filters.find((f) => f && typeof f.id === "string");
  return first ? first.id : "all";
}

/**
 * @param {unknown} m
 * @param {number} [weightPercent]
 */
function coerceSection4Metrics(m, weightPercent) {
  if (!m || typeof m !== "object") return null;
  let imp = Number(m.importance);
  if (!Number.isFinite(imp)) {
    const s = String(m.importance || "");
    if (/상위|높|high/i.test(s)) imp = 88;
    else if (/중|보통|medium/i.test(s)) imp = 68;
    else if (/낮|low/i.test(s)) imp = 48;
    else imp = Math.round(Number(weightPercent) || 0) || 72;
  }
  let freq = m.frequency_display;
  if (freq == null || freq === "") freq = 0;
  const wt = Number(m.weight_percent);
  const weight_percent = Number.isFinite(wt) ? Math.min(100, Math.max(0, wt)) : 0;
  return {
    importance: Math.min(100, Math.max(0, Math.round(imp))),
    frequency_display: typeof freq === "number" ? Math.min(100, Math.max(0, Math.round(freq))) : String(freq),
    weight_percent,
  };
}

/**
 * @param {unknown} fg
 * @param {"human"|"collab"|"automation"} roleType
 */
function coerceFilterGroup(fg, roleType) {
  const base = new Set(["important", "all"]);
  if (Array.isArray(fg)) {
    for (const x of fg) {
      const s = String(x || "").trim();
      if (s) base.add(s);
    }
  } else if (typeof fg === "string" && fg.trim()) {
    base.add(fg.trim());
  }
  base.add(roleType);
  return [...base];
}

/**
 * @param {unknown} raw
 * @param {string} [lang] `ko` | `en` — 있으면 탭·포트폴리오 표기를 UI 표준으로 통일
 * @param {object} [report] task_structure_summary 등 구조 해석 fallback용
 * @returns {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData | null}
 */
export function parseSection4TaskAiRole(raw, lang = "ko", report = null) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.section_title != null && typeof raw.section_title !== "string") return null;
  const ins = raw.integrated_insight;
  if (!ins || typeof ins !== "object") return null;
  if (typeof ins.eyebrow !== "string" || !ins.eyebrow.trim()) return null;
  if (!Array.isArray(ins.headline_segments) || ins.headline_segments.length === 0) return null;
  for (const s of ins.headline_segments) {
    if (!s || typeof s.text !== "string") return null;
  }
  if (typeof ins.supporting_text !== "string") return null;
  const pf = raw.portfolio;
  if (!pf || typeof pf !== "object" || typeof pf.title !== "string") return null;
  if (!Array.isArray(pf.segments) || pf.segments.length < 1) return null;
  const kinds = new Set(["human", "collab", "automation"]);
  for (const seg of pf.segments) {
    if (!seg || !kinds.has(seg.kind) || typeof seg.label !== "string" || typeof seg.sublabel !== "string") return null;
    const p = Number(seg.percent);
    if (!Number.isFinite(p)) return null;
  }
  if (!Array.isArray(raw.filters) || !raw.filters.length) return null;
  if (!Array.isArray(raw.task_cards) || !raw.task_cards.length) return null;
  if (!Array.isArray(raw.career_insights)) return null;

  const task_cards = raw.task_cards.map((card, idx) => {
    if (!card || typeof card !== "object") return null;
    const roleType = card.ai_role_type;
    if (!kinds.has(roleType)) return null;
    const metrics = coerceSection4Metrics(card.metrics, card.metrics?.weight_percent);
    if (!metrics) return null;
    return {
      ...card,
      id: String(card.id || `task-${idx}`),
      filter_group: coerceFilterGroup(card.filter_group, roleType),
      order: Number(card.order) || idx + 1,
      title: String(card.title || "").trim(),
      ai_role_type: roleType,
      metrics,
    };
  });
  if (task_cards.some((c) => !c)) return null;

  const out = /** @type {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} */ ({
    ...raw,
    task_cards,
  });
  applyCanonicalSection4Labels(out, lang, report);
  return out;
}

function sortByWeight(a, b) {
  return (Number(b.metrics?.weight_percent) || 0) - (Number(a.metrics?.weight_percent) || 0);
}

function sortByImportance(a, b) {
  return (Number(b.metrics?.importance) || 0) - (Number(a.metrics?.importance) || 0);
}

function sortByFrequency(a, b) {
  return (Number(b.metrics?.frequency_display) || 0) - (Number(a.metrics?.frequency_display) || 0);
}

/** Source importance ≥ 4.0 → UI metric (importance/5)*100 ≥ 80 */
const HIGH_IMPORTANCE_METRIC = 80;

/**
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard} t
 * @param {string} filterId
 */
function matchesSection4Filter(t, filterId) {
  if (filterId === "all") return true;
  if (filterId === "important") {
    const imp = Number(t?.metrics?.importance);
    if (Number.isFinite(imp)) return imp >= HIGH_IMPORTANCE_METRIC;
    return Array.isArray(t?.filter_group) && t.filter_group.includes("important");
  }
  if (filterId === "human" || filterId === "collab" || filterId === "automation") {
    return t?.ai_role_type === filterId;
  }
  return Array.isArray(t?.filter_group) && t.filter_group.includes(filterId);
}

function detailBullets(task, side) {
  if (side === "ai") {
    const primary = Array.isArray(task.bullets_primary) ? task.bullets_primary : [];
    if (primary.length) return primary.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 2);
    return textToScanBullets(task.ai_helps, 2);
  }
  const secondary = Array.isArray(task.bullets_secondary) ? task.bullets_secondary : [];
  if (secondary.length) return secondary.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 2);
  return textToScanBullets(task.human_owns, 2);
}

/**
 * @param {{
 *   data: import("./section4TaskAiRole.types.js").Section4TaskAiRoleData;
 *   lang: string;
 *   taskCardsForFilters?: import("./section4TaskAiRole.types.js").Section4TaskCard[] | null;
 *   focusTaskIds?: string[];
 *   report?: object | null;
 *   onBack?: (() => void) | null;
 * }} props
 */
export default function Section4TaskAiRole({
  data,
  lang,
  taskCardsForFilters,
  focusTaskIds,
  report = null,
  onBack = null,
}) {
  const uid = useId();
  const isKo = lang !== "en";
  const defaultId = useMemo(() => defaultFilterId(data.filters), [data.filters]);
  const [activeFilter, setActiveFilter] = useState(defaultId);
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey, setSortKey] = useState("weight");

  useEffect(() => {
    setActiveFilter(defaultFilterId(data.filters));
    setExpandedId(null);
  }, [data, data.filters]);

  const focusSet = useMemo(() => {
    const set = new Set();
    for (const raw of Array.isArray(focusTaskIds) ? focusTaskIds : []) {
      const s = String(raw || "").trim();
      if (!s) continue;
      set.add(s);
      set.add(s.replace(/^task-/i, ""));
    }
    return set;
  }, [focusTaskIds]);

  const cardMatchesFocus = (t) => {
    if (!focusSet.size) return false;
    const id = String(t?.id || "");
    const tid = id.replace(/^task-/i, "");
    const extra = String(t?.task_id || t?.onet_task_id || "");
    return focusSet.has(id) || focusSet.has(tid) || (extra && (focusSet.has(extra) || focusSet.has(`task-${extra}`)));
  };

  const cardSource = useMemo(() => {
    if (Array.isArray(taskCardsForFilters) && taskCardsForFilters.length > 0) return taskCardsForFilters;
    return data.task_cards;
  }, [taskCardsForFilters, data.task_cards]);

  const taskCount = cardSource.length;

  const filterCounts = useMemo(() => {
    const counts = {};
    for (const f of Array.isArray(data.filters) ? data.filters : []) {
      const id = f?.id;
      if (!id) continue;
      counts[id] = cardSource.filter((t) => matchesSection4Filter(t, id)).length;
    }
    return counts;
  }, [cardSource, data.filters]);

  const visibleTasks = useMemo(() => {
    const list = [...cardSource];
    const focused = focusSet.size ? list.filter((t) => cardMatchesFocus(t)) : [];
    const sorter =
      sortKey === "importance" ? sortByImportance : sortKey === "frequency" ? sortByFrequency : sortByWeight;

    if (focused.length) {
      return focused.sort(sorter);
    }
    if (activeFilter === "important") {
      return list.filter((t) => matchesSection4Filter(t, "important")).sort(sortByImportance);
    }
    return list.filter((t) => matchesSection4Filter(t, activeFilter)).sort(sorter);
  }, [cardSource, activeFilter, focusSet, sortKey]);

  const roleLabel = (type) => {
    if (type === "human") return isKo ? "사람 판단 중심" : "Human judgment";
    if (type === "collab") return isKo ? "AI 협업형" : "AI collaboration";
    return isKo ? "자동화 지향형" : "Automation-oriented";
  };

  const pageTitle = isKo ? `전체 업무 ${taskCount}개 분석` : `All ${taskCount} tasks analyzed`;
  const pageDesc = isKo
    ? "이 직무를 구성하는 전체 업무와 각 업무의 중요도, 수행빈도, 직무 내 비중, AI·사람 역할 성격을 확인할 수 있습니다."
    : "Review every task in this occupation with importance, frequency, role share, and AI–human role type.";

  const metricTips = {
    importance: isKo
      ? "원천 데이터에서 해당 업무가 직무 수행에 얼마나 중요한지 나타내는 값"
      : "How important the task is to performing the occupation in source data",
    frequency: isKo
      ? "업무가 얼마나 자주 수행되는지를 나타내는 값"
      : "How often the task is performed",
    weight: isKo
      ? "중요도와 수행빈도를 바탕으로 계산한 직무 내 상대 비중"
      : "Relative share within the occupation from importance and frequency",
  };

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="section4-root section4-root--compact">
      {typeof onBack === "function" ? (
        <div className="section4-view-chrome">
          <button type="button" className="section4-back" onClick={onBack}>
            {isKo ? "← 리포트로 돌아가기" : "← Back to report"}
          </button>
        </div>
      ) : null}

      <header className="section4-page-head">
        <h3 id={`${uid}-title`} className="section4-page-title">
          {pageTitle}
        </h3>
        <p className="section4-page-desc">{pageDesc}</p>
      </header>

      <div className="section4-toolbar">
        <div className="section4-filters" role="tablist" aria-label={isKo ? "업무 필터 및 요약" : "Task filters and summary"}>
          {data.filters.map((f) => {
            const count = Number(filterCounts[f.id]) || 0;
            const label =
              f.id === "all"
                ? isKo
                  ? `전체 (${count})`
                  : `All (${count})`
                : f.id === "important"
                  ? f.label
                  : `${f.label} (${count})`;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === f.id}
                className={`section4-filter${activeFilter === f.id ? " is-active" : ""}`}
                onClick={() => {
                  setActiveFilter(f.id);
                  setExpandedId(null);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <label className="section4-sort">
          <span className="section4-sort__lab">{isKo ? "정렬" : "Sort"}</span>
          <select
            className="section4-sort__select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label={isKo ? "정렬 기준" : "Sort by"}
          >
            <option value="weight">{isKo ? "직무 내 비중 높은순" : "Role share (high)"}</option>
            <option value="importance">{isKo ? "중요도 높은순" : "Importance (high)"}</option>
            <option value="frequency">{isKo ? "수행빈도 높은순" : "Frequency (high)"}</option>
          </select>
        </label>
      </div>

      <div className="section4-table-wrap">
        {visibleTasks.length === 0 ? (
          <p className="section4-empty">{isKo ? "이 필터에 해당하는 업무가 없습니다." : "No tasks for this filter."}</p>
        ) : (
          <table className="section4-table">
            <colgroup>
              <col className="section4-col section4-col--task" />
              <col className="section4-col section4-col--role" />
              <col className="section4-col section4-col--importance" />
              <col className="section4-col section4-col--frequency" />
              <col className="section4-col section4-col--share" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="section4-th section4-th--task">
                  {isKo ? "업무" : "Task"}
                </th>
                <th scope="col" className="section4-th section4-th--role">
                  {isKo ? "역할 성격" : "Role type"}
                </th>
                <th scope="col" className="section4-th section4-th--num" title={metricTips.importance}>
                  <span>{isKo ? "중요도" : "Importance"}</span>
                  <span className="section4-th__hint" aria-hidden>
                    ?
                  </span>
                </th>
                <th scope="col" className="section4-th section4-th--num" title={metricTips.frequency}>
                  <span>{isKo ? "수행빈도" : "Frequency"}</span>
                  <span className="section4-th__hint" aria-hidden>
                    ?
                  </span>
                </th>
                <th scope="col" className="section4-th section4-th--num" title={metricTips.weight}>
                  <span>{isKo ? "직무 내 비중" : "Role share"}</span>
                  <span className="section4-th__hint" aria-hidden>
                    ?
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((t) => {
                const open = expandedId === t.id;
                const aiLines = detailBullets(t, "ai");
                const humanLines = detailBullets(t, "human");
                const caps = Array.isArray(t.capabilities)
                  ? t.capabilities.map((c) => String(c || "").trim()).filter(Boolean).slice(0, 4)
                  : [];
                return (
                  <Fragment key={t.id}>
                    <tr
                      className={`section4-row${open ? " is-open" : ""}${cardMatchesFocus(t) ? " is-evidence-focus" : ""}`}
                      data-evidence-task-id={String(t.id || "").replace(/^task-/i, "")}
                      id={t.id ? `evidence-${t.id}` : undefined}
                      onClick={() => toggleRow(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRow(t.id);
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={open}
                    >
                      <td className="section4-td section4-td--task">
                        <span className="section4-task-name">{t.title_hidden ? "" : t.title}</span>
                      </td>
                      <td className="section4-td section4-td--role">
                        <span className={`section4-role section4-role--${t.ai_role_type}`}>{roleLabel(t.ai_role_type)}</span>
                      </td>
                      <td
                        className="section4-td section4-td--num"
                        data-label={isKo ? "중요도 " : "Importance "}
                      >
                        {Math.round(Number(t.metrics.importance))}
                      </td>
                      <td
                        className="section4-td section4-td--num"
                        data-label={isKo ? "수행빈도 " : "Frequency "}
                      >
                        {t.metrics.frequency_display}
                      </td>
                      <td
                        className="section4-td section4-td--num"
                        data-label={isKo ? "직무 내 비중 " : "Role share "}
                      >
                        {Math.round(Number(t.metrics.weight_percent))}%
                      </td>
                    </tr>
                    {open ? (
                      <tr className="section4-detail-row">
                        <td colSpan={5} className="section4-detail">
                          <div className="section4-detail__grid">
                            <div className="section4-detail__col">
                              <h4 className="section4-detail__h">
                                {isKo ? "AI가 도울 수 있는 부분" : "Where AI can help"}
                              </h4>
                              {aiLines.length ? (
                                <ul className="section4-detail__ul">
                                  {aiLines.map((line, i) => (
                                    <li key={`${t.id}-ai-${i}`}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="section4-detail__empty">{isKo ? "요약 없음" : "No summary"}</p>
                              )}
                            </div>
                            <div className="section4-detail__col">
                              <h4 className="section4-detail__h">
                                {isKo ? "사람이 확인·판단할 부분" : "What people still verify"}
                              </h4>
                              {humanLines.length ? (
                                <ul className="section4-detail__ul">
                                  {humanLines.map((line, i) => (
                                    <li key={`${t.id}-hu-${i}`}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="section4-detail__empty">{isKo ? "요약 없음" : "No summary"}</p>
                              )}
                            </div>
                          </div>
                          {caps.length ? (
                            <p className="section4-detail__tags">
                              <span className="section4-detail__tags-lab">{isKo ? "관련 태그" : "Tags"}</span>
                              {" · "}
                              {caps.join(" · ")}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
