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
import { formatAccountStatusAz, formatContentStatusAz } from '@/lib/formatters';

export function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudentView[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [assignModalStudent, setAssignModalStudent] = useState<AdminStudentView | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [statusModalStudent, setStatusModalStudent] = useState<AdminStudentView | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fetch courses once on mount instead of every search keystroke
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<Course[]>('/api/admin/courses', { signal: controller.signal })
      .then(setCourses)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadStudents = useCallback(
    async (signal?: AbortSignal) => {
      setIsFetching(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (statusFilter !== 'all') qs.set('status', statusFilter);
        if (debouncedSearch.trim()) qs.set('search', debouncedSearch.trim());
        const studentList = await apiRequest<AdminStudentView[]>(
          `/api/admin/students${qs.toString() ? `?${qs.toString()}` : ''}`,
          { signal },
        );
        setStudents(studentList);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Tələbə siyahısı yüklənmədi.');
      } finally {
        if (!signal?.aborted) {
          setInitialLoading(false);
          setIsFetching(false);
        }
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  const handleConfirmAccountStatus = async () => {
    if (!statusModalStudent) return;
    const nextStatus =
      statusModalStudent.profile.account_status === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    setModalError(null);
    try {
      await apiRequest(`/api/admin/students/${statusModalStudent.profile.id}/status`, {
        method: 'PATCH',
        body: {
          account_status: nextStatus,
          reason: statusReason.trim() || undefined,
        },
      });
      setFeedback(
        nextStatus === 'suspended'
          ? `${statusModalStudent.profile.full_name} hesabı donduruldu.`
          : `${statusModalStudent.profile.full_name} hesabı yenidən aktivləşdirildi.`,
      );
      setStatusModalStudent(null);
      setStatusReason('');
      await loadStudents();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Status dəyişdirilə bilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const handleAssignCourses = async () => {
    if (!assignModalStudent || selectedCourseIds.length === 0) return;
    setBusy(true);
    setModalError(null);
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
      await loadStudents();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Kurs təyin edilə bilmədi.');
    } finally {
      setBusy(false);
    }
  };

  const activeCourseIdsForModal = new Set(
    (assignModalStudent?.enrollments ?? [])
      .filter((e) => e.status === 'active' || e.status === 'completed')
      .map((e) => e.course_id),
  );

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

      {isFetching && !initialLoading && (
        <p className="text-xs text-zinc-500">Siyahı yenilənir...</p>
      )}

      {initialLoading ? (
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
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold text-[#18181B]">
                        {st.profile.full_name}
                      </h2>
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
                          setModalError(null);
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
                        onClick={() => {
                          setStatusModalStudent(st);
                          setStatusReason('');
                          setModalError(null);
                        }}
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

      {/* Assign Courses Modal */}
      <Modal
        open={Boolean(assignModalStudent)}
        onClose={() => {
          setAssignModalStudent(null);
          setModalError(null);
        }}
        title="Tələbəyə kurs təyin et"
        description={
          assignModalStudent
            ? `${assignModalStudent.profile.full_name} (${assignModalStudent.profile.email})`
            : ''
        }
      >
        <div className="space-y-4">
          {modalError && <Alert variant="error">{modalError}</Alert>}
          <p className="text-sm text-zinc-600">
            Tələbənin giriş əldə etməsini istədiyiniz bir və ya bir neçə kursu seçin:
          </p>
          <div className="space-y-2">
            {courses.map((c) => {
              const checked = selectedCourseIds.includes(c.id);
              const alreadyActive = activeCourseIdsForModal.has(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3.5 hover:bg-zinc-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCourseIds((prev) =>
                          prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                        )
                      }
                      className="h-4 w-4 shrink-0 rounded accent-[#4338CA]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#18181B]">{c.title}</p>
                      <p className="text-xs text-zinc-500">{c.programming_language.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {alreadyActive && <Badge variant="brand">Artıq təyinli</Badge>}
                    <Badge variant={c.is_published ? 'success' : 'neutral'}>
                      {formatContentStatusAz(c.status)}
                    </Badge>
                  </div>
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

      {/* Suspend / Reactivate Confirmation Modal */}
      <Modal
        open={Boolean(statusModalStudent)}
        onClose={() => {
          setStatusModalStudent(null);
          setModalError(null);
        }}
        title={
          statusModalStudent?.profile.account_status === 'suspended'
            ? 'Tələbə hesabını aktivləşdir'
            : 'Tələbə hesabını dondur'
        }
        description={
          statusModalStudent
            ? `${statusModalStudent.profile.full_name} (${statusModalStudent.profile.email})`
            : ''
        }
      >
        {statusModalStudent && (
          <div className="space-y-4">
            {modalError && <Alert variant="error">{modalError}</Alert>}
            <Alert
              variant={statusModalStudent.profile.account_status === 'suspended' ? 'info' : 'warning'}
            >
              {statusModalStudent.profile.account_status === 'suspended'
                ? 'Hesab yenidən aktivləşdirildikdə tələbə təyin olunmuş kurslarına daxil ola biləcək.'
                : 'Hesab dondurulduqda tələbənin Tələbə Panelinə və məhdud dərslərə girişi dərhal dayandırılacaq.'}
            </Alert>
            <Input
              label="Səbəb (istəyə bağlı — audit jurnalında saxlanılır)"
              placeholder="Qısa inzibati qeyd..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStatusModalStudent(null)}>
                Ləğv et
              </Button>
              <Button
                variant={
                  statusModalStudent.profile.account_status === 'suspended' ? 'primary' : 'danger'
                }
                isLoading={busy}
                onClick={handleConfirmAccountStatus}
              >
                {statusModalStudent.profile.account_status === 'suspended'
                  ? 'Bəli, aktivləşdir'
                  : 'Bəli, hesabı dondur'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
