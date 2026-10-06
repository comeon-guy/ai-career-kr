import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Agentation } from "agentation";
import { AppContext } from "./AppContext.jsx";
import TaskAnalysisV2Page from "./kr/TaskAnalysisV2Page.jsx";
import FinalReportV28ReviewPage from "./kr/FinalReportV28ReviewPage.jsx";
import FinalReportMissingPage from "./kr/FinalReportMissingPage.jsx";
import { KrLandingShell } from "./kr/KrLandingShell.jsx";
import WeseeLandingPage from "./pages/WeseeLandingPage.jsx";
import "./styles/fc-design-tokens.css";
import "./styles/fc-report.css";
import "./styles/fc-landing.css";
import "./styles/wesee-reference.css";
import "./kr/review-chrome.css";

const ctx = {
  lang: "ko",
  setLang: () => {},
  user: null,
};

/**
 * Minimal root branch:
 * - /?jobCd=… → existing Final Report path (Golden5 via Vite middleware; else Missing page)
 * - no jobCd → WESEE landing
 */
function RootEntry() {
  const [searchParams] = useSearchParams();
  const jobCd = String(searchParams.get("jobCd") || "").trim();
  if (jobCd) return <FinalReportMissingPage />;
  return <WeseeLandingPage />;
}

const routerBasename = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppContext.Provider value={ctx}>
      <BrowserRouter basename={routerBasename || undefined}>
        <Routes>
          {/* Dev-only Golden 5 launcher (not production report chrome) */}
          <Route path="/final-report-review" element={<FinalReportV28ReviewPage />} />
          {/* Internal Task Analysis V2 */}
          <Route
            path="/jobs/:jobCd/task-analysis-v2"
            element={<TaskAnalysisV2Page />}
          />
          {/* Landing (no jobCd) or Final Report missing/non-Golden (with jobCd) */}
          <Route path="/" element={<RootEntry />} />
          <Route path="/job-analysis" element={<KrLandingShell />} />
          <Route path="/final-report" element={<FinalReportMissingPage />} />
          <Route path="/final-report/:jobCd" element={<FinalReportMissingPage />} />
          <Route path="/jobs/:jobCd/final-report" element={<FinalReportMissingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV ? (
        <Agentation endpoint="http://localhost:4747" />
      ) : null}
    </AppContext.Provider>
  </React.StrictMode>,
);
