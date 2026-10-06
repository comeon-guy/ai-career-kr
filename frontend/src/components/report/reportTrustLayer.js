/**
 * Report Trust Layer v1 — short user-facing explanations only.
 * No Task IDs, raw dumps, or internal scoring details in default UI.
 */

import trustArtifact from "../../data/reportTrustV1_7soc.json";

export const REPORT_TRUST_CONTRACT = "report_trust_v1";
export const REPORT_REFERENCE_COPY_CONTRACT =
  "canonical-analysis-source-compact-v3";

function normSoc(soc) {
  return String(soc || "").trim();
}

function pickLang(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field.trim();
  const useEn = lang === "en";
  const text = useEn ? field.en || field.ko : field.ko || field.en;
  return String(text || "").trim();
}

/** @param {string} soc @param {string} claimType e.g. hero_why, value_shift_decline_why */
export function resolveTrustWhy(soc, claimType, lang = "ko") {
  const s = normSoc(soc);
  const key = String(claimType || "").trim();
  const entry = trustArtifact?.trust?.[s]?.[key];
  if (!entry) return null;
  const text = pickLang(entry, lang);
  return text || null;
}

export function getTaskCoverageCount(report) {
  return Array.isArray(report?.tasks) ? report.tasks.length : 0;
}

export function buildTaskCoverageLine(report, lang = "ko") {
  const count = getTaskCoverageCount(report);
  if (!count) return null;
  return lang === "en" ? `All ${count} Work24 tasks analyzed` : `Work24 수행직무 ${count}개 분석`;
}

/**
 * Canonical report methodology/reference copy for every SOC.
 * The task count intentionally reuses getTaskCoverageCount, which also supplies
 * the existing all-tasks CTA. No SOC-specific copy branch is permitted here.
 */
export function buildReportReferenceCopy(report, lang = "ko") {
  const ko = lang !== "en";
  const taskCount = getTaskCoverageCount(report);

  if (ko) {
    return {
      contract: REPORT_REFERENCE_COPY_CONTRACT,
      taskCount,
      lead: `한국 직업정보(Work24) 수행직무 ${taskCount}개 업무를 세 가지 관점에서 분석했습니다.`,
      criteria: [
        {
          key: "automation",
          title: "자동화 적합도",
          description: "정해진 절차와 규칙으로 처리하기 좋은 정도",
        },
        {
          key: "ai-help",
          title: "AI가 도울 수 있는 정도",
          description: "분석·비교·정리 등에서 AI가 도움을 줄 수 있는 정도",
        },
        {
          key: "human-judgment",
          title: "사람 판단 중요도",
          description: "예외 해석·전문 판단·최종 결정이 중요한 정도",
        },
      ],
      independentNote: {
        lead: "세 기준은 업무를 서로 나누는 분류가 아닙니다.",
        body: [
          "하나의 업무를 세 기준으로 각각 살펴보기 때문에 여러 기준에 동시에 해당할 수 있습니다.",
          "따라서 세 기준의 비율을 더해도 100%가 되지 않습니다.",
        ],
        example:
          "예: AI가 크게 도울 수 있는 업무라도 최종 판단은 사람이 책임해야 할 수 있습니다.",
      },
    };
  }

  return {
    contract: REPORT_REFERENCE_COPY_CONTRACT,
    taskCount,
    lead: `This analysis looks at the ${taskCount} Work24 job tasks for this occupation from three perspectives.`,
    criteria: [
      {
        key: "automation",
        title: "Automation suitability",
        description: "How suitable the task is for defined procedures and rules",
      },
      {
        key: "ai-help",
        title: "How much AI can help",
        description: "How much AI can help with analysis, comparison, and organization",
      },
      {
        key: "human-judgment",
        title: "Human judgment importance",
        description: "How important exception handling, professional judgment, and final decisions are",
      },
    ],
    independentNote: {
      lead: "The three criteria are not mutually exclusive categories that split tasks apart.",
      body: [
        "Each task is examined against all three criteria, so a task can score high on more than one.",
        "Adding the three shares therefore does not equal 100%.",
      ],
      example:
        "Example: Work that AI can help a lot with may still require a person to own the final judgment.",
    },
  };
}

export function buildReportTrustMethodology(report, lang = "ko") {
  const ko = lang !== "en";
  const taskCount = getTaskCoverageCount(report);
  const taskCoverage = buildTaskCoverageLine(report, lang);
  const coreMessage = ko
    ? "이 리포트는 직무를 구성하는 실제 업무 데이터를 분석합니다. 그 결과를 바탕으로 AI 시대의 업무 방식과 사람의 역할 변화를 설명합니다."
    : "This report analyzes the tasks that make up the full occupation and explains how work patterns and human roles may shift in the AI era.";

  const analyzedBody = ko
    ? taskCount
      ? `이 직무를 구성하는 전체 업무 ${taskCount}개를 분석했습니다.`
      : "이 직무를 구성하는 전체 업무를 분석했습니다."
    : taskCount
      ? `We analyzed all ${taskCount} tasks that make up this occupation.`
      : "We analyzed every task that makes up this occupation.";

  const sections = ko
    ? [
        {
          title: "무엇을 바탕으로 했나요?",
          body: "한국 직업정보(Work24)에 등록된 해당 직무의 수행직무 문장을 분석에 사용했습니다.",
        },
        {
          title: "무엇을 분석했나요?",
          body: analyzedBody,
        },
        {
          title: "어떻게 분석했나요?",
          body: "먼저 각 업무를 자동화가 맡을 부분과 AI가 도울 부분으로 나눴습니다. 사람의 판단이 필요한 부분도 따로 구분했습니다. 이 결과를 직무 전체 수준에서 종합했습니다.",
        },
        {
          title: "어디까지가 해석인가요?",
          body: "업무명·중요도·수행 빈도는 원천 데이터입니다. 업무 가치 변화와 대표 업무 설명은 이 데이터를 바탕으로 해석했습니다. AI 활용 방식도 같은 근거에서 구성했습니다.",
        },
      ]
    : [
        {
          title: "What is this based on?",
          body: "We use the occupation’s Work24 task statements registered in Korean job information.",
        },
        {
          title: "What was analyzed?",
          body: analyzedBody,
        },
        {
          title: "How was it analyzed?",
          body: "Each task was classified into rule-based automation, AI-assisted comparison and synthesis, and human judgment—and then aggregated to the occupation level.",
        },
        {
          title: "What is interpretation?",
          body: "Task names, importance, and frequency come from source data; value shifts, representative scenarios, and AI use examples are analytical interpretations built on that data.",
        },
      ];

  return { taskCoverage, coreMessage, sections, taskCount };
}

/** Fixed copy aligned with occupation-level score contract — no raw metric dump. */
export function buildPositionScoreExplanation(scoreKey, lang = "ko") {
  const ko = lang !== "en";
  if (scoreKey === "ai") {
    return ko
      ? "먼저 업무별 AI 영향 정도를 살펴봅니다. 업무 중요도와 수행 빈도로 계산한 비중을 반영해 직무 전체 점수로 종합합니다."
      : "We combine each task’s AI impact with a work share from importance and frequency into one occupation-level score.";
  }
  return ko
    ? "수행직무 문장과 3축(자동화·AI 보강·사람 판단) 판정을 바탕으로 계산합니다. 사람의 판단·책임·상호작용이 필요한 특성을 직무 전체 수준에서 종합합니다."
    : "Using Work24 task statements and three-axis judgments, we aggregate traits that require human judgment, accountability, and interaction.";
}

export function buildRepresentativeSelectionWhy(lang = "ko", report = null) {
  const ko = lang !== "en";
  const n = getTaskCoverageCount(report);
  const nLabel = n > 0 ? String(n) : ko ? "여러" : "multiple";
  if (ko) {
    return {
      lead: `한국 직업정보(Work24) 수행직무 업무 ${nLabel}개를 분석했습니다. 중요도와 수행 빈도가 높은 업무를 먼저 살폈습니다. 서로 다른 업무 영역과 AI·사람의 역할을 보여주는 상황을 대표 사례로 골랐습니다.`,
      follow:
        "아래에서 대표 업무를 선택해 보세요. 먼저 그 업무에서 어떤 문제와 판단이 생기는지 살펴봅니다. 이어 6가지 AI 활용역량에 따라 해결 과정을 확인할 수 있습니다.",
    };
  }
  return {
    lead: `We analyzed all ${nLabel} Work24 job tasks for this occupation and selected representative situations that are high in importance and frequency and that show different work areas and AI–human roles.`,
    follow:
      "Choose a representative work situation below to see how to structure the problem or judgment, divide roles between automation, AI, and people, verify AI results, and reach a responsible human decision—following the six AI work competencies.",
  };
}

export function formatRepresentativeSelectionWhy(lang = "ko", report = null) {
  const parts = buildRepresentativeSelectionWhy(lang, report);
  return `${parts.lead} ${parts.follow}`;
}

export function buildAiUseExampleDisclaimer(lang = "ko") {
  const ko = lang !== "en";
  return ko
    ? "실제 업무 데이터를 바탕으로 구성한 활용 예시입니다."
    : "An illustrative use example built from actual task data.";
}

export function buildSection4TrustIntro(lang = "ko") {
  const ko = lang !== "en";
  return ko
    ? "이 직무를 구성하는 전체 업무를 확인할 수 있습니다. 각 업무의 중요도와 수행 빈도도 함께 보여줍니다. 직무 내 비중과 AI·사람의 역할도 살펴볼 수 있습니다."
    : "Review every task in this occupation with importance, frequency, role share, and AI–human role type.";
}
