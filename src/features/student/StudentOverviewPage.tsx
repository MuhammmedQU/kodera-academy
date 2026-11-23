import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, CheckCircle2, PlayCircle } from 'lucide-react';
import type { StudentCourseWithProgress } from '@shared/types/domain';
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { apiRequest, ApiError } from '@/lib/apiClient';

export function StudentOverviewPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<StudentCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<StudentCourseWithProgress[]>('/api/student/courses', { signal: controller.signal })
      .then(setCourses)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Kurslar yüklənmədi.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) return <Spinner label="Tələbə paneliniz hazırlanır..." />;

  const totalCompleted = courses.reduce((sum, c) => sum + c.completed_lessons, 0);
  const totalLessons = courses.reduce((sum, c) => sum + c.total_lessons, 0);
  const resumeCourse = courses.find((c) => c.next_lesson_slug) ?? courses[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B] sm:text-3xl">
          Xoş gəldiniz, {user?.profile.full_name}!
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Burada yalnız administrator tərəfindən hesabınıza təyin olunmuş kurslar və şəxsi
          irəliləyişiniz görünür.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase">Təyinli kurslar</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{courses.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA]">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase">Tamamlanmış dərs</p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {totalCompleted} / {totalLessons}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase">Ümumi irəliləyiş</p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {totalLessons > 0 ? `${Math.round((totalCompleted / totalLessons) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {resumeCourse && resumeCourse.next_lesson_slug && (
        <Card className="border-[#4338CA]/30 bg-gradient-to-r from-[#EEF2FF] via-white to-white">
          <CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Badge variant="brand">Qaldığın yerdən davam et</Badge>
              <h2 className="font-display text-lg font-bold text-[#18181B]">
                {resumeCourse.course.title}
              </h2>
              <p className="text-sm text-zinc-600">
                Növbəti dərs: <strong>{resumeCourse.next_lesson_title}</strong>
              </p>
            </div>
            <ButtonLink
              to={`/dashboard/courses/${resumeCourse.course.slug}/lessons/${resumeCourse.next_lesson_slug}`}
              variant="primary"
            >
              <PlayCircle className="h-4 w-4" />
              Dərsə davam et
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Hələ hesabınıza kurs təyin olunmayıb"
          description="Hesabınız təsdiqlənib və aktivdir. Administrator sizə kurs təyin etdikdə kurslarınız burada görünəcək. Bu müddətdə ictimai pulsuz dərsləri oxuya bilərsiniz."
          action={
            <ButtonLink to="/courses" variant="outline">
              İctimai kurslara bax
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#18181B]">Mənim Kurslarım</h2>
            <Link
              to="/dashboard/courses"
              className="text-sm font-semibold text-[#4338CA] hover:underline"
            >
              Hamısına bax
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((item) => (
              <Card key={item.enrollment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="brand">
                      {item.course.programming_language.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-600">
                      {item.progress_percent}% tamamlandı
                    </span>
                  </div>
                  <CardTitle className="mt-1">{item.course.title}</CardTitle>
                  <CardDescription>
                    {item.completed_lessons} / {item.total_lessons} dərs tamamlanıb
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    role="progressbar"
                    aria-valuenow={item.progress_percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.course.title} irəliləyişi`}
                    className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
                  >
                    <div
                      className="h-full rounded-full bg-[#4338CA] transition-all"
                      style={{ width: `${item.progress_percent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink to={`/dashboard/courses/${item.course.slug}`} variant="outline" size="sm">
                      Kurikulum
                    </ButtonLink>
                    {item.next_lesson_slug && (
                      <ButtonLink
                        to={`/dashboard/courses/${item.course.slug}/lessons/${item.next_lesson_slug}`}
                        variant="primary"
                        size="sm"
                      >
                        Davam et
                        <ArrowRight className="h-4 w-4" />
                      </ButtonLink>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
