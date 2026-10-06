import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../AppContext";
import { JobAnalysisEntry } from "../components/analysis-page/JobAnalysisEntry.jsx";
import ReportIntegrated from "../ReportIntegrated";
import { ReportLoadingPanel } from "../components/report/ReportLoadingPanel.jsx";
import { ReportShareBar } from "../components/report/ReportShareBar.jsx";
import { LibraryToast } from "../components/my-reports/LibraryToast.jsx";
import { SaveToCareerLibrary } from "../components/report/SaveToCareerLibrary.jsx";
import { isReviewContractParam, isPositionMapV2ReviewParam, isPositionMapV2CalibrationParam, isProductionCandidateReviewParam, REVIEW_CONTRACT_PRODUCTION_CANDIDATE, REVIEW_SOCS } from "../reviewContract.js";
import { hasRepresentativeChain } from "../components/report/selectRepresentativeSituations.js";
import { buildFutureCompetitivenessUrl } from "../fcUrl.js";
import { resolveApiBase } from "../apiBase.js";
import { formatOccupationUserFacing } from "../occupationUserFacing.js";
import { buildFinalReportUrl } from "../kr/finalReportUrl.js";
import "../components/analysis-page/analysis-page.css";
import "../components/report/report-cta.css";

const CALIBRATION_ANCHOR_SOC = "";

function candidateShellReport(soc, payload) {
  const titles = REVIEW_SOCS.find((x) => x.soc === soc);
  const titleKo = payload?.occupation_ko || titles?.titleKo || soc;
  const titleEn = payload?.occupation_en || titles?.titleEn || soc;
  return {
    profile: {
      soc_code: soc,
      occupation_title: titleKo,
      occupation_title_en: titleEn,
      occupation_title_ko: titleKo,
    },
    work_scenarios: [],
    representative_selection: null,
    career_narrative_meta: { review_shell: true },
    _production_candidate_shell: true,
  };
}

export function JobAnalysisPage({ embedded = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saveToast, setSaveToast] = useState("");
  const initialSoc = (searchParams.get("soc") || "").trim();
  /** Avoid entry-landing flash when URL already targets a SOC (e.g. review list → detail). */
  const [showEntryUi, setShowEntryUi] = useState(() => !initialSoc);
  /** true일 때만 본문 인라인 리포트 표시 (SOC 없는 랜딩에서는 false) */
  const [inlineReportActive, setInlineReportActive] = useState(() => Boolean(initialSoc));
  /** job search (default) vs major search discovery mode — does not alter occupationSearch. */
  const [majorSearchMode, setMajorSearchMode] = useState(false);
  const lastLoadKeyRef = useRef("");
  const reviewInFlightRef = useRef("");
  const ctx = useAppContext();
  const {
    lang,
    setSocCode,
    jobSearchInput,
    setJobSearchInput,
    loading,
    error,
    report,
    scatter,
    authUser,
    authToken,
    openAuthModal,
    recentSaving,
    librarySaved,
    saveCurrentReportToRecent,
    jobAnalysisMode,
    setJobAnalysisMode,
    jobDescText,
    setJobDescText,
    descMatchLoading,
    descMatchItems,
    descMatchNotice,
    setDescMatchNotice,
    handleSubmit,
    handleSuggestInput,
    runDescriptionOccupationSearch,
    loadReport,
    suggestItems,
    showSuggest,
    setShowSuggest,
    setSuggestItems,
    suggestContainerRef,
    jobSearchInputRef,
    jobDescTextareaRef,
  } = ctx;

  const isJobAnalysisRoute =
    location.pathname === "/" ||
    location.pathname === "/job-analysis" ||
    location.pathname === "/future-competitiveness";
  const reviewMode = isReviewContractParam(searchParams.get("review_contract"));
  const candidateMode = isProductionCandidateReviewParam(searchParams.get("review_contract"));
  const requestedSoc = (searchParams.get("soc") || "").trim();
  const urlSoc = requestedSoc;
  const [candidateReport, setCandidateReport] = useState(null);
  const reportMatchesUrl = Boolean(urlSoc) && report?.profile?.soc_code === urlSoc;
  const candidateMatchesUrl =
    Boolean(urlSoc) && candidateReport?.profile?.soc_code === urlSoc;
  const chainReady = !reviewMode || (reportMatchesUrl && hasRepresentativeChain(report));
  const activeReport = candidateMode && candidateMatchesUrl ? candidateReport : report;
  const activeMatchesUrl = candidateMode ? candidateMatchesUrl : reportMatchesUrl;

  // calibration=7soc without soc → anchor accountant so the report shell can load (review-only).
  useEffect(() => {
    if (!isJobAnalysisRoute && !embedded) return;
    const rc = searchParams.get("review_contract");
    const cal = searchParams.get("calibration");
    if (
      isPositionMapV2ReviewParam(rc) &&
      isPositionMapV2CalibrationParam(cal) &&
      !requestedSoc
    ) {
      const next = new URLSearchParams(searchParams);
      next.set("soc", CALIBRATION_ANCHOR_SOC);
      if (!next.get("tab")) next.set("tab", "analysis");
      navigate(`${location.pathname}?${next.toString()}`, { replace: true });
    }
  }, [
    isJobAnalysisRoute,
    embedded,
    searchParams,
    requestedSoc,
    navigate,
    location.pathname,
  ]);

  const goToJob = useCallback(
    (soc) => {
      const c = String(soc || "").trim();
      if (!c) return;
      // KR landing: converge on Final Report jobCd URL (same helper as Major Search).
      // Soft navigate → RootEntry/FinalReportMissingPage; Golden5 hard-replaces to V28 HTML.
      if (location.pathname === "/" || location.pathname === "/job-analysis") {
        navigate(buildFinalReportUrl(c));
        return;
      }
      navigate(
        buildFutureCompetitivenessUrl({
          soc: c,
          tab: "analysis",
          search: location.search,
          pathname: location.pathname,
        }),
      );
    },
    [navigate, location.search, location.pathname],
  );

  const goToLanding = useCallback(() => {
    navigate(
      buildFutureCompetitivenessUrl({
        soc: null,
        tab: "analysis",
        search: location.search,
        pathname: location.pathname,
      }),
    );
  }, [navigate, location.search, location.pathname]);

  useEffect(() => {
    if (!isJobAnalysisRoute && !embedded) return;
    const st = location.state;
    if (!st) return;
    if (st.jobMode === "title") {
      setJobAnalysisMode("title");
    }
    const runFocus = () => {
      if (st.focusField === "search") jobSearchInputRef.current?.focus();
    };
    requestAnimationFrame(() => requestAnimationFrame(runFocus));
  }, [
    location.pathname,
    location.state,
    setJobAnalysisMode,
    jobSearchInputRef,
    jobDescTextareaRef,
    isJobAnalysisRoute,
    embedded,
  ]);

  useEffect(() => {
    if (!isJobAnalysisRoute && !embedded) return;
    if (!urlSoc) {
      lastLoadKeyRef.current = "";
      reviewInFlightRef.current = "";
      setShowEntryUi(true);
      setInlineReportActive(false);
      setCandidateReport(null);
      return;
    }
    if (candidateMode) {
      const loadKey = `candidate:${urlSoc}:${REVIEW_CONTRACT_PRODUCTION_CANDIDATE}`;
      if (lastLoadKeyRef.current === loadKey && candidateMatchesUrl) {
        setInlineReportActive(true);
        setShowEntryUi(false);
        return;
      }
      lastLoadKeyRef.current = loadKey;
      setSocCode(urlSoc);
      setJobSearchInput(urlSoc);
      setInlineReportActive(true);
      setShowEntryUi(false);
      // Optimistic shell so list→detail navigation does not flash entry landing.
      setCandidateReport((prev) =>
        prev?.profile?.soc_code === urlSoc ? prev : candidateShellReport(urlSoc, null),
      );
      const base = resolveApiBase();
      const url = `${base}/jobs/${encodeURIComponent(urlSoc)}/task-analysis?review_contract=${encodeURIComponent(
        REVIEW_CONTRACT_PRODUCTION_CANDIDATE,
      )}&lang=${encodeURIComponent(lang === "en" ? "en" : "ko")}`;
      let cancelled = false;
      fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then((payload) => {
          if (!cancelled) setCandidateReport(candidateShellReport(urlSoc, payload));
        })
        .catch(() => {
          if (!cancelled) setCandidateReport(candidateShellReport(urlSoc, null));
        });
      return () => {
        cancelled = true;
      };
    }
    const loadKey = `${reviewMode ? "review" : "prod"}:${urlSoc}:${searchParams.get("review_contract") || ""}`;
    const sameSoc = report?.profile?.soc_code === urlSoc;
    const chainOk = !reviewMode || hasRepresentativeChain(report);
    if (sameSoc && chainOk) {
      lastLoadKeyRef.current = loadKey;
      reviewInFlightRef.current = "";
      setInlineReportActive(true);
      setShowEntryUi(false);
      return;
    }
    if (reviewMode && reviewInFlightRef.current === loadKey) return;
    if (lastLoadKeyRef.current === loadKey) {
      setInlineReportActive(true);
      setShowEntryUi(false);
      return;
    }
    lastLoadKeyRef.current = loadKey;
    if (reviewMode) reviewInFlightRef.current = loadKey;
    setSocCode(urlSoc);
    setJobSearchInput(urlSoc);
    setInlineReportActive(true);
    setShowEntryUi(false);
    const req = loadReport(urlSoc, { search: searchParams.toString() });
    if (reviewMode && req && typeof req.finally === "function") {
      req.finally(() => {
        if (reviewInFlightRef.current === loadKey) reviewInFlightRef.current = "";
      });
    }
  }, [
    searchParams,
    urlSoc,
    report?.profile?.soc_code,
    report,
    setSocCode,
    setJobSearchInput,
    loadReport,
    reviewMode,
    candidateMode,
    candidateMatchesUrl,
    isJobAnalysisRoute,
    embedded,
    lang,
  ]);

  const ko = lang === "ko";
  const hasReport = Boolean(activeReport?.profile) && activeMatchesUrl;

  const handlePickSuggestItem = useCallback(
    (item) => {
      const soc = String(item?.soc_code || "").trim();
      if (!soc) return;
      const title = (item.occupation_title || "").trim();
      setJobSearchInput(title || soc);
      setSocCode(soc);
      setShowSuggest(false);
      setSuggestItems([]);
      goToJob(soc);
    },
    [goToJob, setJobSearchInput, setSocCode, setShowSuggest, setSuggestItems],
  );

  const handleAnalysisSubmit = async (e) => {
    const resolvedSoc = await handleSubmit(e, { skipLoad: true });
    if (!resolvedSoc) return;
    goToJob(resolvedSoc);
  };

  const loadReportInline = useCallback(
    (code) => {
      goToJob(code);
    },
    [goToJob],
  );

  useEffect(() => {
    if (hasReport && inlineReportActive && urlSoc) {
      setShowEntryUi(false);
    }
  }, [hasReport, inlineReportActive, urlSoc]);

  const currentReviewLoadKey = `${reviewMode ? "review" : "prod"}:${urlSoc}:${searchParams.get("review_contract") || ""}`;
  const showInlineReport = hasReport && inlineReportActive && !showEntryUi && chainReady && activeMatchesUrl;
  const showReviewChainError =
    reviewMode &&
    inlineReportActive &&
    !loading &&
    !chainReady &&
    !showEntryUi &&
    lastLoadKeyRef.current === currentReviewLoadKey &&
    reviewInFlightRef.current === "";

  useEffect(() => {
    if (!showReviewChainError || typeof window === "undefined") return;
    const payload = {
      error: "missing-chain",
      soc: urlSoc || null,
      review_contract: searchParams.get("review_contract") || null,
      work_scenarios: Array.isArray(report?.work_scenarios) ? report.work_scenarios.length : 0,
      selection: report?.representative_selection ? "yes" : "no",
    };
    window.__FC_REVIEW_CHAIN_ERROR__ = payload;
    // eslint-disable-next-line no-console
    console.error("[review-contract] representative chain missing", payload);
  }, [showReviewChainError, urlSoc, searchParams, report]);

  const libraryHref = buildFutureCompetitivenessUrl({
    soc: activeReport?.profile?.soc_code || urlSoc || null,
    tab: "reports",
    search: location.search,
    pathname: location.pathname,
  });

  const handleLibrarySave = useCallback(async () => {
    if (!authUser) {
      openAuthModal?.("login");
      setSaveToast(ko ? "저장하려면 로그인해 주세요." : "Sign in to save this report.");
      return;
    }
    const result = await saveCurrentReportToRecent();
    if (result?.ok) {
      setSaveToast(ko ? "커리어 리포트에 저장되었습니다." : "Saved to Career reports.");
    } else {
      setSaveToast(ko ? "저장하지 못했습니다. 다시 시도해 주세요." : "Could not save. Please try again.");
    }
  }, [authUser, openAuthModal, saveCurrentReportToRecent, ko]);

  const showUrlJobLoading =
    Boolean(urlSoc) &&
    !candidateMode &&
    !showReviewChainError &&
    (!reportMatchesUrl || (reviewMode && !chainReady)) &&
    (loading || inlineReportActive);

  return (
    <>
      {showEntryUi ? (
        <JobAnalysisEntry
          lang={lang}
          jobSearchInput={jobSearchInput}
          handleSuggestInput={handleSuggestInput}
          handleSubmit={handleAnalysisSubmit}
          onPickSuggestItem={handlePickSuggestItem}
          loading={loading}
          jobSearchInputRef={jobSearchInputRef}
          suggestContainerRef={suggestContainerRef}
          showSuggest={showSuggest}
          suggestItems={suggestItems}
          setSocCode={setSocCode}
          setJobSearchInput={setJobSearchInput}
          setShowSuggest={setShowSuggest}
          setSuggestItems={setSuggestItems}
          jobAnalysisMode={jobAnalysisMode}
          setJobAnalysisMode={setJobAnalysisMode}
          majorSearchMode={majorSearchMode}
          setMajorSearchMode={setMajorSearchMode}
          jobDescText={jobDescText}
          setJobDescText={setJobDescText}
          jobDescTextareaRef={jobDescTextareaRef}
          descMatchLoading={descMatchLoading}
          descMatchItems={descMatchItems}
          descMatchNotice={descMatchNotice}
          setDescMatchNotice={setDescMatchNotice}
          runDescriptionOccupationSearch={runDescriptionOccupationSearch}
          loadReport={loadReportInline}
          onOpenJobBrowse={() => navigate("/job-browse")}
          error={error}
        />
      ) : null}

      {showInlineReport && (
        <div className="fc-report-tools">
          <div className="fc-report-tools__identity">
            <button type="button" className="fc-report-tools__back" onClick={goToLanding}>
              ← <span>{ko ? "직무 분석 화면으로" : "Back to analysis"}</span>
            </button>
            <span className="fc-report-tools__divider" aria-hidden="true" />
            <div className="fc-report-tools__title">
              {formatOccupationUserFacing({
                socCode: activeReport.profile.soc_code,
                titleKo: activeReport.profile.occupation_title || activeReport.profile.occupation_title_ko,
                titleEn: activeReport.profile.occupation_title_en,
              }) || activeReport.profile.occupation_title}
            </div>
          </div>
          {!candidateMode ? (
            <div className="fc-report-tools__actions" aria-label={ko ? "리포트 도구" : "Report tools"}>
              <SaveToCareerLibrary
                lang={lang}
                saved={librarySaved}
                saving={recentSaving}
                onSave={handleLibrarySave}
                libraryHref={libraryHref}
                variant="toolbar"
              />
              <ReportShareBar
                variant="compact"
                lang={lang}
                socCode={activeReport.profile.soc_code}
                jobTitle={activeReport.profile.occupation_title}
              />
            </div>
          ) : null}
        </div>
      )}

      {(showEntryUi && loading) || showUrlJobLoading ? <ReportLoadingPanel lang={lang} variant="overlay" /> : null}

      {showInlineReport && (
        <div className="report-view-wrap">
          <ReportIntegrated
            key={`${activeReport.profile.soc_code || "report"}:${
              candidateMode ? "candidate" : reviewMode ? "review" : "prod"
            }`}
            report={activeReport}
            profile={activeReport.profile}
            lang={lang}
            scatter={candidateMode ? null : scatter}
            librarySaved={librarySaved}
            librarySaving={recentSaving}
            onLibrarySave={handleLibrarySave}
            libraryHref={libraryHref}
          />
          {loading && !candidateMode ? <ReportLoadingPanel lang={lang} variant="overlay" /> : null}
        </div>
      )}
      <LibraryToast message={saveToast} onDone={() => setSaveToast("")} />
    </>
  );
}
