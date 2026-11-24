-- ============================================================================
-- Kodera Academy — Migration 0008
-- Official Academy Contact Configuration (Kodera Academy, WhatsApp 994702045610,
-- Official Email muhammed.ehmedov94@gmail.com, Configurable Future Domain) &
-- Real Database-Backed Admin Dashboard Statistics RPC
-- ============================================================================

-- 1. Extend platform_settings with email_sender_name and future website_domain
ALTER TABLE public.platform_settings
    ADD COLUMN IF NOT EXISTS email_sender_name text NOT NULL DEFAULT 'Kodera Academy'
        CHECK (char_length(btrim(email_sender_name)) BETWEEN 2 AND 100),
    ADD COLUMN IF NOT EXISTS website_domain text NULL
        CHECK (
            website_domain IS NULL
            OR (
                website_domain ~ '^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
                AND char_length(website_domain) <= 255
            )
        );

-- 2. Align column defaults and singleton row with official Kodera Academy contact details
ALTER TABLE public.platform_settings
    ALTER COLUMN academy_name SET DEFAULT 'Kodera Academy',
    ALTER COLUMN contact_email SET DEFAULT 'muhammed.ehmedov94@gmail.com',
    ALTER COLUMN whatsapp_phone SET DEFAULT '994702045610',
    ALTER COLUMN whatsapp_button_enabled SET DEFAULT true,
    ALTER COLUMN whatsapp_message_template SET DEFAULT
        'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.';

INSERT INTO public.platform_settings (
    id,
    academy_name,
    contact_email,
    email_sender_name,
    website_domain,
    whatsapp_phone,
    whatsapp_button_enabled,
    whatsapp_button_label,
    whatsapp_message_template
)
VALUES (
    true,
    'Kodera Academy',
    'muhammed.ehmedov94@gmail.com',
    'Kodera Academy',
    NULL,
    '994702045610',
    true,
    'WhatsApp ilə administratora yaz',
    'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.'
)
ON CONFLICT (id) DO UPDATE
   SET academy_name = CASE
           WHEN public.platform_settings.academy_name IN ('Kodera', 'Kodera Academy')
           THEN 'Kodera Academy'
           ELSE public.platform_settings.academy_name
       END,
       contact_email = CASE
           WHEN public.platform_settings.contact_email IS NULL
                OR public.platform_settings.contact_email = 'info@kodera.academy'
           THEN 'muhammed.ehmedov94@gmail.com'
           ELSE public.platform_settings.contact_email
       END,
       email_sender_name = COALESCE(NULLIF(btrim(public.platform_settings.email_sender_name), ''), 'Kodera Academy'),
       whatsapp_phone = CASE
           WHEN public.platform_settings.whatsapp_phone IS NULL
                OR public.platform_settings.whatsapp_phone = '994501234567'
           THEN '994702045610'
           ELSE public.platform_settings.whatsapp_phone
       END,
       whatsapp_button_enabled = CASE
           WHEN public.platform_settings.whatsapp_phone IS NULL
                OR public.platform_settings.whatsapp_phone = '994501234567'
           THEN true
           ELSE public.platform_settings.whatsapp_button_enabled
       END,
       whatsapp_message_template = 'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.';

-- 3. Update get_public_platform_settings() to include email_sender_name and website_domain
DROP FUNCTION IF EXISTS public.get_public_platform_settings();

CREATE OR REPLACE FUNCTION public.get_public_platform_settings()
RETURNS TABLE (
    academy_name                 text,
    academy_tagline              text,
    logo_storage_path            text,
    contact_email                text,
    email_sender_name            text,
    website_domain               text,
    whatsapp_button_enabled      boolean,
    whatsapp_phone               text,
    whatsapp_button_label        text,
    whatsapp_message_template    text,
    alternative_contact_text     text,
    registration_enabled         boolean,
    default_public_modules_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        ps.academy_name,
        ps.academy_tagline,
        ps.logo_storage_path,
        ps.contact_email,
        ps.email_sender_name,
        ps.website_domain,
        (ps.whatsapp_button_enabled AND ps.whatsapp_phone IS NOT NULL) AS whatsapp_button_enabled,
        CASE
            WHEN ps.whatsapp_button_enabled AND ps.whatsapp_phone IS NOT NULL THEN ps.whatsapp_phone
            ELSE NULL
        END AS whatsapp_phone,
        ps.whatsapp_button_label,
        ps.whatsapp_message_template,
        ps.alternative_contact_text,
        ps.registration_enabled,
        ps.default_public_modules_count
      FROM public.platform_settings ps
     WHERE ps.id = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_settings() TO anon, authenticated, service_role;

-- 4. Database-backed Admin Dashboard Statistics RPC (single round-trip, zero fake counts)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_claims_raw             text := nullif(current_setting('request.jwt.claims', true), '');
    v_jwt_role               text := '';
    v_total_registered_users integer := 0;
    v_pending_applications   integer := 0;
    v_approved_applications  integer := 0;
    v_rejected_applications  integer := 0;
    v_active_students        integer := 0;
    v_suspended_accounts     integer := 0;
    v_active_enrollments     integer := 0;
    v_published_courses      integer := 0;
    v_total_courses          integer := 0;
    v_total_modules          integer := 0;
    v_published_lessons      integer := 0;
    v_total_lessons          integer := 0;
    v_completed_lessons      integer := 0;
BEGIN
    IF v_claims_raw IS NOT NULL THEN
        BEGIN
            v_jwt_role := coalesce((v_claims_raw::jsonb ->> 'role'), '');
        EXCEPTION WHEN others THEN
            v_jwt_role := '';
        END;
    END IF;
    IF v_jwt_role = '' THEN
        v_jwt_role := coalesce(current_setting('request.jwt.claim.role', true), '');
    END IF;

    IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
       AND v_jwt_role <> 'service_role'
       AND NOT public.is_admin()
    THEN
        RAISE EXCEPTION 'Forbidden: admin authorization required' USING ERRCODE = '42501';
    END IF;

    -- Count non-admin registered user profiles so an empty academy before student signups reports 0
    SELECT count(*)::integer
      INTO v_total_registered_users
      FROM public.profiles p
     WHERE p.account_status <> 'archived'
       AND NOT EXISTS (
           SELECT 1
             FROM public.user_roles ur
            WHERE ur.user_id = p.id
              AND ur.role = 'admin'
              AND ur.revoked_at IS NULL
       );

    SELECT
        count(*) FILTER (WHERE a.status = 'pending')::integer,
        count(*) FILTER (WHERE a.status = 'approved')::integer,
        count(*) FILTER (WHERE a.status = 'rejected')::integer
      INTO v_pending_applications, v_approved_applications, v_rejected_applications
      FROM public.applications a
      JOIN public.profiles p ON p.id = a.user_id
     WHERE NOT EXISTS (
         SELECT 1
           FROM public.user_roles ur
          WHERE ur.user_id = p.id
            AND ur.role = 'admin'
            AND ur.revoked_at IS NULL
     );

    SELECT
        count(*) FILTER (WHERE p.account_status = 'active')::integer,
        count(*) FILTER (WHERE p.account_status = 'suspended')::integer
      INTO v_active_students, v_suspended_accounts
      FROM public.profiles p
     WHERE EXISTS (
         SELECT 1
           FROM public.user_roles ur
          WHERE ur.user_id = p.id
            AND ur.role = 'student'
            AND ur.revoked_at IS NULL
     )
       AND NOT EXISTS (
         SELECT 1
           FROM public.user_roles ur2
          WHERE ur2.user_id = p.id
            AND ur2.role = 'admin'
            AND ur2.revoked_at IS NULL
     );

    SELECT count(*)::integer
      INTO v_active_enrollments
      FROM public.enrollments
     WHERE status = 'active';

    SELECT
        count(*) FILTER (WHERE is_published = true)::integer,
        count(*) FILTER (WHERE status <> 'archived')::integer
      INTO v_published_courses, v_total_courses
      FROM public.courses;

    SELECT count(*)::integer
      INTO v_total_modules
      FROM public.modules
     WHERE status <> 'archived';

    SELECT
        count(*) FILTER (WHERE is_published = true)::integer,
        count(*) FILTER (WHERE status <> 'archived')::integer
      INTO v_published_lessons, v_total_lessons
      FROM public.lessons;

    SELECT count(*)::integer
      INTO v_completed_lessons
      FROM public.lesson_progress
     WHERE status = 'completed';

    RETURN jsonb_build_object(
        'total_registered_users', v_total_registered_users,
        'pending_applications', v_pending_applications,
        'approved_applications', v_approved_applications,
        'rejected_applications', v_rejected_applications,
        'active_students', v_active_students,
        'suspended_accounts', v_suspended_accounts,
        'suspended_students', v_suspended_accounts,
        'active_enrollments', v_active_enrollments,
        'published_courses', v_published_courses,
        'total_courses', v_total_courses,
        'total_modules', v_total_modules,
        'published_lessons', v_published_lessons,
        'total_lessons', v_total_lessons,
        'completed_lessons', v_completed_lessons
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;
