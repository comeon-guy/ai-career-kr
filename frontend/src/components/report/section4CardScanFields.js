/**
 * Section4 업무 카드 — 스캔형 UI용 필드 (API에 없으면 ai_helps / human_owns에서 유도).
 * @param {string} text
 * @param {number} max
 * @returns {string[]}
 */
export function textToScanBullets(text, max = 5) {
  const s = String(text || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return [];
  const lines = s
    .split(/\n+/)
    .map((l) => l.replace(/^[•\-\*‧·\d]+[.)、\s]*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 2) return lines.slice(0, max);

  const bySentence = s
    .split(/(?<=[\.。!])\s+/)
    .map((p) => p.replace(/[。\.]$/, "").trim())
    .filter((p) => p.length > 6);
  if (bySentence.length >= 2) return bySentence.slice(0, max);

  if (/[,，]/.test(s)) {
    return s
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter((x) => x.length > 4)
      .slice(0, max);
  }

  const one = s.length > 140 ? `${s.slice(0, 137)}…` : s;
  return [one];
}

/**
 * Drop capability tags that merely repeat AI/사람 불릿. Keep skill-level nouns.
 * @param {unknown} caps
 * @param {unknown} bulletsPrimary
 * @param {unknown} bulletsSecondary
 * @returns {string[]}
 */
export function skillOnlyCapabilities(caps, bulletsPrimary, bulletsSecondary) {
  const blob = [...(Array.isArray(bulletsPrimary) ? bulletsPrimary : []), ...(Array.isArray(bulletsSecondary) ? bulletsSecondary : [])]
    .map((x) => String(x || ""))
    .join(" ");
  const out = [];
  for (const raw of Array.isArray(caps) ? caps : []) {
    const t = String(raw || "").trim();
    if (t.length < 2) continue;
    if (blob.includes(t) && t.length >= 4) continue;
    if (t.length >= 8 && blob.includes(t.slice(0, 8))) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out.slice(0, 4);
}

/**
 * @param {{ ai_helps?: string; human_owns?: string; key_change_line?: string }} t
 * @returns {string}
 */
export function deriveKeyChangeLine(t) {
  const k = String(t.key_change_line || "").trim();
  if (k) return k.length > 220 ? `${k.slice(0, 217)}…` : k;
  const a = String(t.ai_helps || "").trim();
  const h = String(t.human_owns || "").trim();
  const first = (x) => {
    const parts = x.split(/(?<=[\.。!])\s+/).map((p) => p.trim()).filter(Boolean);
    return parts[0] || x;
  };
  const s1 = first(a);
  const s2 = first(h);
  const out = `${s1} ${s2}`.replace(/\s+/g, " ").trim();
  if (out.length <= 200) return out;
  return `${out.slice(0, 197)}…`;
}

/**
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard} t
 * @param {boolean} isKo
 */
export function deriveScanColumns(t, isKo) {
  const type = t.ai_role_type;
  const caps = Array.isArray(t.capabilities) ? t.capabilities.map((c) => String(c || "").trim()).filter(Boolean) : [];

  if (type === "automation") {
    return {
      col1Title: isKo ? "자동화되기 쉬운 이유" : "Why it automates well",
      col2Title: isKo ? "앞으로 달라질 가능성이 큰 부분" : "What likely shifts next",
      bullets1: textToScanBullets(t.ai_helps, 5),
      bullets2: textToScanBullets(t.human_owns, 5),
    };
  }
  if (type === "collab") {
    return {
      col1Title: isKo ? "AI 활용 아이디어" : "AI use ideas",
      col2Title: isKo ? "실무자가 직접 챙겨야 하는 포인트" : "What practitioners still own",
      bullets1: textToScanBullets(t.ai_helps, 5),
      bullets2: textToScanBullets(t.human_owns, 5),
    };
  }
  const bHuman = textToScanBullets(t.human_owns, 10);
  const bullets1 = bHuman.slice(0, 5);
  let bullets2 = caps.length >= 2 ? caps.slice(0, 5) : bHuman.slice(5, 10);
  if (!bullets2.length) bullets2 = textToScanBullets(t.ai_helps, 5);
  return {
    col1Title: isKo ? "사람 중심으로 남을 가능성이 큰 이유" : "Why it stays human-led",
    col2Title: isKo ? "앞으로 더 중요해질 역량" : "Capabilities that gain weight",
    bullets1: bullets1.length ? bullets1 : textToScanBullets(t.human_owns, 5),
    bullets2,
  };
}
