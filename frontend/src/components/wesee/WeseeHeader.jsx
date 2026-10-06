import { Link, useLocation } from "react-router-dom";
import { publicUrl } from "../../publicUrl.js";

export function WeseeHeader() {
  const location = useLocation();
  const onAnalysis = location.pathname === "/job-analysis";

  return (
    <header className="header site-header global-site-header">
      <div className="wrap site-header-inner global-container">
        <Link className="brand global-home-link wesee-brand" to="/" aria-label="WESEE 홈">
          <img className="wesee-logo" src={publicUrl("/assets/wesee/WESEE_logo_transparent.png")} alt="WESEE" />
        </Link>
        <nav className="site-nav" aria-label="주요 메뉴">
          <Link
            className={`site-nav-link site-nav-analysis${onAnalysis ? " is-current" : ""}`}
            to="/job-analysis"
          >
            직업 분석
          </Link>
        </nav>
        <a
          className="site-login"
          href="#login"
          aria-label="로그인"
          onClick={(event) => event.preventDefault()}
        >
          로그인
        </a>
      </div>
    </header>
  );
}
