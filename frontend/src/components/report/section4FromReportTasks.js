/**
 * API `ui_structured_json.section_4_task_ai_role`가 없거나 파서 실패 시,
 * 리포트의 실제 tasks로 Section4TaskAiRole 스키마에 맞는 payload를 만든다.
 * (DEV에서 mock으로 대체되어 다른 직무 업무가 보이는 문제 방지)
 */

import { resolveAiImpactBuckets } from "../../utils/taskAiImpactComposition.js";
import { buildRoleScanBullets } from "./section4MergeNarrative.js";

/** @param {string} level */
export function levelToAiRoleType(level) {
  const x = String(level || "medium").toLowerCase();
  if (x === "high") return "automation";
  if (x === "low") return "human";
  return "collab";
}

/** @param {unknown} taskId @param {{ task_id?: unknown; capability_tags?: unknown }[]} table */
function capabilityNamesForTask(taskId, table) {
  const tid = String(taskId ?? "");
  const row = table.find((r) => String(r?.task_id ?? "") === tid);
  if (!row || !Array.isArray(row.capability_tags)) return [];
  const skip = new Set([
    "AI 영향 높음",
    "AI 영향 낮음",
    "AI 영향 중간",
    "High AI impact",
    "Low AI impact",
    "Medium AI impact",
  ]);
  return row.capability_tags
    .map((x) => String(x || "").trim())
    .filter((x) => x && !skip.has(x))
    .slice(0, 4);
}

/**
 * 직무 구성 변화 카드와 동일한 비중(%)으로 Section4 포트폴리오만 덮어쓴다.
 * @param {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData} data
 * @param {{ human_pct?: number; collaboration_pct?: number; automation_pct?: number }} comp
 */
export function applyCompositionToSection4Data(data, comp) {
  if (!data?.portfolio?.segments || !comp) return data;
  const h = Math.max(0, Math.min(100, Number(comp.human_pct) || 0));
  const c = Math.max(0, Math.min(100, Number(comp.collaboration_pct) || 0));
  const a = Math.max(0, Math.min(100, Number(comp.automation_pct) || 0));
  return {
    ...data,
    portfolio: {
      ...data.portfolio,
      segments: data.portfolio.segments.map((seg) => {
        const p = seg.kind === "human" ? h : seg.kind === "collab" ? c : a;
        return { ...seg, percent: p, label: `${p}%` };
      }),
    },
  };
}

/**
 * 리포트 전체 업무 → Section4 task_cards 한 행씩 (필터 탭용 전체 목록).
 * @returns {import("./section4TaskAiRole.types.js").Section4TaskCard[]}
 */
export function buildSection4TaskCardsFromReportTasks(tasks, lang, opts) {
  const {
    taskCapabilityTable = [],
    getAiLevelByMode,
    getFrequencyScore,
    getHumanOwnsRationale,
  } = opts;
  const list = Array.isArray(tasks) ? tasks.filter((t) => t && String(t.task_text || "").trim()) : [];
  if (!list.length) return [];
  const sorted = [...list].sort((a, b) => (Number(b.weight_norm) || 0) - (Number(a.weight_norm) || 0));
  return sorted.map((t, idx) => {
    const level = getAiLevelByMode(t);
    const roleType = levelToAiRoleType(level);
    const imp = Math.round(((Number(t.importance) || 0) / 5) * 100);
    const importanceMetric = Number.isFinite(imp) ? Math.min(100, Math.max(0, imp)) : 0;
    const fq = Math.round((getFrequencyScore(t) / 5) * 100);
    const frequencyMetric = Number.isFinite(fq) ? Math.min(100, Math.max(0, fq)) : 0;
    const wt = Math.round((Number(t.weight_norm) || 0) * 100);
    const weightMetric = Number.isFinite(wt) ? Math.min(100, Math.max(0, wt)) : 0;
    const caps = capabilityNamesForTask(t.task_id, taskCapabilityTable);
    const title = String(t.task_text || "").trim().slice(0, 280);
    const scan = buildRoleScanBullets(title, roleType, lang, idx);
    const aiHelps = scan.bullets_primary.join("\n");
    const humanOwns = scan.bullets_secondary.join("\n");

    return {
      id: `task-${t.task_id ?? idx}`,
      filter_group: ["important", roleType],
      order: idx + 1,
      title,
      ai_role_type: roleType,
      metrics: {
        importance: importanceMetric || 1,
        frequency_display: frequencyMetric,
        weight_percent: weightMetric,
      },
      capabilities: caps.length ? caps : lang === "ko" ? ["직무 데이터 기반"] : ["From job data"],
      bullets_primary: scan.bullets_primary,
      bullets_secondary: scan.bullets_secondary,
      ai_helps: aiHelps,
      human_owns: humanOwns,
    };
  });
}

/**
 * @param {unknown[]} tasks
 * @param {"ko"|"en"} lang
 * @param {{
 *   occupationTitle: string;
 *   taskCapabilityTable: { task_id?: unknown; capability_tags?: unknown }[];
 *   getAiLevelByMode: (t: object) => string;
 *   getFrequencyScore: (t: object) => number;
 *   getHumanOwnsRationale: (t: object) => string;
 *   composition?: { human_pct: number; collaboration_pct: number; automation_pct: number };
 * }} opts
 * @returns {import("./section4TaskAiRole.types.js").Section4TaskAiRoleData | null}
 */
export function buildSection4TaskPayloadFromReportTasks(tasks, lang, opts) {
  const {
    occupationTitle,
    taskCapabilityTable = [],
    getAiLevelByMode,
    getFrequencyScore,
    getHumanOwnsRationale,
    composition: compositionIn,
  } = opts;
  const list = Array.isArray(tasks) ? tasks.filter((t) => t && String(t.task_text || "").trim()) : [];
  if (!list.length) return null;

  const composition = compositionIn ?? resolveAiImpactBuckets(list, getAiLevelByMode).displayComposition;

  const sub = {
    human: lang === "ko" ? "사람 판단 중심 / 판단·관계·책임" : "Human judgment / relationships & accountability",
    collab: lang === "ko" ? "AI 협업형 / 초안·제안 + 판단" : "AI collaboration / drafts + judgment",
    automation: lang === "ko" ? "자동화 지향형 / 정형·반복·처리" : "Automation-oriented / structured repetition",
  };
  const kindsOrder = ["human", "collab", "automation"];
  const portfolioSegments = kindsOrder.map((kind) => {
    const p =
      kind === "human"
        ? composition.human_pct
        : kind === "collab"
          ? composition.collaboration_pct
          : composition.automation_pct;
    const pct = Math.max(0, Math.min(100, Math.round(Number(p) || 0)));
    return { kind, percent: pct, label: `${pct}%`, sublabel: sub[kind] };
  });

  const occ = String(occupationTitle || "").trim() || (lang === "ko" ? "이 직무" : "This occupation");

  const allCards = buildSection4TaskCardsFromReportTasks(list, lang, {
    taskCapabilityTable,
    getAiLevelByMode,
    getFrequencyScore,
    getHumanOwnsRationale,
  });
  const task_cards = allCards.slice(0, 6);

  const isKo = lang !== "en";
  return {
    section_title: isKo ? "전체 업무 분석" : "All tasks analysis",
    integrated_insight: {
      eyebrow: isKo ? "전체 업무" : "All tasks",
      headline_segments: [
        { text: isKo ? "아래 목록은 " : "The list below reflects " },
        { text: occ, emphasize: true },
        { text: isKo ? "의 실제 전체 업무입니다." : "'s full task set from the report.", emphasize: false },
      ],
      supporting_text: isKo
        ? "각 업무의 중요도, 수행빈도, 직무 내 비중과 AI·사람 역할 성격을 비교할 수 있습니다."
        : "Compare importance, frequency, role share, and AI–human role type across tasks.",
    },
    portfolio: {
      title: isKo ? "역할 성격 구성" : "Role-type composition",
      segments: portfolioSegments,
    },
    filters: [
      { id: "all", label: isKo ? "전체" : "All", default: true },
      { id: "important", label: isKo ? "중요도 높은 업무" : "High-importance tasks" },
      { id: "human", label: isKo ? "사람 판단 중심" : "Human judgment" },
      { id: "collab", label: isKo ? "AI 협업형" : "AI collaboration" },
      { id: "automation", label: isKo ? "자동화 지향형" : "Automation-oriented" },
    ],
    task_cards,
    career_insights: [
      {
        number: 1,
        title: isKo ? "중요도와 AI 영향은 다릅니다" : "Importance differs from AI impact",
        body: isKo
          ? "비중이 커도 자동화에 가까운 층이 있고, 비중은 작아도 판단 책임이 큰 업무가 남습니다."
          : "A task can be heavy yet automation-prone, or small yet judgment-heavy.",
      },
      {
        number: 2,
        title: isKo ? "업무는 사라지기보다 층이 나뉩니다" : "Work splits into layers",
        body: isKo
          ? "같은 업무명도 실행·초안 층과 판단·관계 층으로 나뉘며, 후자의 상대적 가치가 커질 수 있습니다."
          : "The same title often splits into execution/draft vs judgment/relationship layers.",
      },
      {
        number: 3,
        title: isKo ? "역할 분담 설계가 경쟁력입니다" : "Role split is the strategy",
        body: isKo
          ? "어디까지 도구에 맡기고 어디부터 사람이 소유할지 정하는 설계가 개인·팀의 차이를 만듭니다."
          : "Choosing what to delegate vs own is where leverage shows up.",
      },
    ],
  };
}
