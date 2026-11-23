import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { AuditLogEntry } from '@shared/types/domain';
import { Alert, Badge, Card, CardContent, Input, Select, Spinner } from '@/components/ui';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatAuditActionAz, formatDateAz } from '@/lib/formatters';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<AuditLogEntry[]>('/api/admin/audit-logs?limit=200', { signal: controller.signal })
      .then(setLogs)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Audit jurnalı yüklənmədi.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const entityTypes = Array.from(new Set(logs.map((l) => l.entity_type))).sort();

  const filtered = logs.filter((log) => {
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    if (!filter.trim()) return true;
    const q = filter.trim().toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      formatAuditActionAz(log.action).toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      (log.actor_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
            İnzibati Fəaliyyət Jurnalı
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Bütün təsdiqlər, kurs təyinatları, modul dəyişiklikləri və ayar yeniləmələri
            dəyişdirilməz şəkildə saxlanılır.
          </p>
        </div>
        <Badge variant="brand">
          <Lock className="h-3 w-3" />
          Yalnız oxuma (Dəyişdirilməz)
        </Badge>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Əməliyyat, obyekt və ya admin emaili üzrə filtr..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Audit jurnalı axtarışı"
          />
        </div>
        <Select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          aria-label="Obyekt növü filtri"
        >
          <option value="all">Bütün obyektlər</option>
          {entityTypes.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </Select>
      </div>

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
              <CardContent className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#18181B]">
                      {formatAuditActionAz(log.action)}
                    </span>
                    <Badge variant="brand" className="font-mono text-[11px]">
                      {log.action}
                    </Badge>
                    <Badge variant="neutral">{log.entity_type}</Badge>
                    {log.actor_email && (
                      <span className="text-xs text-zinc-500">{log.actor_email}</span>
                    )}
                  </div>
                  {Object.keys(log.metadata).length > 0 && (
                    <pre className="overflow-x-auto rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap text-zinc-600">
                      {JSON.stringify(log.metadata)}
                    </pre>
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
