-- Deadlinely – Supabase schema
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query -> Run

create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  subject      text not null,
  description  text,
  due_date     date not null,
  importance   text not null default 'medium' check (importance in ('low','medium','high')),
  hours        numeric not null default 2,
  status       text not null default 'pending' check (status in ('pending','in-progress','done')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.exams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject     text not null,
  title       text not null,
  exam_date   date not null,
  exam_time   text,
  venue       text,
  syllabus    text,
  created_at  timestamptz not null default now()
);

create index if not exists assignments_user_due_idx on public.assignments (user_id, due_date);
create index if not exists exams_user_date_idx on public.exams (user_id, exam_date);

-- Row Level Security: every student only sees their own rows
alter table public.assignments enable row level security;
alter table public.exams enable row level security;

create policy "own assignments select" on public.assignments for select using (auth.uid() = user_id);
create policy "own assignments insert" on public.assignments for insert with check (auth.uid() = user_id);
create policy "own assignments update" on public.assignments for update using (auth.uid() = user_id);
create policy "own assignments delete" on public.assignments for delete using (auth.uid() = user_id);

create policy "own exams select" on public.exams for select using (auth.uid() = user_id);
create policy "own exams insert" on public.exams for insert with check (auth.uid() = user_id);
create policy "own exams update" on public.exams for update using (auth.uid() = user_id);
create policy "own exams delete" on public.exams for delete using (auth.uid() = user_id);
