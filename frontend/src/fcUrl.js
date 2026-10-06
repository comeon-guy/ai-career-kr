import {
  REVIEW_CONTRACT_V47,
  REVIEW_CONTRACT_TASK_ROLE_V2,
  REVIEW_CONTRACT_PRODUCTION_CANDIDATE,
  isReviewContractParam,
  isPositionMapV2ReviewParam,
  isProductionCandidateReviewParam,
  isValidatedReviewSoc,
} from "./reviewContract.js";

/** Query keys that must survive job/tab navigation when already present. */
const PRESERVE_KEYS = ["source", "narrative", "lang", "utm_source", "calibration", "view", "data_contract", "attempt"];

function currentSearchString(search) {
  if (search !== undefined && search !== null) return String(search);
  if (typeof window !== "undefined") return window.location.search || "";
  return "";
}

function currentPathname(pathname) {
  if (pathname) return pathname;
  if (typeof window === "undefined") return "/";
  const p = window.location.pathname || "/";
  if (p === "/job-analysis") return "/";
  if (p === "/future-competitiveness") return "/future-competitiveness";
  return p === "/" ? "/" : "/";
}

/** Vite dev server only. Production builds never auto-enter v47. */
function isLocalV47AutoEntry() {
  return Boolean(import.meta.env && import.meta.env.DEV);
}

/**
 * Canonical Future Competitiveness URL.
 * Existing keys: `soc`, `tab`, `review_contract`. Do not invent new names.
 * `tab=method` opens the shared Analysis Method page (optional `#section` hash).
 *
 * - `soc` undefined → keep current soc; `null`/"" → omit (landing)
 * - `tab` always written when provided (default analysis)
 * - DEV/localhost: opening a validated 7 SOC on tab=analysis may auto-enter v47
 *   (explicit calibration/reference). tab=reports (Library) never auto-injects v47.
 * - production: never injects v47; only preserves if already present on a 7 SOC
 * - landing / unverified SOC → no review_contract (894 HOLD)
 * - `reviewContract: null` → omit even in DEV (share links / normal Library)
 * - `hash` string → append `#…` (leading # optional); `""` clears hash
 */
export function buildFutureCompetitivenessUrl({
  soc,
  tab = "analysis",
  reviewContract,
  search,
  pathname,
  hash,
  view,
  attempt,
} = {}) {
  const current = new URLSearchParams(currentSearchString(search));
  const next = new URLSearchParams();

  const socVal = soc === undefined ? current.get("soc") : soc;
  const destSoc = socVal != null && String(socVal).trim() ? String(socVal).trim() : "";
  const destTab = tab ? String(tab) : "analysis";
  const destIsValidated = Boolean(destSoc) && isValidatedReviewSoc(destSoc);
  const destOpensReport = Boolean(destSoc) && (destTab === "analysis" || destTab === "reports");

  const requestedRc = reviewContract === undefined ? current.get("review_contract") : reviewContract;
  // Position Map Task Role v2 / production-candidate review must not be rewritten to narrative v47.
  const keepPositionMapV2 =
    reviewContract !== null &&
    destIsValidated &&
    destOpensReport &&
    (isPositionMapV2ReviewParam(requestedRc) ||
      (reviewContract === undefined && isPositionMapV2ReviewParam(current.get("review_contract"))));
  const productionCandidateActive =
    isProductionCandidateReviewParam(requestedRc) ||
    (reviewContract === undefined &&
      isProductionCandidateReviewParam(current.get("review_contract")));
  // Keep candidate contract on validated SOC detail AND on reports/analysis list (no soc).
  const keepProductionCandidate =
    reviewContract !== null &&
    productionCandidateActive &&
    ((destIsValidated && destOpensReport) ||
      (!destSoc && (destTab === "reports" || destTab === "analysis" || destTab === "method" || destTab === "competency")));
  if (keepProductionCandidate) {
    next.set("review_contract", REVIEW_CONTRACT_PRODUCTION_CANDIDATE);
  } else if (keepPositionMapV2) {
    next.set("review_contract", REVIEW_CONTRACT_TASK_ROLE_V2);
  } else {
    const alreadyReview = requestedRc && isReviewContractParam(requestedRc);
    // Library (tab=reports) must use production report snapshot — never auto-inject v47.
    // Explicit ?review_contract=v47 in the URL is still preserved via alreadyReview.
    const autoEnterLocal =
      reviewContract !== null &&
      isLocalV47AutoEntry() &&
      destIsValidated &&
      destTab === "analysis";
    const keepReview = destIsValidated && (alreadyReview || autoEnterLocal);
    if (keepReview) {
      next.set("review_contract", REVIEW_CONTRACT_V47);
    }
  }

  if (destSoc) next.set("soc", destSoc);

  if (tab) next.set("tab", String(tab));

  const destView = view === undefined ? current.get("view") : view;
  if (destView != null && String(destView).trim()) next.set("view", String(destView).trim());

  // Diagnosis Attempt identity for result route (Result SoT — not modal-only).
  if (String(next.get("view") || "") === "result") {
    const attemptVal = attempt === undefined ? current.get("attempt") : attempt;
    if (attemptVal != null && String(attemptVal).trim()) next.set("attempt", String(attemptVal).trim());
  }

  for (const key of PRESERVE_KEYS) {
    if (key === "view" && view !== undefined) continue;
    if (key === "attempt") continue;
    const v = current.get(key);
    if (v && !next.has(key)) next.set(key, v);
  }

  const qs = next.toString();
  const path = currentPathname(pathname);
  const base = qs ? `${path}?${qs}` : path;
  if (hash === undefined) return base;
  const raw = String(hash || "").replace(/^#/, "").trim();
  return raw ? `${base}#${raw}` : base;
}

/** Shared Analysis Method page URL with optional section hash. */
export function buildAnalysisMethodUrl({ hash, search, pathname, soc } = {}) {
  return buildFutureCompetitivenessUrl({
    tab: "method",
    soc,
    search,
    pathname,
    hash: hash || "",
  });
}

export function jobDetailSearchHasSoc(search) {
  return Boolean(String(new URLSearchParams(currentSearchString(search)).get("soc") || "").trim());
}
