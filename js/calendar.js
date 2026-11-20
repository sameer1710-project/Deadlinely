/* Deadlinely – month calendar with assignments and exams */
const Calendar = (() => {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let view = null;
  let selected = null;
  let bound = false;
  const $ = (id) => document.getElementById(id);

  function eventsByDate(data) {
    const map = {};
    const add = (date, ev) => (map[String(date).slice(0, 10)] ||= []).push(ev);
    data.assignments.forEach((a) => {
      const lv = a.status === "done" ? "done" : Priority.level(Priority.scoreOf({ date: a.due_date, importance: a.importance, hours: a.hours }).score).key;
      add(a.due_date, { kind: "assignment", cls: lv, title: a.title, item: a });
    });
    data.exams.forEach((e) => add(e.exam_date, { kind: "exam", cls: "exam", title: `${e.subject} exam`, item: e }));
    return map;
  }

  function render() {
    const data = App.data;
    const map = eventsByDate(data);
    const todayISO = Priority.toISO(new Date());
    const first = new Date(view.y, view.m, 1);
    const start = new Date(view.y, view.m, 1 - first.getDay()); // Sunday-first grid
    $("calTitle").textContent = `${MONTHS[view.m]} ${view.y}`;

    let cells = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = Priority.toISO(d);
      const evs = map[iso] || [];
      cells += `
      <button class="cal-cell ${d.getMonth() !== view.m ? "other" : ""} ${iso === todayISO ? "today" : ""} ${iso === selected ? "selected" : ""}" data-date="${iso}">
        <span class="cal-num">${d.getDate()}</span>
        ${evs.slice(0, 2).map((ev) => `<span class="cal-ev ${ev.cls}">${U.esc(ev.title)}</span>`).join("")}
        ${evs.length > 2 ? `<span class="cal-more">+${evs.length - 2} more</span>` : ""}
      </button>`;
    }
    $("calGrid").innerHTML = cells;
    renderDetail(map[selected] || []);
  }

  function renderDetail(evs) {
    const d = Priority.parseDate(selected);
    const head = `<div class="card-head"><h3>${U.fmtDate(selected, { weekday: "long", day: "numeric", month: "long" })}</h3>
      <button class="btn btn-sm btn-primary" id="calAdd">${U.icon("plus", 14)} Add</button></div>`;
    const body = evs.length
      ? evs.map((ev) => ev.kind === "exam"
          ? `<div class="day-item" data-id="${ev.item.id}" data-kind="exam"><span class="badge primary">Exam</span>
              <div class="grow"><strong>${U.esc(ev.item.subject)}: ${U.esc(ev.item.title)}</strong>
              <div class="muted" style="font-size:13px">${ev.item.venue ? U.esc(ev.item.venue) : "Venue not set"}</div></div></div>`
          : `<div class="day-item" data-id="${ev.item.id}" data-kind="assignment">
              <button class="check ${ev.item.status === "done" ? "checked" : ""}" data-act="toggle" aria-label="Toggle done">${U.icon("check")}</button>
              <div class="grow"><strong>${U.esc(ev.item.title)}</strong>
              <div class="muted" style="font-size:13px">${U.esc(ev.item.subject)} · ~${ev.item.hours}h</div></div>
              <span class="badge ${ev.cls}">${ev.cls === "done" ? "Done" : Priority.LEVELS.find((l) => l.key === ev.cls).label}</span></div>`).join("")
      : `<div class="empty">${U.icon("calendar")}<h4>Nothing due</h4><p>${d < Priority.startOfDay(new Date()) ? "No deadlines on this day." : "A free day – use it to get ahead!"}</p></div>`;
    $("calDetail").innerHTML = head + body;
    $("calAdd").onclick = () => Assignments.openForm({ due_date: selected });
  }

  function page() {
    const today = new Date();
    if (!view) view = { y: today.getFullYear(), m: today.getMonth() };
    if (!selected) selected = Priority.toISO(today);
    if (!bound) {
      bound = true;
      $("calDow").innerHTML = DOW.map((d) => `<div>${d}</div>`).join("");
      $("calPrev").onclick = () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); };
      $("calNext").onclick = () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); };
      $("calToday").onclick = () => { const t = new Date(); view = { y: t.getFullYear(), m: t.getMonth() }; selected = Priority.toISO(t); render(); };
      $("calGrid").addEventListener("click", (e) => {
        const c = e.target.closest("[data-date]");
        if (!c) return;
        selected = c.dataset.date;
        const d = Priority.parseDate(selected);
        if (d.getMonth() !== view.m) view = { y: d.getFullYear(), m: d.getMonth() };
        render();
      });
    }
    render();
  }

  return { page };
})();
