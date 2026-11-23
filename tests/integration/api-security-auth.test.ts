import { beforeEach, describe, expect, it } from 'vitest';
import { SEED_IDS } from '@server/content/initialSeed';
import { callApi, createTestSandbox, loginAs } from './testHttp';

describe('Phase 4 — Auth, Registration, RBAC & WhatsApp Security Integration Tests', () => {
  beforeEach(() => {
    createTestSandbox();
  });

  it('registers a student in PENDING state with unique KDR reference code and ignores spoofed admin role', async () => {
    const res = await callApi({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        full_name: 'Leyla Məmmədli',
        email: 'leyla@example.com',
        password: 'Password123',
        phone: '+994 50 555 44 33',
        learning_goals: 'Python öyrənmək istəyirəm',
        // Attacker attempts privilege escalation during registration:
        role: 'admin',
        account_status: 'active',
        isAdmin: true,
      },
    });

    expect(res.status).toBe(201);
    const data = (res.body as {
      data: {
        access_token: string;
        reference_code: string;
        user: {
          isAdmin: boolean;
          isActiveStudent: boolean;
          roles: string[];
          profile: { account_status: string };
          application: { status: string; reference_code: string };
        };
      };
    }).data;

    expect(data.reference_code).toMatch(/^KDR-\d{4}-[2-9A-HJ-NP-Z]{6}$/);
    expect(data.user.isAdmin).toBe(false);
    expect(data.user.isActiveStudent).toBe(false);
    expect(data.user.roles).toEqual(['student']);
    expect(data.user.profile.account_status).toBe('pending');
    expect(data.user.application.status).toBe('pending');

    // Newly registered PENDING student cannot access student dashboard or admin APIs
    const studentCourses = await callApi({
      url: '/api/student/courses',
      token: data.access_token,
    });
    expect(studentCourses.status).toBe(403);

    const adminStats = await callApi({
      url: '/api/admin/stats',
      token: data.access_token,
    });
    expect(adminStats.status).toBe(403);
  });

  it('blocks registration spam via server-side rate limiting (HTTP 429)', async () => {
    let lastStatus = 201;
    for (let i = 0; i < 12; i++) {
      const res = await callApi({
        method: 'POST',
        url: '/api/auth/register',
        ip: '198.51.100.77',
        body: {
          full_name: `Spam User ${i}`,
          email: `spam${i}@example.com`,
          password: 'Password123',
        },
      });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('blocks anonymous, PENDING, REJECTED, SUSPENDED, and unassigned APPROVED users from restricted lessons', async () => {
    const restrictedUrl = '/api/public/courses/python-esaslari/lessons/for-dovru-giris';

    // Anonymous
    const anonRes = await callApi({ url: restrictedUrl });
    expect(anonRes.status).toBe(403);

    // PENDING
    const pendingToken = await loginAs('pending@kodera.local', 'StudentPass123!');
    expect((await callApi({ url: restrictedUrl, token: pendingToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: pendingToken })).status).toBe(403);

    // REJECTED
    const rejectedToken = await loginAs('rejected@kodera.local', 'StudentPass123!');
    expect((await callApi({ url: restrictedUrl, token: rejectedToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: rejectedToken })).status).toBe(403);

    // SUSPENDED (even though Python enrollment exists!)
    const suspendedToken = await loginAs('suspended@kodera.local', 'StudentPass123!');
    expect((await callApi({ url: restrictedUrl, token: suspendedToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: suspendedToken })).status).toBe(403);

    // APPROVED with 0 assigned courses
    const noCourseToken = await loginAs('approved-nocourse@kodera.local', 'StudentPass123!');
    expect((await callApi({ url: restrictedUrl, token: noCourseToken })).status).toBe(403);
    const emptyCourses = await callApi({ url: '/api/student/courses', token: noCourseToken });
    expect(emptyCourses.status).toBe(200);
    expect((emptyCourses.body as { data: unknown[] }).data).toEqual([]);
  });

  it('prevents students from altering account_status or accessing admin routes', async () => {
    const pendingToken = await loginAs('pending@kodera.local', 'StudentPass123!');
    const tamperRes = await callApi({
      method: 'PATCH',
      url: '/api/student/profile',
      token: pendingToken,
      body: {
        full_name: 'Nigar Həsənova',
        account_status: 'active',
      },
    });
    expect(tamperRes.status).toBe(400);

    const studentToken = await loginAs('student@kodera.local', 'StudentPass123!');
    const enrollAttempt = await callApi({
      method: 'POST',
      url: '/api/admin/enrollments',
      token: studentToken,
      body: {
        student_id: '90000000-0000-4000-8000-000000000002',
        course_ids: [SEED_IDS.COURSE_SQL],
      },
    });
    expect(enrollAttempt.status).toBe(403);
  });

  it('returns identical neutral response on forgot-password to prevent email enumeration', async () => {
    const existing = await callApi({
      method: 'POST',
      url: '/api/auth/forgot-password',
      ip: '198.51.100.10',
      body: { email: 'student@kodera.local' },
    });
    const nonExisting = await callApi({
      method: 'POST',
      url: '/api/auth/forgot-password',
      ip: '198.51.100.11',
      body: { email: 'does-not-exist@example.com' },
    });
    expect(existing.status).toBe(200);
    expect(nonExisting.status).toBe(200);
    expect(existing.body).toEqual(nonExisting.body);
  });

  it('masks WhatsApp phone number in public settings when admin disables the button', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');

    const before = await callApi({ url: '/api/public/settings' });
    expect((before.body as { data: { whatsapp_button_enabled: boolean; whatsapp_phone: string } }).data.whatsapp_button_enabled).toBe(true);
    expect((before.body as { data: { whatsapp_phone: string } }).data.whatsapp_phone).toBe('994501234567');

    const disableRes = await callApi({
      method: 'PUT',
      url: '/api/admin/settings',
      token: adminToken,
      body: {
        academy_name: 'Kodera',
        academy_tagline: 'Proqramlaşdırmanı sadə, aydın və praktik öyrən',
        logo_storage_path: null,
        contact_email: 'info@kodera.academy',
        whatsapp_phone: '994501234567',
        whatsapp_button_enabled: false,
        whatsapp_button_label: 'WhatsApp ilə administratora yaz',
        whatsapp_message_template:
          'Salam! {{academy_name}} müraciəti: {{full_name}}, {{email}}, {{reference_code}}',
        alternative_contact_text: 'Email vasitəsilə əlaqə saxlayın.',
        registration_enabled: true,
        default_public_modules_count: 2,
      },
    });
    expect(disableRes.status).toBe(200);

    const after = await callApi({ url: '/api/public/settings' });
    const afterData = (after.body as {
      data: { whatsapp_button_enabled: boolean; whatsapp_phone: string | null };
    }).data;
    expect(afterData.whatsapp_button_enabled).toBe(false);
    expect(afterData.whatsapp_phone).toBeNull();
  });
});
