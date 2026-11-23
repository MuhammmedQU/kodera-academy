import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type {
  ExerciseAttemptSummary,
  LessonViewPayload,
  PublicExercise,
  QuizAttemptResult,
} from '@shared/types/domain';
import { Alert, Badge, Button, ButtonLink, Spinner } from '@/components/ui';
import { LessonContentRenderer } from '@/features/lessons/LessonContentRenderer';
import type { PythonRunOutcome } from '@/features/lessons/ExerciseBlock';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { runPythonExercise } from '@/features/python-runner/pythonRunner';

export function StudentLessonPage() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
  const [payload, setPayload] = useState<LessonViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    if (!slug || !lessonSlug) return;
    const controller = new AbortController();
    window.scrollTo({ top: 0 });
    setLoading(true);
    setError(null);
    setProgressError(null);

    apiRequest<LessonViewPayload>(
      `/api/student/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`,
      { signal: controller.signal },
    )
      .then(setPayload)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Dərs yüklənmədi.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug, lessonSlug]);

  const handleToggleCompleted = async () => {
    if (!payload) return;
    setSavingProgress(true);
    setProgressError(null);
    const nextStatus = payload.progress_status === 'completed' ? 'in_progress' : 'completed';
    try {
      await apiRequest(`/api/student/lessons/${payload.lesson.id}/progress`, {
        method: 'PUT',
        body: { status: nextStatus },
      });
      setPayload((prev) => (prev ? { ...prev, progress_status: nextStatus } : prev));
    } catch (err) {
      setProgressError(err instanceof ApiError ? err.message : 'İrəliləyiş yenilənmədi.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRunPython = useCallback(
    async (
      code: string,
      exercise: PublicExercise,
      onStatus?: (stage: string) => void,
    ): Promise<PythonRunOutcome> => {
      return runPythonExercise(code, exercise, onStatus);
    },
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

  if (loading) return <Spinner label="Dərs yüklənir..." />;
  if (error || !payload) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Dərs açılmadı">
          {error || 'Bu dərsə giriş icazəniz yoxdur.'}
        </Alert>
        <ButtonLink to="/dashboard/courses" variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Mənim kurslarıma qayıt
        </ButtonLink>
      </div>
    );
  }

  const isCompleted = payload.progress_status === 'completed';

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={`/dashboard/courses/${payload.course.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {payload.course.title} / {payload.module.title}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">
              <Clock className="h-3 w-3" />
              {payload.lesson.estimated_minutes} dəq
            </Badge>
            {isCompleted && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                Tamamlanıb
              </Badge>
            )}
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
        canTrackStudentActions={true}
        previousQuizAttempts={payload.previous_quiz_attempts}
        previousExerciseAttempts={payload.previous_exercise_attempts}
        onRunPython={handleRunPython}
        onQuizSubmitted={handleQuizSubmitted}
        onExerciseAttemptSaved={handleExerciseAttemptSaved}
      />

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-sm font-bold text-[#18181B]">
              {isCompleted ? 'Bu dərsi tamamlamısınız!' : 'Dərsi bitirdiniz?'}
            </p>
            <p className="text-xs text-zinc-600">
              İrəliləyiş faizinizin yenilənməsi üçün dərsi tamamlandı kimi işarələyin.
            </p>
          </div>
          <Button
            variant={isCompleted ? 'outline' : 'primary'}
            isLoading={savingProgress}
            onClick={handleToggleCompleted}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Tamamlandı (geri al)' : 'Dərsi tamamlandı kimi işarələ'}
          </Button>
        </div>
        {progressError && <Alert variant="error">{progressError}</Alert>}
      </div>

      <nav
        aria-label="Dərs naviqasiyası"
        className="flex flex-wrap items-center justify-between gap-3 pt-2"
      >
        {payload.prev_lesson?.slug ? (
          <ButtonLink
            to={`/dashboard/courses/${payload.course.slug}/lessons/${payload.prev_lesson.slug}`}
            variant="outline"
            className="max-w-full"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Əvvəlki: {payload.prev_lesson.title}</span>
          </ButtonLink>
        ) : (
          <span />
        )}

        {payload.next_lesson?.slug && (
          <ButtonLink
            to={`/dashboard/courses/${payload.course.slug}/lessons/${payload.next_lesson.slug}`}
            variant="primary"
            className="max-w-full"
          >
            <span className="truncate">Növbəti: {payload.next_lesson.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </ButtonLink>
        )}
      </nav>
    </article>
  );
}
