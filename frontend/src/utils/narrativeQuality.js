/**
 * 최상위 인사이트 문체·범용 담론·섹션 중복 검증
 */
import {
  isBrokenInsightSentence,
  normalizeForCompare,
  stripPercentRestatement,
  textsAreRedundant,
} from "./narrativeCore.js";

const BANNED_COLLOQUIAL_KO = [
  "직접 치는 시간",
  "어디까지 믿을지",
  "무엇을 만들지와",
  "사람이 중요",
  "사람이 더 중요",
  "AI는 보조",
  "판단이 중요",
  "AI가 대신",
  "사람 판단이 중요",
  "AI 활용 능력",
  "AI 활용 역량",
];

const GENERIC_NARRATIVE_RE = [
  /자동화가\s+넓어지/i,
  /자동화\s*가능\s*업무가\s+\d/i,
  /사람\s*판단이\s+중요/i,
  /AI는\s+초안/i,
  /반복\s*업무는\s+자동화/i,
  /업무량\s*기준/i,
  /핵심\s*영향\s*기준/i,
];

export function containsBannedColloquial(text, lang = "ko") {
  if (lang !== "ko") return false;
  const t = String(text || "").trim();
  return BANNED_COLLOQUIAL_KO.some((p) => t.includes(p));
}

export function isGenericAiNarrative(text, lang = "ko") {
  if (lang !== "ko") return false;
  const t = String(text || "").trim();
  if (t.length < 12) return false;
  const hits = GENERIC_NARRATIVE_RE.filter((re) => re.test(t)).length;
  if (hits >= 2) return true;
  return hits === 1 && t.length < 72;
}

export function polishInsightText(text, lang = "ko") {
  const s = stripPercentRestatement(text || "");
  if (!s || isBrokenInsightSentence(s)) return "";
  if (containsBannedColloquial(s, lang)) return "";
  if (isGenericAiNarrative(s, lang)) return "";
  return s.trim();
}

export function collectTopInsightFingerprints(report, lang = "ko") {
  const fps = [];
  const isKo = lang !== "en";

  const add = (raw) => {
    const t = polishInsightText(raw, lang) || String(raw || "").trim();
    const n = normalizeForCompare(t);
    if (n && !fps.includes(n)) fps.push(n);
  };

  const tss = report?.task_structure_summary;
  if (tss && typeof tss === "object") {
    const interp =
      (isKo ? tss.structure_interpretation_ko : tss.structure_interpretation_en) ||
      tss.structure_interpretation;
    if (interp && typeof interp === "object") {
      for (const key of [
        "hero_insight",
        "positioning_rationale",
        "positioning_body",
        "volume_interpretation",
        "core_interpretation",
        "role_shift_interpretation",
      ]) {
        add(interp[key]);
      }
    }
  }

  for (const key of ["value_shift_conclusion", "career_positioning_body", "career_hero_tagline"]) {
    add(report?.[key]);
  }
  return fps;
}

export function clearIfRedundantWithFingerprints(text, fingerprints, lang = "ko") {
  const cleaned = polishInsightText(text, lang);
  if (!cleaned) return "";
  const nc = normalizeForCompare(cleaned);
  for (const fp of fingerprints) {
    if (!fp) continue;
    if (nc === fp) return "";
    if (fp.length > 36 && (fp.includes(nc) || nc.includes(fp))) return "";
    if (textsAreRedundant(cleaned, fp)) return "";
  }
  return cleaned;
}
