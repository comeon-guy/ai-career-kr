/**
 * Position Map interaction helpers — nearest-point lookup & tooltip clamping.
 */

/** @param {number} svgX @param {number} svgY @param {Array<{ cx: number; cy: number; key?: string }>} points */
export function findNearestScatterPoint(svgX, svgY, points, { maxDistance = 14 } = {}) {
  if (!Array.isArray(points) || !points.length) return null;
  let best = null;
  let bestDist = maxDistance;
  for (const pt of points) {
    const dx = pt.cx - svgX;
    const dy = pt.cy - svgY;
    const d = Math.hypot(dx, dy);
    if (d <= bestDist) {
      bestDist = d;
      best = pt;
    }
  }
  return best;
}

/**
 * Clamp tooltip position inside chart shell bounds.
 * @returns {{ left: number; top: number }}
 */
export function clampTooltipPosition(clientX, clientY, shellRect, tooltipSize, offset = 12) {
  const { width, height, left, top } = shellRect;
  const relX = clientX - left;
  const relY = clientY - top;
  const tw = tooltipSize?.width ?? 200;
  const th = tooltipSize?.height ?? 72;

  let x = relX + offset;
  let y = relY - th - offset;

  if (x + tw > width - 8) x = relX - tw - offset;
  if (x < 8) x = 8;
  if (y < 8) y = relY + offset;
  if (y + th > height - 8) y = height - th - 8;

  return { left: x, top: y };
}

export function isCurrentOccupationPoint(point, currentSoc) {
  if (!point) return false;
  if (point.isCurrent) return true;
  const a = String(point.soc || "").trim().toLowerCase();
  const b = String(currentSoc || "").trim().toLowerCase();
  return Boolean(a && b && a === b);
}

export function shouldNavigateOnPointClick(point, currentSoc, viewerMode = false) {
  if (viewerMode) return false;
  if (!point?.soc) return false;
  return !isCurrentOccupationPoint(point, currentSoc);
}
