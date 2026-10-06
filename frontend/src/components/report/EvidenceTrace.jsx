import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  buildReportTrustMethodology,
  buildPositionScoreExplanation,
  formatRepresentativeSelectionWhy,
} from "./reportTrustLayer.js";
import { analysisMethodHashForScore } from "../../analysisMethod.js";
import { buildAnalysisMethodUrl } from "../../fcUrl.js";
import "./evidence-trace.css";

function Chevron({ expanded, className = "ev-trace__chev" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ transform: expanded ? "rotate(180deg)" : undefined }}
    >
      <path
        d="M5.5 7.5L10 12L14.5 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EvidenceTraceToggle({ label, children, className = "", align = "start" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className={`ev-trace ev-trace--${align}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="ev-trace__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <Chevron expanded={open} />
      </button>
      {open ? (
        <div id={panelId} className="ev-trace__panel">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function TrustWhyText({ text }) {
  if (!text) return null;
  return <p className="ev-trust__text">{text}</p>;
}

export function TrustWhyToggle({ label, text, className = "", align = "inline", variant, footer }) {
  void variant;
  if (!text && !footer) return null;
  return (
    <EvidenceTraceToggle label={label} className={className} align={align}>
      {text ? <TrustWhyText text={text} /> : null}
      {footer || null}
    </EvidenceTraceToggle>
  );
}

export function ReportTrustMethodologyPanel({ report, lang = "ko" }) {
  const ko = lang !== "en";
  const location = useLocation();
  const { taskCoverage, coreMessage, sections } = buildReportTrustMethodology(report, lang);
  const methodHref = buildAnalysisMethodUrl({ search: location.search, pathname: location.pathname });
  return (
    <EvidenceTraceToggle
      label={ko ? "이 리포트는 어떻게 만들어졌나요?" : "How was this report built?"}
      className="ev-trace--method"
    >
      <div className="ev-trust-method">
        {taskCoverage ? <p className="ev-trust-method__coverage">{taskCoverage}</p> : null}
        <p className="ev-trust-method__core">{coreMessage}</p>
        {sections.map((sec) => (
          <div key={sec.title} className="ev-trust-method__block">
            <h4 className="ev-trust-method__title">{sec.title}</h4>
            <p className="ev-trust__text">{sec.body}</p>
          </div>
        ))}
        <Link className="ev-trust__method-link" to={methodHref}>
          {ko ? "데이터와 분석 방법 →" : "Data & analysis method →"}
        </Link>
      </div>
    </EvidenceTraceToggle>
  );
}

/** @deprecated use ReportTrustMethodologyPanel */
export function DataMethodologyPanel(props) {
  return <ReportTrustMethodologyPanel {...props} />;
}

export function PositionScoreEvidence({ scoreKey, profile, report, lang = "ko", label, variant }) {
  void profile;
  void report;
  const ko = lang !== "en";
  const location = useLocation();
  const text = buildPositionScoreExplanation(scoreKey, lang);
  const methodHref = buildAnalysisMethodUrl({
    hash: analysisMethodHashForScore(scoreKey),
    search: location.search,
    pathname: location.pathname,
  });
  return (
    <TrustWhyToggle
      label={label || (ko ? "어떻게 계산됐나요?" : "How is this calculated?")}
      text={text}
      align="inline"
      className={variant === "score-card" ? "ev-trace--score-card" : ""}
      footer={
        <Link className="ev-trust__method-link" to={methodHref}>
          {ko ? "분석 방법 자세히 보기 →" : "Read the full analysis method →"}
        </Link>
      }
    />
  );
}

export function RepresentativeSelectionEvidence({ selection, report, lang = "ko", label }) {
  void selection;
  void report;
  const ko = lang !== "en";
  const text = formatRepresentativeSelectionWhy(lang, report);
  return (
    <TrustWhyToggle
      label={label || (ko ? "왜 이 업무들을 대표로 골랐나요?" : "Why these representatives?")}
      text={text}
      align="inline"
    />
  );
}

/** Trust Layer v1 — no per-claim evidence UI */
export function ClaimEvidenceBrief() {
  return null;
}
