import { useEffect, useRef, useState } from "react";
import { publicUrl } from "../../publicUrl.js";
import "./report-drawer.css";

function retargetPageSelectors(css) {
  return String(css || "").replace(/(^|[^\w-])(html|body)(?![\w-])/g, "$1:host");
}

const NARROW_FIT = [
  '.floating-nav[data-nav-mode="fixed-top"]{overflow:hidden !important;max-width:100%;}',
  ".floating-nav .floating-nav-track{max-width:100%;min-width:0;padding-left:0 !important;grid-template-columns:222px minmax(0,1fr) !important;}",
  "@media (max-width:900px){.floating-nav .floating-nav-track{grid-template-columns:auto minmax(0,1fr) !important;}}",
  ".floating-nav .floating-nav-inner{min-width:0;overflow-x:auto !important;overflow-y:hidden;scrollbar-width:none;}",
  ".floating-nav .floating-nav-inner::-webkit-scrollbar{display:none}",
  ".floating-nav .floating-nav-inner a{flex:0 0 auto;}",
  '.floating-nav .floating-nav-inner a[data-section="reference-info"]{margin-left:auto !important;}',
  ".floating-nav .top-brand{visibility:hidden !important;}",
  ".floating-nav{position:sticky !important;top:0 !important;left:auto !important;right:auto !important;width:100% !important;z-index:5 !important;}",
  ".report{max-width:none !important;width:auto !important;margin-left:0 !important;margin-right:0 !important;padding-top:0 !important;border-top-left-radius:12px !important;}",
  ".masthead .title{margin-top:78px !important;}",
].join("");

const VALUE_COMPARISON_FIT = [
  "#s2 .value-comparison-note-label{font-size:13.25px !important;}",
  "#s2 .value-comparison-note > p{padding-left:32px !important;}",
].join("");

function fitFutureCompetitionIntro(root) {
  const el = root.querySelector("#s3 .future-competition-intro");
  if (!el) return;
  if (!el.querySelector("br") && el.dataset.occ2Line !== "1") return;
  el.querySelectorAll("br").forEach((node) => node.remove());
  el.dataset.occ2Line = "1";
  const sample = root.querySelector("#s3 .future-competition-item p");
  const size = sample ? getComputedStyle(sample).fontSize : "13.25px";
  el.style.setProperty("font-size", size, "important");
  el.style.setProperty("white-space", "normal", "important");
  el.style.setProperty("width", "auto", "important");
  el.style.setProperty("max-width", "870px", "important");
  el.style.setProperty("margin-left", "0px", "important");
}

export function ReportDrawer({ jobCd, presentation = "drawer", restoreScroll = 0, onClose, onOpenJob }) {
  const hostRef = useRef(null);
  const drawerRef = useRef(null);
  const closeRef = useRef(null);
  const fitRef = useRef(null);
  const presentationRef = useRef(presentation);
  const [status, setStatus] = useState("loading");
  presentationRef.current = presentation;
  const full = presentation === "full";
  useEffect(() => {
    if (!jobCd) return undefined;
    const y = restoreScroll;
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, y);
    };
  }, [jobCd, restoreScroll]);

  useEffect(() => {
    if (!jobCd) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [jobCd, onClose]);

  useEffect(() => {
    if (!jobCd || !hostRef.current) return undefined;
    const host = hostRef.current;
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    const controller = new AbortController();
    setStatus("loading");
    root.replaceChildren();

    fetch(publicUrl(`/jobs/${encodeURIComponent(jobCd)}/final-report/index.html`), {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(`report ${response.status}`);
        const html = await response.text();
        if (controller.signal.aborted) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const main = doc.querySelector("main.report");
        if (!main) throw new Error("report missing");

        const base = document.createElement("style");
        base.textContent = ":host{display:block;min-height:100%;background:#fff;}";
        root.appendChild(base);
        doc.querySelectorAll("style").forEach((node) => {
          const copy = document.createElement("style");
          copy.textContent = retargetPageSelectors(node.textContent || "");
          root.appendChild(copy);
        });
        doc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
          const href = node.getAttribute("href");
          if (!href) return;
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          root.appendChild(link);
        });
        const fit = document.createElement("style");
        fit.textContent = `${presentationRef.current === "full" ? "" : NARROW_FIT}${VALUE_COMPARISON_FIT}`;
        fitRef.current = fit;
        root.appendChild(fit);
        root.appendChild(document.importNode(main, true));
        requestAnimationFrame(() => {
          if (!controller.signal.aborted) fitFutureCompetitionIntro(root);
        });
        root.addEventListener("click", (event) => {
          const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
          if (!anchor || !anchor.closest(".floating-nav")) return;
          const href = anchor.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return;
          const target = root.getElementById(href.slice(1));
          const scroller = host.parentElement;
          if (!target || !scroller) return;
          event.preventDefault();
          event.stopPropagation();
          const nav = root.querySelector(".floating-nav");
          const navHeight = nav?.getBoundingClientRect().height || 0;
          const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - navHeight;
          scroller.scrollTo(0, Math.max(0, top));
        }, { signal: controller.signal });
        if (!controller.signal.aborted) setStatus("ready");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        root.replaceChildren();
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => {
      controller.abort();
      fitRef.current = null;
    };
  }, [jobCd]);

  useEffect(() => {
    if (fitRef.current) fitRef.current.textContent = `${full ? "" : NARROW_FIT}${VALUE_COMPARISON_FIT}`;
  }, [full, status]);

  useEffect(() => {
    if (!jobCd || full) return undefined;
    const drawer = drawerRef.current;
    if (!drawer) return undefined;
    const sync = () => {
      const wrap = document.querySelector(".header .wrap");
      drawer.style.top = wrap ? `${wrap.getBoundingClientRect().bottom}px` : "";
      const tab = document.querySelector("#tab-major");
      if (window.innerWidth <= 700 || !tab) {
        drawer.style.left = "";
        drawer.style.width = "";
        drawer.style.maxWidth = "";
        drawer.style.minWidth = "";
      } else {
        const right = tab.getBoundingClientRect().right;
        drawer.style.left = `${right - 1}px`;
        drawer.style.width = "auto";
        drawer.style.maxWidth = "none";
        drawer.style.minWidth = "0px";
      }
      const logo = drawer.querySelector(".report-drawer-brand");
      const close = drawer.querySelector(".report-drawer-chrome-close");
      const track = hostRef.current?.shadowRoot?.querySelector(".floating-nav-track");
      if (!logo || !close || !track) return;
      const drawerBox = drawer.getBoundingClientRect();
      const trackBox = track.getBoundingClientRect();
      const logoBox = logo.getBoundingClientRect();
      const closeBox = close.getBoundingClientRect();
      const drawerStyle = getComputedStyle(drawer);
      const borderLeft = parseFloat(drawerStyle.borderLeftWidth) || 0;
      const borderRight = parseFloat(drawerStyle.borderRightWidth) || 0;
      const borderTop = parseFloat(drawerStyle.borderTopWidth) || 0;
      const reportRoot = hostRef.current?.shadowRoot;
      if (reportRoot) fitFutureCompetitionIntro(reportRoot);
      logo.style.left = `${trackBox.left - drawerBox.left - borderLeft}px`;
      logo.style.top = `${trackBox.top - drawerBox.top - borderTop + (trackBox.height - logoBox.height) / 2}px`;
      close.style.right = `${drawerBox.right - trackBox.right - borderRight}px`;
      close.style.top = `${trackBox.top - drawerBox.top - borderTop + (trackBox.height - closeBox.height) / 2}px`;
    };
    sync();
    const tab = document.querySelector("#tab-major");
    const wrap = document.querySelector(".header .wrap");
    const observer = new ResizeObserver(sync);
    if (tab) observer.observe(tab);
    if (wrap) observer.observe(wrap);
    if (drawer) observer.observe(drawer);
    const track = hostRef.current?.shadowRoot?.querySelector(".floating-nav-track");
    if (track) observer.observe(track);
    const scroller = drawer.querySelector(".report-drawer-scroll");
    scroller?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      scroller?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      drawer.style.left = "";
      drawer.style.top = "";
      drawer.style.width = "";
      drawer.style.maxWidth = "";
      drawer.style.minWidth = "";
    };
  }, [jobCd, full, status]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof onOpenJob !== "function") return undefined;
    const onOpen = (event) => {
      const id = String(event.detail?.jobCd || "").trim();
      if (!id || id === jobCd) return;
      onOpenJob(id);
    };
    host.addEventListener("occ2-open-job", onOpen);
    return () => host.removeEventListener("occ2-open-job", onOpen);
  }, [jobCd, onOpenJob]);

  useEffect(() => {
    if (status !== "ready" || !hostRef.current?.shadowRoot) return undefined;
    const scope = hostRef.current.shadowRoot;
    let cancelled = false;
    const run = () => {
      if (cancelled || typeof window.bootOccupationScatter !== "function") return;
      window.bootOccupationScatter(scope);
    };
    if (typeof window.bootOccupationScatter === "function") {
      run();
      return () => {
        cancelled = true;
      };
    }
    let script = document.querySelector("script[data-occ2-runtime='1']");
    if (!script) {
      script = document.createElement("script");
      script.src = publicUrl("/occupation-2axis/scatter-runtime.js");
      script.dataset.occ2Runtime = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", run);
    return () => {
      cancelled = true;
      script.removeEventListener("load", run);
    };
  }, [status, jobCd]);

  if (!jobCd) return null;

  return (
    <>
    {full ? null : <div className="report-drawer-backdrop" onClick={onClose} />}
    <div ref={drawerRef} className={`report-drawer${full ? " is-full" : ""}`} role="dialog" aria-modal="true" aria-label="직업 분석 보고서">
      <div className="report-drawer-scroll">
        {status === "loading" ? (
          <p className="report-drawer-status" role="status">
            보고서를 불러오는 중입니다.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="report-drawer-status" role="alert">
            보고서를 불러오지 못했습니다.
          </p>
        ) : null}
        <div ref={hostRef} className="report-drawer-host" hidden={status !== "ready"} />
      </div>
      {full ? (
        <button ref={closeRef} type="button" className="report-full-close" aria-label="닫기" onClick={onClose}>
          ×
        </button>
      ) : (
        <>
          <a className="report-drawer-brand" href={publicUrl("/")} aria-label="WESEE 홈">
            <img src={publicUrl("/assets/wesee/WESEE_logo_transparent.png")} alt="WESEE" />
          </a>
          <button ref={closeRef} type="button" className="report-full-close report-drawer-chrome-close" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </>
      )}
    </div>
    </>
  );
}
