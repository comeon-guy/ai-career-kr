function tryStr(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s || "";
}

function looksSoc(s) {
  return /^\d{2}-\d{4}(?:\.\d{2})?$/.test(String(s).trim());
}

function scatterPointDisplayName(row) {
  const socRaw = String(row.soc_code ?? row.SOC_CODE ?? "").trim();
  const socLo = socRaw.toLowerCase();
  const tryLabel = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "";
    if (socLo && s.toLowerCase() === socLo) return "";
    if (looksSoc(s)) return "";
    return s;
  };
  for (const k of [
    "occupation_title",
    "occupation_title_ko",
    "occupation_title_en",
    "title_ko",
    "title_en",
    "title",
    "occupation_name_ko",
    "occupation_name",
    "job_title_ko",
    "job_title",
    "soc_title_ko",
    "soc_title",
    "onet_soc_title",
    "O_NET_SOC_Occupation_Title",
    "name",
    "label",
  ]) {
    const got = tryLabel(row[k]);
    if (got) return got;
  }
  return "";
}

/** /jobs/scatter → 4분면 플롯 좌표(%). 현재 직무는 메인 점과 중복되므로 제외. */
export function buildQuadScatterCloudPoints(scatter, excludeSocCode, maxDots = 2400) {
  const rows = scatter?.points;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const ex = String(excludeSocCode || "").trim().toLowerCase();
  const pickNum = (row, a, b) => {
    const v = row[a] ?? row[b];
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const out = [];
  for (const row of rows) {
    const soc = String(row.soc_code ?? row.SOC_CODE ?? "").trim();
    if (ex && soc.toLowerCase() === ex) continue;
    const aei = pickNum(row, "aei_job", "AEI_job");
    const acs = pickNum(row, "acs_job", "ACS_job");
    if (!Number.isFinite(aei) || !Number.isFinite(acs)) continue;
    const ae = Math.min(1, Math.max(0, aei));
    const ac = Math.min(1, Math.max(0, acs));
    const displayName = scatterPointDisplayName(row);
    out.push({
      left: ae * 100,
      top: (1 - ac) * 100,
      soc,
      displayName,
      aeiScore: Math.round(ae * 100),
      acsScore: Math.round(ac * 100),
    });
  }
  if (out.length <= maxDots) return out;
  const step = Math.ceil(out.length / maxDots);
  return out.filter((_, i) => i % step === 0);
}

/** 점 구름 → 격자 밀도(선택 3×3 스무딩) 후 SVG heat 셀로 렌더 */
export function buildQuadDensityCells(points, grid = 56) {
  if (!Array.isArray(points) || points.length === 0 || grid < 8) return [];
  const n = grid * grid;
  const raw = new Float32Array(n);
  for (const pt of points) {
    const gx = Math.min(grid - 1, Math.max(0, Math.floor((pt.left / 100) * grid)));
    const gy = Math.min(grid - 1, Math.max(0, Math.floor((pt.top / 100) * grid)));
    raw[gy * grid + gx] += 1;
  }
  const smoothed = new Float32Array(n);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      let s = 0;
      let w = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= grid || ny >= grid) continue;
          const wgt = dx === 0 && dy === 0 ? 1.4 : 0.55;
          s += raw[ny * grid + nx] * wgt;
          w += wgt;
        }
      }
      smoothed[y * grid + x] = w > 0 ? s / w : 0;
    }
  }
  let max = 0;
  for (let i = 0; i < n; i++) if (smoothed[i] > max) max = smoothed[i];
  if (max <= 0) return [];
  const cellW = 100 / grid;
  const cellH = 100 / grid;
  const cells = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const c = smoothed[y * grid + x];
      if (c <= 0) continue;
      const t = Math.pow(c / max, 0.48);
      cells.push({
        x: x * cellW,
        y: y * cellH,
        w: cellW + 0.12,
        h: cellH + 0.12,
        t,
      });
    }
  }
  return cells;
}

export function pctToSvgX(pct, width = 1000) {
  return (pct / 100) * width;
}

export function pctToSvgY(pct, height = 430) {
  return (pct / 100) * height;
}
