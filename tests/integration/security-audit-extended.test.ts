import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import { beforeEach, describe, expect, it } from 'vitest';
import { getRepository, resetRepositoryForTests } from '@server/lib/getRepository';
import { getClientIp, parseApiRequest, readJsonBody } from '@server/lib/http';
import { SEED_IDS } from '@server/content/initialSeed';
import { callApi, createTestSandbox, loginAs } from './testHttp';

describe('Phase 10 & Independent Audit — Extended Security & Static SQL RLS Verification', () => {
  beforeEach(() => {
    createTestSandbox();
  });

  it('safely handles SQL injection payloads in admin search endpoints without error or data leak', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');
    const sqli = encodeURIComponent("' OR '1'='1'; DROP TABLE profiles; --");

    const appsRes = await callApi({
      url: `/api/admin/applications?search=${sqli}`,
      token: adminToken,
    });
    expect(appsRes.status).toBe(200);
    expect((appsRes.body as { data: unknown[] }).data).toEqual([]);

    const stuRes = await callApi({
      url: `/api/admin/students?search=${sqli}`,
      token: adminToken,
    });
    expect(stuRes.status).toBe(200);
    expect((stuRes.body as { data: unknown[] }).data).toEqual([]);
  });

  it('rejects malformed input payloads via strict Zod schemas and empty PATCHes (HTTP 400)', async () => {
    const badReg = await callApi({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        full_name: 'A',
        email: 'not-an-email',
        password: '123',
      },
    });
    expect(badReg.status).toBe(400);

    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');
    const badSettings = await callApi({
      method: 'PUT',
      url: '/api/admin/settings',
      token: adminToken,
      body: {
        academy_name: 'Kodera',
        academy_tagline: 'Tagline',
        whatsapp_phone: '12',
        whatsapp_button_enabled: true,
        whatsapp_button_label: 'WhatsApp',
        whatsapp_message_template: 'Salam {{full_name}}',
        registration_enabled: true,
        default_public_modules_count: 2,
      },
    });
    expect(badSettings.status).toBe(400);

    // Empty PATCH must be rejected (prevents PostgREST empty update errors)
    const emptyPatch = await callApi({
      method: 'PATCH',
      url: `/api/admin/courses/${SEED_IDS.COURSE_PYTHON}`,
      token: adminToken,
      body: {},
    });
    expect(emptyPatch.status).toBe(400);
  });

  it('blocks admin self-suspension, admin-on-admin suspension, and PENDING approval bypass', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');
    const adminMe = await callApi({ url: '/api/auth/me', token: adminToken });
    const adminId = (adminMe.body as { data: { profile: { id: string } } }).data.profile.id;

    // Cannot suspend self
    const selfSuspend = await callApi({
      method: 'PATCH',
      url: `/api/admin/students/${adminId}/status`,
      token: adminToken,
      body: { account_status: 'suspended' },
    });
    expect(selfSuspend.status).toBe(403);

    // Cannot bypass application approval by directly setting PENDING student to active
    const pendingToken = await loginAs('pending@kodera.local', 'StudentPass123!');
    const pendingMe = await callApi({ url: '/api/auth/me', token: pendingToken });
    const pendingId = (pendingMe.body as { data: { profile: { id: string } } }).data.profile.id;

    const bypassRes = await callApi({
      method: 'PATCH',
      url: `/api/admin/students/${pendingId}/status`,
      token: adminToken,
      body: { account_status: 'active' },
    });
    expect(bypassRes.status).toBe(400);

    // PENDING student cannot mutate own profile before approval
    const pendingProfileEdit = await callApi({
      method: 'PATCH',
      url: '/api/student/profile',
      token: pendingToken,
      body: { full_name: 'Hacked Pending Name' },
    });
    expect(pendingProfileEdit.status).toBe(403);
  });

  it('revokes sandbox session on POST /api/auth/logout and rejects non-UUID route params cleanly', async () => {
    const studentToken = await loginAs('student@kodera.local', 'StudentPass123!');
    const logoutRes = await callApi({
      method: 'POST',
      url: '/api/auth/logout',
      token: studentToken,
    });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await callApi({ url: '/api/auth/me', token: studentToken });
    expect(afterLogout.status).toBe(401);

    // Non-UUID lesson ID is cleanly rejected at route matcher level (404, never reaches Postgres)
    const freshToken = await loginAs('student@kodera.local', 'StudentPass123!');
    const badUuid = await callApi({
      method: 'PUT',
      url: '/api/student/lessons/not-a-valid-uuid/progress',
      token: freshToken,
      body: { status: 'completed' },
    });
    expect(badUuid.status).toBe(404);
  });

  it('reconstructs Vercel rewritten __route URLs, sanitizes invalid X-Forwarded-For IPs, and rejects bad JSON bodies with 400', async () => {
    const mockReq = {
      method: 'GET',
      url: '/api/public?__route=courses/python-esaslari/lessons/proqramlasdirma-nedir&foo=bar',
      headers: {
        'x-forwarded-for': 'not-an-ip-spoof-' + 'x'.repeat(250),
        'user-agent': 'AuditTest/1.0',
      },
      socket: { remoteAddress: '10.0.0.5' },
    } as unknown as IncomingMessage;

    const parsed = await parseApiRequest(mockReq);
    expect(parsed.pathname).toBe(
      '/api/public/courses/python-esaslari/lessons/proqramlasdirma-nedir',
    );
    expect(parsed.query.get('__route')).toBeNull();
    expect(parsed.query.get('foo')).toBe('bar');
    // Invalid oversized X-Forwarded-For falls back cleanly to socket IP
    expect(parsed.ip).toBe('10.0.0.5');

    const trustedReq = {
      headers: { 'x-vercel-forwarded-for': '203.0.113.42, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as IncomingMessage;
    expect(getClientIp(trustedReq)).toBe('203.0.113.42');

    // Invalid pre-parsed JSON string throws HttpError 400 (NOT 500)
    await expect(
      readJsonBody({ body: '{invalid json' } as unknown as IncomingMessage),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_JSON' });

    // Throwing lazy req.body getter (Vercel Node runtime) throws HttpError 400 (NOT 500)
    const throwingReq = {} as IncomingMessage;
    Object.defineProperty(throwingReq, 'body', {
      get() {
        throw new SyntaxError('Invalid JSON');
      },
    });
    await expect(readJsonBody(throwingReq)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_JSON',
    });
  });

  it('strictly refuses LocalSandboxRepository when NODE_ENV === "production" or VERCEL === "1"', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origVercel = process.env.VERCEL;
    const origSandbox = process.env.KODERA_LOCAL_SANDBOX;
    const origUrl = process.env.SUPABASE_URL;
    try {
      process.env.NODE_ENV = 'production';
      process.env.KODERA_LOCAL_SANDBOX = 'true';
      process.env.SUPABASE_URL = '';
      resetRepositoryForTests(null);

      await expect(getRepository()).rejects.toThrow(/SERVER_MISCONFIGURED|konfiqurasiyası/i);

      process.env.NODE_ENV = 'development';
      process.env.VERCEL = '1';
      resetRepositoryForTests(null);

      await expect(getRepository()).rejects.toThrow(/SERVER_MISCONFIGURED|konfiqurasiyası/i);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.VERCEL = origVercel;
      process.env.KODERA_LOCAL_SANDBOX = origSandbox;
      process.env.SUPABASE_URL = origUrl;
      resetRepositoryForTests(null);
    }
  });

  it('verifies all 8 sequential SQL migrations, RLS policies, and audit hardening rules exist', () => {
    const migDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
    expect(files).toEqual([
      '20261123000001_extensions_enums_locales.sql',
      '20261123000002_identity_roles_applications.sql',
      '20261123000003_courses_modules_lessons_content.sql',
      '20261123000004_enrollments_progress_attempts.sql',
      '20261123000005_settings_audit_ratelimit.sql',
      '20261123000006_security_functions_rls_policies.sql',
      '20261123000007_audit_security_hardening_and_indexes.sql',
      '20261123000008_official_academy_contact_and_admin_stats.sql',
    ]);
    for (const file of files) {
      expect(file).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }

    const mig0008 = fs.readFileSync(
      path.join(migDir, '20261123000008_official_academy_contact_and_admin_stats.sql'),
      'utf8',
    );
    expect(mig0008).toContain('994702045610');
    expect(mig0008).toContain('muhammed.ehmedov94@gmail.com');
    expect(mig0008).toContain('Kodera Academy');
    expect(mig0008).toContain('get_admin_dashboard_stats');

    const rlsSql = fs.readFileSync(
      path.join(migDir, '20261123000006_security_functions_rls_policies.sql'),
      'utf8',
    );
    const sensitiveTables = [
      'supported_locales',
      'profiles',
      'user_roles',
      'applications',
      'application_notes',
      'courses',
      'modules',
      'lessons',
      'lesson_content_blocks',
      'exercises',
      'exercise_solutions',
      'exercise_test_cases',
      'quizzes',
      'quiz_questions',
      'quiz_question_options',
      'enrollments',
      'lesson_progress',
      'exercise_attempts',
      'quiz_attempts',
      'quiz_attempt_answers',
      'platform_settings',
      'audit_logs',
      'rate_limit_events',
    ];

    for (const table of sensitiveTables) {
      expect(rlsSql).toMatch(
        new RegExp(`ALTER TABLE public\\.${table}\\s+ENABLE ROW LEVEL SECURITY;`),
      );
    }

    // Verify Migration 0007 fixes all critical DB audit findings
    const mig0007 = fs.readFileSync(
      path.join(migDir, '20261123000007_audit_security_hardening_and_indexes.sql'),
      'utf8',
    );
    expect(mig0007).toContain("request.jwt.claims");
    expect(mig0007).toContain("'service_role'");
    expect(mig0007).toContain(
      'REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;',
    );
    expect(mig0007).toContain(
      'GRANT EXECUTE ON FUNCTION public.get_public_platform_settings() TO anon, authenticated, service_role;',
    );
    expect(mig0007).toContain('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;');
    expect(mig0007).toContain('review_application_atomic');
    expect(mig0007).toContain('trg_audit_logs_no_truncate');
    expect(mig0007).toContain('prevent_audit_log_truncate');

    // Verify supabase/config.toml configures [db.seed]
    const configToml = fs.readFileSync(path.resolve(process.cwd(), 'supabase/config.toml'), 'utf8');
    expect(configToml).toContain('[db.seed]');
    expect(configToml).toContain('01_python_intro_modules.sql');

    const seedFile = path.resolve(process.cwd(), 'supabase/seeds/01_python_intro_modules.sql');
    expect(fs.existsSync(seedFile)).toBe(true);
    expect(fs.statSync(seedFile).size).toBeGreaterThan(5000);
  });
});
