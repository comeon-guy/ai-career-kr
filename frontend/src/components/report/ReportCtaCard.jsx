import { Link } from "react-router-dom";
import { getReportCtaCopy, getReportCtaTheme, buildShareReportUrl } from "../../constants/reportCtaCopy.js";
import { buildFutureCompetitivenessUrl } from "../../fcUrl.js";
import {
  ReportCtaContentVisual,
  ReportCtaHeroIcon,
  ReportCtaLockIcon,
} from "./ReportCtaCardVisuals.jsx";
import "./report-cta.css";

function splitCtaLines(text) {
  return String(text)
    .split(/<br\s*\/?>|&lt;br\s*\/?&gt;|\r\n|\n/gi)
    .map((line) => line.trim());
}

function CtaMultilineText({ text, className, as: Tag = "p" }) {
  if (!text) return null;
  const lines = splitCtaLines(text);
  if (lines.length <= 1) {
    return <Tag className={className}>{lines[0] ?? ""}</Tag>;
  }
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </Tag>
  );
}

export function ReportCtaCard({
  variant,
  lang,
  socCode,
  onShare,
  className = "",
}) {
  const copy = getReportCtaCopy(variant, lang);
  if (!copy) return null;

  const soc = (socCode || "").trim();
  const theme = getReportCtaTheme(variant);
  const inRail = className.includes("in-rail");

  const handlePrimary = async () => {
    if (onShare) {
      await onShare();
      return;
    }
    const url = buildShareReportUrl(soc, lang);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  if (variant === "share-only") {
    return (
      <div className={`report-cta report-cta--share${className ? ` ${className}` : ""}`}>
        <CtaMultilineText text={copy.question} className="report-cta__question" />
        {copy.support ? <CtaMultilineText text={copy.support} className="report-cta__support" /> : null}
        <div className="report-cta__actions">
          <button type="button" className="report-cta__btn report-cta__btn--secondary" onClick={handlePrimary}>
            {copy.primary}
          </button>
        </div>
      </div>
    );
  }

  const checklist = Array.isArray(copy.checklist) ? copy.checklist : [];
  const cardClass = [
    "report-cta-v2",
    theme ? `report-cta-v2--${theme}` : "",
    inRail ? "report-cta-v2--in-rail" : "report-cta-v2--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass}>
      <div className="report-cta-v2__inner">
        <div className="report-cta-v2__hero">
          {theme ? (
            <div className="report-cta-v2__icon-orb">
              <ReportCtaHeroIcon theme={theme} />
            </div>
          ) : null}
          <CtaMultilineText text={copy.question} className="report-cta-v2__title" as="h2" />
          {copy.support ? <CtaMultilineText text={copy.support} className="report-cta-v2__desc" /> : null}
        </div>

        {checklist.length > 0 ? (
          <>
            <div className="report-cta-v2__divider" aria-hidden />
            <div className="report-cta-v2__content-row">
              <ul className="report-cta-v2__check-list">
                {checklist.map((item) => (
                  <li key={item} className="report-cta-v2__check-item">
                    <span className="report-cta-v2__check" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {theme && theme !== "closing" ? <ReportCtaContentVisual theme={theme} /> : null}
            </div>
          </>
        ) : null}

        <div className="report-cta-v2__actions">
          <button type="button" className="report-cta-v2__button" onClick={handlePrimary}>
            {copy.primary}
            <span className="report-cta-v2__arrow" aria-hidden>
              →
            </span>
          </button>
          {copy.secondary ? (
            <Link
              to={buildFutureCompetitivenessUrl({ soc: null, tab: "analysis" })}
              className="report-cta-v2__button report-cta-v2__button--secondary"
            >
              {copy.secondary}
            </Link>
          ) : null}
        </div>

        {copy.footnote ? <p className="report-cta-v2__footnote">{copy.footnote}</p> : null}

        {copy.footer ? (
          <footer className="report-cta-v2__footer">
            <ReportCtaLockIcon />
            <span>{copy.footer}</span>
          </footer>
        ) : null}
      </div>
    </article>
  );
}
