/** 7-SOC review_contract helpers. Not a production feature. */

export const REVIEW_CONTRACT_V47 = "v47";
export const REVIEW_CONTRACT_TASK_ROLE_V2 = "task-role-v2";
export const REVIEW_CONTRACT_PRODUCTION_CANDIDATE = "production-candidate-v1";
export const CALIBRATION_7SOC = "7soc";

/** Visible only when review_contract=v47. Used to prove the served bundle. */
export const REVIEW_BUILD_ID = "fc-v47-r1-0828d";

/** KR runtime: US 7SOC review set empty */
export const REVIEW_SOCS = [];

/** Locked 7-SOC set. Single source of truth for local v47 preview auto-entry. */
export const validatedV47Socs = REVIEW_SOCS.map((item) => item.soc);

export function isReviewContractParam(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "v47" || v === "soc-ai-narrative-v47";
}

/** Position Map Task Role v2 review (7-SOC calibration descriptive shares). */
export function isPositionMapV2ReviewParam(value) {
  return String(value || "").trim().toLowerCase() === REVIEW_CONTRACT_TASK_ROLE_V2;
}

/** Final production contract candidate — 7-SOC UI acceptance (not LOCKED). */
export function isProductionCandidateReviewParam(value) {
  return String(value || "").trim().toLowerCase() === REVIEW_CONTRACT_PRODUCTION_CANDIDATE;
}

/** Cross-SOC Position Map v2 calibration view (all 7 on one chart). */
export function isPositionMapV2CalibrationParam(value) {
  return String(value || "").trim().toLowerCase() === CALIBRATION_7SOC;
}

/** True only for the locked 7-SOC review set. Unverified SOCs must not carry v47. */
export function isValidatedReviewSoc(soc) {
  const c = String(soc || "").trim();
  if (!c) return false;
  return validatedV47Socs.includes(c);
}

export function extraReportQuery(search = "") {
  const params = new URLSearchParams(
    search || (typeof window !== "undefined" ? window.location.search : ""),
  );
  const bits = [];
  if (params.get("source") === "candidate") {
    bits.push("source=candidate");
    const n = params.get("narrative");
    if (n) bits.push(`narrative=${encodeURIComponent(n)}`);
  }
  const rc = params.get("review_contract");
  if (rc) bits.push(`review_contract=${encodeURIComponent(rc)}`);
  return bits.length ? `&${bits.join("&")}` : "";
}

export function productionCandidateReviewUrl(soc, { tab = "analysis", view = "all-tasks" } = {}) {
  const params = new URLSearchParams();
  params.set("review_contract", REVIEW_CONTRACT_PRODUCTION_CANDIDATE);
  params.set("soc", String(soc || "").trim());
  params.set("tab", tab);
  if (view) params.set("view", view);
  return `/?${params.toString()}`;
}
