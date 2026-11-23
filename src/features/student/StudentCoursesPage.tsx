import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { StudentCourseWithProgress } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDifficultyAz, formatDurationAz } from '@/lib/formatters';

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<StudentCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<StudentCourseWithProgress[]>('/api/student/courses')
      .then(setCourses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Kurslar yüklənmədi.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Təyin olunmuş kurslarınız yüklənir..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Mənim Kurslarım</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Yalnız administrator tərəfindən hesabınıza təyin edilmiş kurslar burada göstərilir.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Təyin olunmuş kurs yoxdur"
          description="Administrator sizə kurs təyin etdikdən dərhal sonra bu siyahıda görünəcək."
          action={
            <Link to="/courses">
              <Button variant="outline">Kurs kataloquna bax</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((item) => (
            <Card key={item.enrollment.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand">{item.course.programming_language.toUpperCase()}</Badge>
                  <Badge variant="neutral">{formatDifficultyAz(item.course.difficulty)}</Badge>
                </div>
                <CardTitle className="mt-2">{item.course.title}</CardTitle>
                <CardDescription>
                  {item.course.subtitle || item.course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>
                    {item.completed_lessons} / {item.total_lessons} dərs tamamlanıb
                  </span>
                  <span>{formatDurationAz(item.course.estimated_duration_minutes)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[#4338CA]"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/dashboard/courses/${item.course.slug}`} className="flex-1">
                    <Button variant="primary" className="w-full">
                      Kursu aç
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
