import { reportSectionLabel } from "../reportStructure.js";
import {
  isReportStoryFlowPilotSoc,
  STORY_FLOW_VALUE_CHANGE_INTRO,
} from "../reportStoryFlowPilot.js";
import { canonicalValueShiftItems } from "../canonicalPresentationContract.js";
import { section2ValueShiftFromNarrative } from "../allSocNarrativeUi.js";

/**
 * Semantic adapter: report data contract → EditorialValueShift labels.
 * Presentation must not infer value-shift from AI impact / opportunity / risk.
 */

import {
  DECLINE_ACCORDION_TITLES_EN,
  DECLINE_ACCORDION_TITLES_KO,
  RISE_ACCORDION_TITLES_EN,
  RISE_ACCORDION_TITLES_KO,
} from "../components/report/section2ValueShiftParse.js";

const VALUE_DECLINE_KEYS = [
  "value_decline_tasks",
  "decline_tasks",
  "value_decline",
  "lower_value_tasks",
];
const VALUE_RISE_KEYS = [
  "value_rise_tasks",
  "rise_tasks",
  "value_rise",
  "higher_value_tasks",
];

function trimText(v) {
  return v == null ? "" : String(v).trim();
}

function stringList(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return trimText(x);
      if (!x || typeof x !== "object") return "";
      return trimText(x.text ?? x.title ?? x.task_text ?? x.task_text);
    })
    .filter(Boolean);
}

function listFromReportKeys(report, keys) {
  if (!report || typeof report !== "object") return [];
  for (let i = 0; i < keys.length; i += 1) {
    const list = stringList(report[keys[i]]);
    if (list.length) return list;
  }
  return [];
}

function reasonsFromWorkBlock(block) {
  if (!block || typeof block !== "object") return [];
  const acc = Array.isArray(block.accordions) ? block.accordions : [];
  const fromAcc = acc
    .map((a) => ({
      title: trimText(a?.title),
      body: trimText(a?.body),
    }))
    .filter((a) => a.body);
  if (fromAcc.length) return fromAcc;
  const out = [];
  const why = trimText(block.why);
  const whyNot = trimText(block.why_not_disappear);
  const caps = trimText(block.important_capabilities);
  if (why) out.push({ title: "", body: why });
  if (whyNot) out.push({ title: "", body: whyNot });
  if (caps) out.push({ title: "", body: caps });
  return out;
}

function valueShiftCopy(isKo, soc = "", report = null) {
  const story = isReportStoryFlowPilotSoc(soc, report);
  return {
    sectionTitle: reportSectionLabel("valueShift", isKo ? "ko" : "en", soc),
    sectionLead: story
      ? isKo
        ? STORY_FLOW_VALUE_CHANGE_INTRO.ko
        : STORY_FLOW_VALUE_CHANGE_INTRO.en
      : isKo
        ? "AI 활용이 확대되면 업무의 상대적 가치는 서로 다르게 변할 수 있습니다. 반복·정형 업무와 해석·판단·책임이 필요한 업무를 비교합니다."
        : "As AI use expands, relative work value can shift differently. Compare more routine work with work that needs interpretation, judgment, and accountability.",
    leftTitle: isKo ? "가치가 낮아질 가능성이 큰 업무" : "Work likely to lose relative value",
    rightTitle: isKo ? "가치가 높아질 가능성이 큰 업무" : "Work likely to gain relative value",
    declineWhyTitle: isKo ? DECLINE_ACCORDION_TITLES_KO[0] : DECLINE_ACCORDION_TITLES_EN[0],
    declinePersistTitle: isKo ? DECLINE_ACCORDION_TITLES_KO[1] : DECLINE_ACCORDION_TITLES_EN[1],
    riseWhyTitle: isKo ? RISE_ACCORDION_TITLES_KO[0] : RISE_ACCORDION_TITLES_EN[0],
    riseCapTitle: isKo ? RISE_ACCORDION_TITLES_KO[1] : RISE_ACCORDION_TITLES_EN[1],
  };
}

/**
 * @param {{
 *   section2FromApi?: object | null;
 *   valueDeclineTasks?: string[];
 *   valueRiseTasks?: string[];
 *   valueDeclineInterpretation?: string;
 *   valueRiseInterpretation?: string;
 *   report?: object | null;
 *   lang?: string;
 * }} args
 * @returns {{
 *   mode: "value_shift";
 *   sectionTitle: string;
 *   sectionLead: string;
 *   leftTitle: string;
 *   rightTitle: string;
 *   leftItems: string[];
 *   rightItems: string[];
 *   leftReasons: { title: string; body: string }[];
 *   rightReasons: { title: string; body: string }[];
 * } | null}
 */
export function getValueShiftPresentation({
  section2FromApi = null,
  valueDeclineTasks = [],
  valueRiseTasks = [],
  valueDeclineInterpretation = "",
  valueRiseInterpretation = "",
  report = null,
  lang = "ko",
} = {}) {
  const isKo = lang !== "en";
  const soc = String(report?.profile?.occupation_id || report?.profile?.occupation_id || report?.profile?.soc_code || "").trim();
  const section2Resolved =
    section2FromApi && typeof section2FromApi === "object"
      ? section2FromApi
      : section2ValueShiftFromNarrative(report?.all_soc_narrative);

  if (section2Resolved && typeof section2Resolved === "object") {
    const dw = section2Resolved.decline_work || {};
    const rw = section2Resolved.rise_work || {};
    const leftItems = stringList(dw.bullets);
    const rightItems = stringList(rw.bullets);
    if (leftItems.length || rightItems.length) {
      const copy = valueShiftCopy(isKo, soc, report);
      const leftReasons = reasonsFromWorkBlock(dw).map((r, i) => ({
        title: r.title || (i === 0 ? copy.declineWhyTitle : copy.declinePersistTitle),
        body: r.body,
      }));
      const rightReasons = reasonsFromWorkBlock(rw).map((r, i) => ({
        title: r.title || (i === 0 ? copy.riseWhyTitle : copy.riseCapTitle),
        body: r.body,
      }));
      return {
        mode: "value_shift",
        sectionTitle: copy.sectionTitle,
        sectionLead: copy.sectionLead,
        leftTitle: copy.leftTitle,
        rightTitle: copy.rightTitle,
        leftItems: canonicalValueShiftItems(leftItems, lang),
        rightItems: canonicalValueShiftItems(rightItems, lang),
        leftReasons,
        rightReasons,
      };
    }
  }

  const declineItems = valueDeclineTasks.length
    ? stringList(valueDeclineTasks)
    : listFromReportKeys(report, VALUE_DECLINE_KEYS);
  const riseItems = valueRiseTasks.length
    ? stringList(valueRiseTasks)
    : listFromReportKeys(report, VALUE_RISE_KEYS);

  if (declineItems.length || riseItems.length) {
    const copy = valueShiftCopy(isKo, soc, report);
    const leftReasons = [];
    const declineWhy = trimText(valueDeclineInterpretation);
    if (declineWhy) leftReasons.push({ title: copy.declineWhyTitle, body: declineWhy });
    const rightReasons = [];
    const riseWhy = trimText(valueRiseInterpretation);
    if (riseWhy) rightReasons.push({ title: copy.riseWhyTitle, body: riseWhy });
    return {
      mode: "value_shift",
      sectionTitle: copy.sectionTitle,
      sectionLead: copy.sectionLead,
      leftTitle: copy.leftTitle,
      rightTitle: copy.rightTitle,
      leftItems: canonicalValueShiftItems(declineItems, lang),
      rightItems: canonicalValueShiftItems(riseItems, lang),
      leftReasons,
      rightReasons,
    };
  }

  const copy = valueShiftCopy(isKo, soc, report);
  return {
    mode: "value_shift",
    sectionTitle: copy.sectionTitle,
    sectionLead: copy.sectionLead,
    leftTitle: copy.leftTitle,
    rightTitle: copy.rightTitle,
    leftItems: [],
    rightItems: [],
    leftReasons: [],
    rightReasons: [],
  };
}
