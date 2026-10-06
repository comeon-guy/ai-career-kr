/** ReportIntegrated / Section4 derived data — shared task AI helpers */

export function inferWorkType(task) {
  const text = [task?.task_text || "", ...(task?.dwas || []).map((d) => d?.dwa_title || "")].join(" ").toLowerCase();
  const analysisKw = ["analyz", "분석", "evaluate", "평가", "report", "보고", "document", "기록", "data", "research", "연구", "investigate", "조사", "measure", "측정", "monitor", "모니터"];
  const routineKw = ["prepare", "준비", "update", "갱신", "maintain", "유지", "process", "처리", "manage", "관리", "입력", "input", "정리", "작성", "draft", "compile", "편집", "edit", "반복", "routine", "schedule", "일정", "file", "파일", "record", "등록"];
  const judgmentKw = ["decide", "decision", "판단", "solve", "해결", "coordinate", "조정", "communicat", "소통", "negotia", "협상", "coach", "지도", "lead", "리드", "검토", "review", "승인", "approve", "설명", "explain", "지시", "direct", "의사결정", "judgment", "책임", "accountability", "제안", "propose", "권고", "recommend"];
  const countA = analysisKw.filter((k) => text.includes(k)).length;
  const countR = routineKw.filter((k) => text.includes(k)).length;
  const countJ = judgmentKw.filter((k) => text.includes(k)).length;
  if (countA + countJ + countR === 0) {
    const lev = (task?.ai_impact_level_llm || task?.ai_impact_level || "medium").toLowerCase();
    if (lev === "high") return "organize_routine";
    if (lev === "low") return "judgment_explanation";
    return "analysis_report";
  }
  if (countJ >= countA && countJ >= countR) return "judgment_explanation";
  if (countR >= countA && countR >= countJ) return "organize_routine";
  return "analysis_report";
}

export function getAiImpactReason(task, lang, options = {}) {
  const { forceLevel = null, ignoreExplicit = false } = options;
  const explicitKo = task?.ai_impact_reason_ko;
  if (!ignoreExplicit && explicitKo && lang === "ko") return explicitKo;
  const explicitEn = task?.ai_impact_reason_en || task?.ai_impact_reason;
  if (!ignoreExplicit && explicitEn && lang === "en") return explicitEn;
  const wt = task?.work_type_llm || task?.work_type || inferWorkType(task);
  const level = (forceLevel || task?.ai_impact_level_llm || task?.ai_impact_level || "medium").toLowerCase();
  if (lang === "ko") {
    if (level === "high") {
      if (wt === "organize_routine") return "반복적이고 규칙이 명확한 정리·처리 업무라서 자동화·AI 초안 생성에 적합합니다.";
      if (wt === "analysis_report") return "데이터·문서를 기반으로 한 규칙적인 분석·보고 업무라서 AI가 초안 작성·요약을 대신할 수 있는 부분이 큽니다.";
      return "업무 절차와 산출물이 비교적 표준화되어 있어 AI가 결과 초안과 단순 의사결정까지 자동으로 수행하기 쉽습니다.";
    }
    if (level === "low") {
      if (wt === "judgment_explanation") return "이해관계자 조정, 설명, 책임이 강하게 따르는 판단 업무라서 현재 수준의 AI가 전면 대체하기 어렵습니다.";
      return "업무 결과에 대한 책임과 맥락 판단이 중요해 사람이 중심이 되고 AI는 참고 수준으로만 사용할 가능성이 큽니다.";
    }
    if (wt === "analysis_report") return "AI가 자료 수집·요약·초안 작성을 도와주고, 최종 해석과 보고는 담당자가 수행하는 협업 구조에 적합합니다.";
    if (wt === "organize_routine") return "데이터 정리·업데이트 과정 일부는 자동화할 수 있지만 예외 처리와 품질 관리는 사람이 함께 보는 형태가 현실적입니다.";
    return "AI가 참고 자료 제시·초안 도움은 줄 수 있지만, 최종 판단과 설명은 사람의 역할로 남는 협업 형태가 적합합니다.";
  }
  if (level === "high") {
    if (wt === "organize_routine") return "Highly repetitive and rule-based organizing work makes it suitable for automation and AI-generated drafts.";
    if (wt === "analysis_report") return "Structured analysis and reporting on data/documents can largely be drafted by AI.";
    return "Tasks follow relatively standard procedures and outputs, so AI can automate much of the work.";
  }
  if (level === "low") {
    if (wt === "judgment_explanation") return "Heavy judgment, explanation and accountability make full automation difficult.";
    return "Context and responsibility matter, so humans stay central and AI is mainly a reference tool.";
  }
  if (wt === "analysis_report") return "AI can assist with data gathering, summarization and first drafts, while humans keep final interpretation.";
  if (wt === "organize_routine") return "Parts of the organizing work can be automated, but exception handling and quality control remain human.";
  return "AI can help with suggestions and drafts, but key decisions and explanations remain human driven.";
}

/** B안: base(ai_impact_level) 우선 (LLM은 보조 폴백) */
export function getAiLevelByMode(t) {
  const llm = (t?.ai_impact_level_llm || "").toLowerCase();
  const base = (t?.ai_impact_level || "").toLowerCase();
  return base || llm || "medium";
}

export function getFrequencyScore(t) {
  const raw = t.frequency_mean ?? t.frequency;
  const v = Number(raw);
  if (!Number.isFinite(v)) return 0;
  let scaled;
  if (v <= 1.01) scaled = v * 5;
  else scaled = (v / 7) * 5;
  return Math.max(0, Math.min(5, scaled));
}

export function getAiReasonByMode(task, lang) {
  const level = getAiLevelByMode(task);
  return getAiImpactReason(task, lang, { forceLevel: level, ignoreExplicit: true });
}
