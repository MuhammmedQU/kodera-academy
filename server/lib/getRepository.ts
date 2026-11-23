import { LocalSandboxRepository } from '../dev/localSandboxRepository';
import { HttpError } from './http';
import type { KoderaRepository } from './repository';
import { SupabaseRepository } from './supabaseRepository';

let cachedRepo: KoderaRepository | null = null;

export function getRepository(): KoderaRepository {
  if (cachedRepo) return cachedRepo;

  const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || '';
  const appUrl = process.env.APP_URL?.trim() || 'http://localhost:5173';

  const hasSupabase =
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('YOUR-DEV-PROJECT') &&
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.includes('your-supabase-service-role') &&
    anonKey.length > 20;

  if (hasSupabase) {
    cachedRepo = new SupabaseRepository({
      supabaseUrl,
      serviceRoleKey,
      anonKey,
      appUrl,
    });
    return cachedRepo;
  }

  // SECURITY: Local sandbox is STRICTLY forbidden in production builds/deployments.
  if (process.env.NODE_ENV !== 'production' && process.env.KODERA_LOCAL_SANDBOX === 'true') {
    cachedRepo = new LocalSandboxRepository();
    return cachedRepo;
  }

  throw new HttpError(
    500,
    'SERVER_MISCONFIGURED',
    'Server verilənlər bazası konfiqurasiyası (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) tamamlanmayıb.',
  );
}

export function resetRepositoryForTests(custom?: KoderaRepository | null): void {
  cachedRepo = custom ?? null;
}
