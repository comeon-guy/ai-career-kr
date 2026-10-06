import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { buildFutureCompetitivenessUrl } from "./fcUrl.js";
import "./report-integrated.css";
import "./styles/report-typography.css";
import { SectionGuide } from "./components/guide/SectionGuide.jsx";
import Section2ValueShift, { parseSection2ValueShift } from "./components/report/Section2ValueShift.jsx";
import {
  SECTION_2_VALUE_SHIFT_MOCK_EN,
  SECTION_2_VALUE_SHIFT_MOCK_KO,
} from "./components/report/section2ValueShift.mock.js";
import Section3WorkStyle, { parseSection3WorkStyle } from "./components/report/Section3WorkStyle.jsx";
import {
  SECTION_3_WORK_STYLE_MOCK_EN,
  SECTION_3_WORK_STYLE_MOCK_KO,
} from "./components/report/section3WorkStyle.mock.js";
import Section4TaskAiRole from "./components/report/Section4TaskAiRole.jsx";
import TaskAnalysisSection, { useTaskAnalysis } from "./components/report/TaskAnalysisSection.jsx";
import { formatOccupationUserFacing } from "./occupationUserFacing.js";
import MethodologyReferenceView from "./components/report/MethodologyReferenceView.jsx";
import TaskRoleComposition from "./components/report/TaskRoleComposition.jsx";
import TaskRoleAxisShares from "./components/report/TaskRoleAxisShares.jsx";
import {
  selectTaskRoleAxisHighShares,
  selectTaskRoleComposition,
  selectTaskRoleCompositionV2,
} from "./components/report/taskRoleComposition.js";
import {
  DATA_CONTRACT_TASK_ROLE_FINAL,
  isTaskRoleFinalDataContract,
} from "./dataContract.js";
import EditorialValueShift from "./components/report/EditorialValueShift.jsx";
import { getValueShiftPresentation } from "./utils/getValueShiftPresentation.js";
import WorkScenarios from "./components/report/WorkScenarios.jsx";
import ReportSectionNav from "./components/report/ReportSectionNav.jsx";
import {
  REPORT_FOOTER,
  REPORT_HERO,
  buildAllTasksReportCta,
  reportSectionLabel,
  reportSectionNumber,
} from "./reportStructure.js";
import {
  isReportStoryFlowPilotSoc,
  STORY_FLOW_INDEPENDENT_AXES_NOTE,
  STORY_FLOW_TRAINING_CTA,
} from "./reportStoryFlowPilot.js";
import { buildReportReferenceCopy } from "./components/report/reportTrustLayer.js";
import {
  hasAIWorkingSection,
} from "./components/my-reports/reportContentSections.js";
import {
  readReviewModeFromWindow,
  selectRepresentativeSituations,
} from "./components/report/selectRepresentativeSituations.js";
import "./components/report/editorial-report.css";
import "./styles/fc-report.css";
import { isReviewContractParam, isPositionMapV2ReviewParam, isPositionMapV2CalibrationParam, isProductionCandidateReviewParam, REVIEW_CONTRACT_PRODUCTION_CANDIDATE } from "./reviewContract.js";
import { resolveApiBase } from "./apiBase.js";
import PositionMapV2Calibration from "./components/report/PositionMapV2Calibration.jsx";
import { resolveHeroPresentation } from "./heroThesisAdapter.js";
import { resolvePositionInterpretation } from "./positionInterpretation.js";
import { resolveAiImpactBuckets } from "./utils/taskAiImpactComposition.js";
import {
  inferWorkType,
  getAiImpactReason,
  getAiLevelByMode,
  getFrequencyScore,
  getAiReasonByMode,
} from "./utils/reportTaskAiHelpers.js";
import { useReportSection4Derived } from "./hooks/useReportSection4Derived.js";
import { buildStructureBasedTopMessages } from "./utils/taskStructureNarrative.js";
import { stripPercentRestatement } from "./utils/narrativeCore.js";
import { polishInsightText } from "./utils/narrativeQuality.js";
import {
  finalizeUiStructuredJson,
  firstInsightSentence,
  textsAreRedundant,
} from "./utils/narrativeSanitize.js";
import { ReportCtaCard } from "./components/report/ReportCtaCard.jsx";
import { SaveToCareerLibrary } from "./components/report/SaveToCareerLibrary.jsx";
import { buildShareReportUrl } from "./constants/reportCtaCopy.js";
import PositionMapRefresh from "./components/report/PositionMapRefresh.jsx";
import { buildQuadDensityCells, buildQuadScatterCloudPoints } from "./components/report/positionMapScatter.js";
import { PositionScoreEvidence } from "./components/report/EvidenceTrace.jsx";
import "./components/report/evidence-trace.css";
import { resolveOccupationId } from "./kr/occupationId.js";

const REPORT_SHELL_VIEWS = new Set(["report", "all-tasks", "methodology"]);

function readReportShellView(search = "") {
  const params = new URLSearchParams(search || (typeof window !== "undefined" ? window.location.search : ""));
  const raw = params.get("view");
  if (REPORT_SHELL_VIEWS.has(raw)) return raw;
  // Production candidate acceptance: open Task Analysis directly.
  if (isProductionCandidateReviewParam(params.get("review_contract"))) return "all-tasks";
  return "report";
}

function getReportScrollRoot() {
  if (typeof document === "undefined") return null;
  return document.querySelector(".report-view-scroll") || document.querySelector(".report-tabs-scroll");
}

function syncReportShellViewUrl(view, { replace = false } = {}) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (view === "report") url.searchParams.delete("view");
  else url.searchParams.set("view", view);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const state = { ...(window.history.state || {}), reportShellView: view };
  if (replace) window.history.replaceState(state, "", next);
  else window.history.pushState(state, "", next);
}

const INITIAL_SHOW = 3;

/** 리포트 섹션 제목: 앞 번호는 시각 배지, 본문은 children */
function ReportSectionHeading({ step, children, className = "summary-v2-heading" }) {
  return (
    <h2 className={`${className} summary-v2-heading--with-step`}>
      <span className="summary-v2-heading__step">{step}</span>
      <span className="summary-v2-heading__text">{children}</span>
    </h2>
  );
}

// 업무 유형 뱃지 색 (도넛·범례와 동일)
const WORK_TYPE_STYLES = {
  analysis_report: { background: "var(--blue-soft)", color: "var(--blue)" },
  organize_routine: { background: "var(--orange-soft)", color: "var(--orange)" },
  judgment_explanation: { background: "var(--purple-soft)", color: "var(--purple)" },
};

function formatWorkType(code, lang) {
  const c = (code || "").toLowerCase();
  if (c === "analysis_report") return lang === "ko" ? "분석·보고" : "Analysis/report";
  if (c === "organize_routine") return lang === "ko" ? "정리·반복" : "Organize/routine";
  if (c === "judgment_explanation") return lang === "ko" ? "판단·설명" : "Judgment/explain";
  return code || "—";
}

function formatAiImpact(code, lang) {
  const c = (code || "").toLowerCase();
  if (c === "high" || c === "자동화 가능" || c === "자동화 지원형")
    return lang === "ko" ? "자동화 지원형" : "Automation-supported";
  if (c === "medium" || c === "ai 협업") return lang === "ko" ? "AI 협업" : "AI collaboration";
  if (c === "low" || c === "인간 중심") return lang === "ko" ? "인간 중심" : "Human-centric";
  return code || "—";
}

function trimEditorialText(v) {
  return v == null ? "" : String(v).trim();
}

function editorialStringList(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return trimEditorialText(x);
      if (!x || typeof x !== "object") return "";
      return trimEditorialText(x.text ?? x.step ?? x.title ?? x.task_text ?? x.task_text);
    })
    .filter(Boolean);
}

// DB 번역 없을 때 한국어 표시용 역량명 매핑 (지식·기술·능력)
const CAPABILITY_NAME_KO = {
  // Knowledge
  "Computers and Electronics": "컴퓨터 및 전자",
  "Customer and Personal Service": "고객·개인 서비스",
  "Administration and Management": "행정 및 경영",
  "Education and Training": "교육 및 훈련",
  "Telecommunications": "통신",
  "Engineering and Technology": "공학 및 기술",
  "Administrative": "행정",
  "Personnel and Human Resources": "인사·인적자원",
  "Mathematics": "수학",
  "English Language": "영어",
  "Science": "과학",
  "Clerical": "사무",
  "Sales and Marketing": "영업 및 마케팅",
  "Economics and Accounting": "경제·회계",
  "Law and Government": "법률 및 정부",
  "Communications and Media": "커뮤니케이션 및 미디어",
  "Psychology": "심리학",
  "Geography": "지리",
  "Foreign Language": "외국어",
  "Philosophy and Theology": "철학 및 신학",
  "Sociology and Anthropology": "사회학 및 인류학",
  "Medicine and Dentistry": "의학 및 치의학",
  "Chemistry": "화학",
  "Biology": "생물학",
  "Physics": "물리학",
  "Building and Construction": "건축 및 건설",
  "Mechanical": "기계",
  "Design": "디자인",
  "Food Production": "식품 생산",
  "History and Archeology": "역사 및 고고학",
  "Fine Arts": "미술",
  "Therapy and Counseling": "치료 및 상담",
  "Transportation": "운송",
  "Public Safety and Security": "공공 안전 및 보안",
  // Skills
  "Analytical Thinking": "분석적 사고",
  "Critical Thinking": "비판적 사고",
  "Reading Comprehension": "독해",
  "Active Listening": "적극적 경청",
  "Writing": "글쓰기",
  "Speaking": "말하기",
  "Active Learning": "적극적 학습",
  "Learning Strategies": "학습 전략",
  "Monitoring": "모니터링",
  "Complex Problem Solving": "복잡한 문제 해결",
  "Judgment and Decision Making": "판단 및 의사결정",
  "Systems Analysis": "시스템 분석",
  "Systems Evaluation": "시스템 평가",
  "Time Management": "시간 관리",
  "Management of Financial Resources": "재정 자원 관리",
  "Management of Material Resources": "물적 자원 관리",
  "Management of Personnel Resources": "인적 자원 관리",
  "Coordination": "조정",
  "Instructing": "지시·교육",
  "Service Orientation": "서비스 지향",
  "Social Perceptiveness": "사회적 통찰",
  "Persuasion": "설득",
  "Negotiation": "협상",
  "Quality Control Analysis": "품질 관리 분석",
  "Operations Analysis": "운영 분석",
  "Technology Design": "기술 설계",
  "Programming": "프로그래밍",
  "Operations Monitoring": "운영 모니터링",
  "Equipment Selection": "장비 선정",
  "Installation": "설치",
  "Troubleshooting": "문제 해결",
  "Equipment Maintenance": "장비 유지보수",
  "Repairing": "수리",
  // Abilities
  "Deductive Reasoning": "연역적 추론",
  "Written Comprehension": "문서 이해",
  "Information Ordering": "정보 정렬",
  "Oral Comprehension": "구어 이해",
  "Oral Expression": "구어 표현",
  "Near Vision": "근거리 시력",
  "Problem Sensitivity": "문제 감수성",
  "Inductive Reasoning": "귀납적 추론",
  "Speech Recognition": "음성 인식",
  "Speech Clarity": "발음 명료성",
  "Written Expression": "문서 작성",
  "Category Flexibility": "범주 유연성",
  "Selective Attention": "선택적 주의",
  "Mathematical Reasoning": "수학적 추론",
  "Flexibility of Closure": "폐쇄 유연성",
  "Perceptual Speed": "지각 속도",
  "Memorization": "기억",
  "Speed of Closure": "통합 속도",
  "Time Sharing": "시간 분배",
  "Far Vision": "원거리 시력",
  "Visual Color Discrimination": "색 구분",
  "Night Vision": "야간 시력",
  "Peripheral Vision": "주변 시야",
  "Depth Perception": "깊이 지각",
  "Glare Sensitivity": "눈부심 민감도",
  "Hearing Sensitivity": "청각 민감도",
  "Auditory Attention": "청각 주의",
  "Sound Localization": "음원 위치",
  "Arm-Hand Steadiness": "팔·손 안정성",
  "Manual Dexterity": "손재주",
  "Finger Dexterity": "손가락 민첩성",
  "Control Precision": "조작 정밀도",
  "Multilimb Coordination": "사지 협응",
  "Response Orientation": "반응 방향",
  "Rate Control": "속도 조절",
  "Reaction Time": "반응 시간",
  "Wrist-Finger Speed": "손목·손가락 속도",
  "Speed of Limb Movement": "사지 속도",
  "Static Strength": "정적 근력",
  "Explosive Strength": "순발력",
  "Dynamic Strength": "동적 근력",
  "Trunk Strength": "몸통 근력",
  "Stamina": "지구력",
  "Extent Flexibility": "신체 유연성",
  "Dynamic Flexibility": "동적 유연성",
  "Gross Body Coordination": "전신 협응",
  "Gross Body Equilibrium": "전신 균형",
};

function getCapabilityDisplayName(c, lang) {
  if (!c) return "—";
  if (lang === "ko" && c.element_name_ko) return c.element_name_ko;
  const en = (c.element_name || "").trim();
  if (lang === "ko" && en && CAPABILITY_NAME_KO[en]) return CAPABILITY_NAME_KO[en];
  return en || "—";
}

/** API에서 온 역량명 문자열을 lang에 맞게 표시 (배지 등) */
function translateCapabilityName(name, lang) {
  if (!name || lang !== "ko") return name || "";
  const trimmed = (name || "").trim();
  return CAPABILITY_NAME_KO[trimmed] || trimmed;
}

/** 핵심 인사이트: '…자동화로 [바로] 대체되기보다[,는]'까지 도입부 제거 후 본문만 표시 */
function stripAutomationReplacementLeadInForInsight(text, lang) {
  const s = String(text || "").trim();
  if (!s) return s;
  if (lang === "ko") {
    const next = s.replace(/^[\s\S]*?자동화로\s*(?:바로\s*)?대체되기보다(?:는)?[,，]?\s*/u, "").trim();
    return next.length > 0 ? next : s;
  }
  if (lang === "en") {
    const next = s
      .replace(/^[\s\S]*?\brather than (?:being )?replaced by automation[,，]?\s*/i, "")
      .trim();
    return next.length > 0 ? next : s;
  }
  return s;
}

/**
 * 리포트 뷰: report-integrated.html 구조를 따르며 API 데이터만 바인딩합니다.
 * props: { report, profile, lang, scatter, ctaPlacement?: 'inline' | 'rail' }
 */
export default function ReportIntegrated({
  report,
  profile,
  lang,
  scatter,
  ctaPlacement = "inline",
  viewerMode = false,
  librarySaved = false,
  librarySaving = false,
  onLibrarySave,
  libraryHref = "",
  onShellViewChange = null,
  onShellBackHandlerChange = null,
}) {
  const showInlineCtas = ctaPlacement !== "rail";
  const navigate = useNavigate();
  const location = useLocation();
  const socForCta = resolveOccupationId(profile, report);
  const storyFlowPilot = isReportStoryFlowPilotSoc(socForCta, report);
  const [expandKsa, setExpandKsa] = useState(false);
  const [expandTasks, setExpandTasks] = useState(false);
  const [workloadViewMode, setWorkloadViewMode] = useState("weight"); // "weight" | "count"
  const [positionMapZoomOpen, setPositionMapZoomOpen] = useState(false);
  const [taskSort, setTaskSort] = useState({ key: null, dir: "desc" });
  const [shellView, setShellView] = useState(() => readReportShellView(location.search));
  const [evidenceFocusIds, setEvidenceFocusIds] = useState([]);
  const reportScrollTopRef = useRef(0);
  const pendingReportScrollRestoreRef = useRef(false);

  useEffect(() => {
    onShellViewChange?.(shellView);
  }, [shellView, onShellViewChange]);

  useEffect(() => {
    const onPopState = () => {
      const next = readReportShellView(window.location.search);
      if (next === "report") pendingReportScrollRestoreRef.current = true;
      setShellView(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (shellView !== "report" || !pendingReportScrollRestoreRef.current) return undefined;
    pendingReportScrollRestoreRef.current = false;
    const top = reportScrollTopRef.current;
    const apply = () => {
      const root = getReportScrollRoot();
      if (!root) return;
      if (typeof root.scrollTo === "function") {
        root.scrollTo({ top, left: 0, behavior: "instant" });
      } else {
        root.scrollTop = top;
      }
    };
    apply();
    const raf = window.requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 0);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [shellView]);

  const openReferenceView = useCallback(
    (view, ids = []) => {
      if (shellView === "report") {
        const root = getReportScrollRoot();
        if (root) reportScrollTopRef.current = root.scrollTop;
      }
      const nextIds = Array.isArray(ids)
        ? ids.map((id) => String(id || "").trim()).filter(Boolean)
        : [];
      setEvidenceFocusIds(nextIds);
      setShellView(view);
      syncReportShellViewUrl(view, { replace: false });
      window.requestAnimationFrame(() => {
        const root = getReportScrollRoot();
        if (root) root.scrollTop = 0;
      });
    },
    [shellView],
  );

  const handleOpenEvidence = useCallback(
    (ids) => {
      openReferenceView("all-tasks", ids);
    },
    [openReferenceView],
  );

  const handleCloseEvidence = useCallback(() => {
    setEvidenceFocusIds([]);
    pendingReportScrollRestoreRef.current = true;
    setShellView("report");
    syncReportShellViewUrl("report", { replace: true });
  }, []);

  useEffect(() => {
    if (typeof onShellBackHandlerChange !== "function") return undefined;
    onShellBackHandlerChange(handleCloseEvidence);
    return () => onShellBackHandlerChange(null);
  }, [onShellBackHandlerChange, handleCloseEvidence]);

  const handleOpenMethodology = useCallback(() => {
    openReferenceView("methodology");
  }, [openReferenceView]);

  const productionCandidateReview = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isProductionCandidateReviewParam(
      new URLSearchParams(window.location.search).get("review_contract"),
    );
  }, [location.search]);

  const finalDataContractActive = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isTaskRoleFinalDataContract(
      new URLSearchParams(window.location.search).get("data_contract"),
    );
  }, [location.search]);

  const { data: taskAnalysisPayload } = useTaskAnalysis(
    socForCta,
    lang,
    productionCandidateReview ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE : null,
    finalDataContractActive ? DATA_CONTRACT_TASK_ROLE_FINAL : null,
  );
  /** V2 Task Analysis composition — 2 independent axes; no AUTOMATION; no legacy fallback. */
  const reportRoleComposition = useMemo(
    () =>
      taskAnalysisPayload
        ? selectTaskRoleCompositionV2(taskAnalysisPayload, { lang })
        : selectTaskRoleComposition(null, { lang }),
    [taskAnalysisPayload, lang],
  );
  // Review-only axis shares UI — V2 H_share_resolved only.
  const reportAxisHighShares = useMemo(
    () => selectTaskRoleAxisHighShares(taskAnalysisPayload, { lang }),
    [taskAnalysisPayload, lang],
  );

  /** Task Analysis "전체 업무 구성" — V2 independent 2-axis shares. */
  const reportCompositionViz = useMemo(() => {
    if (!taskAnalysisPayload) {
      return {
        mode: "independent",
        contract: "independent_v2",
        total: 0,
        categories: [],
        hasShares: false,
        exclusive_mapping_used: false,
        role_counts_used: false,
        automation_used: false,
      };
    }
    return selectTaskRoleCompositionV2(taskAnalysisPayload, { lang });
  }, [taskAnalysisPayload, lang]);

  const positionMapV2Enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const rc = new URLSearchParams(window.location.search).get("review_contract");
    return isPositionMapV2ReviewParam(rc) || isProductionCandidateReviewParam(rc);
  }, [location.search]);

  const positionMapV2Calibration = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (
      isPositionMapV2ReviewParam(params.get("review_contract")) &&
      isPositionMapV2CalibrationParam(params.get("calibration"))
    );
  }, [location.search]);

  const [positionMapV2, setPositionMapV2] = useState(null);
  useEffect(() => {
    if (!positionMapV2Enabled || !socForCta) {
      setPositionMapV2(null);
      return undefined;
    }
    const apiBase = resolveApiBase();
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const rc = isProductionCandidateReviewParam(params.get("review_contract"))
      ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE
      : "task-role-v2";
    const calQ =
      rc === "task-role-v2" && positionMapV2Calibration ? "&calibration=7soc" : "";
    fetch(
      `${apiBase}/jobs/${encodeURIComponent(socForCta)}/position-map?review_contract=${encodeURIComponent(rc)}${calQ}&lang=${encodeURIComponent(lang)}`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!cancelled) setPositionMapV2(data);
      })
      .catch(() => {
        if (!cancelled) setPositionMapV2(null);
      });
    return () => {
      cancelled = true;
    };
  }, [positionMapV2Enabled, positionMapV2Calibration, socForCta, lang]);

  const section4Derived = useReportSection4Derived(report, profile, lang);

  const quadScatterCloudPts = useMemo(() => {
    // Do not mix legacy AEI-space cloud with final Task Role v2 points.
    if (profile?.task_role_v1_final || profile?.legacy_median_suppressed) return [];
    return buildQuadScatterCloudPoints(scatter, socForCta);
  }, [scatter, socForCta, profile?.task_role_v1_final, profile?.legacy_median_suppressed]);
  const quadDensityCells = useMemo(() => buildQuadDensityCells(quadScatterCloudPts, 56), [quadScatterCloudPts]);

  const handleReportShare = async () => {
    const url = buildShareReportUrl(socForCta, lang);
    const title =
      formatOccupationUserFacing({
        socCode: resolveOccupationId(profile, report) || socForCta,
        titleKo: profile?.occupation_title || profile?.occupation_title_ko,
        titleEn: profile?.occupation_title_en,
      }) || socForCta;
    const text =
      lang === "ko"
        ? `「${title}」 AI 시대 커리어 전략 리포트 — AIFit`
        : `AI-era career strategy report for 「${title}」 — AIFit`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const handleScatterDotActivate = (soc) => {
    if (viewerMode) return;
    const s = String(soc || "").trim();
    if (!s) return;
    navigate(
      buildFutureCompetitivenessUrl({
        soc: s,
        tab: "analysis",
      }),
    );
  };

  useEffect(() => {
    const table = report?.task_capability_table;
    const buildInfo = report?.report_build_info;
    if (typeof console !== "undefined" && console.log) {
      if (buildInfo) {
        const keys = buildInfo.task_ksa_map_keys;
        const len = buildInfo.task_ksa_map_len;
        const err = buildInfo.task_ksa_error;
        console.log("[ReportIntegrated] report_build_info:", { task_ksa_map_keys: keys, task_ksa_map_len: len, task_ksa_error: err });
      }
      if (Array.isArray(table) && table.length > 0) {
        const perRow = table.map((r, i) => ({ row: i, task_id: r.task_id, tags: r.capability_tags }));
        console.log("[ReportIntegrated] task_capability_table 수신:", perRow);
        table.forEach((r, i) => {
          console.log(`  행${i + 1} task_id=${r.task_id} capability_tags=`, r.capability_tags);
        });
      }
    }
  }, [socForCta, report?.task_capability_table, report?.report_build_info]);

  if (!report || !profile) return null;

  const title =
    formatOccupationUserFacing({
      socCode: resolveOccupationId(profile, report) || socForCta,
      titleKo: profile.occupation_title || profile.occupation_title_ko,
      titleEn: profile.occupation_title_en,
    }) ||
    profile.occupation_title ||
    "";
  const structureTopMessages = buildStructureBasedTopMessages(report, lang);
  const summaryMainHeading =
    (report.career_summary_heading && String(report.career_summary_heading).trim()) ||
    (lang === "ko" ? "AI 시대, 이 직무의 핵심 변화" : "AI era: core shifts for this role");
  const careerPositioningTitle = (report.career_positioning_title && String(report.career_positioning_title).trim()) || "";
  const careerPositioningBodyRaw = polishInsightText(
    (report.career_positioning_body && String(report.career_positioning_body).trim()) || "",
    lang,
  );
  const careerPositioningBodyFromStructure = structureTopMessages?.positioningBody || "";
  let careerPositioningBody = careerPositioningBodyRaw || careerPositioningBodyFromStructure;
  const careerTaskChangeIntro = (report.career_task_change_intro && String(report.career_task_change_intro).trim()) || "";
  const positionTypeLabelRaw = (report.position_type_label && String(report.position_type_label).trim()) || "";
  const positionTypeLabel =
    structureTopMessages?.structureTags?.[0] || careerPositioningTitle || positionTypeLabelRaw;
  const tasksToShiftFirst = Array.isArray(report.tasks_to_shift_first)
    ? report.tasks_to_shift_first.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const growingCapabilities = Array.isArray(report.growing_capabilities)
    ? report.growing_capabilities.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const shrinkingRoles = Array.isArray(report.shrinking_roles)
    ? report.shrinking_roles.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const advantageousPeople = Array.isArray(report.advantageous_people)
    ? report.advantageous_people.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const roleRecompositionTable = Array.isArray(report.role_recomposition_table)
    ? report.role_recomposition_table
        .filter((row) => row && row.current_role && row.future_role)
        .map((row) => ({
          current_role: String(row.current_role || "").trim(),
          future_role: String(row.future_role || "").trim(),
        }))
    : [];
  const valueShiftHeading =
    lang === "ko"
      ? "앞으로 더 중요해질 일과 덜 중요해질 일"
      : (report.value_shift_heading && String(report.value_shift_heading).trim()) ||
        "What becomes more important—and less";
  const valueShiftOpeningParagraphs = Array.isArray(report.value_shift_opening_paragraphs)
    ? report.value_shift_opening_paragraphs.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const valueDeclineTasks = Array.isArray(report.value_decline_tasks)
    ? report.value_decline_tasks.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const valueRiseTasks = Array.isArray(report.value_rise_tasks)
    ? report.value_rise_tasks.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const valueDeclineInterpretation =
    (report.value_decline_interpretation && String(report.value_decline_interpretation).trim()) || "";
  const valueRiseInterpretation = (report.value_rise_interpretation && String(report.value_rise_interpretation).trim()) || "";
  const valueShiftConclusionRaw = polishInsightText(
    (report.value_shift_conclusion && String(report.value_shift_conclusion).trim()) || "",
    lang,
  );
  const valueShiftConclusion =
    valueShiftConclusionRaw || structureTopMessages?.heroInsight || "";
  if (textsAreRedundant(valueShiftConclusion, careerPositioningBody)) {
    careerPositioningBody = "";
  }
  const showJobDirectionCard = Boolean(careerPositioningBody.trim());
  const hasCurrentPositionCard = showJobDirectionCard || Boolean(positionTypeLabel || careerPositioningTitle);
  const valueShiftConclusionInsight = stripAutomationReplacementLeadInForInsight(valueShiftConclusion, lang);
  const capabilityShiftTable = Array.isArray(report.capability_shift_table)
    ? report.capability_shift_table
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const was = String(row.was_important ?? row.current_role ?? "").trim();
          const becomes = String(row.becomes_important ?? row.future_role ?? "").trim();
          if (!was || !becomes) return null;
          return { was_important: was, becomes_important: becomes };
        })
        .filter(Boolean)
    : [];
  const valueShiftNarrativeVersionNum = Number(report.value_shift_narrative_version);
  let uiStructuredParsed = report.ui_structured_json;
  if (typeof uiStructuredParsed === "string") {
    try {
      uiStructuredParsed = JSON.parse(uiStructuredParsed);
    } catch {
      uiStructuredParsed = null;
    }
  }
  if (uiStructuredParsed && typeof uiStructuredParsed !== "object") uiStructuredParsed = null;
  if (uiStructuredParsed && typeof uiStructuredParsed === "object") {
    uiStructuredParsed = finalizeUiStructuredJson(uiStructuredParsed, report, lang);
  }
  const section2ValueShiftRaw =
    uiStructuredParsed && typeof uiStructuredParsed === "object"
      ? uiStructuredParsed.section_2_value_shift ?? uiStructuredParsed.report_ui?.section_2_value_shift
      : null;
  const section2FromApi = parseSection2ValueShift(section2ValueShiftRaw, { lang });
  const section2MockPayload = lang !== "en" ? SECTION_2_VALUE_SHIFT_MOCK_KO : SECTION_2_VALUE_SHIFT_MOCK_EN;
  const section2FromMock = parseSection2ValueShift(section2MockPayload, { lang });
  const allowSection2Mock =
    import.meta.env.DEV || String(import.meta.env.VITE_SECTION2_MOCK || "").toLowerCase() === "true";
  const section2ValueShiftData = section2FromApi ?? (allowSection2Mock ? section2FromMock : null);
  const hasSection2ValueShiftUi = Boolean(section2ValueShiftData);
  const section3WorkStyleRaw =
    uiStructuredParsed && typeof uiStructuredParsed === "object"
      ? uiStructuredParsed.section_3_work_style ?? uiStructuredParsed.report_ui?.section_3_work_style
      : null;
  const section3FromApi = parseSection3WorkStyle(section3WorkStyleRaw);
  const section3MockPayload = lang !== "en" ? SECTION_3_WORK_STYLE_MOCK_KO : SECTION_3_WORK_STYLE_MOCK_EN;
  const section3FromMock = parseSection3WorkStyle(section3MockPayload);
  const allowSection3Mock =
    import.meta.env.DEV || String(import.meta.env.VITE_SECTION3_MOCK || "").toLowerCase() === "true";
  const section3WorkStyleData = section3FromApi ?? (allowSection3Mock ? section3FromMock : null);
  const hasSection3WorkStyleUi = Boolean(section3WorkStyleData);
  const hasRoleOutlookContent = capabilityShiftTable.length > 0 || advantageousPeople.length > 0;
  const hasValueShiftPrimaryBlocks = Boolean(
    valueShiftOpeningParagraphs.length > 0 ||
      valueDeclineTasks.length > 0 ||
      valueRiseTasks.length > 0 ||
      valueDeclineInterpretation ||
      valueRiseInterpretation,
  );
  const hasValueShiftNarrative = Boolean(
    hasSection2ValueShiftUi ||
      (Number.isFinite(valueShiftNarrativeVersionNum) && valueShiftNarrativeVersionNum === 2) ||
      hasValueShiftPrimaryBlocks ||
      hasRoleOutlookContent ||
      valueShiftConclusion,
  );
  /** 유리한 사람 + 역량 이동 카드 */
  const outlookVsHeading =
    lang === "ko" ? "앞으로 경쟁력이 되는 일하는 방식" : "Ways of working that build competitive strength";
  const workKsaSectionTitle =
    lang === "ko" ? "이 직무는 실제로 어떤 일을 하나" : "What this role actually does";
  const heatmapSectionTitle = lang === "ko" ? "업무별 AI 영향" : "AI impact by task";
  const whoBenefitsCardBadgeEmoji = "💎";
  const whoBenefitsCardTitle =
    lang === "ko"
      ? "일하는 방식 변화"
      : "Shift in ways of working";
  const whoBenefitsCardSubtitle =
    lang === "ko"
      ? ""
      : "Stronger demand for judgment, verification, and accountability—not just output volume.";
  const advantageLeadStaticKo = (
    <>
      미래 경쟁력은 <strong>&apos;더 많이 아는 것&apos;</strong>보다{" "}
      <strong>&apos;더 잘 판단하는 것&apos;</strong>
    </>
  );
  const advantageLeadStaticEn = (
    <>
      Future competitiveness: more about <strong>&quot;judging better&quot;</strong>, less about{" "}
      <strong>&quot;knowing more&quot;</strong>
    </>
  );
  const showOutlookCombined =
    hasValueShiftNarrative &&
    (hasSection3WorkStyleUi || advantageousPeople.length > 0 || capabilityShiftTable.length > 0);
  const capabilityShiftCardBadgeEmoji = "🧩";
  const capabilityShiftCardSubtitle =
    lang === "ko" ? "역량 구조 변화 방향" : "How the capability mix shifts";
  const heroPresentation = resolveHeroPresentation(report, lang);
  const reviewMode = readReviewModeFromWindow();
  const situationPick = selectRepresentativeSituations(report, { reviewMode });
  const workScenariosList = situationPick.scenarios;
  const otherValidSituations = situationPick.otherValid;
  const representativeSelection = situationPick.selection;
  const useEditorialPresentation = Boolean(report && profile);
  const showInsightHero = Boolean(valueShiftConclusion);
  const coreStrategyLabel = report.core_strategy_label || "";
  const reportComposition = report.report_composition || {};
  const workloadBreakdown = report.workload_breakdown || {};
  const taskRoleFinal =
    Boolean(profile.task_role_v1_final) ||
    Boolean(report?.task_role_v1_final) ||
    profile?.score_construct?.legacy_aei_acs === false;
  const medianSuppressed =
    taskRoleFinal ||
    profile.legacy_median_suppressed === true ||
    profile.cohort_median_available === false ||
    profile.tau_aei == null ||
    profile.tau_acs == null;
  const aeiVal = Math.min(1, Math.max(0, Number(profile.aei_job ?? profile.aei_job ?? profile.AEI_job ?? 0) || 0));
  const acsVal = Math.min(1, Math.max(0, Number(profile.acs_job ?? profile.acs_job ?? profile.ACS_job ?? 0) || 0));
  // Task Analysis / Position Map supporting AUTOMATION removed (V2 2-axis).
  // Section4 human|collab|automation is a separate contract and is untouched.
  // Neutral midpoint when 894 final median unavailable — do not claim legacy 44/40.
  const tauAei = medianSuppressed
    ? 0.5
    : Math.min(1, Math.max(0, Number(profile.tau_aei ?? 0.5) || 0.5));
  const tauAcs = medianSuppressed
    ? 0.5
    : Math.min(1, Math.max(0, Number(profile.tau_acs ?? 0.5) || 0.5));
  const tauAeiPct = Math.round(tauAei * 100);
  const tauAcsPct = Math.round(tauAcs * 100);
  const aeiScore = Math.round(aeiVal * 100);
  const acsScore = Math.round(acsVal * 100);
  const scoreLabels = profile.score_labels || {};
  const labelAi =
    scoreLabels.ai ||
    (taskRoleFinal
      ? lang === "ko"
        ? "AI가 크게 도울 수 있는 업무"
        : "Work AI can help a lot with"
      : lang === "ko"
        ? "AI 영향도"
        : "AI impact");
  const labelHuman =
    scoreLabels.human ||
    (taskRoleFinal
      ? lang === "ko"
        ? "사람 판단이 중요한 업무"
        : "Judgment-critical work"
      : lang === "ko"
        ? "사람 판단 중요도"
        : "Human judgment importance");
  const splitV = tauAei;
  const splitH = 1 - tauAcs;
  const quadPointLeft = aeiVal * 100;
  const quadPointTop = (1 - acsVal) * 100;
  // Minimal semantic correction for Task Role v2 axes (no redesign).
  const quadLabels = taskRoleFinal
    ? {
        tl: lang === "ko" ? "AI 도움 낮음 · 사람 판단 높음" : "Lower AI help · Higher human judgment",
        tr: lang === "ko" ? "AI 도움 높음 · 사람 판단 높음" : "Higher AI help · Higher human judgment",
        bl: lang === "ko" ? "AI 도움 낮음 · 사람 판단 낮음" : "Lower AI help · Lower human judgment",
        br: lang === "ko" ? "AI 도움 높음 · 사람 판단 낮음" : "Higher AI help · Lower human judgment",
      }
    : {
        tl: lang === "ko" ? "사람 중심 직무" : "Human-centric role",
        tr: lang === "ko" ? "AI 협업형 직무" : "AI collaboration role",
        bl: lang === "ko" ? "AI 영향 낮은 직무" : "Lower AI-impact role",
        br: lang === "ko" ? "AI 보강 여지 큰 직무" : "High AI-augmentation potential",
      };
  const tasks = report.tasks || [];
  const taskCapabilityTable = report.task_capability_table || [];
  const knowledge = report.knowledge || [];
  const skills = report.skills || [];
  const abilities = report.abilities || [];
  const importantCaps = report.important_capability_labels || [];
  const top5 = tasks.slice(0, 5);
  const totalWeight = tasks.reduce((s, t) => s + (Number(t.weight_norm) || 0), 0) || 1;
  const TASK_INITIAL_SHOW = 5;
  const {
    highImpact,
    lowImpact,
    displayComposition,
    section4TaskAiRoleData,
    section4TaskCardsForFilters,
    hasSection4TaskAiRoleUi,
  } = section4Derived;
  const impactBucketsFallback =
    displayComposition == null ? resolveAiImpactBuckets(tasks, getAiLevelByMode) : null;
  const displayCompositionResolved = displayComposition ?? impactBucketsFallback?.displayComposition;
  const highImpactResolved = highImpact.length ? highImpact : impactBucketsFallback?.highImpact ?? [];
  const lowImpactResolved = lowImpact.length ? lowImpact : impactBucketsFallback?.lowImpact ?? [];
  const editorialValueShiftData = getValueShiftPresentation({
    section2FromApi,
    valueDeclineTasks,
    valueRiseTasks,
    valueDeclineInterpretation,
    valueRiseInterpretation,
    highImpactTasks: highImpactResolved,
    lowImpactTasks: lowImpactResolved,
    report,
    importantCaps,
    lang,
  });
  const editorialWorkScenarios = workScenariosList;
  const showAIWorking = hasAIWorkingSection(report, { reviewMode });
  const reportReferenceCopy = useMemo(
    () => buildReportReferenceCopy(report, lang),
    [report, lang],
  );
  const positionInterpretation = useMemo(
    () =>
      resolvePositionInterpretation({
        profile,
        taskAnalysis: taskAnalysisPayload,
        lang,
      }),
    [profile, taskAnalysisPayload, lang],
  );
  if (typeof window !== "undefined" && reviewMode) {
    const bind = {
      review_contract: new URLSearchParams(window.location.search).get("review_contract"),
      soc: resolveOccupationId(profile, report) || null,
      narrative_source: report?.career_narrative_meta?.source || null,
      narrative_version: report?.work_scenario_meta?.review_contract || report?.representative_selection?.review_contract || null,
      representative_selection: Boolean(report?.representative_selection),
      recommended_default_set_length: Array.isArray(report?.representative_selection?.default_set)
        ? report.representative_selection.default_set.length
        : 0,
      presentation_order: report?.representative_selection?.presentation_order || [],
      anchor_situation: report?.representative_selection?.anchor_situation || null,
      scenario_map_length: Array.isArray(report?.work_scenarios) ? report.work_scenarios.length : 0,
      other_valid_length: Array.isArray(report?.other_valid_situations) ? report.other_valid_situations.length : 0,
      pick_source: situationPick.source,
      defaultList_length: editorialWorkScenarios.length,
      otherList_length: otherValidSituations.length,
      selected_anchor: representativeSelection?.anchor_situation || null,
    };
    window.__FC_REVIEW_BIND__ = bind;
    const bindKey = `${bind.soc}:${bind.scenario_map_length}:${bind.pick_source}`;
    if (window.__FC_REVIEW_BIND_KEY__ !== bindKey) {
      window.__FC_REVIEW_BIND_KEY__ = bindKey;
      // eslint-disable-next-line no-console
      console.info("[review-contract] WorkScenarios bind", bind);
    }
  }
  // A안(Task LLM 우선)·C안(레이어 분리) 병렬 비교는 B안 전용 정책으로 UI·데이터에서 제외됨.
  const compareRows = tasks.map((t) => {
    const lvB = getAiLevelByMode(t);
    return {
      task_id: t.task_id,
      task: t.task_text,
      b: formatAiImpact(lvB, lang),
      reasonB: getAiReasonByMode(t, lang),
    };
  });

  const sortedTasks = (() => {
    const arr = [...tasks];
    if (!taskSort.key) return arr;
    const dir = taskSort.dir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      const av = (() => {
        switch (taskSort.key) {
          case "importance":
            return Number(a.importance) || 0;
          case "frequency":
            return getFrequencyScore(a);
          case "share":
            return Number(a.weight_norm) || 0;
          case "workType":
            return (a.work_type_llm || a.work_type || inferWorkType(a) || "").localeCompare(
              b.work_type_llm || b.work_type || inferWorkType(b) || ""
            );
          case "aiImpact":
            {
              const level = (a.ai_impact_level_llm || a.ai_impact_level || "medium").toLowerCase();
              const order = level === "high" ? 3 : level === "medium" ? 2 : 1;
              return order;
            }
          default:
            return 0;
        }
      })();
      const bv = (() => {
        switch (taskSort.key) {
          case "importance":
            return Number(b.importance) || 0;
          case "frequency":
            return getFrequencyScore(b);
          case "share":
            return Number(b.weight_norm) || 0;
          case "workType":
            return (b.work_type_llm || b.work_type || inferWorkType(b) || "").localeCompare(
              a.work_type_llm || a.work_type || inferWorkType(a) || ""
            );
          case "aiImpact":
            {
              const level = (b.ai_impact_level_llm || b.ai_impact_level || "medium").toLowerCase();
              const order = level === "high" ? 3 : level === "medium" ? 2 : 1;
              return order;
            }
          default:
            return 0;
        }
      })();
      if (typeof av === "string" || typeof bv === "string") {
        return av.toString().localeCompare(bv.toString()) * dir;
      }
      return (av - bv) * dir;
    });
  })();

  const displayTasks = expandTasks ? sortedTasks : sortedTasks.slice(0, TASK_INITIAL_SHOW);

  // 업무 구성 집중도 (docs/workload-distribution-criteria.md): k/N ≤ 0.30 → 집중형
  const sortedByWeight = [...tasks].sort((a, b) => (Number(b.weight_norm) || 0) - (Number(a.weight_norm) || 0));
  let cumWeight = 0;
  let k70 = sortedByWeight.length;
  for (let i = 0; i < sortedByWeight.length; i++) {
    cumWeight += Number(sortedByWeight[i].weight_norm) || 0;
    if (cumWeight >= 0.7) {
      k70 = i + 1;
      break;
    }
  }
  const N = tasks.length;
  const concentrationRatio = N > 0 ? k70 / N : 0.5;
  const isConcentrated = concentrationRatio <= 0.30;
  const workloadConcentrationType = isConcentrated ? "concentrated" : "distributed";
  const workloadConcentrationLabelKo = isConcentrated ? "집중형" : "분산형";
  const workloadConcentrationLabelEn = isConcentrated ? "Concentrated" : "Distributed";
  const workloadConcentrationCopyKo = isConcentrated
    ? "직무를 구성하는 업무 중 일부 핵심 업무에 전체 업무 비중이 비교적 집중되어 있습니다."
    : "직무 내 업무 비중이 특정 작업에 치우치지 않고 여러 업무에 고르게 분산된 구조입니다.";
  const workloadConcentrationCopyEn = isConcentrated
    ? "Overall task weight is relatively concentrated on a subset of core tasks within the role."
    : "Task weight is not concentrated on specific tasks but distributed evenly across many.";

  // Donut: 비중 기준(직무 내 가중 합) vs 개수 기준(업무 개수 비율)
  const aPct = Number(workloadBreakdown.analysis_report_pct) || 0;
  const rPct = Number(workloadBreakdown.organize_routine_pct) || 0;
  const jPct = Number(workloadBreakdown.judgment_explanation_pct) || 0;
  let aCountPct = Number(workloadBreakdown.analysis_report_count_pct);
  let rCountPct = Number(workloadBreakdown.organize_routine_count_pct);
  let jCountPct = Number(workloadBreakdown.judgment_explanation_count_pct);
  if (Number.isNaN(aCountPct) || Number.isNaN(rCountPct) || Number.isNaN(jCountPct)) {
    const n = tasks.length || 1;
    const nA = tasks.filter((t) => (t.work_type || inferWorkType(t)) === "analysis_report").length;
    const nR = tasks.filter((t) => (t.work_type || inferWorkType(t)) === "organize_routine").length;
    const nJ = tasks.filter((t) => (t.work_type || inferWorkType(t)) === "judgment_explanation").length;
    aCountPct = Math.round((nA / n) * 100);
    rCountPct = Math.round((nR / n) * 100);
    jCountPct = Math.max(0, 100 - aCountPct - rCountPct);
  }
  const dispA = workloadViewMode === "weight" ? aPct : aCountPct;
  const dispR = workloadViewMode === "weight" ? rPct : rCountPct;
  const dispJ = workloadViewMode === "weight" ? jPct : jCountPct;
  const aDeg = (dispA / 100) * 360;
  const rDeg = aDeg + (dispR / 100) * 360;
  const donutStyle = {
    background: `conic-gradient(
      var(--blue) 0deg ${aDeg}deg,
      var(--orange) ${aDeg}deg ${rDeg}deg,
      var(--purple) ${rDeg}deg 360deg
    )`,
  };

  const compAuto = Number(displayCompositionResolved?.automation_pct ?? 0);
  const compCollab = Number(displayCompositionResolved?.collaboration_pct ?? 0);
  const compHuman = Math.max(0, 100 - compAuto - compCollab);
  /* stacked bar: fr 비율로 전체 폭을 항상 채움(플렉스+width% 혼용 시 한 덩어리로 보이지 않는 경우 방지) */
  const stackFrHuman = Math.max(0.001, compHuman);
  const stackFrCollab = Math.max(0.001, compCollab);
  const stackFrAuto = Math.max(0.001, compAuto);

  const AiCompIconUser = () => (
    <svg className="ai-comp-badge__svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  );
  const AiCompIconNetwork = () => (
    <svg className="ai-comp-badge__svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="6" cy="6" r="2.25" fill="currentColor" />
      <circle cx="18" cy="6" r="2.25" fill="currentColor" />
      <circle cx="12" cy="18" r="2.25" fill="currentColor" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M7.5 7.5l3.5 8M16.5 7.5l-3.5 8M7.8 6.2h8.4"
      />
    </svg>
  );
  const AiCompIconGear = () => (
    <svg className="ai-comp-badge__svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  );

  const renderAiCompositionBlock = (variant = "") => (
    <div className={`ai-composition-wrap ai-composition-wrap--stack${variant ? ` ai-composition-wrap--${variant}` : ""}`}>
      <div className="ai-comp-stack" aria-label={lang === "ko" ? "직무 전체 AI 영향 구성(비중)" : "Overall AI impact mix (by weight)"}>
        <div
          className="ai-comp-stack-bar"
          role="img"
          aria-label={
            lang === "ko"
              ? `구성 비중: 사람 중심 ${compHuman}%, AI 협업 ${compCollab}%, 자동화 ${compAuto}%`
              : `Mix: human-centric ${compHuman}%, collaboration ${compCollab}%, automatable ${compAuto}%`
          }
          style={{ gridTemplateColumns: `${stackFrHuman}fr ${stackFrCollab}fr ${stackFrAuto}fr` }}
        >
          <div className="ai-comp-stack-seg ai-comp-stack-seg--human">
            <span className="ai-comp-stack-pct">{compHuman}%</span>
          </div>
          <div className="ai-comp-stack-seg ai-comp-stack-seg--collab">
            <span className="ai-comp-stack-pct">{compCollab}%</span>
          </div>
          <div className="ai-comp-stack-seg ai-comp-stack-seg--auto">
            <span className="ai-comp-stack-pct">{compAuto}%</span>
          </div>
        </div>
        <div className="ai-composition-legend ai-composition-legend--cols">
          <div className="ai-comp-col">
            <div className="ai-comp-col__head">
              <div className="ai-comp-badge ai-comp-badge--human" aria-hidden>
                <AiCompIconUser />
              </div>
              <p className="ai-comp-col__type-line">
                <span className="ai-comp-col__title">{lang === "ko" ? "사람 중심 업무" : "Human-centric work"}</span>
                <span className="ai-comp-col__type-sep" aria-hidden>
                  ·
                </span>
                <span className="ai-comp-col__impact ai-comp-col__impact--human">
                  {lang === "ko" ? "AI 영향 낮음" : "Low AI impact"}
                </span>
              </p>
            </div>
            <p className="ai-comp-col__desc">
              {lang === "ko"
                ? "사람의 판단, 경험, 책임이 핵심임임"
                : "Work where human judgment, experience, and responsibility are central."}
            </p>
          </div>
          <div className="ai-comp-col">
            <div className="ai-comp-col__head">
              <div className="ai-comp-badge ai-comp-badge--collab" aria-hidden>
                <AiCompIconNetwork />
              </div>
              <p className="ai-comp-col__type-line">
                <span className="ai-comp-col__title">{lang === "ko" ? "AI 협업형 업무" : "AI-collaborative work"}</span>
                <span className="ai-comp-col__type-sep" aria-hidden>
                  ·
                </span>
                <span className="ai-comp-col__impact ai-comp-col__impact--collab">
                  {lang === "ko" ? "AI 영향 중간" : "Medium AI impact"}
                </span>
              </p>
            </div>
            <p className="ai-comp-col__desc">
              {lang === "ko"
                ? "AI가 보조/제안, 사람이 최종 판단함"
                : "Work where AI assists and suggests; people make the final judgment."}
            </p>
          </div>
          <div className="ai-comp-col">
            <div className="ai-comp-col__head">
              <div className="ai-comp-badge ai-comp-badge--auto" aria-hidden>
                <AiCompIconGear />
              </div>
              <p className="ai-comp-col__type-line">
                <span className="ai-comp-col__title">{lang === "ko" ? "자동화 지원형 업무" : "Automation-supported work"}</span>
                <span className="ai-comp-col__type-sep" aria-hidden>
                  ·
                </span>
                <span className="ai-comp-col__impact ai-comp-col__impact--auto">
                  {lang === "ko" ? "AI 영향 높음" : "High AI impact"}
                </span>
              </p>
            </div>
            <p className="ai-comp-col__desc">
              {lang === "ko"
                ? "규칙 기반, 반복 업무로 AI대체 가능성 높음"
                : "Rule-based, repetitive work with high potential for AI substitution."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const strategyBullets = Array.isArray(report.core_strategy_bullets) ? report.core_strategy_bullets.filter(Boolean) : [];
  const strategyBlurb =
    (strategyBullets[0] && String(strategyBullets[0]).trim()) ||
    (lang === "ko" ? "직무의 현재 위치를 먼저 확인하세요." : "Start from the current role position.");
  const hasStoryPack =
    tasksToShiftFirst.length > 0 ||
    roleRecompositionTable.length > 0 ||
    growingCapabilities.length > 0 ||
    shrinkingRoles.length > 0 ||
    advantageousPeople.length > 0;

  const renderSummaryQuadPanel = (extraClassName = "", { minimal = false } = {}) => (
    <div className={`summary-v2-quad-panel summary-v2-quad-panel--inline${extraClassName ? ` ${extraClassName}` : ""}`}>
        <div
          className={`quad quad-chart${minimal ? " quad--minimal" : ""}`}
          style={{
            "--split-v": String(splitV),
            "--split-h": String(splitH),
          }}
        >
          <div className="quad-axis-y-stack" aria-hidden>
            <span className="quad-axis-y-end quad-axis-y-end--high">{lang === "ko" ? "높음" : "High"}</span>
            <span className="quad-axis-y-mid">
              {taskRoleFinal
                ? lang === "ko"
                  ? "사람 판단이 중요한 업무 비중"
                  : "Judgment-critical work share"
                : lang === "ko"
                  ? "사람 판단 중요도"
                  : "Human judgment"}
            </span>
            <span className="quad-axis-y-end quad-axis-y-end--low">{lang === "ko" ? "낮음" : "Low"}</span>
          </div>
          <div className="quad-axis-x-dual" aria-hidden>
            <span className="quad-axis-x-side quad-axis-x-side--start">
              {taskRoleFinal ? (lang === "ko" ? "0%" : "0%") : lang === "ko" ? "어려움" : "Harder"}
            </span>
            <span className="quad-axis-x-center">
              {taskRoleFinal
                ? lang === "ko"
                  ? "AI가 크게 도울 수 있는 업무 비중"
                  : "Share of work AI can help a lot with"
                : lang === "ko"
                  ? "AI가 대신하기 쉬운 정도"
                  : "Ease of AI taking on the work"}
            </span>
            <span className="quad-axis-x-side quad-axis-x-side--end">
              {taskRoleFinal ? (lang === "ko" ? "100%" : "100%") : lang === "ko" ? "쉬움" : "Easier"}
            </span>
          </div>
          <div className="quad-plot-area">
            <div
              className="quad-bg quad-bg-tl"
              aria-hidden
              style={{ left: 0, top: 0, right: `${(1 - splitV) * 100}%`, bottom: `${(1 - splitH) * 100}%` }}
            />
            <div
              className="quad-bg quad-bg-tr"
              aria-hidden
              style={{ left: `${splitV * 100}%`, top: 0, right: 0, bottom: `${(1 - splitH) * 100}%` }}
            />
            <div
              className="quad-bg quad-bg-bl"
              aria-hidden
              style={{ left: 0, top: `${splitH * 100}%`, right: `${(1 - splitV) * 100}%`, bottom: 0 }}
            />
            <div
              className="quad-bg quad-bg-br"
              aria-hidden
              style={{ left: `${splitV * 100}%`, top: `${splitH * 100}%`, right: 0, bottom: 0 }}
            />
            {quadDensityCells.length > 0 ? (
              <div className="quad-density-cloud-wrap" aria-hidden>
                <svg
                  className="quad-density-cloud"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-label={lang === "ko" ? "전체 직무 분포 밀도" : "All-occupation density"}
                >
                  <g>
                    {quadDensityCells.map((cell, i) => {
                      const [r, g, b] = minimal ? [29, 78, 216] : [109, 40, 217];
                      const a = 0.042 + cell.t * 0.36;
                      return (
                        <rect
                          key={`qd-${i}`}
                          x={cell.x}
                          y={cell.y}
                          width={cell.w}
                          height={cell.h}
                          fill={`rgba(${r},${g},${b},${a})`}
                        />
                      );
                    })}
                  </g>
                </svg>
              </div>
            ) : null}
            {quadScatterCloudPts.length > 0 ? (
              <div className="quad-scatter-dots-layer">
                {quadScatterCloudPts.map((pt, i) => {
                  const tip =
                    (pt.displayName && String(pt.displayName).trim()) ||
                    (lang === "ko" ? "직무명 없음" : "No occupation title");
                  const label = tip;
                  return (
                    <button
                      key={`qsd-${i}-${pt.left.toFixed(2)}-${pt.top.toFixed(2)}`}
                      type="button"
                      tabIndex={-1}
                      className="quad-scatter-dot"
                      title={tip}
                      aria-label={label}
                      style={{ left: `${pt.left}%`, top: `${pt.top}%` }}
                      onClick={() => handleScatterDotActivate(pt.soc)}
                    />
                  );
                })}
              </div>
            ) : null}
            <div className="quad-type quad-type-corner quad-type-corner-tl">{quadLabels.tl}</div>
            <div className="quad-type quad-type-corner quad-type-corner-tr">{quadLabels.tr}</div>
            <div className="quad-type quad-type-corner quad-type-corner-bl">{quadLabels.bl}</div>
            <div className="quad-type quad-type-corner quad-type-corner-br">{quadLabels.br}</div>
            <div
              className="quad-point-wrap"
              style={{
                left: `${quadPointLeft}%`,
                top: `${quadPointTop}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`AEI ${(aeiVal * 100).toFixed(0)}%, ACS ${(acsVal * 100).toFixed(0)}%`}
            >
              <div className="quad-point" />
            </div>
          </div>
          {!medianSuppressed ? (
          <div
            className="quad-threshold-outside quad-threshold-outside--v"
            title={
              lang === "ko"
                ? "전체 직무의 ‘대체 쉬움’ 점수를 순서대로 늘어놓았을 때 가운데(중앙값)입니다. 오른쪽이면 AI가 일을 대신하기 쉬운 편입니다."
                : "Median across occupations for ease of AI taking on work (50th percentile). Right means relatively easier to automate."
            }
          >
            {lang === "ko" ? `AI 영향도 중앙값 ${tauAeiPct}점` : `AI impact median ${tauAeiPct}`}
          </div>
          ) : null}
          {!medianSuppressed ? (
          <div
            className="quad-threshold-outside quad-threshold-outside--h"
            title={
              lang === "ko"
                ? "전체 직무의 ‘사람 판단 중요도’ 점수 중앙값입니다. 위쪽이면 판단·맥락 역할이 전체 대비 큰 편입니다."
                : "Median human-judgment importance across occupations. Above means relatively more judgment-heavy."
            }
          >
            {lang === "ko" ? (
              <span className="quad-threshold-outside__stack">
                <span className="quad-threshold-outside__stack-line">사람 판단 중요도</span>
                <span className="quad-threshold-outside__stack-line">{`중앙값 ${tauAcsPct}점`}</span>
              </span>
            ) : (
              <span className="quad-threshold-outside__stack">
                <span className="quad-threshold-outside__stack-line">Human judgment</span>
                <span className="quad-threshold-outside__stack-line">{`median ${tauAcsPct}`}</span>
              </span>
            )}
          </div>
          ) : null}
        </div>
    </div>
  );

  const medianCompareBand = (score, median) => {
    const m = Number(median);
    const s = Number(score);
    const tol = Math.max(2, Math.round(m * 0.05));
    const d = s - m;
    if (!Number.isFinite(d)) return "similar";
    if (Math.abs(d) <= tol) return "similar";
    return d > 0 ? "above" : "below";
  };
  const aeiVsMedian = medianSuppressed ? null : medianCompareBand(aeiScore, tauAeiPct);
  const acsVsMedian = medianSuppressed ? null : medianCompareBand(acsScore, tauAcsPct);

  const renderPositionMapFooter = ({ showScoreCards = true } = {}) => {
    const pillKo = {
      above: "전체 직무 중앙값보다 높음",
      below: "전체 직무 중앙값보다 낮음",
      similar: "중앙값과 비슷합니다.",
    };
    const pillEn = {
      above: "Above the all-occupation median",
      below: "Below the all-occupation median",
      similar: "Similar to the median.",
    };
    const pill = (band) =>
      band ? (
        <span className={`position-map-score-pill position-map-score-pill--${band}`}>
          {lang === "ko" ? pillKo[band] : pillEn[band]}
        </span>
      ) : medianSuppressed ? (
        <span className="position-map-score-pill position-map-score-pill--unavailable">
          {lang === "ko" ? "전체 직무 중앙값 미제공" : "All-occupation median unavailable"}
        </span>
      ) : null;
    return (
      <div className={`position-map-footer${showScoreCards ? "" : " position-map-footer--legend-only"}`}>
        <div className="position-map-quad-legend" aria-label={lang === "ko" ? "차트 범례" : "Chart legend"}>
          <span className="position-map-quad-legend__item">
            <span className="position-map-quad-legend__dot" aria-hidden />
            {lang === "ko" ? "이 직무의 위치" : "This role’s position"}
          </span>
          {!medianSuppressed ? (
            <span className="position-map-quad-legend__item">
              <span className="position-map-quad-legend__density" aria-hidden />
              {lang === "ko" ? "전체 직무 분포 (밀도)" : "All occupations (density)"}
            </span>
          ) : null}
        </div>
        {showScoreCards ? (
          <div className="position-map-score-grid" aria-label={lang === "ko" ? "점수 요약" : "Score summary"}>
            <div className="position-map-score-card">
              <div className="position-map-score-card__title">
                {taskRoleFinal ? (
                  labelAi
                ) : lang === "ko" ? (
                  <>
                    AI가 대신하기 쉬운 정도{" "}
                    <span className="position-map-score-card__title-sub">(AI 영향도)</span>
                  </>
                ) : (
                  <>
                    Ease of AI taking on the work{" "}
                    <span className="position-map-score-card__title-sub">(AI impact)</span>
                  </>
                )}
              </div>
              <div className="position-map-score-card__score-row">
                <div className="position-map-score-card__score">
                  {lang === "ko" ? `${aeiScore}점` : aeiScore}
                </div>
                {pill(aeiVsMedian)}
              </div>
              <PositionScoreEvidence scoreKey="ai" profile={profile} report={report} lang={lang} />
            </div>
            <div className="position-map-score-card">
              <div className="position-map-score-card__title">{labelHuman}</div>
              <div className="position-map-score-card__score-row">
                <div className="position-map-score-card__score">
                  {lang === "ko" ? `${acsScore}점` : acsScore}
                </div>
                {pill(acsVsMedian)}
              </div>
              <PositionScoreEvidence scoreKey="human" profile={profile} report={report} lang={lang} />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderJobChangeSignalCard = (railSplit) => (
    <div
      className={`summary-v2-job-change-signal${railSplit ? " summary-v2-job-change-signal--in-split-rail" : ""}`}
      aria-label={
        lang === "ko"
          ? "직무 구성 변화. 업무 비중 기준 AI 영향 구성(3-2와 동일)"
          : "Role composition change: task-weight AI impact mix (same as section 3-2)"
      }
    >
      <div className="summary-v2-job-change-signal__head summary-v2-job-change-signal__head--single-badge">
        <span className="summary-v2-job-change-signal__title-badge">
          {lang === "ko" ? "직무 구성 변화" : "Role composition change"}
        </span>
      </div>
      <div className="summary-v2-job-change-signal__body summary-v2-job-change-signal__body--composition">
        {renderAiCompositionBlock(railSplit ? "signal-rail-embed" : "signal-block-embed")}
      </div>
      <div className="summary-v2-job-change-signal__relation-note" role="note">
        <div className="summary-v2-job-change-signal__relation-note-box">
          <span className="summary-v2-job-change-signal__relation-note-icon" aria-hidden>
            <svg className="summary-v2-job-change-signal__relation-note-icon-svg" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.35" />
              <circle cx="12" cy="8" r="1.25" fill="currentColor" />
              <path fill="currentColor" d="M11 11h2v7h-2z" />
            </svg>
          </span>
          <p className="summary-v2-job-change-signal__relation-note-line">
            {lang === "ko"
              ? "하나의 직무 안에는 성격이 다른 여러 업무가 함께 존재합니다."
              : "A single role typically contains several tasks with different characteristics."}
          </p>
          <p className="summary-v2-job-change-signal__relation-note-line">
            {lang === "ko"
              ? "이 분석은 해당 직무의 업무들을 ‘사람 중심 / AI 협업 / 자동화 지원형’ 영역으로 재구성해 보여줍니다."
              : "This analysis regroups that role’s tasks into ‘human-centric’, ‘AI collaboration’, and ‘automation-supported’ areas."}
          </p>
        </div>
      </div>
    </div>
  );

  const jobChangeSignalBlock = renderJobChangeSignalCard(false);

  const jobDirectionConclusionCard =
    showJobDirectionCard ? (
      <div
        className="summary-v2-job-direction-card"
        aria-label={lang === "ko" ? "직무 변화 방향" : "Job change direction"}
      >
        <span className="summary-v2-job-change-signal__title-badge">
          {lang === "ko" ? "직무 변화 방향" : "Job change direction"}
        </span>
        <p className="summary-v2-job-direction-card__text">{careerPositioningBody}</p>
      </div>
    ) : null;

  const positionMapVsAllAria =
    lang === "ko"
      ? "포지션 맵: 전체 직무 분포와 이 직무 위치"
      : "Position map: all occupations and this role";
  const positionMapZoomBtnAria = lang === "ko" ? "포지션 맵 확대 보기" : "Expand position map";

  const renderPositionMapVsAllBlock = ({
    minimalEmbeds,
    showZoomBtn = false,
    showHead = true,
    showScoreCards = true,
  }) => (
    <div className="summary-v2-position-vs-all" aria-label={positionMapVsAllAria}>
      {showHead ? (
        <div
          className={`summary-v2-position-vs-all__head${
            showZoomBtn ? " summary-v2-position-vs-all__head--with-zoom" : ""
          }`}
        >
          <span className="summary-v2-job-change-signal__title-badge">
            {lang === "ko" ? "포지션 맵" : "Position map"}
          </span>
          {showZoomBtn ? (
            <button
              type="button"
              className="summary-v2-position-vs-all__zoom"
              onClick={() => setPositionMapZoomOpen(true)}
              aria-label={positionMapZoomBtnAria}
            >
              🔍
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="summary-v2-position-vs-all__quad-wrap">
        {minimalEmbeds
          ? renderSummaryQuadPanel("summary-v2-quad-panel--embed", { minimal: true })
          : renderSummaryQuadPanel()}
      </div>
      {renderPositionMapFooter({ showScoreCards })}
    </div>
  );

  return (
    <div className="report-integrated-root">
      {typeof window !== "undefined" &&
      !viewerMode &&
      new URLSearchParams(window.location.search).get("source") === "candidate" &&
      !isReviewContractParam(new URLSearchParams(window.location.search).get("review_contract")) ? (
        <div
          style={{
            background: "#fff7ed",
            borderBottom: "1px solid #fdba74",
            color: "#9a3412",
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Candidate QA preview — production 서사가 아닙니다.
        </div>
      ) : null}
      <div className="container">
        <div className="report-tabs-shell">
          <div className="grid report-tabs-scroll">
          {useEditorialPresentation ? (
            <>
            {shellView === "report" ? (
            <div
              className="er-root span-12 er-shell-view"
              id="er-report"
              data-shell-view="report"
              data-story-flow={storyFlowPilot ? "pilot" : "default"}
            >
              <section className="er-hero" id={storyFlowPilot ? "er-job-title" : "overview"}>
                <div className="er-hero-head">
                  <div>
                    <h1 className="er-job-title">{title}</h1>
                  </div>
                  {!viewerMode && onLibrarySave ? (
                    <SaveToCareerLibrary
                      lang={lang}
                      saved={librarySaved}
                      saving={librarySaving}
                      onSave={onLibrarySave}
                      libraryHref={libraryHref}
                      variant="hero"
                    />
                  ) : null}
                </div>
                {!storyFlowPilot && heroPresentation.summary ? (
                  <div className="er-hero-summary-wrap">
                    <h2 className="er-job-role-heading">
                      {lang === "ko" ? REPORT_HERO.ko : REPORT_HERO.en}
                    </h2>
                    <p className="er-hero-summary">{heroPresentation.summary}</p>
                  </div>
                ) : null}
              </section>
              {!viewerMode ? <ReportSectionNav lang={lang} report={report} /> : null}
              {storyFlowPilot ? (
                <section
                  className="er-position fc-section er-role-change"
                  id="overview"
                  data-section="role-change"
                  aria-labelledby="er-role-change-title"
                >
                  <div className="fc-section-head">
                    <span className="fc-section-no">
                      {reportSectionNumber("roleChange", socForCta)}
                    </span>
                    <h2 id="er-role-change-title" className="fc-section-title">
                      {reportSectionLabel("roleChange", lang, socForCta)}
                    </h2>
                  </div>
                  <h3 className="er-role-change__map-title">
                    {lang === "ko" ? "AI 시대 직무 포지션 맵" : "AI-era occupation position map"}
                  </h3>
                  {positionMapV2Calibration ? (
                    <p className="fc-section-intro">
                      {lang === "ko"
                        ? "7개 검증 직무의 AI 도움·사람 판단 HIGH 업무 비중을 동일 좌표계에서 비교합니다. (Task Role v2 · 7SOC 캘리브레이션 · 임시)"
                        : "Compare AI-help and human-judgment HIGH shares for all 7 calibration occupations on one map. (Task Role v2 · provisional)"}
                    </p>
                  ) : positionMapV2Enabled ? (
                    <p className="fc-section-intro">
                      {lang === "ko"
                        ? "AI가 크게 도울 수 있는 업무 비중과 사람 판단이 중요한 업무 비중을 7개 검증 직무 안에서 비교합니다. (Task Role v2 리뷰 · 임시)"
                        : "Compare share of work AI can help a lot with and judgment-critical work share within the 7 calibration occupations. (Task Role v2 review · provisional)"}
                    </p>
                  ) : null}
                  <div id="position-map" data-embed="position-map">
                    {positionMapV2Calibration ? (
                      <PositionMapV2Calibration lang={lang} payload={positionMapV2} />
                    ) : (
                      <PositionMapRefresh
                        lang={lang}
                        profile={profile}
                        report={report}
                        scatterPoints={quadScatterCloudPts}
                        densityCells={quadDensityCells}
                        onScatterDotActivate={handleScatterDotActivate}
                        viewerMode={viewerMode}
                        v2Review={positionMapV2Enabled ? positionMapV2 : null}
                        taskAnalysis={taskAnalysisPayload}
                      />
                    )}
                  </div>
                  <p className="fc-section-intro" data-slot="independent-axes-note" role="note">
                    {lang === "en"
                      ? STORY_FLOW_INDEPENDENT_AXES_NOTE.en
                      : STORY_FLOW_INDEPENDENT_AXES_NOTE.ko}
                  </p>
                  {heroPresentation.summary ? (
                    <div className="er-hero-summary-wrap er-role-change__narrative">
                      <h3 className="er-job-role-heading">
                        {lang === "ko"
                          ? "역할 변화 해석"
                          : "How the role may shift"}
                      </h3>
                      <p className="er-hero-summary">{heroPresentation.summary}</p>
                    </div>
                  ) : null}
                </section>
              ) : (
                <section className="er-position fc-section" id="position-map">
                  <div className="fc-section-head">
                    <span className="fc-section-no">01</span>
                    <h2 className="fc-section-title">
                      {reportSectionLabel("position", lang)}
                    </h2>
                  </div>
                  {positionMapV2Calibration ? (
                    <p className="fc-section-intro">
                      {lang === "ko"
                        ? "7개 검증 직무의 AI 도움·사람 판단 HIGH 업무 비중을 동일 좌표계에서 비교합니다. (Task Role v2 · 7SOC 캘리브레이션 · 임시)"
                        : "Compare AI-help and human-judgment HIGH shares for all 7 calibration occupations on one map. (Task Role v2 · provisional)"}
                    </p>
                  ) : positionMapV2Enabled ? (
                    <p className="fc-section-intro">
                      {lang === "ko"
                        ? "AI가 크게 도울 수 있는 업무 비중과 사람 판단이 중요한 업무 비중을 7개 검증 직무 안에서 비교합니다. (Task Role v2 리뷰 · 임시)"
                        : "Compare share of work AI can help a lot with and judgment-critical work share within the 7 calibration occupations. (Task Role v2 review · provisional)"}
                    </p>
                  ) : positionInterpretation ? (
                    <p className="fc-section-intro" data-slot="position-interpretation">
                      {positionInterpretation}
                    </p>
                  ) : null}
                  {positionMapV2Calibration ? (
                    <PositionMapV2Calibration lang={lang} payload={positionMapV2} />
                  ) : (
                    <PositionMapRefresh
                      lang={lang}
                      profile={profile}
                      report={report}
                      scatterPoints={quadScatterCloudPts}
                      densityCells={quadDensityCells}
                      onScatterDotActivate={handleScatterDotActivate}
                      viewerMode={viewerMode}
                      v2Review={positionMapV2Enabled ? positionMapV2 : null}
                      taskAnalysis={taskAnalysisPayload}
                    />
                  )}
                </section>
              )}
              <div className="er-content">
                {editorialValueShiftData ? (
                  <EditorialValueShift data={editorialValueShiftData} lang={lang} report={report} />
                ) : null}
              </div>
              {storyFlowPilot ? (
                <WorkScenarios
                  scenarios={editorialWorkScenarios}
                  otherValidSituations={otherValidSituations}
                  selection={representativeSelection}
                  report={report}
                  lang={lang}
                  socCode={resolveOccupationId(profile, report) || socForCta}
                  onOpenEvidence={handleOpenEvidence}
                  dataSource={situationPick.source}
                  storyFlowOrder
                  showAiWorkingSection={showAIWorking}
                  showCompetitivenessSection
                />
              ) : (
                <>
                  <WorkScenarios
                    scenarios={editorialWorkScenarios}
                    otherValidSituations={otherValidSituations}
                    selection={representativeSelection}
                    report={report}
                    lang={lang}
                    socCode={resolveOccupationId(profile, report) || socForCta}
                    onOpenEvidence={handleOpenEvidence}
                    dataSource={situationPick.source}
                    showAiWorkingSection={false}
                  />
                  {showAIWorking ? (
                    <WorkScenarios
                      scenarios={editorialWorkScenarios}
                      otherValidSituations={otherValidSituations}
                      selection={representativeSelection}
                      report={report}
                      lang={lang}
                      socCode={resolveOccupationId(profile, report) || socForCta}
                      onOpenEvidence={handleOpenEvidence}
                      dataSource={situationPick.source}
                      showCompetitivenessSection={false}
                    />
                  ) : null}
                </>
              )}
              {storyFlowPilot ? (
                <aside
                  className="er-library-cta er-training-cta"
                  id="sec-ai-training-cta"
                  data-cta="ai-work-training"
                  aria-labelledby="er-training-cta-title"
                >
                  <h2 id="er-training-cta-title" className="er-library-cta__lead">
                    {lang === "en"
                      ? STORY_FLOW_TRAINING_CTA.en.title
                      : STORY_FLOW_TRAINING_CTA.ko.title}
                  </h2>
                  <p className="er-library-cta__lead">
                    {lang === "en"
                      ? STORY_FLOW_TRAINING_CTA.en.body
                      : STORY_FLOW_TRAINING_CTA.ko.body}
                  </p>
                  {libraryHref ? (
                    <Link className="er-training-cta__btn" to={libraryHref}>
                      {lang === "en"
                        ? STORY_FLOW_TRAINING_CTA.en.button
                        : STORY_FLOW_TRAINING_CTA.ko.button}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="er-training-cta__btn"
                      onClick={() => {
                        if (onLibrarySave && !librarySaved) onLibrarySave();
                        else navigate("/my-reports");
                      }}
                    >
                      {lang === "en"
                        ? STORY_FLOW_TRAINING_CTA.en.button
                        : STORY_FLOW_TRAINING_CTA.ko.button}
                    </button>
                  )}
                </aside>
              ) : null}
              {!viewerMode && onLibrarySave ? (
                <div className="er-library-cta" id="sec-library-save">
                  <p className="er-library-cta__lead">
                    {lang === "ko"
                      ? "이 분석 결과를 나중에 다시 보려면 커리어 리포트에 저장하세요."
                      : "Save this analysis if you want to reopen it later."}
                  </p>
                  <SaveToCareerLibrary
                    lang={lang}
                    saved={librarySaved}
                    saving={librarySaving}
                    onSave={onLibrarySave}
                    libraryHref={libraryHref}
                    variant="closing"
                  />
                </div>
              ) : null}
              <section
                className="er-reference"
                id="sec-report-reference"
                aria-labelledby="er-reference-heading"
                data-section="reference"
              >
                <div className="er-reference__grid">
                  <div className="er-reference__main">
                    <h2 id="er-reference-heading" className="er-reference__title">
                      {lang === "ko" ? REPORT_FOOTER.ko : REPORT_FOOTER.en}
                    </h2>
                    <p className="er-reference__lead">{reportReferenceCopy.lead}</p>
                    <div className="er-reference__criteria">
                      {reportReferenceCopy.criteria.map((item) => (
                        <div key={item.key} className="er-reference__criterion">
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                    {reportReferenceCopy.independentNote ? (
                      <div className="er-reference__independent-note">
                        <p>
                          <strong>{reportReferenceCopy.independentNote.lead}</strong>
                        </p>
                        {(Array.isArray(reportReferenceCopy.independentNote.body)
                          ? reportReferenceCopy.independentNote.body
                          : [reportReferenceCopy.independentNote.body]
                        ).map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        <p className="er-reference__independent-note-example">
                          {reportReferenceCopy.independentNote.example}
                        </p>
                      </div>
                    ) : null}
                    <div className="er-reference__source-row">
                      <button
                        type="button"
                        className="er-reference__cta"
                        onClick={() => openReferenceView("all-tasks")}
                      >
                        {buildAllTasksReportCta(reportReferenceCopy.taskCount, lang)}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            ) : null}
            {shellView === "all-tasks" ? (
              <div className="span-12 er-shell-view" data-shell-view="all-tasks">
                <TaskAnalysisSection
                  socCode={socForCta}
                  lang={lang}
                  focusTaskIds={evidenceFocusIds}
                  occupationTitle={title}
                  taskCountHint={N}
                  reviewContract={
                    productionCandidateReview && !finalDataContractActive
                      ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE
                      : null
                  }
                  onBack={
                    viewerMode || productionCandidateReview ? null : handleCloseEvidence
                  }
                />
              </div>
            ) : null}
            {shellView === "methodology" ? (
              <div className="span-12 er-shell-view" data-shell-view="methodology">
                <MethodologyReferenceView
                  lang={lang}
                  onBack={viewerMode ? null : handleCloseEvidence}
                />
              </div>
            ) : null}
            </>
          ) : null}
          {!useEditorialPresentation ? (
          <>
          {/* STEP 1 ↔ sec-summary: 커리어 전략 요약 */}
          <section
            className="card span-12 section-anchor summary-section-v2"
            id="sec-summary"
            data-report-step="1"
          >
            <ReportSectionHeading step={1}>{summaryMainHeading}</ReportSectionHeading>
            {showInsightHero ? (
              <div className="summary-v2-insight-hero">
                <p className="summary-v2-insight-hero__eyebrow">
                  {lang === "ko" ? "핵심 인사이트" : "Key insight"}
                </p>
                <p className="summary-v2-insight-hero__primary">{valueShiftConclusionInsight}</p>
              </div>
            ) : null}
            {!showInsightHero ? (
              <div className="summary-v2-hero">
                <h3 className="summary-v2-job-title">{title}</h3>
              </div>
            ) : null}
            <div className="summary-v2-position-card" aria-label={lang === "ko" ? "현재 위치" : "Current position"}>
              <div className={`summary-v2-position-row ${hasCurrentPositionCard ? "" : "is-quad-only"}`}>
                {hasCurrentPositionCard ? (
                  <div className="summary-v2-metrics-rail">
                    {jobDirectionConclusionCard}
                    {renderJobChangeSignalCard(true)}
                  </div>
                ) : null}
                {hasCurrentPositionCard ? (
                  <div className="career-positioning-panel career-positioning-panel--with-quad">
                    {renderPositionMapVsAllBlock({ minimalEmbeds: true, showZoomBtn: true })}
                  </div>
                ) : (
                  <div className="summary-v2-quad-only-stack">
                    {renderPositionMapVsAllBlock({ minimalEmbeds: false, showZoomBtn: true })}
                  </div>
                )}
              </div>
              {!hasCurrentPositionCard ? (
                <div
                  className="summary-v2-metrics summary-v2-metrics--with-change-signal"
                  aria-label={lang === "ko" ? "핵심 지표" : "Key metrics"}
                >
                  {jobChangeSignalBlock}
                  <div className="summary-v2-metric summary-v2-metric--strategy">
                    <div className="summary-v2-metric-icon" aria-hidden>
                      ◎
                    </div>
                    <div className="summary-v2-metric-body">
                      <div className="summary-v2-metric-strategy-title">{positionTypeLabel || coreStrategyLabel || "—"}</div>
                      <p className="summary-v2-metric-strategy-desc">{strategyBlurb}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* STEP 2 ↔ sec-value-shift: 직무 가치 이동 (요약 다음 심화) */}
          <section
            className="card span-12 section-anchor summary-section-v2 summary-value-shift-section"
            id="sec-value-shift"
            data-report-step="2"
          >
            <ReportSectionHeading step={2}>{valueShiftHeading}</ReportSectionHeading>
            <div className="summary-v2-role-shift">
              {hasValueShiftNarrative ? (
                hasSection2ValueShiftUi ? (
                  <Section2ValueShift data={section2ValueShiftData} lang={lang} />
                ) : hasValueShiftPrimaryBlocks ? (
                <div className="value-shift-narrative">
                  {valueShiftOpeningParagraphs.map((para, i) => (
                    <p key={`vshift-open-${i}`} className="value-shift-narrative__lead">
                      {para}
                    </p>
                  ))}
                  {valueDeclineTasks.length > 0 ||
                  valueDeclineInterpretation ||
                  valueRiseTasks.length > 0 ||
                  valueRiseInterpretation ? (
                    <div className="value-shift-dual">
                      <div className="value-shift-pillar value-shift-pillar--decline">
                        <div className="value-shift-pillar__head">
                          <span className="value-shift-pillar__icon-badge value-shift-pillar__icon-badge--decline" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                              {/* 왼쪽 위 → 오른쪽 아래로 전체 하향 (가치 하락) */}
                              <path
                                d="M5 7 L10 11 L14 10 L19 17"
                                stroke="currentColor"
                                strokeWidth="2.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M5 18 H19"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity="0.85"
                              />
                            </svg>
                          </span>
                          <h4 className="value-shift-pillar__title">
                            {lang === "ko" ? "가치가 낮아질 가능성이 큰 업무" : "Work likely to lose relative value"}
                          </h4>
                        </div>
                        {valueDeclineTasks.length > 0 ? (
                          <ul className="value-shift-pillar__list">
                            {valueDeclineTasks.map((item, idx) => (
                              <li key={`vshift-down-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                        {valueDeclineInterpretation ? (
                          <div className="value-shift-pillar__insight">
                            <span className="value-shift-pillar__insight-label">{lang === "ko" ? "핵심 요약" : "Key summary"}</span>
                            <p className="value-shift-pillar__insight-text">{valueDeclineInterpretation}</p>
                          </div>
                        ) : null}
                      </div>
                      <div className="value-shift-pillar value-shift-pillar--rise">
                        <div className="value-shift-pillar__head">
                          <span className="value-shift-pillar__icon-badge value-shift-pillar__icon-badge--rise" aria-hidden>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                              {/* 왼쪽 아래 → 오른쪽 위로 전체 상향 (가치 상승) */}
                              <path
                                d="M5 17 L10 13 L14 14 L19 7"
                                stroke="currentColor"
                                strokeWidth="2.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M5 18 H19"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity="0.85"
                              />
                            </svg>
                          </span>
                          <h4 className="value-shift-pillar__title">
                            {lang === "ko" ? "가치가 높아질 가능성이 큰 업무" : "Work likely to gain relative value"}
                          </h4>
                        </div>
                        {valueRiseTasks.length > 0 ? (
                          <ul className="value-shift-pillar__list">
                            {valueRiseTasks.map((item, idx) => (
                              <li key={`vshift-up-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                        {valueRiseInterpretation ? (
                          <div className="value-shift-pillar__insight">
                            <span className="value-shift-pillar__insight-label">{lang === "ko" ? "핵심 요약" : "Key summary"}</span>
                            <p className="value-shift-pillar__insight-text">{valueRiseInterpretation}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
                ) : null
              ) : (
                <>
                  {tasksToShiftFirst.length > 0 ? (
                    <div className="story-block">
                      <h3>{lang === "ko" ? "어떤 업무가 먼저 바뀌는가" : "What changes first?"}</h3>
                      <ul>
                        {tasksToShiftFirst.map((item, idx) => (
                          <li key={`shift-summary-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {!hasStoryPack ? (
                    <div className="scenario-grid">
                      <div className="scenario-card shrink">
                        <h3>{lang === "ko" ? "축소 가능 (반복 정리)" : "Shrink (routine)"}</h3>
                        <p>
                          {lang === "ko"
                            ? "정형화된 전처리·기초 문안처럼 반복성이 높은 정리 업무는 자동화·AI 보조 비중이 커지며 순수 수행 역할은 줄어들 수 있습니다."
                            : "Routine data prep and drafting may see reduced human-only roles as AI support grows."}
                        </p>
                      </div>
                      <div className="scenario-card shift">
                        <h3>{lang === "ko" ? "재구성 (분석 실행)" : "Shift (analysis)"}</h3>
                        <p>
                          {lang === "ko"
                            ? "분석 실행은 AI가 초안을 만들고 사람은 검토·수정·검증을 담당하는 방식으로 재구성될 가능성이 큽니다."
                            : "Analysis execution may shift to AI drafts with human review and validation."}
                        </p>
                      </div>
                      <div className="scenario-card expand">
                        <h3>{lang === "ko" ? "확대 가능 (해석·의사결정)" : "Expand (interpretation)"}</h3>
                        <p>
                          {lang === "ko"
                            ? "해석·설명·의사결정 지원처럼 결과를 비즈니스 언어와 행동으로 연결하는 역할은 오히려 중요도와 비중이 커질 수 있습니다."
                            : "Interpretation, explanation and decision support may grow in importance."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {!hasStoryPack && (report.role_change_sim_list && report.role_change_sim_list.length > 0 ? (
                    <div className="sim-list">
                      {report.role_change_sim_list.map((item, i) => (
                        <div key={i} className="sim-item">
                          <div className="sim-top">
                            <strong>{item.role_label || item.label || "—"}</strong>
                            <strong>{item.direction || item.trend || "—"}</strong>
                          </div>
                          <div className="sim-label">{lang === "ko" ? "근거" : "Rationale"}</div>
                          <p className="task-summary-note">{item.rationale || item.note || ""}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sim-list">
                      {highImpact.length > 0 && (
                        <div className="sim-item">
                          <div className="sim-top">
                            <strong>{highImpact[0].task_text || (lang === "ko" ? "데이터 처리" : "Data processing")}</strong>
                            <strong>{lang === "ko" ? "감소 가능성 높음" : "Likely decrease"}</strong>
                          </div>
                          <div className="sim-label">{lang === "ko" ? "근거" : "Rationale"}</div>
                          <p className="task-summary-note">
                            {lang === "ko"
                              ? "AI 개입 가능성이 높은 업무로 나타나 반복 처리 성격이 강해 자동화 또는 AI 보조의 영향을 먼저 받을 가능성이 큽니다."
                              : "High AI impact tasks may see automation or AI assistance first."}
                          </p>
                        </div>
                      )}
                      {lowImpact.length > 0 && (
                        <div className="sim-item">
                          <div className="sim-top">
                            <strong>{lowImpact[0].task_text || (lang === "ko" ? "문제 정의·해석" : "Problem definition")}</strong>
                            <strong>{lang === "ko" ? "확대 가능성 높음" : "Likely expand"}</strong>
                          </div>
                          <div className="sim-label">{lang === "ko" ? "근거" : "Rationale"}</div>
                          <p className="task-summary-note">
                            {lang === "ko"
                              ? "인간 고유 역할이 강한 핵심 업무입니다. AI가 분석을 보조할수록 무엇을 질문하고 어떤 기준으로 볼지 정하는 역할이 더 중요해집니다."
                              : "Human-unique tasks remain critical as AI assists analysis."}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {growingCapabilities.length || shrinkingRoles.length || advantageousPeople.length ? (
                    <div className="story-grid-3">
                      <div className="story-col">
                        <h4>{lang === "ko" ? "앞으로 중요해질 역량" : "Growing capabilities"}</h4>
                        <ul>{growingCapabilities.map((x, i) => <li key={`grow-summary-${i}`}>{x}</li>)}</ul>
                      </div>
                      <div className="story-col">
                        <h4>{lang === "ko" ? "줄어드는 역할" : "Shrinking roles"}</h4>
                        <ul>{shrinkingRoles.map((x, i) => <li key={`shrink-summary-${i}`}>{x}</li>)}</ul>
                      </div>
                      <div className="story-col">
                        <h4>{lang === "ko" ? "유리한 사람" : "Who has advantage"}</h4>
                        <ul>{advantageousPeople.map((x, i) => <li key={`adv-summary-${i}`}>{x}</li>)}</ul>
                      </div>
                    </div>
                  ) : null}
                  {roleRecompositionTable.length > 0 ? (
                    <div className="role-recomp-wrap">
                      <h3>{lang === "ko" ? "역할 재구성 (현재 → 개선안)" : "Role recomposition (Current → Future)"}</h3>
                      <table className="role-recomp-table">
                        <thead>
                          <tr>
                            <th>{lang === "ko" ? "현재" : "Current"}</th>
                            <th>{lang === "ko" ? "개선안" : "Future design"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleRecompositionTable.map((row, idx) => (
                            <tr key={`recomp-summary-${idx}`}>
                              <td>{row.current_role}</td>
                              <td>{row.future_role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {showInlineCtas ? (
              <ReportCtaCard
                variant="after-s2"
                lang={lang}
                socCode={socForCta}
                reportStep={2}
                onSecondary={() => {
                  const el = document.getElementById("sec-value-shift");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            ) : null}
          </section>

          {!showOutlookCombined && showInlineCtas ? (
            <section className="card span-12 section-anchor" id="sec-outlook-cta-fallback">
              <ReportCtaCard
                variant="after-s3"
                lang={lang}
                socCode={socForCta}
                reportStep={3}
              />
            </section>
          ) : null}

          {showOutlookCombined ? (
            <section
              className="card span-12 section-anchor summary-section-v2 outlook-combined-section"
              id="sec-outlook-combined"
              data-report-step="3"
            >
              <ReportSectionHeading step={3}>{outlookVsHeading}</ReportSectionHeading>
              {hasSection3WorkStyleUi ? (
                <Section3WorkStyle data={section3WorkStyleData} />
              ) : (
                <div
                  className={
                    "outlook-combined__grid" +
                    (!advantageousPeople.length ? " outlook-combined__grid--right-only" : "") +
                    (!capabilityShiftTable.length ? " outlook-combined__grid--left-only" : "")
                  }
                >
                  {advantageousPeople.length > 0 ? (
                    <div className="outlook-advantage-card">
                      <header className="outlook-advantage-card__head">
                        <span
                          className="outlook-advantage-card__step-badge outlook-advantage-card__step-badge--emoji"
                          aria-hidden
                        >
                          {whoBenefitsCardBadgeEmoji}
                        </span>
                        <div className="outlook-advantage-card__titles">
                          <h3 className="outlook-advantage-card__title">{whoBenefitsCardTitle}</h3>
                          {whoBenefitsCardSubtitle.trim() ? (
                            <p className="outlook-advantage-card__subtitle">{whoBenefitsCardSubtitle}</p>
                          ) : null}
                        </div>
                      </header>
                      <div className="outlook-advantage-card__rule" aria-hidden />
                      <p className="outlook-advantage-card__lead">
                        {lang === "ko" ? advantageLeadStaticKo : advantageLeadStaticEn}
                      </p>
                      <ul
                        className="value-shift-pillar__list outlook-advantage-card__adv-bullets"
                        aria-label={whoBenefitsCardTitle}
                      >
                        {advantageousPeople.map((x, i) => (
                          <li key={`outlook-adv-${i}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {capabilityShiftTable.length > 0 ? (
                    <div className="outlook-advantage-card outlook-table-card">
                      <header className="outlook-advantage-card__head outlook-table-card__head">
                        <span
                          className="outlook-advantage-card__step-badge outlook-advantage-card__step-badge--emoji outlook-table-card__badge"
                          aria-hidden
                        >
                          {capabilityShiftCardBadgeEmoji}
                        </span>
                        <p className="outlook-advantage-card__subtitle outlook-table-card__subtitle-only">
                          {capabilityShiftCardSubtitle}
                        </p>
                      </header>
                      <div className="outlook-advantage-card__rule" aria-hidden />
                      <div className="outlook-shift-table-wrap">
                        <table className="outlook-shift-table">
                          <thead>
                            <tr>
                              <th scope="col">
                                {lang === "ko" ? "예전 방식" : "Old way"}
                              </th>
                              <th
                                scope="col"
                                className="outlook-shift-table__th-arrow"
                                aria-label={lang === "ko" ? "이동" : "Shift"}
                              ></th>
                              <th scope="col">
                                {lang === "ko" ? "앞으로 강해질 방식" : "Growing stronger"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {capabilityShiftTable.map((row, idx) => (
                              <tr key={`outlook-vs-${idx}`}>
                                <td>{row.was_important}</td>
                                <td className="outlook-shift-table__cell-arrow">
                                  <span className="outlook-shift-table__arrow" aria-hidden>
                                    →
                                  </span>
                                </td>
                                <td>{row.becomes_important}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {showInlineCtas ? (
                <ReportCtaCard
                  variant="after-s3"
                  lang={lang}
                  socCode={socForCta}
                  reportStep={3}
                />
              ) : null}
            </section>
          ) : null}
          </>
          ) : null}

          {/* STEP 4 ↔ sec-work-ksa: 업무 구조 (legacy non-editorial only) */}
          {!useEditorialPresentation ? (
          <section
            className="card span-12 section-anchor"
            id="sec-work-ksa"
            data-report-step="4"
          >
            <TaskAnalysisSection
              socCode={socForCta}
              lang={lang}
              focusTaskIds={evidenceFocusIds}
              occupationTitle={title}
              reviewContract={
                productionCandidateReview && !finalDataContractActive
                  ? REVIEW_CONTRACT_PRODUCTION_CANDIDATE
                  : null
              }
              onBack={null}
            />

            {false && (
            <>
            {/* legacy Section4TaskAiRole / report.tasks table — superseded by TaskAnalysisSection */}
            {!(useEditorialPresentation && hasSection4TaskAiRoleUi) ? (
              <ReportSectionHeading step={4}>
                {hasSection4TaskAiRoleUi && section4TaskAiRoleData.section_title
                  ? section4TaskAiRoleData.section_title
                  : workKsaSectionTitle}
              </ReportSectionHeading>
            ) : null}
            
            {hasSection4TaskAiRoleUi ? (
              <>
                <Section4TaskAiRole
                  data={section4TaskAiRoleData}
                  lang={lang}
                  taskCardsForFilters={section4TaskCardsForFilters}
                  focusTaskIds={evidenceFocusIds}
                  report={report}
                  onBack={null}
                />
              </>
            ) : (
            <>
            {careerTaskChangeIntro ? (
              <p className="career-task-change-intro">{careerTaskChangeIntro}</p>
            ) : null}
            <div id="sec-work-change" className="task-table-wrap">
              <div className="task-table-header-row">
                <div className="task-table-header-left">
                  <h3 className="section-subtitle" style={{ margin: 0 }}>
                    {lang === "ko" ? "업무(Task) 구성" : "Task composition"}
                  </h3>
                </div>
              </div>
            </div>
            </>
            )}
            </>
            )}

            {false && (
            <>
            {/* STEP 3 ↔ sec-capability-analysis: 핵심 역량·KSA — 핵심 역량 (KSA) 그래프 + 짧은 설명 카드 */}
            {(knowledge.length || skills.length || abilities.length) && (
              <div id="sec-capability-analysis" className="section-subblock" data-report-step="5">
                
                <div className="ksa-section-header">
                  <h3 className="section-subtitle" style={{ margin: 0 }}>
                    {lang === "ko" ? "핵심 역량 (KSA)" : "Core capabilities (KSA)"}
                  </h3>
                  <button
                    type="button"
                    className="more-btn"
                    onClick={() => setExpandKsa((v) => !v)}
                  >
                    {expandKsa ? (lang === "ko" ? "접기" : "Collapse") : (lang === "ko" ? "더보기" : "Show more")}
                  </button>
                </div>

                <div className={`ksa-grid expandable ${expandKsa ? "is-open" : ""}`}>
                  <div className="ksa-col">
                    <span className="section-chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                      {lang === "ko" ? "지식" : "Knowledge"}
                    </span>
                    <div className="bar-list ksa-items">
                      {(expandKsa ? knowledge : knowledge.slice(0, 5)).map((c, idx) => {
                        const val = Number(c.data_value);
                        const pct = Number.isFinite(val) ? Math.min(100, Math.max(0, (val / 5) * 100)) : 0;
                        const name = getCapabilityDisplayName(c, lang);
                        return (
                          <div key={c.element_id || idx} className={`bar-item${idx >= 5 ? " extra-item" : ""}`}>
                            <div className="top">
                              <span>{name}</span>
                              <span className="ksa-scores">
                                {lang === "ko" ? "중요도 (0–5)" : "Score (0–5)"}{" "}
                                {Number.isFinite(val) ? val.toFixed(1) : "—"}
                              </span>
                            </div>
                            <div className="track">
                              <div
                                className="fill"
                                style={{ width: `${pct}%`, background: "var(--green)" }}
                                title={lang === "ko" ? "원천 중요도" : "Source importance"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ksa-col">
                    <span className="section-chip" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
                      {lang === "ko" ? "기술" : "Skills"}
                    </span>
                    <div className="bar-list ksa-items">
                      {(expandKsa ? skills : skills.slice(0, 5)).map((c, idx) => {
                        const val = Number(c.data_value);
                        const pct = Number.isFinite(val) ? Math.min(100, Math.max(0, (val / 5) * 100)) : 0;
                        const name = getCapabilityDisplayName(c, lang);
                        return (
                          <div key={c.element_id || idx} className={`bar-item${idx >= 5 ? " extra-item" : ""}`}>
                            <div className="top">
                              <span>{name}</span>
                              <span className="ksa-scores">
                                {lang === "ko" ? "중요도 (0–5)" : "Score (0–5)"}{" "}
                                {Number.isFinite(val) ? val.toFixed(1) : "—"}
                              </span>
                            </div>
                            <div className="track">
                              <div
                                className="fill"
                                style={{ width: `${pct}%`, background: "var(--blue)" }}
                                title={lang === "ko" ? "원천 중요도" : "Source importance"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ksa-col">
                    <span className="section-chip" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}>
                      {lang === "ko" ? "능력" : "Abilities"}
                    </span>
                    <div className="bar-list ksa-items">
                      {(expandKsa ? abilities : abilities.slice(0, 5)).map((c, idx) => {
                        const val = Number(c.data_value);
                        const pct = Number.isFinite(val) ? Math.min(100, Math.max(0, (val / 5) * 100)) : 0;
                        const name = getCapabilityDisplayName(c, lang);
                        return (
                          <div key={c.element_id || idx} className={`bar-item${idx >= 5 ? " extra-item" : ""}`}>
                            <div className="top">
                              <span>{name}</span>
                              <span className="ksa-scores">
                                {lang === "ko" ? "중요도 (0–5)" : "Score (0–5)"}{" "}
                                {Number.isFinite(val) ? val.toFixed(1) : "—"}
                              </span>
                            </div>
                            <div className="track">
                              <div
                                className="fill"
                                style={{ width: `${pct}%`, background: "var(--purple)" }}
                                title={lang === "ko" ? "원천 중요도" : "Source importance"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="ksa-context-grid">
                  <div className="ksa-context-card">
                    <h4>{lang === "ko" ? "직무 핵심 역량 해석" : "Interpretation of core capabilities"}</h4>
                    <p>
                      {lang === "ko"
                        ? "이 직무는 데이터 처리 기술만으로 완성되지 않습니다. "
                          + "분석적 사고, 결과 설명, 문제 정의가 함께 요구되며 기술 역량과 판단·해석 역량이 동시에 중요한 구조입니다. "
                          + "AI가 반복 처리를 보조할수록 문제 정의·해석·판단 책임은 사람에게 더 기대되는 편입니다."
                        : "This role is not complete with technical skills alone. Analytical thinking, explaining results, and framing problems are equally important. As routine work is assisted, framing, interpretation, and judgment tend to matter more for people."}
                    </p>
                    {importantCaps.length > 0 && (
                      <div className="ksa-badge-row">
                        {importantCaps.slice(0, 4).map((name, idx) => (
                          <span key={idx} className="ksa-badge">
                            {translateCapabilityName(name, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 업무–연결 역량 테이블 */}
            {taskCapabilityTable.length > 0 && (() => {
              const firstTags = (taskCapabilityTable[0]?.capability_tags || []);
              const allSameTags = taskCapabilityTable.length > 1 && taskCapabilityTable.every(
                (r) => JSON.stringify(r.capability_tags || []) === JSON.stringify(firstTags)
              );
              return (
              <div className="section-subblock">
                {allSameTags && (
                  <p className="task-ksa-caption" style={{ color: "var(--orange, #e65100)", marginBottom: "0.5rem" }}>
                    {lang === "ko"
                      ? "※ API에서 모든 행에 동일한 역량만 수신되었습니다. 백엔드가 최신 코드로 실행 중인지 확인하세요."
                      : "※ API returned the same capabilities for every row. Ensure the backend is running the latest code."}
                  </p>
                )}
                <p className="task-ksa-caption">
                  {lang === "ko"
                    ? "아래 역량은 이 직무 전체의 지식·기술·능력(KSA) 상위 항목이며, 각 핵심 업무에 공통으로 요구되는 대표 역량입니다."
                    : "The capabilities below are the top KSA for this occupation and apply as representative competencies across core tasks."}
                </p>
                <div className="task-ksa-link">
                  <div className="task-ksa-head">
                    <div>{lang === "ko" ? "핵심 업무" : "Core task"}</div>
                    <div>{lang === "ko" ? "연결되는 핵심 역량" : "Linked capabilities"}</div>
                  </div>
                  {taskCapabilityTable.map((row, idx) => {
                    const rawTags = Array.isArray(row.capability_tags) ? row.capability_tags : [];
                    const levelLabelsToRemove = lang === "ko"
                      ? ["AI 영향 높음", "AI 영향 낮음", "AI 영향 중간"]
                      : ["High AI impact", "Low AI impact", "Medium AI impact"];
                    const tags = rawTags.filter((t) => !levelLabelsToRemove.includes(String(t).trim()));
                    return (
                      <div key={`task-cap-${row.task_id ?? idx}-${idx}`} className="task-ksa-row">
                        <div className="task-ksa-task">{row.task_text || "—"}</div>
                        <div className="task-ksa-tags">
                          {tags.map((tag, i) => (
                            <span key={`${row.task_id ?? idx}-tag-${i}`} className="task-ksa-tag">{translateCapabilityName(tag, lang)}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })()}
            </>
            )}

            {showInlineCtas ? (
              <ReportCtaCard
                variant="after-s4"
                lang={lang}
                socCode={socForCta}
                reportStep={4}
              />
            ) : null}
          </section>
          ) : null}

          {showInlineCtas ? (
            <section className="card span-12 section-anchor report-closing-cta-section" id="sec-report-closing">
              <ReportCtaCard
                variant="closing"
                lang={lang}
                socCode={socForCta}
                onShare={handleReportShare}
              />
            </section>
          ) : null}

          {/* STEP 5 ↔ sec-heatmap: 업무별 AI 영향 — 기획상 화면 비노출 */}
          {/*
          <section
            className="card span-12 section-anchor"
            id="sec-heatmap"
            data-report-step="6"
          >
            
            <ReportSectionHeading step={5}>{heatmapSectionTitle}</ReportSectionHeading>
            {renderAiCompositionBlock()}
            <div className="section-subblock">
              <h3 className="section-subtitle" style={{ marginTop: 0 }}>
                {lang === "ko" ? "업무 목록" : "Task list"}
              </h3>
              <div className="compare-table-wrap">
                <table className="task-table compare-table">
                  <thead>
                    <tr>
                      <th>{lang === "ko" ? "업무" : "Task"}</th>
                      <th>{lang === "ko" ? "AI 영향 단계" : "AI impact level"}</th>
                      <th>
                        {lang === "ko" ? "AI 영향 설명" : "Rationale"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((r) => (
                      <tr key={r.task_id}>
                        <td className="task-task">{r.task || "—"}</td>
                        <td>
                          <div className="ai-impact-cell">
                            <span className="task-table-badge task-table-badge-ai">{r.b}</span>
                          </div>
                        </td>
                        <td className="ai-impact-rationale">
                          {r.reasonB || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          */}

          {ctaPlacement === "rail" ? (
            <div id="sec-viewer-cta-closing" className="report-viewer-cta-anchor" aria-hidden="true" />
          ) : null}

          </div>
        </div>
      </div>
      {positionMapZoomOpen ? (
        <div
          className="position-map-zoom-backdrop"
          role="presentation"
          onClick={() => setPositionMapZoomOpen(false)}
        >
          <div
            className="position-map-zoom-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              lang === "ko" ? "포지션 맵 (확대)" : "Position map (expanded)"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="position-map-zoom-inner">
              <button
                type="button"
                className="position-map-zoom-close"
                onClick={() => setPositionMapZoomOpen(false)}
                aria-label={lang === "ko" ? "닫기" : "Close"}
              >
                ×
              </button>
              {hasCurrentPositionCard ? (
                <div className="career-positioning-panel career-positioning-panel--with-quad">
                  {renderPositionMapVsAllBlock({ minimalEmbeds: true, showZoomBtn: false })}
                </div>
              ) : (
                <div className="summary-v2-quad-only-stack">
                  {renderPositionMapVsAllBlock({ minimalEmbeds: false, showZoomBtn: false })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
