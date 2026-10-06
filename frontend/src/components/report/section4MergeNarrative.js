/**
 * 리포트 실제 업무 카드 + DB/LLM narrative task_cards 병합.
 * 제목·메트릭은 리포트 기준. `onet_task_id`(또는 `task_id`)가 있으면 우선 매칭, 없으면 제목·역할 폴백.
 * (리포트 high→automation vs DB human 등 역할 불일치 시에도 DB 불릿을 쓰도록 제목 폴백 매칭)
 */

import { skillOnlyCapabilities } from "./section4CardScanFields.js";
import { inferTaskStakesChannel } from "./section4TaskStakes.js";

/**
 * @param {unknown} fg
 * @param {"human"|"collab"|"automation"} newRole
 */
function mergeFilterGroupWithRole(fg, newRole) {
  const kinds = new Set(["human", "collab", "automation"]);
  const arr = Array.isArray(fg) ? fg.map((x) => String(x || "").trim()).filter(Boolean) : [];
  const rest = arr.filter((x) => !kinds.has(x));
  const out = new Set(rest.length ? rest : ["important"]);
  out.add("important");
  out.add(newRole);
  return [...out];
}

/** @param {{ id?: string }} card */
function extractReportTaskId(card) {
  const id = String(card?.id || "");
  const m = id.match(/^task-(.+)$/);
  return m ? m[1] : "";
}

/**
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard[]} narrativeCards
 * @param {string} reportTaskId
 */
function findNarrativeByTaskId(narrativeCards, reportTaskId, roleType) {
  const rid = String(reportTaskId || "").trim();
  if (!rid || !Array.isArray(narrativeCards) || !narrativeCards.length) return null;
  for (const c of narrativeCards) {
    if (!c) continue;
    const ntid = c.onet_task_id ?? c.task_id;
    if (ntid != null && String(ntid).trim() === rid) {
      if (roleType && c.ai_role_type !== roleType) continue;
      return c;
    }
  }
  return null;
}

/**
 * @param {unknown[]} interpretedCards
 * @param {string} reportTaskId
 * @param {string} reportTitle
 */
function findInterpretedCard(interpretedCards, reportTaskId, reportTitle) {
  const list = Array.isArray(interpretedCards) ? interpretedCards : [];
  const rid = String(reportTaskId || "").trim();
  if (rid) {
    for (const row of list) {
      if (!row || typeof row !== "object") continue;
      const otid = row.onet_task_id ?? row.task_id;
      if (otid != null && String(otid).trim() === rid) return row;
    }
  }
  const n = normTitle(reportTitle);
  if (!n) return null;
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    if (normTitle(row.title) === n) return row;
  }
  return null;
}

/** @param {Record<string, unknown> | null | undefined} interpreted @param {"human"|"collab"|"automation"} roleType */
function bulletsFromInterpreted(interpreted, roleType) {
  if (!interpreted || typeof interpreted !== "object") return null;
  const coreKey =
    roleType === "human"
      ? "human_judgment_core"
      : "automation_reason_core";
  const secondaryKey =
    roleType === "human" ? "future_shift_core" : "human_judgment_core";
  const splitSentences = (text) =>
    String(text || "")
      .split(/(?<=[.!?。])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
  const primary = splitSentences(interpreted[coreKey]).slice(0, 3);
  const secondary = splitSentences(interpreted[secondaryKey]).slice(0, 3);
  if (primary.length < 2) return null;
  while (primary.length < 3) {
    const extra = String(interpreted.task_object || interpreted.distinctive_angle || "").trim();
    if (!extra || primary.includes(extra)) break;
    primary.push(extra);
  }
  while (secondary.length < 2) {
    const extra = String(interpreted.future_shift_core || "").trim();
    const parts = splitSentences(extra);
    if (!parts.length) break;
    secondary.push(parts[secondary.length] || parts[0]);
  }
  if (secondary.length < 2) return null;
  if (roleType === "automation") {
    const linked = primary.filter(
      (p) => /AI|자동화|생성|도구|패턴|재조합|워크플로|코드/i.test(p),
    );
    if (linked.length < 2) return null;
  }
  return { bullets_primary: primary.slice(0, 3), bullets_secondary: secondary.slice(0, 3) };
}

const STUB_MARKERS = [
  "반복·형식이 맞춰진 단계",
  "같은 입력·출력 패턴이 반복되면",
  "산출물 단위가 끊기면",
  "자동화 뒤에는 품질·예외·책임 범위",
];

/** @param {import("./section4TaskAiRole.types.js").Section4TaskCard | null | undefined} card */
function bulletsLookLikeStub(card) {
  const bp = card?.bullets_primary;
  if (!Array.isArray(bp) || bp.length < 2) return false;
  const blob = bp.join(" ");
  return STUB_MARKERS.filter((m) => blob.includes(m)).length >= 2;
}

/** @param {string} s */
function normTitle(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[·•.,;:!?()[\]{}「」『』"']/g, "");
}

/**
 * @param {string} reportTitle
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard[]} narrativeCards
 * @param {"human"|"collab"|"automation"} [roleType] 리포트 카드와 같은 유형만 매칭
 */
function findNarrativeCard(reportTitle, narrativeCards, roleType) {
  const n = normTitle(reportTitle);
  if (!n || !narrativeCards.length) return null;
  const pool = roleType
    ? narrativeCards.filter((c) => c && c.ai_role_type === roleType)
    : narrativeCards;
  if (!pool.length) return null;
  let best = null;
  let bestScore = 0;
  for (const c of pool) {
    const t = normTitle(c.title);
    if (!t) continue;
    if (t === n) return c;
    if (n.includes(t) || t.includes(n)) return c;
    const nw = new Set(n.split(/\s+/).filter((x) => x.length > 1));
    const tw = t.split(/\s+/).filter((x) => x.length > 1);
    let overlap = 0;
    for (const w of tw) {
      if (nw.has(w)) overlap += 1;
    }
    const score = tw.length ? overlap / tw.length : 0;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return bestScore >= 0.35 ? best : null;
}

/**
 * @param {string} text
 * @param {"human"|"collab"|"automation"} roleType
 * @param {"ko"|"en"} lang
 * @param {number} cardIndex
 */
export function buildRoleScanBullets(text, roleType, lang, cardIndex) {
  const ch = inferTaskStakesChannel(text);
  const rot = Number(cardIndex) || 0;
  const isKo = lang !== "en";

  if (roleType === "human") {
    const primaryKo = {
      staffing: ["갑작스러운 결원·교대는 현장에서 맞춰야 합니다", "팀·숙련도 차이는 표만으로 정리되지 않습니다", "누구에게 먼저 연락할지 순서가 중요합니다"],
      media_comms: ["대외 문장 하나가 반응을 바꿉니다", "공개 시점과 표현 수위를 함께 봐야 합니다", "민감 표현은 사람이 걸러야 합니다"],
      policy_org: ["부서·안건 이해가 서로 다릅니다", "예외·충돌은 문서만으로 끝나지 않습니다", "장기 영향은 합의가 필요합니다"],
      default: ["여러 사람·부서 이해가 동시에 걸립니다", "상황이 바뀌면 우선순위를 다시 잡아야 합니다", "신뢰·관계가 결과에 큰 영향을 줍니다"],
    };
    const secondaryKo = {
      staffing: ["현장 우선순위 판단", "부서 간 조율", "긴급 상황 대응"],
      media_comms: ["대외 메시지 조정", "리스크·평판 감각", "이해관계자 설득"],
      policy_org: ["합의·조정", "예외 처리", "조직 내 설명"],
      default: ["설득·협상", "우선순위 판단", "변화 대응"],
    };
    const pk = primaryKo[ch] || primaryKo.default;
    const sk = secondaryKo[ch] || secondaryKo.default;
    const bullets_primary = [pk[rot % pk.length], pk[(rot + 1) % pk.length], pk[(rot + 2) % pk.length]];
    const bullets_secondary = [sk[rot % sk.length], sk[(rot + 1) % sk.length], sk[(rot + 2) % sk.length]];
    if (!isKo) {
      return {
        bullets_primary: bullets_primary.map(() => "Judgment and relationships stay central for this work."),
        bullets_secondary: bullets_secondary.map(() => "Coordination and prioritization gain weight."),
      };
    }
    return { bullets_primary, bullets_secondary };
  }

  if (roleType === "collab") {
    const primaryKo = {
      staffing: ["근무표·시간대 후보를 빠르게 비교", "결원·과부하 구간을 먼저 표시", "반복 표·승인 단계를 정리"],
      media_comms: ["보도자료·문장 초안을 여러 버전으로 비교", "근거·수치 출처를 표로 모음", "누락·민감 표현을 먼저 짚음"],
      operations_data: ["데이터·지표를 표로 정리", "이상치·변화 구간을 표시", "보고서 초안 구조를 잡음"],
      default: ["반복 자료를 빠르게 정리", "초안·후보안을 나란히 비교", "빠진 항목을 먼저 표시"],
    };
    const secondaryKo = {
      default: ["최종 내용 검토", "예외·특이 상황 대응", "운영·대외 영향 판단"],
    };
    const pk = primaryKo[ch] || primaryKo.default;
    const sk = secondaryKo.default;
    const bullets_primary = [pk[rot % pk.length], pk[(rot + 1) % pk.length], pk[(rot + 2) % pk.length]];
    const bullets_secondary = [sk[rot % sk.length], sk[(rot + 1) % sk.length], sk[(rot + 2) % sk.length]];
    return { bullets_primary, bullets_secondary };
  }

  const primaryKo = {
    staffing: [
      "근무표·교대표는 같은 양식으로 자주 맞추는 구간이 많음",
      "결원·과부하 구간은 규칙과 숫자로 먼저 비교하기 쉬움",
      "승인·통보 단계는 체크리스트로 묶어 자동 알림이 가능함",
    ],
    operations_data: [
      "같은 항목의 수치·기간을 표로 맞추는 구간이 많음",
      "전월·전년 대비 증감은 수식·피벗으로 자동 집계하기 쉬움",
      "누락·이상치 탐지는 규칙·임계값으로 먼저 걸러낼 수 있음",
    ],
    software_dev: [
      "로그인·게시판·CRUD 기능은 기존 패턴 재사용 비중이 큼",
      "프론트엔드 보일러플레이트 생성이 AI 코드 도구와 잘 맞음",
      "API 연결 코드 상당수가 정형화되어 있음",
    ],
    backup_ops: [
      "백업 실행 자체는 이벤트·스케줄 기반 자동화가 쉬움",
      "Git·클라우드 동기화 도구가 이미 자동 백업 구조를 제공함",
      "파일 변경 감지와 버전 관리가 시스템적으로 가능함",
    ],
    default: [
      "입력·출력 형식이 정해진 단계가 업무의 상당 부분을 차지함",
      "같은 순서의 절차를 도구·매크로로 묶기 쉬운 구간이 있음",
      "비교·대조가 숫자·목록 단위로 끊기는 작업이 많음",
    ],
  };
  const secondaryKo = {
    software_dev: [
      "직접 구현보다 AI가 만든 코드 검증·통합 비중 증가",
      "서비스 구조·보안·성능 설계 중요성 확대",
      "요구사항을 구조화해 AI에게 전달하는 능력 중요해짐",
    ],
    backup_ops: [
      "단순 저장보다 복구 속도와 복구 범위 관리가 중요해짐",
      "로컬 백업보다 클라우드·분산 백업 중심으로 이동 가능성 큼",
      "백업 자체보다 랜섬웨어·보안 대응 역할 비중 증가",
    ],
    default: [
      "도구가 맡은 단계 뒤 품질·예외·책임 범위를 정하는 일이 늘어남",
      "같은 업무에서 설계·범위 정하기 비중이 커질 수 있음",
      "자동 결과를 그대로 쓰기보다 맥락에 맞는지 확인하는 일이 늘어남",
    ],
  };
  const pk = primaryKo[ch] || primaryKo.default;
  const sk = secondaryKo[ch] || secondaryKo.default;
  const bullets_primary = [pk[rot % pk.length], pk[(rot + 1) % pk.length], pk[(rot + 2) % pk.length]];
  const bullets_secondary = [sk[rot % sk.length], sk[(rot + 1) % sk.length], sk[(rot + 2) % sk.length]];
  return { bullets_primary, bullets_secondary };
}

/** @param {string[]} bullets */
function joinBullets(bullets) {
  return (bullets || []).map((b) => String(b || "").trim()).filter(Boolean).join("\n");
}

/**
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard[]} reportCards
 * @param {import("./section4TaskAiRole.types.js").Section4TaskCard[] | null | undefined} narrativeCards
 * @param {"ko"|"en"} lang
 * @param {{ interpretedTaskCards?: unknown[] }} [opts]
 */
export function mergeSection4ReportCardsWithNarrative(reportCards, narrativeCards, lang, opts = {}) {
  const narrative = Array.isArray(narrativeCards) ? narrativeCards : [];
  const interpretedList = Array.isArray(opts.interpretedTaskCards) ? opts.interpretedTaskCards : [];
  return reportCards.map((card, idx) => {
    const reportRole = card.ai_role_type;
    const reportTaskId = extractReportTaskId(card);
    let match = findNarrativeByTaskId(narrative, reportTaskId, reportRole);

    if (!match) {
      match = findNarrativeCard(card.title, narrative, reportRole);
    }

    const matchUsable =
      match &&
      match.ai_role_type === reportRole &&
      Array.isArray(match.bullets_primary) &&
      match.bullets_primary.length >= 2 &&
      !bulletsLookLikeStub(match);

    let bullets_primary = matchUsable ? [...match.bullets_primary] : undefined;
    let bullets_secondary =
      matchUsable && Array.isArray(match.bullets_secondary) && match.bullets_secondary.length >= 2
        ? [...match.bullets_secondary]
        : undefined;

    let usedDbBullets = Array.isArray(bullets_primary) && bullets_primary.length >= 2;

    if (!usedDbBullets) {
      const interpRow = findInterpretedCard(interpretedList, reportTaskId, card.title);
      const interp =
        interpRow && typeof interpRow.interpreted === "object" ? interpRow.interpreted : interpRow;
      const fromInterp = bulletsFromInterpreted(interp, reportRole);
      if (fromInterp) {
        bullets_primary = fromInterp.bullets_primary;
        bullets_secondary = fromInterp.bullets_secondary;
      } else {
        const built = buildRoleScanBullets(card.title, reportRole, lang, idx);
        bullets_primary = built.bullets_primary;
        bullets_secondary = built.bullets_secondary;
      }
      usedDbBullets = false;
    } else if (!Array.isArray(bullets_secondary) || bullets_secondary.length < 2) {
      const built = buildRoleScanBullets(card.title, reportRole, lang, idx);
      bullets_secondary = built.bullets_secondary;
    }

    const rawCaps =
      match && Array.isArray(match.capabilities) && match.capabilities.length
        ? match.capabilities.slice(0, 4)
        : card.capabilities;
    const caps = skillOnlyCapabilities(rawCaps, bullets_primary, bullets_secondary);

    /** 탭·필터는 리포트(데이터) 기준 유형 고정. DB 내러티브는 불릿·역량만 흡수. */
    const ai_role_type = reportRole;
    const filter_group = mergeFilterGroupWithRole(
      Array.isArray(card.filter_group) && card.filter_group.length ? card.filter_group : ["important"],
      reportRole,
    );

    return {
      ...card,
      ai_role_type,
      filter_group,
      capabilities: caps,
      bullets_primary,
      bullets_secondary,
      ai_helps: joinBullets(bullets_primary) || card.ai_helps,
      human_owns: joinBullets(bullets_secondary) || card.human_owns,
    };
  });
}
