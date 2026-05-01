-- ============================================================
-- Bloomix — initial schema
-- Apply via: Supabase dashboard > SQL editor > run this file
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users)
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  display_name    text not null,
  season          text not null default 'spring'
                    check (season in ('spring', 'summer', 'autumn', 'winter')),
  tone            text not null default 'soft'
                    check (tone in ('soft', 'whimsy', 'matter')),
  categories      text[] not null default '{routines,selfcare}',
  timezone        text not null default 'UTC',
  show_categories boolean not null default true,
  show_weather    boolean not null default true,
  onboarded_at    timestamptz,
  created_at      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- daily_tasks  (the tree loop — reset 4 AM per user timezone)
-- ────────────────────────────────────────────────────────────
create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  text          text not null,
  category      text not null,
  completed_at  date,        -- local calendar date it was checked off; null = open
  position      integer not null default 0,
  created_at    timestamptz default now()
);

create index if not exists daily_tasks_user_date
  on public.daily_tasks (user_id, completed_at);

alter table public.daily_tasks enable row level security;

create policy "users can read own daily tasks"
  on public.daily_tasks for select
  using (auth.uid() = user_id);

create policy "users can insert own daily tasks"
  on public.daily_tasks for insert
  with check (auth.uid() = user_id);

create policy "users can update own daily tasks"
  on public.daily_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own daily tasks"
  on public.daily_tasks for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- scheduled_tasks  (deadlines, events, birthdays, reminders)
-- ────────────────────────────────────────────────────────────
create table if not exists public.scheduled_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  title         text not null,
  notes         text,
  due_at        timestamptz not null,
  all_day       boolean not null default false,
  reminder_at   timestamptz,
  category      text not null,
  completed_at  timestamptz,
  recurrence    text not null default 'none'
                  check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  created_at    timestamptz default now()
);

create index if not exists scheduled_tasks_user_due
  on public.scheduled_tasks (user_id, due_at);

alter table public.scheduled_tasks enable row level security;

create policy "users can read own scheduled tasks"
  on public.scheduled_tasks for select
  using (auth.uid() = user_id);

create policy "users can insert own scheduled tasks"
  on public.scheduled_tasks for insert
  with check (auth.uid() = user_id);

create policy "users can update own scheduled tasks"
  on public.scheduled_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own scheduled tasks"
  on public.scheduled_tasks for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Realtime
-- ────────────────────────────────────────────────────────────
alter publication supabase_realtime
  add table public.daily_tasks, public.scheduled_tasks;
