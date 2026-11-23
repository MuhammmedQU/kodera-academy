import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { AuditLogEntry } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  Input,
  Spinner,
} from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDateAz } from '@/lib/formatters';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<AuditLogEntry[]>('/api/admin/audit-logs?limit=150')
      .then(setLogs)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Audit jurnalı yüklənmədi.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    if (!filter.trim()) return true;
    const q = filter.trim().toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      (log.actor_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
            İnzibati Fəaliyyət Jurnalı (Audit Logs)
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Bütün təsdiqlər, kurs təyinatları, modul dəyişiklikləri və ayar yeniləmələri
            dəyişdirilməz şəkildə saxlanılır.
          </p>
        </div>
        <Badge variant="brand">
          <Lock className="h-3 w-3" />
          Yalnız oxuma (Immutable)
        </Badge>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Input
        placeholder="Əməliyyat, obyekt və ya admin emaili üzrə filtr..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Audit jurnalı axtarışı"
      />

      {loading ? (
        <Spinner label="Audit jurnalı yüklənir..." />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-zinc-500">
            Qeyd tapılmadı.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand">{log.action}</Badge>
                    <span className="text-sm font-medium text-[#18181B]">{log.entity_type}</span>
                    {log.actor_email && (
                      <span className="text-xs text-zinc-500">{log.actor_email}</span>
                    )}
                  </div>
                  {Object.keys(log.metadata).length > 0 && (
                    <p className="font-mono text-xs text-zinc-500">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {formatDateAz(log.created_at)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
