import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  PlayCircle,
  Users,
} from 'lucide-react';
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
import { usePlatformSettings } from '@/app/SettingsContext';
import { RegistrationInvitationCard } from '@/features/lessons/RegistrationInvitationCard';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDifficultyAz, formatDurationAz } from '@/lib/formatters';

interface CourseDetailData {
  course: Course;
  outline: CurriculumOutlineModule[];
  is_enrolled: boolean;
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = usePlatformSettings();
  const [data, setData] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    window.scrollTo({ top: 0 });
    setLoading(true);
    setError(null);
    setData(null);
    apiRequest<CourseDetailData>(`/api/public/courses/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Kurs tapılmadı.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (loading) return <Spinner fullPage label="Kurs məlumatları yüklənir..." />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <Alert variant="error">{error || 'Kurs tapılmadı.'}</Alert>
        <ButtonLink to="/courses" variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Kurslara qayıt
        </ButtonLink>
      </div>
    );
  }

  const { course, outline, is_enrolled } = data;
  const firstOpenLesson = outline.flatMap((m) => (m.can_access ? m.lessons : [])).find((l) => l.slug);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <Link
          to="/courses"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Bütün kurslar
        </Link>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{course.programming_language.toUpperCase()}</Badge>
            <Badge variant="neutral">{formatDifficultyAz(course.difficulty)}</Badge>
            {(course.public_module_count ?? 0) > 0 && (
              <Badge variant="amber">
                İlk {course.public_module_count} modul qeydiyyatsız pulsuzdur
              </Badge>
            )}
            {is_enrolled && <Badge variant="success">Hesabınıza təyin olunub</Badge>}
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold text-[#18181B] sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">{course.description}</p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#4338CA]" />
              {formatDurationAz(course.estimated_duration_minutes)}
            </span>
            {course.target_audience && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#4338CA]" />
                {course.target_audience}
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {is_enrolled ? (
              <ButtonLink to={`/dashboard/courses/${course.slug}`} variant="primary" size="lg">
                Tələbə Panelində aç
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            ) : firstOpenLesson?.slug ? (
              <ButtonLink
                to={`/courses/${course.slug}/lessons/${firstOpenLesson.slug}`}
                variant="primary"
                size="lg"
              >
                <PlayCircle className="h-4 w-4" />
                İlk pulsuz dərsə başla
              </ButtonLink>
            ) : null}

            {!is_enrolled && settings.registration_enabled && (
              <ButtonLink to="/register" variant="outline" size="lg">
                Tam kurs üçün müraciət et
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      {course.learning_objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle as="h2">Bu kursda nələri öyrənəcəksiniz?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {course.learning_objectives.map((obj, idx) => (
              <div key={`${idx}-${obj}`} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{obj}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#18181B]">Kurs Kurikulumu</h2>
          <p className="mt-1 text-sm text-zinc-600">
            İctimai modullar dərhal açıqdır; məhdud modullar administrator təsdiqindən və kurs
            təyinatından sonra açılır.
          </p>
        </div>

        <div className="space-y-4">
          {outline.map((mod) => (
            <Card key={mod.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                  {mod.is_public ? (
                    <Badge variant="amber">
                      <Globe className="h-3 w-3" />
                      Pulsuz / İctimai
                    </Badge>
                  ) : mod.can_access ? (
                    <Badge variant="success">Açıqdır</Badge>
                  ) : (
                    <Badge variant="neutral">
                      <Lock className="h-3 w-3" />
                      Təsdiqli tələbələr üçün
                    </Badge>
                  )}
                </div>
                {mod.description && <CardDescription>{mod.description}</CardDescription>}
              </CardHeader>
              <CardContent className="divide-y divide-zinc-100 pt-0">
                {mod.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {mod.can_access ? (
                        <PlayCircle className="h-4 w-4 shrink-0 text-[#4338CA]" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#18181B]">{lesson.title}</p>
                        <p className="text-xs text-zinc-500">{lesson.estimated_minutes} dəq</p>
                      </div>
                    </div>

                    {mod.can_access && lesson.slug ? (
                      <ButtonLink
                        to={
                          is_enrolled
                            ? `/dashboard/courses/${course.slug}/lessons/${lesson.slug}`
                            : `/courses/${course.slug}/lessons/${lesson.slug}`
                        }
                        variant="outline"
                        size="sm"
                      >
                        Oxu
                      </ButtonLink>
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">Kilidlidir</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {!is_enrolled && <RegistrationInvitationCard courseTitle={course.title} />}
    </div>
  );
}
