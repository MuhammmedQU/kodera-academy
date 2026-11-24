-- ============================================================================
-- Kodera Academy — Migration 0003: Courses, Modules, Lessons, 11 Content Blocks,
--                                  Exercises & Quizzes
-- ============================================================================

-- 1. Courses (multi-course architecture: Python first, C++/SQL/JS/AI ready)
CREATE TABLE IF NOT EXISTS public.courses (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                       text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    locale                     text NOT NULL DEFAULT 'az' REFERENCES public.supported_locales(code),
    title                      text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
    subtitle                   text NULL CHECK (subtitle IS NULL OR char_length(subtitle) <= 280),
    description                text NOT NULL CHECK (char_length(btrim(description)) >= 10),
    learning_objectives        jsonb NOT NULL DEFAULT '[]'::jsonb
                               CHECK (jsonb_typeof(learning_objectives) = 'array'),
    target_audience            text NULL CHECK (target_audience IS NULL OR char_length(target_audience) <= 1000),
    programming_language       text NOT NULL DEFAULT 'python'
                               CHECK (programming_language ~ '^[a-z0-9_+-]{1,40}$'),
    difficulty                 public.course_difficulty NOT NULL DEFAULT 'beginner',
    estimated_duration_minutes integer NOT NULL DEFAULT 0 CHECK (estimated_duration_minutes >= 0),
    cover_image_path           text NULL CHECK (cover_image_path IS NULL OR char_length(cover_image_path) <= 500),
    sort_order                 integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    status                     public.content_status NOT NULL DEFAULT 'draft',
    is_published               boolean GENERATED ALWAYS AS (status = 'published') STORED,
    published_at               timestamptz NULL,
    archived_at                timestamptz NULL,
    created_by                 uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by                 uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_courses_archive_consistency CHECK (
        (status = 'archived' AND archived_at IS NOT NULL)
        OR (status <> 'archived' AND archived_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_courses_published_sort
    ON public.courses (sort_order ASC, created_at DESC)
    WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_courses_locale_status
    ON public.courses (locale, status);

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 2. Modules (DB-driven public vs restricted access via is_public + status)
CREATE TABLE IF NOT EXISTS public.modules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    slug        text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    title       text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
    description text NULL CHECK (description IS NULL OR char_length(description) <= 1000),
    sort_order  integer NOT NULL CHECK (sort_order >= 0),
    is_public   boolean NOT NULL DEFAULT false,
    status      public.content_status NOT NULL DEFAULT 'draft',
    is_published boolean GENERATED ALWAYS AS (status = 'published') STORED,
    archived_at timestamptz NULL,
    created_by  uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by  uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_modules_course_slug UNIQUE (course_id, slug),
    CONSTRAINT chk_modules_archive_consistency CHECK (
        (status = 'archived' AND archived_at IS NOT NULL)
        OR (status <> 'archived' AND archived_at IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_active_sort_order
    ON public.modules (course_id, sort_order)
    WHERE status <> 'archived';

CREATE INDEX IF NOT EXISTS idx_modules_course_public_published
    ON public.modules (course_id, sort_order ASC)
    WHERE is_published = true;

CREATE TRIGGER trg_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 3. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id         uuid NOT NULL REFERENCES public.modules(id) ON DELETE RESTRICT,
    slug              text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    title             text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 180),
    summary           text NULL CHECK (summary IS NULL OR char_length(summary) <= 1000),
    estimated_minutes integer NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 1 AND 300),
    sort_order        integer NOT NULL CHECK (sort_order >= 0),
    status            public.content_status NOT NULL DEFAULT 'draft',
    is_published      boolean GENERATED ALWAYS AS (status = 'published') STORED,
    published_at      timestamptz NULL,
    archived_at       timestamptz NULL,
    created_by        uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by        uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_lessons_module_slug UNIQUE (module_id, slug),
    CONSTRAINT chk_lessons_archive_consistency CHECK (
        (status = 'archived' AND archived_at IS NOT NULL)
        OR (status <> 'archived' AND archived_at IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lessons_active_sort_order
    ON public.lessons (module_id, sort_order)
    WHERE status <> 'archived';

CREATE INDEX IF NOT EXISTS idx_lessons_module_published_sort
    ON public.lessons (module_id, sort_order ASC)
    WHERE is_published = true;

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. Exercises (interactive coding practice, Pyodide Web Worker ready)
CREATE TABLE IF NOT EXISTS public.exercises (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id            uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    locale               text NOT NULL DEFAULT 'az' REFERENCES public.supported_locales(code),
    title                text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 180),
    instructions         text NOT NULL CHECK (char_length(btrim(instructions)) >= 5),
    programming_language text NOT NULL DEFAULT 'python'
                         CHECK (programming_language ~ '^[a-z0-9_+-]{1,40}$'),
    starter_code         text NOT NULL DEFAULT '',
    hints                jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(hints) = 'array'),
    execution_mode       public.exercise_execution_mode NOT NULL DEFAULT 'pyodide_worker',
    time_limit_ms        integer NOT NULL DEFAULT 3000 CHECK (time_limit_ms BETWEEN 500 AND 15000),
    max_output_chars     integer NOT NULL DEFAULT 10000 CHECK (max_output_chars BETWEEN 256 AND 50000),
    sort_order           integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    status               public.content_status NOT NULL DEFAULT 'published',
    is_published         boolean GENERATED ALWAYS AS (status = 'published') STORED,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_lesson_locale
    ON public.exercises (lesson_id, locale, sort_order ASC);

CREATE TRIGGER trg_exercises_updated_at
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4b. Admin-only reference solutions for exercises (never directly exposed to students)
CREATE TABLE IF NOT EXISTS public.exercise_solutions (
    exercise_id   uuid PRIMARY KEY REFERENCES public.exercises(id) ON DELETE CASCADE,
    solution_code text NOT NULL,
    explanation   text NULL,
    updated_by    uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_exercise_solutions_updated_at
    BEFORE UPDATE ON public.exercise_solutions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4c. Predefined test cases for exercises
CREATE TABLE IF NOT EXISTS public.exercise_test_cases (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id     uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    label           text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 160),
    stdin_input     text NOT NULL DEFAULT '',
    expected_stdout text NULL,
    assertion_code  text NULL,
    is_hidden       boolean NOT NULL DEFAULT false,
    sort_order      integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_exercise_test_has_verifier CHECK (
        expected_stdout IS NOT NULL OR assertion_code IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_exercise_test_cases_exercise_sort
    ON public.exercise_test_cases (exercise_id, sort_order ASC);

-- 5. Quizzes & Questions & Options
CREATE TABLE IF NOT EXISTS public.quizzes (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id             uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    locale                text NOT NULL DEFAULT 'az' REFERENCES public.supported_locales(code),
    title                 text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 180),
    description           text NULL CHECK (description IS NULL OR char_length(description) <= 1000),
    passing_score_percent integer NOT NULL DEFAULT 70 CHECK (passing_score_percent BETWEEN 0 AND 100),
    max_attempts          integer NULL CHECK (max_attempts IS NULL OR max_attempts > 0),
    status                public.content_status NOT NULL DEFAULT 'published',
    is_published          boolean GENERATED ALWAYS AS (status = 'published') STORED,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_locale
    ON public.quizzes (lesson_id, locale);

CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_type public.quiz_question_type NOT NULL DEFAULT 'single_choice',
    prompt        text NOT NULL CHECK (char_length(btrim(prompt)) >= 3),
    code_snippet  text NULL,
    code_language text NULL CHECK (code_language IS NULL OR code_language ~ '^[a-z0-9_+-]{1,40}$'),
    explanation   text NULL,
    points        integer NOT NULL DEFAULT 1 CHECK (points > 0),
    sort_order    integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_sort
    ON public.quiz_questions (quiz_id, sort_order ASC);

CREATE TRIGGER trg_quiz_questions_updated_at
    BEFORE UPDATE ON public.quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Note: is_correct is restricted at column-level in Migration 0006 so students cannot read answer keys
CREATE TABLE IF NOT EXISTS public.quiz_question_options (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL CHECK (char_length(btrim(option_text)) >= 1),
    is_correct  boolean NOT NULL DEFAULT false,
    sort_order  integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_options_question_sort
    ON public.quiz_question_options (question_id, sort_order ASC);

-- 6. Structured lesson content blocks (supports all 11 block types in strict order)
CREATE TABLE IF NOT EXISTS public.lesson_content_blocks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    locale       text NOT NULL DEFAULT 'az' REFERENCES public.supported_locales(code),
    block_type   public.content_block_type NOT NULL,
    sort_order   integer NOT NULL CHECK (sort_order >= 0),
    title        text NULL CHECK (title IS NULL OR char_length(title) <= 180),
    content      jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
    exercise_id  uuid NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    quiz_id      uuid NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
    is_published boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_lesson_blocks_order UNIQUE (lesson_id, locale, sort_order) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT chk_lesson_blocks_reference_integrity CHECK (
        (block_type = 'exercise' AND exercise_id IS NOT NULL AND quiz_id IS NULL)
        OR (block_type = 'quiz' AND quiz_id IS NOT NULL AND exercise_id IS NULL)
        OR (block_type NOT IN ('exercise', 'quiz') AND exercise_id IS NULL AND quiz_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_locale_sort
    ON public.lesson_content_blocks (lesson_id, locale, sort_order ASC)
    WHERE is_published = true;

CREATE TRIGGER trg_lesson_content_blocks_updated_at
    BEFORE UPDATE ON public.lesson_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
