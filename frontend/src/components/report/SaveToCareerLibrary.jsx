import { Link } from "react-router-dom";

/**
 * Explicit Career Report Library save. Same action in hero / closing / toolbar.
 */
export function SaveToCareerLibrary({
  lang = "ko",
  saved = false,
  saving = false,
  onSave,
  libraryHref = "",
  variant = "hero",
}) {
  const ko = lang === "ko";
  const label = saving
    ? ko
      ? "저장 중…"
      : "Saving…"
    : saved
      ? ko
        ? "저장됨"
        : "Saved"
      : ko
        ? "커리어 리포트에 저장"
        : "Save to Career reports";

  return (
    <div className={`er-library-save er-library-save--${variant}`}>
      <button
        type="button"
        className={
          variant === "toolbar" && !saved
            ? "fc-btn primary"
            : "er-library-save__btn" + (saved ? " er-library-save__btn--saved" : "")
        }
        disabled={saving || saved}
        aria-pressed={saved}
        aria-busy={saving}
        aria-label={label}
        onClick={() => {
          if (saving || saved) return;
          onSave?.();
        }}
      >
        {label}
      </button>
      {saved && libraryHref ? (
        <Link className="er-library-save__view" to={libraryHref}>
          {ko ? "커리어 리포트 보기" : "Open Career reports"}
        </Link>
      ) : null}
    </div>
  );
}
