/** Deployment-root URL. Vite base "/" stays unchanged; Pages base prefixes the same path. */
export function publicUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const suffix = String(path || "").replace(/^\//, "");
  return `${base}${suffix}`;
}
