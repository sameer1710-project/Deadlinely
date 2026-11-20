/* Deadlinely – registration, login, demo login and logout */
const Auth = {
  /** One-click demo account (only in demo mode) – pre-filled with the project author's details. */
  async demoLogin() {
    const cred = { email: "sameer@deadlinely.demo", password: "deadlinely-demo" };
    try {
      await DB.auth.signIn(cred);
    } catch {
      await DB.auth.signUp({ ...cred, name: APP.student.name, prn: APP.student.prn, institution: "Open Innovation Project", course: "" });
      await DB.seedSample();
    }
    location.href = (document.body.dataset.base || "") + "pages/dashboard.html";
  },

  async logout() {
    await DB.auth.signOut();
    location.href = (document.body.dataset.base || "") + "pages/login.html";
  },
};

(function authPages() {
  const page = document.body.dataset.page;
  if (page !== "login" && page !== "register") return;

  const $ = (id) => document.getElementById(id);
  const setBusy = (btn, busy, label) => { btn.disabled = busy; btn.textContent = busy ? "Please wait…" : label; };

  DB.auth.user().then((u) => { if (u) location.href = "dashboard.html"; });

  // mode note + demo button
  const note = $("modeNote");
  if (note) {
    note.textContent = DB.mode === "demo"
      ? "Demo mode: your data is stored privately in this browser. Add Supabase keys in js/supabase.js to enable cloud sync."
      : "Connected to Supabase – your data syncs securely to the cloud.";
  }
  const demoBtn = $("demoBtn");
  if (demoBtn) {
    if (DB.mode !== "demo") demoBtn.parentElement.hidden = true;
    else demoBtn.onclick = () => Auth.demoLogin();
  }

  if (page === "login") {
    $("loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = $("loginBtn");
      $("authErr").textContent = "";
      setBusy(btn, true);
      try {
        await DB.auth.signIn({ email: $("email").value.trim(), password: $("password").value });
        location.href = "dashboard.html";
      } catch (err) {
        $("authErr").textContent = err.message || "Login failed.";
        setBusy(btn, false, "Log in");
      }
    };
  }

  if (page === "register") {
    const sampleRow = $("sampleRow");
    if (DB.mode !== "demo" && sampleRow) sampleRow.hidden = true; // sample-data option is for demo mode only

    $("registerForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = $("registerBtn");
      const err = $("authErr");
      err.textContent = "";
      const password = $("password").value;
      if (password.length < 6) { err.textContent = "Password must be at least 6 characters."; return; }
      if (password !== $("confirm").value) { err.textContent = "Passwords do not match."; return; }
      setBusy(btn, true);
      try {
        const res = await DB.auth.signUp({
          name: $("name").value.trim(),
          prn: $("prn").value.trim(),
          institution: $("institution").value.trim(),
          email: $("email").value.trim(),
          password,
        });
        if (res.needsConfirm) {
          err.className = "success";
          err.textContent = "Account created! Check your email to confirm, then log in.";
          setBusy(btn, false, "Create account");
          return;
        }
        if ($("sample") && $("sample").checked) await DB.seedSample();
        location.href = "dashboard.html";
      } catch (ex) {
        err.textContent = ex.message || "Could not create the account.";
        setBusy(btn, false, "Create account");
      }
    };
  }
})();
