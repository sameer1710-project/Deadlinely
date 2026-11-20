# Deadlinely – Assignment Tracking SaaS

**Name:** SD. Sameer Ahamed  
**PRN:** 250200175  
**Category:** Open Innovation → B. SaaS for students and educational institutions → 6. Deadlinely

Students manage assignments, deadlines and examination schedules.  
**Unique feature:** automatically organises upcoming deadlines into a priority list.

## Project idea submission (deadline: 20 November 2026)
**Title:** Deadlinely – Assignment Tracking SaaS  
**Description:** A web-based SaaS where students add assignments, deadlines and exams, and an automatic priority engine scores every item by urgency, importance and effort to produce a ranked, colour-coded to-do list. Includes calendar, exam countdowns, progress analytics and deadline reminders. Built with HTML, CSS, JavaScript and Supabase.

## Run it
1. Open the folder in VS Code and start **Live Server** on `index.html` (or run `python -m http.server` and open http://localhost:8000).
2. Click **Try the live demo** – sample data for SD. Sameer Ahamed is loaded automatically.

By default the app runs in **demo mode** (data in browser localStorage). 

## Connect Supabase (cloud mode)
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Project Settings → API → copy the URL and anon key into the top of `js/supabase.js`.
4. (Optional) Authentication → Providers → Email: turn off "Confirm email" for instant sign-up.

## Features
- Register / login (Supabase Auth or demo mode)
- Assignments CRUD with search, filters and sorting
- **Priority engine** (`js/priority.js`): `score = urgency + importance + effort` → Critical / High / Medium / Low
- Month calendar of deadlines and exams
- Exam schedule with countdowns and revision tips
- Progress: completion %, on-time rate, streak, weekly chart, per-subject bars
- Reminders: in-app bell + optional browser notifications
- Dark mode, responsive layout, installable PWA (manifest + service worker)

## Structure
```
Deadlinely/
├── index.html  manifest.json  service-worker.js  README.md  .gitignore
├── assets/ (images, icons, fonts)
├── css/ style, dashboard, auth, responsive
├── js/ app, supabase, auth, assignments, priority, calendar, exams, progress, notifications
├── pages/ login, register, dashboard, assignments, priority, calendar, exams, progress, profile
└── supabase/schema.sql
```
