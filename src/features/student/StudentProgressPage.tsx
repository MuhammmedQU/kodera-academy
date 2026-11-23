import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Code2 } from 'lucide-react';
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
import { formatDateAz } from '@/lib/formatters';

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
    apiRequest<ProgressPayload>('/api/student/progress')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'İrəliləyiş yüklənmədi.'))
      .finally(() => setLoading(false));
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
            <CardTitle className="flex items-center gap-2 text-base">
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
                    className="flex items-center justify-between rounded-xl bg-[#FAFAF9] p-3 text-sm"
                  >
                    <div>
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
            <CardTitle className="flex items-center gap-2 text-base">
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
                    className="flex items-center justify-between rounded-xl bg-[#FAFAF9] p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#18181B]">
                        Testlər: {att.passed_tests} / {att.total_tests}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDateAz(att.created_at)}</p>
                    </div>
                    <Badge variant={att.status === 'passed' ? 'success' : 'danger'}>
                      {att.status}
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
