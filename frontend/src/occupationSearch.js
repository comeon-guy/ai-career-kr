/**
 * Occupation title search — local index filter only.
 * Never fetch task/evidence/profile during typing.
 */
import staticIndex from "./data/occupation_search_index_v1.json";
import {
  REVIEW_SOCS,
  isProductionCandidateReviewParam,
} from "./reviewContract.js";
import { resolveApiBase } from "./apiBase.js";

const DEBOUNCE_MS = 150;

/** @type {Array<{soc_code:string, occupation_title_en?:string, occupation_title_ko?:string, occupation_title?:string}>|null} */
let cachedIndex = null;
let indexLoadPromise = null;

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function seedFromStatic() {
  const items = Array.isArray(staticIndex?.items) ? staticIndex.items : [];
  return items.map((row) => ({
    soc_code: String(row.soc_code || "").trim(),
    occupation_title_en: String(row.occupation_title_en || "").trim(),
    occupation_title_ko: String(row.occupation_title_ko || "").trim(),
  })).filter((r) => r.soc_code);
}

function reviewSeed() {
  return REVIEW_SOCS.map((r) => ({
    soc_code: r.soc,
    occupation_title_en: r.titleEn,
    occupation_title_ko: r.titleKo,
  }));
}

export function getOccupationIndexSync({ reviewOnly = false } = {}) {
  if (reviewOnly) return reviewSeed();
  if (cachedIndex?.length) return cachedIndex;
  cachedIndex = seedFromStatic();
  return cachedIndex;
}

export async function ensureOccupationIndex({ reviewOnly = false } = {}) {
  if (reviewOnly) return reviewSeed();
  if (cachedIndex?.length) return cachedIndex;
  if (!indexLoadPromise) {
    indexLoadPromise = (async () => {
      const local = seedFromStatic();
      cachedIndex = local;
      // Optional refresh when an API origin is configured. Static index remains the Pages source.
      try {
        const base = resolveApiBase();
        if (!base) return cachedIndex;
        const res = await fetch(`${base}/jobs/occupation-index?lang=ko`, {
          headers: { Accept: "application/json" },
          cache: "force-cache",
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          if (items.length) {
            cachedIndex = items.map((row) => ({
              soc_code: String(row.soc_code || "").trim(),
              occupation_title_en: String(row.occupation_title_en || "").trim(),
              occupation_title_ko: String(row.occupation_title_ko || row.occupation_title || "").trim(),
            })).filter((r) => r.soc_code);
          }
        }
      } catch {
        /* keep static */
      }
      return cachedIndex;
    })();
  }
  return indexLoadPromise;
}

/**
 * @param {string} q
 * @param {{ lang?: string, limit?: number, reviewOnly?: boolean }} [opts]
 */
export function filterOccupationIndex(q, opts = {}) {
  const tFilter0 = performance.now();
  const needle = normalize(q);
  const lang = opts.lang === "en" ? "en" : "ko";
  const limit = Math.max(1, Math.min(Number(opts.limit) || 15, 30));
  if (!needle) {
    return { items: [], filterMs: 0 };
  }
  const source = getOccupationIndexSync({ reviewOnly: Boolean(opts.reviewOnly) });
  const scored = [];
  for (const row of source) {
    const soc = row.soc_code;
    const titleEn = row.occupation_title_en || "";
    const titleKo = row.occupation_title_ko || row.occupation_title || "";
    const display = lang === "ko" ? titleKo || titleEn : titleEn || titleKo;
    const haySoc = normalize(soc);
    const hayEn = normalize(titleEn);
    const hayKo = normalize(titleKo);
    let rank = -1;
    if (haySoc.includes(needle)) rank = haySoc.startsWith(needle) ? 0 : 1;
    else if (hayKo.includes(needle)) rank = hayKo.startsWith(needle) ? 2 : 3;
    else if (hayEn.includes(needle)) rank = hayEn.startsWith(needle) ? 4 : 5;
    if (rank < 0) continue;
    scored.push({
      rank,
      item: {
        soc_code: soc,
        occupation_title: display,
      },
    });
  }
  scored.sort((a, b) => a.rank - b.rank || a.item.soc_code.localeCompare(b.item.soc_code));
  const items = scored.slice(0, limit).map((s) => s.item);
  return { items, filterMs: performance.now() - tFilter0 };
}

export function isReviewSearchMode(search = "") {
  try {
    const params = new URLSearchParams(
      search || (typeof window !== "undefined" ? window.location.search : ""),
    );
    return isProductionCandidateReviewParam(params.get("review_contract"));
  } catch {
    return false;
  }
}

export function recordSearchPerf(sample) {
  if (typeof window === "undefined") return;
  const bucket = (window.__FC_SEARCH_PERF__ = window.__FC_SEARCH_PERF__ || { samples: [] });
  bucket.samples.push({ ...sample, at: Date.now() });
  if (bucket.samples.length > 40) bucket.samples.shift();
  bucket.last = sample;
}

export { DEBOUNCE_MS };
