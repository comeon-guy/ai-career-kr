/**
 * User-facing occupation naming contract.
 * Format: {title_ko} ({canonical English title})
 * SOC codes stay internal (routes, API, provenance, QA) — never show in UI labels.
 */
import { getOccupationIndexSync } from "./occupationSearch.js";

export function resolveCanonicalOccupationTitles({
  socCode = "",
  titleKo = "",
  titleEn = "",
} = {}) {
  const soc = String(socCode || "").trim();
  let ko = String(titleKo || "").trim();
  let en = String(titleEn || "").trim();
  if (soc && (!ko || !en)) {
    const row = getOccupationIndexSync().find((r) => String(r.soc_code || "").trim() === soc);
    if (row) {
      if (!ko) ko = String(row.occupation_title_ko || row.occupation_title || "").trim();
      if (!en) en = String(row.occupation_title_en || "").trim();
    }
  }
  return { titleKo: ko, titleEn: en, socCode: soc };
}

/** @returns {string} KO (EN) — never includes SOC code */
export function formatOccupationUserFacing(opts = {}) {
  const { titleKo, titleEn } = resolveCanonicalOccupationTitles(opts);
  if (titleKo && titleEn) return `${titleKo} (${titleEn})`;
  return titleKo || titleEn || "";
}
