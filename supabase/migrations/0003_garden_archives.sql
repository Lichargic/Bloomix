-- ============================================================
-- Bloomix - archived grown trees / garden history
-- ============================================================

create table if not exists public.garden_archives (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  season      text not null
                check (season in ('spring', 'summer', 'autumn', 'winter')),
  days        integer not null default 0,
  blooms      integer not null default 0,
  tasks       integer not null default 0,
  archived_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),

  constraint garden_archives_user_fk
    foreign key (user_id) references auth.users (id) on delete cascade
);

create index if not exists garden_archives_user_archived
  on public.garden_archives (user_id, archived_at desc);

alter table public.garden_archives enable row level security;

create policy "users can read own garden archives"
  on public.garden_archives for select
  using (auth.uid() = user_id);

create policy "users can insert own garden archives"
  on public.garden_archives for insert
  with check (auth.uid() = user_id);

create policy "users can update own garden archives"
  on public.garden_archives for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own garden archives"
  on public.garden_archives for delete
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'garden_archives'
  ) then
    alter publication supabase_realtime add table public.garden_archives;
  end if;
end;
$$;
