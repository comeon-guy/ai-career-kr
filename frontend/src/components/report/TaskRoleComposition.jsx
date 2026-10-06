import "./task-role-composition.css";

/**
 * Production "전체 업무 구성" shell.
 *
 * - mode="stack": legacy exclusive 100% composition (non-final SOC)
 * - mode="independent": final Task Role HIGH shares as independent 0–100 bars
 *
 * Does not invent exclusive Types. Does not normalize shares to sum 100.
 */
export default function TaskRoleComposition({
  total = 0,
  categories = [],
  lang = "ko",
  mode = "stack",
  activeKey = null,
  onSelectCategory = null,
  onOpen = null,
  showTitle = true,
  showSubtext = true,
  note = null,
}) {
  const isKo = lang !== "en";
  const independent = mode === "independent" || mode === "independent_v2";
  const opensAllTasks = typeof onOpen === "function";
  const canFilter = !opensAllTasks && typeof onSelectCategory === "function";

  const title = isKo ? "전체 업무 구성" : "Task role composition";
  const subtext =
    total > 0 ? (isKo ? `${total}개 업무 기준` : `${total} tasks`) : null;
  const independenceNote =
    note != null
      ? note
      : independent
        ? isKo
          ? "각 지표는 독립적으로 계산됩니다."
          : "Each metric is calculated independently."
        : null;

  const Wrapper = opensAllTasks ? "button" : "div";
  const ariaSummary = independent
    ? categories
        .map((c) =>
          isKo
            ? `${c.fullLabel || c.label} ${c.percentage}퍼센트`
            : `${c.fullLabel || c.label} ${c.percentage} percent`,
        )
        .join(", ")
    : categories.map((c) => `${c.label} ${c.count}`).join(", ");

  const wrapperProps = opensAllTasks
    ? {
        type: "button",
        className:
          "fc-role-comp fc-role-comp--link" + (independent ? " fc-role-comp--independent" : ""),
        onClick: onOpen,
        "aria-label": isKo
          ? `전체 업무 ${total}개 분석으로 이동. ${ariaSummary}`
          : `Open all ${total} tasks analysis. ${ariaSummary}`,
        "data-composition-mode": independent ? "independent" : "stack",
        "data-exclusive-mapping": independent ? "false" : "true",
        "data-role-counts-used": independent ? "false" : "true",
      }
    : {
        className: "fc-role-comp" + (independent ? " fc-role-comp--independent" : ""),
        role: "group",
        "aria-label": title,
        "data-composition-mode": independent ? "independent" : "stack",
        "data-exclusive-mapping": independent ? "false" : "true",
        "data-role-counts-used": independent ? "false" : "true",
      };

  return (
    <Wrapper {...wrapperProps}>
      {showTitle || showSubtext || independenceNote ? (
        <div className="fc-role-comp__head">
          {showTitle ? <p className="fc-role-comp__title">{title}</p> : null}
          {showSubtext && subtext ? <p className="fc-role-comp__sub">{subtext}</p> : null}
          {independenceNote ? <p className="fc-role-comp__note">{independenceNote}</p> : null}
        </div>
      ) : null}

      {independent ? (
        <ul
          className="fc-role-comp__indep"
          role="img"
          aria-label={ariaSummary}
        >
          {categories.map((c) => {
            const unavailable = c.unavailable === true || c.percentage == null;
            const pct = unavailable
              ? null
              : Math.max(0, Math.min(100, Number(c.percentage)));
            const selected = activeKey && activeKey === c.key;
            const dimmed = activeKey && activeKey !== c.key;
            const rowInner = (
              <>
                <span className="fc-role-comp__indep-label">{c.fullLabel || c.label}</span>
                <span className="fc-role-comp__indep-pct">
                  {unavailable ? "—" : `${pct}%`}
                </span>
                <span className="fc-role-comp__indep-track" aria-hidden="true">
                  <span
                    className={`fc-role-comp__indep-fill fc-role-comp__indep-fill--${c.tone}`}
                    style={{ width: `${unavailable ? 0 : pct}%` }}
                  />
                </span>
              </>
            );
            if (canFilter) {
              return (
                <li key={c.key} className={`fc-role-comp__indep-item fc-role-comp__indep-item--${c.tone}`}>
                  <button
                    type="button"
                    className={
                      "fc-role-comp__indep-row is-clickable" +
                      (selected ? " is-active" : "") +
                      (dimmed ? " is-dimmed" : "")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(c.key);
                    }}
                    aria-pressed={selected ? "true" : "false"}
                    aria-label={
                      isKo
                        ? `${c.fullLabel || c.label} ${pct}퍼센트. 필터 적용`
                        : `${c.fullLabel || c.label} ${pct} percent. Apply filter`
                    }
                  >
                    {rowInner}
                  </button>
                </li>
              );
            }
            return (
              <li
                key={c.key}
                className={`fc-role-comp__indep-item fc-role-comp__indep-item--${c.tone}`}
              >
                <div className="fc-role-comp__indep-row" aria-hidden="true">
                  {rowInner}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          className="fc-role-comp__bar"
          role="img"
          aria-label={categories
            .map((c) =>
              isKo
                ? `${c.label}, ${c.count}개, 전체의 ${c.percentage}퍼센트`
                : `${c.label}, ${c.count}, ${c.percentage} percent of total`,
            )
            .join(". ")}
        >
          {categories.map((c) => {
            if (c.count <= 0 || c.percentage <= 0) return null;
            const selected = activeKey && activeKey === c.key;
            const dimmed = activeKey && activeKey !== c.key;
            const SegmentTag = canFilter ? "button" : "span";
            const segmentProps = canFilter
              ? {
                  type: "button",
                  onClick: (e) => {
                    e.stopPropagation();
                    onSelectCategory(c.key);
                  },
                  "aria-pressed": selected ? "true" : "false",
                  "aria-label": isKo
                    ? `${c.label}, ${c.count}개, 전체의 ${c.percentage}퍼센트. 필터 적용`
                    : `${c.label}, ${c.count}, ${c.percentage} percent. Apply filter`,
                }
              : {
                  "aria-hidden": true,
                };
            return (
              <SegmentTag
                key={c.key}
                {...segmentProps}
                className={
                  `fc-role-comp__seg fc-role-comp__seg--${c.tone}` +
                  (selected ? " is-active" : "") +
                  (dimmed ? " is-dimmed" : "") +
                  (canFilter ? " is-clickable" : "")
                }
                style={{ flexGrow: c.percentage, flexBasis: 0 }}
              >
                <span className="fc-role-comp__seg-label">{`${c.count} (${c.percentage}%)`}</span>
              </SegmentTag>
            );
          })}
        </div>
      )}

      {!independent ? (
        <ul className="fc-role-comp__legend">
          {categories.map((c) => (
            <li key={c.key} className={`fc-role-comp__leg fc-role-comp__leg--${c.tone}`}>
              {canFilter ? (
                <button
                  type="button"
                  className={
                    "fc-role-comp__leg-btn" + (activeKey === c.key ? " is-active" : "")
                  }
                  onClick={() => onSelectCategory(c.key)}
                >
                  <span className="fc-role-comp__dot" aria-hidden />
                  <span className="fc-role-comp__leg-label">{c.label}</span>
                  <span className="fc-role-comp__leg-count">{c.count}</span>
                </button>
              ) : (
                <span className="fc-role-comp__leg-static">
                  <span className="fc-role-comp__dot" aria-hidden />
                  <span className="fc-role-comp__leg-label">{c.label}</span>
                  <span className="fc-role-comp__leg-count">{c.count}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </Wrapper>
  );
}
