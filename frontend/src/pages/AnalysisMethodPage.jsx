/** KR analysis method reference — Work24 / 3-axis / scenarios (no US SOC). */
export function AnalysisMethodPage({ embedded = false } = {}) {
  return (
    <div
      className="kr-analysis-method"
      data-kr-method-page="work24-3axis-v1"
      data-embedded={embedded ? "1" : "0"}
    >
      <h3>분석 방법 (KR)</h3>
      <ol>
        <li>
          <strong>원천 데이터</strong> — 한국 직업정보(Work24) 수행직무 문장. 본
          Golden은 회계사 <code>K000007449</code>의 execJob 문장(T01–T10)을
          변경 없이 사용합니다.
        </li>
        <li>
          <strong>3축 판정</strong> — 각 수행직무에 대해 자동화 적합도, AI 보강
          적합도, 사람 판단 요구도를 독립적으로 판정합니다. 세 축의 합이 100%일
          필요는 없습니다.
        </li>
        <li>
          <strong>업무 상황(WS)</strong> — 수행직무를 주제로 묶어 WS01–WS06을
          구성하고, 대표 상황은 KR_REP_V1 규칙으로 선정합니다.
        </li>
        <li>
          <strong>AI Working</strong> — 각 상황에서 기준으로 AI가 지원하는 구간과
          사람에게 남는 판단을 Golden 산출물에서 연결합니다. 미국 SOC 결과를
          쓰지 않습니다.
        </li>
      </ol>
      <p>
        중요도·수행빈도·job_share 평가값이 없는 경우 비중을 추정해 만들지
        않습니다. 상세 산출물은{" "}
        <code>KR_ACCOUNTANT_GOLDEN_V1</code>에 고정되어 있습니다.
      </p>
    </div>
  );
}

export default AnalysisMethodPage;
