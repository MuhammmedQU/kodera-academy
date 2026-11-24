import { HttpError } from './http.js';
import type { KoderaRepository } from './repository.js';
import { SupabaseRepository } from './supabaseRepository.js';

let cachedRepo: KoderaRepository | null = null;

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('your-dev-project') ||
    lower.includes('your-kodera-dev') ||
    lower.includes('your-supabase-') ||
    lower.includes('your-vercel-') ||
    lower.includes('placeholder') ||
    lower.includes('example')
  );
}

function resolveAppUrl(isProd: boolean): string {
  const configured = (process.env.APP_URL || process.env.VITE_APP_URL || '').trim();
  if (configured && !isPlaceholder(configured)) {
    if (isProd && (!configured.startsWith('https://') || configured.includes('localhost'))) {
      throw new HttpError(
        500,
        'SERVER_MISCONFIGURED',
        'Production mühitində APP_URL etibarlı HTTPS domen olmalıdır.',
      );
    }
    return configured.replace(/\/$/, '');
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  }

  if (isProd) {
    throw new HttpError(
      500,
      'SERVER_MISCONFIGURED',
      'Production mühitində APP_URL mühit dəyişəni təyin edilməlidir.',
    );
  }

  return 'http://localhost:5173';
}

export async function getRepository(): Promise<KoderaRepository> {
  if (cachedRepo) return cachedRepo;

  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const hasSupabase =
    supabaseUrl.startsWith('https://') &&
    !isPlaceholder(supabaseUrl) &&
    serviceRoleKey.length > 20 &&
    !isPlaceholder(serviceRoleKey) &&
    !serviceRoleKey.startsWith('sb_publishable_') &&
    anonKey.length > 20 &&
    !isPlaceholder(anonKey) &&
    !anonKey.startsWith('sb_secret_') &&
    serviceRoleKey !== anonKey;

  const explicitSandbox = !isProd && process.env.KODERA_LOCAL_SANDBOX === 'true';
  if (explicitSandbox) {
    const { LocalSandboxRepository } = await import('../dev/localSandboxRepository.js');
    cachedRepo = new LocalSandboxRepository();
    return cachedRepo;
  }

  if (hasSupabase) {
    const appUrl = resolveAppUrl(isProd);
    cachedRepo = new SupabaseRepository({
      supabaseUrl,
      serviceRoleKey,
      anonKey,
      appUrl,
    });
    return cachedRepo;
  }

  // SECURITY: Local sandbox is STRICTLY forbidden in production builds & Vercel deployments.
  // In local development (!isProd), if Supabase credentials are not configured yet and sandbox
  // is not explicitly disabled, fall back to LocalSandboxRepository so `npm run dev` works cleanly.
  if (!isProd && process.env.KODERA_LOCAL_SANDBOX !== 'false') {
    const { LocalSandboxRepository } = await import('../dev/localSandboxRepository.js');
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
