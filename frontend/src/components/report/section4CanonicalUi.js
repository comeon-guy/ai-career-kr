/**
 * Section 4 탭·포트폴리오 표기 고정 (DB/LLM 문구가 달라져도 UI 일관).
 */

/** 그래프·통계 표시 순서: 사람 중심 → AI 협업형 → 자동화 가능 */
export const SECTION4_PORTFOLIO_KIND_ORDER = ["human", "collab", "automation"];

/**
 * @param {Array<{ kind?: string }>} segments
 * @returns {typeof segments}
 */
export function sortSection4PortfolioSegments(segments) {
  if (!Array.isArray(segments)) return segments;
  const order = SECTION4_PORTFOLIO_KIND_ORDER;
  const rank = (k) => {
    const i = order.indexOf(k);
    return i === -1 ? 99 : i;
  };
  return [...segments].sort((a, b) => rank(a?.kind) - rank(b?.kind));
}

/** @param {boolean} isKo */
export function canonicalSection4PortfolioSublabel(kind, isKo) {
  if (kind === "human") {
    return isKo ? "사람 판단 중심 / 판단·관계·책임" : "Human judgment / relationships & accountability";
  }
  if (kind === "collab") {
    return isKo ? "AI 협업형 / 초안·제안 + 판단" : "AI collaboration / drafts + judgment";
  }
  return isKo ? "자동화 지향형 / 정형·반복·처리" : "Automation-oriented / structured repetition";
}

/** Section4 하단 3카드 제목 — 검토 확정(웹 개발자 리포트 기준) */
export const SECTION4_CAREER_INSIGHT_TITLES_KO = ["구조", "가치 이동", "일하는 방식"];
export const SECTION4_CAREER_INSIGHT_TITLES_EN = ["Structure", "Value shift", "Way of working"];

/** @param {string} text @param {number} [maxLen] */
function oneLineInsightBody(text, maxLen = 110) {
  let t = String(text || "").trim();
  if (!t) return "";
  const seps = [". ", "다. ", "습니다. ", "큽니다. ", "요. "];
  for (const sep of seps) {
    const i = t.indexOf(sep);
    if (i > 0 && i < maxLen + 20) return t.slice(0, i + sep.trim().length).trim();
  }
  if (t.length > maxLen) {
    const cut = t.slice(0, maxLen).lastIndexOf(" ");
    return `${t.slice(0, cut > 40 ? cut : maxLen).trim()}…`;
  }
  return t;
}

/**
 * career_insights: title은 항상 구조/가치 이동/일하는 방식, 본문만 직무별 인사이트.
 * @param {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} data
 * @param {object} [report]
 * @param {string} [lang]
 */
export function applyCanonicalCareerInsights(data, report, lang = "ko") {
  if (!data || typeof data !== "object") return data;
  const isKo = lang !== "en";
  const titles = isKo ? SECTION4_CAREER_INSIGHT_TITLES_KO : SECTION4_CAREER_INSIGHT_TITLES_EN;
  const raw = Array.isArray(data.career_insights) ? data.career_insights : [];
  const byNum = new Map();
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const n = Number(c.number);
    if (n >= 1 && n <= 3) byNum.set(n, c);
  }

  const tss = report?.task_structure_summary;
  const interp =
    tss &&
    ((isKo ? tss.structure_interpretation_ko : tss.structure_interpretation_en) ||
      tss.structure_interpretation);
  const structureFallback = [
    interp?.positioning_rationale || interp?.positioning_body || interp?.volume_interpretation || "",
    interp?.core_interpretation || "",
    interp?.role_shift_interpretation || interp?.volume_interpretation || "",
  ];

  const normalized = titles.map((canonicalTitle, idx) => {
    const num = idx + 1;
    const src = byNum.get(num) || raw[idx] || {};
    let title = String(src.title || "").trim();
    let body = String(src.body || "").trim();

    const prefixRe = new RegExp(`^${canonicalTitle}\\s*[:：]\\s*(.+)$`);
    const prefixMatch = title.match(prefixRe);
    if (prefixMatch) {
      const lead = prefixMatch[1].trim();
      body = body ? `${lead} ${body}`.trim() : lead;
      title = canonicalTitle;
    } else if (title !== canonicalTitle && title.length > 6) {
      if (body && !body.includes(title.slice(0, Math.min(24, title.length)))) {
        body = `${title} ${body}`.trim();
      } else if (!body) {
        body = title;
      }
    }

    if ((!body || body.length < 18) && structureFallback[idx]) {
      body = String(structureFallback[idx]).trim();
    }

    return {
      number: num,
      title: canonicalTitle,
      body: oneLineInsightBody(body, isKo ? 110 : 160),
    };
  });

  data.career_insights = normalized;
  return data;
}

/** @param {boolean} isKo */
export function canonicalSection4Filters(isKo) {
  return [
    { id: "all", label: isKo ? "전체" : "All", default: true },
    { id: "important", label: isKo ? "중요도 높은 업무" : "High-importance tasks" },
    { id: "human", label: isKo ? "사람 판단 중심" : "Human judgment" },
    { id: "collab", label: isKo ? "AI 협업형" : "AI collaboration" },
    { id: "automation", label: isKo ? "자동화 지향형" : "Automation-oriented" },
  ];
}

/**
 * 한글·영문 라벨 힌트로 표준 id 추론 (방어적 탭 매칭용).
 * @param {string} id
 * @param {string} label
 */
export function inferSection4FilterId(id, label) {
  const lid = String(id || "").trim().toLowerCase();
  const ll = String(label || "").trim().toLowerCase();
  if (["all", "important", "human", "collab", "automation"].includes(lid)) return lid;
  if (/^(전체|all)$/i.test(ll)) return "all";
  if (/^(중요도|중요|주요)/.test(ll) || /high.?import/i.test(ll)) return "important";
  if (/사람|인간|human/.test(ll)) return "human";
  if (/협업|collab/.test(ll)) return "collab";
  if (/자동화|automation/.test(ll)) return "automation";
  return lid;
}

/**
 * @param {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} data
 * @param {string} lang
 */
export function applyCanonicalSection4Labels(data, lang, report = null) {
  if (!data || typeof data !== "object") return data;
  const isKo = lang !== "en";

  applyCanonicalCareerInsights(data, report, lang);
  data.filters = canonicalSection4Filters(isKo);

  if (isKo) {
    data.section_title = "전체 업무 분석";
    if (data.integrated_insight && typeof data.integrated_insight === "object") {
      data.integrated_insight.eyebrow = "전체 업무";
    }
    if (data.portfolio && typeof data.portfolio === "object") {
      data.portfolio.title = "역할 성격 구성";
    }
  } else {
    data.section_title = "All tasks analysis";
    if (data.integrated_insight && typeof data.integrated_insight === "object") {
      data.integrated_insight.eyebrow = "All tasks";
    }
    if (data.portfolio && typeof data.portfolio === "object") {
      data.portfolio.title = "Role-type composition";
    }
  }

  if (data.portfolio && Array.isArray(data.portfolio.segments)) {
    data.portfolio.segments = sortSection4PortfolioSegments(
      data.portfolio.segments.map((seg) => {
        if (!seg || typeof seg !== "object") return seg;
        const p = Math.max(0, Math.min(100, Math.round(Number(seg.percent) || 0)));
        return {
          ...seg,
          percent: p,
          label: `${p}%`,
          sublabel: canonicalSection4PortfolioSublabel(seg.kind, isKo),
        };
      }),
    );
  }
  return data;
}
