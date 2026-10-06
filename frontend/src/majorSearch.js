/**
 * Work24 canonical major search.
 * Search target is major_name only. Jobs come from the prejoined official edge list.
 * Does not read AcademyInfo, Crosswalk, or rerun Matcher.
 */
import occupationNameIndex from "./kr/occupationNameByJobCd.json";

export const DEBOUNCE_MS = 150;

/** @type {{ contract:string, majors:Array }|null} */
let majorCache = null;
let majorPromise = null;

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function ensureWork24MajorSearch() {
  if (majorCache?.majors?.length) return majorCache;
  if (!majorPromise) {
    majorPromise = import("./data/work24_major_search_v2.json").then((mod) => {
      const doc = mod.default || mod;
      if (doc?.contract !== "WORK24_MAJOR_SEARCH_V2") {
        throw new Error("WORK24_MAJOR_SEARCH_V2 contract mismatch");
      }
      if (!Array.isArray(doc.majors) || doc.majors.length !== 130) {
        throw new Error(`WORK24_MAJOR_SEARCH_V2 major_count invalid: ${doc?.majors?.length}`);
      }
      const ids = new Set();
      for (const row of doc.majors) {
        const id = String(row?.major_id || "");
        if (!id || ids.has(id)) throw new Error("WORK24_MAJOR_SEARCH_V2 major_id invalid");
        if (!String(row?.major_name || "").trim()) {
          throw new Error("WORK24_MAJOR_SEARCH_V2 major_name missing");
        }
        ids.add(id);
      }
      majorCache = doc;
      return doc;
    });
  }
  return majorPromise;
}

/**
 * Lexical search on Work24 major_name. Empty query → [].
 * Rank: exact, prefix, substring. Tie-break: major_name, major_id.
 * @param {string} q
 * @param {{ majors?: Array }} [opts]
 */
export function filterMajorIndex(q, opts = {}) {
  const needle = normalize(q);
  if (!needle) return { items: [], filterMs: 0 };
  const source = opts.majors || majorCache?.majors || [];
  const t0 = performance.now();
  const scored = [];
  for (const row of source) {
    const name = normalize(row.major_name);
    let rank = -1;
    if (name === needle) rank = 1;
    else if (name.startsWith(needle)) rank = 2;
    else if (name.includes(needle)) rank = 3;
    if (rank < 0) continue;
    scored.push({
      rank,
      name: row.major_name || "",
      id: row.major_id || "",
      item: row,
    });
  }
  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.name.localeCompare(b.name, "ko") ||
      a.id.localeCompare(b.id),
  );
  return {
    items: scored.map((s) => s.item),
    filterMs: performance.now() - t0,
  };
}

/**
 * Defensive jobCd dedupe. Order = occupationName 가나다 → jobCd.
 * @param {string[]} connectedJobCd
 */
export function buildRelatedOccupations(connectedJobCd) {
  const byJob = occupationNameIndex.by_jobCd || {};
  const seen = new Set();
  const out = [];
  for (const raw of connectedJobCd || []) {
    const jobCd = String(raw || "").trim();
    if (!jobCd || seen.has(jobCd)) continue;
    seen.add(jobCd);
    const occupationName = String(byJob[jobCd]?.occupation_name || "").trim();
    if (!occupationName) {
      throw new Error(`missing occupation name for jobCd=${jobCd}`);
    }
    out.push({ jobCd, occupationName });
  }
  out.sort(
    (a, b) =>
      a.occupationName.localeCompare(b.occupationName, "ko") || a.jobCd.localeCompare(b.jobCd),
  );
  return out;
}
