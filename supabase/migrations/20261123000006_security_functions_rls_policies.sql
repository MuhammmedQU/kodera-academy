-- ============================================================================
-- Kodera Academy — Migration 0006: Security Functions, Column Hardening,
--                                  Row Level Security (RLS) & Storage Policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: AUTHORIZATION HELPER FUNCTIONS (SECURITY DEFINER, SAFE search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.user_roles ur
          JOIN public.profiles p ON p.id = ur.user_id
         WHERE ur.user_id = auth.uid()
           AND ur.role = 'admin'
           AND ur.revoked_at IS NULL
           AND p.account_status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.profiles p
          JOIN public.user_roles ur ON ur.user_id = p.id
         WHERE p.id = auth.uid()
           AND p.account_status = 'active'
           AND ur.role = 'student'
           AND ur.revoked_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.is_active_student()
       AND EXISTS (
           SELECT 1
             FROM public.enrollments e
            WHERE e.student_id = auth.uid()
              AND e.course_id = p_course_id
              AND e.status IN ('active', 'completed')
       );
$$;

CREATE OR REPLACE FUNCTION public.can_access_module(p_module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1
              FROM public.modules m
              JOIN public.courses c ON c.id = m.course_id
             WHERE m.id = p_module_id
               AND m.is_published = true
               AND c.is_published = true
               AND (
                   m.is_public = true
                   OR public.is_enrolled_in_course(m.course_id)
               )
        );
$$;

CREATE OR REPLACE FUNCTION public.can_access_lesson(p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.is_admin()
        OR EXISTS (
            SELECT 1
              FROM public.lessons l
             WHERE l.id = p_lesson_id
               AND l.is_published = true
               AND public.can_access_module(l.module_id)
        );
$$;

CREATE OR REPLACE FUNCTION public.can_write_learning_for_lesson(p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.lessons l
          JOIN public.modules m ON m.id = l.module_id
          JOIN public.courses c ON c.id = m.course_id
         WHERE l.id = p_lesson_id
           AND l.is_published = true
           AND m.is_published = true
           AND c.is_published = true
           AND public.is_enrolled_in_course(m.course_id)
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enrolled_in_course(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_module(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_lesson(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_learning_for_lesson(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_student() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled_in_course(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_module(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_learning_for_lesson(uuid) TO authenticated;

-- ============================================================================
-- SECTION 2: SAFE PUBLIC RPCs & SERVER-SIDE QUIZ GRADING RPC
-- ============================================================================

-- Safe public settings reader: masks WhatsApp phone when button is disabled
CREATE OR REPLACE FUNCTION public.get_public_platform_settings()
RETURNS TABLE (
    academy_name                 text,
    academy_tagline              text,
    logo_storage_path            text,
    contact_email                text,
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
GRANT EXECUTE ON FUNCTION public.get_public_platform_settings() TO anon, authenticated;

-- Public curriculum outline RPC: exposes module/lesson titles & access badges
-- WITHOUT exposing restricted lesson summaries, blocks, exercises, or quizzes.
CREATE OR REPLACE FUNCTION public.get_course_curriculum_outline(p_course_slug text)
RETURNS TABLE (
    module_id         uuid,
    module_slug       text,
    module_title      text,
    module_sort_order integer,
    is_public         boolean,
    can_access        boolean,
    lesson_id         uuid,
    lesson_slug       text,
    lesson_title      text,
    lesson_sort_order integer,
    estimated_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        m.id AS module_id,
        m.slug AS module_slug,
        m.title AS module_title,
        m.sort_order AS module_sort_order,
        m.is_public,
        public.can_access_module(m.id) AS can_access,
        l.id AS lesson_id,
        CASE WHEN public.can_access_module(m.id) THEN l.slug ELSE NULL END AS lesson_slug,
        l.title AS lesson_title,
        l.sort_order AS lesson_sort_order,
        l.estimated_minutes
      FROM public.courses c
      JOIN public.modules m ON m.course_id = c.id AND m.is_published = true
      LEFT JOIN public.lessons l ON l.module_id = m.id AND l.is_published = true
     WHERE c.slug = p_course_slug
       AND c.is_published = true
     ORDER BY m.sort_order ASC, l.sort_order ASC;
$$;

REVOKE ALL ON FUNCTION public.get_course_curriculum_outline(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_curriculum_outline(text) TO anon, authenticated;

-- Server-side atomic quiz grading function (prevents score spoofing & answer-key leaks)
-- p_answers JSON format: [{"question_id": "<uuid>", "selected_option_ids": ["<uuid>", ...]}]
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_quiz_id uuid,
    p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id       uuid := auth.uid();
    v_quiz             public.quizzes%ROWTYPE;
    v_attempt_count    integer;
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
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
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

    IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
        RAISE EXCEPTION 'Invalid answers payload' USING ERRCODE = '22023';
    END IF;

    -- Prevent concurrent race conditions on attempt_number and max_attempts
    PERFORM pg_advisory_xact_lock(hashtext(v_student_id::text || ':' || p_quiz_id::text));

    SELECT count(*) INTO v_attempt_count
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
        v_student_id, p_quiz_id, v_attempt_count + 1, 0, v_total_points, 0, false
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
               LATERAL jsonb_array_elements_text(coalesce(elem -> 'selected_option_ids', '[]'::jsonb)) AS opt_id
         WHERE (elem ->> 'question_id')::uuid = v_question.id
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
        'attempt_number', v_attempt_count + 1,
        'earned_points', v_earned_points,
        'total_points', v_total_points,
        'score_percent', v_score_percent,
        'is_passed', v_is_passed,
        'feedback', v_feedback
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- ============================================================================
-- SECTION 3: COLUMN-LEVEL HARDENING & SAFE VIEWS
-- ============================================================================

-- Profiles: students may only update explicitly permitted personal columns
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, learning_goals, avatar_url, preferred_locale)
    ON public.profiles TO authenticated;

-- Quiz questions & options: hide explanation & is_correct from direct client reads
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, question_type, prompt, code_snippet, code_language, points, sort_order, created_at, updated_at)
    ON public.quiz_questions TO anon, authenticated;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quiz_question_options FROM anon, authenticated;
GRANT SELECT (id, question_id, option_text, sort_order, created_at)
    ON public.quiz_question_options TO anon, authenticated;

CREATE OR REPLACE VIEW public.quiz_options_public
WITH (security_invoker = true) AS
SELECT id, question_id, option_text, sort_order, created_at
  FROM public.quiz_question_options;

GRANT SELECT ON public.quiz_options_public TO anon, authenticated;

-- Defense-in-depth privilege revocations on admin-only / server-managed tables
REVOKE INSERT, UPDATE, DELETE ON public.supported_locales FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.applications FROM anon, authenticated;
REVOKE ALL ON public.application_notes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.courses FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.modules FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lessons FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_content_blocks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.exercises FROM anon, authenticated;
REVOKE ALL ON public.exercise_solutions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.exercise_test_cases FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quizzes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.enrollments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempt_answers FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.exercise_attempts FROM anon, authenticated;
REVOKE ALL ON public.platform_settings FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.rate_limit_events FROM anon, authenticated;

-- Allow authenticated admins to read admin-scoped tables under RLS
GRANT SELECT ON public.application_notes TO authenticated;
GRANT SELECT ON public.exercise_solutions TO authenticated;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.supported_locales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_solutions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_test_cases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_events     ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: RLS POLICIES (ALL SENSITIVE TABLES)
-- Note: Admin write mutations go via Vercel Functions (service_role) after
-- server-side JWT + DB role verification + Zod validation + Audit Logging.
-- ============================================================================

-- 1. supported_locales
CREATE POLICY "locales_public_read_active"
    ON public.supported_locales FOR SELECT
    TO anon, authenticated
    USING (is_active = true OR public.is_admin());

-- 2. profiles
CREATE POLICY "profiles_select_own_or_admin"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own_safe_fields"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() AND account_status <> 'archived')
    WITH CHECK (id = auth.uid() AND account_status <> 'archived');

-- 3. user_roles (students see only their own active roles; nobody writes directly)
CREATE POLICY "user_roles_select_own_or_admin"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING ((user_id = auth.uid() AND revoked_at IS NULL) OR public.is_admin());

-- 4. applications (users see ONLY their own application; prevents status enumeration)
CREATE POLICY "applications_select_own_or_admin"
    ON public.applications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- 5. application_notes (STRICTLY admin-only)
CREATE POLICY "application_notes_admin_select"
    ON public.application_notes FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 6. courses (published catalog visible to everyone; drafts/archived only to admins)
CREATE POLICY "courses_select_published_or_admin"
    ON public.courses FOR SELECT
    TO anon, authenticated
    USING (is_published = true OR public.is_admin());

-- 7. modules (only public+published OR active-enrolled OR admin)
CREATE POLICY "modules_select_accessible"
    ON public.modules FOR SELECT
    TO anon, authenticated
    USING (public.can_access_module(id));

-- 8. lessons (only accessible modules + published lesson OR admin)
CREATE POLICY "lessons_select_accessible"
    ON public.lessons FOR SELECT
    TO anon, authenticated
    USING (public.can_access_lesson(id));

-- 9. lesson_content_blocks
CREATE POLICY "lesson_blocks_select_accessible"
    ON public.lesson_content_blocks FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR (is_published = true AND public.can_access_lesson(lesson_id))
    );

-- 10. exercises
CREATE POLICY "exercises_select_accessible"
    ON public.exercises FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR (is_published = true AND public.can_access_lesson(lesson_id))
    );

-- 11. exercise_solutions (STRICTLY admin-only)
CREATE POLICY "exercise_solutions_admin_select"
    ON public.exercise_solutions FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 12. exercise_test_cases (hidden test cases are never directly readable by students)
CREATE POLICY "exercise_test_cases_select_accessible"
    ON public.exercise_test_cases FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR (
            is_hidden = false
            AND EXISTS (
                SELECT 1
                  FROM public.exercises e
                 WHERE e.id = exercise_id
                   AND e.is_published = true
                   AND public.can_access_lesson(e.lesson_id)
            )
        )
    );

-- 13. quizzes
CREATE POLICY "quizzes_select_accessible"
    ON public.quizzes FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR (is_published = true AND public.can_access_lesson(lesson_id))
    );

-- 14. quiz_questions (explanation column revoked at column-level above)
CREATE POLICY "quiz_questions_select_accessible"
    ON public.quiz_questions FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
              FROM public.quizzes q
             WHERE q.id = quiz_id
               AND q.is_published = true
               AND public.can_access_lesson(q.lesson_id)
        )
    );

-- 15. quiz_question_options (is_correct column revoked at column-level above)
CREATE POLICY "quiz_options_select_accessible"
    ON public.quiz_question_options FOR SELECT
    TO anon, authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
              FROM public.quiz_questions qq
              JOIN public.quizzes q ON q.id = qq.quiz_id
             WHERE qq.id = question_id
               AND q.is_published = true
               AND public.can_access_lesson(q.lesson_id)
        )
    );

-- 16. enrollments (student sees ONLY own rows; zero client writes)
CREATE POLICY "enrollments_select_own_or_admin"
    ON public.enrollments FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

-- 17. lesson_progress (only active enrolled student for own rows; admin read)
CREATE POLICY "lesson_progress_select_own_or_admin"
    ON public.lesson_progress FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "lesson_progress_insert_enrolled_student"
    ON public.lesson_progress FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND public.can_write_learning_for_lesson(lesson_id)
    );

CREATE POLICY "lesson_progress_update_enrolled_student"
    ON public.lesson_progress FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        AND public.can_write_learning_for_lesson(lesson_id)
    )
    WITH CHECK (
        student_id = auth.uid()
        AND public.can_write_learning_for_lesson(lesson_id)
    );

-- 18. exercise_attempts (append-only for active enrolled students; admin read)
CREATE POLICY "exercise_attempts_select_own_or_admin"
    ON public.exercise_attempts FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "exercise_attempts_insert_enrolled_student"
    ON public.exercise_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND EXISTS (
            SELECT 1
              FROM public.exercises e
             WHERE e.id = exercise_id
               AND e.is_published = true
               AND public.can_write_learning_for_lesson(e.lesson_id)
        )
    );

-- 19. quiz_attempts & quiz_attempt_answers (student read own; writes ONLY via submit_quiz_attempt RPC)
CREATE POLICY "quiz_attempts_select_own_or_admin"
    ON public.quiz_attempts FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "quiz_attempt_answers_select_own_or_admin"
    ON public.quiz_attempt_answers FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
              FROM public.quiz_attempts qa
             WHERE qa.id = attempt_id
               AND qa.student_id = auth.uid()
        )
    );

-- 20. platform_settings (direct table access STRICTLY admin-only; public reads use RPC)
CREATE POLICY "platform_settings_admin_select"
    ON public.platform_settings FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 21. audit_logs (read-only for admins; writes ONLY via service_role; immutable via trigger)
CREATE POLICY "audit_logs_admin_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 22. rate_limit_events: NO policies for anon or authenticated (default-deny; service_role only)

-- ============================================================================
-- SECTION 6: SUPABASE STORAGE BUCKET POLICIES
-- Buckets:
--   1. 'public-media'  (public = true): academy logo, course covers, public lesson images
--   2. 'lesson-media'  (public = false): restricted lesson images (served via signed URLs)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('public-media', 'public-media', true,  5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('lesson-media', 'lesson-media', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_public_media_read"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'public-media');

-- All media uploads/deletes and private 'lesson-media' signed URLs are handled
-- strictly server-side via Vercel Functions (service_role) after admin/enrollment checks.
