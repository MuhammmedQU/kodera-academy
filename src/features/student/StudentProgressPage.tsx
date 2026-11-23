import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, Code2 } from 'lucide-react';
import type {
  ExerciseAttemptSummary,
  QuizAttemptSummary,
  StudentCourseWithProgress,
} from '@shared/types/domain';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatAttemptStatusAz, formatDateAz } from '@/lib/formatters';

interface ProgressPayload {
  courses: StudentCourseWithProgress[];
  completed_lessons: Array<{
    lesson_id: string;
    lesson_title: string;
    lesson_slug: string;
    course_slug: string;
    course_title: string;
    completed_at: string;
  }>;
  quiz_attempts: QuizAttemptSummary[];
  exercise_attempts: ExerciseAttemptSummary[];
}

export function StudentProgressPage() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ProgressPayload>('/api/student/progress', { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'İrəliləyiş yüklənmədi.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) return <Spinner label="İrəliləyiş məlumatları yüklənir..." />;
  if (error || !data) return <Alert variant="error">{error || 'Məlumat tapılmadı.'}</Alert>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
          Öyrənmə İrəliləyişi və Nəticələr
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tamamlanmış dərsləriniz, quiz ballarınız və praktik məşq cəhdlərinizin tam tarixçəsi.
        </p>
      </div>

      {data.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-[#4338CA]" />
              Kurslar üzrə ümumi irəliləyiş ({data.courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.courses.map((item) => (
              <div key={item.enrollment.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link
                    to={`/dashboard/courses/${item.course.slug}`}
                    className="font-semibold text-[#18181B] hover:text-[#4338CA]"
                  >
                    {item.course.title}
                  </Link>
                  <span className="text-xs font-semibold text-[#4338CA]">
                    {item.completed_lessons} / {item.total_lessons} dərs ({item.progress_percent}%)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={item.progress_percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.course.title} irəliləyişi`}
                  className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
                >
                  <div
                    className="h-full rounded-full bg-[#4338CA]"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Tamamlanmış Dərslər ({data.completed_lessons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.completed_lessons.length === 0 ? (
            <p className="text-sm text-zinc-500">Hələ tamamlanmış dərs yoxdur.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.completed_lessons.map((item) => (
                <div
                  key={item.lesson_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <Link
                      to={`/dashboard/courses/${item.course_slug}/lessons/${item.lesson_slug}`}
                      className="font-semibold text-[#18181B] hover:text-[#4338CA]"
                    >
                      {item.lesson_title}
                    </Link>
                    <p className="text-xs text-zinc-500">{item.course_title}</p>
                  </div>
                  <span className="text-xs text-zinc-400">{formatDateAz(item.completed_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-[#4338CA]" />
              Quiz Nəticələri ({data.quiz_attempts.length})
            </CardTitle>
            <CardDescription>Server tərəfindən qiymətləndirilmiş cəhdlər</CardDescription>
          </CardHeader>
          <CardContent>
            {data.quiz_attempts.length === 0 ? (
              <p className="text-sm text-zinc-500">Hələ quiz cəhdiniz yoxdur.</p>
            ) : (
              <div className="space-y-2.5">
                {data.quiz_attempts.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FAFAF9] p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#18181B]">
                        {att.quiz_title || 'Quiz'} (Cəhd #{att.attempt_number})
                      </p>
                      <p className="text-xs text-zinc-500">{formatDateAz(att.submitted_at)}</p>
                    </div>
                    <Badge variant={att.is_passed ? 'success' : 'amber'}>
                      {att.score_percent}% ({att.earned_points}/{att.total_points})
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-base">
              <Code2 className="h-5 w-5 text-[#F59E0B]" />
              Məşq Cəhdləri ({data.exercise_attempts.length})
            </CardTitle>
            <CardDescription>Brauzer Python icrası nəticələri</CardDescription>
          </CardHeader>
          <CardContent>
            {data.exercise_attempts.length === 0 ? (
              <p className="text-sm text-zinc-500">Hələ məşq cəhdiniz yoxdur.</p>
            ) : (
              <div className="space-y-2.5">
                {data.exercise_attempts.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FAFAF9] p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#18181B]">
                        {att.exercise_title || 'Praktik məşq'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Testlər: {att.passed_tests} / {att.total_tests} •{' '}
                        {formatDateAz(att.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        att.status === 'passed'
                          ? 'success'
                          : att.status === 'timeout'
                            ? 'amber'
                            : 'danger'
                      }
                    >
                      {formatAttemptStatusAz(att.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
