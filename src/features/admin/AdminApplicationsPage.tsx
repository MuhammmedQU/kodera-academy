import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Search, XCircle } from 'lucide-react';
import type { AdminApplicationView } from '@shared/types/domain';
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
  Modal,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatApplicationStatusAz, formatDateAz } from '@/lib/formatters';

export function AdminApplicationsPage() {
  const [items, setItems] = useState<AdminApplicationView[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminApplicationView | null>(null);
  const [noteText, setNoteText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (search.trim()) qs.set('search', search.trim());
      const data = await apiRequest<AdminApplicationView[]>(
        `/api/admin/applications${qs.toString() ? `?${qs.toString()}` : ''}`,
      );
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Müraciətlər yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const handleReview = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/applications/${selected.application.id}/review`, {
        method: 'POST',
        body: {
          decision,
          rejection_reason: decision === 'rejected' ? rejectReason.trim() || null : null,
          internal_note: noteText.trim() || undefined,
        },
      });
      setFeedback(
        decision === 'approved'
          ? 'Müraciət təsdiqləndi. Tələbəyə kurs vermək üçün "Kurs təyinatları" bölməsindən kurs seçin.'
          : 'Müraciət rədd edildi və audit jurnalına yazıldı.',
      );
      setSelected(null);
      setNoteText('');
      setRejectReason('');
      await loadApplications();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Əməliyyat uğursuz oldu.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddNoteOnly = async () => {
    if (!selected || !noteText.trim()) return;
    setBusy(true);
    try {
      const created = await apiRequest<AdminApplicationView['notes'][number]>(
        `/api/admin/applications/${selected.application.id}/notes`,
        {
          method: 'POST',
          body: { note: noteText.trim() },
        },
      );
      setSelected({
        ...selected,
        notes: [created, ...selected.notes],
      });
      setNoteText('');
      await loadApplications();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Qeyd əlavə olunmadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
          Qeydiyyat Müraciətləri
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Müraciətləri yoxlayın, daxili qeydlər əlavə edin və təsdiq/rədd qərarı verin. Təsdiq etmək
          avtomatik kurs girişi vermir — kurslar ayrıca təyin olunur.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Ad, email və ya referans kodu (KDR-...) üzrə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Müraciət axtarışı"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status filtri"
        >
          <option value="all">Bütün statuslar</option>
          <option value="pending">Gözləmədə (PENDING)</option>
          <option value="approved">Təsdiqlənmiş (APPROVED)</option>
          <option value="rejected">Rədd edilmiş (REJECTED)</option>
        </Select>
      </div>

      {loading ? (
        <Spinner label="Müraciətlər yüklənir..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Müraciət tapılmadı"
          description="Seçilmiş filtrə uyğun qeydiyyat müraciəti yoxdur."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.application.id}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[#18181B]">
                      {item.profile.full_name}
                    </h3>
                    <Badge
                      variant={
                        item.application.status === 'approved'
                          ? 'success'
                          : item.application.status === 'rejected'
                            ? 'danger'
                            : 'amber'
                      }
                    >
                      {formatApplicationStatusAz(item.application.status)}
                    </Badge>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-700">
                      {item.application.reference_code}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">
                    {item.profile.email}
                    {item.profile.phone ? ` • ${item.profile.phone}` : ''}
                  </p>
                  {item.profile.learning_goals && (
                    <p className="text-xs text-zinc-500">
                      Məqsəd: {item.profile.learning_goals}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400">
                    Tarix: {formatDateAz(item.application.submitted_at)} • Daxili qeyd:{' '}
                    {item.notes.length}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(item);
                    setNoteText('');
                    setRejectReason(item.application.rejection_reason ?? '');
                  }}
                >
                  Nəzərdən keçir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.profile.full_name} — Müraciət` : ''}
        description={
          selected
            ? `${selected.profile.email} • Referans: ${selected.application.reference_code}`
            : ''
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl bg-[#FAFAF9] p-4 text-sm space-y-1.5">
              <p>
                <strong>Telefon:</strong> {selected.profile.phone || 'Qeyd edilməyib'}
              </p>
              <p>
                <strong>Öyrənmə məqsədi:</strong>{' '}
                {selected.profile.learning_goals || 'Qeyd edilməyib'}
              </p>
              <p>
                <strong>Cari status:</strong>{' '}
                {formatApplicationStatusAz(selected.application.status)}
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                label="Daxili admin qeydi (yalnız adminlər görür)"
                placeholder="WhatsApp əlaqəsi və ya müsahibə haqqında daxili qeyd..."
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNoteOnly}
                disabled={!noteText.trim() || busy}
              >
                <MessageSquarePlus className="h-4 w-4" />
                Yalnız daxili qeyd əlavə et
              </Button>
            </div>

            {selected.notes.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Mövcud daxili qeydlər</CardTitle>
                  <CardDescription className="text-xs">
                    Bu qeydlər tələbələrə heç vaxt göstərilmir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {selected.notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-zinc-50 p-2.5 text-xs">
                      <p className="text-zinc-800">{n.note}</p>
                      <p className="mt-1 text-zinc-400">{formatDateAz(n.created_at)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Input
              label="Rədd səbəbi (yalnız rədd edildikdə tələbəyə göstərilə bilər)"
              placeholder="İstəyə bağlı nəzakətli izah..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-4">
              <Button
                variant="danger"
                isLoading={busy}
                onClick={() => handleReview('rejected')}
              >
                <XCircle className="h-4 w-4" />
                Rədd et
              </Button>
              <Button
                variant="primary"
                isLoading={busy}
                onClick={() => handleReview('approved')}
              >
                <CheckCircle2 className="h-4 w-4" />
                Müraciəti təsdiqlə
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
