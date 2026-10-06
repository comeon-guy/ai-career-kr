import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { agentationPreviewPlugin } from "./vite.agentation-preview.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Legacy 3-axis review path only — Task Analysis V2 must not depend on this bundle. */
const legacyBundlePath = path.join(__dirname, "src/kr/krAccountantReportBundle.json");
/** Derived 492-jobCd V2 serving index (Python build_task_analysis_v2 SoT). */
const v2RuntimeIndexPath = path.join(
  __dirname,
  "../data/canonical/kr-task-2axis-v2/derived/runtime_projection/task_analysis_v2_by_jobCd.json",
);

let v2IndexCache = null;

function loadV2RuntimeIndex() {
  if (v2IndexCache) return v2IndexCache;
  const raw = fs.readFileSync(v2RuntimeIndexPath, "utf8");
  v2IndexCache = JSON.parse(raw);
  return v2IndexCache;
}

function extractJobCd(url, marker) {
  const pathOnly = String(url || "").split("?")[0];
  const needle = `/jobs/`;
  const i = pathOnly.indexOf(needle);
  if (i < 0) return null;
  const rest = pathOnly.slice(i + needle.length);
  const slash = rest.indexOf("/");
  if (slash < 0) return null;
  const jobCd = decodeURIComponent(rest.slice(0, slash));
  const tail = rest.slice(slash);
  if (!tail.includes(marker)) return null;
  return jobCd || null;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/**
 * Dev/preview only: redirect legacy Final Report entry URLs to canonical static path.
 * Does NOT serve report HTML body (no fixture, no Narrative generation).
 * Production static host should apply equivalent redirects or rely on SPA MissingPage.
 */
function redirectToCanonicalFinalReport(jobCd, res) {
  const id = String(jobCd || "").trim();
  if (!id) return false;
  res.statusCode = 302;
  res.setHeader("Location", `/jobs/${encodeURIComponent(id)}/final-report/index.html`);
  res.setHeader("Cache-Control", "no-store");
  res.end();
  return true;
}

function finalReportLegacyRedirectPlugin() {
  function handle(req, res, next) {
    const url = req.url || "";
    const pathOnly = url.split("?")[0];
    const method = String(req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      next();
      return;
    }

    // Never intercept canonical static report or staged VM (public/** exact serve).
    if (
      /^\/jobs\/[^/]+\/final-report\/?$/.test(pathOnly) ||
      /^\/jobs\/[^/]+\/final-report\/index\.html$/.test(pathOnly) ||
      /^\/api\/final-report-v28\/[^/]+\/view-model\.json$/.test(pathOnly)
    ) {
      next();
      return;
    }

    if (pathOnly === "/" || pathOnly === "") {
      try {
        const q = new URL(url, "http://127.0.0.1").searchParams.get("jobCd");
        const jobCd = String(q || "").trim();
        if (jobCd) {
          redirectToCanonicalFinalReport(jobCd, res);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    if (pathOnly.endsWith("/final-report-v28")) {
      const jobCd = extractJobCd(url, "/final-report-v28");
      if (jobCd) {
        redirectToCanonicalFinalReport(jobCd, res);
        return;
      }
    }

    const frMatch = pathOnly.match(/^\/final-report\/([^/]+)$/);
    if (frMatch) {
      redirectToCanonicalFinalReport(frMatch[1], res);
      return;
    }

    next();
  }

  return {
    name: "final-report-legacy-redirect",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

function krGoldenApiPlugin() {
  return {
    name: "kr-production-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        // Legacy 3-axis path (unchanged meaning; accountant review bundle only).
        const isLegacyTa =
          url.includes("/jobs/") &&
          url.includes("/task-analysis") &&
          !url.includes("/task-analysis-v2");
        // Common V2 2-axis projection path — 492 Work24 jobCd runtime index.
        const isV2Ta = url.includes("/jobs/") && url.includes("/task-analysis-v2");
        // Task-native AI Working HTTP is owned by Python backend http_app
        // (not served here; no canonical AW registry reads in Vite).
        // Final Report VM is static under public/api/final-report-v28/ (no middleware).
        if (!isLegacyTa && !isV2Ta) {
          next();
          return;
        }
        try {
          if (isV2Ta) {
            // Browser navigation → SPA page. fetch(Accept: application/json) → API.
            const accept = String(req.headers.accept || "");
            const wantsJson =
              accept.includes("application/json") ||
              String(url).includes("format=json");
            if (!wantsJson) {
              next();
              return;
            }
            const jobCd = extractJobCd(url, "/task-analysis-v2");
            if (!jobCd) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ detail: "jobCd required" }));
              return;
            }
            const index = loadV2RuntimeIndex();
            const payload = index?.by_jobCd?.[jobCd];
            if (!payload || !payload.task_analysis_v2) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ detail: `unknown jobCd: ${jobCd}` }));
              return;
            }
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({
                task_analysis_v2: payload.task_analysis_v2,
                scenario_linkages_v2: payload.scenario_linkages_v2 || [],
                v2_runtime_projection: payload.v2_runtime_projection || null,
              }),
            );
            return;
          }

          // Legacy /task-analysis — isolated from V2 common runtime.
          const bundle = JSON.parse(fs.readFileSync(legacyBundlePath, "utf8"));
          if (bundle.golden_fallback || bundle.fallback_used) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ detail: "fallback forbidden" }));
            return;
          }
          const occ = bundle.occupation_id;
          if (!url.includes(encodeURIComponent(occ)) && !url.includes(occ)) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ detail: "legacy task-analysis review only supports accountant" }));
            return;
          }
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(bundle.task_analysis));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ detail: String(err) }));
        }
      });
    },
  };
}

/**
 * GitHub Pages project sites are served under /<repo>/.
 * Default base stays "/" so root hosting is unchanged.
 * `vite build --base /ai-career-kr/` rewrites copied public URLs in dist only.
 */
function pagesPublicBasePlugin() {
  let outDir = "";
  let base = "/";
  return {
    name: "pages-public-base",
    apply: "build",
    configResolved(config) {
      base = config.base || "/";
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (!base || base === "/") return;
      const prefix = base.endsWith("/") ? base : `${base}/`;
      rewritePublicUrls(outDir, prefix);
      const indexPath = path.join(outDir, "index.html");
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, path.join(outDir, "404.html"));
      }
    },
  };
}

function rewritePublicUrls(dir, prefix) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      rewritePublicUrls(full, prefix);
      continue;
    }
    const rel = path.relative(dir === outDirSafe(dir) ? dir : path.dirname(full), full);
    if (!shouldRewritePublicFile(path.relative(findDistRoot(full, dir), full))) continue;
    const ext = path.extname(full).toLowerCase();
    if (![".html", ".css", ".js"].includes(ext)) continue;
    const before = fs.readFileSync(full, "utf8");
    const after = prefixRootWebPaths(before, prefix);
    if (after !== before) fs.writeFileSync(full, after);
  }
}

function findDistRoot(file, start) {
  let dir = start;
  while (path.basename(dir) !== "dist-pages" && path.basename(dir) !== "dist" && path.dirname(dir) !== dir) {
    dir = path.dirname(dir);
  }
  return dir;
}

function outDirSafe(dir) {
  return dir;
}

function shouldRewritePublicFile(rel) {
  const n = String(rel || "").replaceAll("\\", "/");
  if (n === "index.html" || n === "404.html") return false;
  if (n.startsWith("assets/") && !n.slice("assets/".length).includes("/")) return false;
  return true;
}

function prefixRootWebPaths(text, prefix) {
  return text
    .replace(/(href|src)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
    .replace(/url\(\s*(["']?)\/(?!\/)/g, `url($1${prefix}`)
    .replace(/(["'`])\/(api|jobs|assets|occupation-2axis)\//g, `$1${prefix}$2/`);
}

export default defineConfig({
  plugins: [
    react(),
    finalReportLegacyRedirectPlugin(),
    krGoldenApiPlugin(),
    agentationPreviewPlugin(__dirname),
    pagesPublicBasePlugin(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {},
});
