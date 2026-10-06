/** inline SVG icons (my-reports UI) */

export function IconSearch(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.8-3.8" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconOpenReport(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H6.8C5.8 5 5 5.8 5 6.8v10.4C5 18.2 5.8 19 6.8 19h10.4c1 0 1.8-.8 1.8-1.8V15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5h6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5 9.5 14.5" />
    </svg>
  );
}

/** AI 영향도 — 스파크/자동화 */
export function IconMetricAi(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6l1.4 1.4M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4l1.4-1.4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 9.5v5M9.5 12h5" />
    </svg>
  );
}

/** 사람 판단 중요도 */
export function IconMetricHuman(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 10.5l1.5 1.5L20 9.5" />
    </svg>
  );
}

/** AI 협업형 비중 — 사람 + AI 연결 */
export function IconMetricCollab(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="7.5" cy="9" r="2.25" />
      <path d="M5 18c0-2.2 1.1-4 2.5-4" />
      <rect x="13.5" y="7.5" width="5.5" height="6.5" rx="1.2" />
      <path d="M14.5 10.5h3.5M16.25 9v3" />
      <path d="M9.75 9.5l3.25 2.5" />
    </svg>
  );
}

export function IconDelete(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 14h10l1-14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4h6v3" />
    </svg>
  );
}

export function IconEdit(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

/** 링크 복사 — 겹친 문서(복사) */
export function IconLinkCopy(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 7.5h7.5a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-7.5a2.25 2.25 0 0 1 2.25-2.25Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.875c0-.621.504-1.125 1.125-1.125h7.5c.621 0 1.125.504 1.125 1.125v.375"
      />
    </svg>
  );
}

/** 공유하기 */
export function IconShare(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="18" cy="5" r="2.25" />
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="18" cy="19" r="2.25" />
      <path strokeLinecap="round" d="M8.25 11.1 15.6 7.4M8.25 12.9 15.6 16.6" />
    </svg>
  );
}

export function IconUser(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
    </svg>
  );
}

export function IconGlobe(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.3 5 3.3 8.5s-1.1 6.2-3.3 8.5" />
      <path d="M12 3.5c-2.2 2.3-3.3 5-3.3 8.5s1.1 6.2 3.3 8.5" />
    </svg>
  );
}

/** 직무 분석 — 검색/분석 */
export function IconNavJob(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M4.5 11.5a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" />
      <path d="M9.4 11.5h4.2" />
      <path d="M11.5 9.4v4.2" />
      <path d="M16.7 16.7 20 20" />
    </svg>
  );
}

/** 채용공고 분석 — 문서 */
export function IconNavJd(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M8 5h8l4 4v11H8z" />
      <path d="M16 5v4h4" />
      <path d="M10.5 12.5h7" />
      <path d="M10.5 16h5" />
    </svg>
  );
}

/** 내 리포트 — 컬렉션 */
export function IconNavReports(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M6 14.5h12v5.5H6z" />
      <path d="M8 5.5h12v10H8z" />
    </svg>
  );
}

/** 내 전략 허브 — 나침반/방향 */
export function IconNavStrategyHub(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5v15" />
      <path d="M8.5 8.5 12 4.5l3.5 4" />
      <path d="M8.5 15.5 12 19.5l3.5-4" />
    </svg>
  );
}

/** 비교분석 — 양방향 */
export function IconNavCompare(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M7 8.5h10" />
      <path d="M7 15.5h10" />
      <path d="M5 8.5 7 6.5v4" />
      <path d="M19 15.5 17 17.5v-4" />
    </svg>
  );
}

/** 경험 자산 — 폴더 */
export function IconNavAssets(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M4 7h7l2 2h7v10H4z" />
    </svg>
  );
}

/** 미래 경쟁력 — 성장/방향 */
export function IconNavFuture(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden {...props}>
      <path d="M12 3v18" />
      <path d="M5 8l7-5 7 5" />
      <path d="M5 16l7 5 7-5" />
    </svg>
  );
}

export const NAV_ICON_MAP = {
  "/future-competitiveness": IconNavFuture,
  "/job-analysis": IconNavJob,
  "/my-reports": IconNavReports,
};
