/**

 * 인사이트·서사: % 재진술, 문체·섹션 중복 정리

 */

import {
  applyCanonicalReportRootLabels,
  applyCanonicalUiLabels,
} from "../components/report/canonicalUiLabels.js";
import {
  buildSection3WorkStyleFallbackChips,
  cleanLegacyProofItems,
} from "./taskStructureNarrative.js";

import {

  clearIfRedundantWithFingerprints,

  collectTopInsightFingerprints,

  polishInsightText,

} from "./narrativeQuality.js";

import {

  HAS_PERCENT,

  isBrokenInsightSentence,

  normalizeForCompare,

  stripPercentRestatement,

  textsAreRedundant,

} from "./narrativeCore.js";



export { isBrokenInsightSentence, stripPercentRestatement, normalizeForCompare, textsAreRedundant };



export function firstInsightSentence(text, maxLen = 220) {

  const t = stripPercentRestatement(text) || String(text || "").trim();

  if (!t || isBrokenInsightSentence(t)) return "";

  const seps = [". ", "다. ", "습니다. ", "큽니다. ", "요. "];

  for (const sep of seps) {

    const i = t.indexOf(sep);

    if (i > 0 && i < maxLen) return t.slice(0, i + sep.trim().length).trim();

  }

  if (t.length > maxLen) {

    const cut = t.slice(0, maxLen).lastIndexOf(" ");

    return `${t.slice(0, cut > 40 ? cut : maxLen).trim()}…`;

  }

  return t;

}



const SANITIZE_STRING_KEYS = new Set([

  "supporting_text",

  "body",

  "footer_note",

  "decline_focus",

  "rise_focus",

  "before_text",

  "after_text",

  "description",

  "circle_sub",

  "value_shift_conclusion",

  "career_positioning_body",

]);



function structureInterp(report, lang) {

  const tss = report?.task_structure_summary;

  if (!tss) return null;

  return (

    (lang !== "en" ? tss.structure_interpretation_ko : tss.structure_interpretation_en) ||

    tss.structure_interpretation

  );

}



export function applyStructureToSection3(data, report, lang, topFingerprints = []) {

  if (!data?.hero_insight) return data;

  const next = { ...data, hero_insight: { ...data.hero_insight } };



  const legacyClean = [];

  for (const s of cleanLegacyProofItems(data.hero_insight.proof_items, lang)) {

    const t = topFingerprints.length

      ? clearIfRedundantWithFingerprints(s, topFingerprints, lang)

      : s;

    if (t && !legacyClean.includes(t)) legacyClean.push(t);

  }



  if (legacyClean.length >= 2) {

    next.hero_insight.proof_items = legacyClean.slice(0, 3);

  } else {

    const fallback = buildSection3WorkStyleFallbackChips(report, lang);

    const merged = [...legacyClean, ...fallback.filter((x) => !legacyClean.includes(x))];

    next.hero_insight.proof_items = merged.slice(0, 3);

  }



  if (Array.isArray(next.strategy_cards)) {

    next.strategy_cards = next.strategy_cards.map((c) => ({

      ...c,

      body: polishInsightText(String(c.body || ""), lang) || String(c.body || ""),

    }));

  }

  if (Array.isArray(next.shift_lanes)) {

    next.shift_lanes = next.shift_lanes.map((lane) => ({

      ...lane,

      before_text:

        polishInsightText(String(lane.before_text || ""), lang) || String(lane.before_text || ""),

      after_text:

        polishInsightText(String(lane.after_text || ""), lang) || String(lane.after_text || ""),

    }));

  }



  return next;

}



function polishUiInsightFields(obj, parentKey = "", lang = "ko") {

  if (typeof obj === "string") {

    if (SANITIZE_STRING_KEYS.has(parentKey)) {

      return polishInsightText(obj, lang) || (HAS_PERCENT.test(obj) ? "" : obj.trim());

    }

    return obj;

  }

  if (Array.isArray(obj)) {

    if (parentKey === "proof_items") {

      return obj.map((x) => polishInsightText(String(x || ""), lang)).filter(Boolean);

    }

    return obj.map((item) => polishUiInsightFields(item, parentKey, lang));

  }

  if (obj && typeof obj === "object") {

    const out = { ...obj };

    for (const [k, v] of Object.entries(obj)) {

      if (k === "headline_segments") out[k] = v;

      else if (v && typeof v === "object") out[k] = polishUiInsightFields(v, k, lang);

    }

    return out;

  }

  return obj;

}



function walkSanitizeUi(obj, parentKey = "") {

  if (typeof obj === "string") {

    if (SANITIZE_STRING_KEYS.has(parentKey)) {

      const cleaned = stripPercentRestatement(obj);

      return cleaned || (HAS_PERCENT.test(obj) ? "" : obj.trim());

    }

    return obj;

  }

  if (Array.isArray(obj)) {

    if (parentKey === "proof_items") return obj;

    return obj.map((item) => walkSanitizeUi(item, parentKey));

  }

  if (obj && typeof obj === "object") {

    const out = { ...obj };

    for (const [k, v] of Object.entries(obj)) {

      if (k === "proof_items" || k === "headline_segments") out[k] = v;

      else if (v && typeof v === "object") out[k] = walkSanitizeUi(v, k);

    }

    return out;

  }

  return obj;

}



export function sanitizeUiStructuredJson(ui) {

  if (!ui || typeof ui !== "object") return ui;

  return walkSanitizeUi(ui);

}



function dedupeUiAgainstTop(ui, fingerprints, lang) {

  const s2 = ui.section_2_value_shift;

  if (s2?.hero_insight?.supporting_text) {

    const t = clearIfRedundantWithFingerprints(s2.hero_insight.supporting_text, fingerprints, lang);

    if (t) s2.hero_insight.supporting_text = t;

    else delete s2.hero_insight.supporting_text;

  }

  const s4 = ui.section_4_task_ai_role;

  if (s4?.integrated_insight?.supporting_text) {

    const deduped = clearIfRedundantWithFingerprints(s4.integrated_insight.supporting_text, fingerprints, lang);

    if (deduped) s4.integrated_insight.supporting_text = deduped;

  }

}



export function finalizeUiStructuredJson(ui, report, lang) {

  if (!ui || typeof ui !== "object") return ui;

  const base = polishUiInsightFields(sanitizeUiStructuredJson(ui), "", lang);

  const fingerprints = collectTopInsightFingerprints(report || {}, lang);

  dedupeUiAgainstTop(base, fingerprints, lang);



  const s3 = base.section_3_work_style ?? base.report_ui?.section_3_work_style;

  if (s3) {

    const fixed = applyStructureToSection3(s3, report, lang, fingerprints);

    if (base.section_3_work_style) base.section_3_work_style = fixed;

    if (base.report_ui?.section_3_work_style) {

      base.report_ui = { ...base.report_ui, section_3_work_style: fixed };

    }

  }



  const s4 = base.section_4_task_ai_role ?? base.report_ui?.section_4_task_ai_role;

  if (s4?.integrated_insight && report) {

    const interp = structureInterp(report, lang);

    const ins = { ...s4.integrated_insight };

    const candidate = polishInsightText(

      String(interp?.role_shift_interpretation || interp?.core_interpretation || ins.supporting_text || ""),

      lang,

    );

    if (candidate) {

      const deduped = clearIfRedundantWithFingerprints(candidate, fingerprints, lang);

      if (deduped) ins.supporting_text = deduped;

    }

    if (Array.isArray(ins.headline_segments) && ins.headline_segments.some((seg) => HAS_PERCENT.test(seg?.text || ""))) {

      ins.headline_segments = [

        { text: lang === "ko" ? "정형 점검·비교가 빨라질수록, " : "As structured checks accelerate, " },

        { text: lang === "ko" ? "배포 기준·예외 승인" : "release criteria and exceptions", emphasize: true },

        { text: lang === "ko" ? "을 더 직접 조정하는 구조로 이동할 수 있습니다." : " move to the foreground." },

      ];

    }

    s4.integrated_insight = ins;
  }

  applyCanonicalUiLabels(base, lang, report);
  if (report) applyCanonicalReportRootLabels(report, lang);
  return base;
}


