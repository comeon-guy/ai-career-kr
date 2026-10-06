/** 인사이트 문장 공통: % 제거·파손 검사·비교 */

const HAS_PERCENT = /\d{1,3}\s*(?:%|％|퍼센트)/;

export function isBrokenInsightSentence(s) {
  const t = String(s || "").trim();
  if (t.length < 14) return true;
  if (/^(로|가|을|를|에|의|도|만)\s/.test(t)) return true;
  if (/업무가\s+를\s/.test(t)) return true;
  if (/영역은\s+로\s/.test(t)) return true;
  if (/축이\s+로\s/.test(t)) return true;
  if (!/[가-힣a-z]{2,}/i.test(t)) return true;
  return false;
}

export function stripPercentRestatement(text) {
  if (!text || typeof text !== "string") return "";
  if (!HAS_PERCENT.test(text)) return text.trim();

  let s = text.trim();
  s = s
    .replace(
      /업무량\s*(?:기준|으로)?[^.]{0,60}?\d{1,3}\s*%\s*로\s*(?:가장\s*)?(?:넓|크|작|중심)[^.]*/gi,
      "",
    )
    .replace(/핵심\s*영향[^.]{0,60}?\d{1,3}\s*%\s*로[^.]*/gi, "")
    .replace(/(?:약\s*)?\d{1,3}\s*(?:%|％)\s*를\s*차지해?/gi, "상당 부분을 차지해")
    .replace(/(?:약\s*)?\d{1,3}\s*(?:%|％|퍼센트|프로)\s*(?:로|가|은|는|에|의)?/gi, "")
    .replace(/\d{1,3}\s*%\s*로\s*(?:가장\s*)?(?:넓|크|작|중심)/gi, "");

  s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
  if (isBrokenInsightSentence(s)) return "";
  return s;
}

export function normalizeForCompare(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function textsAreRedundant(a, b) {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na];
  return shorter.length > 40 && longer.includes(shorter);
}

export { HAS_PERCENT };
