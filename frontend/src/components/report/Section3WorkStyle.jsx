import { useId } from "react";
import "./section3-work-style.css";

/**
 * @param {unknown} raw
 * @returns {import("./section3WorkStyle.types.js").Section3WorkStyleData | null}
 */
export function parseSection3WorkStyle(raw) {
  if (!raw || typeof raw !== "object") return null;
  const hi = raw.hero_insight;
  if (!hi || typeof hi !== "object") return null;
  if (typeof hi.badge_title !== "string" || !hi.badge_title.trim()) return null;
  if (!Array.isArray(hi.headline_segments) || hi.headline_segments.length === 0) return null;
  for (const s of hi.headline_segments) {
    if (!s || typeof s.text !== "string") return null;
  }
  if (!Array.isArray(hi.proof_items) || hi.proof_items.length < 2) return null;
  for (const p of hi.proof_items) {
    if (typeof p !== "string" || !p.trim()) return null;
  }
  const ca = raw.core_axis;
  if (!ca || typeof ca !== "object") return null;
  if (typeof ca.title !== "string" || !ca.title.trim()) return null;
  if (typeof ca.circle_label !== "string" || typeof ca.circle_sub !== "string") return null;
  if (!Array.isArray(ca.axes) || ca.axes.length < 3) return null;
  for (const ax of ca.axes) {
    if (!ax || typeof ax.label !== "string" || typeof ax.description !== "string") return null;
  }
  const sh = raw.shift_lanes_header;
  if (!sh || typeof sh !== "object") return null;
  if (typeof sh.title !== "string" || typeof sh.label_before !== "string" || typeof sh.label_after !== "string") {
    return null;
  }
  if (!Array.isArray(raw.shift_lanes) || raw.shift_lanes.length < 2) return null;
  for (const lane of raw.shift_lanes) {
    if (!lane || typeof lane.before_text !== "string" || typeof lane.after_text !== "string") return null;
  }
  if (!Array.isArray(raw.strategy_cards) || raw.strategy_cards.length !== 3) return null;
  for (const c of raw.strategy_cards) {
    if (!c || typeof c.title !== "string" || typeof c.body !== "string") return null;
    const n = Number(c.number);
    if (!Number.isFinite(n) || n < 1 || n > 3) return null;
  }
  return /** @type {import("./section3WorkStyle.types.js").Section3WorkStyleData} */ (raw);
}

/**
 * @param {{
 *   data: import("./section3WorkStyle.types.js").Section3WorkStyleData;
 * }} props
 */
export default function Section3WorkStyle({ data }) {
  const uid = useId();

  return (
    <div className="section3-root">
      <div className="section3-top">
        <section className="section3-hero" aria-labelledby={`${uid}-hero-h`}>
          <p className="report-section-badge">{data.hero_insight.badge_title}</p>
          <h3 id={`${uid}-hero-h`} className="section3-hero__headline">
            {data.hero_insight.headline_segments.map((seg, i) => (
              <span key={`${uid}-hs-${i}`} className={seg.emphasize ? "section3-hero__em" : undefined}>
                {seg.text}
              </span>
            ))}
          </h3>
          <div className="section3-hero__proof">
            {data.hero_insight.proof_items.map((t) => (
              <p key={t} className="section3-hero__chip">
                {t}
              </p>
            ))}
          </div>
        </section>

        <section className="section3-core" aria-label={data.core_axis.title}>
          <h3 className="section3-core__title">{data.core_axis.title}</h3>
          <div className="section3-core__ring" aria-hidden>
            <div className="section3-core__ring-inner">
              <p className="section3-core__ring-label">{data.core_axis.circle_label}</p>
              <p className="section3-core__ring-sub">{data.core_axis.circle_sub}</p>
            </div>
          </div>
          <div className="section3-core__axes">
            {data.core_axis.axes.map((ax) => (
              <div key={`${uid}-ax-${ax.label}`} className="section3-core__axis">
                <span className="section3-core__axis-label">{ax.label}</span>
                <span className="section3-core__axis-desc">{ax.description}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="section3-shift">
        <div className="section3-shift__head">
          <span className="section3-shift__icon" aria-hidden>
            +
          </span>
          <h3 className="section3-shift__title">{data.shift_lanes_header.title}</h3>
        </div>
        <div className="section3-shift__lanes">
          {data.shift_lanes.map((lane, i) => (
            <div key={`${uid}-lane-${i}`} className="section3-shift__lane">
              <div className="section3-shift__col">
                <span className="section3-shift__micro">{data.shift_lanes_header.label_before}</span>
                <p className="section3-shift__text">{lane.before_text}</p>
              </div>
              <div className="section3-shift__arrow" aria-hidden>
                →
              </div>
              <div className="section3-shift__col">
                <span className="section3-shift__micro section3-shift__micro--after">
                  {data.shift_lanes_header.label_after}
                </span>
                <p className="section3-shift__text">{lane.after_text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section3-strategy">
        {data.strategy_cards.map((c) => (
          <article key={`${uid}-st-${c.number}`} className="section3-strategy__card">
            <div className="section3-strategy__head">
              <span className="section3-strategy__num" aria-hidden>
                {c.number}
              </span>
              <h4 className="section3-strategy__title">{c.title}</h4>
            </div>
            <p className="section3-strategy__body">{c.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
