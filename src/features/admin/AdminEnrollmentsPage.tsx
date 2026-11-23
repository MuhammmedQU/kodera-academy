import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, PlusCircle, Trash2 } from 'lucide-react';
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

  const handleAssign = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/admin/enrollments', {
        method: 'POST',
        body: { student_id: selectedStudentId, course_ids: [selectedCourseId] },
      });
      setFeedback('Kurs uğurla təyin edildi və audit jurnalına yazıldı.');
      setSelectedCourseId('');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kurs təyin edilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (enrollmentId: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/enrollments/${enrollmentId}/revoke`, {
        method: 'POST',
        body: { revoke_reason: 'Administrator tərəfindən ləğv edildi.' },
      });
      setFeedback('Kurs girişi ləğv edildi.');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Təyinat ləğv edilmədi.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Kurs təyinatları yüklənir..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
          Kurs Təyinatları (Enrollments)
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Təsdiqlənmiş aktiv tələbələrə kurs girişi verin və ya mövcud girişi ləğv edin.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni kurs təyinatı</CardTitle>
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
                onClick={handleAssign}
              >
                <PlusCircle className="h-4 w-4" />
                Kursu təyin et
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="Hələ kurs təyinatı yoxdur"
          description="Yuxarıdakı formadan ilk kurs təyinatını əlavə edə bilərsiniz."
        />
      ) : (
        <div className="space-y-3">
          {enrollments.map((enr) => (
            <Card key={enr.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
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

                {enr.status === 'active' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleRevoke(enr.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Girişi ləğv et
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
