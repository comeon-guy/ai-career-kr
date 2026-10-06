import { useEffect, useMemo, useState } from "react";
import { situationId } from "./situationPresentation";
import { isScenarioId, situationRenderLog } from "./selectRepresentativeSituations";
import SectionCommonPresentation from "./SectionCommonPresentation.jsx";
import { resolveCareerCompetitivenessPresentation } from "../../careerCompetitivenessOccupationAdapter.js";
import {
  resolveAiWorkingSectionPresentation,
  resolveCompetitivenessSectionPresentation,
} from "../../sectionNarrativePresentation.js";
import { reportSectionLabel, reportSectionNumber } from "../../reportStructure.js";
import { isReportStoryFlowPilotSoc } from "../../reportStoryFlowPilot.js";
import "./work-scenarios.css";
import "./section-common-presentation.css";

function occupationDisplayName(report, lang) {
  const profile = report?.profile || {};
  if (lang === "en") {
    return String(profile.occupation_title_en || profile.occupation_title || "").trim();
  }
  return String(profile.occupation_title || profile.occupation_title_ko || "").trim();
}

/**
 * Live competitiveness / AI-working owner under Common Presentation Contract.
 * Story-flow pilot: AI usage (03) before competitiveness (04).
 */
export default function WorkScenarios({
  scenarios = [],
  otherValidSituations = [],
  selection = null,
  report = null,
  lang = "ko",
  socCode = "",
  onOpenEvidence: _onOpenEvidence,
  dataSource = null,
  showAiWorkingSection = true,
  showCompetitivenessSection = true,
  storyFlowOrder = false,
}) {
  const requireScenarioIds =
    dataSource === "representative_selection" ||
    dataSource === "missing_contract" ||
    Boolean(selection?.anchor_situation || selection?.presentation_order);
  const rawDefault = Array.isArray(scenarios) ? scenarios.filter(Boolean) : [];
  const rawOther = Array.isArray(otherValidSituations) ? otherValidSituations.filter(Boolean) : [];
  const defaultList = requireScenarioIds ? rawDefault.filter((s) => isScenarioId(s.scenario_id)) : rawDefault;
  const otherList = requireScenarioIds ? rawOther.filter((s) => isScenarioId(s.scenario_id)) : rawOther;
  const selectorList = [...defaultList, ...otherList];
  const anchor = selection?.anchor_situation
    ? String(selection.anchor_situation)
    : situationId(defaultList[0], 0);

  const [selectedId, setSelectedId] = useState(anchor);
  const defaultKey = selectorList.map((s) => situationId(s)).join("|");

  useEffect(() => {
    setSelectedId(anchor);
  }, [anchor, defaultKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dataSource !== "representative_selection" && dataSource !== "missing_contract") return;
    const payload = situationRenderLog(defaultList, otherList, selection);
    payload.dataSource = dataSource;
    window.__FC_REVIEW_SITUATIONS__ = payload;
    // eslint-disable-next-line no-console
    console.info("[review-contract] AI 활용 방식", payload);
  }, [anchor, defaultKey, dataSource, defaultList, otherList, selection]);

  const catalog = useMemo(() => {
    const map = new Map();
    defaultList.forEach((s, i) => map.set(situationId(s, i), s));
    otherList.forEach((s, i) => map.set(situationId(s, `o${i}`), s));
    return map;
  }, [defaultList, otherList]);

  const selected = catalog.get(selectedId) || defaultList[0] || null;

  if (!defaultList.length && !otherList.length) return null;

  const reportSoc = String(report?.profile?.soc_code || socCode || "").trim();
  const occupationTitle = occupationDisplayName(report, lang);
  const useStoryFlow = storyFlowOrder || isReportStoryFlowPilotSoc(reportSoc, report);
  const careerPresentation = resolveCareerCompetitivenessPresentation({
    soc: reportSoc,
    report,
  });
  const competitivenessView = resolveCompetitivenessSectionPresentation({
    soc: reportSoc,
    lang,
    report,
  });
  const showCareerSection = showCompetitivenessSection && Boolean(competitivenessView);
  const aiWorkingView = resolveAiWorkingSectionPresentation({
    soc: reportSoc,
    lang,
    report,
    scenario: selected,
    occupationTitle,
    career: careerPresentation,
  });

  const careerSection = showCareerSection ? (
    <section
      className="fc-section ws-career-section"
      id="sec-career-competitiveness"
      aria-labelledby="ws-career-heading"
      data-section="career-competitiveness"
      data-presentation-owner="section-03-04-common-presentation-v1"
      data-career-artifact={careerPresentation?.presentationContract || "resolved"}
    >
      <div className="fc-section-head">
        <span className="fc-section-no">{reportSectionNumber("competitiveness", reportSoc)}</span>
        <h2 id="ws-career-heading" className="fc-section-title">
          {reportSectionLabel("competitiveness", lang, reportSoc)}
        </h2>
      </div>
      <SectionCommonPresentation
        variant="competitiveness"
        lang={lang}
        intro={competitivenessView.intro}
        flowLabels={competitivenessView.flowLabels}
        proseItems={competitivenessView.proseItems}
      />
    </section>
  ) : null;

  const aiWorkingSection = showAiWorkingSection ? (
    <section
      className="fc-section ws-section"
      id="sec-work-scenarios"
      aria-labelledby="ws-heading"
      data-section="ai-working"
      data-presentation-owner="section-03-04-common-presentation-v1"
      data-story-flow={useStoryFlow ? "pilot" : "default"}
    >
      <div className="fc-section-head">
        <span className="fc-section-no">{reportSectionNumber("aiWorking", reportSoc)}</span>
        <h2 id="ws-heading" className="fc-section-title">
          {reportSectionLabel("aiWorking", lang, reportSoc)}
        </h2>
      </div>
      {aiWorkingView ? (
        <SectionCommonPresentation
          variant="aiWorking"
          lang={lang}
          layout={useStoryFlow ? "stepFlow" : "prose"}
          occupationLead={aiWorkingView.occupationLead}
          flowLabels={aiWorkingView.flowLabels}
          proseItems={aiWorkingView.proseItems}
          flowAriaLabel={
            lang === "en"
              ? `${occupationTitle} AI usage flow`
              : `${occupationTitle} AI를 활용하는 방식`
          }
        />
      ) : (
        <SectionCommonPresentation variant="aiWorking" lang={lang} />
      )}
    </section>
  ) : null;

  if (useStoryFlow) {
    return (
      <>
        {aiWorkingSection}
        {careerSection}
      </>
    );
  }

  return (
    <>
      {careerSection}
      {aiWorkingSection}
    </>
  );
}
