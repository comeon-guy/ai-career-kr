import "./task-role-composition.css";

/**
 * Task Role v1 — independent HIGH-share metrics (not a 100% stacked exclusive composition).
 * Values are Σ job_share where axis == HIGH; sum may exceed 100%.
 */
export default function TaskRoleAxisShares({
  axes = [],
  lang = "ko",
  activeKey = null,
  onSelectAxis = null,
  onOpen = null,
  showTitle = true,
  showNote = true,
}) {
  const isKo = lang !== "en";
  const opensAllTasks = typeof onOpen === "function";
  const canFilter = !opensAllTasks && typeof onSelectAxis === "function";
  const title = isKo ? "전체 업무 분석" : "All-task analysis";
  const note = isKo
    ? "각 지표는 독립적으로 계산되며, 하나의 업무가 여러 항목에 동시에 포함될 수 있습니다."
    : "Each metric is independent; one task can contribute to more than one share.";

  const Wrapper = opensAllTasks ? "button" : "div";
  const wrapperProps = opensAllTasks
    ? {
        type: "button",
        className: "fc-axis-shares fc-axis-shares--link",
        onClick: onOpen,
        "aria-label": isKo
          ? `전체 업무 분석으로 이동. ${axes.map((a) => `${a.label} ${a.pct}%`).join(", ")}`
          : `Open all tasks analysis. ${axes.map((a) => `${a.label} ${a.pct}%`).join(", ")}`,
      }
    : {
        className: "fc-axis-shares",
        role: "group",
        "aria-label": title,
      };

  return (
    <Wrapper {...wrapperProps}>
      {showTitle ? (
        <div className="fc-axis-shares__head">
          <p className="fc-axis-shares__title">{title}</p>
          {showNote ? <p className="fc-axis-shares__note">{note}</p> : null}
        </div>
      ) : null}

      <ul className="fc-axis-shares__list">
        {axes.map((axis) => {
          const selected = activeKey && activeKey === axis.key;
          const RowTag = canFilter ? "button" : "div";
          const rowProps = canFilter
            ? {
                type: "button",
                onClick: () => onSelectAxis(axis.key),
                "aria-pressed": selected ? "true" : "false",
              }
            : {};
          return (
            <li key={axis.key} className={`fc-axis-shares__item fc-axis-shares__item--${axis.tone}`}>
              <RowTag
                {...rowProps}
                className={
                  "fc-axis-shares__row" +
                  (canFilter ? " is-clickable" : "") +
                  (selected ? " is-active" : "")
                }
              >
                <span className="fc-axis-shares__label">{axis.label}</span>
                <span className="fc-axis-shares__pct">{Number.isFinite(axis.pct) ? `${axis.pct}%` : "—"}</span>
                <span
                  className="fc-axis-shares__track"
                  aria-hidden="true"
                >
                  <span
                    className="fc-axis-shares__fill"
                    style={{ width: `${Math.max(0, Math.min(100, Number(axis.pct) || 0))}%` }}
                  />
                </span>
              </RowTag>
            </li>
          );
        })}
      </ul>
    </Wrapper>
  );
}
