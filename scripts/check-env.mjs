/**
 * Kodera Academy — Local Environment Validator (`npm run env:check`)
 *
 * Safely validates `.env.local` (or current environment variables) before
 * connecting to a live Supabase (`kodera-dev`) project.
 * NEVER prints or logs any secret or key values.
 */

import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.local');
const vars = { ...process.env };

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    vars[key] = val;
  }
} else {
  console.log('[INFO] .env.local not found yet. Copy .env.example to .env.local when connecting kodera-dev.');
  console.log('       For offline local preview without Supabase, run: npm run dev:sandbox');
  process.exit(0);
}

function isPlaceholder(val = '') {
  const lower = val.toLowerCase();
  return (
    !val ||
    lower.includes('your-dev-project') ||
    lower.includes('your-kodera-dev') ||
    lower.includes('your-supabase-') ||
    lower.includes('your-vercel-') ||
    lower.includes('placeholder')
  );
}

const errors = [];
const warnings = [];

const viteUrl = (vars.VITE_SUPABASE_URL ?? '').trim();
const srvUrl = (vars.SUPABASE_URL ?? '').trim();
const viteAnon = (vars.VITE_SUPABASE_ANON_KEY ?? '').trim();
const srvAnon = (vars.SUPABASE_ANON_KEY ?? '').trim();
const srvRole = (vars.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (isPlaceholder(viteUrl) || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(viteUrl)) {
  errors.push('VITE_SUPABASE_URL must be a real https://<project-ref>.supabase.co URL.');
}
if (srvUrl && srvUrl !== viteUrl) {
  errors.push('SUPABASE_URL and VITE_SUPABASE_URL do not match.');
}

if (isPlaceholder(viteAnon) || viteAnon.length < 20) {
  errors.push('VITE_SUPABASE_ANON_KEY is missing or still set to a placeholder.');
}
if (viteAnon.startsWith('sb_secret_')) {
  errors.push('CRITICAL: VITE_SUPABASE_ANON_KEY contains a secret key (sb_secret_*)! Use ONLY the publishable/anon key.');
}
if (srvAnon && srvAnon !== viteAnon) {
  errors.push('SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY do not match.');
}

if (isPlaceholder(srvRole) || srvRole.length < 20) {
  errors.push('SUPABASE_SERVICE_ROLE_KEY is missing or still set to a placeholder.');
}
if (srvRole && srvRole === viteAnon) {
  errors.push('CRITICAL: SUPABASE_SERVICE_ROLE_KEY must not be identical to VITE_SUPABASE_ANON_KEY.');
}
if (srvRole.startsWith('sb_publishable_')) {
  errors.push('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is set to a publishable key instead of the service_role secret key.');
}

if (vars.VITE_LOCAL_SANDBOX === 'true' || vars.KODERA_LOCAL_SANDBOX === 'true') {
  warnings.push('VITE_LOCAL_SANDBOX / KODERA_LOCAL_SANDBOX is set to "true". Set both to "false" to test live Supabase.');
}

if (warnings.length > 0) {
  for (const w of warnings) console.warn('  [WARN]', w);
}

if (errors.length > 0) {
  console.error('Kodera .env.local validation FAILED:');
  for (const e of errors) console.error('  [FAIL]', e);
  process.exit(1);
}

console.log('Kodera .env.local validation PASSED: All Supabase URLs and key roles are properly configured.');
