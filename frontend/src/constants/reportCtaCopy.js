/**
 * 리포트 CTA 문구 스키마 (KO/EN).
 * variant: after-s2 | after-s3 | after-s4 | closing | share-only
 *
 * 줄바꿈: support/question 등에 `\n` 또는 `<br>` (ReportCtaCard에서 처리)
 */

import { buildFutureCompetitivenessUrl } from "../fcUrl.js";

/** @typedef {'after-s2'|'after-s3'|'after-s4'|'closing'|'share-only'} ReportCtaVariant */

/** @type {Record<ReportCtaVariant, { ko: object, en: object }>} */
export const REPORT_CTA_COPY = {
  "after-s2": {
    ko: {
      question: "기업들은 이제 어떤 역량을 <br> 더 중요하게 보고 있을까요?",
      support: "실제 채용공고를 분석해 <br> AI 시대에 중요해지는 역량과 <br> 변화하는 채용 기준을 확인해보세요.",
      primary: "이 직무 리포트 공유하기",
      secondary: "이 직무만 더 읽기",
      footnote: null,
      footer: "분석 결과는 참고용입니다",
      checklist: [
        "공고가 요구하는 핵심 업무 방향",
        "관련 직무의 최근 트렌드",
        "AI 시대 업무 변화 방향",
      ],
      jdFocus: null,
    },
    en: {
      question: "How does this shift show up in real job postings?",
      support: "Analyze live postings to see required skills and keywords employers emphasize.",
      primary: "Analyze real postings",
      secondary: "Keep reading this role",
      footnote: null,
      footer: "Unlimited analysis after sign-up",
      checklist: [
        "Live posting analysis",
        "Required & preferred skills",
        "Trending keywords",
        "Employer-by-employer comparison",
      ],
      jdFocus: null,
    },
  },
  "after-s3": {
    ko: {
      question: "AI 시대에는 어떤 방식으로 <br> 일하는 사람이 강해질까요?",
      support: "실제 채용공고를 분석해 <br> 기업이 어떤 판단 방식과 <br> 일하는 흐름을 중요하게 보는지 확인해보세요.",
      primary: "이 직무 리포트 공유하기",
      secondary: "계속 이 직무 보기",
      footnote: null,
      footer: "분석 결과는 참고용입니다",
      checklist: [
        "기업에서 중요한 업무 수행 방식",
        "AI 협업형 업무 흐름 변화",
        "판단·조율 중심 업무 방식",
      ],
      jdFocus: "cover",
    },
    en: {
      question: "What should applicants emphasize for this role?",
      support: "Study winning cover letters and interview angles to build your strategy.",
      primary: "Build cover & interview strategy",
      secondary: "Role-level summary only",
      footnote: null,
      footer: "Save and customize after sign-up",
      checklist: [
        "Winning cover letter patterns",
        "Interview Q&A points",
        "Experience mapping tips",
        "Role-specific strategy report",
      ],
      jdFocus: "cover",
    },
  },
  "after-s4": {
    ko: {
      question: "AI를 활용할 때, <br> 당신은 어떤 역할을 맡게 될까요?",
      support: "실제 채용공고를 분석해 <br> 기업이 어떤 역할과 책임을 <br> 중요하게 보는지 확인해보세요.",
      primary: "이 직무 리포트 공유하기",
      secondary: "계속 이 직무 보기",
      footnote: null,
      footer: "분석 결과는 참고용입니다",
      checklist: ["사람이 더 맡는 역할과 책임", "강조해야할 경험 유형", "자소서·면접에서 보여줄 역할 인식"],
      jdFocus: "experience",
    },
    en: {
      question: "Where does your edge sit in the AI-era version of this role?",
      support: "Same role structure—different strengths and gaps for your background.",
      primary: "Build my experience strategy",
      secondary: "Compare two postings (2-pack)",
      footnote: null,
      footer: "Available after sign-up",
      checklist: [
        "Competitiveness check",
        "Strengths & gaps",
        "Growth opportunities",
        "Personal strategy roadmap",
      ],
      jdFocus: "experience",
    },
  },
  closing: {
    ko: {
      question: "방향은 잡혔습니다. 이 직무의 역할 이동을 기준으로 액션을 실행해 보세요.",
      support:
        "특정 연도의 직업 소멸 확률이 아니라, 현재 업무 구조와 AI 개입 수준을 바탕으로 한 해석입니다.",
      primary: "이 리포트 공유하기",
      secondary: "직무 분석으로 돌아가기",
      footnote: "미래의 직무 비중을 정밀 예측하는 시뮬레이터가 아닙니다.",
      footer: "분석 결과는 참고용입니다",
      checklist: ["역할 이동 방향", "역량 중요도 변화", "단기·중기 액션", "직무 구조 해석"],
      jdFocus: null,
      purchaseSku: "PKG-2",
    },
    en: {
      question: "You have the direction. Next: narrow it to your target postings.",
      support:
        "Analyze two postings—what to stress and how to frame it in applications and interviews.",
      primary: "Start 2-posting pack",
      secondary: "One posting only",
      footnote: "We connect why an experience matters—not auto-generated sentences.",
      footer: "Use within 90 days after purchase",
      checklist: [
        "Deep dive on 2 postings",
        "Cover letter & interview links",
        "Emphasis summary",
        "Includes 2 credits",
      ],
      jdFocus: null,
      purchaseSku: "PKG-2",
    },
  },
  "share-only": {
    ko: {
      question: "이 인사이트, 팀이나 친구에게도 공유해 보세요",
      support: "링크만으로 같은 직무 리포트를 열 수 있습니다.",
      primary: "공유하기",
      secondary: null,
      footnote: null,
      footer: null,
      checklist: null,
      jdFocus: null,
    },
    en: {
      question: "Share this insight with your team or friends",
      support: "Anyone can open the same role report from your link.",
      primary: "Share",
      secondary: null,
      footnote: null,
      footer: null,
      checklist: null,
      jdFocus: null,
    },
  },
};

/** @param {ReportCtaVariant} variant */
export function getReportCtaTheme(variant) {
  if (variant === "after-s2") return "red";
  if (variant === "after-s3") return "purple";
  if (variant === "after-s4") return "blue";
  if (variant === "closing") return "closing";
  return null;
}

/** @param {ReportCtaVariant} variant */
export function getReportCtaCopy(variant, lang) {
  const block = REPORT_CTA_COPY[variant];
  if (!block) return null;
  return lang === "ko" ? block.ko : block.en;
}

/** @param {string} soc @param {string} lang */
export function buildShareReportUrl(soc, lang) {
  if (typeof window === "undefined") return "";
  const extra = new URLSearchParams();
  if (lang) extra.set("lang", lang);
  extra.set("utm_source", "share");
  const path = buildFutureCompetitivenessUrl({
    soc,
    tab: "analysis",
    reviewContract: null,
    search: extra.toString(),
    pathname: "/future-competitiveness",
  });
  return `${window.location.origin}${path}`;
}
