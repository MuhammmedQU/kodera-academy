import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react';
import type { Course, CurriculumOutlineModule } from '@shared/types/domain';
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';

interface CourseDetailPayload {
  course: Course;
  outline: CurriculumOutlineModule[];
  is_enrolled: boolean;
}

export function StudentCourseCurriculumPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CourseDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    apiRequest<CourseDetailPayload>(`/api/student/courses/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Bu kursa giriş icazəniz yoxdur.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (loading) return <Spinner label="Kurs kurikulumu yüklənir..." />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Giriş məhdudiyyəti">
          {error || 'Kurs tapılmadı.'}
        </Alert>
        <ButtonLink to="/dashboard/courses" variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Mənim kurslarıma qayıt
        </ButtonLink>
      </div>
    );
  }

  const allLessons = data.outline.flatMap((m) => m.lessons);
  const completedCount = allLessons.filter((l) => l.progress_status === 'completed').length;
  const percent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/courses"
          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Mənim kurslarım
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B] sm:text-3xl">
          {data.course.title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600">{data.course.description}</p>
      </div>

      <Card>
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#18181B]">Kurs üzrə irəliləyişiniz</span>
            <span className="font-bold text-[#4338CA]">
              {completedCount} / {allLessons.length} dərs ({percent}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${data.course.title} üzrə irəliləyiş`}
            className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"
          >
            <div className="h-full rounded-full bg-[#4338CA]" style={{ width: `${percent}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data.outline.map((mod) => (
          <Card key={mod.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle as="h2">{mod.title}</CardTitle>
                <Badge variant={mod.is_public ? 'amber' : 'brand'}>
                  {mod.is_public ? 'Giriş modulu' : 'Əsas modul'}
                </Badge>
              </div>
              {mod.description && <CardDescription>{mod.description}</CardDescription>}
            </CardHeader>
            <CardContent className="divide-y divide-zinc-100 pt-0">
              {mod.lessons.map((lesson) => {
                const isDone = lesson.progress_status === 'completed';
                return (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#18181B]">{lesson.title}</p>
                        <p className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {lesson.estimated_minutes} dəq
                        </p>
                      </div>
                    </div>

                    {lesson.slug && (
                      <ButtonLink
                        to={`/dashboard/courses/${data.course.slug}/lessons/${lesson.slug}`}
                        variant={isDone ? 'outline' : 'primary'}
                        size="sm"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {isDone ? 'Təkrar bax' : 'Dərsi aç'}
                      </ButtonLink>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
