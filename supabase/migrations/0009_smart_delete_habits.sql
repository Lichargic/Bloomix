-- ============================================================
-- Bloomix - completion-gated habit deletion
-- Habits with no completions are hard-deleted (nothing happened).
-- Habits with 1+ completions are soft-deleted (preserve history).
-- ============================================================

-- 1. Add soft-delete timestamp column
alter table public.daily_tasks
  add column if not exists deleted_at timestamptz;

-- 2. Remove client-level DELETE policy — raw deletes are now blocked.
--    All deletion must go through delete_daily_task() RPC.
drop policy if exists "users can delete own daily tasks" on public.daily_tasks;

-- 3. Tighten SELECT: hide soft-deleted tasks from the active list
drop policy if exists "users can read own daily tasks" on public.daily_tasks;

create policy "users can read own daily tasks"
  on public.daily_tasks for select
  using (auth.uid() = user_id and deleted_at is null);

-- 4. Tighten UPDATE: prevent editing already-deleted tasks
drop policy if exists "users can update own daily tasks" on public.daily_tasks;

create policy "users can update own daily tasks"
  on public.daily_tasks for update
  using  (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- 5. Completion-gated delete RPC
--    Security definer: bypasses RLS so it can act on rows even after
--    the SELECT policy would hide them (post-soft-delete state).
create or replace function public.delete_daily_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id  uuid := auth.uid();
  completion_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.daily_tasks
    where id = p_task_id and user_id = current_user_id
  ) then
    raise exception 'Daily task not found';
  end if;

  select count(*) into completion_count
  from public.daily_task_completions
  where daily_task_id = p_task_id
    and user_id = current_user_id;

  if completion_count > 0 then
    -- Real history exists: soft delete — completions remain intact
    update public.daily_tasks
    set deleted_at = now()
    where id = p_task_id
      and user_id = current_user_id;
  else
    -- No history: hard delete — nothing real happened
    delete from public.daily_tasks
    where id = p_task_id
      and user_id = current_user_id;
  end if;
end;
$$;

grant execute on function public.delete_daily_task(uuid) to authenticated;
