(function (global) {
  function boot(scope) {
  var q = function (sel) { return scope.querySelector(sel); };
  var qa = function (sel) { return scope.querySelectorAll(sel); };
  var POINTS_URL = "/api/occupation-2axis-index-v1/OCCUPATION_2AXIS_GRAPH_POINTS_V1.json";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var root = q("[data-occupation-scatter='v1']");
  if (!root || root.dataset.occ2Bound === "1") return;
  root.dataset.occ2Bound = "1";

  function one(value) {
    return Number(value).toFixed(1);
  }

  function plotX(human) {
    return 110 + (Number(human) / 100) * 440;
  }

  function plotY(ai) {
    return 496 - (Number(ai) / 100) * 440;
  }

  function coordKey(point) {
    return String(point.human_judgment_index) + "|" + String(point.ai_help_index);
  }

  function reportHref(jobCd) {
    return "/jobs/" + encodeURIComponent(jobCd) + "/final-report/index.html";
  }

  function currentJobCd() {
    var match = window.location.pathname.match(/\/jobs\/([^/]+)\/final-report/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return String(root.getAttribute("data-current-job") || "");
  }

  function svgEl(name) {
    return document.createElementNS(SVG_NS, name);
  }

  function validate(points) {
    if (!Array.isArray(points)) return "rows";
    var eligible = 0;
    var unavailable = 0;
    var unexplained = 0;
    points.forEach(function (point) {
      var human = point.human_judgment_index;
      var ai = point.ai_help_index;
      if (point.plot_eligible === true) {
        eligible += 1;
        if (typeof human !== "number" || typeof ai !== "number") unexplained += 1;
      } else if (point.plot_eligible === false) {
        unavailable += 1;
        if (point.jobCd !== "K000007508" || human != null || ai != null) unexplained += 1;
      } else {
        unexplained += 1;
      }
    });
    root.dataset.totalRows = String(points.length);
    root.dataset.plottedOccupations = String(eligible);
    root.dataset.unavailableCount = String(unavailable);
    root.dataset.unexplainedMissing = String(unexplained);
    root.dataset.demoPoints = "0";
    if (points.length !== 492 || eligible !== 491 || unavailable !== 1 || unexplained !== 0) {
      return "contract";
    }
    return "";
  }

  function pageJobName() {
    var h1 = q(".title h1");
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    var parts = document.title.split("·");
    return parts.length > 1 ? parts[1].trim() : "";
  }

  function mountPair() {
    if (root.dataset.occ2Paired === "1") return;
    var heat = q("#s1 .heat-block");
    var title = q("#s1 .subsection-heading.hm23-title");
    if (!heat) return;
    var pair = document.createElement("div");
    pair.className = "occ2-pair";
    var left = document.createElement("div");
    left.className = "occ2-col occ2-heat";
    var rule = document.createElement("div");
    rule.className = "occ2-rule";
    rule.setAttribute("aria-hidden", "true");
    var anchor = title && title.parentNode === heat.parentNode ? title : heat;
    anchor.parentNode.insertBefore(pair, anchor);
    if (title) title.classList.add("occ2-retired-title");
    qa("#s1 .subsection-heading").forEach(function (node) {
      if ((node.textContent || "").replace(/\s+/g, "") === "전체직무분포도") {
        node.classList.add("occ2-retired-title");
      }
    });

    var intro = document.createElement("div");
    intro.className = "occ2-intro";
    var heading = document.createElement("h2");
    var name = pageJobName();
    heading.textContent = name ? name + " - 업무 분포도" : "업무 분포도";
    intro.appendChild(heading);

    var foot = document.createElement("div");
    foot.className = "occ2-foot";
    var meanings = heat.querySelector(".hm23-meanings");
    if (meanings) {
      var dist = meanings.querySelector(".hm23-dist");
      var meaningTitle = dist && dist.querySelector("h3");
      if (meaningTitle) foot.appendChild(meaningTitle);
      var list = document.createElement("div");
      list.className = "occ2-meaning-list";
      meanings.querySelectorAll(".hm23-band:not(.hm23-dist)").forEach(function (band) {
        band.querySelectorAll(".hm23-example").forEach(function (node) { node.remove(); });
        var label = band.querySelector("h3");
        var next = label && {
          "사람 판단이 높음": "사람 판단 높음",
          "AI 도움도가 높음": "AI 도움도 높음"
        }[label.textContent.trim()];
        if (next) label.textContent = next;
        var body = band.querySelector("p");
        var copy = body && {
          "상황을 종합해 판단하고, 사람의 경험과 책임이 중요한 업무입니다.": "상황을 종합해 판단하는 사람의 역할이 중요한 업무",
          "정보를 찾고 정리하거나, 초안을 만드는 등 AI가 넓게 도울 수 있는 업무입니다.": "정보 정리와 초안 작성에 AI 도움을 받기 쉬운 업무",
          "AI의 도움을 활용하면서도, 사람의 판단과 책임이 함께 중요한 업무입니다.": "AI를 활용하되 사람의 판단과 책임이 함께 필요한 업무"
        }[body.textContent.trim()];
        if (copy) body.textContent = copy;
        list.appendChild(band);
      });
      foot.appendChild(list);
      meanings.hidden = true;
    }

    left.appendChild(intro);
    left.appendChild(heat);
    left.appendChild(foot);
    heat.querySelectorAll(".hm23-yside .hm23-ylabel.hm23-boundary span").forEach(function (span) {
      var br = span.previousSibling;
      if (br && br.nodeName === "BR") br.remove();
      span.remove();
    });

    root.classList.add("occ2-col");
    pair.appendChild(left);
    pair.appendChild(rule);
    pair.appendChild(root);
    root.dataset.occ2Paired = "1";
    bindTaskTips(pair);
  }

  function placeFixed(node, clientX, clientY) {
    node.style.left = "0px";
    node.style.top = "0px";
    var width = Math.max(node.offsetWidth, node.scrollWidth) || 220;
    var height = Math.max(node.offsetHeight, node.scrollHeight) || 40;
    var left = clientX + 14;
    var top = clientY + 16;
    if (left + width > window.innerWidth - 8) left = clientX - width - 14;
    if (top + height > window.innerHeight - 8) top = clientY - height - 16;
    var maxLeft = Math.max(8, window.innerWidth - width - 8);
    var maxTop = Math.max(8, window.innerHeight - height - 8);
    node.style.left = Math.min(Math.max(8, left), maxLeft) + "px";
    node.style.top = Math.min(Math.max(8, top), maxTop) + "px";
  }

  function bindTaskTips(pair) {
    var heat = q("#s1 .hm23-heatmap");
    if (!heat || heat.dataset.occ2Tip === "1") return;
    heat.dataset.occ2Tip = "1";
    var toast = document.createElement("div");
    toast.className = "occ2-task-toast";
    toast.setAttribute("role", "tooltip");
    toast.hidden = true;
    pair.appendChild(toast);
    function textOf(point) {
      var tip = String(point.getAttribute("data-tip") || "");
      var body = tip.split(" · ")[0].trim();
      var id = point.querySelector("span");
      var label = id ? id.textContent.trim() : "";
      if (label && body) return label + "  " + body;
      return body || tip;
    }
    function show(event) {
      var point = event.target && event.target.closest ? event.target.closest(".hm23-point") : null;
      if (!point || !heat.contains(point)) return;
      var text = textOf(point);
      if (!text) return;
      toast.textContent = text;
      toast.hidden = false;
      placeFixed(toast, event.clientX, event.clientY);
    }
    function hide(event) {
      var point = event.target && event.target.closest ? event.target.closest(".hm23-point") : null;
      var next = event.relatedTarget;
      if (point && next && point.contains(next)) return;
      toast.hidden = true;
    }
    heat.addEventListener("pointerover", show);
    heat.addEventListener("pointermove", show);
    heat.addEventListener("pointerout", hide);
  }

  function matchHeatAxis() {
    var svg = q("#scatterSvg");
    var ref = svg && svg.querySelector("text");
    if (!ref) return;
    var size = 18 * svg.getBoundingClientRect().width / 568;
    var px = size.toFixed(2) + "px";
    qa("#s1 .hm23-xtitle, #s1 .hm23-ytitle").forEach(function (el) {
      el.style.setProperty("font-size", px, "important");
      el.style.setProperty("font-weight", "400", "important");
      el.style.setProperty("color", "#0b234f", "important");
    });
    qa(".occ2-intro h2").forEach(function (el) {
      el.style.setProperty("font-size", px, "important");
    });
  }

  function alignMeaningBodies() {
    var cards = qa(".occ2-meaning-list .hm23-card");
    if (!cards.length) return;
    cards.forEach(function (card) {
      card.style.gridTemplateColumns = "max-content minmax(0,1fr)";
    });
    var width = 0;
    cards.forEach(function (card) {
      var label = card.querySelector("h3");
      if (!label) return;
      width = Math.max(width, label.getBoundingClientRect().width);
    });
    if (!width) return;
    var px = Math.ceil(width) + "px";
    cards.forEach(function (card) {
      card.style.gridTemplateColumns = px + " minmax(0,1fr)";
    });
  }

  function alignPlots() {
    var pair = root.closest(".occ2-pair");
    var viz = root.querySelector(".scatter-viz");
    var heat = q("#s1 .hm23-heatmap");
    var heatBlock = q("#s1 .occ2-heat .heat-block");
    if (pair) {
      pair.style.marginLeft = "0px";
      pair.style.width = "";
    }
    matchHeatAxis();
    alignMeaningBodies();
    if (!viz || !heat) return;
    var narrow = window.matchMedia("(max-width: 900px)").matches;
    var intros = qa(".occ2-pair .occ2-intro");
    var feet = qa(".occ2-pair .occ2-foot");
    intros.forEach(function (el) { el.style.minHeight = ""; });
    feet.forEach(function (el) {
      el.style.marginTop = "";
      el.style.paddingLeft = "";
    });
    viz.style.marginTop = "0px";
    viz.style.marginLeft = "";
    heat.style.width = "";
    heat.style.height = "";
    var spacer = heatBlock && heatBlock.previousElementSibling;
    if (spacer && spacer.classList.contains("occ2-plot-offset")) spacer.style.height = "0px";
    if (narrow) {
      var heatSize = heat.getBoundingClientRect().width;
      var vizW = heatSize * 568 / 440;
      if (vizW > root.clientWidth) vizW = root.clientWidth;
      viz.style.width = vizW >= root.clientWidth - 1 ? "100%" : vizW + "px";
      viz.style.height = (vizW * 610 / 568) + "px";
      viz.style.marginLeft = "0px";
      nudgeScatterYTitle();
      return;
    }
    var introHeight = 0;
    intros.forEach(function (el) { introHeight = Math.max(introHeight, el.offsetHeight); });
    intros.forEach(function (el) { el.style.minHeight = introHeight + "px"; });

    var yside = q("#s1 .hm23-yside");
    var leftCol = q(".occ2-heat");
    var yWidth = yside ? yside.getBoundingClientRect().width : 84;
    var leftWidth = leftCol ? leftCol.clientWidth : 0;
    var rightWidth = root.clientWidth;
    function fitPlot(left, right, y) {
      return Math.min(Math.max(0, left - y), right * 440 / 568);
    }
    var plotSize = fitPlot(leftWidth, rightWidth, yWidth);
    var pass;
    for (pass = 0; pass < 3; pass += 1) {
      heat.style.width = plotSize + "px";
      heat.style.height = plotSize + "px";
      viz.style.width = (plotSize * 568 / 440) + "px";
      viz.style.height = (plotSize * 610 / 440) + "px";
      void heat.offsetWidth;
      yWidth = yside ? yside.getBoundingClientRect().width : yWidth;
      leftWidth = leftCol ? leftCol.clientWidth : leftWidth;
      rightWidth = root.clientWidth;
      plotSize = fitPlot(leftWidth, rightWidth, yWidth);
    }
    var vizW = plotSize * 568 / 440;
    viz.style.width = vizW >= rightWidth - 1 ? "100%" : vizW + "px";
    viz.style.height = (vizW * 610 / 568) + "px";
    viz.style.marginLeft = "0px";
    void viz.offsetWidth;
    var liveScale = viz.querySelector("svg").getBoundingClientRect().width / 568;
    plotSize = 440 * liveScale;
    heat.style.width = plotSize + "px";
    heat.style.height = plotSize + "px";
    if (heatBlock) {
      var offset = heatBlock.previousElementSibling;
      if (!offset || !offset.classList.contains("occ2-plot-offset")) {
        offset = document.createElement("div");
        offset.className = "occ2-plot-offset";
        heatBlock.parentNode.insertBefore(offset, heatBlock);
      }
      offset.style.height = (plotSize * 56 / 440) + "px";
    }
    alignXTitles();

    var footTops = [];
    feet.forEach(function (el) { footTops.push(el.getBoundingClientRect().top); });
    if (!footTops.length) return;
    var footLine = Math.max.apply(null, footTops);
    feet.forEach(function (el, index) {
      el.style.marginTop = (footLine - footTops[index]) + "px";
    });
    nudgeScatterYTitle();
    alignFootStarts();
  }

  function nudgeScatterYTitle() {
    var svg = q("#scatterSvg");
    var label = null;
    qa("#scatterSvg > text").forEach(function (node) {
      if ((node.textContent || "").indexOf("AI") !== -1) label = node;
    });
    if (!svg || !label) return;
    var scale = svg.getBoundingClientRect().width / 568;
    if (!scale) return;
    label.setAttribute("x", (30 + 10 / scale).toFixed(2));
  }

  function alignXTitles() {
    var xt = q("#s1 .occ2-heat .hm23-xtitle");
    var st = null;
    qa("#scatterSvg > text").forEach(function (node) {
      if ((node.textContent || "").indexOf("사람") !== -1) st = node;
    });
    if (!xt || !st) return;
    xt.style.marginTop = "";
    var delta = st.getBoundingClientRect().bottom - xt.getBoundingClientRect().bottom;
    if (Math.abs(delta) < 0.5) return;
    var current = parseFloat(window.getComputedStyle(xt).marginTop) || 0;
    xt.style.marginTop = (current + delta).toFixed(1) + "px";
  }

  function alignFootStarts() {
    var leftFoot = q(".occ2-heat .occ2-foot");
    var rightFoot = root.querySelector(".occ2-foot");
    var boundary = null;
    qa("#s1 .occ2-heat .hm23-ylabel").forEach(function (el) {
      if ((el.textContent || "").replace(/\s+/g, "").indexOf("경계") === 0) boundary = el;
    });
    if (leftFoot && boundary && boundary.firstChild) {
      var range = document.createRange();
      range.selectNodeContents(boundary.firstChild);
      var target = range.getBoundingClientRect().left;
      var pad = target - leftFoot.getBoundingClientRect().left;
      leftFoot.style.paddingLeft = Math.max(0, pad).toFixed(1) + "px";
    }
    if (!rightFoot) return;
    var label = null;
    qa("#scatterSvg > text").forEach(function (node) {
      if ((node.textContent || "").indexOf("AI") !== -1) label = node;
    });
    if (!label) return;
    var padRight = label.getBoundingClientRect().right - rightFoot.getBoundingClientRect().left;
    if (padRight > 0.5) rightFoot.style.paddingLeft = padRight.toFixed(1) + "px";
  }

  function showUnavailable(jobName) {
    var note = document.createElement("div");
    note.className = "occ2-unavailable";
    ["사람 판단 중요도: 산정 불가", "AI 도움도: 산정 불가", "업무 판정이 모두 경계여서 위치를 계산할 수 없습니다."].forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      note.appendChild(p);
    });
    note.dataset.jobName = jobName || "";
    root.appendChild(note);
  }

  function rankLine(value, key, rows, label) {
    var higher = 0;
    rows.forEach(function (row) {
      if (Number(row[key]) > Number(value)) higher += 1;
    });
    var pct = rows.length ? Math.round((higher / rows.length) * 100) : 0;
    return (pct < 1 ? "최상위" : "상위 약 " + pct + "%") + " (" + label + ")";
  }

  function zoneLine(value, label) {
    var band = value >= 66.7 ? "높은" : value >= 33.4 ? "중간" : "낮은";
    return label + " " + band + " 영역에 위치";
  }

  function statCell(label, valueNode) {
    var cell = document.createElement("div");
    cell.className = "occ2-stat";
    var name = document.createElement("b");
    name.textContent = label;
    cell.appendChild(name);
    cell.appendChild(valueNode);
    return cell;
  }

  function buildJobFoot(selected, plottable) {
    var foot = document.createElement("div");
    foot.className = "occ2-foot";
    var title = document.createElement("h3");
    var name = selected && selected.name ? selected.name : pageJobName();
    title.textContent = name;
    foot.appendChild(title);
    var stats = document.createElement("div");
    stats.className = "occ2-stats";
    var eligible = selected && selected.plot_eligible === true;
    function numberNode(text) {
      var num = document.createElement("div");
      num.className = "num";
      num.textContent = text;
      return num;
    }
    if (eligible) {
      stats.appendChild(statCell("사람 판단 중요도", numberNode(one(selected.human_judgment_index))));
      stats.appendChild(statCell("AI 도움도", numberNode(one(selected.ai_help_index))));
      var list = document.createElement("ul");
      [
        rankLine(selected.human_judgment_index, "human_judgment_index", plottable, "사람 판단 중요도"),
        rankLine(selected.ai_help_index, "ai_help_index", plottable, "AI 도움도"),
        zoneLine(selected.human_judgment_index, "사람 판단 중요도"),
        zoneLine(selected.ai_help_index, "AI 도움도")
      ].forEach(function (line) {
        var item = document.createElement("li");
        item.textContent = line;
        list.appendChild(item);
      });
      stats.appendChild(statCell("전체 분포 내 상대적 위치", list));
    } else {
      stats.appendChild(statCell("사람 판단 중요도", numberNode("산정 불가")));
      stats.appendChild(statCell("AI 도움도", numberNode("산정 불가")));
      var note = document.createElement("p");
      note.textContent = "업무 판정이 모두 경계여서 위치를 계산할 수 없습니다.";
      stats.appendChild(statCell("전체 분포 내 상대적 위치", note));
    }
    foot.appendChild(stats);
    return foot;
  }

  function render(points) {
    var current = currentJobCd();
    var selected = null;
    var plottable = [];
    points.forEach(function (point) {
      if (point.jobCd === current) selected = point;
      if (point.plot_eligible === true) plottable.push(point);
    });

    var groups = new Map();
    plottable.forEach(function (point) {
      var key = coordKey(point);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(point);
    });

    root.replaceChildren();

    var intro = document.createElement("div");
    intro.className = "occ2-intro";
    var heading = document.createElement("h2");
    heading.textContent = "전체 직무 분포도 (산점도)";
    intro.appendChild(heading);

    var viz = document.createElement("div");
    viz.className = "viz scatter-viz";
    viz.innerHTML =
      '<svg id="scatterSvg" viewBox="0 0 568 610" role="img" aria-label="전체 직무 분포 산점도">' +
        "<defs>" +
          '<filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">' +
            '<feGaussianBlur stdDeviation="4.5"/>' +
          "</filter>" +
        "</defs>" +
        '<g id="scatter-plot">' +
          '<rect x="110" y="56" width="440" height="440" fill="#fff" stroke="none"/>' +
          '<path d="M110 56V496 M110 496H550" fill="none" stroke="#d9dde3" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
          '<g stroke="#dce3eb" stroke-width="0.8">' +
            '<path d="M198 56V496 M286 56V496 M374 56V496 M462 56V496"/>' +
            '<path d="M110 408H550 M110 320H550 M110 232H550 M110 144H550"/>' +
          "</g>" +
          '<g id="jobGlow" filter="url(#cloudBlur)" pointer-events="none"></g>' +
          '<g id="jobCloud"></g>' +
          '<g id="jobHitLayer"></g>' +
        "</g>" +
        '<g font-size="11.5" fill="#445c80" text-anchor="end">' +
          '<text x="99" y="500">0</text><text x="99" y="412">20</text><text x="99" y="324">40</text>' +
          '<text x="99" y="236">60</text><text x="99" y="148">80</text><text x="99" y="60">100</text>' +
        "</g>" +
        '<g font-size="11.5" fill="#445c80" text-anchor="middle">' +
          '<text x="110" y="520">0</text><text x="198" y="520">20</text><text x="286" y="520">40</text>' +
          '<text x="374" y="520">60</text><text x="462" y="520">80</text><text x="550" y="520">100</text>' +
        "</g>" +
        '<text x="30" y="276" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="400" fill="#0b234f" writing-mode="vertical-rl" style="writing-mode:vertical-rl;text-orientation:upright">AI 도움도</text>' +
        '<text x="330" y="573" text-anchor="middle" font-size="18" font-weight="400" fill="#0b234f">사람 판단 중요도</text>' +
      "</svg>";

    var pop = document.createElement("div");
    pop.className = "scatter-pop";
    pop.hidden = true;
    viz.appendChild(pop);

    var glow = viz.querySelector("#jobGlow");
    var cloud = viz.querySelector("#jobCloud");
    var hitLayer = viz.querySelector("#jobHitLayer");
    var hideTimer = 0;
    var pinned = false;

    function hideSoon() {
      if (pinned) return;
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        pop.hidden = true;
      }, 280);
    }

    function cancelHide() {
      window.clearTimeout(hideTimer);
    }

    function openJobInDrawer(jobCd, event) {
      if (!(scope instanceof ShadowRoot)) return;
      if (event) event.preventDefault();
      root.dispatchEvent(new CustomEvent("occ2-open-job", {
        bubbles: true,
        composed: true,
        detail: { jobCd: jobCd }
      }));
    }

    function showPop(members, sample, clientX, clientY) {
      cancelHide();
      pop.hidden = false;
      pop.replaceChildren();
      var coord = document.createElement("strong");
      coord.className = "scatter-pop-coord";
      coord.textContent = one(sample.human_judgment_index) + " / " + one(sample.ai_help_index);
      pop.appendChild(coord);
      members.forEach(function (point) {
        var link = document.createElement("a");
        link.href = reportHref(point.jobCd);
        link.textContent = point.name;
        if (point.jobCd === current) link.className = "is-current";
        link.addEventListener("click", function (event) {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          openJobInDrawer(point.jobCd, event);
        });
        pop.appendChild(link);
      });
      var count = document.createElement("span");
      count.className = "scatter-pop-count";
      count.textContent = members.length + "개";
      pop.appendChild(count);
      placeInPlot(pop, clientX, clientY);
    }

    function plotScreenBox() {
      var svg = viz.querySelector("#scatterSvg");
      var box = svg.getBoundingClientRect();
      var sx = box.width / 568;
      var sy = box.height / 610;
      return {
        left: box.left + 110 * sx,
        top: box.top + 56 * sy,
        right: box.left + 550 * sx,
        bottom: box.top + 496 * sy
      };
    }

    function placeInPlot(node, clientX, clientY) {
      var plot = plotScreenBox();
      var pad = 8;
      var availW = Math.max(80, plot.right - plot.left - pad * 2);
      var availH = Math.max(48, plot.bottom - plot.top - pad * 2);
      node.style.width = Math.min(220, availW) + "px";
      node.style.maxWidth = Math.min(220, availW) + "px";
      node.style.maxHeight = availH + "px";
      node.style.left = "0px";
      node.style.top = "0px";
      var width = node.offsetWidth || Math.min(220, availW);
      var height = node.offsetHeight || 40;
      var left = clientX + 12;
      var top = clientY + 12;
      if (left + width > plot.right - pad) left = clientX - width - 12;
      if (top + height > plot.bottom - pad) top = clientY - height - 12;
      var minLeft = plot.left + pad;
      var minTop = plot.top + pad;
      var maxLeft = Math.max(minLeft, plot.right - pad - width);
      var maxTop = Math.max(minTop, plot.bottom - pad - height);
      node.style.left = Math.min(Math.max(minLeft, left), maxLeft) + "px";
      node.style.top = Math.min(Math.max(minTop, top), maxTop) + "px";
    }

    pop.addEventListener("pointerenter", cancelHide);
    pop.addEventListener("pointerleave", hideSoon);

    function dismissPin(event) {
      if (!pinned) return;
      var path = event.composedPath ? event.composedPath() : [];
      if (path.indexOf(pop) !== -1 || path.indexOf(hitLayer) !== -1) return;
      pinned = false;
      pop.hidden = true;
    }

    function dismissPinKey(event) {
      if (!pinned || event.key !== "Escape") return;
      pinned = false;
      pop.hidden = true;
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    window.addEventListener("pointerdown", dismissPin, true);
    window.addEventListener("keydown", dismissPinKey, true);
    var pinWatcher = new MutationObserver(function () {
      if (root.isConnected) return;
      window.removeEventListener("pointerdown", dismissPin, true);
      window.removeEventListener("keydown", dismissPinKey, true);
      pinWatcher.disconnect();
    });
    if (scope instanceof ShadowRoot) pinWatcher.observe(scope, { childList: true });

    function addDot(point, selectedHere) {
      var x = plotX(point.human_judgment_index);
      var y = plotY(point.ai_help_index);
      var haze = svgEl("circle");
      haze.setAttribute("cx", x.toFixed(2));
      haze.setAttribute("cy", y.toFixed(2));
      haze.setAttribute("r", selectedHere ? "8" : "5.5");
      haze.setAttribute("fill", selectedHere ? "#ff2c2c" : "#9eb1c5");
      haze.setAttribute("opacity", selectedHere ? "0.08" : "0.055");
      glow.appendChild(haze);

      var dot = svgEl("circle");
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      dot.setAttribute("r", selectedHere ? "6.7" : "1.65");
      dot.setAttribute("fill", selectedHere ? "#ff2c2c" : "#c4cbd3");
      dot.setAttribute("opacity", selectedHere ? "1" : "0.74");
      if (selectedHere) {
        dot.setAttribute("stroke", "#ffffff");
        dot.setAttribute("stroke-width", "1.8");
        dot.dataset.selected = "1";
        dot.dataset.jobCd = point.jobCd;
        dot.dataset.human = one(point.human_judgment_index);
        dot.dataset.ai = one(point.ai_help_index);
      }
      cloud.appendChild(dot);
    }

    plottable.forEach(function (point) {
      if (point.jobCd === current) return;
      addDot(point, false);
    });
    if (selected && selected.plot_eligible === true) addDot(selected, true);

    groups.forEach(function (members) {
      var sample = members[0];
      var x = plotX(sample.human_judgment_index);
      var y = plotY(sample.ai_help_index);
      var selectedHere = members.some(function (point) { return point.jobCd === current; });
      var hit = svgEl("circle");
      hit.setAttribute("cx", x.toFixed(2));
      hit.setAttribute("cy", y.toFixed(2));
      hit.setAttribute("r", selectedHere ? "10" : "6.5");
      hit.setAttribute("fill", "transparent");
      hit.setAttribute("pointer-events", "all");
      hit.setAttribute("tabindex", "0");
      hit.style.cursor = "pointer";

      var label = members.length === 1
        ? members[0].name + " (AI 도움도 " + one(members[0].ai_help_index) + " · 사람 판단 중요도 " + one(members[0].human_judgment_index) + ")"
        : members.length + "개 직무";
      hit.setAttribute("aria-label", label);
      hit.addEventListener("pointerenter", function (event) {
        if (pinned) return;
        showPop(members, sample, event.clientX, event.clientY);
      });
      hit.addEventListener("pointerleave", hideSoon);
      hit.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        pinned = true;
        showPop(members, sample, event.clientX, event.clientY);
      });
      hitLayer.appendChild(hit);
    });

    root.appendChild(intro);
    root.appendChild(viz);
    root.appendChild(buildJobFoot(selected, plottable));
    if (selected && selected.plot_eligible === true) {
      root.dataset.selectedHuman = one(selected.human_judgment_index);
      root.dataset.selectedAi = one(selected.ai_help_index);
      root.dataset.selectedPoint = "1";
    } else {
      root.dataset.selectedHuman = "";
      root.dataset.selectedAi = "";
      root.dataset.selectedPoint = "0";
    }
    root.dataset.currentJob = current;
    root.dataset.duplicateCoordinateGroups = String(
      Array.from(groups.values()).filter(function (members) { return members.length > 1; }).length
    );
    root.dataset.pointCount = String(plottable.length);
    root.dataset.demoPoints = "0";
    alignPlots();
  }

  function showStatus(message) {
    root.replaceChildren();
    var head = document.createElement("div");
    head.className = "occ2-intro";
    var heading = document.createElement("h2");
    heading.textContent = "전체 직무 분포도 (산점도)";
    head.appendChild(heading);
    var status = document.createElement("p");
    status.className = "occ2-status";
    status.textContent = message;
    root.appendChild(head);
    root.appendChild(status);
    root.dataset.demoPoints = "0";
    root.dataset.selectedPoint = "0";
    root.dataset.pointCount = "0";
  }

  (function tightenLeadSentences() {
    var lead = q("#s1 .role-change-lead p");
    if (!lead || lead.dataset.occ2SentenceGap === "1") return;
    Array.from(lead.querySelectorAll("br")).forEach(function (br) {
      if (!br.previousSibling || br.previousSibling.nodeName !== "BR") return;
      var gap = document.createElement("span");
      gap.className = "occ2-sentence-gap";
      gap.setAttribute("aria-hidden", "true");
      br.parentNode.replaceChild(gap, br);
      if (gap.previousSibling && gap.previousSibling.nodeName === "BR") gap.previousSibling.remove();
    });
    lead.dataset.occ2SentenceGap = "1";
  })();

  mountPair();

  fetch(POINTS_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (points) {
      var problem = validate(points);
      if (problem) throw new Error(problem);
      render(points);
      root.dataset.occ2State = "ready";
      function onResize() {
        if (!root.isConnected) {
          window.removeEventListener("resize", onResize);
          return;
        }
        alignPlots();
      }
      window.addEventListener("resize", onResize);
    })
    .catch(function () {
      showStatus("직무 분포 데이터를 불러오지 못했습니다.");
      root.dataset.occ2State = "unavailable";
    });
  }

  global.bootOccupationScatter = boot;
  if (document.querySelector("[data-occupation-scatter='v1']")) boot(document);
})(window);
