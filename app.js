(function () {
  "use strict";

  var BANK = (window.BANK || []).slice();
  var STORE = "psy-mcq-v1";

  var el = function (id) { return document.getElementById(id); };
  var S = {
    setup: el("setup"), quiz: el("quiz"), results: el("results"),
    stem: el("stem"), options: el("options"), feedback: el("feedback"),
    verdict: el("verdict"), answerLine: el("answerLine"), explain: el("explain"),
    secChip: el("secChip"), numChip: el("numChip"),
    prev: el("prevBtn"), next: el("nextBtn"), dotbar: el("dotbar"),
    bar: el("bar"), progressText: el("progressText"),
    scoreStat: el("scoreStat"), wrongStat: el("wrongStat"), accStat: el("accStat"),
    bigscore: el("bigscore"), resultTitle: el("resultTitle"), resultNote: el("resultNote"),
    breakdown: el("breakdown"), reviewList: el("reviewList")
  };

  var state = { list: [], i: 0, mode: "all", answers: {} };

  /* ---------- persistence ---------- */
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        mode: state.mode, i: state.i, answers: state.answers
      }));
    } catch (e) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || "null"); }
    catch (e) { return null; }
  }

  /* ---------- setup ---------- */
  function sections() {
    var out = [], seen = {};
    BANK.forEach(function (q) { if (!seen[q.s]) { seen[q.s] = 1; out.push(q.s); } });
    return out;
  }

  function buildModes() {
    var grid = el("modeGrid");
    grid.innerHTML = "";
    var modes = [{ id: "all", name: "Full bank", note: BANK.length + " questions" }];
    sections().forEach(function (s) {
      modes.push({
        id: s, name: s.split("·")[0].trim(),
        note: s.split("·")[1].trim() + " · " + BANK.filter(function (q) { return q.s === s; }).length + " questions"
      });
    });
    modes.forEach(function (m, idx) {
      var b = document.createElement("button");
      b.className = "mode" + (idx === 0 ? " active" : "");
      b.dataset.id = m.id;
      b.innerHTML = "<strong>" + m.name + "</strong><small>" + m.note + "</small>";
      b.addEventListener("click", function () {
        state.mode = m.id;
        [].forEach.call(grid.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
      });
      grid.appendChild(b);
    });
  }

  /* ---------- quiz ---------- */
  function pool() {
    var missedOnly = el("mistakesOnlyToggle").checked;
    var base = state.mode === "all"
      ? BANK.slice()
      : BANK.filter(function (q) { return q.s === state.mode; });

    if (missedOnly) {
      var saved = load();
      var keys = saved ? Object.keys(saved.answers || {}) : [];
      var wrong = {};
      keys.forEach(function (k) { if (!saved.answers[k].ok) wrong[k] = 1; });
      base = base.filter(function (q) { return wrong[qKey(q)]; });
    }
    if (el("shuffleToggle").checked) {
      base.sort(function () { return Math.random() - 0.5; });
    } else {
      base.sort(function (a, b) {
        var sa = BANK.indexOf(a), sb = BANK.indexOf(b);
        return sa - sb;
      });
    }
    return base;
  }

  function qKey(q) { return q.s + "|" + q.n + "|" + q.q.slice(0, 40); }

  function start(fresh) {
    state.list = pool();
    if (fresh) state.answers = {};
    if (!state.list.length) {
      alert("No questions match this selection.");
      return;
    }
    state.i = 0;
    S.setup.classList.add("hidden");
    S.results.classList.add("hidden");
    S.quiz.classList.remove("hidden");
    render();
  }

  function render() {
    var q = state.list[state.i];
    if (!q) return finish();

    S.stem.textContent = q.q;
    S.secChip.textContent = q.s;
    S.numChip.textContent = "Q" + q.n;
    S.options.innerHTML = "";

    var keys = Object.keys(q.o);
    var already = state.answers[qKey(q)];

    keys.forEach(function (k, idx) {
      var b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = "<span class='key'>" + k + "</span><span class='txt'>" + q.o[k] + "</span>";
      b.addEventListener("click", function () { choose(q, k, b); });
      if (already) markOption(q, k, b, already);
      S.options.appendChild(b);
    });

    if (already) showFeedback(q, already, true);

    S.prev.disabled = state.i === 0;
    S.next.textContent = state.i === state.list.length - 1 ? "Finish ▸" : "Next →";
    S.bar.style.width = ((state.i + (already ? 1 : 0)) / state.list.length * 100) + "%";
    S.progressText.textContent = (state.i + 1) + " / " + state.list.length + (already ? " ✓" : "");
    drawDots();
    stats();
  }

  function markOption(q, k, btn, rec) {
    var isCorrect = q.a.indexOf(k) !== -1;
    btn.classList.add("locked");
    btn.disabled = true;
    if (rec.choice === k && isCorrect) btn.classList.add("correct");
    else if (rec.choice === k) btn.classList.add("wrong");
    else if (isCorrect) btn.classList.add("correct", "missed");
  }

  function choose(q, k, btn) {
    var key = qKey(q);
    if (state.answers[key]) return;

    var ok = q.a.indexOf(k) !== -1;
    state.answers[key] = { choice: k, ok: ok };

    [].forEach.call(S.options.children, function (c, idx) {
      var kk = Object.keys(q.o)[idx];
      markOption(q, kk, c, state.answers[key]);
    });
    showFeedback(q, state.answers[key], false);

    S.bar.style.width = ((state.i + 1) / state.list.length * 100) + "%";
    S.progressText.textContent = (state.i + 1) + " / " + state.list.length;
    drawDots();
    stats();
    save();

    if (el("autoAdvToggle").checked) {
      setTimeout(function () { go(1); }, 1400);
    }
  }

  function showFeedback(q, rec, replay) {
    var keys = Object.keys(q.o);
    var ansTxt = q.a.map(function (k) { return k + ". " + q.o[k]; }).join("   |   ");
    var yours = rec.choice + ". " + q.o[rec.choice];

    S.feedback.classList.remove("hidden", "good", "bad");
    S.feedback.classList.add(rec.ok ? "good" : "bad");
    S.verdict.textContent = rec.ok ? "✓ Correct" : "✗ Incorrect";
    S.answerLine.innerHTML = "<b>Your answer:</b> " + yours +
      (rec.ok ? "" : "<br><b>Correct answer:</b> " + ansTxt);

    S.explain.innerHTML = "";
    String(q.e).split("\n").forEach(function (line) {
      if (!line.trim()) return;
      var p = document.createElement("p");
      p.style.margin = "0 0 6px";
      p.textContent = line;
      S.explain.appendChild(p);
    });
    if (!replay) S.feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function drawDots() {
    S.dotbar.innerHTML = "";
    state.list.forEach(function (q, idx) {
      var d = document.createElement("span");
      var rec = state.answers[qKey(q)];
      d.className = "dot" + (rec ? (rec.ok ? " ok" : " bad") : "") + (idx === state.i ? " cur" : "");
      d.title = q.s + " — Q" + q.n;
      d.addEventListener("click", function () { state.i = idx; render(); });
      S.dotbar.appendChild(d);
    });
  }

  function stats() {
    var ok = 0, wrong = 0;
    Object.keys(state.answers).forEach(function (k) {
      if (state.answers[k].ok) ok++; else wrong++;
    });
    S.scoreStat.textContent = ok;
    S.wrongStat.textContent = wrong;
    S.accStat.textContent = (ok + wrong) ? Math.round(ok / (ok + wrong) * 100) + "%" : "–";
  }

  function go(step) {
    var next = state.i + step;
    if (next < 0) return;
    if (next >= state.list.length) return finish();
    state.i = next;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- results ---------- */
  function finish() {
    var ok = 0, wrong = 0;
    Object.keys(state.answers).forEach(function (k) {
      if (state.answers[k].ok) ok++; else wrong++;
    });
    var total = state.list.length;
    var attempted = ok + wrong;
    var pct = attempted ? Math.round(ok / attempted * 100) : 0;

    S.quiz.classList.add("hidden");
    S.results.classList.remove("hidden");
    S.bigscore.innerHTML = pct + "% <small>(" + ok + " / " + attempted + ")</small>";
    S.resultTitle.textContent = pct >= 80 ? "Excellent work" : pct >= 60 ? "Good effort" : "Needs more revision";
    S.resultNote.textContent = attempted < total
      ? "You answered " + attempted + " of " + total + " questions in this set."
      : pct >= 80 ? "You are exam-ready. Keep the streak going."
      : "Review the missed questions below, then run a retry.";

    var bySec = {};
    state.list.forEach(function (q) {
      var rec = state.answers[qKey(q)];
      if (!bySec[q.s]) bySec[q.s] = { ok: 0, n: 0 };
      if (rec) { bySec[q.s].n++; if (rec.ok) bySec[q.s].ok++; }
    });
    S.breakdown.innerHTML = "";
    Object.keys(bySec).forEach(function (k) {
      var d = document.createElement("div");
      d.className = "bd";
      d.innerHTML = "<b>" + bySec[k].ok + "/" + bySec[k].n + "</b>" + k;
      S.breakdown.appendChild(d);
    });

    renderReview();
    save();
    window.scrollTo({ top: 0 });
  }

  function renderReview() {
    S.reviewList.innerHTML = "";
    state.list.forEach(function (q) {
      var rec = state.answers[qKey(q)];
      if (!rec) return;
      var card = document.createElement("div");
      card.className = "card review";
      var opts = Object.keys(q.o).map(function (k) {
        var cls = q.a.indexOf(k) !== -1 ? "c" : (rec.choice === k ? "w" : "");
        return '<li class="' + cls + '"><b>' + k + "</b>. " + q.o[k] + "</li>";
      }).join("");
      card.innerHTML =
        '<span class="tag ' + (rec.ok ? "c" : "w") + '">' + (rec.ok ? "CORRECT" : "MISSED") + "</span>" +
        ' <span class="chip ghost">' + q.s + " · Q" + q.n + "</span>" +
        '<p class="stem" style="margin:10px 0 0">' + q.q + "</p>" +
        "<ul class='opts'>" + opts + "</ul>" +
        '<p class="explain" style="margin-top:10px">' + String(q.e).split("\n").join("<br>") + "</p>";
      S.reviewList.appendChild(card);
    });
  }

  /* ---------- events ---------- */
  el("startBtn").addEventListener("click", function () { start(true); });
  el("retryWrongBtn").addEventListener("click", function () {
    el("mistakesOnlyToggle").checked = true;
    start(true);
  });
  el("finishBtn").addEventListener("click", function () {
    S.results.classList.add("hidden");
    S.quiz.classList.add("hidden");
    S.setup.classList.remove("hidden");
  });
  el("reviewBtn").addEventListener("click", function () {
    S.reviewList.scrollIntoView({ behavior: "smooth" });
  });
  el("clearProgress").addEventListener("click", function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    state.answers = {};
    stats();
  });
  S.prev.addEventListener("click", function () { go(-1); });
  S.next.addEventListener("click", function () { go(1); });

  el("themeBtn").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  });

  document.addEventListener("keydown", function (e) {
    if (S.quiz.classList.contains("hidden")) return;
    var k = e.key;
    if (k >= "1" && k <= "5") {
      var idx = parseInt(k, 10) - 1;
      var btn = S.options.children[idx];
      if (btn) btn.click();
    } else if (k === "Enter") {
      e.preventDefault();
      go(1);
    } else if (k === "Backspace") {
      e.preventDefault();
      go(-1);
    }
  });

  /* ---------- init ---------- */
  buildModes();
  stats();
  var saved = load();
  if (saved && saved.answers && Object.keys(saved.answers).length) {
    var btn = el("startBtn");
    btn.textContent = "Resume (" + Object.keys(saved.answers).length + " answered)";
  }
})();