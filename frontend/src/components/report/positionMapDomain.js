/**
 * Position Map Distribution Zoom — linear domain from occupation score distribution.
 * Does not change scores; only visualization viewport.
 */

export const SCORE_LEGAL_MIN = 0;
export const SCORE_LEGAL_MAX = 100;

/** Padding fraction of P05–P95 span (each side). */
export const DOMAIN_PADDING = 0.1;

/**
 * Minimum visible span after padding (0–100 score points).
 * From production 894-occupation distribution (2026-08-31):
 *   AI P95−P05 ≈ 34 → min 35
 *   ACS P95−P05 ≈ 14 → min 28 (avoid exaggerated zoom)
 */
export const MIN_SPAN_AI = 35;
export const MIN_SPAN_HUMAN = 28;

/** Extra margin when expanding domain to include the current occupation. */
export const CURRENT_OCCUPATION_PAD = 3;

/**
 * Linear percentile (0–100). Empty → null.
 * @param {number[]} values
 * @param {number} p
 */
export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const xs = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!xs.length) return null;
  const clamped = Math.min(100, Math.max(0, Number(p)));
  if (xs.length === 1) return xs[0];
  const k = ((xs.length - 1) * clamped) / 100;
  const f = Math.floor(k);
  const c = Math.min(f + 1, xs.length - 1);
  if (f === c) return xs[f];
  return xs[f] + (xs[c] - xs[f]) * (k - f);
}

function clampScore(v) {
  return Math.min(SCORE_LEGAL_MAX, Math.max(SCORE_LEGAL_MIN, v));
}

/**
 * Expand [low, high] to at least minSpan, centered on the midpoint, then clamp to legal range.
 */
export function ensureMinSpan(low, high, minSpan) {
  let lo = Number(low);
  let hi = Number(high);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { min: SCORE_LEGAL_MIN, max: SCORE_LEGAL_MAX };
  }
  if (hi < lo) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const need = Math.max(0, Number(minSpan) || 0);
  let span = hi - lo;
  if (span < need) {
    const mid = (lo + hi) / 2;
    lo = mid - need / 2;
    hi = mid + need / 2;
    span = hi - lo;
  }
  if (lo < SCORE_LEGAL_MIN) {
    hi = Math.min(SCORE_LEGAL_MAX, hi + (SCORE_LEGAL_MIN - lo));
    lo = SCORE_LEGAL_MIN;
  }
  if (hi > SCORE_LEGAL_MAX) {
    lo = Math.max(SCORE_LEGAL_MIN, lo - (hi - SCORE_LEGAL_MAX));
    hi = SCORE_LEGAL_MAX;
  }
  if (hi - lo < need && need <= SCORE_LEGAL_MAX - SCORE_LEGAL_MIN) {
    // Legal range too tight after clamp — keep clamped bounds.
  }
  return { min: lo, max: hi };
}

/**
 * Apply padding to a P05–P95 interval.
 */
export function applyPadding(low, high, padFrac = DOMAIN_PADDING) {
  const span = Math.max(0, high - low);
  const pad = span * (Number.isFinite(padFrac) ? padFrac : DOMAIN_PADDING);
  return { min: low - pad, max: high + pad };
}

/**
 * Expand domain so current score stays inside with margin (not flush to edge).
 */
export function includeCurrentScore(domainMin, domainMax, current, pad = CURRENT_OCCUPATION_PAD) {
  let lo = domainMin;
  let hi = domainMax;
  if (!Number.isFinite(current)) return { min: lo, max: hi };
  const margin = Number.isFinite(pad) ? pad : CURRENT_OCCUPATION_PAD;
  lo = Math.min(lo, current - margin);
  hi = Math.max(hi, current + margin);
  return { min: clampScore(lo), max: clampScore(hi) };
}

/**
 * Build linear zoom domain for one axis from raw 0–100 scores.
 * @param {number[]} scores
 * @param {{ current?: number; minSpan?: number; padFrac?: number; currentPad?: number }} [opts]
 */
export function computeAxisDomain(scores, opts = {}) {
  const list = (Array.isArray(scores) ? scores : [])
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  const minSpan = opts.minSpan ?? MIN_SPAN_AI;
  const padFrac = opts.padFrac ?? DOMAIN_PADDING;
  const currentPad = opts.currentPad ?? CURRENT_OCCUPATION_PAD;

  if (list.length < 2) {
    let lo = SCORE_LEGAL_MIN;
    let hi = SCORE_LEGAL_MAX;
    if (Number.isFinite(opts.current)) {
      const mid = opts.current;
      lo = clampScore(mid - minSpan / 2);
      hi = clampScore(mid + minSpan / 2);
      ({ min: lo, max: hi } = ensureMinSpan(lo, hi, minSpan));
    }
    return {
      min: lo,
      max: hi,
      p05: null,
      p95: null,
      p50: percentile(list, 50),
    };
  }

  const p05 = percentile(list, 5);
  const p95 = percentile(list, 95);
  const p50 = percentile(list, 50);
  let { min: lo, max: hi } = applyPadding(p05, p95, padFrac);
  ({ min: lo, max: hi } = ensureMinSpan(lo, hi, minSpan));
  ({ min: lo, max: hi } = includeCurrentScore(lo, hi, opts.current, currentPad));
  // Re-assert min span after including current (edge outliers).
  ({ min: lo, max: hi } = ensureMinSpan(lo, hi, minSpan));
  lo = clampScore(lo);
  hi = clampScore(hi);
  if (hi <= lo) {
    hi = Math.min(SCORE_LEGAL_MAX, lo + minSpan);
    lo = Math.max(SCORE_LEGAL_MIN, hi - minSpan);
  }

  return { min: lo, max: hi, p05, p95, p50 };
}

/**
 * Full chart domain from occupation points + current occupation scores.
 * @param {Array<{ aeiScore?: number; acsScore?: number }>} points
 * @param {{ aeiScore: number; acsScore: number }} current
 */
export function computePositionMapDomain(points, current) {
  const aeiScores = [];
  const acsScores = [];
  for (const pt of points || []) {
    const a = Number(pt?.aeiScore);
    const c = Number(pt?.acsScore);
    if (Number.isFinite(a)) aeiScores.push(a);
    if (Number.isFinite(c)) acsScores.push(c);
  }
  // Include current in percentile base so domain reflects full set when cloud excludes self.
  if (Number.isFinite(current?.aeiScore)) aeiScores.push(current.aeiScore);
  if (Number.isFinite(current?.acsScore)) acsScores.push(current.acsScore);

  const x = computeAxisDomain(aeiScores, {
    current: current?.aeiScore,
    minSpan: MIN_SPAN_AI,
  });
  const y = computeAxisDomain(acsScores, {
    current: current?.acsScore,
    minSpan: MIN_SPAN_HUMAN,
  });

  return {
    xMin: x.min,
    xMax: x.max,
    yMin: y.min,
    yMax: y.max,
    xP05: x.p05,
    xP95: x.p95,
    yP05: y.p05,
    yP95: y.p95,
  };
}

/** Linear map score → [0, 1] within domain. */
export function scoreToUnit(score, domainMin, domainMax) {
  const span = domainMax - domainMin;
  if (!(span > 0) || !Number.isFinite(score)) return 0.5;
  return (score - domainMin) / span;
}

/**
 * AI impact (x) + human judgment (y) → plot % (left 0–100, top 0–100, Y inverted).
 */
export function scoresToPlotPct(aeiScore, acsScore, domain) {
  const ux = scoreToUnit(aeiScore, domain.xMin, domain.xMax);
  const uy = scoreToUnit(acsScore, domain.yMin, domain.yMax);
  return {
    left: ux * 100,
    top: (1 - uy) * 100,
  };
}

export function isScoreInDomain(aeiScore, acsScore, domain, epsilon = 1e-6) {
  if (!Number.isFinite(aeiScore) || !Number.isFinite(acsScore)) return false;
  return (
    aeiScore >= domain.xMin - epsilon &&
    aeiScore <= domain.xMax + epsilon &&
    acsScore >= domain.yMin - epsilon &&
    acsScore <= domain.yMax + epsilon
  );
}

/**
 * Nice tick values within [min, max] for numeric axis labels.
 * @param {number} min
 * @param {number} max
 * @param {number} [targetCount=6]
 * @returns {number[]}
 */
export function niceTicks(min, max, targetCount = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const span = max - min;
  const rough = span / Math.max(2, targetCount - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1e-9))));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * mag);
  let step = candidates[0];
  for (const c of candidates) {
    if (span / c <= targetCount + 1) {
      step = c;
      break;
    }
    step = c;
  }
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    const rounded = Math.round(v * 1000) / 1000;
    if (rounded >= min - 1e-9 && rounded <= max + 1e-9) ticks.push(rounded);
  }
  if (!ticks.length) {
    ticks.push(Math.round(min), Math.round(max));
  }
  return ticks;
}

/** Format tick for display (prefer integers when close). */
export function formatTick(v) {
  if (!Number.isFinite(v)) return "";
  const r = Math.round(v);
  if (Math.abs(v - r) < 0.05) return String(r);
  return String(Math.round(v * 10) / 10);
}
