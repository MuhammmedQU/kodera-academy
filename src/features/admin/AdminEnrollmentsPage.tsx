import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import type { AdminStudentView, Course, Enrollment } from '@shared/types/domain';
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
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDateAz, formatEnrollmentStatusAz } from '@/lib/formatters';

export function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<AdminStudentView[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [revokeTarget, setRevokeTarget] = useState<Enrollment | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrList, stList, crsList] = await Promise.all([
        apiRequest<Enrollment[]>('/api/admin/enrollments'),
        apiRequest<AdminStudentView[]>('/api/admin/students?status=active'),
        apiRequest<Course[]>('/api/admin/courses'),
      ]);
      setEnrollments(enrList);
      setStudents(stList);
      setCourses(crsList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Təyinatlar yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleAssign = async (studentId = selectedStudentId, courseId = selectedCourseId) => {
    if (!studentId || !courseId) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/admin/enrollments', {
        method: 'POST',
        body: { student_id: studentId, course_ids: [courseId] },
      });
      setFeedback('Kurs uğurla təyin edildi və audit jurnalına yazıldı.');
      if (courseId === selectedCourseId) setSelectedCourseId('');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kurs təyin edilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setBusy(true);
    setModalError(null);
    try {
      await apiRequest(`/api/admin/enrollments/${revokeTarget.id}/revoke`, {
        method: 'POST',
        body: {
          revoke_reason: revokeReason.trim() || 'Administrator tərəfindən ləğv edildi.',
        },
      });
      setFeedback('Kurs girişi ləğv edildi.');
      setRevokeTarget(null);
      setRevokeReason('');
      await loadAll();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Təyinat ləğv edilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enr) => {
    if (statusFilter !== 'all' && enr.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (enr.student_name ?? '').toLowerCase().includes(q) ||
      (enr.student_email ?? '').toLowerCase().includes(q) ||
      (enr.course?.title ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) return <Spinner label="Kurs təyinatları yüklənir..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Kurs Təyinatları</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Təsdiqlənmiş aktiv tələbələrə kurs girişi verin, ləğv edin və ya yenidən aktivləşdirin.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-base">
            Yeni kurs təyinatı
          </CardTitle>
          <CardDescription>Yalnız aktiv təsdiqlənmiş tələbələr seçilə bilər.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              label="Aktiv tələbə"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Tələbə seçin...</option>
              {students.map((s) => (
                <option key={s.profile.id} value={s.profile.id}>
                  {s.profile.full_name} ({s.profile.email})
                </option>
              ))}
            </Select>
            <Select
              label="Kurs"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Kurs seçin...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <div className="flex items-end">
              <Button
                variant="primary"
                className="w-full"
                disabled={!selectedStudentId || !selectedCourseId}
                isLoading={busy}
                onClick={() => void handleAssign()}
              >
                <PlusCircle className="h-4 w-4" />
                Kursu təyin et
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Tələbə adı, email və ya kurs üzrə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Təyinat axtarışı"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Təyinat statusu filtri"
        >
          <option value="all">Bütün statuslar</option>
          <option value="active">Aktiv giriş</option>
          <option value="revoked">Ləğv edilib</option>
          <option value="completed">Tamamlanıb</option>
        </Select>
      </div>

      {filteredEnrollments.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="Kurs təyinatı tapılmadı"
          description="Filtrə uyğun qeyd yoxdur və ya hələ kurs təyin edilməyib."
        />
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map((enr) => (
            <Card key={enr.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#18181B]">
                      {enr.student_name || enr.student_id}
                    </p>
                    <Badge
                      variant={
                        enr.status === 'active'
                          ? 'success'
                          : enr.status === 'revoked'
                            ? 'danger'
                            : 'brand'
                      }
                    >
                      {formatEnrollmentStatusAz(enr.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Kurs: <strong>{enr.course?.title || enr.course_id}</strong> ({enr.student_email})
                  </p>
                  <p className="text-xs text-zinc-400">
                    Təyin tarixi: {formatDateAz(enr.assigned_at)}
                    {enr.revoked_at ? ` • Ləğv tarixi: ${formatDateAz(enr.revoked_at)}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {enr.status === 'active' && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        setRevokeTarget(enr);
                        setRevokeReason('');
                        setModalError(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Girişi ləğv et
                    </Button>
                  )}
                  {enr.status === 'revoked' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleAssign(enr.student_id, enr.course_id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Yenidən aktivləşdir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => {
          setRevokeTarget(null);
          setModalError(null);
        }}
        title="Kurs girişini ləğv et"
        description={
          revokeTarget
            ? `${revokeTarget.student_name || revokeTarget.student_id} — ${revokeTarget.course?.title || revokeTarget.course_id}`
            : ''
        }
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
          <Alert variant="warning">
            Giriş ləğv edildikdə tələbə bu kursun məhdud dərslərinə daxil ola bilməyəcək. İstəsəniz
            sonradan yenidən aktivləşdirə bilərsiniz.
          </Alert>
          <Input
            label="Ləğv səbəbi (istəyə bağlı)"
            placeholder="Məs., Təlim müddəti bitdi"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Ləğv et
            </Button>
            <Button variant="danger" isLoading={busy} onClick={handleConfirmRevoke}>
              Bəli, girişi ləğv et
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
