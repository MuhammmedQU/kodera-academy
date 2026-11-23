import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Globe, Lock } from 'lucide-react';
import type { LessonViewPayload, PublicExercise } from '@shared/types/domain';
import { Alert, Badge, Button, Spinner } from '@/components/ui';
import { LessonContentRenderer } from '@/features/lessons/LessonContentRenderer';
import { RegistrationInvitationCard } from '@/features/lessons/RegistrationInvitationCard';
import type { PythonRunOutcome } from '@/features/lessons/ExerciseBlock';
import { runPythonExercise } from '@/features/python-runner/pythonRunner';
import { apiRequest, ApiError } from '@/lib/apiClient';

export function PublicLessonPage() {
  const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
  const [payload, setPayload] = useState<LessonViewPayload | null>(null);
  const [restrictedInfo, setRestrictedInfo] = useState<{
    courseTitle?: string;
    moduleTitle?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !lessonSlug) return;
    setLoading(true);
    setError(null);
    setRestrictedInfo(null);

    apiRequest<LessonViewPayload>(`/api/public/courses/${slug}/lessons/${lessonSlug}`)
      .then(setPayload)
      .catch((err) => {
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
      .finally(() => setLoading(false));
  }, [slug, lessonSlug]);

  const handleRunPython = useCallback(
    (code: string, exercise: PublicExercise): Promise<PythonRunOutcome> =>
      runPythonExercise(code, exercise),
    [],
  );

  if (loading) return <Spinner fullPage label="Dərs yüklənir..." />;

  if (restrictedInfo) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-6">
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
      <div className="mx-auto max-w-3xl px-4 py-14 space-y-4">
        <Alert variant="error">{error || 'Dərs tapılmadı.'}</Alert>
        <Link to="/courses">
          <Button variant="outline">Kurslara qayıt</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
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
        {payload.prev_lesson && !payload.prev_lesson.is_locked ? (
          <Link to={`/courses/${payload.course.slug}/lessons/${payload.prev_lesson.slug}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Əvvəlki: {payload.prev_lesson.title}
            </Button>
          </Link>
        ) : (
          <Link to={`/courses/${payload.course.slug}`}>
            <Button variant="ghost">Kurs proqramı</Button>
          </Link>
        )}

        {payload.next_lesson && !payload.next_lesson.is_locked ? (
          <Link to={`/courses/${payload.course.slug}/lessons/${payload.next_lesson.slug}`}>
            <Button variant="primary">
              Növbəti: {payload.next_lesson.title}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : payload.next_lesson?.is_locked ? (
          <Link to="/register">
            <Button variant="accent">
              <Lock className="h-4 w-4" />
              Növbəti modul üçün qeydiyyat et
            </Button>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
