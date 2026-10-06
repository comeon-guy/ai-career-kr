import { useState, useCallback } from "react";
import { IconLinkCopy, IconShare } from "../my-reports/icons.jsx";
import { buildShareReportUrl } from "../../constants/reportCtaCopy.js";
import "./report-cta.css";

/**
 * @param {{ lang: string; socCode?: string; jobTitle?: string; shareUrl?: string; shareKind?: 'job' | 'jd'; variant?: 'inline' | 'compact' | 'card'; disabled?: boolean }} props
 */
export function ReportShareBar({
  lang,
  socCode = "",
  jobTitle,
  shareUrl: shareUrlProp,
  shareKind = "job",
  variant = "inline",
  disabled = false,
}) {
  const [msg, setMsg] = useState("");
  const ko = lang === "ko";
  const soc = (socCode || "").trim();
  const compact = variant === "compact" || variant === "card";

  const shareUrl = shareUrlProp || buildShareReportUrl(soc, lang);

  const shareText =
    shareKind === "jd"
      ? ko
        ? `「${jobTitle || "채용공고"}」 채용공고 분석 리포트 — AIFit`
        : `Job posting analysis report for 「${jobTitle || "posting"}」 — AIFit`
      : ko
        ? `「${jobTitle || soc}」 AI 시대 커리어 전략 리포트 — AIFit`
        : `AI-era career strategy report for 「${jobTitle || soc}」 — AIFit`;

  const flash = useCallback((text) => {
    setMsg(text);
    const t = setTimeout(() => setMsg(""), 2800);
    return () => clearTimeout(t);
  }, []);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash(ko ? "링크가 복사되었습니다." : "Link copied.");
    } catch {
      flash(ko ? "복사에 실패했습니다." : "Copy failed.");
    }
  };

  const nativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: jobTitle || "AIFit Report",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  if (!shareUrl) return null;

  return (
    <div
      className={
        "report-share-bar" +
        (variant === "card" ? " report-share-bar--card" : "") +
        (variant === "compact" ? " report-share-bar--compact" : "")
      }
      role="group"
      aria-label={ko ? "리포트 공유" : "Share report"}
    >
      {!compact ? <span className="report-share-bar__label">{ko ? "공유" : "Share"}</span> : null}
      <button
        type="button"
        className="report-share-bar__btn report-share-bar__btn--icon report-icon-btn"
        onClick={copyLink}
        disabled={disabled}
        aria-label={ko ? "링크 복사" : "Copy link"}
        title={ko ? "링크 복사" : "Copy link"}
      >
        <IconLinkCopy strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="report-share-bar__btn report-share-bar__btn--icon report-icon-btn"
        onClick={nativeShare}
        disabled={disabled}
        aria-label={ko ? "공유하기" : "Share"}
        title={ko ? "공유하기" : "Share"}
      >
        <IconShare strokeWidth={1.75} />
      </button>
      {msg ? (
        <span className="report-share-bar__msg" role="status">
          {msg}
        </span>
      ) : null}
    </div>
  );
}
