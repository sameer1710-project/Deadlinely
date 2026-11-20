
/* Deadlinely – deadline reminders
   In-app bell + browser notifications + Supabase storage
*/

const Notifications = (() => {
  let current = [];
  let syncing = false;

  /* ---------- Create reminders ---------- */

  function alerts(data) {
    const out = [];

    data.assignments
      .filter((a) => a.status !== "done")
      .forEach((a) => {
        const d = Priority.daysLeft(a.due_date);

        if (d > 2) return;

        out.push({
          id: `a-${a.id}`,
          d,

          tone:
            d <= 0
              ? "critical"
              : d === 1
              ? "high"
              : "medium",

          title:
            d < 0
              ? `Overdue: ${a.title}`
              : d === 0
              ? `Due today: ${a.title}`
              : d === 1
              ? `Due tomorrow: ${a.title}`
              : `Due in 2 days: ${a.title}`,

          text: `${a.subject} · ${U.fmtDate(
            a.due_date,
            { day: "numeric", month: "short" }
          )}`,

          source_type: "assignment",
          source_id: a.id,
        });
      });

    data.exams.forEach((e) => {
      const d = Priority.daysLeft(e.exam_date);

      if (d < 0 || d > 3) return;

      out.push({
        id: `e-${e.id}`,
        d,

        tone: d <= 1 ? "critical" : "high",

        title:
          d === 0
            ? `Exam today: ${e.subject}`
            : `Exam in ${d} day${d > 1 ? "s" : ""}: ${e.subject}`,

        text: `${e.title}${e.venue ? " · " + e.venue : ""}`,

        source_type: "exam",
        source_id: e.id,
      });
    });

    return out.sort((a, b) => a.d - b.d);
  }

  /* ---------- Save reminders in Supabase ---------- */

  async function syncToSupabase() {
    if (syncing) return;

    if (
      !window.DB ||
      !DB.notifications ||
      typeof DB.notifications.sync !== "function"
    ) {
      console.warn(
        "Deadlinely: Supabase notifications API is unavailable."
      );
      return;
    }

    if (DB.mode !== "supabase") {
      console.log(
        "Deadlinely: Notification sync skipped in demo mode."
      );
      return;
    }

    syncing = true;

    try {
      await DB.notifications.sync(current);

      console.log(
        "Deadlinely: Notifications synchronized with Supabase."
      );

    } catch (err) {
      console.error(
        "Deadlinely: Notification sync failed:",
        err
      );
    } finally {
      syncing = false;
    }
  }

  /* ---------- Render notification panel ---------- */

  function render() {
    const dot = document.getElementById("bellDot");
    const panel = document.getElementById("notifPanel");

    if (!dot || !panel) return;

    dot.hidden = !current.length;

    dot.textContent =
      current.length > 9 ? "9+" : current.length;

    const canAsk =
      "Notification" in window &&
      Notification.permission === "default";

    panel.innerHTML = `
      <div class="notif-head">
        <span>Reminders</span>
        <span class="muted">${current.length}</span>
      </div>

      ${
        current.length
          ? current
              .map(
                (n) => `
                  <div class="notif-item ${n.tone}">
                    <div class="n-ic">
                      ${U.icon("alert", 15)}
                    </div>

                    <div>
                      <strong>${U.esc(n.title)}</strong>
                      <span>${U.esc(n.text)}</span>
                    </div>
                  </div>
                `
              )
              .join("")
          : `
              <div class="empty">
                ${U.icon("bell")}
                <p>No urgent deadlines. You're on track!</p>
              </div>
            `
      }

      ${
        canAsk
          ? `
              <div class="notif-foot">
                <button
                  class="btn btn-sm btn-primary"
                  id="enableNotif"
                >
                  Enable browser alerts
                </button>
              </div>
            `
          : ""
      }
    `;

    const btn = document.getElementById("enableNotif");

    if (btn) {
      btn.onclick = async () => {
        await enable();
        render();
      };
    }
  }

  /* ---------- Browser notifications ---------- */

  function pushBrowser() {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const key =
      "dl_notified_" + Priority.toISO(new Date());

    const seen = LS.get(key, []);

    current
      .filter((n) => n.d <= 1 && !seen.includes(n.id))
      .forEach((n) => {
        try {
          new Notification(
            "Deadlinely – " + n.title,
            {
              body: n.text,
              icon:
                (document.body.dataset.base || "") +
                "assets/icons/icon.svg",
            }
          );

          seen.push(n.id);

        } catch (err) {
          console.error(
            "Deadlinely notification error:",
            err
          );
        }
      });

    LS.set(key, seen);
  }

  /* ---------- Update reminders ---------- */

  function update(data) {
    data = data || {};

    data.assignments = Array.isArray(data.assignments)
      ? data.assignments
      : [];

    data.exams = Array.isArray(data.exams)
      ? data.exams
      : [];

    current = alerts(data);

    render();

    // Save generated reminders to Supabase.
    syncToSupabase();

    // Show optional browser notifications.
    pushBrowser();
  }

  /* ---------- Notification bell ---------- */

  function init() {
    const bell = document.getElementById("bellBtn");
    const panel = document.getElementById("notifPanel");

    if (!bell || !panel) return;

    bell.onclick = (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
    };

    document.addEventListener("click", (e) => {
      if (
        !panel.hidden &&
        !panel.contains(e.target) &&
        !bell.contains(e.target)
      ) {
        panel.hidden = true;
      }
    });
  }

  /* ---------- Enable browser alerts ---------- */

  async function enable() {
    if (!("Notification" in window)) {
      U.toast(
        "This browser does not support notifications",
        "error"
      );
      return;
    }

    try {
      const res = await Notification.requestPermission();

      if (res === "granted") {
        U.toast("Browser alerts enabled", "ok");
        pushBrowser();
      } else {
        U.toast(
          "Browser alerts not allowed",
          "error"
        );
      }

    } catch (err) {
      console.error(err);

      U.toast(
        "Could not enable browser notifications",
        "error"
      );
    }
  }

  /* ---------- Public methods ---------- */

  return {
    alerts,
    update,
    init,
    enable,

    get count() {
      return current.length;
    },
  };
})();
