-- ============================================================================
-- Kodera Academy — Migration 0007
-- Independent Security & Production Readiness Hardening, Trigger/RPC Fixes,
-- Minimal Table Grants, and Missing Foreign-Key / Hot-Query Indexes
-- ============================================================================

-- ============================================================================
-- 1. FIX CRITICAL TRIGGER: Allow PostgREST v11+ service_role in profile guard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_claims_raw text := nullif(current_setting('request.jwt.claims', true), '');
    v_jwt_role   text := '';
BEGIN
    -- Support both PostgREST v11+ consolidated request.jwt.claims JSON and legacy request.jwt.claim.role
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

    -- Allow database migrations, Supabase Auth triggers, and authenticated server-side service_role calls
    IF current_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
       OR v_jwt_role = 'service_role'
    THEN
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

-- ============================================================================
-- 2. HARDEN SECURITY DEFINER FUNCTIONS (SET search_path = '') & FUNCTION GRANTS
-- ============================================================================

-- 2a. Reference code generator: lock search_path and revoke direct client EXECUTE
CREATE OR REPLACE FUNCTION public.generate_application_reference_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

REVOKE ALL ON FUNCTION public.generate_application_reference_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_application_reference_code() TO service_role;

-- 2b. handle_new_user(): lock search_path & re-trim after truncation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_email          text;
    v_full_name      text;
    v_phone          text;
    v_learning_goals text;
BEGIN
    v_email := lower(btrim(coalesce(NEW.email, '')));

    v_full_name := btrim(left(btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), 120));
    IF char_length(v_full_name) < 2 THEN
        v_full_name := btrim(left(coalesce(nullif(split_part(v_email, '@', 1), ''), 'İstifadəçi'), 120));
        IF char_length(v_full_name) < 2 THEN
            v_full_name := 'İstifadəçi';
        END IF;
    END IF;

    v_phone := nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'phone', '')), '');
    IF v_phone IS NOT NULL AND v_phone !~ '^\+?[0-9\s\-()]{7,25}$' THEN
        v_phone := NULL;
    END IF;

    v_learning_goals := nullif(btrim(left(btrim(coalesce(NEW.raw_user_meta_data ->> 'learning_goals', '')), 1000)), '');

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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Sync confirmed email changes from auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.sync_auth_user_email_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
        UPDATE public.profiles
           SET email = lower(btrim(NEW.email))
         WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_auth_user_email_to_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_email_to_profile();

-- 2c. sync_lesson_progress_course_id(): lock search_path & preserve original completed_at
CREATE OR REPLACE FUNCTION public.sync_lesson_progress_course_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_course_id uuid;
BEGIN
    SELECT m.course_id
      INTO v_course_id
      FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
     WHERE l.id = NEW.lesson_id;

    IF v_course_id IS NULL THEN
        RAISE EXCEPTION 'Invalid lesson_id for lesson_progress';
    END IF;

    NEW.course_id := v_course_id;
    NEW.last_accessed_at := now();

    IF TG_OP = 'UPDATE' AND OLD.started_at IS NOT NULL THEN
        NEW.started_at := OLD.started_at;
    END IF;

    IF NEW.status = 'completed' THEN
        IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN
            NEW.completed_at := OLD.completed_at;
        ELSIF NEW.completed_at IS NULL THEN
            NEW.completed_at := now();
        END IF;
    ELSE
        NEW.completed_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_lesson_progress_course_id() FROM PUBLIC, anon, authenticated;

-- 2d. CRITICAL FIX: check_and_record_rate_limit() — revoke anon & authenticated, validate inputs, lock search_path
CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
    p_bucket_key     text,
    p_action         text,
    p_window_seconds integer,
    p_max_requests   integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_window_start timestamptz;
    v_count        integer;
BEGIN
    IF p_bucket_key IS NULL OR char_length(btrim(p_bucket_key)) NOT BETWEEN 3 AND 200 THEN
        RAISE EXCEPTION 'Invalid rate limit bucket key' USING ERRCODE = '22023';
    END IF;
    IF p_action IS NULL OR char_length(btrim(p_action)) NOT BETWEEN 2 AND 60 THEN
        RAISE EXCEPTION 'Invalid rate limit action' USING ERRCODE = '22023';
    END IF;
    IF p_window_seconds IS NULL OR p_window_seconds <= 0 OR p_window_seconds > 86400 THEN
        RAISE EXCEPTION 'Invalid rate limit window' USING ERRCODE = '22023';
    END IF;
    IF p_max_requests IS NULL OR p_max_requests <= 0 OR p_max_requests > 10000 THEN
        RAISE EXCEPTION 'Invalid rate limit threshold' USING ERRCODE = '22023';
    END IF;

    v_window_start := now() - make_interval(secs => p_window_seconds);

    PERFORM pg_advisory_xact_lock(hashtext(p_bucket_key || ':' || p_action));

    -- Opportunistic cleanup for this bucket + stale global rows older than 24h
    DELETE FROM public.rate_limit_events
     WHERE (bucket_key = p_bucket_key AND action = p_action AND created_at < v_window_start)
        OR created_at < now() - interval '24 hours';

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

REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, text, integer, integer) TO service_role;

-- 2e. CRITICAL FIX: Grant EXECUTE on get_public_platform_settings() to service_role too
REVOKE ALL ON FUNCTION public.get_public_platform_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_settings() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_course_curriculum_outline(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_curriculum_outline(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_write_learning_for_lesson(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_write_learning_for_lesson(uuid) TO authenticated, service_role;

-- 2f. HARDEN submit_quiz_attempt(): lock search_path, DB-level rate limit, JSON null safety, max(attempt_number)+1
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_quiz_id uuid,
    p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_id       uuid := auth.uid();
    v_quiz             public.quizzes%ROWTYPE;
    v_attempt_count    integer;
    v_next_attempt_num integer;
    v_attempt_id       uuid;
    v_total_points     integer := 0;
    v_earned_points    integer := 0;
    v_score_percent    numeric(5,2);
    v_is_passed        boolean;
    v_question         RECORD;
    v_selected_ids     uuid[];
    v_correct_ids      uuid[];
    v_q_correct        boolean;
    v_points_awarded   integer;
    v_feedback         jsonb := '[]'::jsonb;
    v_rate_allowed     boolean;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- Defense-in-depth DB-level rate limiting against direct PostgREST RPC brute-force
    v_rate_allowed := public.check_and_record_rate_limit(
        'quiz_rpc:' || v_student_id::text,
        'quiz_submit',
        60,
        20
    );
    IF NOT v_rate_allowed THEN
        RAISE EXCEPTION 'Rate limit exceeded for quiz submissions' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_quiz
      FROM public.quizzes
     WHERE id = p_quiz_id
       AND is_published = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quiz not found or unpublished' USING ERRCODE = 'P0002';
    END IF;

    IF NOT public.can_write_learning_for_lesson(v_quiz.lesson_id) THEN
        RAISE EXCEPTION 'Forbidden: active enrollment required to submit quiz' USING ERRCODE = '42501';
    END IF;

    IF p_answers IS NULL
       OR jsonb_typeof(p_answers) <> 'array'
       OR jsonb_array_length(p_answers) = 0
    THEN
        RAISE EXCEPTION 'Invalid or empty answers payload' USING ERRCODE = '22023';
    END IF;

    -- Prevent concurrent race conditions on attempt_number and max_attempts
    PERFORM pg_advisory_xact_lock(hashtext(v_student_id::text || ':' || p_quiz_id::text));

    SELECT count(*), coalesce(max(attempt_number), 0) + 1
      INTO v_attempt_count, v_next_attempt_num
      FROM public.quiz_attempts
     WHERE student_id = v_student_id
       AND quiz_id = p_quiz_id;

    IF v_quiz.max_attempts IS NOT NULL AND v_attempt_count >= v_quiz.max_attempts THEN
        RAISE EXCEPTION 'Maximum quiz attempts reached' USING ERRCODE = 'P0001';
    END IF;

    SELECT coalesce(sum(points), 0) INTO v_total_points
      FROM public.quiz_questions
     WHERE quiz_id = p_quiz_id;

    IF v_total_points <= 0 THEN
        RAISE EXCEPTION 'Quiz has no scorable questions' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.quiz_attempts (
        student_id, quiz_id, attempt_number, earned_points, total_points, score_percent, is_passed
    )
    VALUES (
        v_student_id, p_quiz_id, v_next_attempt_num, 0, v_total_points, 0, false
    )
    RETURNING id INTO v_attempt_id;

    FOR v_question IN
        SELECT id, points, explanation
          FROM public.quiz_questions
         WHERE quiz_id = p_quiz_id
         ORDER BY sort_order ASC
    LOOP
        SELECT coalesce(array_agg(DISTINCT opt_id::uuid ORDER BY opt_id::uuid), '{}')
          INTO v_selected_ids
          FROM jsonb_array_elements(p_answers) AS elem,
               LATERAL jsonb_array_elements_text(
                   CASE
                       WHEN jsonb_typeof(elem) = 'object'
                            AND jsonb_typeof(elem -> 'selected_option_ids') = 'array'
                       THEN elem -> 'selected_option_ids'
                       ELSE '[]'::jsonb
                   END
               ) AS opt_id
         WHERE jsonb_typeof(elem) = 'object'
           AND (elem ->> 'question_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND (elem ->> 'question_id')::uuid = v_question.id
           AND opt_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND opt_id::uuid IN (
               SELECT id FROM public.quiz_question_options WHERE question_id = v_question.id
           );

        SELECT coalesce(array_agg(id ORDER BY id), '{}')
          INTO v_correct_ids
          FROM public.quiz_question_options
         WHERE question_id = v_question.id
           AND is_correct = true;

        v_q_correct := (v_selected_ids = v_correct_ids AND cardinality(v_correct_ids) > 0);
        v_points_awarded := CASE WHEN v_q_correct THEN v_question.points ELSE 0 END;
        v_earned_points := v_earned_points + v_points_awarded;

        INSERT INTO public.quiz_attempt_answers (
            attempt_id, question_id, selected_option_ids, is_correct, points_awarded
        )
        VALUES (
            v_attempt_id, v_question.id, v_selected_ids, v_q_correct, v_points_awarded
        );

        v_feedback := v_feedback || jsonb_build_object(
            'question_id', v_question.id,
            'is_correct', v_q_correct,
            'points_awarded', v_points_awarded,
            'explanation', v_question.explanation
        );
    END LOOP;

    v_score_percent := round((v_earned_points::numeric / v_total_points::numeric) * 100, 2);
    v_is_passed := (v_score_percent >= v_quiz.passing_score_percent);

    UPDATE public.quiz_attempts
       SET earned_points = v_earned_points,
           score_percent = v_score_percent,
           is_passed = v_is_passed
     WHERE id = v_attempt_id;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'attempt_number', v_next_attempt_num,
        'earned_points', v_earned_points,
        'total_points', v_total_points,
        'score_percent', v_score_percent,
        'is_passed', v_is_passed,
        'feedback', v_feedback
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- 2g. Atomic application review RPC (service_role only) so application + profile status never diverge
CREATE OR REPLACE FUNCTION public.review_application_atomic(
    p_application_id   uuid,
    p_decision         public.application_status,
    p_reviewed_by      uuid,
    p_rejection_reason text DEFAULT NULL,
    p_internal_note    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_app     public.applications%ROWTYPE;
    v_profile public.profiles%ROWTYPE;
    v_now     timestamptz := now();
BEGIN
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid application decision' USING ERRCODE = '22023';
    END IF;

    UPDATE public.applications
       SET status = p_decision,
           reviewed_by = p_reviewed_by,
           reviewed_at = v_now,
           rejection_reason = CASE WHEN p_decision = 'rejected' THEN p_rejection_reason ELSE NULL END
     WHERE id = p_application_id
    RETURNING * INTO v_app;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.profiles
       SET account_status = CASE WHEN p_decision = 'approved' THEN 'active'::public.account_status ELSE 'rejected'::public.account_status END,
           archived_at = NULL
     WHERE id = v_app.user_id
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Applicant profile not found' USING ERRCODE = 'P0002';
    END IF;

    IF p_internal_note IS NOT NULL AND char_length(btrim(p_internal_note)) > 0 THEN
        INSERT INTO public.application_notes (application_id, author_id, note)
        VALUES (p_application_id, p_reviewed_by, btrim(p_internal_note));
    END IF;

    RETURN jsonb_build_object(
        'application', to_jsonb(v_app),
        'profile', to_jsonb(v_profile)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.review_application_atomic(uuid, public.application_status, uuid, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_application_atomic(uuid, public.application_status, uuid, text, text)
    TO service_role;

-- ============================================================================
-- 3. FIX AUDIT LOG IMMUTABILITY (ALLOW FK ON DELETE SET NULL + BLOCK TRUNCATE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Permit ONLY PostgreSQL FK ON DELETE SET NULL on actor_id when an admin account is deleted
    IF TG_OP = 'UPDATE'
       AND current_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
       AND OLD.actor_id IS NOT NULL
       AND NEW.actor_id IS NULL
       AND NEW.id IS NOT DISTINCT FROM OLD.id
       AND NEW.actor_role IS NOT DISTINCT FROM OLD.actor_role
       AND NEW.action IS NOT DISTINCT FROM OLD.action
       AND NEW.entity_type IS NOT DISTINCT FROM OLD.entity_type
       AND NEW.entity_id IS NOT DISTINCT FROM OLD.entity_id
       AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata
       AND NEW.ip_address IS NOT DISTINCT FROM OLD.ip_address
       AND NEW.user_agent IS NOT DISTINCT FROM OLD.user_agent
       AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
    THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Forbidden: audit_logs records are immutable and cannot be updated, deleted, or truncated'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_truncate ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_truncate
    BEFORE TRUNCATE ON public.audit_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ============================================================================
-- 4. BOUND exercise_attempts.test_results JSONB SIZE + TIGHTEN TABLE GRANTS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'chk_exercise_attempts_test_results_size'
           AND conrelid = 'public.exercise_attempts'::regclass
    ) THEN
        ALTER TABLE public.exercise_attempts
            ADD CONSTRAINT chk_exercise_attempts_test_results_size
            CHECK (octet_length(test_results::text) <= 50000);
    END IF;
END $$;

-- Zero-trust table privilege baseline: revoke ALL (including TRUNCATE/REFERENCES/TRIGGER)
-- from PUBLIC, anon, authenticated, then explicitly grant only minimum required access.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Public/catalog read tables (filtered by RLS)
GRANT SELECT ON public.supported_locales     TO anon, authenticated;
GRANT SELECT ON public.courses               TO anon, authenticated;
GRANT SELECT ON public.modules               TO anon, authenticated;
GRANT SELECT ON public.lessons               TO anon, authenticated;
GRANT SELECT ON public.lesson_content_blocks TO anon, authenticated;
GRANT SELECT ON public.exercises             TO anon, authenticated;
GRANT SELECT ON public.exercise_test_cases   TO anon, authenticated;
GRANT SELECT ON public.quizzes               TO anon, authenticated;

-- Safe column-level SELECT on quiz_questions & quiz_question_options (never expose explanation/is_correct)
GRANT SELECT (id, quiz_id, question_type, prompt, code_snippet, code_language, points, sort_order, created_at, updated_at)
    ON public.quiz_questions TO anon, authenticated;
GRANT SELECT (id, question_id, option_text, sort_order, created_at)
    ON public.quiz_question_options TO anon, authenticated;
GRANT SELECT ON public.quiz_options_public TO anon, authenticated;

-- Authenticated user-scoped / admin-scoped read tables (filtered by RLS)
-- Note: Learning writes (lesson_progress, exercise_attempts) go through rate-limited
-- server API endpoints (service_role) so direct PostgREST clients cannot bypass rate limits.
GRANT SELECT ON public.profiles             TO authenticated;
GRANT UPDATE (full_name, phone, learning_goals, preferred_locale)
    ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles           TO authenticated;
GRANT SELECT ON public.applications         TO authenticated;
GRANT SELECT ON public.application_notes    TO authenticated;
GRANT SELECT ON public.exercise_solutions   TO authenticated;
GRANT SELECT ON public.enrollments          TO authenticated;
GRANT SELECT ON public.lesson_progress      TO authenticated;
GRANT SELECT ON public.exercise_attempts    TO authenticated;
GRANT SELECT ON public.quiz_attempts        TO authenticated;
GRANT SELECT ON public.quiz_attempt_answers TO authenticated;
GRANT SELECT ON public.platform_settings    TO authenticated;
GRANT SELECT ON public.audit_logs           TO authenticated;

-- Tighten profiles update policy so only ACTIVE users may update own safe profile fields
DROP POLICY IF EXISTS "profiles_update_own_safe_fields" ON public.profiles;
CREATE POLICY "profiles_update_own_safe_fields"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()) AND account_status = 'active')
    WITH CHECK (id = (SELECT auth.uid()) AND account_status = 'active');

-- ============================================================================
-- 5. MISSING FOREIGN-KEY & HOT-QUERY INDEXES (DROP REDUNDANT INDEX)
-- ============================================================================
DROP INDEX IF EXISTS public.idx_quiz_attempt_answers_attempt_id;
DROP INDEX IF EXISTS public.idx_applications_user_id;

CREATE INDEX IF NOT EXISTS idx_applications_user_submitted
    ON public.applications (user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
    ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_status_created
    ON public.profiles (account_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollments_assigned_at
    ON public.enrollments (assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollments_active_status
    ON public.enrollments (status)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_exercise_id
    ON public.lesson_content_blocks (exercise_id)
    WHERE exercise_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_quiz_id
    ON public.lesson_content_blocks (quiz_id)
    WHERE quiz_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
    ON public.lesson_progress (lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id
    ON public.lesson_progress (course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_completed
    ON public.lesson_progress (student_id, completed_at DESC)
    WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_student_created
    ON public.exercise_attempts (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id
    ON public.quiz_attempts (quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_submitted
    ON public.quiz_attempts (student_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question_id
    ON public.quiz_attempt_answers (question_id);
