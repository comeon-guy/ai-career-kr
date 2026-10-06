import { useCallback, useMemo, useRef, useState } from "react";
import { AppContext } from "../AppContext.jsx";
import { JobAnalysisPage } from "../pages/JobAnalysisPage.jsx";
import { WeseeHeader } from "../components/wesee/WeseeHeader.jsx";
import {
  DEBOUNCE_MS,
  ensureOccupationIndex,
  filterOccupationIndex,
} from "../occupationSearch.js";

/**
 * KR landing AppContext: reconnects existing occupationSearch.js chain
 * (no stubs). JobAnalysisPage entry UI + Major Search share this shell.
 */
function useLandingAppValue() {
  const [jobSearchInput, setJobSearchInput] = useState("");
  const [socCode, setSocCode] = useState("");
  const [jobAnalysisMode, setJobAnalysisMode] = useState("title");
  const [jobDescText, setJobDescText] = useState("");
  const [suggestItems, setSuggestItems] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [error, setError] = useState("");
  const jobSearchInputRef = useRef(null);
  const suggestContainerRef = useRef(null);
  const jobDescTextareaRef = useRef(null);
  const debounceRef = useRef(null);

  const handleSuggestInput = useCallback((e) => {
    const value = e?.target?.value ?? "";
    setJobSearchInput(value);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = String(value).trim();
    if (!q) {
      setSuggestItems([]);
      setShowSuggest(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        await ensureOccupationIndex();
        const { items } = filterOccupationIndex(value, { lang: "ko", limit: 15 });
        setSuggestItems(items);
        setShowSuggest(items.length > 0);
      } catch {
        setSuggestItems([]);
        setShowSuggest(false);
        setError("직무 검색 인덱스를 불러오지 못했습니다.");
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const q = String(jobSearchInput || "").trim();
      if (!q) return null;
      try {
        await ensureOccupationIndex();
        const { items } = filterOccupationIndex(q, { lang: "ko", limit: 15 });
        const qLower = q.toLowerCase();
        const exact =
          items.find((it) => String(it.soc_code || "").toLowerCase() === qLower) ||
          items.find((it) => String(it.occupation_title || "").trim() === q) ||
          null;
        const hit = exact || items[0] || null;
        if (!hit?.soc_code) {
          setError("일치하는 직무를 찾지 못했습니다.");
          setShowSuggest(false);
          return null;
        }
        setSocCode(hit.soc_code);
        setJobSearchInput(hit.occupation_title || hit.soc_code);
        setSuggestItems([]);
        setShowSuggest(false);
        setError("");
        return hit.soc_code;
      } catch {
        setError("직무 검색에 실패했습니다.");
        return null;
      }
    },
    [jobSearchInput],
  );

  return useMemo(
    () => ({
      lang: "ko",
      setLang: () => {},
      socCode,
      setSocCode,
      jobSearchInput,
      setJobSearchInput,
      loading: false,
      error,
      report: null,
      scatter: null,
      authUser: null,
      authToken: null,
      openAuthModal: () => {},
      recentSaving: false,
      librarySaved: false,
      saveCurrentReportToRecent: async () => ({ ok: false }),
      jobAnalysisMode,
      setJobAnalysisMode,
      jobDescText,
      setJobDescText,
      descMatchLoading: false,
      descMatchItems: [],
      descMatchNotice: "",
      setDescMatchNotice: () => {},
      handleSubmit,
      handleSuggestInput,
      runDescriptionOccupationSearch: async () => {},
      loadReport: async () => null,
      suggestItems,
      showSuggest,
      setShowSuggest,
      setSuggestItems,
      suggestContainerRef,
      jobSearchInputRef,
      jobDescTextareaRef,
    }),
    [
      socCode,
      jobSearchInput,
      error,
      jobAnalysisMode,
      jobDescText,
      handleSubmit,
      handleSuggestInput,
      suggestItems,
      showSuggest,
    ],
  );
}

export function KrLandingShell() {
  const value = useLandingAppValue();
  return (
    <AppContext.Provider value={value}>
      <div className="wesee-shell is-analysis">
        <WeseeHeader />
        <JobAnalysisPage />
      </div>
    </AppContext.Provider>
  );
}
