import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WeseeHeader } from "../components/wesee/WeseeHeader.jsx";
import { publicUrl } from "../publicUrl.js";

export default function WeseeLandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/job-analysis?q=${encodeURIComponent(q)}` : "/job-analysis");
  }

  return (
    <div className="wesee-shell">
      <WeseeHeader />
      <main className="page">
        <section className="hero" id="top">
          <div className="wrap global-container">
            <h1 className="display">
              AI 시대,
              <br />
              내 직업은 어떻게 달라질까
            </h1>
            <p className="hero-lead">
              실제 업무를 기준으로 AI가 도울 수 있는 일과 사람의 판단이 중요한 일을 구분합니다.
            </p>
            <form className="search" id="job-search" onSubmit={onSubmit}>
              <label className="search-field">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" stroke="#8ca0ba" strokeWidth="1.8"></circle>
                  <path d="M16 16L20 20" stroke="#8ca0ba" strokeWidth="1.8" strokeLinecap="round"></path>
                </svg>
                <input
                  id="landing-job-input"
                  type="search"
                  autoComplete="off"
                  placeholder="직업명을 입력하세요 (예: 간호사, 회계사, 제품·광고 영업원)"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button className="landing-search-go" type="submit">
                검색&nbsp; →
              </button>
            </form>
            <div className="stats">
              <div className="stat">
                <strong>492개</strong>
                <span>분석 대상 직업</span>
              </div>
              <div className="stat">
                <strong>3,880개</strong>
                <span>실제 업무 분석</span>
              </div>
              <div className="stat">
                <strong>Work24</strong>
                <span>직업·업무 정보 기반</span>
              </div>
            </div>
          </div>
        </section>

        <section className="questions" id="questions">
          <div className="wrap global-container">
            <div className="kicker">
              <span>Key Questions</span>
            </div>
            <h2 className="display">이런 질문에 답합니다</h2>
            <div className="question-grid">
              <article className="question">
                <div className="q-index">01</div>
                <h3>
                  내 업무에서
                  <br />
                  무엇이 달라지는가
                </h3>
                <p>직업 전체가 아니라 실제 업무 하나하나에서 AI가 어떤 역할을 하는지 보여드립니다.</p>
              </article>
              <article className="question">
                <div className="q-index">02</div>
                <h3>
                  사람의 어떤 역할이
                  <br />
                  더 중요해지는가
                </h3>
                <p>AI가 널리 쓰일수록 차별화되는 사람의 역할이 무엇인지, 더 중요한 역량을 구분합니다.</p>
              </article>
              <article className="question">
                <div className="q-index">03</div>
                <h3>
                  그래서 무엇을
                  <br />
                  준비해야 하는가
                </h3>
                <p>앞으로 더 중요해지는 역량과 지금부터 준비할 수 있는 방향을 제시합니다.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="sample" id="sample">
          <div className="wrap sample-core-v26 global-container">
            <div className="sample-core-head">
              <div className="kicker">
                <span>Sample Report</span>
              </div>
              <h2 className="display">내 직업의 변화를 한눈에 확인해 보세요.</h2>
            </div>
            <figure className="sample-core-report">
              <div className="sample-core-paper">
                <div className="sample-report-meta">예시 직업 · 회계사</div>
                <nav className="sample-report-toc" aria-label="샘플 보고서 목차">
                  <span className="sample-report-toc-item is-current">
                    <b>01</b> AI 시대의 역할 변화
                  </span>
                  <span className="sample-report-toc-item">
                    <b>02</b> 업무 가치 변화
                  </span>
                  <span className="sample-report-toc-item">
                    <b>03</b> 앞으로 중요한 경쟁력
                  </span>
                  <span className="sample-report-toc-item">
                    <b>04</b> AI를 활용하는 방식
                  </span>
                  <span className="sample-report-toc-item sample-report-toc-source">분석 근거</span>
                </nav>
                <div className="sample-report-crop">
                  <img src={publicUrl("/assets/wesee/sample-report.png")} alt="AI 시대, 이 직업은 어떻게 달라지나 — 업무 분포도" />
                  <span className="sample-report-index-mask" aria-hidden="true"></span>
                </div>
              </div>
            </figure>
          </div>
        </section>
      </main>
    </div>
  );
}
