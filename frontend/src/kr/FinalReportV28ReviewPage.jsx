/**
 * Dev-only Golden 5 Final Report review launcher.
 * Links to canonical static Final Report route (no fixture middleware body).
 */
import { Link } from "react-router-dom";
import { publicUrl } from "../publicUrl.js";

export const GOLDEN5_FINAL_REPORT_JOBS = Object.freeze([
  { jobCd: "K000007449", occupation_name: "회계사" },
  { jobCd: "K000007494", occupation_name: "간호사" },
  { jobCd: "K000001176", occupation_name: "응용소프트웨어개발자" },
  { jobCd: "K000001023", occupation_name: "공업기계 설치 및 정비원" },
  { jobCd: "K000000930", occupation_name: "제품·광고 영업원" },
]);

function reportUrl(jobCd) {
  return publicUrl(`/jobs/${encodeURIComponent(jobCd)}/final-report/index.html`);
}

export default function FinalReportV28ReviewPage() {
  return (
    <main
      className="kr-final-report-review"
      data-source="final-report-v28-review-only"
    >
      <h1>Final Report V28 · Golden 5 Review</h1>
      <p>
        개발용 전환 화면입니다. 선택 시 canonical production URL로 이동하며, 승인된 V28 HTML이
        shell 없이 직접 표시됩니다.
      </p>
      <ul>
        {GOLDEN5_FINAL_REPORT_JOBS.map((row) => (
          <li key={row.jobCd}>
            <a href={reportUrl(row.jobCd)}>
              {row.occupation_name}
              <code>{row.jobCd}</code>
            </a>
            <span>
              {" · "}
              <Link to={`/jobs/${encodeURIComponent(row.jobCd)}/task-analysis-v2`}>
                Task Analysis V2
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
