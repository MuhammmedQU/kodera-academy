-- ============================================================================
-- Kodera Academy — Migration 0001: Extensions, ENUM Types, Locales, Utility Triggers
-- ============================================================================

-- 1. Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Domain ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('student', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'rejected', 'suspended', 'archived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_difficulty') THEN
        CREATE TYPE public.course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_block_type') THEN
        CREATE TYPE public.content_block_type AS ENUM (
            'heading',
            'paragraph',
            'image',
            'code',
            'explanation',
            'example',
            'note',
            'warning',
            'exercise',
            'quiz',
            'summary'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_execution_mode') THEN
        CREATE TYPE public.exercise_execution_mode AS ENUM ('pyodide_worker', 'static_review');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_question_type') THEN
        CREATE TYPE public.quiz_question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE public.enrollment_status AS ENUM ('active', 'revoked', 'completed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
        CREATE TYPE public.progress_status AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_status') THEN
        CREATE TYPE public.attempt_status AS ENUM ('passed', 'failed', 'error', 'timeout');
    END IF;
END
$$;

-- 3. Supported locales reference table (future multi-language expansion)
CREATE TABLE IF NOT EXISTS public.supported_locales (
    code        text PRIMARY KEY CHECK (code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    name        text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
    native_name text NOT NULL CHECK (char_length(btrim(native_name)) BETWEEN 2 AND 60),
    is_default  boolean NOT NULL DEFAULT false,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_supported_locales_single_default
    ON public.supported_locales (is_default)
    WHERE is_default = true;

INSERT INTO public.supported_locales (code, name, native_name, is_default, is_active)
VALUES
    ('az', 'Azerbaijani', 'Azərbaycan dili', true, true),
    ('en', 'English', 'English', false, false)
ON CONFLICT (code) DO NOTHING;

-- 4. Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
