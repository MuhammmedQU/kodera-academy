-- ============================================================================
-- KODERA ACADEMY — First Staging Admin Bootstrap (`kodera-dev`)
-- ============================================================================
-- USAGE:
--   1. Run ALL 7 migrations (20261123000001..000007) and seed
--      (`supabase/seeds/01_python_intro_modules.sql`) FIRST.
--   2. Register your own admin email via the Staging UI (or create & confirm
--      the user in Supabase Dashboard -> Authentication -> Users).
--   3. Replace `ADMIN_EMAIL_HERE` below with your exact admin email address
--      and run this script ONCE in `kodera-dev` Supabase SQL Editor.
--   4. NEVER run this on `kodera-prod` without explicit production approval.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_target_email constant text := lower(btrim('ADMIN_EMAIL_HERE'));
    v_user_id      uuid;
BEGIN
    IF v_target_email = '' OR v_target_email = 'admin_email_here' OR position('@' IN v_target_email) <= 1 THEN
        RAISE EXCEPTION 'Replace ADMIN_EMAIL_HERE with your actual admin email address before running this script.';
    END IF;

    SELECT id
      INTO v_user_id
      FROM public.profiles
     WHERE email = v_target_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No profile found for email %. Register or create the auth user first.', v_target_email;
    END IF;

    -- 1. Activate profile
    UPDATE public.profiles
       SET account_status = 'active',
           archived_at = NULL
     WHERE id = v_user_id;

    -- 2. Grant active admin role (idempotent)
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (v_user_id, 'admin', v_user_id)
    ON CONFLICT (user_id, role) WHERE revoked_at IS NULL DO NOTHING;

    -- 3. Mark the initial signup application as approved (if still pending)
    UPDATE public.applications
       SET status = 'approved',
           reviewed_by = v_user_id,
           reviewed_at = now(),
           rejection_reason = NULL
     WHERE user_id = v_user_id
       AND status = 'pending';

    -- 4. Record immutable audit entry
    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (
        v_user_id,
        'system',
        'admin.bootstrapped',
        'profile',
        v_user_id,
        jsonb_build_object('email', v_target_email, 'environment', 'kodera-dev')
    );

    RAISE NOTICE 'Successfully promoted % (%) to active Kodera admin.', v_target_email, v_user_id;
END $$;

COMMIT;
