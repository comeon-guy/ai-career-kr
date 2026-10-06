import { createPortal } from "react-dom";
import "../../report-integrated.css";

/**
 * 리포트 API 로딩 중 표시 (전체 영역 / 기존 리포트 위 오버레이)
 * overlay는 document.body 포털 + fixed로 리포트 내 backdrop-filter 스택과 분리
 * @param {{ lang?: string; variant?: "full" | "overlay"; className?: string; title?: string; hint?: string; ariaLabel?: string }} props
 */
export function ReportLoadingPanel({
  lang = "ko",
  variant = "full",
  className = "",
  title,
  hint,
  ariaLabel,
}) {
  const isKo = lang === "ko";
  const rootClass =
    "report-loading-panel" +
    (variant === "overlay" ? " report-loading-panel--overlay" : " report-loading-panel--full") +
    (className ? ` ${className}` : "");

  const panelTitle = title || (isKo ? "데이터를 분석 중입니다..." : "Analyzing your data...");
  const panelHint = hint || (isKo ? "잠시만 기다려 주세요." : "This may take a moment.");
  const panelAriaLabel = ariaLabel || (isKo ? "데이터 분석 중" : "Analyzing data");

  const panel = (
    <div
      className={rootClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={panelAriaLabel}
    >
      {variant === "overlay" ? <div className="report-loading-panel__backdrop" aria-hidden /> : null}
      <div className="report-loading-panel__card">
        <div className="report-loading-panel__spinner" aria-hidden />
        <p className="report-loading-panel__title">{panelTitle}</p>
        <p className="report-loading-panel__hint">{panelHint}</p>
        <div className="report-loading-panel__bars" aria-hidden>
          <span className="report-loading-panel__bar" />
          <span className="report-loading-panel__bar" />
          <span className="report-loading-panel__bar" />
        </div>
      </div>
    </div>
  );

  if (variant === "overlay" && typeof document !== "undefined") {
    return createPortal(panel, document.body);
  }

  return panel;
}
