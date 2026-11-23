-- ============================================================================
-- KODERA LMS — Migration 0005: Platform Settings, Immutable Audit Logs &
--                              Serverless PostgreSQL Rate Limiting
-- Phase 2 Draft (DO NOT execute on live Supabase before owner approval)
-- ============================================================================

-- 1. Platform & WhatsApp settings (strict singleton table; admin-only direct access)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id                           boolean PRIMARY KEY DEFAULT true CHECK (id = true),
    academy_name                 text NOT NULL DEFAULT 'Kodera'
                                 CHECK (char_length(btrim(academy_name)) BETWEEN 2 AND 100),
    academy_tagline              text NOT NULL DEFAULT 'Proqramlaşdırmanı sadə, aydın və praktik öyrən'
                                 CHECK (char_length(btrim(academy_tagline)) BETWEEN 2 AND 240),
    logo_storage_path            text NULL CHECK (logo_storage_path IS NULL OR char_length(logo_storage_path) <= 500),
    contact_email                text NULL CHECK (contact_email IS NULL OR position('@' IN contact_email) > 1),
    -- E.164 digits only (without '+' or spaces), e.g. '994501234567' for https://wa.me/994501234567
    whatsapp_phone               text NULL CHECK (whatsapp_phone IS NULL OR whatsapp_phone ~ '^[1-9][0-9]{7,14}$'),
    whatsapp_button_enabled      boolean NOT NULL DEFAULT false,
    whatsapp_button_label        text NOT NULL DEFAULT 'WhatsApp ilə administratora yaz'
                                 CHECK (char_length(btrim(whatsapp_button_label)) BETWEEN 2 AND 100),
    whatsapp_message_template    text NOT NULL DEFAULT
        'Salam! Kodera akademiyasında qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.'
                                 CHECK (char_length(btrim(whatsapp_message_template)) BETWEEN 10 AND 1000),
    alternative_contact_text     text NULL DEFAULT 'Bizimlə əlaqə saxlamaq üçün rəsmi email ünvanımıza yaza bilərsiniz.'
                                 CHECK (alternative_contact_text IS NULL OR char_length(alternative_contact_text) <= 500),
    registration_enabled         boolean NOT NULL DEFAULT true,
    default_public_modules_count integer NOT NULL DEFAULT 2 CHECK (default_public_modules_count BETWEEN 0 AND 20),
    updated_by                   uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at                   timestamptz NOT NULL DEFAULT now(),
    updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.platform_settings (id, academy_name)
VALUES (true, 'Kodera')
ON CONFLICT (id) DO NOTHING;

-- 2. Immutable administrative & security audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role  text NOT NULL CHECK (actor_role IN ('admin', 'system')),
    action      text NOT NULL CHECK (action ~ '^[a-z0-9_]+\.[a-z0-9_]+$'),
    entity_type text NOT NULL CHECK (char_length(btrim(entity_type)) BETWEEN 2 AND 60),
    entity_id   uuid NULL,
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    ip_address  inet NULL,
    user_agent  text NULL CHECK (user_agent IS NULL OR char_length(user_agent) <= 500),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
    ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON public.audit_logs (action, created_at DESC);

-- Enforce strict append-only immutability at database engine level
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'Forbidden: audit_logs records are immutable and cannot be updated or deleted'
        USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 3. Serverless-compatible PostgreSQL rate limiting table (service_role only)
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bucket_key text NOT NULL CHECK (char_length(btrim(bucket_key)) BETWEEN 3 AND 200),
    action     text NOT NULL CHECK (char_length(btrim(action)) BETWEEN 2 AND 60),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup
    ON public.rate_limit_events (bucket_key, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at
    ON public.rate_limit_events (created_at ASC);

-- Atomic sliding-window rate limit check (callable ONLY by service_role)
CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
    p_bucket_key     text,
    p_action         text,
    p_window_seconds integer,
    p_max_requests   integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start timestamptz := now() - make_interval(secs => p_window_seconds);
    v_count        integer;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_bucket_key || ':' || p_action));

    -- Opportunistic cleanup of expired entries for this bucket
    DELETE FROM public.rate_limit_events
     WHERE bucket_key = p_bucket_key
       AND action = p_action
       AND created_at < v_window_start;

    SELECT count(*)
      INTO v_count
      FROM public.rate_limit_events
     WHERE bucket_key = p_bucket_key
       AND action = p_action
       AND created_at >= v_window_start;

    IF v_count >= p_max_requests THEN
        RETURN false;
    END IF;

    INSERT INTO public.rate_limit_events (bucket_key, action)
    VALUES (p_bucket_key, p_action);

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, text, integer, integer) TO service_role;
