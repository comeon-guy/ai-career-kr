/**
 * Internal Task Analysis V2 verification surface.
 * Route: /jobs/:jobCd/task-analysis-v2 (browser HTML).
 * JSON API remains the same path when Accept: application/json.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { publicUrl } from "../publicUrl.js";
import TaskAnalysisSection from "../components/report/TaskAnalysisSection.jsx";
import occupationNameIndex from "./occupationNameByJobCd.json";

const OCCUPATIONS = Object.freeze(
  Object.entries(occupationNameIndex.by_jobCd || {}).map(([jobCd, row]) => ({
    jobCd,
    occupation_name: String(row?.occupation_name || "").trim(),
  })),
);

function normalizeQuery(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function OccupationChrome({ jobCd, occupationName, query, onQueryChange, filtered, onSelect }) {
  return (
    <aside className="kr-review-chrome" aria-label="직종 선택">
      <div className="kr-review-chrome__head">
        <strong>업무 분석</strong>
        <span>Work24 수행직무 · Task Analysis V2 (내부 검증)</span>
      </div>
      <p className="kr-review-chrome__note">
        사용자용 Final Report 진입은{" "}
        <a href={jobCd ? publicUrl(`/jobs/${encodeURIComponent(jobCd)}/final-report`) : publicUrl("/")}>
          /jobs/{"{jobCd}"}/final-report
        </a>
        입니다. 이 화면은 Task Analysis V2 검증 전용입니다.
      </p>
      <label className="kr-occ-search">
        <span className="kr-occ-search__label">직종 검색</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="직종명 또는 jobCd"
          autoComplete="off"
        />
      </label>
      {jobCd ? (
        <dl className="kr-review-chrome__grid">
          <div>
            <dt>선택 직종</dt>
            <dd>{occupationName || jobCd}</dd>
          </div>
          <div>
            <dt>jobCd</dt>
            <dd>
              <code>{jobCd}</code>
            </dd>
          </div>
        </dl>
      ) : null}
      <ul className="kr-occ-list" role="listbox" aria-label="직종 목록">
        {filtered.slice(0, 80).map((row) => {
          const active = row.jobCd === jobCd;
          return (
            <li key={row.jobCd}>
              <button
                type="button"
                className={active ? "kr-occ-list__item is-active" : "kr-occ-list__item"}
                aria-selected={active}
                onClick={() => onSelect(row.jobCd)}
              >
                <span className="kr-occ-list__name">{row.occupation_name}</span>
                <span className="kr-occ-list__id">{row.jobCd}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {filtered.length > 80 ? (
        <p className="kr-review-chrome__note">검색어로 목록을 좁혀 주세요 ({filtered.length}건).</p>
      ) : null}
      {jobCd ? (
        <p className="kr-review-chrome__note">
          <a href={publicUrl(`/jobs/${encodeURIComponent(jobCd)}/final-report`)}>
            Final Report로 이동
          </a>
        </p>
      ) : null}
    </aside>
  );
}

export default function TaskAnalysisV2Page() {
  const { jobCd: paramJobCd } = useParams();
  const navigate = useNavigate();
  const jobCd = String(paramJobCd || "").trim();
  const [query, setQuery] = useState("");

  const occupationName = useMemo(() => {
    if (!jobCd) return "";
    return String(occupationNameIndex.by_jobCd?.[jobCd]?.occupation_name || "").trim();
  }, [jobCd]);

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return OCCUPATIONS;
    return OCCUPATIONS.filter((row) => {
      const name = normalizeQuery(row.occupation_name);
      const id = normalizeQuery(row.jobCd);
      return name.includes(q) || id.includes(q);
    });
  }, [query]);

  const selectJob = (next) => {
    const id = String(next || "").trim();
    if (!id) return;
    navigate(`/jobs/${encodeURIComponent(id)}/task-analysis-v2`, { replace: true });
  };

  return (
    <div className="kr-review-layout" data-source="task-analysis-v2-internal">
      <OccupationChrome
        jobCd={jobCd}
        occupationName={occupationName}
        query={query}
        onQueryChange={setQuery}
        filtered={filtered}
        onSelect={selectJob}
      />
      <div className="report-view-wrap">
        <div className="fc-report-tools">
          <div className="fc-report-tools__identity">
            <div className="fc-report-tools__title">
              {occupationName || (jobCd ? jobCd : "직종을 선택하세요")}
            </div>
          </div>
        </div>
        {jobCd ? (
          <TaskAnalysisSection
            socCode={jobCd}
            lang="ko"
            occupationTitle={occupationName || jobCd}
            onBack={null}
          />
        ) : (
          <div className="kr-ta-empty" role="status">
            <p>왼쪽에서 직종을 선택하면 Task Analysis V2가 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
