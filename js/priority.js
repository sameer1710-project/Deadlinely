/* =====================================================================
   Deadlinely – automatic priority engine  (the unique feature)

   Every pending assignment and every upcoming exam gets a score:

       score = urgency + importance + effort

   • urgency    – grows exponentially as the deadline approaches
                  (70 × e^(-days/5));  overdue items start at 100+
   • importance – Low 5 · Medium 15 · High 25   (exams are always High)
   • effort     – estimated hours × 1.2 (max 12h), halved if > 7 days away

   Score → level:  Critical ≥ 80 · High ≥ 55 · Medium ≥ 30 · Low < 30
   ===================================================================== */
const Priority = (() => {
  const IMPORTANCE = { low: 5, medium: 15, high: 25 };
  const LEVELS = [
    { key: "critical", label: "Critical", min: 80 },
    { key: "high", label: "High", min: 55 },
    { key: "medium", label: "Medium", min: 30 },
    { key: "low", label: "Low", min: 0 },
  ];

  /* ---- date helpers (all date-only, local time) ---- */
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const parseDate = (s) => {
    if (s instanceof Date) return startOfDay(s);
    const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const toISO = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const daysLeft = (s, now = new Date()) => Math.round((parseDate(s) - startOfDay(now)) / 86400000);

  /* ---- scoring ---- */
  const urgency = (days) => (days < 0 ? 100 + Math.min(20, -days * 2) : Math.round(70 * Math.exp(-days / 5)));

  function scoreOf({ date, importance = "medium", hours = 1 }, now = new Date()) {
    const days = daysLeft(date, now);
    const imp = IMPORTANCE[importance] ?? IMPORTANCE.medium;
    const effort = Math.min(Number(hours) || 0, 12) * 1.2 * (days <= 7 ? 1 : 0.5);
    return { days, score: Math.round(urgency(days) + imp + effort) };
  }
  const level = (score) => LEVELS.find((l) => score >= l.min);

  function reasons(item, days) {
    const r = [];
    if (days < 0) r.push(`Overdue by ${-days} day${-days > 1 ? "s" : ""}`);
    else if (days === 0) r.push("Due today");
    else if (days === 1) r.push("Due tomorrow");
    else r.push(`Due in ${days} days`);
    if (item.kind === "exam") r.push("Exam – needs revision time");
    else if (item.importance === "high") r.push("High importance");
    if (item.kind === "assignment" && Number(item.hours) >= 4) r.push(`~${item.hours}h of work`);
    if (item.status === "in-progress") r.push("Already started");
    return r;
  }

  /* ---- build the ranked list ---- */
  function normalise(assignments, exams) {
    const a = assignments
      .filter((x) => x.status !== "done")
      .map((x) => ({ kind: "assignment", id: x.id, title: x.title, subject: x.subject, date: x.due_date, importance: x.importance, hours: x.hours, status: x.status, raw: x }));
    const e = exams
      .filter((x) => daysLeft(x.exam_date) >= 0)
      .map((x) => ({ kind: "exam", id: x.id, title: `${x.subject}: ${x.title}`, subject: x.subject, date: x.exam_date, importance: "high", hours: 8, raw: x }));
    return [...a, ...e];
  }

  function build(assignments, exams = [], now = new Date()) {
    return normalise(assignments, exams)
      .map((it) => {
        const { days, score } = scoreOf(it, now);
        const lv = level(score);
        return { ...it, days, score, level: lv.key, levelLabel: lv.label, reasons: reasons(it, days) };
      })
      .sort((a, b) => b.score - a.score || parseDate(a.date) - parseDate(b.date));
  }

  /* ---- UI: one ranked card ---- */
  function card(it, rank) {
    const when = U.dueLabel(it.days);
    const done =
      it.kind === "assignment"
        ? `<button class="btn btn-sm btn-ghost" data-act="toggle" title="Mark as done">${U.icon("check", 14)} Done</button>`
        : `<span class="badge primary">Exam</span>`;
    return `
    <div class="p-item level-${it.level}" data-id="${it.id}" data-kind="${it.kind}">
      <div class="p-rank">${rank}</div>
      <div class="p-body">
        <div class="p-title">${U.esc(it.title)} <span class="tag">${U.esc(it.subject)}</span></div>
        <div class="p-meta">${U.fmtDate(it.date, { weekday: "short", day: "numeric", month: "short" })} · ${when}</div>
        <div class="p-reasons">${it.reasons.map((r) => `<span class="chip">${U.esc(r)}</span>`).join("")}</div>
      </div>
      <div class="p-side">
        <span class="badge ${it.level}">${it.levelLabel}</span>
        <div class="p-score">${it.score}<small>score</small></div>
        ${done}
      </div>
    </div>`;
  }

  /* ---- UI: Priority page ---- */
  let filter = "all";
  let bound = false;

  function page(data) {
    const list = build(data.assignments, data.exams);
    const host = document.getElementById("prList");
    const chips = document.getElementById("prChips");

    if (!bound) {
      bound = true;
      chips.addEventListener("click", (e) => {
        const b = e.target.closest("[data-level]");
        if (!b) return;
        filter = b.dataset.level;
        page(App.data);
      });
    }

    // focus plan = top 3 items
    const top = list.slice(0, 3);
    const hrs = top.reduce((s, x) => s + (x.kind === "exam" ? 2 : Number(x.hours) || 0), 0);
    document.getElementById("prFocus").innerHTML = top.length
      ? `<h3>Today's focus</h3>
         <p>Start with these ${top.length} — about ${Math.round(hrs * 10) / 10}h of work will clear the most pressing items.</p>
         <div class="focus-list">${top.map((x, i) => `<div><span>${i + 1}. ${U.esc(x.title)}</span><b>${U.dueLabel(x.days)}</b></div>`).join("")}</div>`
      : `<h3>You're all caught up 🎉</h3><p>No pending deadlines. Add a new assignment to see it ranked here.</p>`;

    const counts = Object.fromEntries(LEVELS.map((l) => [l.key, list.filter((x) => x.level === l.key).length]));
    chips.innerHTML =
      `<button class="chip-btn ${filter === "all" ? "active" : ""}" data-level="all">All (${list.length})</button>` +
      LEVELS.map((l) => `<button class="chip-btn ${filter === l.key ? "active" : ""}" data-level="${l.key}">${l.label} (${counts[l.key]})</button>`).join("");

    const shown = filter === "all" ? list : list.filter((x) => x.level === filter);
    host.innerHTML = shown.length
      ? shown.map((x) => card(x, list.indexOf(x) + 1)).join("")
      : `<div class="empty">${U.icon("flag")}<h4>Nothing in this level</h4><p>Pick another filter or add a new assignment.</p></div>`;
  }

  return { IMPORTANCE, LEVELS, parseDate, toISO, startOfDay, daysLeft, scoreOf, level, build, card, page };
})();
