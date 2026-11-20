/* Deadlinely – deadline reminders (in-app bell + optional browser notifications) */
const Notifications = (() => {
  let current = [];

  function alerts(data) {
    const out = [];
    data.assignments.filter((a) => a.status !== "done").forEach((a) => {
      const d = Priority.daysLeft(a.due_date);
      if (d > 2) return;
      out.push({
        id: `a-${a.id}`, d, tone: d < 0 ? "critical" : d === 0 ? "critical" : d === 1 ? "high" : "medium",
        title: d < 0 ? `Overdue: ${a.title}` : d === 0 ? `Due today: ${a.title}` : d === 1 ? `Due tomorrow: ${a.title}` : `Due in 2 days: ${a.title}`,
        text: `${a.subject} · ${U.fmtDate(a.due_date, { day: "numeric", month: "short" })}`,
      });
    });
    data.exams.forEach((e) => {
      const d = Priority.daysLeft(e.exam_date);
      if (d < 0 || d > 3) return;
      out.push({
        id: `e-${e.id}`, d, tone: d <= 1 ? "critical" : "high",
        title: d === 0 ? `Exam today: ${e.subject}` : `Exam in ${d} day${d > 1 ? "s" : ""}: ${e.subject}`,
        text: `${e.title}${e.venue ? " · " + e.venue : ""}`,
      });
    });
    return out.sort((a, b) => a.d - b.d);
  }

  function render() {
    const dot = document.getElementById("bellDot");
    const panel = document.getElementById("notifPanel");
    if (!dot || !panel) return;
    dot.hidden = !current.length;
    dot.textContent = current.length > 9 ? "9+" : current.length;
    const canAsk = "Notification" in window && Notification.permission === "default";
    panel.innerHTML = `
      <div class="notif-head"><span>Reminders</span><span class="muted">${current.length}</span></div>
      ${current.length
        ? current.map((n) => `<div class="notif-item ${n.tone}"><div class="n-ic">${U.icon("alert", 15)}</div><div><strong>${U.esc(n.title)}</strong><span>${U.esc(n.text)}</span></div></div>`).join("")
        : `<div class="empty">${U.icon("bell")}<p>No urgent deadlines. You're on track!</p></div>`}
      ${canAsk ? `<div class="notif-foot"><button class="btn btn-sm btn-primary" id="enableNotif">Enable browser alerts</button></div>` : ""}`;
    const btn = document.getElementById("enableNotif");
    if (btn) btn.onclick = async () => {
      const res = await Notification.requestPermission();
      U.toast(res === "granted" ? "Browser alerts enabled" : "Browser alerts not allowed", res === "granted" ? "ok" : "error");
      pushBrowser();
      render();
    };
  }

  /* each reminder is shown as a system notification at most once per day */
  function pushBrowser() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const key = "dl_notified_" + Priority.toISO(new Date());
    const seen = LS.get(key, []);
    current.filter((n) => n.d <= 1 && !seen.includes(n.id)).forEach((n) => {
      try { new Notification("Deadlinely – " + n.title, { body: n.text, icon: (document.body.dataset.base || "") + "assets/icons/icon.svg" }); } catch { /* ignore */ }
      seen.push(n.id);
    });
    LS.set(key, seen);
  }

  function update(data) {
    current = alerts(data);
    render();
    pushBrowser();
  }

  function init() {
    const bell = document.getElementById("bellBtn");
    const panel = document.getElementById("notifPanel");
    if (!bell || !panel) return;
    bell.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; };
    document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
  }

  async function enable() {
    if (!("Notification" in window)) { U.toast("This browser does not support notifications", "error"); return; }
    const res = await Notification.requestPermission();
    U.toast(res === "granted" ? "Browser alerts enabled" : "Browser alerts blocked", res === "granted" ? "ok" : "error");
    pushBrowser();
  }

  return { alerts, update, init, enable, get count() { return current.length; } };
})();
