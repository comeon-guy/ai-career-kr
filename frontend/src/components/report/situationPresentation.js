/**
 * Presentation helpers for Situation detail. Does not change source wording
 * except stripping a duplicated lead-in when the section title already says it.
 */

export function situationId(sc, fallback = 0) {
  return String(sc?.scenario_id || sc?.id || fallback);
}

export function asTextList(v) {
  if (!Array.isArray(v)) {
    const s = String(v || "").trim();
    return s ? [s] : [];
  }
  return v
    .map((x) => {
      if (typeof x === "string") return x.trim();
      if (x && typeof x === "object") return String(x.text || x.label || x.body || "").trim();
      return "";
    })
    .filter(Boolean);
}

export function oneLine(text, max = 88) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/** Index-row context: first clause, one line. Does not change source text. */
export function shortContext(text, max = 48) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const first = t.split(/(?<=다)[.,]\s+|[.。]\s+/)[0]?.trim() || t;
  return oneLine(first, max);
}

/** Join list/string into a single paragraph. Empty if no source. */
export function oneParagraph(v) {
  const rows = asTextList(v);
  if (!rows.length) return "";
  return rows.join(" ").replace(/\s+/g, " ").trim();
}

export function stripLeverageLead(text) {
  let t = String(text || "").trim();
  t = t.replace(/^이 직무에서 AI를 잘 (활용한다는|쓴다는) 것은[,:]?\s*/u, "");
  t = t.replace(/^.+?에게 AI를 잘 (활용한다는|쓴다는) 것은[,:]?\s*/u, "");
  t = t.replace(/^AI를 잘 (활용한다는|쓴다는) 것은[,:]?\s*/u, "");
  t = t.replace(/^Using AI well (as|for) .+? means[,:]?\s*/iu, "");
  return t.trim();
}

export function capabilityLabel(raw, report, lang = "ko") {
  const label = typeof raw === "string" ? raw : String(raw?.label || "").trim();
  if (!label) return "";
  if (lang === "en") return label;
  const buckets = [report?.knowledge, report?.skills, report?.abilities, report?.important_capability_labels];
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const row of bucket) {
      if (typeof row === "string") continue;
      const en = String(row?.element_name || row?.name || "").trim();
      const ko = String(row?.element_name_ko || row?.name_ko || "").trim();
      if (en && en.toLowerCase() === label.toLowerCase() && ko) return ko;
    }
  }
  return label;
}

export function uniqueCapabilities(list, report, lang = "ko") {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const label = capabilityLabel(raw, report, lang);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Detail header: short work title preferred; full title remains available. */
export function situationWorkTitle(sc, lang = "ko") {
  const short = selectorLabel(sc, lang);
  if (short) return short;
  return situationFullTitle(sc);
}

/** Core problem for scenario header (detail). Falls back to selector subtitle. */
export function situationCoreProblem(sc, lang = "ko") {
  const detail = String(sc?.core_problem_detail || "").trim();
  if (detail) return detail;
  return selectorSubtitle(sc, lang);
}

/** Detail header: full title only (never short label). */
export function situationFullTitle(sc) {
  return String(sc?.title_full || sc?.title || "").trim();
}

/** Tab/button label: short label only. Never ellipsis-truncate full title. */
export function selectorLabel(sc, lang = "ko") {
  const shortKo = String(sc?.title_short || sc?.nav_label || sc?.selector_label || sc?.short_title || "").trim();
  if (shortKo) return shortKo;
  const shortEn = String(sc?.title_short_en || "").trim();
  if (lang === "en" && shortEn) return shortEn;
  const title = String(sc?.title || sc?.title_full || "").trim();
  if (!title) return "";
  if (title.length <= 12) return title;
  const trimmed = title.replace(/\s*상황\s*$/u, "").trim();
  if (trimmed.length <= 16) return trimmed;
  return oneLine(trimmed, 16);
}

/** Selector row-2 context. Never derived from description truncation. */
export function selectorSubtitle(sc, lang = "ko") {
  if (lang === "en") {
    const subEn = String(
      sc?.core_problem_short_en || sc?.title_subtitle_en || sc?.core_problem_short || "",
    ).trim();
    if (subEn) return subEn;
  }
  return String(
    sc?.core_problem_short || sc?.title_subtitle || sc?.selector_subtitle || "",
  ).trim();
}

/** Map workflow_steps strings to v5 flow-item shape without changing semantics. */
export function normalizeWorkflowSteps(steps) {
  const rows = asTextList(steps);
  return rows.map((step, i) => {
    const num = String(i + 1).padStart(2, "0");
    if (step && typeof step === "object") {
      return {
        num,
        title: String(step.title || step.label || "").trim(),
        desc: String(step.text || step.description || step.body || "").trim(),
      };
    }
    const s = String(step || "").trim();
    const split = s.split(/[·:]\s/u, 2);
    if (split.length === 2 && split[0].length <= 22) {
      return { num, title: split[0].trim(), desc: split[1].trim() };
    }
    const words = s.split(/\s+/u);
    if (words.length > 4) {
      return { num, title: words.slice(0, 3).join(" "), desc: s };
    }
    return { num, title: "", desc: s };
  });
}
