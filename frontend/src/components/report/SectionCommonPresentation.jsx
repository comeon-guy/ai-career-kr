import "./section-common-presentation.css";

/**
 * Shared 03/04 Common Presentation Contract renderer.
 * Typography: production --report-* only.
 * READING_WIDTH_CONTRACT_V1
 * Flow boxes never mount.
 * Helper subheading never rendered.
 * layout="stepFlow": title + body as one reading unit (occupation AI usage).
 */

function ProseList({ items }) {
  const rows = Array.isArray(items) ? items.filter((row) => row?.title && row?.body) : [];
  if (!rows.length) return null;
  return (
    <div className="scp-prose" data-slot="prose-details">
      {rows.map((row, i) => (
        <article key={row.key || `${i}-${row.title}`} className="scp-prose__item">
          <h3 className="scp-prose__title">{row.title}</h3>
          <p className="scp-prose__body">{row.body}</p>
        </article>
      ))}
    </div>
  );
}

function StepFlowList({ items, lang = "ko" }) {
  const rows = Array.isArray(items) ? items.filter((row) => row?.title && row?.body) : [];
  if (!rows.length) return null;
  const ko = lang !== "en";
  return (
    <ol
      className="scp-steps"
      data-slot="occupation-step-flow"
      aria-label={ko ? "AI 활용 업무 흐름" : "AI usage work flow"}
    >
      {rows.map((row, i) => (
        <li key={row.key || `${i}-${row.title}`} className="scp-steps__item">
          <h3 className="scp-steps__title">{row.title}</h3>
          <p className="scp-steps__body">{row.body}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * @param {"competitiveness"|"aiWorking"} variant
 * @param {"prose"|"stepFlow"} layout
 */
export default function SectionCommonPresentation({
  variant = "competitiveness",
  lang = "ko",
  intro = "",
  occupationLead = null,
  flowLabels = null,
  proseItems = [],
  flowAriaLabel = "",
  layout = "prose",
}) {
  void flowLabels;
  void flowAriaLabel;
  const ko = lang !== "en";
  void ko;
  const hasProse = Array.isArray(proseItems) && proseItems.some((row) => row?.title && row?.body);
  const leadBody = String(occupationLead?.body || "").trim();
  const useStepFlow = layout === "stepFlow" && variant === "aiWorking";

  if (!intro && !leadBody && !hasProse) {
    return (
      <div
        className="scp"
        data-section-common-presentation="incomplete"
        data-ui="section-03-04-common-presentation-v1"
        data-variant={variant}
        data-flow-count="0"
        data-helper-subheading="0"
      >
        <p className="scp-incomplete" data-slot="incomplete">
          —
        </p>
      </div>
    );
  }

  return (
    <div
      className="scp"
      data-section-common-presentation="v1"
      data-ui="section-03-04-common-presentation-v1"
      data-variant={variant}
      data-layout={useStepFlow ? "step-flow" : "prose"}
      data-flow-count="0"
      data-helper-subheading="0"
    >
      {variant === "competitiveness" && intro ? (
        <p className="scp-intro" data-slot="section-intro">
          {intro}
        </p>
      ) : null}

      {variant === "competitiveness" ? (
        <div className="scp-divider" data-slot="section-divider" role="presentation" />
      ) : null}

      {variant === "aiWorking" && leadBody ? (
        <div className="scp-lead" data-slot="occupation-lead">
          <p className="scp-lead__body" data-slot="section-intro">
            {leadBody}
          </p>
        </div>
      ) : null}

      <div className="scp-content" data-slot="section-content">
        {hasProse ? (
          useStepFlow ? (
            <StepFlowList items={proseItems} lang={lang} />
          ) : (
            <ProseList items={proseItems} />
          )
        ) : null}
      </div>
    </div>
  );
}
