/**
 * Position Map v2 — 7-SOC cross-calibration review chart.
 * Review-only: review_contract=task-role-v2&calibration=7soc
 * Does not alter production Position Map.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clampTooltipPosition,
  findNearestScatterPoint,
} from "./positionMapInteraction.js";
import { scoresToPlotPct } from "./positionMapDomain.js";
import { pctToSvgX, pctToSvgY } from "./positionMapScatter.js";
import { resolveApiBase } from "../../apiBase.js";
import { REVIEW_SOCS } from "../../reviewContract.js";
import "./position-map-refresh.css";
import "./position-map-v2-calibration.css";

const SVG_W = 1000;
const SVG_H = 520;
const HIT_RADIUS = 14;
const NEAREST_MAX_DIST = 28;
const DOMAIN = { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };

/** Explicit label offsets — US 7SOC offsets removed for KR runtime. */
const LABEL_OFFSETS = {};

function formatPct(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function CalibrationTooltip({ point, lang, style, mode }) {
  const ko = lang !== "en";
  if (!point) return null;
  if (mode === "legacy") {
    return (
      <div className="pmr-tooltip pmv2c-tooltip" role="tooltip" style={style}>
        <div className="pmr-tooltip__title">{point.title}</div>
        {point.soc ? <div className="pmr-tooltip__soc">{point.soc}</div> : null}
        <div className="pmv2c-tip-rows">
          <div>
            <span>{ko ? "AI 영향도" : "AI impact"}</span>
            <strong>{point.aeiScore}</strong>
          </div>
          <div>
            <span>{ko ? "사람 판단 중요도" : "Human judgment"}</span>
            <strong>{point.acsScore}</strong>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="pmr-tooltip pmv2c-tooltip" role="tooltip" style={style}>
      <div className="pmr-tooltip__title">{point.title}</div>
      {point.soc ? <div className="pmr-tooltip__soc">{point.soc}</div> : null}
      <div className="pmv2c-tip-rows">
        <div>
          <span>{ko ? "AI가 크게 도울 수 있는 업무 비중" : "Share of work AI can help a lot with"}</span>
          <strong>{formatPct(point.xPct, 1)}%</strong>
        </div>
        <div>
          <span>{ko ? "사람 판단이 중요한 업무 비중" : "Judgment-critical work share"}</span>
          <strong>{formatPct(point.yPct, 1)}%</strong>
        </div>
        <div>
          <span>{ko ? "자동화에 적합한 업무 비중" : "Automation-fit work share"}</span>
          <strong>{formatPct(point.automationPct, 1)}%</strong>
        </div>
      </div>
    </div>
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

/**
 * Resolve overlapping labels by nudging dy when two boxes are too close.
 * Point coordinates are never moved.
 */
export function resolveLabelPlacements(points, { minDy = 18 } = {}) {
  const placed = points.map((p) => {
    const off = LABEL_OFFSETS[p.soc] || { dx: 12, dy: -10 };
    return {
      ...p,
      labelDx: off.dx,
      labelDy: off.dy,
      labelX: p.cx + off.dx,
      labelY: p.cy + off.dy,
    };
  });
  // Sort by x then y so near-x pairs (InfoSec / Web) get sequential nudge
  placed.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  for (let i = 0; i < placed.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = placed[i];
      const b = placed[j];
      const dx = Math.abs(a.labelX - b.labelX);
      const dy = Math.abs(a.labelY - b.labelY);
      if (dx < 90 && dy < minDy) {
        const push = minDy - dy + 2;
        if (a.cy >= b.cy) {
          a.labelDy += push;
          a.labelY = a.cy + a.labelDy;
        } else {
          a.labelDy -= push;
          a.labelY = a.cy + a.labelDy;
        }
      }
    }
  }
  return placed;
}

function labelsCollide(placed, { minDy = 14, minDx = 70 } = {}) {
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      if (Math.abs(a.labelX - b.labelX) < minDx && Math.abs(a.labelY - b.labelY) < minDy) {
        return true;
      }
    }
  }
  return false;
}

export { labelsCollide };

/**
 * @param {{
 *   lang: string;
 *   payload: object | null;
 *   loading?: boolean;
 * }} props
 */
export default function PositionMapV2Calibration({ lang, payload, loading = false }) {
  const ko = lang !== "en";
  const shellRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  /** @type {'v2' | 'legacy'} */
  const [coordMode, setCoordMode] = useState("v2");
  const [legacyRows, setLegacyRows] = useState(null);
  const [legacyLoading, setLegacyLoading] = useState(false);

  const pointsV2 = useMemo(() => {
    const rows = payload?.cohort_points || [];
    return rows.map((row) => {
      const x = Number(row.x_pct);
      const y = Number(row.y_pct);
      const plot = scoresToPlotPct(x, y, DOMAIN);
      return {
        key: `v2-${row.soc_code}`,
        soc: row.soc_code,
        shortLabel: (ko ? row.short_label_ko : row.short_label_en) || row.soc_code,
        title: (ko ? row.occupation_title_ko : row.occupation_title) || row.occupation_title || row.soc_code,
        xPct: x,
        yPct: y,
        automationPct: Number(row.automation_pct ?? row.automation_high_share * 100),
        aeiScore: Math.round(x),
        acsScore: Math.round(y),
        cx: pctToSvgX(plot.left, SVG_W),
        cy: pctToSvgY(plot.top, SVG_H),
      };
    });
  }, [payload, ko]);

  useEffect(() => {
    if (coordMode !== "legacy") return undefined;
    if (legacyRows) return undefined;
    let cancelled = false;
    setLegacyLoading(true);
    const apiBase = resolveApiBase();
    Promise.all(
      REVIEW_SOCS.map(async (item) => {
        const res = await fetch(
          `${apiBase}/jobs/${encodeURIComponent(item.soc)}/report?lang=${encodeURIComponent(lang)}&_t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const p = data?.profile || {};
        const aei = Math.round(Math.min(1, Math.max(0, Number(p.aei_job ?? p.AEI_job ?? 0) || 0)) * 100);
        const acs = Math.round(Math.min(1, Math.max(0, Number(p.acs_job ?? p.ACS_job ?? 0) || 0)) * 100);
        const tauAei = Math.round(Math.min(1, Math.max(0, Number(p.tau_aei ?? 0.44) || 0.44)) * 100);
        const tauAcs = Math.round(Math.min(1, Math.max(0, Number(p.tau_acs ?? 0.4) || 0.4)) * 100);
        const v2 = (payload?.cohort_points || []).find((r) => r.soc_code === item.soc);
        return {
          soc: item.soc,
          shortLabel: ko ? item.titleKo : item.titleEn,
          title: ko ? item.titleKo : item.titleEn,
          aeiScore: aei,
          acsScore: acs,
          tauAei,
          tauAcs,
          short_label_ko: v2?.short_label_ko || item.titleKo,
          short_label_en: v2?.short_label_en || item.titleEn,
        };
      }),
    )
      .then((rows) => {
        if (!cancelled) setLegacyRows(rows);
      })
      .catch(() => {
        if (!cancelled) setLegacyRows([]);
      })
      .finally(() => {
        if (!cancelled) setLegacyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coordMode, legacyRows, lang, ko, payload]);

  const pointsLegacy = useMemo(() => {
    if (!legacyRows?.length) return [];
    return legacyRows.map((row) => {
      const plot = scoresToPlotPct(row.aeiScore, row.acsScore, DOMAIN);
      return {
        key: `leg-${row.soc}`,
        soc: row.soc,
        shortLabel: (ko ? row.short_label_ko : row.short_label_en) || row.shortLabel,
        title: row.title,
        xPct: row.aeiScore,
        yPct: row.acsScore,
        automationPct: null,
        aeiScore: row.aeiScore,
        acsScore: row.acsScore,
        cx: pctToSvgX(plot.left, SVG_W),
        cy: pctToSvgY(plot.top, SVG_H),
      };
    });
  }, [legacyRows, ko]);

  const activePoints = coordMode === "legacy" ? pointsLegacy : pointsV2;
  const labeled = useMemo(() => resolveLabelPlacements(activePoints), [activePoints]);

  const medX =
    coordMode === "v2"
      ? Number(payload?.cohort_median?.ai_augmentation_high_share_median ?? 0) * 100
      : Number(legacyRows?.[0]?.tauAei ?? 44);
  const medY =
    coordMode === "v2"
      ? Number(payload?.cohort_median?.human_judgment_high_share_median ?? 0) * 100
      : Number(legacyRows?.[0]?.tauAcs ?? 40);

  const medianPlot = scoresToPlotPct(medX, medY, DOMAIN);
  const splitVPct = medianPlot.left;
  const splitHPct = medianPlot.top;

  const quad =
    coordMode === "v2"
      ? payload?.quadrant_labels_review || {}
      : {
          tl: { ko: "사람 중심 직무", en: "Human-centric" },
          tr: { ko: "AI 협업형 직무", en: "AI collaboration" },
          bl: { ko: "AI 영향 낮은 직무", en: "Lower AI impact" },
          br: { ko: "AI 보강 여지 큰 직무", en: "High AI-augmentation potential" },
        };

  const qLabel = (key) => {
    const raw = quad[key];
    if (!raw) return "";
    return ko ? raw.ko || raw : raw.en || raw;
  };

  const hoveredPoint = useMemo(() => {
    if (!hoveredKey) return null;
    return labeled.find((p) => p.key === hoveredKey) || null;
  }, [hoveredKey, labeled]);

  const updateTooltipForPoint = useCallback((point, clientX, clientY) => {
    const shell = shellRef.current;
    if (!shell || !point) return;
    const shellRect = shell.getBoundingClientRect();
    const tipRect = tooltipRef.current?.getBoundingClientRect();
    const pos = clampTooltipPosition(clientX, clientY, shellRect, {
      width: tipRect?.width || 240,
      height: tipRect?.height || 120,
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
        const direct = labeled.find((p) => p.key === targetKey);
        if (direct) {
          updateTooltipForPoint(direct, e.clientX, e.clientY);
          return;
        }
      }
      const nearest = findNearestScatterPoint(svgPt.x, svgPt.y, labeled, {
        maxDistance: NEAREST_MAX_DIST,
      });
      if (nearest) updateTooltipForPoint(nearest, e.clientX, e.clientY);
      else clearHover();
    },
    [labeled, updateTooltipForPoint, clearHover],
  );

  const tableRows = useMemo(() => {
    if (coordMode === "legacy" && legacyRows?.length) {
      return legacyRows.map((r) => ({
        soc: r.soc,
        name: (ko ? r.short_label_ko : r.short_label_en) || r.shortLabel,
        a: r.aeiScore,
        h: r.acsScore,
        auto: null,
        unit: "pts",
      }));
    }
    return (payload?.comparison_table || payload?.cohort_points || []).map((r) => ({
      soc: r.soc_code,
      name: (ko ? r.short_label_ko || r.occupation_title_ko : r.short_label_en || r.occupation_title) || r.soc_code,
      a: Number(r.ai_augmentation_pct ?? r.x_pct),
      h: Number(r.human_judgment_pct ?? r.y_pct),
      auto: Number(r.automation_pct ?? (r.automation_high_share != null ? r.automation_high_share * 100 : NaN)),
      unit: "pct",
    }));
  }, [coordMode, legacyRows, payload, ko]);

  const medianXLabel =
    coordMode === "v2"
      ? ko
        ? `AI 도움 · 7개 검증 직무 중앙값 · 임시 ${formatPct(medX, 1)}%`
        : `AI help · 7-SOC median · provisional ${formatPct(medX, 1)}%`
      : ko
        ? `AI 영향도 · 전체 직무 중앙값 ${Math.round(medX)}점`
        : `AI impact · all-occupation median ${Math.round(medX)}`;

  const medianYLabel =
    coordMode === "v2"
      ? ko
        ? `사람 판단 · 7개 검증 직무 중앙값 · 임시 ${formatPct(medY, 1)}%`
        : `Human judgment · 7-SOC median · provisional ${formatPct(medY, 1)}%`
      : ko
        ? `사람 판단 · 전체 직무 중앙값 ${Math.round(medY)}점`
        : `Human judgment · all-occupation median ${Math.round(medY)}`;

  if (loading && !payload) {
    return <div className="pmv2c-root pmv2c-loading">{ko ? "7개 직무 좌표를 불러오는 중…" : "Loading 7-SOC coordinates…"}</div>;
  }
  if (!payload) {
    return <div className="pmv2c-root pmv2c-loading">{ko ? "캘리브레이션 데이터를 불러오지 못했습니다." : "Failed to load calibration payload."}</div>;
  }

  return (
    <div className="pmr-root pmv2c-root" data-coord-mode={coordMode}>
      <div className="pmv2c-toolbar" role="group" aria-label={ko ? "좌표 모드" : "Coordinate mode"}>
        <button
          type="button"
          className={coordMode === "v2" ? "is-active" : ""}
          onClick={() => setCoordMode("v2")}
        >
          V2 Task Role
        </button>
        <button
          type="button"
          className={coordMode === "legacy" ? "is-active" : ""}
          onClick={() => setCoordMode("legacy")}
        >
          Legacy AEI/ACS
        </button>
        {coordMode === "legacy" && legacyLoading ? (
          <span className="pmv2c-toolbar-hint">{ko ? "Legacy 좌표 로딩…" : "Loading legacy…"}</span>
        ) : null}
      </div>

      <div className="position-layout pmv2c-layout">
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
              <div className="plot-area pmv2c-plot">
                <div className="divider v" aria-hidden="true" />
                <div className="divider h" aria-hidden="true" />

                <span className="quadrant q1 pmv2c-quad">{qLabel("tl")}</span>
                <span className="quadrant q2 pmv2c-quad">{qLabel("tr")}</span>
                <span className="quadrant q3 pmv2c-quad">{qLabel("bl")}</span>
                <span className="quadrant q4 pmv2c-quad">{qLabel("br")}</span>

                <svg
                  ref={svgRef}
                  className="pmr-scatter"
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  role="img"
                  aria-label={
                    ko
                      ? "7개 검증 직무 Position Map v2 비교"
                      : "7-SOC Position Map v2 calibration scatter"
                  }
                  onMouseMove={handlePointerMove}
                >
                  <g className="pmv2c-dots">
                    {labeled.map((dot) => {
                      const isHovered = hoveredKey === dot.key;
                      return (
                        <g key={dot.key} className={isHovered ? "is-hovered" : undefined}>
                          <circle
                            className="pmr-hit"
                            data-pmr-key={dot.key}
                            cx={dot.cx}
                            cy={dot.cy}
                            r={HIT_RADIUS}
                            fill="transparent"
                          />
                          <circle
                            cx={dot.cx}
                            cy={dot.cy}
                            r={isHovered ? 9 : 7}
                            fill="#2f6df6"
                            fillOpacity={isHovered ? 1 : 0.88}
                            stroke="#fff"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                          <text
                            className="pmv2c-point-label"
                            x={dot.labelX}
                            y={dot.labelY}
                            textAnchor={dot.labelDx < 0 ? "end" : "start"}
                            pointerEvents="none"
                          >
                            {dot.shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                <div className="median-pill median-x">{medianXLabel}</div>
                <div className="median-pill median-y">{medianYLabel}</div>

                <div className="axis-y-high">{ko ? "높음" : "High"}</div>
                <div className="axis-y-low">{ko ? "낮음" : "Low"}</div>
                <div className="axis-y">
                  {coordMode === "v2"
                    ? ko
                      ? "사람 판단이 중요한 업무 비중"
                      : "Judgment-critical work share"
                    : ko
                      ? "사람 판단 중요도"
                      : "Human judgment"}
                </div>
              </div>

              {hoveredPoint && tooltipPos ? (
                <div
                  ref={tooltipRef}
                  className="pmr-tooltip-wrap"
                  style={{ left: tooltipPos.left, top: tooltipPos.top }}
                >
                  <CalibrationTooltip point={hoveredPoint} lang={lang} mode={coordMode} />
                </div>
              ) : null}

              <div className="x-axis-meta">
                <div className="x-axis-scale-row" aria-hidden="true">
                  <span className="x-axis-scale-row__side x-axis-scale-row__side--start">
                    {coordMode === "v2" ? "0%" : "0"}
                  </span>
                  <span className="x-axis-scale-row__center">
                    {coordMode === "v2"
                      ? ko
                        ? "AI가 크게 도울 수 있는 업무 비중"
                        : "Share of work AI can help a lot with"
                      : ko
                        ? "AI가 대신하기 쉬운 정도"
                        : "Ease of AI taking on the work"}
                  </span>
                  <span className="x-axis-scale-row__side x-axis-scale-row__side--end">
                    {coordMode === "v2" ? "100%" : "100"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pmv2c-table-wrap">
        <table className="pmv2c-table">
          <thead>
            <tr>
              <th scope="col">{ko ? "직무" : "Occupation"}</th>
              <th scope="col">
                {coordMode === "v2" ? (ko ? "AI 도움" : "AI help") : ko ? "AI 영향도" : "AEI"}
              </th>
              <th scope="col">
                {coordMode === "v2" ? (ko ? "사람 판단" : "Human") : ko ? "사람 판단" : "ACS"}
              </th>
              {coordMode === "v2" ? <th scope="col">{ko ? "자동화" : "Automation"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.soc}>
                <td className="pmv2c-name">{row.name}</td>
                <td className="pmv2c-num">
                  {row.unit === "pct" ? `${formatPct(row.a, 1)}%` : row.a}
                </td>
                <td className="pmv2c-num">
                  {row.unit === "pct" ? `${formatPct(row.h, 1)}%` : row.h}
                </td>
                {coordMode === "v2" ? (
                  <td className="pmv2c-num">
                    {Number.isFinite(row.auto) ? `${formatPct(row.auto, 1)}%` : "—"}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
