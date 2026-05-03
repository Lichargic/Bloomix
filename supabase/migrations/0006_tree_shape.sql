-- ============================================================
-- Bloomix - add tree_shape to profiles and garden_archives
-- ============================================================

alter table public.profiles
  add column if not exists tree_shape text not null default 'shape-1'
    check (tree_shape in ('shape-1', 'shape-2'));

alter table public.garden_archives
  add column if not exists tree_shape text not null default 'shape-1'
    check (tree_shape in ('shape-1', 'shape-2'));
