import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Layers } from 'lucide-react';
import type { Course } from '@shared/types/domain';
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
  Input,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDifficultyAz, formatDurationAz } from '@/lib/formatters';

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Course[]>('/api/public/courses', { auth: false })
      .then(setCourses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Kurslar yüklənmədi.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.programming_language.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <Badge variant="brand">Kurs Kataloqu</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#18181B] sm:text-4xl">
          Bütün Proqramlaşdırma Kursları
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          Kursların proqramını, öyrənmə məqsədlərini və pulsuz giriş modullarını qeydiyyatsız kəşf
          edin.
        </p>
      </div>

      <div className="mt-6 max-w-md">
        <Input
          placeholder="Kurs adı və ya dil (Python, SQL...) üzrə axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Kurs axtarışı"
        />
      </div>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <Spinner label="Kurslar yüklənir..." />
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Uyğun kurs tapılmadı"
            description="Axtarış sözünü dəyişərək yenidən yoxlaya bilərsiniz."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filtered.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{course.programming_language.toUpperCase()}</Badge>
                  <Badge variant="neutral">{formatDifficultyAz(course.difficulty)}</Badge>
                  {(course.public_module_count ?? 0) > 0 && (
                    <Badge variant="amber">
                      İlk {course.public_module_count} modul pulsuz
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-xl">{course.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {course.subtitle || course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
                  {course.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {course.total_module_count ?? 0} modul / {course.total_lesson_count ?? 0} dərs
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDurationAz(course.estimated_duration_minutes)}
                  </span>
                </div>
                <Link to={`/courses/${course.slug}`}>
                  <Button variant="primary" className="w-full">
                    Detallara və kurikuluma bax
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
