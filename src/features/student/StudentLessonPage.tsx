import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type { LessonViewPayload, PublicExercise } from '@shared/types/domain';
import { Alert, Badge, Button, Spinner } from '@/components/ui';
import { LessonContentRenderer } from '@/features/lessons/LessonContentRenderer';
import type { PythonRunOutcome } from '@/features/lessons/ExerciseBlock';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { runPythonExercise } from '@/features/python-runner/pythonRunner';

export function StudentLessonPage() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
  const [payload, setPayload] = useState<LessonViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const loadLesson = useCallback(async () => {
    if (!slug || !lessonSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LessonViewPayload>(
        `/api/student/courses/${slug}/lessons/${lessonSlug}`,
      );
      setPayload(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dərs yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [slug, lessonSlug]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const handleToggleCompleted = async () => {
    if (!payload) return;
    setSavingProgress(true);
    const nextStatus = payload.progress_status === 'completed' ? 'in_progress' : 'completed';
    try {
      await apiRequest(`/api/student/lessons/${payload.lesson.id}/progress`, {
        method: 'PUT',
        body: { status: nextStatus },
      });
      setPayload((prev) => (prev ? { ...prev, progress_status: nextStatus } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İrəliləyiş yenilənmədi.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRunPython = useCallback(
    async (code: string, exercise: PublicExercise): Promise<PythonRunOutcome> => {
      return runPythonExercise(code, exercise);
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
        <Link to="/dashboard/courses">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Mənim kurslarıma qayıt
          </Button>
        </Link>
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
      />

      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center">
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

      <nav
        aria-label="Dərs naviqasiyası"
        className="flex flex-wrap items-center justify-between gap-3 pt-2"
      >
        {payload.prev_lesson ? (
          <Link to={`/dashboard/courses/${payload.course.slug}/lessons/${payload.prev_lesson.slug}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Əvvəlki: {payload.prev_lesson.title}
            </Button>
          </Link>
        ) : (
          <span />
        )}

        {payload.next_lesson && (
          <Link to={`/dashboard/courses/${payload.course.slug}/lessons/${payload.next_lesson.slug}`}>
            <Button variant="primary">
              Növbəti: {payload.next_lesson.title}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </nav>
    </article>
  );
}
