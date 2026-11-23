import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getRepository, resetRepositoryForTests } from '@server/lib/getRepository';
import { callApi, createTestSandbox, loginAs } from './testHttp';

describe('Phase 10 — Extended Security Audit & Static SQL RLS Verification', () => {
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

  it('rejects malformed input payloads via strict Zod schemas (HTTP 400)', async () => {
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
        whatsapp_phone: '12', // invalid E.164 digits
        whatsapp_button_enabled: true,
        whatsapp_button_label: 'WhatsApp',
        whatsapp_message_template: 'Salam {{full_name}}',
        registration_enabled: true,
        default_public_modules_count: 2,
      },
    });
    expect(badSettings.status).toBe(400);
  });

  it('strictly refuses LocalSandboxRepository when NODE_ENV === "production"', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSandbox = process.env.KODERA_LOCAL_SANDBOX;
    const origUrl = process.env.SUPABASE_URL;
    try {
      process.env.NODE_ENV = 'production';
      process.env.KODERA_LOCAL_SANDBOX = 'true';
      process.env.SUPABASE_URL = '';
      resetRepositoryForTests(null);

      expect(() => getRepository()).toThrow(/SERVER_MISCONFIGURED|konfiqurasiyası/i);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.KODERA_LOCAL_SANDBOX = origSandbox;
      process.env.SUPABASE_URL = origUrl;
      resetRepositoryForTests(null);
    }
  });

  it('verifies all 6 sequential SQL migrations and strict RLS policies exist on every table', () => {
    const migDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
    expect(files).toEqual([
      '202611230001_extensions_enums_locales.sql',
      '202611230002_identity_roles_applications.sql',
      '202611230003_courses_modules_lessons_content.sql',
      '202611230004_enrollments_progress_attempts.sql',
      '202611230005_settings_audit_ratelimit.sql',
      '202611230006_security_functions_rls_policies.sql',
    ]);

    const rlsSql = fs.readFileSync(
      path.join(migDir, '202611230006_security_functions_rls_policies.sql'),
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
      expect(rlsSql).toMatch(new RegExp(`ALTER TABLE public\\.${table}\\s+ENABLE ROW LEVEL SECURITY;`));
    }

    const mig0002 = fs.readFileSync(
      path.join(migDir, '202611230002_identity_roles_applications.sql'),
      'utf8',
    );
    expect(mig0002).toContain('guard_profile_sensitive_columns');
    expect(mig0002).toContain('handle_new_user');

    const mig0005 = fs.readFileSync(
      path.join(migDir, '202611230005_settings_audit_ratelimit.sql'),
      'utf8',
    );
    expect(mig0005).toContain('prevent_audit_log_mutation');

    const seedFile = path.resolve(process.cwd(), 'supabase/seeds/01_python_intro_modules.sql');
    expect(fs.existsSync(seedFile)).toBe(true);
    expect(fs.statSync(seedFile).size).toBeGreaterThan(5000);
  });
});
