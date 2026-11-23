import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, Edit3, Globe, Lock, Plus } from 'lucide-react';
import type { ContentStatus, ModuleItem } from '@shared/types/domain';
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

export function AdminCourseModulesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    sort_order: 1,
    is_public: false,
    status: 'published' as ContentStatus,
  });

  const getNextSortOrder = (list: ModuleItem[]) =>
    Math.max(0, ...list.map((m) => m.sort_order)) + 1;

  const loadModules = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ModuleItem[]>(`/api/admin/courses/${courseId}/modules`);
      setModules(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Modullar yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const openCreateModal = () => {
    setEditingModule(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      sort_order: getNextSortOrder(modules),
      is_public: false,
      status: 'published',
    });
    setSlugTouched(false);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (mod: ModuleItem) => {
    setEditingModule(mod);
    setForm({
      title: mod.title,
      slug: mod.slug,
      description: mod.description ?? '',
      sort_order: mod.sort_order,
      is_public: mod.is_public,
      status: mod.status,
    });
    setSlugTouched(true);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setBusy(true);
    setModalError(null);
    try {
      if (editingModule) {
        await apiRequest(`/api/admin/modules/${editingModule.id}`, {
          method: 'PATCH',
          body: {
            title: form.title,
            slug: form.slug,
            description: form.description || null,
            sort_order: Number(form.sort_order),
            is_public: form.is_public,
            status: form.status,
          },
        });
        setFeedback(`"${form.title}" modulu yeniləndi.`);
      } else {
        await apiRequest('/api/admin/modules', {
          method: 'POST',
          body: {
            course_id: courseId,
            title: form.title,
            slug: form.slug,
            description: form.description || null,
            sort_order: Number(form.sort_order),
            is_public: form.is_public,
            status: form.status,
          },
        });
        setFeedback('Yeni modul yaradıldı.');
      }
      setModalOpen(false);
      setEditingModule(null);
      await loadModules();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Əməliyyat uğursuz oldu.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublic = async (mod: ModuleItem) => {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/modules/${mod.id}`, {
        method: 'PATCH',
        body: { is_public: !mod.is_public },
      });
      setFeedback(
        !mod.is_public
          ? `"${mod.title}" ictimai (pulsuz) edildi.`
          : `"${mod.title}" məhdud (yalnız təyinli tələbələr) edildi.`,
      );
      await loadModules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Modul görünürlüyü dəyişdirilə bilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (mod: ModuleItem) => {
    setBusy(true);
    try {
      const nextStatus: ContentStatus = mod.status === 'published' ? 'draft' : 'published';
      await apiRequest(`/api/admin/modules/${mod.id}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      await loadModules();
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
          <Link
            to="/admin/courses"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kurslara qayıt
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
            Modul İdarəetməsi və İctimai Giriş Ayarları
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Hansı modulların qeydiyyatsız ziyarətçilərə açıq olacağını birbaşa verilənlər bazasından
            idarə edin.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Yeni modul
        </Button>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <Spinner label="Modullar yüklənir..." />
      ) : modules.length === 0 ? (
        <EmptyState
          title="Bu kursda hələ modul yoxdur"
          description="İlk modulu yaradaraq dərsləri strukturlaşdırın."
        />
      ) : (
        <div className="space-y-3">
          {modules.map((mod) => (
            <Card key={mod.id}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">
                      #{mod.sort_order}
                    </span>
                    <h2 className="font-display text-base font-bold text-[#18181B]">{mod.title}</h2>
                    {mod.is_public ? (
                      <Badge variant="amber">
                        <Globe className="h-3 w-3" />
                        İctimai (Pulsuz)
                      </Badge>
                    ) : (
                      <Badge variant="neutral">
                        <Lock className="h-3 w-3" />
                        Məhdud (Təyinli)
                      </Badge>
                    )}
                    <Badge variant={mod.is_published ? 'success' : 'neutral'}>
                      {formatContentStatusAz(mod.status)}
                    </Badge>
                  </div>
                  {mod.description && <p className="text-sm text-zinc-600">{mod.description}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    to={`/admin/modules/${mod.id}/lessons`}
                    state={{ courseId }}
                    variant="primary"
                    size="sm"
                  >
                    <BookOpenText className="h-4 w-4" />
                    Dərslər
                  </ButtonLink>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEditModal(mod)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Redaktə et
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => togglePublic(mod)}
                  >
                    {mod.is_public ? 'Məhdud et' : 'İctimai et'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => togglePublish(mod)}
                  >
                    {mod.is_published ? 'Gizlət' : 'Dərc et'}
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
        title={editingModule ? `Modulu redaktə et: ${editingModule.title}` : 'Yeni modul yarat'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
          <Input
            label="Modulun adı"
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="URL Slug"
              required
              placeholder="modul-4-funksiyalar"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
            />
            <Input
              label="Sıra nömrəsi"
              type="number"
              min={0}
              required
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
          </div>
          <Textarea
            label="Təsvir"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContentStatus }))}
            >
              <option value="published">Dərc olunub</option>
              <option value="draft">Qaralama</option>
              <option value="archived">Arxivlənib</option>
            </Select>
            <label className="flex items-center gap-2.5 self-end rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
                className="h-4 w-4 accent-[#4338CA]"
              />
              İctimai (qeydiyyatsız açıq)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Ləğv et
            </Button>
            <Button type="submit" variant="primary" isLoading={busy}>
              {editingModule ? 'Dəyişiklikləri saxla' : 'Modulu yarat'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
