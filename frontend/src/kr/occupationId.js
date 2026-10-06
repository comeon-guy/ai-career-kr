/** KR occupation identity — occupation_id is source of truth. */
export function resolveOccupationId(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    const id = src.occupation_id || src.profile?.occupation_id;
    if (id != null && String(id).trim()) return String(id).trim();
  }
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    // Legacy shell field only — must already hold KR occupation_id, never US SOC.
    const legacy = src.soc_code || src.profile?.soc_code || src.socCode;
    if (legacy != null && String(legacy).trim()) return String(legacy).trim();
  }
  return "";
}

export function isUsSocCode(value) {
  return /^\d{2}-\d{4}\.\d{2}$/.test(String(value || "").trim());
}
