/**
 * Dev server (localhost:5173) and Vite preview (localhost:4173).
 * Production `vite build` output stays free of Agentation.
 * Static Final Report HTML does not load the SPA, so those responses get a mount script.
 */
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const MOUNT_URL = "/__agentation/mount.js";

/** Same prefixes as frontend/vite.config.js preview.proxy. SPA HTML must not replace these. */
const PROXY_API_PREFIXES = [
  "/health",
  "/manager-review",
  "/simulation",
  "/scenario-mode",
  "/job-neutral-assessment",
];

function isProxiedApiPath(pathOnly) {
  return PROXY_API_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
}

export function injectAgentationMount(html) {
  if (html.includes(MOUNT_URL)) return html;
  const tag = `<script type="module" src="${MOUNT_URL}"></script>`;
  if (html.includes("</body>")) return html.replace("</body>", `${tag}</body>`);
  return `${html}${tag}`;
}

function resolveHtmlFile(distDir, pathOnly, spaFallback) {
  let rel = pathOnly;
  try {
    rel = decodeURIComponent(pathOnly);
  } catch {
    return null;
  }
  rel = rel.replace(/^\/+/, "");
  const root = path.resolve(distDir);
  let filePath = path.resolve(root, rel);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return null;

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  } else if (spaFallback && !path.extname(pathOnly) && !fs.existsSync(filePath)) {
    filePath = path.join(root, "index.html");
  }

  if (!filePath.endsWith(".html") || !fs.existsSync(filePath)) return null;
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return null;
  return filePath;
}

export function agentationPreviewPlugin(frontendRoot) {
  const entry = path.join(frontendRoot, "src/dev/mountAgentation.jsx");
  let bundlePromise = null;

  function loadBundle() {
    if (!bundlePromise) {
      bundlePromise = esbuild
        .build({
          absWorkingDir: frontendRoot,
          entryPoints: [entry],
          bundle: true,
          format: "esm",
          write: false,
          jsx: "automatic",
          platform: "browser",
          target: "es2020",
          define: {
            "import.meta.env.PROD": "false",
            "import.meta.env.DEV": "true",
          },
          logLevel: "silent",
        })
        .then((result) => Buffer.from(result.outputFiles[0].contents));
    }
    return bundlePromise;
  }

  function mountMiddleware(rootDir, { spaFallback }) {
    const pending = loadBundle();
    pending.catch((err) => {
      console.error(`[agentation] bundle failed: ${err}`);
    });

    return async (req, res, next) => {
      const raw = req.url || "/";
      const pathOnly = raw.split("?")[0];

      if (pathOnly === MOUNT_URL) {
        try {
          const body = await pending;
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          if (String(req.method || "GET").toUpperCase() === "HEAD") {
            res.end();
            return;
          }
          res.end(body);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(String(err && err.stack ? err.stack : err));
        }
        return;
      }

      const method = String(req.method || "GET").toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        next();
        return;
      }
      if (isProxiedApiPath(pathOnly)) {
        next();
        return;
      }

      const ext = path.extname(pathOnly).toLowerCase();
      if (ext && ext !== ".html") {
        next();
        return;
      }

      const filePath = resolveHtmlFile(rootDir, pathOnly, spaFallback);
      if (!filePath) {
        next();
        return;
      }

      const html = injectAgentationMount(fs.readFileSync(filePath, "utf8"));
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      if (method === "HEAD") {
        res.end();
        return;
      }
      res.end(html);
    };
  }

  return {
    name: "agentation-preview-inject",
    configureServer(server) {
      server.middlewares.use(
        mountMiddleware(server.config.publicDir, { spaFallback: false }),
      );
    },
    configurePreviewServer(server) {
      const distDir = path.resolve(frontendRoot, server.config.build.outDir);
      server.middlewares.use(mountMiddleware(distDir, { spaFallback: true }));
    },
  };
}
