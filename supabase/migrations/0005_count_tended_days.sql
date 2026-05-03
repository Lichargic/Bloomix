-- Returns the number of distinct days on which the calling user completed at
-- least one daily task. Used by the client to avoid fetching all completion
-- rows just to count unique dates.
create or replace function public.count_tended_days()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(distinct completed_on)::integer
  from public.daily_task_completions
  where user_id = auth.uid()
    and completed_on is not null;
$$;
