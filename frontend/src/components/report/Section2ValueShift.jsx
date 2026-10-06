import { useId } from "react";
import "./section2-value-shift.css";
import {
  hasSection2LegacyDecor,
  parseSection2ValueShift as parseSection2ValueShiftLeanFirst,
  parseSection2ValueShiftLean,
} from "./section2ValueShiftParse.js";

export {
  hasSection2LegacyDecor,
  parseSection2ValueShiftLean,
} from "./section2ValueShiftParse.js";

/**
 * Lean-first parser: decline_work + rise_work alone are enough for Section 02 != null.
 * Legacy hero_insight / gravity_shift / comparison_rows are optional (v45 may include them).
 * @param {unknown} raw
 * @param {{ lang?: string }} [opts]
 */
export function parseSection2ValueShift(raw, opts = {}) {
  return parseSection2ValueShiftLeanFirst(raw, opts);
}

function DeclineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M5 7 L10 11 L14 10 L19 17"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18 H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function RiseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M5 17 L10 13 L14 14 L19 7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18 H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/**
 * @param {{
 *   data: import("./section2ValueShift.types.js").Section2ValueShiftData;
 *   lang: "ko" | "en";
 * }} props
 */
export default function Section2ValueShift({ data, lang }) {
  const uid = useId();
  const isKo = lang !== "en";
  const showLegacy = hasSection2LegacyDecor(data);
  const th = {
    work: isKo ? "업무 영역" : "Work area",
    decline: isKo ? "가치가 낮아질 가능성이 큰 일" : "Likely to lose relative value",
    rise: isKo ? "가치가 높아질 가능성이 큰 일" : "Likely to gain relative value",
  };
  const titles = {
    decline: isKo ? "가치가 낮아질 가능성이 큰 업무" : "Work likely to lose relative value",
    rise: isKo ? "가치가 높아질 가능성이 큰 업무" : "Work likely to gain relative value",
  };
  const declineWork = data?.decline_work || { bullets: [], accordions: [] };
  const riseWork = data?.rise_work || { bullets: [], accordions: [] };

  return (
    <div className="section2-root">
      {showLegacy ? (
        <>
          <div className="section2-grid--top">
            <section className="section2-card--insight" aria-label={data.hero_insight.eyebrow}>
              <p className="report-section-badge">{data.hero_insight.eyebrow}</p>
              <div className="section2-insight__body">
                <h3 className="section2-insight__headline">
                  {data.hero_insight.headline_segments.map((seg, i) => (
                    <span key={`${uid}-h-${i}`} className={seg.emphasize ? "section2-insight__em" : undefined}>
                      {seg.text}
                    </span>
                  ))}
                </h3>
                {data.hero_insight.supporting_text ? (
                  <p className="section2-insight__support">{data.hero_insight.supporting_text}</p>
                ) : null}
              </div>
              {data.hero_insight.tags && data.hero_insight.tags.length > 0 ? (
                <ul className="section2-insight__tags" aria-label={isKo ? "관련 키워드" : "Related tags"}>
                  {data.hero_insight.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="section2-card--gravity" aria-label={data.gravity_shift.title}>
              <h3 className="section2-gravity__title">{data.gravity_shift.title}</h3>
              <div className="section2-gravity__rail">
                <div className="section2-gravity__box">
                  <p className="section2-gravity__box-label">{data.gravity_shift.from_box.label}</p>
                  <p className="section2-gravity__box-text">{data.gravity_shift.from_box.text}</p>
                </div>
                <div className="section2-gravity__arrow" aria-hidden>
                  <span className="section2-gravity__arrow-char">→</span>
                </div>
                <div className="section2-gravity__box">
                  <p className="section2-gravity__box-label">{data.gravity_shift.to_box.label}</p>
                  <p className="section2-gravity__box-text">{data.gravity_shift.to_box.text}</p>
                </div>
              </div>
              {data.gravity_shift.footer_note ? (
                <p className="section2-gravity__footer">{data.gravity_shift.footer_note}</p>
              ) : null}
            </section>
          </div>

          <div className="section2-table-shell">
            <table className="section2-table">
              <colgroup>
                <col className="section2-col--work" />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th className="section2-th--work" scope="col">
                    {th.work}
                  </th>
                  <th className="section2-th--decline" scope="col">
                    {th.decline}
                  </th>
                  <th className="section2-th--rise" scope="col">
                    {th.rise}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.comparison_rows.map((row, i) => (
                  <tr key={`${uid}-row-${i}`}>
                    <td className="section2-td--work">{row.work_area}</td>
                    <td className="section2-td--decline">{row.decline_focus}</td>
                    <td className="section2-td--rise">{row.rise_focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div className="section2-grid--bottom">
        <section
          className="section2-card--pillar section2-card--decline"
          aria-labelledby={`${uid}-decline-title`}
        >
          <div className="section2-pillar__head">
            <span className="section2-pillar__icon" aria-hidden>
              <DeclineIcon />
            </span>
            <h4 id={`${uid}-decline-title`} className="section2-pillar__title">
              {titles.decline}
            </h4>
          </div>
          <ul className="section2-pillar__list">
            {(declineWork.bullets || []).map((item, i) => (
              <li key={`${uid}-d-${i}`}>{item}</li>
            ))}
          </ul>
          <div className="section2-pillar__acc-wrap">
            {(declineWork.accordions || []).map((acc, i) => (
              <details key={`${uid}-da-${i}`} className="section2-acc">
                <summary>
                  <span>{acc.title}</span>
                  <span className="section2-acc__chev" aria-hidden>
                    <span className="section2-acc__plus">+</span>
                    <span className="section2-acc__minus">−</span>
                  </span>
                </summary>
                <div className="section2-acc__body">{acc.body}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="section2-card--pillar section2-card--rise" aria-labelledby={`${uid}-rise-title`}>
          <div className="section2-pillar__head">
            <span className="section2-pillar__icon" aria-hidden>
              <RiseIcon />
            </span>
            <h4 id={`${uid}-rise-title`} className="section2-pillar__title">
              {titles.rise}
            </h4>
          </div>
          <ul className="section2-pillar__list">
            {(riseWork.bullets || []).map((item, i) => (
              <li key={`${uid}-r-${i}`}>{item}</li>
            ))}
          </ul>
          <div className="section2-pillar__acc-wrap">
            {(riseWork.accordions || []).map((acc, i) => (
              <details key={`${uid}-ra-${i}`} className="section2-acc">
                <summary>
                  <span>{acc.title}</span>
                  <span className="section2-acc__chev" aria-hidden>
                    <span className="section2-acc__plus">+</span>
                    <span className="section2-acc__minus">−</span>
                  </span>
                </summary>
                <div className="section2-acc__body">{acc.body}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
