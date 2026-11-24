/**
 * Kodera Academy — Automated Live Staging Verification Script
 *
 * Verifies a live Vercel Preview / Staging URL and `kodera-dev` Supabase PostgREST RLS
 * using ONLY public / anon credentials (NEVER requires or accepts service_role keys).
 *
 * Usage (PowerShell):
 *   $env:STAGING_URL="https://your-preview.vercel.app"
 *   $env:STAGING_SUPABASE_URL="https://your-kodera-dev.supabase.co"
 *   $env:STAGING_SUPABASE_ANON_KEY="your-kodera-dev-anon-key"
 *   npm run staging:verify
 */

function parseArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : undefined;
}

const rawStagingUrl = (parseArg('url') ?? process.env.STAGING_URL ?? '').replace(/\/+$/, '');
const rawSupabaseUrl = (
  parseArg('supabase-url') ??
  process.env.STAGING_SUPABASE_URL ??
  ''
).replace(/\/+$/, '');
const anonKey = (parseArg('anon-key') ?? process.env.STAGING_SUPABASE_ANON_KEY ?? '').trim();

if (!rawStagingUrl) {
  console.log(`Kodera Staging Verifier — Usage:
  PowerShell:
    $env:STAGING_URL="https://<your-vercel-preview>.vercel.app"
    $env:STAGING_SUPABASE_URL="https://<your-kodera-dev>.supabase.co"
    $env:STAGING_SUPABASE_ANON_KEY="<your-kodera-dev-anon-key>"
    npm run staging:verify

  Optional CLI flags:
    node scripts/verify-staging.mjs --url=https://... --supabase-url=https://... --anon-key=...
`);
  process.exit(1);
}

if (!rawStagingUrl.startsWith('https://')) {
  console.error('FAIL: STAGING_URL must start with https:// (never test production/staging over plain HTTP).');
  process.exit(1);
}

if (anonKey.startsWith('sb_secret_')) {
  console.error('FAIL: Refusing to run with a Supabase secret/service_role key. Provide ONLY the publishable/anon key.');
  process.exit(1);
}

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? 'OK' });
    console.log(`  [PASS] ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, detail: msg });
    console.error(`  [FAIL] ${name} — ${msg}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

console.log(`\n=== Kodera Staging Verification ===`);
console.log(`Target Staging URL: ${rawStagingUrl}\n`);

// 1. Health endpoint & mode
await check('GET /api/health returns 200 with mode="supabase" & Cache-Control: no-store', async () => {
  const res = await fetch(`${rawStagingUrl}/api/health`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const cc = (res.headers.get('cache-control') ?? '').toLowerCase();
  assert(cc.includes('no-store'), `Expected Cache-Control no-store, got "${cc}"`);
  const json = await res.json();
  const body = json?.data ?? json;
  assert(body.status === 'ok', `Expected status="ok", got ${JSON.stringify(body)}`);
  assert(body.mode === 'supabase', `Expected mode="supabase", got "${body.mode}" (sandbox MUST be off!)`);
  return `mode=${body.mode}`;
});

// 2. HTTP Security Headers & Tightened CSP
await check('GET / returns HSTS, X-Frame-Options, nosniff, and pinned Pyodide v0.27.5 CSP', async () => {
  const res = await fetch(`${rawStagingUrl}/`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const hsts = res.headers.get('strict-transport-security') ?? '';
  const xcto = res.headers.get('x-content-type-options') ?? '';
  const xfo = res.headers.get('x-frame-options') ?? '';
  const csp = res.headers.get('content-security-policy') ?? '';
  assert(hsts.includes('max-age='), `Missing HSTS header`);
  assert(xcto.toLowerCase() === 'nosniff', `Expected X-Content-Type-Options: nosniff, got "${xcto}"`);
  assert(xfo.toUpperCase() === 'DENY', `Expected X-Frame-Options: DENY, got "${xfo}"`);
  assert(
    csp.includes('https://cdn.jsdelivr.net/pyodide/v0.27.5/full/'),
    `CSP missing exact pinned Pyodide v0.27.5 origin`,
  );
  assert(csp.includes('upgrade-insecure-requests'), `CSP missing upgrade-insecure-requests`);
  return 'HSTS + CSP + nosniff + DENY verified';
});

// 3. Public settings via Vercel ?__route= rewrite
await check('GET /api/public/settings returns official academy settings and hides admin_login_email', async () => {
  const res = await fetch(`${rawStagingUrl}/api/public/settings`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const json = await res.json();
  const body = json?.data ?? json;
  assert(typeof body.academy_name === 'string' && body.academy_name.length >= 2, 'Missing academy_name');
  assert(!('admin_login_email' in body), 'SECURITY LEAK: admin_login_email must never appear in public settings');
  return `academy_name="${body.academy_name}", contact_email="${body.contact_email}", registration_enabled=${body.registration_enabled}`;
});

// 4. Public courses & seed presence
await check('GET /api/public/courses returns seeded Python course with first_public_lesson_slug', async () => {
  const res = await fetch(`${rawStagingUrl}/api/public/courses`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const json = await res.json();
  const payload = json?.data ?? json;
  const courses = Array.isArray(payload) ? payload : payload?.courses;
  assert(Array.isArray(courses), 'Expected courses array');
  const python = courses.find((c) => c.slug === 'python-esaslari');
  assert(python, 'Seeded course "python-esaslari" not found — did you run 01_python_intro_modules.sql?');
  assert(python.first_public_lesson_slug === 'proqramlasdirma-nedir', `Unexpected first_public_lesson_slug: ${python.first_public_lesson_slug}`);
  return `${courses.length} published course(s), Python first lesson="${python.first_public_lesson_slug}"`;
});

// 5. Public Module 1 lesson allowed, Restricted Module 3 blocked
await check('Public Python Lesson 1.1 returns 200 and never leaks solution_code/is_correct', async () => {
  const res = await fetch(`${rawStagingUrl}/api/public/courses/python-esaslari/lessons/ilk-python-kodu-print`);
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  const rawText = await res.text();
  assert(!rawText.includes('"solution_code"'), 'SECURITY LEAK: solution_code appeared in public lesson payload!');
  assert(!rawText.includes('"is_correct"'), 'SECURITY LEAK: is_correct appeared in public lesson payload!');
  return '200 OK, zero answer-key leaks';
});

await check('Restricted Python Module 3 lesson returns 403 for anonymous visitors', async () => {
  const res = await fetch(`${rawStagingUrl}/api/public/courses/python-esaslari/lessons/for-dovru-giris`);
  assert(res.status === 403, `Expected 403, got ${res.status}`);
  return '403 Forbidden';
});

// 6. Auth & Admin endpoints reject unauthenticated calls with 401 + no-store
await check('Unauthenticated /api/admin/students, /api/admin/stats, /api/auth/admin-verify and /api/student/overview return 401 + no-store', async () => {
  const [adm, stats, verify, stu] = await Promise.all([
    fetch(`${rawStagingUrl}/api/admin/students`),
    fetch(`${rawStagingUrl}/api/admin/stats`),
    fetch(`${rawStagingUrl}/api/auth/admin-verify`, { method: 'POST' }),
    fetch(`${rawStagingUrl}/api/student/overview`),
  ]);
  assert(adm.status === 401, `/api/admin/students expected 401, got ${adm.status}`);
  assert(stats.status === 401, `/api/admin/stats expected 401, got ${stats.status}`);
  assert(verify.status === 401, `/api/auth/admin-verify expected 401, got ${verify.status}`);
  assert(stu.status === 401, `/api/student/overview expected 401, got ${stu.status}`);
  assert((adm.headers.get('cache-control') ?? '').includes('no-store'), 'Admin response missing no-store');
  assert((stu.headers.get('cache-control') ?? '').includes('no-store'), 'Student response missing no-store');
  return 'All 401 + no-store';
});

// 7. Malformed JSON handling returns 400 (never 500)
await check('Malformed JSON body on POST /api/auth/login returns 400 INVALID_JSON', async () => {
  const res = await fetch(`${rawStagingUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid-json',
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  return '400 Bad Request';
});

// 8. Live Supabase PostgREST RLS Penetration Checks (anon key only)
if (rawSupabaseUrl && anonKey) {
  console.log(`\n--- Live Supabase PostgREST RLS Penetration Checks (${rawSupabaseUrl}) ---`);
  const sbHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  const privateTables = [
    'profiles',
    'user_roles',
    'applications',
    'application_notes',
    'enrollments',
    'lesson_progress',
    'exercise_attempts',
    'exercise_solutions',
    'quiz_attempts',
    'quiz_attempt_answers',
    'platform_settings',
    'audit_logs',
    'rate_limit_events',
  ];

  await check(`Anon direct PostgREST SELECT blocked/empty on all ${privateTables.length} private tables`, async () => {
    for (const table of privateTables) {
      const res = await fetch(`${rawSupabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: sbHeaders,
      });
      if (res.status === 401 || res.status === 403) continue;
      if (res.status === 200) {
        const rows = await res.json();
        assert(Array.isArray(rows) && rows.length === 0, `Table "${table}" leaked ${rows.length} row(s) to anon!`);
      } else {
        throw new Error(`Unexpected status ${res.status} on table "${table}"`);
      }
    }
    return `0 leaked rows across ${privateTables.length} tables`;
  });

  await check('Anon column-level SELECT on quiz_question_options(is_correct) & quiz_questions(explanation) denied', async () => {
    const [optRes, qRes] = await Promise.all([
      fetch(`${rawSupabaseUrl}/rest/v1/quiz_question_options?select=id,is_correct&limit=1`, { headers: sbHeaders }),
      fetch(`${rawSupabaseUrl}/rest/v1/quiz_questions?select=id,explanation&limit=1`, { headers: sbHeaders }),
    ]);
    assert(optRes.status === 401 || optRes.status === 403, `quiz_question_options.is_correct expected 401/403, got ${optRes.status}`);
    assert(qRes.status === 401 || qRes.status === 403, `quiz_questions.explanation expected 401/403, got ${qRes.status}`);
    return `options=${optRes.status}, questions=${qRes.status}`;
  });

  await check('Anon RPC calls to check_and_record_rate_limit, review_application_atomic & get_admin_dashboard_stats are denied', async () => {
    const [rlRes, revRes, statsRes] = await Promise.all([
      fetch(`${rawSupabaseUrl}/rest/v1/rpc/check_and_record_rate_limit`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          p_bucket_key: 'anon-probe',
          p_action: 'probe',
          p_window_seconds: 60,
          p_max_requests: 5,
        }),
      }),
      fetch(`${rawSupabaseUrl}/rest/v1/rpc/review_application_atomic`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          p_application_id: '00000000-0000-4000-8000-000000000001',
          p_decision: 'approved',
          p_reviewed_by: '00000000-0000-4000-8000-000000000001',
        }),
      }),
      fetch(`${rawSupabaseUrl}/rest/v1/rpc/get_admin_dashboard_stats`, {
        method: 'POST',
        headers: sbHeaders,
        body: '{}',
      }),
    ]);
    assert(rlRes.status === 401 || rlRes.status === 403, `check_and_record_rate_limit expected 401/403, got ${rlRes.status}`);
    assert(revRes.status === 401 || revRes.status === 403, `review_application_atomic expected 401/403, got ${revRes.status}`);
    assert(statsRes.status === 401 || statsRes.status === 403, `get_admin_dashboard_stats expected 401/403, got ${statsRes.status}`);
    return `rate_limit=${rlRes.status}, review_app=${revRes.status}, admin_stats=${statsRes.status}`;
  });

  await check('Anon safe public RPCs (get_public_platform_settings & get_course_curriculum_outline) succeed with locked slugs masked', async () => {
    const [setRes, curRes] = await Promise.all([
      fetch(`${rawSupabaseUrl}/rest/v1/rpc/get_public_platform_settings`, {
        method: 'POST',
        headers: sbHeaders,
        body: '{}',
      }),
      fetch(`${rawSupabaseUrl}/rest/v1/rpc/get_course_curriculum_outline`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({ p_course_slug: 'python-esaslari' }),
      }),
    ]);
    assert(setRes.status === 200, `get_public_platform_settings expected 200, got ${setRes.status}`);
    assert(curRes.status === 200, `get_course_curriculum_outline expected 200, got ${curRes.status}`);
    const outline = await curRes.json();
    const mod3 = outline.find((row) => row.module_sort_order === 3);
    assert(mod3, 'Module 3 row missing from curriculum outline');
    assert(mod3.can_access === false, 'Module 3 should have can_access=false for anon');
    assert(mod3.lesson_slug === null, `Module 3 lesson_slug must be masked to null, got "${mod3.lesson_slug}"`);
    return 'Public RPCs OK, Module 3 slug masked';
  });
} else {
  console.log('\n[INFO] Skipped direct Supabase PostgREST RLS checks (set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY to include them).');
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length > 0) {
  process.exit(1);
}
