import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Pencil, Plus } from 'lucide-react';
import type { ContentStatus, LessonItem } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
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
import { formatContentStatusAz, slugifyAz } from '@/lib/formatters';

export function AdminModuleLessonsPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const parentCourseId = (location.state as { courseId?: string } | null)?.courseId;

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    estimated_minutes: 10,
    sort_order: 1,
    status: 'published' as ContentStatus,
  });

  const getNextSortOrder = (list: LessonItem[]) =>
    Math.max(0, ...list.map((l) => l.sort_order)) + 1;

  const loadLessons = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LessonItem[]>(`/api/admin/modules/${moduleId}/lessons`);
      setLessons(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dərslər yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setForm({
      title: '',
      slug: '',
      summary: '',
      estimated_minutes: 10,
      sort_order: getNextSortOrder(lessons),
      status: 'published',
    });
    setSlugTouched(false);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      slug: lesson.slug,
      summary: lesson.summary ?? '',
      estimated_minutes: lesson.estimated_minutes,
      sort_order: lesson.sort_order,
      status: lesson.status,
    });
    setSlugTouched(true);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId) return;
    setBusy(true);
    setModalError(null);
    try {
      if (editingLesson) {
        await apiRequest(`/api/admin/lessons/${editingLesson.id}`, {
          method: 'PATCH',
          body: {
            title: form.title,
            slug: form.slug,
            summary: form.summary || null,
            estimated_minutes: Number(form.estimated_minutes),
            sort_order: Number(form.sort_order),
            status: form.status,
          },
        });
        setFeedback(`"${form.title}" dərsi yeniləndi.`);
      } else {
        await apiRequest('/api/admin/lessons', {
          method: 'POST',
          body: {
            module_id: moduleId,
            title: form.title,
            slug: form.slug,
            summary: form.summary || null,
            estimated_minutes: Number(form.estimated_minutes),
            sort_order: Number(form.sort_order),
            status: form.status,
          },
        });
        setFeedback('Yeni dərs əlavə edildi. İndi blok redaktorunda məzmun əlavə edə bilərsiniz.');
      }
      setModalOpen(false);
      setEditingLesson(null);
      await loadLessons();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Əməliyyat uğursuz oldu.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (lesson: LessonItem) => {
    setBusy(true);
    try {
      await apiRequest(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        body: { status: lesson.is_published ? 'draft' : 'published' },
      });
      await loadLessons();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status dəyişmədi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to={parentCourseId ? `/admin/courses/${parentCourseId}/modules` : '/admin/courses'}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {parentCourseId ? 'Modullara qayıt' : 'Kurslara qayıt'}
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Dərs İdarəetməsi</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Modul daxilində dərsləri yaradın, sıralayın, redaktə edin və 11 bloklu kontent
            redaktorunu açın.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Yeni dərs
        </Button>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <Spinner label="Dərslər yüklənir..." />
      ) : lessons.length === 0 ? (
        <EmptyState
          title="Bu modulda hələ dərs yoxdur"
          description="İlk dərsi yaratmaq üçün yuxarıdakı düyməyə klikləyin."
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">
                      #{lesson.sort_order}
                    </span>
                    <h2 className="font-display text-base font-bold text-[#18181B]">
                      {lesson.title}
                    </h2>
                    <Badge variant={lesson.is_published ? 'success' : 'neutral'}>
                      {formatContentStatusAz(lesson.status)}
                    </Badge>
                  </div>
                  {lesson.summary && <p className="text-sm text-zinc-600">{lesson.summary}</p>}
                  <p className="text-xs text-zinc-400">
                    Slug: <code>{lesson.slug}</code> • Təxmini müddət: {lesson.estimated_minutes} dəq
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ButtonLink to={`/admin/lessons/${lesson.id}/editor`} variant="primary" size="sm">
                    <Edit3 className="h-4 w-4" />
                    Kontent Redaktoru
                  </ButtonLink>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEditModal(lesson)}
                  >
                    <Pencil className="h-4 w-4" />
                    Redaktə et
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => togglePublish(lesson)}
                  >
                    {lesson.is_published ? 'Gizlət' : 'Dərc et'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalError(null);
        }}
        title={editingLesson ? `Dərsi redaktə et: ${editingLesson.title}` : 'Yeni dərs yarat'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
          <Input
            label="Dərsin adı"
            required
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((p) => ({
                ...p,
                title,
                slug: slugTouched ? p.slug : slugifyAz(title),
              }));
            }}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="URL Slug"
              required
              placeholder="funksiyalar-giris"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
            />
            <Input
              label="Müddət (dəq)"
              type="number"
              min={1}
              max={300}
              value={form.estimated_minutes}
              onChange={(e) => setForm((p) => ({ ...p, estimated_minutes: Number(e.target.value) }))}
            />
            <Input
              label="Sıra"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
          </div>
          <Textarea
            label="Qısa xülasə"
            rows={2}
            value={form.summary}
            onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContentStatus }))}
          >
            <option value="published">Dərc olunub</option>
            <option value="draft">Qaralama</option>
            <option value="archived">Arxivlənib</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              {editingLesson ? 'Dəyişiklikləri saxla' : 'Dərsi yarat'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
