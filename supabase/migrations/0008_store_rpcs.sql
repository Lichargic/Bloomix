-- supabase/migrations/0008_store_rpcs.sql
-- ============================================================
-- Bloomix - store RPCs: purchase_skin, purchase_petals
--           + extend complete_daily_task with petal award
-- ============================================================

-- purchase_skin: atomic deduct + insert user_skin
CREATE OR REPLACE FUNCTION public.purchase_skin(p_skin_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_balance int;
  p_cost int;
  skin_label text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate skin_id and look up cost server-side (never trust client-supplied cost)
  SELECT cost, name INTO p_cost, skin_label FROM (VALUES
    ('magma',  600,  'Magma Tree'),
    ('spirit', 800,  'Spirit Tree'),
    ('galaxy', 1000, 'Galaxy Tree')
  ) AS t(id, cost, name)
  WHERE id = p_skin_id;

  IF p_cost IS NULL THEN
    RAISE EXCEPTION 'Invalid skin id';
  END IF;

  -- Abort if already owned
  IF EXISTS (
    SELECT 1 FROM public.user_skins
    WHERE user_id = current_user_id AND skin_id = p_skin_id
  ) THEN
    RAISE EXCEPTION 'Skin already owned';
  END IF;

  -- Check balance (row lock prevents concurrent double-spend)
  SELECT petals INTO current_balance
  FROM public.profiles WHERE id = current_user_id FOR UPDATE;

  IF current_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient petals';
  END IF;

  -- Deduct
  UPDATE public.profiles
  SET petals = petals - p_cost
  WHERE id = current_user_id;

  -- Record spend
  INSERT INTO public.petal_transactions (user_id, type, amount, label)
  VALUES (current_user_id, 'spend_skin', -p_cost, skin_label);

  -- Grant skin
  INSERT INTO public.user_skins (user_id, skin_id)
  VALUES (current_user_id, p_skin_id);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', (SELECT petals FROM public.profiles WHERE id = current_user_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_skin(text) TO authenticated;

-- purchase_petals: simulated bundle — no real payment
CREATE OR REPLACE FUNCTION public.purchase_petals(p_amount int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  bundle_label text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount NOT IN (100, 350, 750) THEN
    RAISE EXCEPTION 'Invalid bundle amount';
  END IF;

  bundle_label := CASE p_amount
    WHEN 100  THEN '100 Petal Bundle'
    WHEN 350  THEN '350 Petal Bundle'
    WHEN 750  THEN '750 Petal Bundle'
  END;

  UPDATE public.profiles SET petals = petals + p_amount WHERE id = current_user_id;

  INSERT INTO public.petal_transactions (user_id, type, amount, label)
  VALUES (current_user_id, 'purchase_petals', p_amount, bundle_label);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', (SELECT petals FROM public.profiles WHERE id = current_user_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_petals(int) TO authenticated;

-- Extend complete_daily_task: award 20 petals on first completion of the day
-- Uses reference_day = active_day for timezone-correct idempotency
CREATE OR REPLACE FUNCTION public.complete_daily_task(p_task_id uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  task_owner uuid;
  active_day date;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO task_owner FROM public.daily_tasks WHERE id = p_task_id;
  IF task_owner IS NULL OR task_owner <> current_user_id THEN
    RAISE EXCEPTION 'Daily task not found';
  END IF;

  active_day := public.get_current_daily_day();

  INSERT INTO public.daily_task_completions (user_id, daily_task_id, completed_on)
  VALUES (current_user_id, p_task_id, active_day)
  ON CONFLICT (daily_task_id, completed_on) DO NOTHING;

  -- Keep legacy column in sync
  UPDATE public.daily_tasks
  SET completed_at = active_day
  WHERE id = p_task_id AND user_id = current_user_id;

  -- Award 20 petals on first task completed today (idempotent via reference_day)
  IF NOT EXISTS (
    SELECT 1 FROM public.petal_transactions
    WHERE user_id = current_user_id
      AND type = 'earn_tended_day'
      AND reference_day = active_day
  ) THEN
    UPDATE public.profiles SET petals = petals + 20 WHERE id = current_user_id;
    INSERT INTO public.petal_transactions (user_id, type, amount, label, reference_day)
    VALUES (current_user_id, 'earn_tended_day', 20, 'Day tended', active_day);
  END IF;

  RETURN active_day;
END;
$$;
