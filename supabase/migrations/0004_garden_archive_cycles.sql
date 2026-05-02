-- ============================================================
-- Bloomix - garden archive cycle date range columns
-- ============================================================

alter table public.garden_archives
  add column if not exists cycle_started_on date,
  add column if not exists cycle_ended_on date;

update public.garden_archives
set cycle_ended_on = archived_at::date
where cycle_ended_on is null;

create unique index if not exists garden_archives_user_cycle_end
  on public.garden_archives (user_id, cycle_ended_on)
  where cycle_ended_on is not null;
