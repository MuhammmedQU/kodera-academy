import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, GraduationCap, Users } from 'lucide-react';
import type { AdminStudentView, Course } from '@shared/types/domain';
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
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatAccountStatusAz } from '@/lib/formatters';

export function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudentView[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [assignModalStudent, setAssignModalStudent] = useState<AdminStudentView | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (search.trim()) qs.set('search', search.trim());
      const [studentList, courseList] = await Promise.all([
        apiRequest<AdminStudentView[]>(
          `/api/admin/students${qs.toString() ? `?${qs.toString()}` : ''}`,
        ),
        apiRequest<Course[]>('/api/admin/courses'),
      ]);
      setStudents(studentList);
      setCourses(courseList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tələbə siyahısı yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleAccountStatus = async (student: AdminStudentView) => {
    const nextStatus = student.profile.account_status === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/admin/students/${student.profile.id}/status`, {
        method: 'PATCH',
        body: { account_status: nextStatus },
      });
      setFeedback(
        nextStatus === 'suspended'
          ? `${student.profile.full_name} hesabı donduruldu.`
          : `${student.profile.full_name} hesabı yenidən aktivləşdirildi.`,
      );
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status dəyişdirilə bilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleAssignCourses = async () => {
    if (!assignModalStudent || selectedCourseIds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/admin/enrollments', {
        method: 'POST',
        body: {
          student_id: assignModalStudent.profile.id,
          course_ids: selectedCourseIds,
        },
      });
      setFeedback(`${assignModalStudent.profile.full_name} üçün kurs təyinatı yeniləndi.`);
      setAssignModalStudent(null);
      setSelectedCourseIds([]);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kurs təyin edilə bilmədi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Tələbə İdarəetməsi</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tələbələri axtarın, hesablarını aktivləşdirin və ya dondurun, tamamlanmış dərslərə baxın
          və fərdi kurslar təyin edin.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Ad və ya email üzrə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tələbə axtarışı"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Hesab statusu filtri"
        >
          <option value="all">Bütün hesablar</option>
          <option value="active">Aktiv</option>
          <option value="pending">Gözləmədə</option>
          <option value="suspended">Dondurulub</option>
          <option value="rejected">Rədd edilib</option>
        </Select>
      </div>

      {loading ? (
        <Spinner label="Tələbələr yüklənir..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Tələbə tapılmadı"
          description="Filtrə uyğun tələbə qeydi mövcud deyil."
        />
      ) : (
        <div className="space-y-3">
          {students.map((st) => {
            const activeEnrollments = st.enrollments.filter((e) => e.status === 'active');
            return (
              <Card key={st.profile.id}>
                <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-[#18181B]">
                        {st.profile.full_name}
                      </h3>
                      <Badge
                        variant={
                          st.profile.account_status === 'active'
                            ? 'success'
                            : st.profile.account_status === 'suspended' ||
                                st.profile.account_status === 'rejected'
                              ? 'danger'
                              : 'amber'
                        }
                      >
                        {formatAccountStatusAz(st.profile.account_status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600">{st.profile.email}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>Tamamlanmış dərs: {st.completed_lessons_count}</span>
                      <span>•</span>
                      <span>
                        Aktiv kurslar:{' '}
                        {activeEnrollments.length > 0
                          ? activeEnrollments.map((e) => e.course?.title || e.course_id).join(', ')
                          : 'Hələ təyin edilməyib'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {st.profile.account_status === 'active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAssignModalStudent(st);
                          setSelectedCourseIds([]);
                        }}
                      >
                        <GraduationCap className="h-4 w-4" />
                        Kurs təyin et
                      </Button>
                    )}
                    {(st.profile.account_status === 'active' ||
                      st.profile.account_status === 'suspended') && (
                      <Button
                        variant={st.profile.account_status === 'suspended' ? 'outline' : 'danger'}
                        size="sm"
                        disabled={busy}
                        onClick={() => toggleAccountStatus(st)}
                      >
                        {st.profile.account_status === 'suspended' ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Aktivləşdir
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4" />
                            Dondur
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(assignModalStudent)}
        onClose={() => setAssignModalStudent(null)}
        title="Tələbəyə kurs təyin et"
        description={
          assignModalStudent
            ? `${assignModalStudent.profile.full_name} (${assignModalStudent.profile.email})`
            : ''
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Tələbənin giriş əldə etməsini istədiyiniz bir və ya bir neçə kursu seçin:
          </p>
          <div className="space-y-2">
            {courses.map((c) => {
              const checked = selectedCourseIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 p-3.5 hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCourseIds((prev) =>
                          prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                        )
                      }
                      className="h-4 w-4 rounded accent-[#4338CA]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#18181B]">{c.title}</p>
                      <p className="text-xs text-zinc-500">{c.programming_language.toUpperCase()}</p>
                    </div>
                  </div>
                  <Badge variant={c.is_published ? 'success' : 'neutral'}>{c.status}</Badge>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignModalStudent(null)}>
              Ləğv et
            </Button>
            <Button
              variant="primary"
              disabled={selectedCourseIds.length === 0}
              isLoading={busy}
              onClick={handleAssignCourses}
            >
              Seçilən kursları təyin et
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
