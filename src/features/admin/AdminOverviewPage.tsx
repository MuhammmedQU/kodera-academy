import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileClock,
  GraduationCap,
  Layers,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import type { AdminDashboardStats } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatAuditActionAz, formatDateAz } from '@/lib/formatters';

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (signal?: AbortSignal, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiRequest<AdminDashboardStats>('/api/admin/stats', { signal });
      setStats(data);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof ApiError ? err.message : 'Statistika yüklənmədi.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadStats(controller.signal, false);
    return () => controller.abort();
  }, [loadStats]);

  if (loading) {
    return <Spinner label="Admin statistikaları verilənlər bazasından yüklənir..." />;
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Statistika yüklənmədi">
          {error || 'Verilənlər bazası statistikası oxuna bilmədi.'}
        </Alert>
        <Button variant="outline" size="sm" onClick={() => void loadStats(undefined, true)}>
          <RefreshCw className="h-4 w-4" />
          Yenidən cəhd et
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      id: 'total_registered_users',
      label: 'Ümumi qeydiyyatlı istifadəçilər',
      value: stats.total_registered_users,
      subtitle: 'Qeydiyyatdan keçmiş bütün tələbə hesabları',
      icon: Users,
      tone: 'text-[#18181B] bg-zinc-100',
      link: '/admin/students',
    },
    {
      id: 'pending_applications',
      label: 'Gözləyən müraciətlər',
      value: stats.pending_applications,
      subtitle: 'Təsdiq gözləyən yeni müraciətlər',
      icon: ClipboardList,
      tone: 'text-[#D97706] bg-[#FEF3C7]',
      link: '/admin/applications',
    },
    {
      id: 'approved_applications',
      label: 'Təsdiqlənmiş müraciətlər',
      value: stats.approved_applications,
      subtitle: 'Qəbul edilmiş müraciətlər',
      icon: CheckCircle2,
      tone: 'text-emerald-700 bg-emerald-50',
      link: '/admin/applications',
    },
    {
      id: 'rejected_applications',
      label: 'Rədd edilmiş müraciətlər',
      value: stats.rejected_applications,
      subtitle: 'İmtina edilmiş müraciətlər',
      icon: XCircle,
      tone: 'text-rose-700 bg-rose-50',
      link: '/admin/applications',
    },
    {
      id: 'active_students',
      label: 'Aktiv tələbələr',
      value: stats.active_students,
      subtitle: 'Giriş icazəsi açıq olan tələbələr',
      icon: UserCheck,
      tone: 'text-[#4338CA] bg-[#EEF2FF]',
      link: '/admin/students',
    },
    {
      id: 'suspended_accounts',
      label: 'Dondurulmuş hesablar',
      value: stats.suspended_accounts ?? stats.suspended_students,
      subtitle: 'Müvəqqəti məhdudlaşdırılmış hesablar',
      icon: ShieldAlert,
      tone: 'text-red-700 bg-red-50',
      link: '/admin/students',
    },
    {
      id: 'active_enrollments',
      label: 'Aktiv kurs təyinatları',
      value: stats.active_enrollments,
      subtitle: 'Tələbələrə təyin edilmiş aktiv kurslar',
      icon: GraduationCap,
      tone: 'text-emerald-700 bg-emerald-50',
      link: '/admin/enrollments',
    },
    {
      id: 'published_courses',
      label: 'Dərc olunmuş kurslar',
      value: stats.published_courses,
      subtitle: `Ümumi kurs: ${stats.total_courses}`,
      icon: BookOpen,
      tone: 'text-[#4338CA] bg-[#EEF2FF]',
      link: '/admin/courses',
    },
    {
      id: 'total_modules',
      label: 'Ümumi modullar',
      value: stats.total_modules,
      subtitle: 'Kurslar üzrə tədris modulları',
      icon: Layers,
      tone: 'text-indigo-700 bg-indigo-50',
      link: '/admin/courses',
    },
    {
      id: 'published_lessons',
      label: 'Dərc olunmuş dərslər',
      value: stats.published_lessons,
      subtitle: `Ümumi dərs: ${stats.total_lessons}`,
      icon: BookOpen,
      tone: 'text-sky-700 bg-sky-50',
      link: '/admin/courses',
    },
    {
      id: 'completed_lessons',
      label: 'Tamamlanmış dərslər',
      value: stats.completed_lessons,
      subtitle: 'Tələbələr tərəfindən bitirilmiş dərslər',
      icon: BookCheck,
      tone: 'text-teal-700 bg-teal-50',
      link: '/admin/students',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B] sm:text-3xl">
            Admin İdarəetmə Paneli
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Bütün göstəricilər birbaşa verilənlər bazasından real vaxtda hesablanır (saxta və ya
            nümunə rəqəmlər göstərilmir).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={refreshing}
            onClick={() => void loadStats(undefined, true)}
          >
            <RefreshCw className="h-4 w-4" />
            Yenilə
          </Button>
          <ButtonLink to="/admin/applications" variant="primary" size="sm">
            Müraciətlərə bax
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to="/admin/courses" variant="outline" size="sm">
            Kursları idarə et
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.link} className="group block" data-testid={`stat-card-${item.id}`}>
              <Card className="h-full transition-all group-hover:border-[#4338CA]/40 group-hover:shadow-sm">
                <CardContent className="flex items-start justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">{item.label}</p>
                    <p
                      data-testid={`stat-value-${item.id}`}
                      className="mt-1 font-display text-2xl font-extrabold text-[#18181B]"
                    >
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle as="h2" className="flex items-center gap-2">
              <FileClock className="h-5 w-5 text-[#4338CA]" />
              Son İnzibati Fəaliyyətlər
            </CardTitle>
            <CardDescription>
              Kritik admin əməliyyatları dəyişdirilməz audit jurnalında saxlanılır.
            </CardDescription>
          </div>
          <ButtonLink to="/admin/audit-logs" variant="ghost" size="sm">
            Hamısına bax
          </ButtonLink>
        </CardHeader>
        <CardContent>
          {stats.recent_audit_logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              Hələ inzibati əməliyyat qeydi yoxdur.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {stats.recent_audit_logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#18181B]">
                      {formatAuditActionAz(log.action)}
                    </span>
                    <Badge variant="brand" className="font-mono text-[11px]">
                      {log.action}
                    </Badge>
                    {log.actor_email && (
                      <span className="text-xs text-zinc-500">({log.actor_email})</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{formatDateAz(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
