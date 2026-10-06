import { useCallback, useMemo, useRef, useState } from "react";
import {
  clampTooltipPosition,
  findNearestScatterPoint,
  shouldNavigateOnPointClick,
} from "./positionMapInteraction.js";
import {
  computePositionMapDomain,
  isScoreInDomain,
  scoresToPlotPct,
} from "./positionMapDomain.js";
import { buildQuadDensityCells, pctToSvgX, pctToSvgY } from "./positionMapScatter.js";
import {
  hasTaskRoleShareArtifact,
  readTaskRoleSharePercents,
} from "./positionMapTaskRoleShares.js";
import "./position-map-refresh.css";

const SVG_W = 1000;
const SVG_H = 320;
const HIT_RADIUS = 7;
const NEAREST_MAX_DIST = 14;

function AiScoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </svg>
  );
}

function HumanScoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3.8 18c.6-3.2 2.5-5 5.2-5s4.6 1.8 5.2 5M13.5 14c2.8-.5 5.5 1 6.4 4" />
    </svg>
  );
}

function clientToSvg(svgEl, clientX, clientY) {
  if (!svgEl) return null;
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return null;
  const svgP = pt.matrixTransform(ctm.inverse());
  return { x: svgP.x, y: svgP.y };
}

function PositionMapTooltip({ point, lang, style, shareMode = false }) {
  const ko = lang !== "en";
  if (!point) return null;
  const hasXY = point.aeiScore != null && point.acsScore != null;
  return (
    <div className="pmr-tooltip" role="tooltip" style={style}>
      <div className="pmr-tooltip__title">{point.title}</div>
      {point.soc ? <div className="pmr-tooltip__soc">{point.soc}</div> : null}
      {hasXY ? (
        <div className="pmr-tooltip__scores">
          {shareMode ? (
            <>
              <div>
                {ko
                  ? `AI가 크게 도울 수 있는 업무 비중 ${point.aeiScore}%`
                  : `Share of work AI can help a lot with ${point.aeiScore}%`}
              </div>
              <div>
                {ko
                  ? `사람 판단이 중요한 업무 비중 ${point.acsScore}%`
                  : `Judgment-critical work share ${point.acsScore}%`}
              </div>
            </>
          ) : (
            <>
              {ko ? `AI 영향도 ${point.aeiScore}` : `AI impact ${point.aeiScore}`}
              {" · "}
              {ko ? `사람 판단 중요도 ${point.acsScore}` : `Human judgment ${point.acsScore}`}
            </>
          )}
        </div>
      ) : null}
      {point.isCurrent ? (
        <div className="pmr-tooltip__current">{ko ? "현재 보고 있는 직무" : "Currently viewing"}</div>
      ) : null}
    </div>
  );
}

/**
 * @param {{
 *   lang: string;
 *   profile: object;
 *   report: object;
 *   scatterPoints: Array<{ left: number; top: number; soc?: string; displayName?: string; aeiScore?: number; acsScore?: number }>;
 *   densityCells?: Array<{ x: number; y: number; w: number; h: number; t: number }>; // unused — density rebuilt on zoom domain
 *   onScatterDotActivate?: (soc: string) => void;
 *   viewerMode?: boolean;
 *   v2Review?: object | null;
 *   taskAnalysis?: object | null;
 * }} props
 */
export default function PositionMapRefresh({
  lang,
  profile,
  report,
  scatterPoints,
  densityCells: _densityCellsIgnored,
  onScatterDotActivate,
  viewerMode = false,
  v2Review = null,
  taskAnalysis = null,
  shareShell = true,
}) {
  const ko = lang !== "en";
  const shellRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const v2Mode = Boolean(v2Review?.profile?.position_map_v2);
  const taskRoleFinal =
    Boolean(profile?.task_role_v1_final) ||
    profile?.score_construct?.legacy_aei_acs === false;
  /** Final HIGH-share semantics on existing chart (normal URL or v2 review). */
  const shareMode = v2Mode || taskRoleFinal || Boolean(shareShell);
  const medianSuppressed =
    taskRoleFinal ||
    Boolean(shareShell) ||
    profile?.legacy_median_suppressed === true ||
    profile?.cohort_median_available === false;
  const v2Profile = v2Review?.profile || null;
  const v2X = v2Mode ? Number(v2Profile.position_map_v2.x_value) * 100 : null;
  const v2Y = v2Mode ? Number(v2Profile.position_map_v2.y_value) * 100 : null;
  const v2MedX =
    v2Mode && v2Review?.cohort_median?.ai_augmentation_high_share_median != null
      ? Number(v2Review.cohort_median.ai_augmentation_high_share_median) * 100
      : null;
  const v2MedY =
    v2Mode && v2Review?.cohort_median?.human_judgment_high_share_median != null
      ? Number(v2Review.cohort_median.human_judgment_high_share_median) * 100
      : null;

  const aeiVal = Math.min(1, Math.max(0, Number(profile?.aei_job ?? profile?.AEI_job ?? 0) || 0));
  const acsVal = Math.min(1, Math.max(0, Number(profile?.acs_job ?? profile?.ACS_job ?? 0) || 0));
  // Task Analysis V2 Position Map: X/Y = H_share_resolved; AUTOMATION supporting dim removed.
  const taskRoleShares = v2Mode ? null : readTaskRoleSharePercents(profile, taskAnalysis);
  const taskRoleSharesAvailable = v2Mode || hasTaskRoleShareArtifact(profile, taskAnalysis);
  // Neutral midpoint when 894 final median unavailable — do not claim legacy 44/40.
  const tauAei = medianSuppressed
    ? 0.5
    : Math.min(1, Math.max(0, Number(profile?.tau_aei ?? 0.5) || 0.5));
  const tauAcs = medianSuppressed
    ? 0.5
    : Math.min(1, Math.max(0, Number(profile?.tau_acs ?? 0.5) || 0.5));
  const tauAeiPct = v2Mode ? Math.round(v2MedX ?? 0) : Math.round(tauAei * 100);
  const tauAcsPct = v2Mode ? Math.round(v2MedY ?? 0) : Math.round(tauAcs * 100);
  const aeiScore = v2Mode
    ? Math.round(v2X ?? 0)
    : shareMode
      ? taskRoleShares?.ai ?? null
      : Math.round(aeiVal * 100);
  const acsScore = v2Mode
    ? Math.round(v2Y ?? 0)
    : shareMode
      ? taskRoleShares?.human ?? null
      : Math.round(acsVal * 100);
  const currentSoc = String(profile?.soc_code || profile?.SOC_CODE || "").trim();
  const currentTitle =
    String(profile?.occupation_title || profile?.occupation_title_ko || titleFromReport(report) || "").trim() ||
    (ko ? "직무명 없음" : "No occupation title");

  const v2ScatterPoints = useMemo(() => {
    if (!v2Mode) return null;
    const pts = [];
    for (const row of v2Review?.cohort_points || []) {
      const soc = String(row.soc_code || "").trim();
      if (soc && currentSoc && soc.toLowerCase() === currentSoc.toLowerCase()) continue;
      const x = Number(row.x_pct);
      const y = Number(row.y_pct);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push({
        left: x,
        top: 100 - y,
        soc,
        displayName: (ko ? row.occupation_title_ko : row.occupation_title) || row.occupation_title || soc,
        aeiScore: Math.round(x),
        acsScore: Math.round(y),
      });
    }
    return pts;
  }, [v2Mode, v2Review, currentSoc, ko]);

  const effectiveScatter = v2Mode
    ? v2ScatterPoints || []
    : taskRoleFinal || shareShell
      ? []
      : scatterPoints;
  // Share axes: fixed 0%–100%. Legacy AEI keeps distribution zoom.
  const domain = useMemo(
    () =>
      shareMode
        ? { xMin: 0, xMax: 100, yMin: 0, yMax: 100 }
        : computePositionMapDomain(effectiveScatter, {
            aeiScore,
            acsScore,
          }),
    [shareMode, effectiveScatter, aeiScore, acsScore],
  );

  const currentPlot = useMemo(() => {
    if (aeiScore == null || acsScore == null) return null;
    if (!Number.isFinite(Number(aeiScore)) || !Number.isFinite(Number(acsScore))) return null;
    return scoresToPlotPct(aeiScore, acsScore, domain);
  }, [aeiScore, acsScore, domain]);
  const medianPlot = useMemo(() => scoresToPlotPct(tauAeiPct, tauAcsPct, domain), [tauAeiPct, tauAcsPct, domain]);
  const splitVPct = medianPlot.left;
  const splitHPct = medianPlot.top;
  const currentX = currentPlot ? pctToSvgX(currentPlot.left) : null;
  const currentY = currentPlot ? pctToSvgY(currentPlot.top) : null;

  const zoomedCloudPts = useMemo(() => {
    const out = [];
    for (const pt of effectiveScatter || []) {
      const a = Number(pt.aeiScore);
      const c = Number(pt.acsScore);
      if (!Number.isFinite(a) || !Number.isFinite(c)) continue;
      if (!isScoreInDomain(a, c, domain)) continue;
      const mapped = scoresToPlotPct(a, c, domain);
      out.push({
        ...pt,
        left: mapped.left,
        top: mapped.top,
        aeiScore: a,
        acsScore: c,
      });
    }
    return out;
  }, [effectiveScatter, domain]);

  const densityCells = useMemo(
    () => (shareMode ? [] : buildQuadDensityCells(zoomedCloudPts, 56)),
    [zoomedCloudPts, shareMode],
  );

  const quadLabels = shareMode
    ? {
        tl: {
          main: ko ? "AI 도움 낮음 · 사람 판단 높음" : "Lower AI help · Higher human judgment",
          hint: ko
            ? "사람의 전문 판단이 특히 중요한 업무"
            : "Work where expert human judgment matters most",
        },
        tr: {
          main: ko ? "AI 도움 높음 · 사람 판단 높음" : "Higher AI help · Higher human judgment",
          hint: ko
            ? "AI와 사람의 판단이 함께 중요한 업무"
            : "Work where AI help and human judgment both matter",
        },
        bl: {
          main: ko ? "AI 도움 낮음 · 사람 판단 낮음" : "Lower AI help · Lower human judgment",
          hint: ko
            ? "AI 도움과 사람 판단 의존도가 모두 낮은 업무"
            : "Work with low dependence on both AI help and human judgment",
        },
        br: {
          main: ko ? "AI 도움 높음 · 사람 판단 낮음" : "Higher AI help · Lower human judgment",
          hint: ko
            ? "AI의 도움을 크게 받을 수 있는 업무"
            : "Work that can get substantial AI help",
        },
      }
    : {
        tl: { main: ko ? "사람 중심 직무" : "Human-centric role", hint: null },
        tr: { main: ko ? "AI 협업형 직무" : "AI collaboration role", hint: null },
        bl: { main: ko ? "AI 영향 낮은 직무" : "Lower AI-impact role", hint: null },
        br: { main: ko ? "AI 보강 여지 큰 직무" : "High AI-augmentation potential", hint: null },
      };

  const aiCopy = shareMode
    ? ko
      ? "전체 업무 중 AI의 도움을 크게 받을 수 있는 업무의 비중입니다."
      : "Share of all tasks where AI can provide substantial help."
    : ko
      ? "AI가 해당 직무를 대신하거나 업무 방식에 영향을 미칠 가능성의 정도입니다."
      : "How likely AI is to take on work or change how this role is performed.";
  const humanCopy = shareMode
    ? ko
      ? "경험, 맥락 해석, 예외 판단, 최종 의사결정 등 사람의 전문성과 판단이 특히 중요한 업무의 비율"
      : "Share of work where human expertise and judgment matter most—experience, context, exceptions, and final decisions"
    : ko
      ? "해당 직무에서 사람의 경험과 판단이 얼마나 중요한지 나타냅니다."
      : "How much this role depends on human experience and judgment.";
  const titleAi = shareMode
    ? ko
      ? "AI가 크게 도울 수 있는 업무"
      : "Work AI can help a lot with"
    : ko
      ? "AI 영향도"
      : "AI impact";
  const titleHuman = shareMode
    ? ko
      ? "사람 판단이 중요한 업무"
      : "Judgment-critical work"
    : ko
      ? "사람 판단 중요도"
      : "Human judgment importance";

  const shareTaskMeta = useMemo(() => {
    if (!shareMode || !hasTaskRoleShareArtifact(profile, taskAnalysis)) return null;
    const totalFromSummary =
      typeof taskAnalysis?.summary?.total_tasks === "number" &&
      Number.isFinite(taskAnalysis.summary.total_tasks)
        ? taskAnalysis.summary.total_tasks
        : null;
    const totalFromTasks = Array.isArray(taskAnalysis?.tasks) ? taskAnalysis.tasks.length : 0;
    const total =
      (totalFromSummary != null && totalFromSummary > 0 ? totalFromSummary : null) ??
      (totalFromTasks > 0 ? totalFromTasks : 0);
    if (!total) return null;
    const aiH = Number(taskAnalysis?.v2_axes?.ai_augmentation?.counts?.H) || 0;
    const humanH = Number(taskAnalysis?.v2_axes?.human_judgment?.counts?.H) || 0;
    return {
      total,
      ai: aiH,
      human: humanH,
    };
  }, [shareMode, taskAnalysis, profile]);

  // H_share_resolved % ≠ H task count / total. Show count as separate reference only.
  const formatShareCount = (highCount) => {
    if (!shareTaskMeta) return null;
    return ko ? `H 판정 업무 ${highCount}개` : `${highCount} H-rated tasks`;
  };

  const occupationPoints = useMemo(() => {
    return zoomedCloudPts.map((pt, i) => {
      const cx = pctToSvgX(pt.left);
      const cy = pctToSvgY(pt.top);
      const dense = Math.max(
        0,
        1 - (Math.abs(pt.left - splitVPct) / 360 + Math.abs(pt.top - splitHPct) / 115),
      );
      return {
        key: `occ-${pt.soc || i}-${pt.aeiScore}-${pt.acsScore}`,
        cx,
        cy,
        r: dense > 0.6 ? 2.0 : 1.45,
        fill: dense > 0.65 ? "#6fd6ff" : "#79a7ff",
        opacity: dense > 0.6 ? 0.36 : 0.5,
        soc: pt.soc,
        title: pt.displayName || (ko ? "직무명 없음" : "No occupation title"),
        aeiScore: pt.aeiScore,
        acsScore: pt.acsScore,
        isCurrent: false,
      };
    });
  }, [zoomedCloudPts, splitVPct, splitHPct, ko]);

  const currentPoint = useMemo(() => {
    if (currentX == null || currentY == null) return null;
    if (!Number.isFinite(currentX) || !Number.isFinite(currentY)) return null;
    return {
      key: "current-occupation",
      cx: currentX,
      cy: currentY,
      soc: currentSoc,
      title: currentTitle,
      aeiScore,
      acsScore,
      isCurrent: true,
    };
  }, [currentX, currentY, currentSoc, currentTitle, aeiScore, acsScore]);

  const interactivePoints = useMemo(
    () => (currentPoint ? [...occupationPoints, currentPoint] : occupationPoints),
    [occupationPoints, currentPoint],
  );

  const hoveredPoint = useMemo(() => {
    if (!hoveredKey) return null;
    return interactivePoints.find((p) => p.key === hoveredKey) || null;
  }, [hoveredKey, interactivePoints]);

  const updateTooltipForPoint = useCallback((point, clientX, clientY) => {
    const shell = shellRef.current;
    if (!shell || !point) return;
    const shellRect = shell.getBoundingClientRect();
    const tipRect = tooltipRef.current?.getBoundingClientRect();
    const pos = clampTooltipPosition(clientX, clientY, shellRect, {
      width: tipRect?.width || 200,
      height: tipRect?.height || 80,
    });
    setTooltipPos(pos);
    setHoveredKey(point.key);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredKey(null);
    setTooltipPos(null);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      const svg = svgRef.current;
      const svgPt = clientToSvg(svg, e.clientX, e.clientY);
      if (!svgPt) return;

      const targetKey = e.target?.getAttribute?.("data-pmr-key");
      if (targetKey) {
        const direct = interactivePoints.find((p) => p.key === targetKey);
        if (direct) {
          updateTooltipForPoint(direct, e.clientX, e.clientY);
          return;
        }
      }

      const nearest = findNearestScatterPoint(svgPt.x, svgPt.y, interactivePoints, {
        maxDistance: NEAREST_MAX_DIST,
      });
      if (nearest) {
        updateTooltipForPoint(nearest, e.clientX, e.clientY);
      } else {
        clearHover();
      }
    },
    [interactivePoints, updateTooltipForPoint, clearHover],
  );

  const handlePointClick = useCallback(
    (point) => {
      if (!shouldNavigateOnPointClick(point, currentSoc, viewerMode)) return;
      if (onScatterDotActivate) onScatterDotActivate(point.soc);
    },
    [currentSoc, viewerMode, onScatterDotActivate],
  );

  const handleKeyDown = useCallback(
    (e, point) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePointClick(point);
      }
    },
    [handlePointClick],
  );

  const chartAria = ko
    ? "전체 직무 분포와 현재 직무의 위치를 보여주는 산점도"
    : "Scatter plot of all occupations and this role’s position";

  const medianAiLabel = v2Mode
    ? ko
      ? `AI 도움 · 7개 검증 직무 중앙값 · 임시 ${tauAeiPct}%`
      : `AI help · 7-SOC median · provisional ${tauAeiPct}%`
    : ko
      ? `AI 영향도 · 전체 직무 중앙값 ${tauAeiPct}점`
      : `AI impact · all-occupation median ${tauAeiPct}`;
  const medianHumanLabel = v2Mode
    ? ko
      ? `사람 판단 · 7개 검증 직무 중앙값 · 임시 ${tauAcsPct}%`
      : `Human judgment · 7-SOC median · provisional ${tauAcsPct}%`
    : ko
      ? `사람 판단 · 전체 직무 중앙값 ${tauAcsPct}점`
      : `Human judgment · all-occupation median ${tauAcsPct}`;
  const showMedianPills = v2Mode ? v2MedX != null && v2MedY != null : !medianSuppressed;

  return (
    <div
      className="pmr-root"
      data-position-map="refresh"
      data-position-map-shell="share"
      data-task-role-shares={taskRoleSharesAvailable ? "present" : "absent"}
    >
      <div className="position-layout">
        <div className="chart-shell">
          <div className="chart-card">
            <div
              ref={shellRef}
              className="position-map-chart"
            style={{
              "--pmr-split-v": `${splitVPct}%`,
              "--pmr-split-h": `${splitHPct}%`,
            }}
            onMouseLeave={clearHover}
          >
            <div className="plot-area">
              <div className="divider v" aria-hidden="true" />
              <div className="divider h" aria-hidden="true" />

              <span className="quadrant q1">
                <span className="quadrant__main">{quadLabels.tl.main}</span>
                {quadLabels.tl.hint ? <span className="quadrant__hint">{quadLabels.tl.hint}</span> : null}
              </span>
              <span className="quadrant q2">
                <span className="quadrant__main">{quadLabels.tr.main}</span>
                {quadLabels.tr.hint ? <span className="quadrant__hint">{quadLabels.tr.hint}</span> : null}
              </span>
              <span className="quadrant q3">
                <span className="quadrant__main">{quadLabels.bl.main}</span>
                {quadLabels.bl.hint ? <span className="quadrant__hint">{quadLabels.bl.hint}</span> : null}
              </span>
              <span className="quadrant q4">
                <span className="quadrant__main">{quadLabels.br.main}</span>
                {quadLabels.br.hint ? <span className="quadrant__hint">{quadLabels.br.hint}</span> : null}
              </span>

              <svg
                ref={svgRef}
                id="scatter"
                className="pmr-scatter"
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                role="img"
                aria-label={chartAria}
                onMouseMove={handlePointerMove}
              >
                {densityCells?.length ? (
                  <g className="pmr-layer-decor" aria-hidden="true">
                    {densityCells.map((cell, i) => (
                      <rect
                        key={`den-${i}`}
                        x={(cell.x / 100) * SVG_W}
                        y={(cell.y / 100) * SVG_H}
                        width={(cell.w / 100) * SVG_W}
                        height={(cell.h / 100) * SVG_H}
                        fill="#86d5ff"
                        fillOpacity={0.042 + cell.t * 0.22}
                      />
                    ))}
                  </g>
                ) : null}

                <g className="pmr-layer-dots">
                  {occupationPoints.map((dot) => {
                    const isHovered = hoveredKey === dot.key;
                    return (
                      <g key={dot.key} className={`pmr-occ-point${isHovered ? " is-hovered" : ""}`}>
                        <circle
                          className="pmr-hit"
                          data-pmr-key={dot.key}
                          cx={dot.cx}
                          cy={dot.cy}
                          r={HIT_RADIUS}
                          fill="transparent"
                          tabIndex={-1}
                          aria-label={`${dot.title} ${dot.soc || ""}`}
                          style={{ cursor: viewerMode ? "default" : "pointer" }}
                          onFocus={(e) =>
                            updateTooltipForPoint(
                              dot,
                              e.currentTarget.getBoundingClientRect().left,
                              e.currentTarget.getBoundingClientRect().top,
                            )
                          }
                          onBlur={clearHover}
                          onKeyDown={(e) => handleKeyDown(e, dot)}
                          onClick={() => handlePointClick(dot)}
                        />
                        <circle
                          className="pmr-dot-visible"
                          cx={dot.cx}
                          cy={dot.cy}
                          r={isHovered ? dot.r + 0.9 : dot.r}
                          fill={dot.fill}
                          fillOpacity={isHovered ? Math.min(0.82, dot.opacity + 0.28) : dot.opacity}
                          stroke={isHovered ? "#2f6df6" : "none"}
                          strokeWidth={isHovered ? 0.8 : 0}
                          pointerEvents="none"
                        />
                      </g>
                    );
                  })}
                </g>

                {currentPoint ? (
                <g className={`pmr-current-point${hoveredKey === currentPoint.key ? " is-hovered" : ""}`}>
                  <circle
                    className="pmr-hit pmr-hit--current"
                    data-pmr-key={currentPoint.key}
                    cx={currentPoint.cx}
                    cy={currentPoint.cy}
                    r={HIT_RADIUS + 4}
                    fill="transparent"
                    tabIndex={-1}
                    aria-label={`${currentPoint.title} ${currentPoint.soc || ""}`}
                    style={{ cursor: "default" }}
                    onFocus={(e) =>
                      updateTooltipForPoint(
                        currentPoint,
                        e.currentTarget.getBoundingClientRect().left,
                        e.currentTarget.getBoundingClientRect().top,
                      )
                    }
                    onBlur={clearHover}
                  />
                  <circle
                    className="current-dot-halo"
                    cx={currentPoint.cx}
                    cy={currentPoint.cy}
                    r="14"
                    fill="#ffffff"
                    stroke="#2f6df6"
                    strokeWidth="2.5"
                    pointerEvents="none"
                  />
                  <circle
                    className="current-dot-core"
                    cx={currentPoint.cx}
                    cy={currentPoint.cy}
                    r="8"
                    fill="#2f6df6"
                    pointerEvents="none"
                  />
                </g>
                ) : null}
              </svg>

              {showMedianPills ? (
                <>
                  <div className="median-pill median-x">{medianAiLabel}</div>
                  <div className="median-pill median-y">{medianHumanLabel}</div>
                </>
              ) : null}

              <div className="axis-y-high">{ko ? "높음" : "High"}</div>
              <div className="axis-y-low">{ko ? "낮음" : "Low"}</div>
              <div className="axis-y">
                {shareMode
                  ? ko
                    ? "사람 판단이 중요한 업무 비중"
                    : "Judgment-critical work share"
                  : ko
                    ? "사람 판단 중요도"
                    : "Human judgment"}
              </div>
            </div>

            {hoveredPoint && tooltipPos ? (
              <div ref={tooltipRef} className="pmr-tooltip-wrap" style={{ left: tooltipPos.left, top: tooltipPos.top }}>
                <PositionMapTooltip
                  point={hoveredPoint}
                  lang={lang}
                  shareMode={shareMode}
                />
              </div>
            ) : null}

            <div className="x-axis-meta">
              <div className="x-axis-scale-row" aria-hidden="true">
                <span className="x-axis-scale-row__side x-axis-scale-row__side--start">
                  {shareMode ? (ko ? "0%" : "0%") : ko ? "어려움" : "Harder"}
                </span>
                <span className="x-axis-scale-row__center">
                  {shareMode
                    ? ko
                      ? "AI가 크게 도울 수 있는 업무 비중"
                      : "Share of work AI can help a lot with"
                    : ko
                      ? "AI가 대신하기 쉬운 정도"
                      : "Ease of AI taking on the work"}
                </span>
                <span className="x-axis-scale-row__side x-axis-scale-row__side--end">
                  {shareMode ? (ko ? "100%" : "100%") : ko ? "쉬움" : "Easier"}
                </span>
              </div>
              <div className="x-axis-legend-row legend" aria-label={ko ? "그래프 범례" : "Chart legend"}>
                <div className="legend-item">
                  <span className="legend-dot" aria-hidden="true" />
                  <span>{ko ? "이 직무의 위치" : "This role’s position"}</span>
                </div>
                {!taskRoleFinal && !shareShell ? (
                  <div className="legend-item">
                    <span className="legend-density" aria-hidden="true" />
                    <span>
                      {v2Mode
                        ? ko
                          ? "7개 검증 직무"
                          : "7 calibration occupations"
                        : ko
                          ? "전체 직무 분포 (밀도)"
                          : "All occupations (density)"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          </div>
        </div>

        <aside className="score-stack" aria-label={ko ? "직무 점수" : "Role scores"}>
          <article className="score-card blue-card">
            <div className="score-head">
              <div className="score-icon blue" aria-hidden="true">
                <AiScoreIcon />
              </div>
              <div className="score-title metric-title">{titleAi}</div>
            </div>
            <div className="score-metrics">
              <div className="score-number-row">
                <div className="score-number metric-number">{aeiScore != null ? aeiScore : "—"}</div>
                {aeiScore != null ? (
                  <div className="score-den metric-den">{shareMode ? "%" : "/100"}</div>
                ) : null}
                {shareMode && shareTaskMeta ? (
                  <div className="score-count-meta">{formatShareCount(shareTaskMeta.ai)}</div>
                ) : null}
              </div>
              <div className="score-progress" aria-hidden="true">
                <span style={{ width: `${aeiScore != null ? Math.min(100, Math.max(0, aeiScore)) : 0}%` }} />
              </div>
              <p className="score-copy metric-copy">{aiCopy}</p>
            </div>
          </article>

          <article className="score-card amber-card">
            <div className="score-head">
              <div className="score-icon amber" aria-hidden="true">
                <HumanScoreIcon />
              </div>
              <div className="score-title metric-title">{titleHuman}</div>
            </div>
            <div className="score-metrics">
              <div className="score-number-row">
                <div className="score-number metric-number">{acsScore != null ? acsScore : "—"}</div>
                {acsScore != null ? (
                  <div className="score-den metric-den">{shareMode ? "%" : "/100"}</div>
                ) : null}
                {shareMode && shareTaskMeta ? (
                  <div className="score-count-meta">{formatShareCount(shareTaskMeta.human)}</div>
                ) : null}
              </div>
              <div className="score-progress" aria-hidden="true">
                <span style={{ width: `${acsScore != null ? Math.min(100, Math.max(0, acsScore)) : 0}%` }} />
              </div>
              <p className="score-copy metric-copy">{humanCopy}</p>
            </div>
          </article>

        </aside>
      </div>
    </div>
  );
}

function titleFromReport(report) {
  return report?.profile?.occupation_title || report?.profile?.occupation_title_ko || "";
}
