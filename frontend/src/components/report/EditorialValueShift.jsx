import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { splitLeadAndSupport } from "../../canonicalPresentationContract.js";

import "./value-shift-balanced.css";



const MOBILE_MQ = "(max-width: 900px)";

const DESKTOP_MIN = 901;



function setPairMinHeight(elements, extra = 14) {

  if (!elements.length) return;

  elements.forEach((el) => {

    if (el) el.style.minHeight = "";

  });

  const max = Math.max(...elements.map((el) => Math.ceil(el?.getBoundingClientRect().height || 0)));

  const target = max + extra;

  elements.forEach((el) => {

    if (el) el.style.minHeight = `${target}px`;

  });

}



function syncShiftGridHeights(gridEl) {

  if (!gridEl) return;

  const taskLists = [...gridEl.querySelectorAll(".shift > .task-list")];

  const notes = [...gridEl.querySelectorAll(".shift > .shift-note")];

  [...taskLists, ...notes].forEach((el) => {

    el.style.minHeight = "";

  });

  if (typeof window !== "undefined" && window.innerWidth < DESKTOP_MIN) return;

  setPairMinHeight(taskLists);

  setPairMinHeight(notes);

}



function reasonList(v) {

  if (!Array.isArray(v)) return [];

  return v

    .map((r) => ({

      title: r?.title == null ? "" : String(r.title).trim(),

      body: r?.body == null ? "" : String(r.body).trim(),

    }))

    .filter((r) => r.body);

}



function itemList(v) {

  if (!Array.isArray(v)) return [];

  return v.map((x) => String(x || "").trim()).filter(Boolean);

}



function padNum(i) {

  return String(i + 1).padStart(2, "0");

}



export default function EditorialValueShift({ data, lang = "ko", report = null }) {

  const gridRef = useRef(/** @type {HTMLElement | null} */ (null));

  void report;



  const runSync = useCallback(() => {

    syncShiftGridHeights(gridRef.current);

  }, []);



  useLayoutEffect(() => {

    runSync();

  }, [runSync, data, lang]);



  useEffect(() => {

    const grid = gridRef.current;

    if (!grid || typeof ResizeObserver === "undefined") {

      window.addEventListener("resize", runSync);

      return () => window.removeEventListener("resize", runSync);

    }

    const ro = new ResizeObserver(() => runSync());

    ro.observe(grid);

    grid.querySelectorAll(".task-list, .shift-note").forEach((el) => ro.observe(el));

    window.addEventListener("resize", runSync);

    if (document.fonts?.ready) document.fonts.ready.then(runSync).catch(() => {});

    return () => {

      ro.disconnect();

      window.removeEventListener("resize", runSync);

    };

  }, [runSync, data]);



  if (!data || typeof data !== "object") return null;



  const leftItems = itemList(data.leftItems);

  const rightItems = itemList(data.rightItems);

  const leftReasons = reasonList(data.leftReasons);

  const rightReasons = reasonList(data.rightReasons);

  const sectionTitle = String(data.sectionTitle || "").trim();

  const leftTitle = String(data.leftTitle || "").trim();

  const rightTitle = String(data.rightTitle || "").trim();

  const mode = data.mode === "value_shift" ? "value_shift" : data.mode === "ai_impact" ? "ai_impact" : "";



  if (leftItems.length === 0 && rightItems.length === 0) return null;



  const renderNote = (reasons, side) => {

    if (!reasons.length) return null;

    return (

      <div className={`shift-note${side === "down" ? " shift-note--down" : " shift-note--up"}`}>

        {reasons.map((r, i) => {

          if (!r.body) return null;

          const { lead, support } = splitLeadAndSupport(r.body);

          return (

            <p key={`${side}-r-${i}`}>

              {r.title ? <b>{r.title}</b> : null}

              {lead}

              {support ? (

                <>

                  <br />

                  {support}

                </>

              ) : null}

            </p>

          );

        })}

      </div>

    );

  };



  return (

    <section

      className="fc-section vs-section"

      id="er-shift"

      data-semantic-mode={mode || undefined}

      aria-labelledby="er-shift-title"

    >

      <div className="fc-section-head">

        <span className="fc-section-no">02</span>

        <h2 id="er-shift-title" className="fc-section-title">

          {sectionTitle}

        </h2>

      </div>

      <div className="shift-grid" ref={gridRef}>

        <article className="shift down">

          <div className="shift-title">{leftTitle}</div>

          <ol className="task-list">

            {leftItems.map((b, i) => (

              <li key={`d-${i}`}>

                <span className="num">{padNum(i)}</span>

                <span>{b}</span>

              </li>

            ))}

          </ol>

          {renderNote(leftReasons, "down")}

        </article>



        <article className="shift up">

          <div className="shift-title">{rightTitle}</div>

          <ol className="task-list">

            {rightItems.map((b, i) => (

              <li key={`r-${i}`}>

                <span className="num">{padNum(i)}</span>

                <span>{b}</span>

              </li>

            ))}

          </ol>

          {renderNote(rightReasons, "up")}

        </article>

      </div>

    </section>

  );

}

