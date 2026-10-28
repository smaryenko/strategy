(function () {
  "use strict";

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var progressBar = document.getElementById("progressBar");
  var dotsNav = document.getElementById("dots");
  var backToTop = document.getElementById("backToTop");

  /* ---------- build dot navigation ---------- */
  var dotButtons = slides.map(function (slide, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    var label = slide.getAttribute("data-label") || "Section " + (i + 1);
    btn.setAttribute("aria-label", label);
    var tip = document.createElement("span");
    tip.textContent = label;
    btn.appendChild(tip);
    btn.addEventListener("click", function () {
      slide.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    dotsNav.appendChild(btn);
    return btn;
  });

  /* ---------- slide-level reveal (headings / blocks) ---------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.2 }
  );
  slides.forEach(function (s) {
    revealObserver.observe(s);
  });

  /* ---------- staggered groups: children appear one by one ---------- */
  var STEP = 140; // ms between each item
  var staggerObserver = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var container = entry.target;
        obs.unobserve(container); // run once
        var kids = Array.prototype.slice.call(container.children);
        var step = Number(container.getAttribute("data-stagger-step")) || STEP;
        kids.forEach(function (child, i) {
          window.setTimeout(function () {
            child.classList.add("shown");
          }, i * step);
        });
      });
    },
    { threshold: 0.25 }
  );
  Array.prototype.slice
    .call(document.querySelectorAll(".stagger"))
    .forEach(function (g) {
      staggerObserver.observe(g);
    });

  var activeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = slides.indexOf(entry.target);
          dotButtons.forEach(function (b, i) {
            b.classList.toggle("active", i === idx);
          });
        }
      });
    },
    { threshold: 0.55 }
  );
  slides.forEach(function (s) {
    activeObserver.observe(s);
  });

  /* ---------- scroll progress bar ---------- */
  function updateProgress() {
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (scrolled / max) * 100 : 0;
    progressBar.style.width = pct + "%";
    var showBackToTop = slides[2] && scrolled >= slides[2].offsetTop;
    backToTop.classList.toggle("is-visible", Boolean(showBackToTop));
    backToTop.setAttribute("aria-hidden", showBackToTop ? "false" : "true");
    backToTop.tabIndex = showBackToTop ? 0 : -1;
  }
  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  updateProgress();

  /* first slide visible immediately */
  if (slides[0]) slides[0].classList.add("in-view");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- back to top ---------- */
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* =========================================================
     1. COST CHART — click a stage to update the readout
     ========================================================= */
  (function () {
    var chart = document.querySelector("[data-cost]");
    if (!chart) return;
    var rows = Array.prototype.slice.call(chart.querySelectorAll(".cost-row"));
    var readStage = chart.querySelector("[data-read-stage]");
    var readX = chart.querySelector("[data-read-x]");
    var readNote = chart.querySelector("[data-read-note]");
    rows.forEach(function (row) {
      row.addEventListener("click", function () {
        rows.forEach(function (r) {
          r.classList.remove("active");
        });
        row.classList.add("active");
        readStage.textContent = row.getAttribute("data-stage");
        readX.textContent = row.getAttribute("data-x");
        readNote.textContent = row.getAttribute("data-note");
      });
    });
  })();

  /* =========================================================
     2. PYRAMID — click a layer to reveal its detail
     ========================================================= */
  (function () {
    var pyr = document.querySelector("[data-pyramid]");
    if (!pyr) return;
    var detail = document.querySelector("[data-pyramid-detail]");
    var rows = Array.prototype.slice.call(pyr.querySelectorAll(".pyr-row"));
    rows.forEach(function (row) {
      row.addEventListener("click", function () {
        rows.forEach(function (r) {
          r.classList.remove("active");
        });
        row.classList.add("active");
        var key = "data-detail-" + row.getAttribute("data-level");
        var text = pyr.getAttribute(key) || "";
        var name = row.querySelector("span").textContent;
        detail.textContent = name + ": " + text;
      });
    });
  })();

  /* =========================================================
     3. TYPE CHIPS — click to expand the question it asks
     ========================================================= */
  (function () {
    var box = document.querySelector("[data-chips]");
    if (!box) return;
    var detail = document.querySelector("[data-chips-detail]");
    var chips = Array.prototype.slice.call(box.querySelectorAll(".chip"));
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var already = chip.classList.contains("active");
        chips.forEach(function (c) {
          c.classList.remove("active");
        });
        if (already) {
          detail.textContent = "Click a type to see the question it asks.";
          return;
        }
        chip.classList.add("active");
        detail.textContent =
          chip.textContent.trim() + " — " + chip.getAttribute("data-detail");
      });
    });
  })();

  /* =========================================================
     4. CIRCULAR AI LOOP — auto-rotate, hover to pause, click to jump
     ========================================================= */
  (function () {
    var loop = document.querySelector("[data-loop]");
    if (!loop) return;
    var token = loop.querySelector("[data-loop-token]");
    var stepEl = loop.querySelector("[data-loop-step]");
    var textEl = loop.querySelector("[data-loop-text]");
    var nodes = Array.prototype.slice.call(loop.querySelectorAll(".loop-node"));
    var steps = [
      {
        name: "Understand",
        text: "Reads the existing codebase and maps how it behaves today, before a single line changes.",
      },
      {
        name: "Shape",
        text: "Turns a raw requirement into a clear, testable, AI-ready spec and checks how it fits the current state.",
      },
      {
        name: "Generate",
        text: "Derives positive, negative and boundary cases, then writes the test code to match in the repo's own style.",
      },
      {
        name: "Fix",
        text: "Runs the suite, reads the failures, repairs flaky or broken tests, and loops back until it's green.",
      },
    ];
    // angles for each node, starting at top (−90deg), clockwise
    var angles = [-90, 0, 90, 180];
    var r = 128,
      cx = 160,
      cy = 160;
    var current = 0;
    var paused = false;
    var timer = null;

    function placeToken(i) {
      var a = (angles[i] * Math.PI) / 180;
      token.setAttribute("cx", cx + r * Math.cos(a));
      token.setAttribute("cy", cy + r * Math.sin(a));
    }
    function show(i) {
      current = i;
      placeToken(i);
      nodes.forEach(function (n, k) {
        n.classList.toggle("active", k === i);
      });
      stepEl.textContent = steps[i].name;
      textEl.textContent = steps[i].text;
    }
    function advance() {
      if (paused) return;
      show((current + 1) % steps.length);
    }
    function start() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(advance, 5000);
    }
    nodes.forEach(function (n, i) {
      n.addEventListener("click", function () {
        show(i);
      });
      n.addEventListener("mouseenter", function () {
        paused = true;
        show(i);
      });
      n.addEventListener("mouseleave", function () {
        paused = false;
      });
    });
    show(0);
    // only run the auto-rotation while the loop is on screen
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          start();
        } else if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      });
    }, { threshold: 0.4 });
    io.observe(loop);
  })();

  /* =========================================================
     5. PIPELINE — run a commit through, optionally inject a failure
     ========================================================= */
  (function () {
    var pipe = document.querySelector("[data-pipeline]");
    if (!pipe) return;
    var runBtn = document.querySelector("[data-pipe-run]");
    var failChk = document.querySelector("[data-pipe-fail]");
    var statusEl = document.querySelector("[data-pipe-status]");
    var stages = Array.prototype.slice.call(
      pipe.querySelectorAll(".pipe-stage")
    );
    var links = Array.prototype.slice.call(pipe.querySelectorAll(".pipe-link"));
    var names = ["Commit", "Unit + Component", "Integration", "System", "Release"];
    var running = false;

    function reset() {
      stages.forEach(function (s) {
        s.classList.remove("running", "pass", "fail", "dim");
      });
      links.forEach(function (l) {
        l.classList.remove("flowing");
      });
      statusEl.className = "pipe-status";
      statusEl.textContent = "idle, press run";
    }

    function run() {
      if (running) return;
      running = true;
      runBtn.disabled = true;
      reset();
      // fail at a random mid stage: Unit+Component(1), Integration(2) or System(3)
      var failAt =
        failChk && failChk.checked ? 1 + Math.floor(Math.random() * 3) : -1;
      var i = 0;
      function step() {
        if (i > 0) {
          // previous stage result
          if (i - 1 === failAt) {
            stages[i - 1].classList.remove("running");
            stages[i - 1].classList.add("fail");
            // dim everything after
            for (var k = i; k < stages.length; k++) stages[k].classList.add("dim");
            statusEl.className = "pipe-status bad";
            statusEl.textContent = "red at " + names[i - 1] + " — line stopped";
            running = false;
            runBtn.disabled = false;
            return;
          }
          stages[i - 1].classList.remove("running");
          stages[i - 1].classList.add("pass");
          if (links[i - 1]) links[i - 1].classList.add("flowing");
        }
        if (i >= stages.length) {
          statusEl.className = "pipe-status ok";
          statusEl.textContent = "all green — promoted to release";
          running = false;
          runBtn.disabled = false;
          return;
        }
        stages[i].classList.add("running");
        statusEl.className = "pipe-status";
        statusEl.textContent = "running " + names[i] + "…";
        i++;
        window.setTimeout(step, reduceMotion ? 120 : 760);
      }
      step();
    }

    runBtn.addEventListener("click", run);
    if (failChk) failChk.addEventListener("change", reset);
  })();

  /* =========================================================
     6. TEST-DATA DEMO — shared counter, strict vs delta assertion
     ========================================================= */
  (function () {
    var demo = document.querySelector("[data-delta]");
    if (!demo) return;
    var startEl = demo.querySelector("[data-delta-start]");
    var strictLine = demo.querySelector("[data-delta-strict]");
    var deltaLine = demo.querySelector("[data-delta-delta]");
    var strictRes = demo.querySelector("[data-delta-strict-res]");
    var deltaRes = demo.querySelector("[data-delta-delta-res]");
    var runBtn = demo.querySelector("[data-delta-run]");
    var resetBtn = demo.querySelector("[data-delta-reset]");
    var start = 7;

    function randStart() {
      start = Math.floor(Math.random() * 9) + 3; // 3..11, rarely 0
      startEl.textContent = start;
    }
    function clearRes() {
      strictRes.textContent = "";
      deltaRes.textContent = "";
      strictRes.className = "";
      deltaRes.className = "";
    }
    function run() {
      var end = start + 10;
      // strict: expects count == 10, only true if start was 0
      var strictPass = end === 10;
      strictRes.textContent = strictPass
        ? "pass (count is 10)"
        : "fail (count is " + end + ")";
      strictRes.className = strictPass ? "pass" : "fail";
      // delta: always true, we added 10
      deltaRes.textContent = "pass (went " + start + " \u2192 " + end + ")";
      deltaRes.className = "pass";
    }
    if (runBtn) runBtn.addEventListener("click", run);
    if (resetBtn)
      resetBtn.addEventListener("click", function () {
        clearRes();
        randStart();
      });
    randStart();
  })();

  /* =========================================================
     7. ASSURANCE SLIDER — locked to "QA-assured"
     ========================================================= */
  (function () {
    var decide = document.querySelector("[data-decide]");
    if (!decide) return;
    var track = decide.querySelector("[data-decide-track]");
    var fill = decide.querySelector("[data-decide-fill]");
    var knob = decide.querySelector("[data-decide-knob]");
    var msg = decide.querySelector("[data-decide-msg]");
    var dragging = false;

    function setVisual(pct) {
      fill.style.width = pct + "%";
      knob.style.left = pct + "%";
    }
    function fromEvent(clientX) {
      var rect = track.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      return Math.max(0, Math.min(100, pct));
    }
    function snapBack(pct) {
      // follow the drag, then always snap back to 100 (human)
      setVisual(pct);
      if (pct < 70) {
        msg.textContent = "No — AI-only evidence is not enough. The control snaps back.";
        msg.classList.add("snap");
      } else {
        msg.textContent = "Try moving the control toward \u201CAI-only\u201D.";
        msg.classList.remove("snap");
      }
    }
    function release() {
      if (!dragging) return;
      dragging = false;
      setVisual(100);
      knob.style.background = "var(--lime)";
      window.setTimeout(function () {
        msg.textContent = "AI produces at scale. QA owns independent assurance.";
        msg.classList.add("snap");
      }, 380);
    }
    function pointerDown(e) {
      dragging = true;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      snapBack(fromEvent(x));
    }
    function pointerMove(e) {
      if (!dragging) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      snapBack(fromEvent(x));
    }
    knob.addEventListener("mousedown", pointerDown);
    track.addEventListener("mousedown", pointerDown);
    knob.addEventListener("touchstart", pointerDown, { passive: true });
    window.addEventListener("mousemove", pointerMove);
    window.addEventListener("touchmove", pointerMove, { passive: true });
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    setVisual(100);
  })();
})();
