/**
 * Client-side environment configuration.
 * SECURITY: Only public `VITE_*` variables are ever read in frontend code.
 * Server-only privileged keys must NEVER appear anywhere under `src/`.
 */

export interface ClientEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
  isSupabaseConfigured: boolean;
  isLocalSandbox: boolean;
}

function readEnv(key: string): string {
  const val = import.meta.env[key];
  return typeof val === 'string' ? val.trim() : '';
}

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes('your-dev-project') ||
    lower.includes('your-kodera-dev') ||
    lower.includes('your-supabase-') ||
    lower.includes('your-vercel-') ||
    lower.includes('placeholder')
  );
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY');
const rawAppUrl = readEnv('VITE_APP_URL');
const appUrl =
  (rawAppUrl && !isPlaceholder(rawAppUrl) ? rawAppUrl : '') ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const hasRealSupabaseUrl =
  supabaseUrl.length > 0 &&
  supabaseUrl.startsWith('https://') &&
  !isPlaceholder(supabaseUrl);

const hasRealAnonKey =
  supabaseAnonKey.length > 20 &&
  !isPlaceholder(supabaseAnonKey) &&
  !supabaseAnonKey.startsWith('sb_secret_');

/**
 * Local sandbox mode is strictly restricted to non-production builds (`!import.meta.env.PROD`).
 * In production builds, it is ALWAYS `false`.
 */
const isLocalSandbox = !import.meta.env.PROD && readEnv('VITE_LOCAL_SANDBOX') === 'true';

export const clientEnv: ClientEnv = {
  supabaseUrl,
  supabaseAnonKey,
  appUrl,
  isSupabaseConfigured: hasRealSupabaseUrl && hasRealAnonKey,
  isLocalSandbox,
};
