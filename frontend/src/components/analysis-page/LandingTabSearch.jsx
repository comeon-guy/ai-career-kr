import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEBOUNCE_MS as MAJOR_DEBOUNCE_MS,
  buildRelatedOccupations,
  ensureWork24MajorSearch,
  filterMajorIndex,
} from "../../majorSearch.js";
import {
  DEBOUNCE_MS as JOB_DEBOUNCE_MS,
  ensureOccupationIndex,
  filterOccupationIndex,
} from "../../occupationSearch.js";
import { buildFinalReportUrl } from "../../kr/finalReportUrl.js";

/** Work24 학과정보 empCurtState1Id. V2 JSON은 prefix만 제공하고 계열명은 이 코드를 표시한다. */
const AFFILIATION_NAME = {
  1: "인문계열",
  2: "사회계열",
  3: "교육계열",
  4: "자연계열",
  5: "공학계열",
  6: "의약계열",
  7: "예체능계열",
};

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function openReportClick(event, jobCd, onOpenReport) {
  if (!onOpenReport || !isPlainLeftClick(event)) return;
  event.preventDefault();
  onOpenReport(jobCd);
}

function highlightMatch(name, query) {
  const text = String(name || "");
  const needle = String(query || "").trim();
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="fc-major-search__mark">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

function groupMajors(majors) {
  const buckets = new Map();
  for (const row of majors || []) {
    const prefix = String(row.work24_major_key || "").split(":")[0] || "";
    if (!buckets.has(prefix)) buckets.set(prefix, []);
    buckets.get(prefix).push(row);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ko"))
    .map(([id, rows]) => ({
      id,
      name: AFFILIATION_NAME[id] || `계열 ${id}`,
      majors: [...rows].sort(
        (a, b) =>
          String(a.major_name).localeCompare(String(b.major_name), "ko") ||
          String(a.major_id).localeCompare(String(b.major_id)),
      ),
    }));
}

function CategoryCard({ name, meta, onClick }) {
  return (
    <button type="button" className="browse-card" onClick={onClick}>
      <strong>{name}</strong>
      {meta ? <span>{meta}</span> : null}
      <em>→</em>
    </button>
  );
}

function SearchGlyph() {
  return (
    <span className="search-page-icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"></circle>
        <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
      </svg>
    </span>
  );
}

function SearchForm({ id, value, onChange, placeholder, inputProps }) {
  return (
    <form className="search-page-form" onSubmit={(event) => event.preventDefault()}>
      <SearchGlyph />
      <input id={id} type="search" autoComplete="off" value={value} onChange={onChange} placeholder={placeholder} {...inputProps} />
      <button type="submit">검색</button>
    </form>
  );
}

function RelatedJobs({ title, jobs, emptyLabel, reportLabel, onOpenReport }) {
  return (
    <div className="search-results related-job-results">
      {title ? (
        <div className="results-heading">
          <strong>{title}</strong>
        </div>
      ) : null}
      {!jobs?.length ? (
        <p className="search-intro" role="status">
          {emptyLabel}
        </p>
      ) : (
        <div className="result-list">
          {jobs.map((job) => (
            <div className="result-item" key={job.jobCd}>
              <div className="result-copy">
                <h3>
                  <a
                    href={buildFinalReportUrl(job.jobCd)}
                    onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
                  >
                    {job.occupationName}
                  </a>
                </h3>
              </div>
              <a
                className="result-action"
                href={buildFinalReportUrl(job.jobCd)}
                onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
              >
                {reportLabel} →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MajorTab({ ko, onOpenReport }) {
  const [query, setQuery] = useState("");
  const [majors, setMajors] = useState([]);
  const [results, setResults] = useState([]);
  const [settledQuery, setSettledQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(null);
  const [status, setStatus] = useState("loading");
  const [groupId, setGroupId] = useState("");
  const [picked, setPicked] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    ensureWork24MajorSearch()
      .then((doc) => {
        if (cancel) return;
        setMajors(doc.majors || []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancel) setStatus("error");
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selected) return undefined;
    const q = query.trim();
    if (!q || status !== "ready") {
      setResults([]);
      setSettledQuery("");
      setActiveIndex(-1);
      return undefined;
    }
    debounceRef.current = setTimeout(() => {
      const { items } = filterMajorIndex(q, { majors });
      setResults(items);
      setSettledQuery(q);
      setActiveIndex(items.length ? 0 : -1);
    }, MAJOR_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, majors, selected, status]);

  const tree = useMemo(() => groupMajors(majors), [majors]);
  const group = tree.find((item) => item.id === groupId) || null;

  const selectMajor = (row) => {
    setSelected(row);
    setQuery(row.major_name);
    setResults([]);
    setSettledQuery("");
    setActiveIndex(-1);
    setSelectedJobs(buildRelatedOccupations(row.connected_jobCd));
  };

  const pickFromGroup = (row) => {
    setPicked({
      major: row,
      jobs: buildRelatedOccupations(row.connected_jobCd),
    });
  };

  const queryReady = !selected && settledQuery === query.trim() && Boolean(settledQuery);
  const showResults = queryReady && results.length > 0;
  const showEmpty = queryReady && results.length === 0;

  const onKeyDown = (e) => {
    if (!showResults) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectMajor(results[activeIndex]);
    } else if (e.key === "Escape") {
      setResults([]);
      setSettledQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <>
      <SearchForm
        id="tab-major-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
          setSelectedJobs(null);
        }}
        placeholder={ko ? "전공명을 입력하세요" : "Enter a major name"}
        inputProps={{
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-expanded": showResults,
          "aria-controls": "major-results",
          "aria-activedescendant": showResults && activeIndex >= 0 ? `tab-major-opt-${activeIndex}` : undefined,
          onKeyDown,
          disabled: status === "error",
        }}
      />
      {status === "error" ? (
        <p className="search-intro" role="alert">
          {ko ? "검색 데이터를 불러오지 못했습니다." : "Could not load search data."}
        </p>
      ) : null}
      {showEmpty ? (
        <p className="search-intro" role="status">
          {ko ? "일치하는 전공을 찾지 못했습니다." : "No matching major."}
        </p>
      ) : null}
      {showResults ? (
        <div className="search-results" id="major-results" role="listbox">
          <div className="results-heading">
            <strong>“{query.trim()}” 검색 결과</strong>
            <span>{results.length}개</span>
          </div>
          <div className="result-list">
            {results.map((row, idx) => (
              <div className="result-item" key={row.major_id}>
                <div className="result-copy">
                  <h3 id={`tab-major-opt-${idx}`}>
                    <button
                      type="button"
                      className="result-title-action"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectMajor(row)}
                    >
                      {highlightMatch(row.major_name, query)}
                    </button>
                  </h3>
                </div>
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  className="result-action"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectMajor(row)}
                >
                  관련 직무 보기 →
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {selected ? (
        <RelatedJobs
          title={selected.major_name}
          jobs={selectedJobs}
          emptyLabel={ko ? "연결된 직무가 없습니다." : "No linked roles."}
          reportLabel={ko ? "직업 분석 보기" : "View report"}
          onOpenReport={onOpenReport}
        />
      ) : null}

      <div className="browse-block">
      <p className="browse-label">{ko ? "전공 분야에서 찾기" : "Browse by major field"}</p>

      {picked ? (
        <div>
          <p className="browse-label">
            <button
              type="button"
              className="browse-crumb"
              onClick={() => {
                setPicked(null);
                setGroupId("");
              }}
            >
              {ko ? "전체 전공 분야 >" : "All major fields >"}
            </button>{" "}
            <button type="button" className="browse-crumb" onClick={() => setPicked(null)}>
              {`${group?.name || (ko ? "전공 분야" : "Fields")} >`}
            </button>
            {` ${picked.major.major_name}`}
          </p>
          {!picked.jobs?.length ? (
            <p className="search-intro" role="status">
              {ko ? "연결된 직무가 없습니다." : "No linked roles."}
            </p>
          ) : (
            <div className="result-list">
              {picked.jobs.map((job) => (
                <div className="result-item" key={job.jobCd}>
                  <div className="result-copy">
                    <h3>
                      <a
                        href={buildFinalReportUrl(job.jobCd)}
                        onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
                      >
                        {job.occupationName}
                      </a>
                    </h3>
                  </div>
                  <a
                    className="result-action"
                    href={buildFinalReportUrl(job.jobCd)}
                    onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
                  >
                    {ko ? "직업 분석 보기" : "View report"} →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : group ? (
        <div>
          <p className="browse-label">
            <button
              type="button"
              className="browse-crumb"
              onClick={() => {
                setPicked(null);
                setGroupId("");
              }}
            >
              {ko ? "전체 전공 분야 >" : "All major fields >"}
            </button>{" "}
            <button type="button" className="browse-crumb" onClick={() => setPicked(null)}>
              {group.name}
            </button>
            {ko ? " > 전공 선택" : " > Choose a major"}
          </p>
          <div className="browse-grid browse-grid-major">
            {group.majors.map((row) => {
              const count = buildRelatedOccupations(row.connected_jobCd).length;
              return (
                <CategoryCard
                  key={row.major_id}
                  name={row.major_name}
                  meta={ko ? `관련 직무 ${count}개` : `${count} roles`}
                  onClick={() => pickFromGroup(row)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="browse-grid browse-grid-major">
          {tree.map((item) => (
            <CategoryCard
              key={item.id}
              name={item.name}
              meta={ko ? `관련 전공 ${item.majors.length}개` : `${item.majors.length} majors`}
              onClick={() => {
                setPicked(null);
                setGroupId(item.id);
              }}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}

function JobTab({ ko, onPickSuggestItem, onOpenReport, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState([]);
  const [settledQuery, setSettledQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [largeName, setLargeName] = useState("");
  const [mediumName, setMediumName] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let cancel = false;
    import("../../data/work24_job_tree_v1.json")
      .then((mod) => {
        if (cancel) return;
        const doc = mod.default || mod;
        setGroups(Array.isArray(doc.groups) ? doc.groups : []);
      })
      .catch(() => {
        if (!cancel) setError(ko ? "직무 분야를 불러오지 못했습니다." : "Could not load job fields.");
      });
    return () => {
      cancel = true;
    };
  }, [ko]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setItems([]);
      setSettledQuery("");
      setActiveIndex(-1);
      return undefined;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        await ensureOccupationIndex();
        const { items: next } = filterOccupationIndex(query, { lang: "ko", limit: 15 });
        setItems(next);
        setSettledQuery(q);
        setActiveIndex(next.length ? 0 : -1);
        setError("");
      } catch {
        setItems([]);
        setSettledQuery(q);
        setActiveIndex(-1);
        setError(ko ? "직무 검색 인덱스를 불러오지 못했습니다." : "Could not load the job index.");
      }
    }, JOB_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, ko]);

  const visibleItems = settledQuery === query.trim() ? items : [];
  const showResults = visibleItems.length > 0 && settledQuery === query.trim();
  const showEmpty = Boolean(settledQuery) && settledQuery === query.trim() && !visibleItems.length && !error;
  const large = groups.find((group) => group.name === largeName) || null;
  const medium = large?.children?.find((child) => child.name === mediumName) || null;

  const onKeyDown = (e) => {
    if (!showResults) {
      if (e.key === "Enter" && visibleItems[0]) {
        e.preventDefault();
        const first = visibleItems[0];
        if (onOpenReport) onOpenReport(first.soc_code);
        else onPickSuggestItem?.(first);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? visibleItems.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = visibleItems[activeIndex >= 0 ? activeIndex : 0];
      if (hit) {
        if (onOpenReport) onOpenReport(hit.soc_code);
        else onPickSuggestItem?.(hit);
      }
    } else if (e.key === "Escape") {
      setItems([]);
      setSettledQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <>
      <SearchForm
        id="tab-job-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={ko ? "직무명을 입력하세요" : "Enter a role name"}
        inputProps={{
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-expanded": showResults,
          "aria-controls": "job-results",
          "aria-activedescendant": showResults && activeIndex >= 0 ? `tab-job-opt-${activeIndex}` : undefined,
          onKeyDown,
        }}
      />
      {error ? (
        <p className="search-intro" role="alert">
          {error}
        </p>
      ) : null}
      {showEmpty ? (
        <p className="search-intro" role="status">
          {ko ? "일치하는 직무를 찾지 못했습니다." : "No matching role."}
        </p>
      ) : null}
      {showResults ? (
        <div className="search-results" id="job-results" role="listbox">
          <div className="results-heading">
            <strong>“{query.trim()}” 검색 결과</strong>
            <span>{visibleItems.length}개</span>
          </div>
          <div className="result-list">
            {visibleItems.map((item, idx) => (
              <div className="result-item" key={item.soc_code}>
                <div className="result-copy">
                  <h3 id={`tab-job-opt-${idx}`}>
                    <a
                      href={buildFinalReportUrl(item.soc_code)}
                      onClick={(event) => openReportClick(event, item.soc_code, onOpenReport)}
                    >
                      {item.occupation_title}
                    </a>
                  </h3>
                </div>
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  className="result-action"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    onOpenReport ? onOpenReport(item.soc_code) : onPickSuggestItem?.(item)
                  }
                >
                  직업 분석 보기 →
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="browse-block">
        <p className="browse-label">{ko ? "직무 분야에서 찾기" : "Browse by job field"}</p>

        {medium ? (
          <div>
            <p className="browse-label">
              <button
                type="button"
                className="browse-crumb"
                onClick={() => {
                  setMediumName("");
                  setLargeName("");
                }}
              >
                {ko ? "전체 직무 분야 >" : "All job fields >"}
              </button>{" "}
              <button type="button" className="browse-crumb" onClick={() => setMediumName("")}>
                {`${large.name} >`}
              </button>
              {` ${medium.name}`}
            </p>
            <div className="result-list">
              {(medium.jobs || []).map((job) => (
                <div className="result-item" key={job.jobCd}>
                  <div className="result-copy">
                    <h3>
                      <a
                        href={buildFinalReportUrl(job.jobCd)}
                        onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
                      >
                        {job.name}
                      </a>
                    </h3>
                  </div>
                  <a
                    className="result-action"
                    href={buildFinalReportUrl(job.jobCd)}
                    onClick={(event) => openReportClick(event, job.jobCd, onOpenReport)}
                  >
                    {ko ? "직업 분석 보기" : "View report"} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : large ? (
          <div>
            <p className="browse-label">
              <button
                type="button"
                className="browse-crumb"
                onClick={() => {
                  setMediumName("");
                  setLargeName("");
                }}
              >
                {ko ? "전체 직무 분야 >" : "All job fields >"}
              </button>{" "}
              <button type="button" className="browse-crumb" onClick={() => setMediumName("")}>
                {large.name}
              </button>
              {ko ? " > 분야 선택" : " > Choose a field"}
            </p>
            <div className="browse-grid browse-grid-job">
              {(large.children || []).map((child) => (
                <CategoryCard
                  key={child.name}
                  name={child.name}
                  meta={ko ? `관련 직무 ${(child.jobs || []).length}개` : `${(child.jobs || []).length} roles`}
                  onClick={() => setMediumName(child.name)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="browse-grid browse-grid-job">
            {groups.map((group) => {
              const count = (group.children || []).reduce((sum, child) => sum + (child.jobs || []).length, 0);
              return (
                <CategoryCard
                  key={group.name}
                  name={group.name}
                  meta={ko ? `관련 직무 ${count}개` : `${count} roles`}
                  onClick={() => {
                    setMediumName("");
                    setLargeName(group.name);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export function LandingTabSearch({ ko, onPickSuggestItem, onOpenReport, initialQuery = "", onTabChange }) {
  const [tab, setTab] = useState("job");

  useEffect(() => {
    onTabChange?.(tab);
  }, [tab, onTabChange]);

  useEffect(() => {
    const id = tab === "job" ? "tab-job-search" : "tab-major-search";
    const el = document.getElementById(id);
    if (!el || el.disabled) return;
    el.focus({ preventScroll: true });
  }, [tab, initialQuery]);

  const onTabKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTab(tab === "major" ? "job" : "major");
  };

  return (
    <>
      <div role="tablist" aria-label={ko ? "검색 기준" : "How to find a role"} className="mode-tabs">
        <button
          type="button"
          role="tab"
          id="tab-job"
          className="mode-tab mode-tab-job"
          aria-selected={tab === "job"}
          aria-controls="search-panel-job"
          tabIndex={tab === "job" ? 0 : -1}
          onClick={() => setTab("job")}
          onKeyDown={onTabKeyDown}
        >
          {ko ? "직무로 찾기" : "Find by role"}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-major"
          className="mode-tab mode-tab-major"
          aria-selected={tab === "major"}
          aria-controls="search-panel-major"
          tabIndex={tab === "major" ? 0 : -1}
          onClick={() => setTab("major")}
          onKeyDown={onTabKeyDown}
        >
          {ko ? "전공으로 찾기" : "Find by major"}
        </button>
      </div>

      <section className="mode-panel mode-panel-major" id="search-panel-major" hidden={tab !== "major"}>
        <MajorTab ko={ko} onOpenReport={onOpenReport} />
      </section>
      <section className="mode-panel mode-panel-job" id="search-panel-job" hidden={tab !== "job"}>
        <JobTab
          ko={ko}
          onPickSuggestItem={onPickSuggestItem}
          onOpenReport={onOpenReport}
          initialQuery={initialQuery}
        />
      </section>
    </>
  );
}
