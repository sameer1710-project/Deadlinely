
/* Deadlinely – examination schedule */

const Exams = (() => {

  function formHTML(e) {
    return `
    <form id="eForm" novalidate>
      <div class="row">
        <div class="field">
          <label for="eSubject">Subject *</label>
          <input class="input" id="eSubject"
            value="${U.esc(e.subject)}"
            placeholder="e.g. DBMS">
        </div>

        <div class="field">
          <label for="eTitle">Exam name *</label>
          <input class="input" id="eTitle"
            value="${U.esc(e.title)}"
            placeholder="e.g. Mid-semester exam">
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="eDate">Date *</label>
          <input class="input" type="date" id="eDate"
            value="${U.esc(e.exam_date)}">
        </div>

        <div class="field">
          <label for="eTime">Time</label>
          <input class="input" type="time" id="eTime"
            value="${U.esc(e.exam_time)}">
        </div>
      </div>

      <div class="field">
        <label for="eVenue">Venue</label>
        <input class="input" id="eVenue"
          value="${U.esc(e.venue)}"
          placeholder="e.g. Hall A-101">
      </div>

      <div class="field">
        <label for="eSyl">Syllabus / topics</label>
        <textarea class="textarea" id="eSyl"
          placeholder="Units or topics covered">${U.esc(e.syllabus)}</textarea>
      </div>

      <div class="error" id="eErr"></div>

      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" data-close>
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">
          Save exam
        </button>
      </div>
    </form>`;
  }


  function openForm(existing) {
    const e = existing || {};
    const isEdit = !!e.id;

    U.modal({
      title: isEdit ? "Edit exam" : "Add exam",
      html: formHTML(e),

      onMount(el, close) {
        const $ = (id) => el.querySelector("#" + id);

        el.querySelector("[data-close]").onclick = close;

        el.querySelector("#eForm").onsubmit = async (ev) => {
          ev.preventDefault();

          const row = {
            subject: $("eSubject").value.trim(),
            title: $("eTitle").value.trim(),
            exam_date: $("eDate").value,
            exam_time: $("eTime").value || null,
            venue: $("eVenue").value.trim(),
            syllabus: $("eSyl").value.trim()
          };

          if (!row.subject || !row.title || !row.exam_date) {
            $("eErr").textContent =
              "Please fill in subject, exam name and date.";
            return;
          }

          try {
            // Get the logged-in user
            const {
              data: { user },
              error
            } = await sb.auth.getUser();

            if (error || !user) {
              throw new Error("Please log in again.");
            }

            // Attach the user ID for Supabase RLS
            row.user_id = user.id;

            // Save or update the exam
            if (isEdit) {
              await DB.exams.update(e.id, row);
            } else {
              await DB.exams.create(row);
            }

            U.toast(isEdit ? "Exam updated" : "Exam added");
            close();
            App.refresh();

          } catch (err) {
            $("eErr").textContent =
              err.message || "Unable to save exam.";
          }
        };
      }
    });
  }


  async function remove(id) {
    const e = App.data.exams.find((x) => x.id === id);

    if (
      !e ||
      !(await U.confirm(
        `Delete the ${e.subject} exam? This cannot be undone.`
      ))
    ) return;

    try {
      await DB.exams.remove(id);
      U.toast("Exam deleted");
      App.refresh();
    } catch (err) {
      U.toast(err.message, "error");
    }
  }


  const tip = (d) =>
    d < 0
      ? "Completed"
      : d === 0
      ? "Exam day – stay calm, all the best!"
      : d <= 3
      ? "Final stretch: light revision and good sleep"
      : d <= 7
      ? "Solve previous papers and revise weak topics"
      : d <= 21
      ? "Revision window: aim for 1–2 focused hours a day"
      : "Plenty of time – outline your revision plan";


  const fmtTime = (t) => {
    if (!t) return "";

    const [h, m] = t.split(":").map(Number);

    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${
      h >= 12 ? "PM" : "AM"
    }`;
  };


  function card(e) {
    const d = Priority.daysLeft(e.exam_date);
    const past = d < 0;

    return `
    <div class="exam-card ${past ? "past" : ""}"
         data-id="${e.id}" data-kind="exam">

      <div class="exam-count ${!past && d <= 3 ? "soon" : ""}">
        <span class="num">
          ${past ? "✓" : d === 0 ? "Today" : d}
        </span>
        <span>
          ${past ? "over" : d === 1 ? "day" : d === 0 ? "" : "days"}
        </span>
      </div>

      <div class="exam-body">
        <h4>${U.esc(e.subject)}: ${U.esc(e.title)}</h4>

        <div class="exam-meta">
          <span>
            ${U.icon("calendar")}
            ${U.fmtDate(e.exam_date, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>

          ${e.exam_time
            ? `<span>${U.icon("clock")} ${fmtTime(e.exam_time)}</span>`
            : ""}

          ${e.venue
            ? `<span>${U.icon("flag")} ${U.esc(e.venue)}</span>`
            : ""}
        </div>

        ${e.syllabus
          ? `<p class="exam-syl">${U.esc(e.syllabus)}</p>`
          : ""}

        <div class="exam-tip">${tip(d)}</div>
      </div>

      <div class="exam-actions">
        <button class="btn btn-ghost btn-icon btn-sm"
          data-act="edit" title="Edit">
          ${U.icon("edit", 15)}
        </button>

        <button class="btn btn-ghost btn-icon btn-sm"
          data-act="delete" title="Delete">
          ${U.icon("trash", 15)}
        </button>
      </div>
    </div>`;
  }


  function mini(data, n = 3) {
    const up = data.exams
      .filter((e) => Priority.daysLeft(e.exam_date) >= 0)
      .sort(
        (a, b) =>
          Priority.parseDate(a.exam_date) -
          Priority.parseDate(b.exam_date)
      )
      .slice(0, n);

    if (!up.length) {
      return `
      <div class="empty">
        ${U.icon("book")}
        <p>No upcoming exams.</p>
      </div>`;
    }

    return up.map((e) => {
      const d = Priority.daysLeft(e.exam_date);

      return `
      <div class="mini-exam">
        <div class="exam-count ${d <= 3 ? "soon" : ""}">
          <span class="num">${d}</span>
          <span>${d === 1 ? "day" : "days"}</span>
        </div>

        <div>
          <strong>${U.esc(e.subject)}</strong>
          <div class="muted" style="font-size:13px">
            ${U.esc(e.title)} ·
            ${U.fmtDate(e.exam_date, {
              day: "numeric",
              month: "short"
            })}
          </div>
        </div>
      </div>`;
    }).join("");
  }


  let bound = false;

  function page(data) {
    if (!bound) {
      bound = true;
      document.getElementById("eAdd").onclick =
        () => openForm();
    }

    const sorted = [...data.exams].sort(
      (a, b) =>
        Priority.parseDate(a.exam_date) -
        Priority.parseDate(b.exam_date)
    );

    const up = sorted.filter(
      (e) => Priority.daysLeft(e.exam_date) >= 0
    );

    const past = sorted.filter(
      (e) => Priority.daysLeft(e.exam_date) < 0
    ).reverse();

    const next = up[0];

    document.getElementById("eSummary").textContent = next
      ? `Next exam: ${next.subject} in ${
          Priority.daysLeft(next.exam_date)
        } day${
          Priority.daysLeft(next.exam_date) === 1 ? "" : "s"
        } · ${up.length} upcoming in total`
      : "No upcoming exams scheduled.";

    document.getElementById("examUpcoming").innerHTML = up.length
      ? up.map(card).join("")
      : `
      <div class="empty card" style="grid-column:1/-1">
        ${U.icon("book")}
        <h4>No upcoming exams</h4>
        <p>
          Add your exam timetable so Deadlinely can factor
          it into your priorities.
        </p>
      </div>`;

    document.getElementById("examPastWrap").hidden =
      !past.length;

    document.getElementById("examPast").innerHTML =
      past.map(card).join("");
  }


  return {
    openForm,
    remove,
    card,
    mini,
    page
  };

})();
