import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileClock,
  GraduationCap,
  ShieldAlert,
  Users,
} from 'lucide-react';
import type { AdminDashboardStats } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDateAz } from '@/lib/formatters';

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<AdminDashboardStats>('/api/admin/stats')
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Statistika yüklənmədi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Admin statistikaları yüklənir..." />;
  if (error || !stats) return <Alert variant="error">{error || 'Məlumat tapılmadı.'}</Alert>;

  const statCards = [
    {
      label: 'Gözləyən müraciətlər',
      value: stats.pending_applications,
      icon: ClipboardList,
      tone: 'text-[#D97706] bg-[#FEF3C7]',
      link: '/admin/applications',
    },
    {
      label: 'Aktiv tələbələr',
      value: stats.active_students,
      icon: Users,
      tone: 'text-[#4338CA] bg-[#EEF2FF]',
      link: '/admin/students',
    },
    {
      label: 'Aktiv kurs təyinatları',
      value: stats.active_enrollments,
      icon: GraduationCap,
      tone: 'text-emerald-700 bg-emerald-50',
      link: '/admin/enrollments',
    },
    {
      label: 'Kurslar (Dərc / Cəmi)',
      value: `${stats.published_courses} / ${stats.total_courses}`,
      icon: BookOpen,
      tone: 'text-[#18181B] bg-zinc-100',
      link: '/admin/courses',
    },
    {
      label: 'Ümumi dərs sayı',
      value: stats.total_lessons,
      icon: BookOpen,
      tone: 'text-sky-700 bg-sky-50',
      link: '/admin/courses',
    },
    {
      label: 'Dondurulmuş hesablar',
      value: stats.suspended_students,
      icon: ShieldAlert,
      tone: 'text-red-700 bg-red-50',
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
            Müraciətləri, tələbələri, kurs təyinatlarını, tədris kontentini və platforma ayarlarını
            təhlükəsiz şəkildə idarə edin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/applications">
            <Button variant="primary" size="sm">
              Müraciətlərə bax
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/courses">
            <Button variant="outline" size="sm">
              Kursları idarə et
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.link} className="group block">
              <Card className="transition-all group-hover:border-[#4338CA]/40 group-hover:shadow-sm">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase">{item.label}</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#18181B]">
                      {item.value}
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="h-5 w-5 text-[#4338CA]" />
              Son İnzibati Fəaliyyətlər
            </CardTitle>
            <CardDescription>
              Kritik admin əməliyyatları dəyişdirilməz audit jurnalında saxlanılır.
            </CardDescription>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="ghost" size="sm">
              Hamısına bax
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recent_audit_logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Hələ audit qeydi yoxdur.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {stats.recent_audit_logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Badge variant="brand">{log.action}</Badge>
                    <span className="text-zinc-700">{log.entity_type}</span>
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
