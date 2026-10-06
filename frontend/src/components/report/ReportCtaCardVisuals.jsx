/** CTA 카드 장식 비주얼 (목업 red / purple / blue) */

export function ReportCtaHeroIcon({ theme }) {
  if (theme === "red") {
    return (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 40h30" />
        <path d="M13 35V12" />
        <path d="M20 31V23" />
        <path d="M28 31V18" />
        <path d="M36 31V11" />
        <path d="M17 23l7-7 7 5 7-10" />
        <circle cx="17" cy="23" r="2" fill="currentColor" stroke="none" />
        <circle cx="24" cy="16" r="2" fill="currentColor" stroke="none" />
        <circle cx="31" cy="21" r="2" fill="currentColor" stroke="none" />
        <circle cx="38" cy="11" r="2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (theme === "purple") {
    return (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="9" />
        <path d="M24 24l13-13" />
        <path d="M35 7v8h8" />
      </svg>
    );
  }
  if (theme === "blue") {
    return (
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 28c-3-2-5-6-5-10a11 11 0 1 1 22 0c0 4-2 8-5 10" />
        <path d="M20 35h8" />
        <path d="M21 40h6" />
        <path d="M21 28h6v5h-6z" />
        <path d="M24 4V1" />
        <path d="M40 18h4" />
        <path d="M4 18h4" />
        <path d="M36 7l3-3" />
        <path d="M9 4l3 3" />
      </svg>
    );
  }
  return null;
}

export function ReportCtaContentVisual({ theme }) {
  if (theme === "red") {
    return (
      <div className="report-cta-v2__visual">
        <div className="report-cta-v2__doc">
          <div className="report-cta-v2__line report-cta-v2__line--main" />
          <div className="report-cta-v2__line report-cta-v2__line--wide" />
          <div className="report-cta-v2__line report-cta-v2__line--mid" />
          <div className="report-cta-v2__line report-cta-v2__line--short" />
        </div>
        <div className="report-cta-v2__mini-chart" aria-hidden>
          <span className="report-cta-v2__bar" />
          <span className="report-cta-v2__bar" />
          <span className="report-cta-v2__bar" />
        </div>
        <div className="report-cta-v2__lens" aria-hidden />
      </div>
    );
  }
  if (theme === "purple") {
    return (
      <div className="report-cta-v2__visual report-cta-v2__visual--purple">
        <div className="report-cta-v2__doc">
          <div className="report-cta-v2__line report-cta-v2__line--main" />
          <div className="report-cta-v2__line report-cta-v2__line--wide" />
          <div className="report-cta-v2__line report-cta-v2__line--mid" />
          <div className="report-cta-v2__line report-cta-v2__line--short" />
        </div>
        <div className="report-cta-v2__badge-star" aria-hidden>
          <svg className="report-cta-v2__star" viewBox="0 0 24 24" fill="currentColor">
            <path d="m12 2.7 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.3l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 2.7Z" />
          </svg>
          <div className="report-cta-v2__badge-lines">
            <span />
            <span />
          </div>
        </div>
        <div className="report-cta-v2__bubble" aria-hidden />
      </div>
    );
  }
  if (theme === "blue") {
    return (
      <div className="report-cta-v2__visual report-cta-v2__visual--blue">
        <div className="report-cta-v2__profile-card">
          <div className="report-cta-v2__avatar-row">
            <div className="report-cta-v2__avatar" aria-hidden />
            <div className="report-cta-v2__profile-lines" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="report-cta-v2__graph-box" aria-hidden>
            <svg viewBox="0 0 140 56" fill="none">
              <path
                d="M4 44 C18 39, 28 41, 41 34 S62 29, 75 34 S96 24, 108 18 S124 9, 136 2"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ReportCtaLockIcon() {
  return (
    <svg className="report-cta-v2__lock" viewBox="0 0 24 24" aria-hidden>
      <path d="M17 9V7a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
    </svg>
  );
}
