-- ============================================================================
-- Kodera Academy — Migration 0002: Identity, Roles, Applications & Internal Notes
-- ============================================================================

-- 1. User profiles (1:1 with auth.users; role is intentionally NOT stored here)
CREATE TABLE IF NOT EXISTS public.profiles (
    id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email            text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND position('@' IN email) > 1),
    full_name        text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
    phone            text NULL CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-()]{7,25}$'),
    learning_goals   text NULL CHECK (learning_goals IS NULL OR char_length(learning_goals) <= 1000),
    avatar_url       text NULL CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
    preferred_locale text NOT NULL DEFAULT 'az' REFERENCES public.supported_locales(code),
    account_status   public.account_status NOT NULL DEFAULT 'pending',
    archived_at      timestamptz NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_archived_consistency CHECK (
        (account_status = 'archived' AND archived_at IS NOT NULL)
        OR (account_status <> 'archived' AND archived_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
    ON public.profiles (account_status);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
    ON public.profiles (created_at DESC);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Prevent authenticated users from escalating account_status or altering email/archive directly
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
    -- Allow superuser/postgres migrations and service_role backend operations
    IF current_user IN ('postgres', 'supabase_admin') OR v_jwt_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
        RAISE EXCEPTION 'Forbidden: account_status cannot be modified directly'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Forbidden: email must be changed through Supabase Auth'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
        RAISE EXCEPTION 'Forbidden: archived_at cannot be modified directly'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_guard_sensitive
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_profile_sensitive_columns();

-- 2. Dedicated RBAC table (never writable by students or anon)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role       public.app_role NOT NULL,
    granted_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at timestamptz NOT NULL DEFAULT now(),
    revoked_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    revoked_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_user_roles_revoke_consistency CHECK (
        (revoked_at IS NULL AND revoked_by IS NULL)
        OR (revoked_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_active_role
    ON public.user_roles (user_id, role)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_active
    ON public.user_roles (role)
    WHERE revoked_at IS NULL;

-- 3. Cryptographically random application reference code generator (KDR-YYYY-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_application_reference_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    v_bytes    bytea;
    v_suffix   text;
    v_code     text;
    v_i        integer;
    v_attempt  integer := 0;
BEGIN
    LOOP
        v_attempt := v_attempt + 1;
        IF v_attempt > 20 THEN
            RAISE EXCEPTION 'Unable to generate unique application reference code';
        END IF;

        v_bytes := extensions.gen_random_bytes(6);
        v_suffix := '';
        FOR v_i IN 0..5 LOOP
            v_suffix := v_suffix || substr(v_alphabet, (get_byte(v_bytes, v_i) % length(v_alphabet)) + 1, 1);
        END LOOP;

        v_code := 'KDR-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-' || v_suffix;

        IF NOT EXISTS (SELECT 1 FROM public.applications WHERE reference_code = v_code) THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_application_reference_code() FROM PUBLIC;

-- 4. Registration applications (separate from auth & course enrollments)
CREATE TABLE IF NOT EXISTS public.applications (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_code   text NOT NULL UNIQUE DEFAULT public.generate_application_reference_code()
                     CHECK (reference_code ~ '^KDR-[0-9]{4}-[2-9A-HJ-NP-Z]{6}$'),
    status           public.application_status NOT NULL DEFAULT 'pending',
    submitted_at     timestamptz NOT NULL DEFAULT now(),
    reviewed_by      uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at      timestamptz NULL,
    rejection_reason text NULL CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_applications_review_consistency CHECK (
        (status = 'pending' AND reviewed_at IS NULL AND rejection_reason IS NULL)
        OR (status = 'approved' AND reviewed_at IS NOT NULL AND rejection_reason IS NULL)
        OR (status = 'rejected' AND reviewed_at IS NOT NULL)
    )
);

-- A user can have at most one active (pending or approved) application at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_one_active_per_user
    ON public.applications (user_id)
    WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_applications_status_submitted
    ON public.applications (status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_user_id
    ON public.applications (user_id);

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. Private admin internal notes on applications (strictly isolated from students)
CREATE TABLE IF NOT EXISTS public.application_notes (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    author_id      uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    note           text NOT NULL CHECK (char_length(btrim(note)) BETWEEN 1 AND 2000),
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_notes_application_id
    ON public.application_notes (application_id, created_at DESC);

-- 6. Atomic auth.users signup trigger
-- Always provisions role = 'student', account_status = 'pending', application status = 'pending'.
-- NEVER trusts role or approval flags from client raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_email          text;
    v_full_name      text;
    v_phone          text;
    v_learning_goals text;
BEGIN
    v_email := lower(btrim(coalesce(NEW.email, '')));

    v_full_name := btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', ''));
    IF char_length(v_full_name) < 2 THEN
        v_full_name := coalesce(nullif(split_part(v_email, '@', 1), ''), 'İstifadəçi');
        IF char_length(v_full_name) < 2 THEN
            v_full_name := 'İstifadəçi';
        END IF;
    END IF;
    v_full_name := left(v_full_name, 120);

    v_phone := nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'phone', '')), '');
    IF v_phone IS NOT NULL AND v_phone !~ '^\+?[0-9\s\-()]{7,25}$' THEN
        v_phone := NULL;
    END IF;

    v_learning_goals := left(nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'learning_goals', '')), ''), 1000);

    INSERT INTO public.profiles (id, email, full_name, phone, learning_goals, account_status)
    VALUES (NEW.id, v_email, v_full_name, v_phone, v_learning_goals, 'pending')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.applications (user_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
