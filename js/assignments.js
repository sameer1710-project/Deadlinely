/* Deadlinely – assignments: create, read, update, delete, filter, sort */
const Assignments = (() => {
  const STATUS = { pending: "Pending", "in-progress": "In progress", done: "Done" };
  const IMP = { low: "Low", medium: "Medium", high: "High" };

  const opts = (map, sel) => Object.entries(map).map(([k, v]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${v}</option>`).join("");

  function formHTML(a) {
    const subjects = [...new Set(App.data.assignments.map((x) => x.subject))].map((s) => `<option value="${U.esc(s)}">`).join("");
    return `
    <form id="aForm" novalidate>
      <div class="field"><label for="fTitle">Title *</label>
        <input class="input" id="fTitle" maxlength="120" value="${U.esc(a.title)}" placeholder="e.g. DBMS Assignment 3"></div>
      <div class="row">
        <div class="field"><label for="fSubject">Subject *</label>
          <input class="input" id="fSubject" list="subjectList" value="${U.esc(a.subject)}" placeholder="e.g. DBMS">
          <datalist id="subjectList">${subjects}</datalist></div>
        <div class="field"><label for="fDue">Due date *</label>
          <input class="input" type="date" id="fDue" value="${U.esc(a.due_date)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="fImp">Importance</label>
          <select class="select" id="fImp">${opts(IMP, a.importance || "medium")}</select></div>
        <div class="field"><label for="fHours">Estimated effort (hours)</label>
          <input class="input" type="number" id="fHours" min="0.5" max="40" step="0.5" value="${a.hours ?? 2}"></div>
      </div>
      <div class="field"><label for="fStatus">Status</label>
        <select class="select" id="fStatus">${opts(STATUS, a.status || "pending")}</select></div>
      <div class="field"><label for="fDesc">Notes</label>
        <textarea class="textarea" id="fDesc" placeholder="Optional details…">${U.esc(a.description)}</textarea></div>
      <div class="error" id="fErr"></div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save assignment</button>
      </div>
    </form>`;
  }

  function openForm(existing) {
    const a = existing || {};
    const isEdit = !!a.id;
    U.modal({
      title: isEdit ? "Edit assignment" : "New assignment",
      html: formHTML(a),
      onMount(el, close) {
        const $ = (id) => el.querySelector("#" + id);
        el.querySelector("[data-close]").onclick = close;
        el.querySelector("#aForm").onsubmit = async (ev) => {
          ev.preventDefault();
          const row = {
            title: $("fTitle").value.trim(),
            subject: $("fSubject").value.trim(),
            due_date: $("fDue").value,
            importance: $("fImp").value,
            hours: Number($("fHours").value) || 1,
            status: $("fStatus").value,
            description: $("fDesc").value.trim(),
          };
          if (!row.title || !row.subject || !row.due_date) { $("fErr").textContent = "Please fill in title, subject and due date."; return; }
          row.completed_at = row.status === "done" ? a.completed_at || new Date().toISOString() : null;
          try {
            if (isEdit) await DB.assignments.update(a.id, row);
            else await DB.assignments.create(row);
            U.toast(isEdit ? "Assignment updated" : "Assignment added");
            close();
            App.refresh();
          } catch (err) { $("fErr").textContent = err.message; }
        };
      },
    });
  }

  async function toggle(id) {
    const a = App.data.assignments.find((x) => x.id === id);
    if (!a) return;
    const done = a.status !== "done";
    try {
      await DB.assignments.update(id, { status: done ? "done" : "pending", completed_at: done ? new Date().toISOString() : null });
      U.toast(done ? "Nice work – marked as done ✔" : "Moved back to pending");
      App.refresh();
    } catch (err) { U.toast(err.message, "error"); }
  }

  async function remove(id) {
    const a = App.data.assignments.find((x) => x.id === id);
    if (!a || !(await U.confirm(`Delete "${a.title}"? This cannot be undone.`))) return;
    try { await DB.assignments.remove(id); U.toast("Assignment deleted"); App.refresh(); } catch (err) { U.toast(err.message, "error"); }
  }

  /* one row of the assignments list */
  function row(a) {
    const days = Priority.daysLeft(a.due_date);
    const done = a.status === "done";
    const { score } = Priority.scoreOf({ date: a.due_date, importance: a.importance, hours: a.hours });
    const lv = Priority.level(score);
    const due = done
      ? `${U.icon("check", 14)} Completed ${a.completed_at ? U.fmtDate(a.completed_at, { day: "numeric", month: "short" }) : ""}`
      : `${U.icon("clock", 14)} <span class="${days < 0 ? "over" : ""}">${U.fmtDate(a.due_date, { day: "numeric", month: "short" })} · ${U.dueLabel(days)}</span>`;
    return `
    <div class="a-row ${done ? "is-done" : ""}" data-id="${a.id}" data-kind="assignment">
      <button class="check ${done ? "checked" : ""}" data-act="toggle" title="Mark as ${done ? "pending" : "done"}" aria-label="Toggle done">${U.icon("check")}</button>
      <div class="a-main">
        <div class="a-title">${U.esc(a.title)}</div>
        <div class="a-meta"><span class="tag">${U.esc(a.subject)}</span><span>${due}</span><span>~${a.hours}h</span></div>
      </div>
      <div class="a-badges">
        ${done ? '<span class="badge done">Done</span>' : `<span class="badge ${lv.key}">${lv.label}</span>`}
        <span class="badge">${STATUS[a.status] || a.status}</span>
      </div>
      <div class="a-actions">
        <button class="btn btn-ghost btn-icon btn-sm" data-act="edit" title="Edit">${U.icon("edit", 15)}</button>
        <button class="btn btn-ghost btn-icon btn-sm" data-act="delete" title="Delete">${U.icon("trash", 15)}</button>
      </div>
    </div>`;
  }

  /* ---- assignments page ---- */
  let bound = false;
  const $ = (id) => document.getElementById(id);

  function render() {
    const q = $("aSearch").value.trim().toLowerCase();
    const st = $("aStatus").value, subj = $("aSubject").value, sort = $("aSort").value;
    let list = App.data.assignments.filter((a) => {
      if (q && !(a.title + " " + a.subject + " " + (a.description || "")).toLowerCase().includes(q)) return false;
      if (subj && a.subject !== subj) return false;
      if (st === "overdue") return a.status !== "done" && Priority.daysLeft(a.due_date) < 0;
      if (st && st !== "all") return a.status === st;
      return true;
    });
    const score = (a) => Priority.scoreOf({ date: a.due_date, importance: a.importance, hours: a.hours }).score;
    const sorters = {
      due: (a, b) => Priority.parseDate(a.due_date) - Priority.parseDate(b.due_date),
      priority: (a, b) => (a.status === "done") - (b.status === "done") || score(b) - score(a),
      subject: (a, b) => a.subject.localeCompare(b.subject) || Priority.parseDate(a.due_date) - Priority.parseDate(b.due_date),
      recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    };
    list = list.sort(sorters[sort]);
    // keep finished work at the bottom for date-based sorting
    if (sort === "due") list = [...list.filter((a) => a.status !== "done"), ...list.filter((a) => a.status === "done")];

    const total = App.data.assignments.length;
    $("aSummary").textContent = `Showing ${list.length} of ${total} assignment${total === 1 ? "" : "s"}`;
    $("aList").innerHTML = list.length
      ? list.map(row).join("")
      : `<div class="empty">${U.icon("list")}<h4>${total ? "No matching assignments" : "No assignments yet"}</h4>
         <p>${total ? "Try clearing the filters." : "Add your first assignment to get started."}</p></div>`;
  }

  function page(data) {
    const cur = $("aSubject").value;
    const subjects = [...new Set(data.assignments.map((a) => a.subject))].sort();
    $("aSubject").innerHTML = `<option value="">All subjects</option>` + subjects.map((s) => `<option ${s === cur ? "selected" : ""}>${U.esc(s)}</option>`).join("");
    if (!bound) {
      bound = true;
      ["aSearch", "aStatus", "aSubject", "aSort"].forEach((id) => $(id).addEventListener(id === "aSearch" ? "input" : "change", render));
      $("aAdd").onclick = () => openForm();
    }
    render();
  }

  return { openForm, toggle, remove, row, page };
})();
