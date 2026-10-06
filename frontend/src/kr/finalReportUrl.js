/**
 * Canonical KR Final Report URL — Major Search must use this helper only.
 * Do not invent new report routes.
 */
import { publicUrl } from "../publicUrl.js";

export function buildFinalReportUrl(jobCd) {
  const id = String(jobCd || "").trim();
  if (!id) return publicUrl("/");
  return `${publicUrl("/")}?jobCd=${encodeURIComponent(id)}`;
}
