-- ============================================================================
-- KODERA LMS — Migration 0004: Enrollments, Lesson Progress & Student Attempts
-- Phase 2 Draft (DO NOT execute on live Supabase before owner approval)
-- ============================================================================

-- 1. Course enrollments (strictly separated from application approval)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id     uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    status        public.enrollment_status NOT NULL DEFAULT 'active',
    assigned_by   uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at   timestamptz NOT NULL DEFAULT now(),
    revoked_by    uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    revoked_at    timestamptz NULL,
    revoke_reason text NULL CHECK (revoke_reason IS NULL OR char_length(revoke_reason) <= 500),
    completed_at  timestamptz NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollments_student_course UNIQUE (student_id, course_id),
    CONSTRAINT chk_enrollments_status_consistency CHECK (
        (status = 'revoked' AND revoked_at IS NOT NULL)
        OR (status = 'completed' AND completed_at IS NOT NULL AND revoked_at IS NULL)
        OR (status = 'active' AND revoked_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_active
    ON public.enrollments (student_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_active
    ON public.enrollments (course_id, status);

CREATE TRIGGER trg_enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 2. Student lesson progress (indexed per student & course for fast dashboards)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id        uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    lesson_id        uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status           public.progress_status NOT NULL DEFAULT 'in_progress',
    started_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz NULL,
    last_accessed_at timestamptz NOT NULL DEFAULT now(),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_lesson_progress_student_lesson UNIQUE (student_id, lesson_id),
    CONSTRAINT chk_lesson_progress_completed_consistency CHECK (
        (status = 'completed' AND completed_at IS NOT NULL)
        OR (status <> 'completed' AND completed_at IS NULL)
    )
);

-- Automatically derive and enforce course_id from lesson_id -> modules.course_id
CREATE OR REPLACE FUNCTION public.sync_lesson_progress_course_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at := now();
    ELSIF NEW.status <> 'completed' THEN
        NEW.completed_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_lesson_progress_course_id() FROM PUBLIC;

CREATE TRIGGER trg_lesson_progress_sync_course
    BEFORE INSERT OR UPDATE ON public.lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_lesson_progress_course_id();

CREATE TRIGGER trg_lesson_progress_updated_at
    BEFORE UPDATE ON public.lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_course_status
    ON public.lesson_progress (student_id, course_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_last_accessed
    ON public.lesson_progress (student_id, last_accessed_at DESC);

-- 3. Student exercise attempts (coding practice history)
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id       uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    submitted_code    text NOT NULL CHECK (char_length(submitted_code) <= 50000),
    status            public.attempt_status NOT NULL,
    passed_tests      integer NOT NULL DEFAULT 0 CHECK (passed_tests >= 0),
    total_tests       integer NOT NULL DEFAULT 0 CHECK (total_tests >= 0 AND passed_tests <= total_tests),
    stdout            text NULL CHECK (stdout IS NULL OR char_length(stdout) <= 20000),
    stderr            text NULL CHECK (stderr IS NULL OR char_length(stderr) <= 20000),
    execution_time_ms integer NULL CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0),
    test_results      jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(test_results) = 'array'),
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_student_exercise
    ON public.exercise_attempts (student_id, exercise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_status
    ON public.exercise_attempts (exercise_id, status);

-- 4. Student quiz attempts (written exclusively via server-side grading)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id        uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    attempt_number integer NOT NULL CHECK (attempt_number > 0),
    earned_points  integer NOT NULL DEFAULT 0 CHECK (earned_points >= 0),
    total_points   integer NOT NULL CHECK (total_points > 0 AND earned_points <= total_points),
    score_percent  numeric(5,2) NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
    is_passed      boolean NOT NULL DEFAULT false,
    submitted_at   timestamptz NOT NULL DEFAULT now(),
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_quiz_attempts_student_quiz_num UNIQUE (student_id, quiz_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_quiz
    ON public.quiz_attempts (student_id, quiz_id, submitted_at DESC);

-- 5. Per-question student quiz answers
CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id          uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id         uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option_ids uuid[] NOT NULL DEFAULT '{}',
    is_correct          boolean NOT NULL,
    points_awarded      integer NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_quiz_attempt_answers_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id
    ON public.quiz_attempt_answers (attempt_id);
