/**
 * Bootstrap for pages that bypass the React SPA shell
 * (e.g. Final Report V28 raw HTML).
 * The dev SPA mounts Agentation from main.jsx.
 * Static HTML on the dev server (5173) and Vite preview (4173) injects this entry.
 * Production `vite build` must not bundle this path.
 */
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

const HOST_ID = "kr-agentation-dev-host";

function mount() {
  if (import.meta.env.PROD) return;
  if (document.getElementById(HOST_ID)) return;
  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);
  createRoot(host).render(<Agentation endpoint="http://localhost:4747" />);
}

mount();
