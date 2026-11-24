-- ============================================================================
-- KODERA ACADEMY — First Admin Account Bootstrap (`koderaaz@gmail.com`)
-- ============================================================================
-- SECURITY RULES:
--   1. NO password is ever stored in this file, in SQL migrations, or in Git.
--   2. Registering with `koderaaz@gmail.com` does NOT automatically grant admin
--      privileges (the signup trigger always creates `role = 'student'`).
--   3. First, create and confirm the `koderaaz@gmail.com` user in Supabase
--      Dashboard -> Authentication -> Users -> Add User (with your private
--      password and `Auto Confirm User` checked, or confirm via email link).
--   4. Run this script ONCE in Supabase SQL Editor (`kodera-dev` or `kodera-prod`).
--   5. This script verifies that `auth.users.email_confirmed_at IS NOT NULL`
--      before promoting the account to `admin` and removes the `student` role
--      so the admin account is strictly isolated from the student dashboard.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_target_email   constant text := lower(btrim('koderaaz@gmail.com'));
    v_user_id        uuid;
    v_confirmed_at   timestamptz;
BEGIN
    SELECT u.id, u.email_confirmed_at
      INTO v_user_id, v_confirmed_at
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
     WHERE lower(btrim(u.email)) = v_target_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'No user found in auth.users/public.profiles for %. Create the user in Supabase Authentication -> Users first.',
            v_target_email;
    END IF;

    IF v_confirmed_at IS NULL THEN
        RAISE EXCEPTION
            'Account % is not email-verified yet (email_confirmed_at IS NULL). Confirm the user in Supabase Auth before promoting to admin.',
            v_target_email;
    END IF;

    -- 1. Activate profile
    UPDATE public.profiles
       SET account_status = 'active',
           archived_at = NULL
     WHERE id = v_user_id;

    -- 2. Remove student role so admin account cannot use the student dashboard
    DELETE FROM public.user_roles
     WHERE user_id = v_user_id
       AND role = 'student';

    -- 3. Grant active admin role (idempotent)
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (v_user_id, 'admin', v_user_id)
    ON CONFLICT (user_id, role) WHERE revoked_at IS NULL DO NOTHING;

    -- 4. Remove any pending student signup application row for the admin account
    DELETE FROM public.applications
     WHERE user_id = v_user_id;

    -- 5. Sync admin_login_email in platform_settings (without altering public contact_email)
    UPDATE public.platform_settings
       SET admin_login_email = v_target_email,
           updated_by = v_user_id
     WHERE id = true;

    -- 6. Record immutable audit entry
    INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    VALUES (
        v_user_id,
        'system',
        'admin.bootstrapped',
        'profile',
        v_user_id,
        jsonb_build_object(
            'admin_email', v_target_email,
            'email_verified', true
        )
    );

    RAISE NOTICE 'Successfully promoted verified account % (%) to active Kodera Academy administrator.', v_target_email, v_user_id;
END $$;

COMMIT;
