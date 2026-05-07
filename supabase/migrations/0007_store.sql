-- supabase/migrations/0007_store.sql
-- ============================================================
-- Bloomix - store schema: petals, petal_transactions, user_skins
-- ============================================================

-- 1. New columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS petals int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_skin_id text
    CHECK (active_skin_id IN ('magma', 'spirit', 'galaxy'));

-- 2. New column on garden_archives (records the skin a cycle wore)
ALTER TABLE public.garden_archives
  ADD COLUMN IF NOT EXISTS skin_id text
    CHECK (skin_id IN ('magma', 'spirit', 'galaxy'));

-- 3. petal_transactions
CREATE TABLE IF NOT EXISTS public.petal_transactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type          text        NOT NULL
    CHECK (type IN ('earn_tended_day', 'earn_cycle', 'purchase_petals', 'spend_skin')),
  amount        int         NOT NULL,
  label         text        NOT NULL,
  reference_day date,       -- for earn_tended_day: the active_day used for idempotency
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petal_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own petal transactions"
  ON public.petal_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS petal_transactions_user_date
  ON public.petal_transactions (user_id, created_at DESC);

-- 4. user_skins
CREATE TABLE IF NOT EXISTS public.user_skins (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  skin_id      text        NOT NULL CHECK (skin_id IN ('magma', 'spirit', 'galaxy')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skin_id)
);

ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own skins"
  ON public.user_skins FOR SELECT
  USING (user_id = auth.uid());
