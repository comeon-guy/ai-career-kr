/**
 * 03/04 Common Presentation Contract — presentation binding only.
 * 03 = COMPETITIVENESS (career artifact)
 * 04 = WORKFLOW (section-04 narrative artifact)
 * Never reuse 03 takeaways/prose as 04 content. Missing 04 → fail closed.
 * Flow direction chains are internal generation structure only — not user-facing boxes.
 * Item counts are evidence-driven within soft UI bounds.
 */

import { narrativeRoleDirection } from "./narrativeRoleDirection.js";
import { resolveCareerCompetitivenessPresentation } from "./careerCompetitivenessOccupationAdapter.js";
import { resolveSection04Narrative } from "./section04NarrativeAdapter.js";
import {
  ACCOUNTANT_AI_USAGE_STEP_TITLES,
  isAccountantGoldenSoc,
} from "./reportStoryFlowPilot.js";

export const SECTION_NARRATIVE_PRESENTATION_CONTRACT =
  "section-03-04-common-presentation-v1";

export const SECTION_03_SEMANTIC_ROLE = "COMPETITIVENESS";
export const SECTION_04_SEMANTIC_ROLE = "WORKFLOW";

const GENERIC_AI_WORKING_FLOW = Object.freeze(["상황", "AI", "검증", "결정"]);
const GENERIC_AI_WORKING_FLOW_EN = Object.freeze([
  "Situation",
  "AI",
  "Verify",
  "Decide",
]);

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asLabelList(labels) {
  return (Array.isArray(labels) ? labels : []).map(clean).filter(Boolean);
}

function isGenericAiWorkingFlow(labels) {
  const rows = asLabelList(labels);
  if (!rows.length) return true;
  const joined = rows.join("|");
  return (
    joined === GENERIC_AI_WORKING_FLOW.join("|") ||
    joined === GENERIC_AI_WORKING_FLOW_EN.join("|")
  );
}

function takeawayBody(row) {
  return clean(row?.body || row?.description);
}

function proseFromTakeaways(takeaways) {
  return (Array.isArray(takeaways) ? takeaways : [])
    .map((row, i) => ({
      key: row?.id || `t${i + 1}`,
      title: clean(row?.title),
      body: takeawayBody(row),
    }))
    .filter((row) => row.title && row.body);
}

/** Compress labels for legacy callers — not used to invent 04 prose or force UI boxes. */
export function compressFlowLabel(text, max = 14) {
  let t = clean(text);
  if (!t) return "";
  t = t.replace(/하는 (?:능력|역할|업무|점검)$/u, "");
  t = t.replace(/처럼 책임지고 결정하는 일$/u, "");
  t = t.replace(/[을를] 정하는 일$/u, "");
  t = t.replace(/하는 일$/u, "");
  t = clean(t);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = Math.max(cut.lastIndexOf("·"), cut.lastIndexOf(" "));
  if (at >= 6) return clean(cut.slice(0, at));
  return clean(cut);
}

/**
 * Internal direction chain for generation/audit only.
 * Not rendered as a user-facing flow box.
 */
export function resolveCompetitivenessFlowLabels(_career, lang = "ko") {
  return narrativeRoleDirection("competitiveness", lang)
    .split(/\s*→\s*/u)
    .map(clean)
    .filter(Boolean);
}

/**
 * Occupation workflow labels from artifact (audit/provenance).
 * Presentation does not require or render these as flow boxes.
 */
export function resolveAiWorkingFlowLabels({ narrative, section04 } = {}) {
  const fromSection04 = asLabelList(section04?.flowLabels || section04?.flow_labels);
  if (fromSection04.length && !isGenericAiWorkingFlow(fromSection04)) return fromSection04;
  const fromNarrative = asLabelList(narrative?.flow_labels);
  if (fromNarrative.length && !isGenericAiWorkingFlow(fromNarrative)) return fromNarrative;
  return null;
}

export function resolveCompetitivenessSectionPresentation({ soc = "", lang = "ko", report = null } = {}) {
  void lang;
  const career = resolveCareerCompetitivenessPresentation({ soc, report });
  if (!career) return null;
  const proseItems = proseFromTakeaways(career.takeaways);
  if (!proseItems.length) {
    return null;
  }
  return {
    contract: SECTION_NARRATIVE_PRESENTATION_CONTRACT,
    section: "competitiveness",
    semanticRole: SECTION_03_SEMANTIC_ROLE,
    sourceArtifact: "careerCompetitivenessOccupation_v1",
    intro: clean(career.summary),
    occupationLead: null,
    /** Flow boxes are absent by contract — direction stays internal. */
    flowLabels: null,
    proseItems,
    career,
  };
}

export function resolveAiWorkingSectionPresentation({
  soc = "",
  lang = "ko",
  report = null,
  scenario = null,
  occupationTitle = "",
  career = null,
} = {}) {
  void lang;
  void scenario;
  void occupationTitle;
  void career;

  const section04 = resolveSection04Narrative({ soc, report });
  if (!section04) return null;

  const occupationLead = section04.occupationIntro;
  if (!occupationLead?.body) return null;

  const proseItems = section04.proseItems;
  if (!Array.isArray(proseItems) || !proseItems.length) {
    return null;
  }

  let items = proseItems;
  let lead = occupationLead;
  if (isAccountantGoldenSoc(soc) && proseItems.length === ACCOUNTANT_AI_USAGE_STEP_TITLES.length) {
    items = proseItems.map((row, i) => ({
      ...row,
      title: ACCOUNTANT_AI_USAGE_STEP_TITLES[i] || row.title,
    }));
    lead = {
      ...occupationLead,
      body:
        clean(occupationLead.body).replace(
          /확인과 검증, 그리고 최종 판단은 회계사·감사인이 맡습니다\.?/u,
          "확인과 검증, 최종 판단에는 사람의 책임이 남을 수 있습니다.",
        ) || occupationLead.body,
    };
  }

  return {
    contract: SECTION_NARRATIVE_PRESENTATION_CONTRACT,
    section: "aiWorking",
    semanticRole: SECTION_04_SEMANTIC_ROLE,
    sourceArtifact: section04.sourceArtifact,
    intro: "",
    occupationLead: lead,
    /** Flow boxes are absent by contract — direction stays internal. */
    flowLabels: null,
    proseItems: items,
    narrative: null,
    section04,
  };
}

/** Exact prose identity helper for separation gates. */
export function proseFingerprint(items) {
  return (Array.isArray(items) ? items : [])
    .map((row) => `${clean(row?.title)}|${clean(row?.body)}`)
    .join("||");
}
