
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
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aml0Y3ljdXJydHpndHlucGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4OTQ4NzgsImV4cCI6MjExMDQ3MDg3OH0.702sHpk6k42dKV61UqNy6T8cpFpVKt7ANFpJ8iwol7Y";


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


// 3. LOCAL STORAGE SUPPORT (DEMO MODE)

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
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
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
// This is only for local demonstration.
// Production authentication uses Supabase Auth.

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


// 8. DATABASE TABLE API

function tableApi(table, orderBy) {

    if (cloudReady) {

        return {

            // GET RECORDS
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


            // CREATE RECORD
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


            // UPDATE RECORD
            async update(id, patch) {

                const userId = await getCurrentUserId();

                const safePatch = { ...patch };

                // Do not allow changing record ownership.
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


            // DELETE RECORD
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


    // LOCAL DEMO DATABASE

    const storageKey = () => {
        return `dl_${table}_${LS.get("dl_session", "guest")}`;
    };

    return {

        async list() {
            return LS.get(storageKey(), []);
        },

        async create(row) {

            const records = LS.get(storageKey(), []);

            const item = {
                ...row,
                id: uid(),
                created_at: new Date().toISOString()
            };

            records.push(item);

            LS.set(storageKey(), records);

            return item;
        },

        async update(id, patch) {

            const records = LS.get(storageKey(), []);

            const index = records.findIndex(
                item => item.id === id
            );

            if (index === -1) {
                throw new Error("Record not found.");
            }

            records[index] = {
                ...records[index],
                ...patch
            };

            LS.set(storageKey(), records);

            return records[index];
        },

        async remove(id) {

            const records = LS.get(storageKey(), []);

            LS.set(
                storageKey(),
                records.filter(item => item.id !== id)
            );
        }
    };
}


// 9. AUTHENTICATION API

const authApi = cloudReady

    ? {

        // REGISTER STUDENT
        async signUp({
            email,
            password,
            name,
            prn,
            institution,
            course
        }) {

            const { data, error } =
                await sb.auth.signUp({

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

            return {
                user: data.user
                    ? mapSbUser(data.user)
                    : null,

                needsConfirm: !data.session
            };
        },


        // LOGIN STUDENT
        async signIn({ email, password }) {

            const { data, error } =
                await sb.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            return mapSbUser(data.user);
        },


        // LOGOUT
        async signOut() {

            const { error } = await sb.auth.signOut();

            if (error) throw error;
        },


        // GET CURRENT USER
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


        // UPDATE PROFILE
        async updateProfile(patch) {

            const allowed = {
                name: patch.name,
                prn: patch.prn,
                institution: patch.institution,
                course: patch.course
            };

            Object.keys(allowed).forEach(key => {
                if (allowed[key] === undefined) {
                    delete allowed[key];
                }
            });

            const { data, error } =
                await sb.auth.updateUser({
                    data: allowed
                });

            if (error) throw error;

            return mapSbUser(data.user);
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

            if (
                users.some(
                    user => user.email.toLowerCase() ===
                            email.toLowerCase()
                )
            ) {
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
                item => item.id ===
                        LS.get("dl_session", null)
            );

            if (index === -1) {
                throw new Error("Not logged in.");
            }

            users[index] = {
                ...users[index],
                ...patch
            };

            LS.set("dl_users", users);

            return {
                ...users[index],
                pass: undefined
            };
        }
    };


// 10. MAIN DATABASE API

const DB = {

    mode: cloudReady ? "supabase" : "demo",

    auth: authApi,

    assignments: tableApi("assignments", "due_date"),

    exams: tableApi("exams", "exam_date"),


    // DELETE ALL CURRENT STUDENT RECORDS
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

            A(
                "DBMS Assignment 3 - ER diagram",
                "DBMS", 1, "high", 4, "pending"
            ),

            A(
                "Graph algorithms worksheet",
                "Data Structures", -1, "medium", 2, "pending"
            ),

            A(
                "Operating Systems lab record",
                "Operating Systems", 3, "medium", 3, "pending"
            ),

            A(
                "Web Technologies mini-project report",
                "Web Technologies", 6, "high", 8, "in-progress"
            ),

            A(
                "Probability problem set",
                "Mathematics", 9, "low", 2, "pending"
            ),

            A(
                "Technical seminar abstract",
                "Seminar", 12, "medium", 3, "pending"
            ),

            A(
                "Python lab program 7",
                "Programming", -2, "medium", 2, "done",
                { completed_at: ts(-3) }
            ),

            A(
                "English communication essay",
                "English", -5, "low", 2, "done",
                { completed_at: ts(-6) }
            )
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


// 11. EXPOSE API FOR OTHER APPLICATION FILES

window.DB = DB;
window.supabaseClient = sb;

console.log("Deadlinely data layer loaded.");
console.log("Database mode:", DB.mode);
