/**
 * Section 04 WORKFLOW presentation artifact.
 * Distinct from career competitiveness (03). No takeaway reuse.
 * Workflow unit count is evidence-driven; flow labels are optional (not user-facing boxes).
 */

import payload from "./data/aiWorkingSection04Narrative_7soc_v1.json" with { type: "json" };
import {
  AI_WORKING_WORKFLOW_COUNT_MAX,
} from "./canonicalPresentationContract.js";
import { section03PresentationFromNarrative } from "./allSocNarrativeUi.js";
import { isAccountantGoldenSoc } from "./reportStoryFlowPilot.js";

export const SECTION_04_NARRATIVE_CONTRACT = "ai-working-section-04-narrative-v1";
export const SECTION_04_SEMANTIC_ROLE = "WORKFLOW";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function getSection04Narrative(soc, report) {
  const overlay = isAccountantGoldenSoc(soc)
    ? null
    : section03PresentationFromNarrative(report?.all_soc_narrative, report?.profile?.occupation_title);
  if (overlay && typeof overlay === "object") {
    const intro = overlay.occupation_intro;
    const prose = Array.isArray(overlay.prose_items)
      ? overlay.prose_items
          .map((item, i) => ({
            key: item?.key || `p${i + 1}`,
            title: clean(item?.title),
            body: clean(item?.body),
          }))
          .filter((item) => item.title && item.body)
          .slice(0, AI_WORKING_WORKFLOW_COUNT_MAX)
      : [];
    if (intro?.body && prose.length >= 1) {
      return {
        contract: report?.all_soc_narrative?.contract || SECTION_04_NARRATIVE_CONTRACT,
        semanticRole: SECTION_04_SEMANTIC_ROLE,
        soc: String(soc || "").trim(),
        occupation: clean(overlay.occupation),
        anchorSituation: clean(overlay.anchor_situation),
        occupationIntro: { title: "", body: clean(intro.body) },
        flowLabels: Array.isArray(overlay.flow_labels)
          ? overlay.flow_labels.map(clean).filter(Boolean)
          : [],
        proseItems: prose,
        supportingTaskIds: Array.isArray(overlay.supporting_task_ids)
          ? overlay.supporting_task_ids.map(String)
          : [],
        sourceArtifact: clean(overlay.source_artifact) || "all_soc_narrative_v1",
        raw: overlay,
      };
    }
  }
  const row = payload?.socs?.[String(soc || "").trim()];
  if (!row || typeof row !== "object") return null;
  const intro = row.occupation_intro;
  const flow = Array.isArray(row.flow_labels)
    ? row.flow_labels.map(clean).filter(Boolean)
    : [];
  const prose = Array.isArray(row.prose_items)
    ? row.prose_items
        .map((item, i) => ({
          key: item?.key || `p${i + 1}`,
          title: clean(item?.title),
          body: clean(item?.body),
        }))
        .filter((item) => item.title && item.body)
        .slice(0, AI_WORKING_WORKFLOW_COUNT_MAX)
    : [];
  if (
    !intro?.body ||
    !prose.length
  ) {
    return null;
  }
  if (row.semantic_role && row.semantic_role !== SECTION_04_SEMANTIC_ROLE) return null;
  return {
    contract: payload.contract || SECTION_04_NARRATIVE_CONTRACT,
    semanticRole: SECTION_04_SEMANTIC_ROLE,
    soc: String(soc || "").trim(),
    occupation: clean(row.occupation),
    anchorSituation: clean(row.anchor_situation),
    occupationIntro: {
      /** Helper subheading removed from user-facing presentation (V2.2). */
      title: "",
      body: clean(intro.body || intro.summary),
    },
    /** Kept for audit/provenance only — presentation does not render flow boxes. */
    flowLabels: flow,
    proseItems: prose,
    supportingTaskIds: Array.isArray(row.supporting_task_ids)
      ? row.supporting_task_ids.map(String)
      : [],
    sourceArtifact: clean(row.source_artifact) || "aiWorkingSection04Narrative_7soc_v1",
    raw: row,
  };
}

export function resolveSection04Narrative({ soc = "", report = null } = {}) {
  return getSection04Narrative(soc, report);
}
