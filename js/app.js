/* =====================================================================
   Deadlinely – core: constants, helpers, app shell, dashboard, profile
   Loaded last on every page.
   ===================================================================== */
const APP = {
  name: "Deadlinely",
  tagline: "Assignment Tracking SaaS",
  project: "Project 6 – Open Innovation · SaaS for students and educational institutions",
  student: { name: "SD. Sameer Ahamed", prn: "250200175" },
};
const BASE = document.body.dataset.base || "";
const PAGE = document.body.dataset.page;

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "assignments", label: "Assignments", icon: "list" },
  { id: "priority", label: "Priority List", icon: "flag" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "exams", label: "Exams", icon: "book" },
  { id: "progress", label: "Progress", icon: "chart" },
  { id: "profile", label: "Profile", icon: "user" },
];

/* ---------- icons (Feather-style) ---------- */
const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  list: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  left: '<polyline points="15 18 9 12 15 6"/>',
  right: '<polyline points="9 18 15 12 9 6"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
};

/* ---------- helpers ---------- */
const U = {
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  icon(name, size) {
    const s = size ? ` style="width:${size}px;height:${size}px"` : "";
    return `<svg class="i" viewBox="0 0 24 24"${s} aria-hidden="true">${ICONS[name] || ""}</svg>`;
  },
  fmtDate(value, opts) {
    const d = typeof value === "string" && value.length <= 10 ? Priority.parseDate(value) : new Date(value);
    return d.toLocaleDateString("en-IN", opts || { day: "numeric", month: "short", year: "numeric" });
  },
  dueLabel(days) {
    if (days < 0) return `${-days} day${-days > 1 ? "s" : ""} overdue`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
  },
  initials(name) {
    const w = String(name || "?").split(/\s+/).filter(Boolean);
    return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  },
  firstName(name) {
    const w = String(name || "").split(/\s+/).filter((x) => x && !x.endsWith("."));
    return w[0] || name || "there";
  },
  toast(msg, type) {
    let host = document.querySelector(".toasts");
    if (!host) { host = document.createElement("div"); host.className = "toasts"; document.body.appendChild(host); }
    const t = document.createElement("div");
    t.className = "toast" + (type === "error" ? " error" : "");
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },
  modal({ title, html, onMount }) {
    const back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${U.esc(title)}">
      <div class="modal-head"><h3>${U.esc(title)}</h3><button class="btn btn-ghost btn-icon btn-sm" data-x aria-label="Close">${U.icon("x")}</button></div>
      <div class="modal-body">${html}</div></div>`;
    document.body.appendChild(back);
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
    document.addEventListener("keydown", onKey);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    back.querySelector("[data-x]").onclick = close;
    if (onMount) onMount(back, close);
    const first = back.querySelector("input,select,textarea");
    if (first) first.focus();
    return { el: back, close };
  },
  confirm(message) {
    return new Promise((resolve) => {
      let answered = false;
      const m = U.modal({
        title: "Please confirm",
        html: `<p style="margin-bottom:18px">${U.esc(message)}</p>
          <div class="modal-foot"><button class="btn btn-ghost" data-no>Cancel</button><button class="btn btn-danger" data-yes>Delete</button></div>`,
        onMount(el, close) {
          el.querySelector("[data-no]").onclick = () => { answered = true; close(); resolve(false); };
          el.querySelector("[data-yes]").onclick = () => { answered = true; close(); resolve(true); };
        },
      });
      new MutationObserver((_, obs) => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!answered) resolve(false); } })
        .observe(document.body, { childList: true });
    });
  },
};

/* ---------- theme ---------- */
const Theme = {
  get() { return LS.get("dl_theme", "light"); },
  apply(t) { document.documentElement.dataset.theme = t; },
  toggle() { const t = Theme.get() === "dark" ? "light" : "dark"; LS.set("dl_theme", t); Theme.apply(t); const b = document.getElementById("themeBtn"); if (b) b.innerHTML = U.icon(t === "dark" ? "sun" : "moon"); },
};
Theme.apply(Theme.get());

/* ---------- app shell (sidebar + top bar + footer) ---------- */
function renderShell(user) {
  const link = (id) => `${id}.html`;
  document.getElementById("sidebar").innerHTML = `
    <a class="brand" href="dashboard.html"><span class="brand-logo">${U.icon("check")}</span>${APP.name}</a>
    <nav class="nav">${NAV.map((n) => `
      <a href="${link(n.id)}" class="${n.id === PAGE ? "active" : ""}">${U.icon(n.icon)}<span>${n.label}</span>
      ${n.id === "priority" ? '<span class="count" id="navCount" hidden></span>' : ""}</a>`).join("")}</nav>
    <div class="student-card">
      <small>Project by</small>
      <div><strong>Name:</strong> ${U.esc(APP.student.name)}</div>
      <div><strong>PRN:</strong> ${U.esc(APP.student.prn)}</div>
      <div class="stack-line">${DB.mode === "demo" ? "Demo mode · local data" : "Supabase · cloud sync"}</div>
    </div>`;

  const title = (NAV.find((n) => n.id === PAGE) || {}).label || APP.name;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  document.getElementById("topbar").innerHTML = `
    <button class="btn btn-ghost btn-icon menu-btn" id="menuBtn" aria-label="Open menu">${U.icon("menu")}</button>
    <div class="topbar-title"><h1>${title}</h1><p>${today}</p></div>
    <div class="topbar-actions">
      <button class="btn btn-primary" data-action="add-assignment">${U.icon("plus")}<span class="hide-sm">Add assignment</span></button>
      <div class="bell-wrap">
        <button class="btn btn-ghost btn-icon" id="bellBtn" aria-label="Reminders">${U.icon("bell")}<span class="bell-dot" id="bellDot" hidden>0</span></button>
        <div class="notif-panel" id="notifPanel" hidden></div>
      </div>
      <button class="btn btn-ghost btn-icon" id="themeBtn" aria-label="Toggle theme">${U.icon(Theme.get() === "dark" ? "sun" : "moon")}</button>
      <div class="avatar-wrap">
        <button class="avatar" id="avatarBtn" aria-label="Account menu">${U.esc(U.initials(user.name))}</button>
        <div class="menu" id="avatarMenu" hidden>
          <div class="who"><strong>${U.esc(user.name)}</strong><span class="muted">${U.esc(user.email)}</span></div>
          <a href="profile.html">${U.icon("user", 16)} Profile</a>
          <button id="logoutBtn">${U.icon("logout", 16)} Log out</button>
        </div>
      </div>
    </div>`;

  document.getElementById("appFooter").innerHTML = `
    <span>© ${new Date().getFullYear()} <b>${APP.name}</b> – ${APP.tagline}</span>
    <span><b>Name:</b> ${U.esc(APP.student.name)} &nbsp;·&nbsp; <b>PRN:</b> ${U.esc(APP.student.prn)}</span>`;

  /* interactions */
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const setMenu = (open) => { sidebar.classList.toggle("open", open); scrim.hidden = !open; };
  scrim.hidden = true;
  document.getElementById("menuBtn").onclick = () => setMenu(true);
  scrim.onclick = () => setMenu(false);
  document.getElementById("themeBtn").onclick = Theme.toggle;
  const menu = document.getElementById("avatarMenu");
  document.getElementById("avatarBtn").onclick = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true; });
  document.getElementById("logoutBtn").onclick = () => Auth.logout();
  Notifications.init();
}

/* ---------- Dashboard ---------- */
function dashboardPage(data, user) {
  const list = Priority.build(data.assignments, data.exams);
  const s = Progress.stats(data.assignments);
  const hr = new Date().getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const urgent = list.filter((x) => x.level === "critical").length;

  document.getElementById("welcomeTitle").textContent = `${greet}, ${U.firstName(user.name)} 👋`;
  document.getElementById("welcomeSub").textContent = s.pending
    ? `You have ${s.pending} pending task${s.pending > 1 ? "s" : ""}${urgent ? ` – ${urgent} need${urgent > 1 ? "" : "s"} attention right now.` : " and nothing critical. Nice and steady."}`
    : "No pending tasks. Add a new assignment to get started.";

  document.getElementById("statCards").innerHTML =
    Progress.statCard("Pending tasks", s.pending, `${s.total} in total`, "", "list") +
    Progress.statCard("Due this week", s.dueWeek, "next 7 days", "high", "calendar") +
    Progress.statCard("Overdue", s.overdue, s.overdue ? "needs action" : "all clear", s.overdue ? "critical" : "low", "alert") +
    Progress.statCard("Completed", `${s.completion}%`, `${s.done} finished`, "low", "check");

  const top = list.slice(0, 5);
  document.getElementById("dashPriority").innerHTML = top.length
    ? `<div class="compact">${top.map((x, i) => Priority.card(x, i + 1)).join("")}</div>`
    : `<div class="empty">${U.icon("flag")}<h4>Nothing to prioritise</h4><p>Add an assignment and it will be ranked here automatically.</p></div>`;

  document.getElementById("dashProgress").innerHTML = `<div class="ring-wrap">${Progress.ring(s.completion)}
    <div class="kv"><div><span>Discipline score</span><b>${s.discipline}</b></div><div><span>On-time rate</span><b>${s.onTimeRate}%</b></div><div><span>Day streak</span><b>${s.streak}</b></div></div></div>`;
  document.getElementById("dashExams").innerHTML = Exams.mini(data, 3);
}

/* ---------- Profile ---------- */
let profileBound = false;
function profilePage(data, user) {
  const $ = (id) => document.getElementById(id);
  $("pAvatar").textContent = U.initials(user.name);
  $("pHeadName").textContent = user.name;
  $("pHeadEmail").textContent = user.email;
  $("pName").value = user.name || "";
  $("pPrn").value = user.prn || "";
  $("pEmail").value = user.email || "";
  $("pInst").value = user.institution || "";
  $("pCourse").value = user.course || "";
  $("pMode").textContent = DB.mode === "demo" ? "Demo mode (data stored in this browser)" : "Supabase cloud (synced)";
  $("pCounts").textContent = `${data.assignments.length} assignments · ${data.exams.length} exams`;
  $("pNotif").textContent = "Notification" in window ? (Notification.permission === "granted" ? "Enabled" : Notification.permission === "denied" ? "Blocked in browser settings" : "Not enabled") : "Not supported";
  $("pTheme").value = Theme.get();

  if (profileBound) return;
  profileBound = true;
  $("profileForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = $("pName").value.trim();
    if (!name) { $("pErr").textContent = "Name is required."; return; }
    $("pErr").textContent = "";
    try {
      App.user = await DB.auth.updateProfile({ name, prn: $("pPrn").value.trim(), institution: $("pInst").value.trim(), course: $("pCourse").value.trim() });
      renderShell(App.user);
      Notifications.update(App.data);
      U.toast("Profile saved");
      profilePage(App.data, App.user);
    } catch (err) { $("pErr").textContent = err.message; }
  };
  $("pTheme").onchange = (e) => { LS.set("dl_theme", e.target.value); Theme.apply(e.target.value); renderShell(App.user); Notifications.update(App.data); };
  $("pEnableNotif").onclick = async () => { await Notifications.enable(); profilePage(App.data, App.user); };
  $("pExport").onclick = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: { name: App.user.name, prn: App.user.prn, email: App.user.email }, assignments: App.data.assignments, exams: App.data.exams }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "deadlinely-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("pSample").onclick = async () => { await DB.seedSample(); U.toast("Sample data added"); App.refresh(); };
  $("pClear").onclick = async () => {
    if (!(await U.confirm("Delete ALL your assignments and exams? This cannot be undone."))) return;
    await DB.clearAll();
    U.toast("All data cleared");
    App.refresh();
  };
}

/* ---------- Landing page ---------- */
async function landingPage() {
  const user = await DB.auth.user();
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
  const demo = document.querySelectorAll("[data-demo]");
  demo.forEach((b) => {
    if (DB.mode !== "demo") b.hidden = true;
    else b.onclick = (e) => { e.preventDefault(); Auth.demoLogin(); };
  });
  if (user) {
    document.querySelectorAll("[data-auth-link]").forEach((a) => { a.textContent = "Open dashboard"; a.href = "pages/dashboard.html"; });
    document.querySelectorAll("[data-login-link]").forEach((a) => { a.hidden = true; });
  }
}

/* ---------- boot ---------- */
const App = {
  user: null,
  data: { assignments: [], exams: [] },

  async loadData() {
    const [assignments, exams] = await Promise.all([DB.assignments.list(), DB.exams.list()]);
    this.data = { assignments, exams };
  },

  async refresh() {
    try { await this.loadData(); } catch (err) { U.toast(err.message || "Could not load data", "error"); }
    Notifications.update(this.data);
    const n = Priority.build(this.data.assignments, this.data.exams).filter((x) => x.level === "critical").length;
    const badge = document.getElementById("navCount");
    if (badge) { badge.hidden = !n; badge.textContent = n; }
    const route = ROUTES[PAGE];
    if (route) route(this.data, this.user);
  },
};

const ROUTES = {
  dashboard: dashboardPage,
  assignments: (d) => Assignments.page(d),
  priority: (d) => Priority.page(d),
  calendar: (d) => Calendar.page(d),
  exams: (d) => Exams.page(d),
  progress: (d) => Progress.page(d),
  profile: profilePage,
};

/* one delegated handler for every row action (done / edit / delete) */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-action='add-assignment']");
  if (add) { Assignments.openForm(); return; }
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const host = btn.closest("[data-id]");
  if (!host) return;
  const id = host.dataset.id, kind = host.dataset.kind || "assignment", act = btn.dataset.act;
  if (kind === "exam") {
    if (act === "edit") Exams.openForm(App.data.exams.find((x) => x.id === id));
    if (act === "delete") Exams.remove(id);
  } else {
    if (act === "toggle") Assignments.toggle(id);
    if (act === "edit") Assignments.openForm(App.data.assignments.find((x) => x.id === id));
    if (act === "delete") Assignments.remove(id);
  }
});

(async function boot() {
  if (PAGE === "landing") { landingPage(); }
  else if (ROUTES[PAGE]) {
    App.user = await DB.auth.user();
    if (!App.user) { location.href = "login.html"; return; }
    renderShell(App.user);
    await App.refresh();
  }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register(BASE + "service-worker.js").catch(() => {});
  }
})();
