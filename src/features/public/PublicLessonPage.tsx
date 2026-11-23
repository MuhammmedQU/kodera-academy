import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Globe, Lock } from 'lucide-react';
import type {
  ExerciseAttemptSummary,
  LessonViewPayload,
  PublicExercise,
  QuizAttemptResult,
} from '@shared/types/domain';
import { Alert, Badge, ButtonLink, Spinner } from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';
import { LessonContentRenderer } from '@/features/lessons/LessonContentRenderer';
import { RegistrationInvitationCard } from '@/features/lessons/RegistrationInvitationCard';
import type { PythonRunOutcome } from '@/features/lessons/ExerciseBlock';
import { runPythonExercise } from '@/features/python-runner/pythonRunner';
import { apiRequest, ApiError } from '@/lib/apiClient';

export function PublicLessonPage() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
  const { settings } = usePlatformSettings();
  const [payload, setPayload] = useState<LessonViewPayload | null>(null);
  const [restrictedInfo, setRestrictedInfo] = useState<{
    courseTitle?: string;
    moduleTitle?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !lessonSlug) return;
    const controller = new AbortController();
    window.scrollTo({ top: 0 });
    setLoading(true);
    setError(null);
    setRestrictedInfo(null);
    setPayload(null);

    apiRequest<LessonViewPayload>(
      `/api/public/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`,
      { signal: controller.signal },
    )
      .then(setPayload)
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 403 && err.code === 'LESSON_RESTRICTED') {
          const details = err.details as
            | { course_title?: string; module_title?: string }
            | undefined;
          setRestrictedInfo({
            courseTitle: details?.course_title,
            moduleTitle: details?.module_title,
          });
        } else {
          setError(err instanceof ApiError ? err.message : 'Dərs yüklənmədi.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug, lessonSlug]);

  const handleRunPython = useCallback(
    (
      code: string,
      exercise: PublicExercise,
      onStatus?: (stage: string) => void,
    ): Promise<PythonRunOutcome> => runPythonExercise(code, exercise, onStatus),
    [],
  );

  const handleQuizSubmitted = useCallback((quizId: string, result: QuizAttemptResult) => {
    setPayload((prev) => {
      if (!prev) return prev;
      const existing = prev.previous_quiz_attempts[quizId] ?? [];
      return {
        ...prev,
        previous_quiz_attempts: {
          ...prev.previous_quiz_attempts,
          [quizId]: [
            {
              id: result.attempt_id,
              student_id: '',
              quiz_id: quizId,
              attempt_number: result.attempt_number,
              earned_points: result.earned_points,
              total_points: result.total_points,
              score_percent: result.score_percent,
              is_passed: result.is_passed,
              submitted_at: new Date().toISOString(),
            },
            ...existing,
          ],
        },
      };
    });
  }, []);

  const handleExerciseAttemptSaved = useCallback(
    (exerciseId: string, attempt: ExerciseAttemptSummary) => {
      setPayload((prev) => {
        if (!prev) return prev;
        const existing = prev.previous_exercise_attempts[exerciseId] ?? [];
        return {
          ...prev,
          previous_exercise_attempts: {
            ...prev.previous_exercise_attempts,
            [exerciseId]: [attempt, ...existing],
          },
        };
      });
    },
    [],
  );

  if (loading) return <Spinner fullPage label="Dərs yüklənir..." />;

  if (restrictedInfo) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6">
        <Link
          to={`/courses/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kurs proqramına qayıt
        </Link>
        <RegistrationInvitationCard
          courseTitle={restrictedInfo.courseTitle}
          restrictedModuleTitle={restrictedInfo.moduleTitle}
        />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-14">
        <Alert variant="error">{error || 'Dərs tapılmadı.'}</Alert>
        <ButtonLink to="/courses" variant="outline">
          Kurslara qayıt
        </ButtonLink>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-3 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={`/courses/${payload.course.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {payload.course.title} • {payload.module.title}
          </Link>
          <div className="flex items-center gap-2">
            {payload.module.is_public && (
              <Badge variant="amber">
                <Globe className="h-3 w-3" />
                Pulsuz giriş dərsi
              </Badge>
            )}
            <Badge variant="neutral">
              <Clock className="h-3 w-3" />
              {payload.lesson.estimated_minutes} dəq
            </Badge>
          </div>
        </div>

        <h1 className="font-display text-2xl font-extrabold text-[#18181B] sm:text-3xl">
          {payload.lesson.title}
        </h1>
        {payload.lesson.summary && (
          <p className="text-sm leading-relaxed text-zinc-600">{payload.lesson.summary}</p>
        )}
      </div>

      <LessonContentRenderer
        blocks={payload.blocks}
        canTrackStudentActions={payload.is_enrolled}
        previousQuizAttempts={payload.previous_quiz_attempts}
        previousExerciseAttempts={payload.previous_exercise_attempts}
        onRunPython={handleRunPython}
        onQuizSubmitted={handleQuizSubmitted}
        onExerciseAttemptSaved={handleExerciseAttemptSaved}
      />

      {payload.is_last_public_lesson && (
        <div className="pt-4">
          <RegistrationInvitationCard courseTitle={payload.course.title} />
        </div>
      )}

      <nav
        aria-label="İctimai dərs naviqasiyası"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6"
      >
        {payload.prev_lesson && !payload.prev_lesson.is_locked && payload.prev_lesson.slug ? (
          <ButtonLink
            to={`/courses/${payload.course.slug}/lessons/${payload.prev_lesson.slug}`}
            variant="outline"
            className="max-w-full"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Əvvəlki: {payload.prev_lesson.title}</span>
          </ButtonLink>
        ) : (
          <ButtonLink to={`/courses/${payload.course.slug}`} variant="ghost">
            Kurs proqramı
          </ButtonLink>
        )}

        {payload.next_lesson && !payload.next_lesson.is_locked && payload.next_lesson.slug ? (
          <ButtonLink
            to={`/courses/${payload.course.slug}/lessons/${payload.next_lesson.slug}`}
            variant="primary"
            className="max-w-full"
          >
            <span className="truncate">Növbəti: {payload.next_lesson.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </ButtonLink>
        ) : payload.next_lesson?.is_locked && settings.registration_enabled ? (
          <ButtonLink to="/register" variant="accent">
            <Lock className="h-4 w-4 shrink-0" />
            Növbəti modul üçün qeydiyyat et
          </ButtonLink>
        ) : null}
      </nav>
    </article>
  );
}
