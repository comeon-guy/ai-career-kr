import { useEffect, useId, useRef } from "react";
import { AnalysisMethodPage } from "../../pages/AnalysisMethodPage.jsx";
import "./methodology-reference-view.css";

/**
 * Methodology reference view — same report dialog shell, not a nested modal.
 */
export default function MethodologyReferenceView({ lang = "ko", onBack = null }) {
  const isKo = lang !== "en";
  const titleRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    titleRef.current?.focus?.();
  }, []);

  return (
    <section
      className="fc-method-ref"
      id="methodologyReference"
      aria-labelledby={titleId}
      data-shell-view="methodology"
    >
      {typeof onBack === "function" ? (
        <button type="button" className="fc-method-ref__back" onClick={onBack}>
          {isKo ? "← 리포트로 돌아가기" : "← Back to report"}
        </button>
      ) : null}
      <p className="fc-method-ref__eyebrow">{isKo ? "참고자료" : "References"}</p>
      <h2
        id={titleId}
        ref={titleRef}
        className="fc-method-ref__title"
        tabIndex={-1}
      >
        {isKo ? "데이터와 분석 방법" : "Data & analysis method"}
      </h2>
      <div className="fc-method-ref__body">
        <AnalysisMethodPage embedded />
      </div>
    </section>
  );
}
