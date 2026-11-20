/* Deadlinely – academic progress statistics */
const Progress = (() => {
  function stats(assignments) {
    const total = assignments.length;
    const done = assignments.filter((a) => a.status === "done");
    const pending = assignments.filter((a) => a.status !== "done");
    const overdue = pending.filter((a) => Priority.daysLeft(a.due_date) < 0);
    const dueWeek = pending.filter((a) => { const d = Priority.daysLeft(a.due_date); return d >= 0 && d <= 7; });
    const doneISO = (a) => (a.completed_at ? Priority.toISO(new Date(a.completed_at)) : null);
    const onTime = done.filter((a) => doneISO(a) && doneISO(a) <= String(a.due_date).slice(0, 10));
    const completion = total ? Math.round((done.length / total) * 100) : 0;
    const onTimeRate = done.length ? Math.round((onTime.length / done.length) * 100) : 0;
    const discipline = total ? Math.round(0.6 * completion + 0.4 * onTimeRate) : 0;

    // streak = consecutive days (ending today, or yesterday) with at least one completed task
    const days = new Set(done.map(doneISO).filter(Boolean));
    let streak = 0;
    const cur = Priority.startOfDay(new Date());
    if (!days.has(Priority.toISO(cur))) cur.setDate(cur.getDate() - 1);
    while (days.has(Priority.toISO(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

    // completions per rolling 7-day window (6 windows)
    const weekly = [];
    for (let w = 5; w >= 0; w--) {
      const end = Priority.startOfDay(new Date()); end.setDate(end.getDate() - 7 * w);
      const begin = new Date(end); begin.setDate(begin.getDate() - 6);
      const count = done.filter((a) => { const d = doneISO(a); return d && d >= Priority.toISO(begin) && d <= Priority.toISO(end); }).length;
      const f = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      weekly.push({ label: `${f(begin)}–${f(end)}`, count });
    }

    const bySubject = {};
    assignments.forEach((a) => {
      const s = (bySubject[a.subject] ||= { total: 0, done: 0 });
      s.total++; if (a.status === "done") s.done++;
    });

    return { total, done: done.length, pending: pending.length, overdue: overdue.length, dueWeek: dueWeek.length, completion, onTimeRate, discipline, streak, weekly, bySubject };
  }

  function ring(pct, label = "complete") {
    const r = 54, c = 2 * Math.PI * r;
    return `<div class="ring">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle class="ring-track" cx="70" cy="70" r="${r}" fill="none" stroke-width="14"/>
        <circle class="ring-bar" cx="70" cy="70" r="${r}" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${(pct / 100) * c} ${c}"/>
      </svg>
      <div class="ring-label"><div><b>${pct}%</b><small>${label}</small></div></div>
    </div>`;
  }

  const statCard = (label, value, sub, tone, icon) =>
    `<div class="stat ${tone}"><div class="stat-ic">${U.icon(icon, 22)}</div>
     <div><div class="stat-val">${value}</div><div class="stat-label">${label}</div>${sub ? `<div class="stat-sub">${sub}</div>` : ""}</div></div>`;

  function insight(s) {
    if (!s.total) return "Add assignments to start tracking your progress.";
    if (s.overdue) return `Clear your ${s.overdue} overdue task${s.overdue > 1 ? "s" : ""} first – it is the fastest way to lift your discipline score.`;
    if (s.dueWeek) return `No overdue work – ${s.dueWeek} task${s.dueWeek > 1 ? "s are" : " is"} due this week. Keep the streak going!`;
    return "You're ahead of schedule. Use the free time to start your next big task.";
  }

  function page(data) {
    const s = stats(data.assignments);
    document.getElementById("progStats").innerHTML =
      statCard("Discipline score", s.discipline, "60% completion + 40% on-time", "", "zap") +
      statCard("Completed", `${s.done}/${s.total}`, `${s.completion}% of all tasks`, "low", "check") +
      statCard("On-time rate", `${s.onTimeRate}%`, "finished before the deadline", "", "clock") +
      statCard("Day streak", s.streak, s.streak ? "days with a completed task" : "complete a task today!", "high", "flag");

    document.getElementById("progRing").innerHTML = `<div class="ring-wrap">${ring(s.completion)}
      <div class="kv">
        <div><span>Pending</span><b>${s.pending}</b></div>
        <div><span>Due this week</span><b>${s.dueWeek}</b></div>
        <div><span>Overdue</span><b style="color:${s.overdue ? "var(--critical)" : "inherit"}">${s.overdue}</b></div>
        <div><span>Completed</span><b>${s.done}</b></div>
      </div></div><div class="insight">${insight(s)}</div>`;

    const max = Math.max(1, ...s.weekly.map((w) => w.count));
    document.getElementById("progWeekly").innerHTML = `<div class="bars">${s.weekly.map((w) =>
      `<div class="bar-col"><span class="bar-val">${w.count}</span><div class="bar" style="height:${Math.max(3, (w.count / max) * 100)}%"></div><span class="bar-label">${w.label}</span></div>`).join("")}</div>`;

    const subs = Object.entries(s.bySubject).sort((a, b) => b[1].total - a[1].total);
    document.getElementById("progSubjects").innerHTML = subs.length
      ? subs.map(([name, v]) => `<div class="subj-row"><div class="top"><span>${U.esc(name)}</span><span class="muted">${v.done}/${v.total} done</span></div>
          <div class="track"><i style="width:${Math.round((v.done / v.total) * 100)}%"></i></div></div>`).join("")
      : `<div class="empty">${U.icon("chart")}<p>No data yet.</p></div>`;
  }

  return { stats, ring, statCard, page };
})();
