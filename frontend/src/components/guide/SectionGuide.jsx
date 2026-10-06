export function SectionGuide({ icon = "💡", title, subtitle, actionLabel, onAction }) {
  return (
    <div className="guide-section">
      <div className="guide-section__left">
        <div className="guide-section__icon" aria-hidden>
          {icon}
        </div>
        <div>
          <span className="guide-section__title">{title}</span>
          {subtitle ? <span className="guide-section__sub">{subtitle}</span> : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="guide-btn-pill guide-btn-pill--ghost" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
