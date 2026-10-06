/**
 * Section 2 Value Shift parsers — lean (v46) + optional v45 legacy decor.
 * Accordion titles are presentation constants; LLM supplies bodies only.
 */

/** @type {readonly [string, string]} */
export const DECLINE_ACCORDION_TITLES_KO = ["왜 낮아지나", "그래도 완전히 사라지지 않는 이유"];
/** @type {readonly [string, string]} */
export const RISE_ACCORDION_TITLES_KO = ["왜 높아지나", "어떤 역량이 중요해지나"];
/** @type {readonly [string, string]} */
export const DECLINE_ACCORDION_TITLES_EN = ["Why value declines", "Why it does not disappear entirely"];
/** @type {readonly [string, string]} */
export const RISE_ACCORDION_TITLES_EN = ["Why value rises", "Which capabilities matter more"];

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function cleanBullets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (x && typeof x === "object") {
        return String(/** @type {{ text?: unknown }} */ (x).text || "").trim();
      }
      return String(x || "").trim();
    })
    .filter(Boolean);
}

/**
 * @param {unknown} raw
 * @param {readonly [string, string]} titles
 * @returns {{ title: string; body: string }[]}
 */
function normalizeAccordions(raw, titles) {
  const out = [];
  if (Array.isArray(raw)) {
    for (let i = 0; i < Math.min(raw.length, 2); i++) {
      const a = raw[i];
      if (!a || typeof a !== "object") continue;
      const body = String(/** @type {{ body?: unknown }} */ (a).body || "").trim();
      if (!body) continue;
      out.push({ title: titles[i] || titles[0], body });
    }
  }
  return out;
}

/**
 * Accepts either accordion bodies or conceptual why/why_not_disappear / why/important_capabilities.
 * @param {unknown} block
 * @param {"decline" | "rise"} kind
 * @param {boolean} isKo
 * @returns {{ bullets: string[]; accordions: { title: string; body: string }[] } | null}
 */
export function normalizeValueShiftWorkBlock(block, kind, isKo = true) {
  if (!block || typeof block !== "object") return null;
  const b = /** @type {Record<string, unknown>} */ (block);
  const bullets = cleanBullets(b.bullets);
  const titles =
    kind === "decline"
      ? isKo
        ? DECLINE_ACCORDION_TITLES_KO
        : DECLINE_ACCORDION_TITLES_EN
      : isKo
        ? RISE_ACCORDION_TITLES_KO
        : RISE_ACCORDION_TITLES_EN;

  let accordions = normalizeAccordions(b.accordions, titles);
  if (accordions.length < 2) {
    if (kind === "decline") {
      const why = String(b.why || "").trim();
      const whyNot = String(b.why_not_disappear || "").trim();
      if (why || whyNot) {
        accordions = [
          { title: titles[0], body: why },
          { title: titles[1], body: whyNot },
        ].filter((a) => a.body);
      }
    } else {
      const why = String(b.why || "").trim();
      const caps = String(b.important_capabilities || "").trim();
      if (why || caps) {
        accordions = [
          { title: titles[0], body: why },
          { title: titles[1], body: caps },
        ].filter((a) => a.body);
      }
    }
  } else {
    // Force presentation-constant titles even when LLM sent titles.
    accordions = accordions.map((a, i) => ({ title: titles[i] || a.title, body: a.body }));
  }

  if (bullets.length === 0 || accordions.length < 2) return null;
  return { bullets, accordions };
}

/**
 * Lean Section 02: decline_work + rise_work only.
 * @param {unknown} raw
 * @param {{ lang?: string }} [opts]
 * @returns {{
 *   decline_work: { bullets: string[]; accordions: { title: string; body: string }[] };
 *   rise_work: { bullets: string[]; accordions: { title: string; body: string }[] };
 *   has_legacy_decor: boolean;
 *   hero_insight?: unknown;
 *   gravity_shift?: unknown;
 *   comparison_rows?: unknown;
 * } | null}
 */
export function parseSection2ValueShiftLean(raw, opts = {}) {
  if (!raw || typeof raw !== "object") return null;
  const isKo = (opts.lang || "ko") !== "en";
  const r = /** @type {Record<string, unknown>} */ (raw);
  const decline = normalizeValueShiftWorkBlock(r.decline_work, "decline", isKo);
  const rise = normalizeValueShiftWorkBlock(r.rise_work, "rise", isKo);
  if (!decline || !rise) return null;

  const hasLegacy =
    Boolean(r.hero_insight && typeof r.hero_insight === "object") &&
    Boolean(r.gravity_shift && typeof r.gravity_shift === "object") &&
    Array.isArray(r.comparison_rows) &&
    r.comparison_rows.length > 0;

  /** @type {ReturnType<typeof parseSection2ValueShiftLean>} */
  const out = {
    decline_work: decline,
    rise_work: rise,
    has_legacy_decor: hasLegacy,
  };
  if (hasLegacy) {
    out.hero_insight = r.hero_insight;
    out.gravity_shift = r.gravity_shift;
    out.comparison_rows = r.comparison_rows;
  }
  return out;
}

/**
 * Backward-compatible entry: lean-first. Returns null only when decline/rise core is missing.
 * Legacy hero/gravity/comparison are optional (v45 may include them; v46 may omit).
 * @param {unknown} raw
 * @param {{ lang?: string }} [opts]
 */
export function parseSection2ValueShift(raw, opts = {}) {
  return parseSection2ValueShiftLean(raw, opts);
}

/**
 * True when v45 decorative blocks are present and structurally usable by legacy Section2 UI.
 * @param {unknown} data
 */
export function hasSection2LegacyDecor(data) {
  if (!data || typeof data !== "object") return false;
  const d = /** @type {Record<string, unknown>} */ (data);
  if (d.has_legacy_decor === true) return true;
  const hi = d.hero_insight;
  const gs = d.gravity_shift;
  const rows = d.comparison_rows;
  if (!hi || typeof hi !== "object") return false;
  if (!gs || typeof gs !== "object") return false;
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const h = /** @type {Record<string, unknown>} */ (hi);
  if (!Array.isArray(h.headline_segments) || h.headline_segments.length === 0) return false;
  return true;
}
