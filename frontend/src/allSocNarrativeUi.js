/**
 * Read-time mapping from all_soc_narrative_v1 artifacts onto the latest Report Shell.
 * Does not regenerate copy. US Golden SOC overlays are not applied in KR runtime.
 */

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function bulletsFromTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map((row) => {
      if (typeof row === "string") return clean(row);
      if (!row || typeof row !== "object") return "";
      return clean(row.sentence || row.text || row.title || row.body);
    })
    .filter(Boolean);
}

function stepBody(step) {
  if (!step || typeof step !== "object") return "";
  const direct = clean(step.body);
  if (direct) return direct;
  return ["situation", "ai_helps", "ai_limit", "human_judgment", "handoff"]
    .map((key) => clean(step[key]))
    .filter(Boolean)
    .join(" ");
}

export function section2ValueShiftFromNarrative(all) {
  if (!all || typeof all !== "object") return null;
  const pres = all.section_2_value_shift;
  if (pres && typeof pres === "object" && pres.decline_work && pres.rise_work) {
    return pres;
  }
  const s2 = all.section_02;
  if (!s2 || typeof s2 !== "object") return null;
  const decline = bulletsFromTasks(s2.decline_tasks);
  const rise = bulletsFromTasks(s2.rise_tasks);
  const whyLower = clean(s2.why_lower);
  const whyNot = clean(s2.why_not_disappear);
  const whyHigher = clean(s2.why_higher);
  const caps = clean(s2.capabilities);
  if (!decline.length || !rise.length || !whyLower || !whyNot || !whyHigher || !caps) {
    return null;
  }
  return {
    decline_work: {
      bullets: decline,
      accordions: [
        { title: "왜 낮아지나", body: whyLower },
        { title: "그래도 완전히 사라지지 않는 이유", body: whyNot },
      ],
    },
    rise_work: {
      bullets: rise,
      accordions: [
        { title: "왜 높아지나", body: whyHigher },
        { title: "어떤 역량이 중요해지나", body: caps },
      ],
    },
  };
}

export function section03PresentationFromNarrative(all, occupationTitle = "") {
  const overlay = all?.section_03_presentation;
  if (overlay && typeof overlay === "object" && overlay.occupation_intro) {
    return overlay;
  }
  const s3 = all?.section_03;
  if (!s3 || typeof s3 !== "object") return null;
  const steps = Array.isArray(s3.steps) ? s3.steps.filter((row) => row && typeof row === "object") : [];
  const prose = steps
    .map((step, i) => ({
      key: step.key || `p${i + 1}`,
      title: clean(step.title),
      body: stepBody(step),
    }))
    .filter((row) => row.title && row.body);
  const introBody =
    typeof s3.occupation_intro === "string"
      ? clean(s3.occupation_intro)
      : clean(s3.occupation_intro?.body);
  if (!introBody || !prose.length) return null;
  return {
    occupation: clean(occupationTitle),
    anchor_situation: clean(s3.anchor_situation),
    semantic_role: "WORKFLOW",
    occupation_intro: { title: "", body: introBody },
    flow_labels: prose.map((row) => row.title),
    prose_items: prose,
    source_artifact: "all_soc_narrative_v1",
  };
}

export function section04PresentationFromNarrative(all) {
  const overlay = all?.section_04_presentation;
  if (overlay && typeof overlay === "object" && (overlay.summary || overlay.takeaways)) {
    return overlay;
  }
  const s4 = all?.section_04;
  if (!s4 || typeof s4 !== "object") return null;
  const summary = clean(s4.intro || s4.summary);
  const takeaways = (Array.isArray(s4.competencies) ? s4.competencies : [])
    .map((row, i) => ({
      id: row?.id || `CC-${i + 1}`,
      title: clean(row?.title),
      description: clean([row?.why_needed, row?.how_used, row?.description, row?.body].filter(Boolean).join(" ")),
      body: clean(row?.body),
    }))
    .filter((row) => row.title && (row.description || row.body));
  if (!summary || !takeaways.length) return null;
  return { summary, takeaways };
}

/** JS mirror of backend attach_all_soc_narrative (ko only). Does not mutate Golden bodies. */
export function attachAllSocNarrativeToReport(report, row, { goldenSoc = "" } = {}) {
  if (!report || !row) return report;
  const soc = String(report?.profile?.soc_code || row.soc_code || "").trim();
  const pres = row.presentation && typeof row.presentation === "object" ? row.presentation : {};
  report.all_soc_narrative = {
    contract: row.contract,
    status: row.status,
    review_status: row.review_status,
    golden: Boolean(row.golden),
    section_01: row.section_01,
    section_02: row.section_02,
    section_03: row.section_03,
    section_04: row.section_04,
    section_03_presentation: pres.section_03_presentation,
    section_04_presentation: pres.section_04_presentation,
  };
  report.narrative_story_flow = true;
  if (soc === goldenSoc) return report;
  if (clean(pres.hero_thesis)) {
    report.hero_thesis = pres.hero_thesis;
    report.hero_explanation = pres.hero_explanation || report.hero_explanation;
  }
  if (Array.isArray(pres.value_decline_tasks) && pres.value_decline_tasks.length) {
    report.value_decline_tasks = [...pres.value_decline_tasks];
  }
  if (Array.isArray(pres.value_rise_tasks) && pres.value_rise_tasks.length) {
    report.value_rise_tasks = [...pres.value_rise_tasks];
  }
  if (pres.section_2_value_shift && typeof pres.section_2_value_shift === "object") {
    const ui =
      report.ui_structured_json && typeof report.ui_structured_json === "object"
        ? report.ui_structured_json
        : {};
    ui.section_2_value_shift = pres.section_2_value_shift;
    report.ui_structured_json = ui;
  }
  return report;
}
