/**
 * Explicit missing-narrative / legacy-entry handler.
 * Does not generate report body. Known 492 jobCds hard-navigate to static canonical HTML.
 */
import { Link, useSearchParams, useParams, useLocation } from "react-router-dom";
import { publicUrl } from "../publicUrl.js";
import occupationNameIndex from "./occupationNameByJobCd.json";
import jobCdSetDoc from "./finalReport492JobCdSet.json";

const REPORT_JOBCDS = new Set(jobCdSetDoc.jobCds || []);

function canonicalReportHref(jobCd) {
  return publicUrl(`/jobs/${encodeURIComponent(jobCd)}/final-report/index.html`);
}

export default function FinalReportMissingPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const jobCd = String(params.jobCd || searchParams.get("jobCd") || "").trim();
  const occupationName = jobCd
    ? String(occupationNameIndex.by_jobCd?.[jobCd]?.occupation_name || "").trim()
    : "";

  // Legacy SPA hit for a known production jobCd → static canonical document (no body synthesis).
  if (jobCd && REPORT_JOBCDS.has(jobCd)) {
    const target = canonicalReportHref(jobCd);
    if (!location.pathname.endsWith("/final-report/index.html")) {
      window.location.replace(target);
      return null;
    }
  }

  return (
    <main className="kr-final-report-missing" data-state="MISSING_NARRATIVE">
      {!jobCd ? (
        <>
          <h1>Final Report</h1>
          <p>
            jobCd가 필요합니다. 예:{" "}
            <code>/jobs/K000007449/final-report</code>
          </p>
          <p>
            Golden 5 전환(개발용): <Link to="/final-report-review">/final-report-review</Link>
          </p>
        </>
      ) : (
        <>
          <h1>Final Report 미제공</h1>
          <p>
            이 직종(<code>{jobCd}</code>
            {occupationName ? ` · ${occupationName}` : ""})의 Final Report는 제공되지 않습니다.
          </p>
          <p>임의 생성·fixture fallback·Task Analysis UI 대체 표시는 하지 않습니다.</p>
          <p>
            내부 검증:{" "}
            <Link to={`/jobs/${encodeURIComponent(jobCd)}/task-analysis-v2`}>
              /jobs/{jobCd}/task-analysis-v2
            </Link>
          </p>
          <p>
            Golden 5 목록(개발용): <Link to="/final-report-review">/final-report-review</Link>
          </p>
        </>
      )}
    </main>
  );
}
