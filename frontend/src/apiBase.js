export function resolveApiBase() {
  const raw = import.meta?.env?.VITE_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  return "";
}

function detailText(payload) {
  const d = payload?.detail ?? payload?.message ?? payload;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || x).filter(Boolean).join(" ") || "";
  if (d && typeof d === "object") return String(d.msg || d.message || "");
  return String(d || "");
}

/** Auth modal / session errors — never collapse into analysis-load copy. */
export function userFacingAuthError(err, ko, payload) {
  const code = String(payload?.code || err?.code || "").toUpperCase();
  const msg = detailText(payload) || String(err?.message || err || "");
  if (code === "BACKEND_UNAVAILABLE" || /서버 또는 데이터베이스|database|backend unavailable|503/i.test(msg)) {
    return ko
      ? "서버 또는 데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
      : "Cannot reach the server or database. Please try again shortly.";
  }
  if (code === "AUTH_REQUIRED" || /not authenticated|로그인이 필요/i.test(msg)) {
    return ko ? "로그인이 필요합니다." : "Sign in is required.";
  }
  if (/invalid username or password/i.test(msg)) {
    return ko ? "아이디 또는 비밀번호가 올바르지 않습니다." : "Invalid username or password.";
  }
  if (/username already exists/i.test(msg)) {
    return ko ? "이미 사용 중인 아이디입니다." : "That username is already taken.";
  }
  return msg || (ko ? "로그인에 실패했습니다." : "Sign-in failed.");
}

export function userFacingLoadError(err, ko) {
  const msg = String(err?.message || err || "");
  const code = String(err?.code || "").toUpperCase();
  if (code === "BACKEND_UNAVAILABLE" || /서버 또는 데이터베이스에 연결할 수 없습니다/.test(msg)) {
    return ko
      ? "서버 또는 데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
      : "Cannot reach the server or database. Please try again shortly.";
  }
  if (code === "AUTH_REQUIRED" || /로그인이 필요|not authenticated/i.test(msg)) {
    return ko ? "로그인이 필요합니다." : "Sign in is required.";
  }
  if (code === "REVIEW_DATA_NOT_FOUND" || /검토용 분석 데이터/.test(msg)) {
    return ko ? "검토용 분석 데이터를 찾을 수 없습니다." : "Review analysis data was not found.";
  }
  const genericKo = "분석 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  const genericEn = "Could not load analysis data. Please try again shortly.";
  if (
    /sql|pymysql|operationalerror|traceback|mysql|1045|2003|can't connect|connection refused|failed to fetch|load failed|networkerror/i.test(
      msg,
    ) ||
    /분석 데이터를 불러오지 못했습니다/.test(msg) ||
    code === "ANALYSIS_LOAD_FAILED"
  ) {
    return ko ? genericKo : genericEn;
  }
  return msg || (ko ? "리포트 조회 중 오류가 발생했습니다." : "An error occurred while loading the report.");
}
