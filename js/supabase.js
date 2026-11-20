
/* ============================================================
   DEADLINELY - SUPABASE DATABASE CONNECTION
   Backend: Supabase
   Authentication: Supabase Auth
   Database: PostgreSQL
   ============================================================ */

// 1. SUPABASE CONFIGURATION

const SUPABASE_URL =
    "https://dtjitcycurrtzgtynpdm.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_2monyIBz3g93huE3vDi-VQ_3O2Q_oIW";


// 2. INITIALIZE SUPABASE

const cloudReady =
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.startsWith("sb_publishable_") &&
    !!window.supabase;

const sb = cloudReady
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;

console.log(
    "Deadlinely mode:",
    cloudReady ? "SUPABASE CLOUD" : "DEMO LOCAL"
);


// 3. LOCAL STORAGE SUPPORT

const LS = {
    get(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Storage error:", error);
        }
    },

    del(key) {
        localStorage.removeItem(key);
    }
};


// 4. UNIQUE ID GENERATOR

const uid = () => {
    return window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : "id-" + Date.now() +
          Math.random().toString(16).slice(2);
};


// 5. DEMO PASSWORD HASHING

async function hashPassword(password) {
    if (window.crypto?.subtle) {
        const buffer = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );

        return Array.from(new Uint8Array(buffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    throw new Error(
        "Secure browser context required for demo login."
    );
}


// 6. GET CURRENT LOGGED-IN USER

async function getCurrentUserId() {
    if (!cloudReady) {
        return LS.get("dl_session", "guest");
    }

    const { data, error } = await sb.auth.getUser();

    if (error) throw error;

    if (!data.user) {
        throw new Error("Please log in first.");
    }

    return data.user.id;
}


// 7. MAP SUPABASE USER

function mapSbUser(user) {
    const metadata = user.user_metadata || {};

    return {
        id: user.id,
        email: user.email,
        name: metadata.name ||
            user.email?.split("@")[0] ||
            "Student",
        prn: metadata.prn || "",
        institution: metadata.institution || "",
        course: metadata.course || ""
    };
}


// 8. GENERAL DATABASE TABLE API

function tableApi(table, orderBy) {

    // SUPABASE CLOUD MODE

    if (cloudReady) {
        return {

            async list() {
                const userId = await getCurrentUserId();

                const { data, error } = await sb
                    .from(table)
                    .select("*")
                    .eq("user_id", userId)
                    .order(orderBy, { ascending: true });

                if (error) throw error;

                return data || [];
            },

            async create(row) {
                const userId = await getCurrentUserId();

                const { data, error } = await sb
                    .from(table)
                    .insert({
                        ...row,
                        user_id: userId
                    })
                    .select()
                    .single();

                if (error) throw error;

                return data;
            },

            async update(id, patch) {
                const userId = await getCurrentUserId();

                const safePatch = { ...patch };

                delete safePatch.id;
                delete safePatch.user_id;
                delete safePatch.created_at;

                const { data, error } = await sb
                    .from(table)
                    .update(safePatch)
                    .eq("id", id)
                    .eq("user_id", userId)
                    .select()
                    .single();

                if (error) throw error;

                return data;
            },

            async remove(id) {
                const userId = await getCurrentUserId();

                const { error } = await sb
                    .from(table)
                    .delete()
                    .eq("id", id)
                    .eq("user_id", userId);

                if (error) throw error;
            }
        };
    }


    // LOCAL DEMO MODE

    const storageKey = () => `dl_${table}`;

    return {

        async list() {
            const userId = await getCurrentUserId();

            return LS.get(storageKey(), [])
                .filter(item => item.user_id === userId)
                .sort((a, b) => {
                    return String(a[orderBy] || "")
                        .localeCompare(String(b[orderBy] || ""));
                });
        },

        async create(row) {
            const userId = await getCurrentUserId();
            const records = LS.get(storageKey(), []);

            const record = {
                ...row,
                id: row.id || uid(),
                user_id: userId,
                created_at: row.created_at || new Date().toISOString()
            };

            records.push(record);
            LS.set(storageKey(), records);

            return record;
        },

        async update(id, patch) {
            const userId = await getCurrentUserId();
            const records = LS.get(storageKey(), []);

            const index = records.findIndex(
                item => item.id === id &&
                        item.user_id === userId
            );

            if (index === -1) {
                throw new Error("Record not found.");
            }

            const safePatch = { ...patch };

            delete safePatch.id;
            delete safePatch.user_id;
            delete safePatch.created_at;

            records[index] = {
                ...records[index],
                ...safePatch
            };

            LS.set(storageKey(), records);

            return records[index];
        },

        async remove(id) {
            const userId = await getCurrentUserId();
            const records = LS.get(storageKey(), []);

            LS.set(
                storageKey(),
                records.filter(
                    item => !(item.id === id &&
                              item.user_id === userId)
                )
            );
        }
    };
}


// 9. PROFILE DATABASE API

const profilesApi = {

    async get() {
        const userId = await getCurrentUserId();

        if (!cloudReady) {
            return LS.get("dl_profiles", [])
                .find(item => item.id === userId) || null;
        }

        const { data, error } = await sb
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) throw error;

        return data;
    },


    async save(profile) {
        const userId = await getCurrentUserId();

        const row = {
            id: userId,
            full_name: profile.name || profile.full_name || "",
            email: profile.email || "",
            prn: profile.prn || "",
            institution: profile.institution || "",
            course: profile.course || "",
            updated_at: new Date().toISOString()
        };

        if (!cloudReady) {
            const records = LS.get("dl_profiles", []);
            const index = records.findIndex(
                item => item.id === userId
            );

            if (index >= 0) {
                records[index] = {
                    ...records[index],
                    ...row
                };
            } else {
                records.push({
                    ...row,
                    created_at: new Date().toISOString()
                });
            }

            LS.set("dl_profiles", records);

            return row;
        }

        const { data, error } = await sb
            .from("profiles")
            .upsert(row, { onConflict: "id" })
            .select()
            .single();

        if (error) throw error;

        return data;
    }
};


// 10. NOTIFICATIONS DATABASE API

const notificationsApi = {

    async list() {
        const userId = await getCurrentUserId();

        if (!cloudReady) {
            return LS.get("dl_notifications", [])
                .filter(item => item.user_id === userId)
                .sort((a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );
        }

        const { data, error } = await sb
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data || [];
    },


    // SAVE OR UPDATE REMINDERS WITHOUT DUPLICATING THEM

    async sync(reminders) {
        const userId = await getCurrentUserId();

        const existing = await this.list();

        const previous = new Map(
            existing
                .filter(item => item.reminder_key)
                .map(item => [item.reminder_key, item])
        );

        const saved = [];

        for (const n of reminders) {
            const key = String(n.id);

            const old = previous.get(key);

            const sourceType = key.startsWith("a-")
                ? "assignment"
                : "exam";

            const row = {
                user_id: userId,
                reminder_key: key,
                source_type: sourceType,
                source_id: key.substring(2),
                title: n.title || "Reminder",
                message: n.text || "",
                body: n.text || "",
                severity: n.tone || "medium",
                days_left: Number.isFinite(n.d) ? n.d : null,
                updated_at: new Date().toISOString()
            };

            if (old) {
                // Preserve the existing read status.

                row.is_read = old.is_read;
                row.read_at = old.read_at || null;

                if (!cloudReady) {
                    const records = LS.get("dl_notifications", []);
                    const index = records.findIndex(
                        item => item.id === old.id
                    );

                    if (index >= 0) {
                        records[index] = {
                            ...records[index],
                            ...row
                        };

                        LS.set("dl_notifications", records);
                        saved.push(records[index]);
                    }
                } else {
                    const { data, error } = await sb
                        .from("notifications")
                        .update(row)
                        .eq("id", old.id)
                        .eq("user_id", userId)
                        .select()
                        .single();

                    if (error) throw error;

                    saved.push(data);
                }

            } else {
                row.is_read = false;
                row.read_at = null;

                if (!cloudReady) {
                    const record = {
                        ...row,
                        id: uid(),
                        created_at: new Date().toISOString()
                    };

                    const records = LS.get("dl_notifications", []);
                    records.push(record);
                    LS.set("dl_notifications", records);

                    saved.push(record);
                } else {
                    const { data, error } = await sb
                        .from("notifications")
                        .insert(row)
                        .select()
                        .single();

                    if (error) throw error;

                    saved.push(data);
                }
            }
        }

        return saved;
    },


    // MARK ONE NOTIFICATION AS READ

    async markRead(id) {
        const userId = await getCurrentUserId();

        const patch = {
            is_read: true,
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (!cloudReady) {
            const records = LS.get("dl_notifications", []);
            const index = records.findIndex(
                item => item.id === id &&
                        item.user_id === userId
            );

            if (index === -1) {
                throw new Error("Notification not found.");
            }

            records[index] = {
                ...records[index],
                ...patch
            };

            LS.set("dl_notifications", records);

            return records[index];
        }

        const { data, error } = await sb
            .from("notifications")
            .update(patch)
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    },


    // MARK ALL NOTIFICATIONS AS READ

    async markAllRead() {
        const userId = await getCurrentUserId();

        const patch = {
            is_read: true,
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (!cloudReady) {
            const records = LS.get("dl_notifications", []).map(item => {
                if (item.user_id === userId && !item.is_read) {
                    return { ...item, ...patch };
                }

                return item;
            });

            LS.set("dl_notifications", records);
            return;
        }

        const { error } = await sb
            .from("notifications")
            .update(patch)
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;
    }
};


// 11. AUTHENTICATION API

const authApi = cloudReady

    ? {

        async signUp({
            email,
            password,
            name,
            prn,
            institution,
            course
        }) {
            const { data, error } = await sb.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        prn,
                        institution,
                        course
                    }
                }
            });

            if (error) throw error;

            const user = data.user
                ? mapSbUser(data.user)
                : null;

            // Create the profile row when signup gives an active session.

            if (user && data.session) {
                await profilesApi.save(user);
            }

            return {
                user,
                needsConfirm: !data.session
            };
        },


        async signIn({ email, password }) {
            const { data, error } =
                await sb.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            const user = mapSbUser(data.user);

            await profilesApi.save(user);

            return user;
        },


        async signOut() {
            const { error } = await sb.auth.signOut();

            if (error) throw error;
        },


        async user() {
            const { data, error } = await sb.auth.getUser();

            if (error) {
                if (error.name === "AuthSessionMissingError") {
                    return null;
                }

                throw error;
            }

            return data.user
                ? mapSbUser(data.user)
                : null;
        },


        async updateProfile(patch) {
            const allowed = {};

            ["name", "prn", "institution", "course"]
                .forEach(key => {
                    if (patch[key] !== undefined) {
                        allowed[key] = patch[key];
                    }
                });

            const { data, error } = await sb.auth.updateUser({
                data: allowed
            });

            if (error) throw error;

            const user = mapSbUser(data.user);

            // Save the updated profile in the profiles table too.

            await profilesApi.save(user);

            return user;
        }
    }


    // LOCAL DEMO AUTHENTICATION

    : {

        async signUp({
            email,
            password,
            name,
            prn,
            institution,
            course
        }) {
            const users = LS.get("dl_users", []);

            if (users.some(
                user => user.email.toLowerCase() ===
                        email.toLowerCase()
            )) {
                throw new Error(
                    "An account with this email already exists."
                );
            }

            const user = {
                id: uid(),
                email,
                name,
                prn: prn || "",
                institution: institution || "",
                course: course || "",
                pass: await hashPassword(password)
            };

            users.push(user);

            LS.set("dl_users", users);
            LS.set("dl_session", user.id);

            await profilesApi.save(user);

            return {
                user: { ...user, pass: undefined },
                needsConfirm: false
            };
        },


        async signIn({ email, password }) {
            const users = LS.get("dl_users", []);

            const user = users.find(
                item => item.email.toLowerCase() ===
                        email.toLowerCase()
            );

            if (
                !user ||
                user.pass !== await hashPassword(password)
            ) {
                throw new Error("Invalid email or password.");
            }

            LS.set("dl_session", user.id);

            await profilesApi.save(user);

            return { ...user, pass: undefined };
        },


        async signOut() {
            LS.del("dl_session");
        },


        async user() {
            const id = LS.get("dl_session", null);

            const user = LS.get("dl_users", []).find(
                item => item.id === id
            );

            return user
                ? { ...user, pass: undefined }
                : null;
        },


        async updateProfile(patch) {
            const users = LS.get("dl_users", []);

            const index = users.findIndex(
                item => item.id === LS.get("dl_session", null)
            );

            if (index === -1) {
                throw new Error("Not logged in.");
            }

            users[index] = {
                ...users[index],
                ...patch
            };

            LS.set("dl_users", users);

            const safeUser = {
                ...users[index],
                pass: undefined
            };

            await profilesApi.save(safeUser);

            return safeUser;
        }
    };


// 12. MAIN DATABASE API

const DB = {

    mode: cloudReady ? "supabase" : "demo",

    auth: authApi,

    assignments: tableApi("assignments", "due_date"),

    exams: tableApi("exams", "exam_date"),

    profile: profilesApi,

    profiles: profilesApi,

    notifications: notificationsApi,


    // DELETE ALL CURRENT STUDENT ASSIGNMENTS AND EXAMS

    async clearAll() {
        const assignments = await this.assignments.list();

        for (const assignment of assignments) {
            await this.assignments.remove(assignment.id);
        }

        const exams = await this.exams.list();

        for (const exam of exams) {
            await this.exams.remove(exam.id);
        }
    },


    // INSERT SAMPLE ASSIGNMENTS AND EXAMS

    async seedSample() {
        const existingAssignments =
            await this.assignments.list();

        const existingExams =
            await this.exams.list();

        if (
            existingAssignments.length > 0 ||
            existingExams.length > 0
        ) {
            throw new Error(
                "Sample data already exists. No duplicate data inserted."
            );
        }

        const iso = (offset) => {
            const date = new Date();

            date.setHours(12, 0, 0, 0);
            date.setDate(date.getDate() + offset);

            const p = n => String(n).padStart(2, "0");

            return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
        };

        const ts = (offset) => {
            const date = new Date();

            date.setDate(date.getDate() + offset);
            date.setHours(18, 30, 0, 0);

            return date.toISOString();
        };

        const A = (
            title,
            subject,
            due,
            importance,
            hours,
            status,
            extra = {}
        ) => ({
            title,
            subject,
            due_date: iso(due),
            importance,
            hours,
            status,
            description: "",
            completed_at: null,
            ...extra
        });

        const assignments = [
            A("DBMS Assignment 3 - ER diagram",
                "DBMS", 1, "high", 4, "pending"),

            A("Graph algorithms worksheet",
                "Data Structures", -1, "medium", 2, "pending"),

            A("Operating Systems lab record",
                "Operating Systems", 3, "medium", 3, "pending"),

            A("Web Technologies mini-project report",
                "Web Technologies", 6, "high", 8, "in-progress"),

            A("Probability problem set",
                "Mathematics", 9, "low", 2, "pending"),

            A("Technical seminar abstract",
                "Seminar", 12, "medium", 3, "pending"),

            A("Python lab program 7",
                "Programming", -2, "medium", 2, "done",
                { completed_at: ts(-3) }),

            A("English communication essay",
                "English", -5, "low", 2, "done",
                { completed_at: ts(-6) })
        ];

        const E = (
            subject,
            title,
            offset,
            time,
            venue,
            syllabus
        ) => ({
            subject,
            title,
            exam_date: iso(offset),
            exam_time: time,
            venue,
            syllabus
        });

        const exams = [
            E(
                "DBMS",
                "Mid-semester exam",
                8,
                "10:00",
                "Hall A-101",
                "ER model, SQL, normalisation"
            ),

            E(
                "Operating Systems",
                "Unit test 2",
                14,
                "14:00",
                "Room 204",
                "Scheduling, deadlocks, memory management"
            ),

            E(
                "Data Structures",
                "Practical exam",
                21,
                "09:30",
                "Computer Lab 3",
                "Trees, graphs, hashing"
            )
        ];

        for (const assignment of assignments) {
            await this.assignments.create(assignment);
        }

        for (const exam of exams) {
            await this.exams.create(exam);
        }

        return {
            assignments: assignments.length,
            exams: exams.length
        };
    }
};


// 13. EXPOSE DATABASE API

window.DB = DB;
window.supabaseClient = sb;

console.log("Deadlinely data layer loaded.");
console.log("Database mode:", DB.mode);
