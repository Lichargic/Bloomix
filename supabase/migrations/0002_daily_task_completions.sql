-- ============================================================
-- Bloomix - durable daily habit completion history
-- ============================================================

create table if not exists public.daily_task_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  daily_task_id uuid not null references public.daily_tasks(id) on delete cascade,
  completed_on  date not null,
  created_at    timestamptz not null default now(),

  constraint daily_task_completions_one_per_task_day
    unique (daily_task_id, completed_on)
);

create index if not exists daily_task_completions_user_day
  on public.daily_task_completions (user_id, completed_on);

create index if not exists daily_task_completions_task_day
  on public.daily_task_completions (daily_task_id, completed_on);

alter table public.daily_task_completions enable row level security;

create policy "users can read own daily completions"
  on public.daily_task_completions for select
  using (auth.uid() = user_id);

insert into public.daily_task_completions (user_id, daily_task_id, completed_on)
select user_id, id, completed_at
from public.daily_tasks
where completed_at is not null
on conflict (daily_task_id, completed_on) do nothing;

create or replace function public.get_current_daily_day()
returns date
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_timezone text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(
    (
      select name
      from pg_timezone_names
      where name = profiles.timezone
      limit 1
    ),
    'UTC'
  )
  into profile_timezone
  from public.profiles
  where id = current_user_id;

  if profile_timezone is null then
    profile_timezone := 'UTC';
  end if;

  return ((now() at time zone profile_timezone) - interval '4 hours')::date;
end;
$$;

create or replace function public.complete_daily_task(p_task_id uuid)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  task_owner uuid;
  active_day date;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select user_id
  into task_owner
  from public.daily_tasks
  where id = p_task_id;

  if task_owner is null or task_owner <> current_user_id then
    raise exception 'Daily task not found';
  end if;

  active_day := public.get_current_daily_day();

  insert into public.daily_task_completions (user_id, daily_task_id, completed_on)
  values (current_user_id, p_task_id, active_day)
  on conflict (daily_task_id, completed_on) do nothing;

  -- Keep the legacy column in sync for old clients during migration.
  update public.daily_tasks
  set completed_at = active_day
  where id = p_task_id
    and user_id = current_user_id;

  return active_day;
end;
$$;

create or replace function public.uncomplete_daily_task(p_task_id uuid)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  task_owner uuid;
  active_day date;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select user_id
  into task_owner
  from public.daily_tasks
  where id = p_task_id;

  if task_owner is null or task_owner <> current_user_id then
    raise exception 'Daily task not found';
  end if;

  active_day := public.get_current_daily_day();

  delete from public.daily_task_completions
  where daily_task_id = p_task_id
    and user_id = current_user_id
    and completed_on = active_day;

  update public.daily_tasks
  set completed_at = null
  where id = p_task_id
    and user_id = current_user_id
    and completed_at = active_day;

  return active_day;
end;
$$;

grant execute on function public.get_current_daily_day() to authenticated;
grant execute on function public.complete_daily_task(uuid) to authenticated;
grant execute on function public.uncomplete_daily_task(uuid) to authenticated;

create policy "users can insert own current-day completions"
  on public.daily_task_completions for insert
  with check (
    auth.uid() = user_id
    and completed_on = public.get_current_daily_day()
    and exists (
      select 1
      from public.daily_tasks
      where daily_tasks.id = daily_task_completions.daily_task_id
        and daily_tasks.user_id = auth.uid()
    )
  );

create policy "users can delete own current-day completions"
  on public.daily_task_completions for delete
  using (
    auth.uid() = user_id
    and completed_on = public.get_current_daily_day()
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'daily_task_completions'
  ) then
    alter publication supabase_realtime add table public.daily_task_completions;
  end if;
end;
$$;
