import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LandingTabSearch } from "./LandingTabSearch.jsx";
import { ReportDrawer } from "./ReportDrawer.jsx";

export function JobAnalysisEntry({ lang, onPickSuggestItem }) {
  const ko = lang === "ko";
  const [params] = useSearchParams();
  const [mode, setMode] = useState("job");
  const [drawerJobCd, setDrawerJobCd] = useState(null);
  const [drawerScroll, setDrawerScroll] = useState(0);
  const [fullView, setFullView] = useState(false);
  const drawerHistoryRef = useRef(false);
  const returnContextRef = useRef(null);
  const onTabChange = useCallback((next) => setMode(next), []);
  const initialQuery = params.get("q") || "";

  const captureReturnContext = useCallback(() => {
    const majorQuery = document.querySelector("#tab-major-search");
    const jobQuery = document.querySelector("#tab-job-search");
    const majorOpen = document.querySelector(".search-page-view")?.classList.contains("is-major");
    return {
      route: `${window.location.pathname}${window.location.search}`,
      query: (majorOpen ? majorQuery?.value : jobQuery?.value) || "",
      searchMode: majorOpen ? "major" : "job",
      scrollY: window.scrollY,
    };
  }, []);

  const openReportDrawer = useCallback((jobCd) => {
    const id = String(jobCd || "").trim();
    if (!id) return;
    if (!returnContextRef.current) returnContextRef.current = captureReturnContext();
    setDrawerScroll(returnContextRef.current.scrollY);
    const nextState = { ...(window.history.state || {}), reportDrawer: id };
    if (drawerHistoryRef.current) window.history.replaceState(nextState, "");
    else window.history.pushState(nextState, "");
    drawerHistoryRef.current = true;
    setFullView(false);
    setDrawerJobCd(id);
  }, [captureReturnContext]);

  const clearDrawerHistory = useCallback(() => {
    if (!drawerHistoryRef.current) return;
    const nextState = { ...(window.history.state || {}) };
    delete nextState.reportDrawer;
    window.history.replaceState(nextState, "");
    drawerHistoryRef.current = false;
  }, []);

  const closeReportDrawer = useCallback(() => {
    if (drawerHistoryRef.current) {
      drawerHistoryRef.current = false;
      returnContextRef.current = null;
      window.history.back();
      return;
    }
    returnContextRef.current = null;
    setFullView(false);
    setDrawerJobCd(null);
  }, []);

  const openFullView = useCallback(() => {
    if (!returnContextRef.current) returnContextRef.current = captureReturnContext();
    setFullView(true);
  }, [captureReturnContext]);

  const closeFullView = useCallback(() => {
    clearDrawerHistory();
    returnContextRef.current = null;
    setFullView(false);
    setDrawerJobCd(null);
  }, [clearDrawerHistory]);

  useEffect(() => {
    const onPopState = () => {
      const id = String(window.history.state?.reportDrawer || "").trim();
      drawerHistoryRef.current = Boolean(id);
      if (!id) {
        returnContextRef.current = null;
        setFullView(false);
      }
      setDrawerJobCd(id || null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const root = document.querySelector(".search-page-view");
      if (!root || !root.contains(anchor)) return;
      let jobCd = "";
      try {
        const url = new URL(anchor.getAttribute("href") || "", window.location.origin);
        if (url.origin !== window.location.origin || url.pathname !== "/") return;
        jobCd = String(url.searchParams.get("jobCd") || "").trim();
      } catch {
        return;
      }
      if (!jobCd) return;
      event.preventDefault();
      event.stopPropagation();
      openReportDrawer(jobCd);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [openReportDrawer]);

  return (
    <>
      <section className={`search-page-view ${mode === "major" ? "is-major" : "is-job"}`} aria-label="직무 검색">
        <main className="search-page-shell search-page-main global-container">
          <h1>{ko ? "어떤 기준으로 직무를 찾으시나요?" : "How would you like to find a role?"}</h1>
          <LandingTabSearch
            ko={ko}
            onPickSuggestItem={onPickSuggestItem}
            onOpenReport={openReportDrawer}
            initialQuery={initialQuery}
            onTabChange={onTabChange}
          />
        </main>
      </section>
      <ReportDrawer
        jobCd={drawerJobCd}
        presentation={fullView ? "full" : "drawer"}
        restoreScroll={drawerScroll}
        onClose={fullView ? closeFullView : closeReportDrawer}
        onOpenJob={openReportDrawer}
        onOpenFull={openFullView}
      />
    </>
  );
}
