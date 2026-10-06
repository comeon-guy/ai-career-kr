/**
 * 리포트 UI 소제목·배지 — 검토 확정 문구. DB/LLM과 무관하게 표시 전 고정.
 */
import { applyCanonicalSection4Labels } from "./section4CanonicalUi.js";

const SECTION2_DECLINE_ACC_TITLES = ["왜 낮아지나", "그래도 완전히 사라지지 않는 이유"];
const SECTION2_RISE_ACC_TITLES = ["왜 높아지나", "어떤 역량이 중요해지나"];

/** @param {object} s2 section_2_value_shift */
function applySection2AccordionTitles(s2) {
  const fixWork = (work, titles) => {
    if (!work || !Array.isArray(work.accordions)) return;
    const bodies = work.accordions.map((a) =>
      a && typeof a.body === "string" ? a.body.trim() : "",
    );
    while (bodies.length < 2) bodies.push("");
    work.accordions = titles.map((title, i) => ({
      title,
      body: bodies[i] || "",
    }));
  };
  fixWork(s2.decline_work, SECTION2_DECLINE_ACC_TITLES);
  fixWork(s2.rise_work, SECTION2_RISE_ACC_TITLES);
}

/**
 * @param {object} ui
 * @param {string} lang
 */
export function applyCanonicalUiLabels(ui, lang = "ko", report = null) {
  if (!ui || typeof ui !== "object") return;
  const isKo = lang !== "en";

  const s2 = ui.section_2_value_shift;
  if (s2 && isKo) {
    applySection2AccordionTitles(s2);
  }
  if (s2?.hero_insight) {
    s2.hero_insight.eyebrow = isKo ? "핵심 변화" : "Core shift";
  }
  if (s2?.gravity_shift) {
    if (isKo) {
      s2.gravity_shift.title = "역할의 무게 중심 이동";
      if (s2.gravity_shift.from_box) s2.gravity_shift.from_box.label = "AI·자동화 도구가 선행하기 쉬운 영역";
      if (s2.gravity_shift.to_box) s2.gravity_shift.to_box.label = "사람에게 남는 영역";
    } else {
      s2.gravity_shift.title = "Shift in where the weight sits";
      if (s2.gravity_shift.from_box) s2.gravity_shift.from_box.label = "Where tools tend to go first";
      if (s2.gravity_shift.to_box) s2.gravity_shift.to_box.label = "What stays with people";
    }
  }

  const s3 = ui.section_3_work_style;
  if (s3?.hero_insight) {
    s3.hero_insight.badge_title = isKo
      ? "일하는 방식 변화"
      : "Shift in ways of working";
  }
  if (s3?.core_axis) {
    s3.core_axis.title = isKo ? "일하는 방식의 핵심 축" : "Core axes of ways of working";
  }
  if (s3?.shift_lanes_header) {
    if (isKo) {
      s3.shift_lanes_header.title = "역량 구조 변화 방향";
      s3.shift_lanes_header.label_before = "예전 방식";
      s3.shift_lanes_header.label_after = "앞으로 강해질 방식";
    } else {
      s3.shift_lanes_header.title = "How capability structure shifts";
      s3.shift_lanes_header.label_before = "Before";
      s3.shift_lanes_header.label_after = "Growing stronger";
    }
  }

  if (ui.section_4_task_ai_role) {
    applyCanonicalSection4Labels(ui.section_4_task_ai_role, lang, report);
  }
  if (ui.report_ui) {
    applyCanonicalUiLabels(ui.report_ui, lang, report);
  }
}

/** @param {object} report @param {string} lang */
export function applyCanonicalReportRootLabels(report, lang = "ko") {
  if (!report || typeof report !== "object") return;
  if (lang !== "en") {
    report.career_summary_heading = "AI 시대 커리어 전략";
    report.value_shift_heading = "직무 가치 이동 방향";
  } else {
    report.career_summary_heading = "AI-era career strategy";
    report.value_shift_heading = "Where value in the role is moving";
  }
}
