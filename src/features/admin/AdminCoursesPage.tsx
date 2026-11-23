import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, BookOpen, Eye, EyeOff, FolderKanban, Plus } from 'lucide-react';
import type { ContentStatus, Course, CourseDifficulty } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatContentStatusAz, formatDifficultyAz, formatDurationAz } from '@/lib/formatters';

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    programming_language: 'python',
    difficulty: 'beginner' as CourseDifficulty,
    estimated_duration_minutes: 300,
    objectivesText: '',
    status: 'draft' as ContentStatus,
  });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Course[]>('/api/admin/courses');
      setCourses(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kurslar yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const objectives = form.objectivesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length >= 2);

      await apiRequest('/api/admin/courses', {
        method: 'POST',
        body: {
          title: form.title,
          slug: form.slug,
          locale: 'az',
          subtitle: form.subtitle || null,
          description: form.description,
          learning_objectives: objectives,
          programming_language: form.programming_language,
          difficulty: form.difficulty,
          estimated_duration_minutes: Number(form.estimated_duration_minutes) || 0,
          sort_order: courses.length + 1,
          status: form.status,
        },
      });
      setModalOpen(false);
      setForm({
        title: '',
        slug: '',
        subtitle: '',
        description: '',
        programming_language: 'python',
        difficulty: 'beginner',
        estimated_duration_minutes: 300,
        objectivesText: '',
        status: 'draft',
      });
      setFeedback('Yeni kurs yaradıldı. İndi modullarını və dərslərini əlavə edə bilərsiniz.');
      await loadCourses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kurs yaradılmadı.');
    } finally {
      setBusy(false);
    }
  };

  const updateCourseStatus = async (course: Course, status: ContentStatus) => {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        body: { status },
      });
      setFeedback(`"${course.title}" statusu yeniləndi: ${formatContentStatusAz(status)}.`);
      await loadCourses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status yenilənmədi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
            Kurs İdarəetməsi (Çoxkurslu CMS)
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kod dəyişmədən Python, C++, SQL, JavaScript, Web, DSA və AI kurslarını yaradın və idarə
            edin.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Yeni kurs yarat
        </Button>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <Spinner label="Kurslar yüklənir..." />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Hələ kurs yaradılmayıb"
          description="İlk kursu yaratmaq üçün yuxarıdakı düyməyə klikləyin."
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-[#18181B]">
                      {course.title}
                    </h3>
                    <Badge
                      variant={
                        course.status === 'published'
                          ? 'success'
                          : course.status === 'archived'
                            ? 'neutral'
                            : 'amber'
                      }
                    >
                      {formatContentStatusAz(course.status)}
                    </Badge>
                    <Badge variant="brand">{course.programming_language.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-zinc-600">{course.subtitle || course.description}</p>
                  <p className="text-xs text-zinc-500">
                    Slug: <code>/{course.slug}</code> • {formatDifficultyAz(course.difficulty)} •{' '}
                    {formatDurationAz(course.estimated_duration_minutes)} • Modullar:{' '}
                    {course.total_module_count ?? 0} (İctimai: {course.public_module_count ?? 0})
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/courses/${course.id}/modules`}>
                    <Button variant="primary" size="sm">
                      <FolderKanban className="h-4 w-4" />
                      Modullar
                    </Button>
                  </Link>
                  {course.status !== 'published' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => updateCourseStatus(course, 'published')}
                    >
                      <Eye className="h-4 w-4" />
                      Dərc et
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => updateCourseStatus(course, 'draft')}
                    >
                      <EyeOff className="h-4 w-4" />
                      Qaralama et
                    </Button>
                  )}
                  {course.status !== 'archived' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => updateCourseStatus(course, 'archived')}
                    >
                      <Archive className="h-4 w-4" />
                      Arxivlə
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni kurs yarat"
        description="Kurs istənilən proqramlaşdırma dili üçün yaradıla bilər."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Kursun adı"
            required
            placeholder="Məs., C++ Proqramlaşdırma Əsasları"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug:
                  prev.slug ||
                  title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, ''),
              }));
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="URL Slug"
              required
              placeholder="cpp-esaslari"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
            <Select
              label="Proqramlaşdırma dili / Sahə"
              value={form.programming_language}
              onChange={(e) => setForm((p) => ({ ...p, programming_language: e.target.value }))}
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="sql">SQL</option>
              <option value="javascript">JavaScript</option>
              <option value="web">Web Development</option>
              <option value="dsa">Data Structures & Algorithms</option>
              <option value="data-science">Data Science</option>
              <option value="ml">Machine Learning</option>
              <option value="ai">Artificial Intelligence</option>
            </Select>
          </div>
          <Input
            label="Qısa alt başlıq"
            placeholder="Bir cümləlik dəyər təklifi..."
            value={form.subtitle}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
          />
          <Textarea
            label="Kurs təsviri"
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Textarea
            label="Öyrənmə məqsədləri (hər sətrə bir məqsəd)"
            rows={3}
            placeholder="Dəyişənləri və şərtləri anlamaq&#10;Real mini layihələr yazmaq"
            value={form.objectivesText}
            onChange={(e) => setForm((p) => ({ ...p, objectivesText: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Çətinlik"
              value={form.difficulty}
              onChange={(e) =>
                setForm((p) => ({ ...p, difficulty: e.target.value as CourseDifficulty }))
              }
            >
              <option value="beginner">Başlanğıc</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İrəliləmiş</option>
            </Select>
            <Input
              label="Müddət (dəqiqə)"
              type="number"
              min={0}
              value={form.estimated_duration_minutes}
              onChange={(e) =>
                setForm((p) => ({ ...p, estimated_duration_minutes: Number(e.target.value) }))
              }
            />
            <Select
              label="İlkin status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContentStatus }))}
            >
              <option value="draft">Qaralama (Draft)</option>
              <option value="published">Dərc olunmuş (Published)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              Kursu yarat
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
