import { useEffect, useMemo, useState } from "react";

import { deriveReportSections } from "../my-reports/reportContentSections.js";

import "./report-section-nav.css";



export default function ReportSectionNav({ lang = "ko", report = null }) {

  const items = useMemo(() => deriveReportSections(report, { lang }), [report, lang]);

  const [active, setActive] = useState(items[0]?.id || "");



  useEffect(() => {

    if (!items.length) return;

    setActive((prev) => (items.some((item) => item.id === prev) ? prev : items[0].id));

  }, [items]);



  useEffect(() => {

    const nodes = items

      .map((item) => document.getElementById(item.id))

      .filter(Boolean);

    if (!nodes.length) return undefined;



    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((e) => e.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) setActive(visible[0].target.id);

      },

      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.25, 0.5] },

    );



    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();

  }, [items]);



  if (!items.length) return null;



  function scrollTo(id) {

    const el = document.getElementById(id);

    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    setActive(id);

  }



  return (

    <nav className="er-section-nav" aria-label={lang === "ko" ? "리포트 섹션" : "Report sections"}>

      <div className="er-section-nav__inner">

        {items.map((item) => (

          <button

            key={item.id}

            type="button"

            className={"er-section-nav__item" + (active === item.id ? " is-active" : "")}

            aria-current={active === item.id ? "true" : undefined}

            onClick={() => scrollTo(item.id)}

          >

            {item.label}

          </button>

        ))}

      </div>

    </nav>

  );

}

