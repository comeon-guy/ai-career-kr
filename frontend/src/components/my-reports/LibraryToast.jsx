import { useEffect } from "react";
import "./my-reports.css";

export function LibraryToast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = window.setTimeout(() => onDone?.(), 2800);
    return () => window.clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="my-reports-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
