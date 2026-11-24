import { beforeEach, describe, expect, it } from 'vitest';
import { getEphemeralSandboxPassword } from '@server/dev/localSandboxRepository';
import { SEED_IDS } from '@server/content/initialSeed';
import { callApi, createTestSandbox, loginAdminAs, loginAs } from './testHttp';

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
    const pendingToken = await loginAs('pending@kodera.local');
    expect((await callApi({ url: restrictedUrl, token: pendingToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: pendingToken })).status).toBe(403);

    // REJECTED
    const rejectedToken = await loginAs('rejected@kodera.local');
    expect((await callApi({ url: restrictedUrl, token: rejectedToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: rejectedToken })).status).toBe(403);

    // SUSPENDED (even though Python enrollment exists!)
    const suspendedToken = await loginAs('suspended@kodera.local');
    expect((await callApi({ url: restrictedUrl, token: suspendedToken })).status).toBe(403);
    expect((await callApi({ url: '/api/student/courses', token: suspendedToken })).status).toBe(403);

    // APPROVED with 0 assigned courses
    const noCourseToken = await loginAs('approved-nocourse@kodera.local');
    expect((await callApi({ url: restrictedUrl, token: noCourseToken })).status).toBe(403);
    const emptyCourses = await callApi({ url: '/api/student/courses', token: noCourseToken });
    expect(emptyCourses.status).toBe(200);
    expect((emptyCourses.body as { data: unknown[] }).data).toEqual([]);
  });

  it('prevents students from altering account_status or accessing admin routes', async () => {
    const pendingToken = await loginAs('pending@kodera.local');
    const pendingProfileRes = await callApi({
      method: 'PATCH',
      url: '/api/student/profile',
      token: pendingToken,
      body: {
        full_name: 'Nigar Həsənova',
        account_status: 'active',
      },
    });
    expect(pendingProfileRes.status).toBe(403);

    const studentToken = await loginAs('student@kodera.local');
    const activeTamperRes = await callApi({
      method: 'PATCH',
      url: '/api/student/profile',
      token: studentToken,
      body: {
        full_name: 'Tural Əliyev',
        account_status: 'suspended',
      },
    });
    expect(activeTamperRes.status).toBe(400);

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
    const adminToken = await loginAdminAs('koderaaz@gmail.com');

    const before = await callApi({ url: '/api/public/settings' });
    const beforeData = (
      before.body as {
        data: {
          academy_name: string;
          contact_email: string;
          email_sender_name: string;
          website_domain: string | null;
          whatsapp_button_enabled: boolean;
          whatsapp_phone: string;
        };
      }
    ).data;
    expect(beforeData.academy_name).toBe('Kodera Academy');
    expect(beforeData.contact_email).toBe('muhammed.ehmedov94@gmail.com');
    expect(beforeData.email_sender_name).toBe('Kodera Academy');
    expect(beforeData.website_domain).toBeNull();
    expect(beforeData.whatsapp_button_enabled).toBe(true);
    expect(beforeData.whatsapp_phone).toBe('994702045610');

    const disableRes = await callApi({
      method: 'PUT',
      url: '/api/admin/settings',
      token: adminToken,
      body: {
        academy_name: 'Kodera Academy',
        academy_tagline: 'Proqramlaşdırmanı sadə, aydın və praktik öyrən',
        logo_storage_path: null,
        admin_login_email: 'koderaaz@gmail.com',
        contact_email: 'muhammed.ehmedov94@gmail.com',
        email_sender_name: 'Kodera Academy',
        website_domain: null,
        whatsapp_phone: '994702045610',
        whatsapp_button_enabled: false,
        whatsapp_button_label: 'WhatsApp ilə administratora yaz',
        whatsapp_message_template:
          'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
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

  it('strictly separates student login (/api/auth/login) and admin login (/api/auth/admin-login) and separates admin_login_email from public contact_email', async () => {
    const secret = getEphemeralSandboxPassword();

    // 1. Admin account (koderaaz@gmail.com) is rejected on student login endpoint (/api/auth/login)
    const adminOnStudentLogin = await callApi({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'koderaaz@gmail.com', password: secret },
    });
    expect(adminOnStudentLogin.status).toBe(401);

    // 2. Student account (student@kodera.local) is rejected on admin login endpoint (/api/auth/admin-login)
    const studentOnAdminLogin = await callApi({
      method: 'POST',
      url: '/api/auth/admin-login',
      body: { email: 'student@kodera.local', password: secret },
    });
    expect(studentOnAdminLogin.status).toBe(401);

    // 3. Student token is rejected on /api/auth/admin-verify (403)
    const studentToken = await loginAs('student@kodera.local');
    const studentAdminVerify = await callApi({
      method: 'POST',
      url: '/api/auth/admin-verify',
      token: studentToken,
    });
    expect(studentAdminVerify.status).toBe(403);

    // 4. Admin token succeeds on /api/auth/admin-verify (200) and is rejected on student dashboard endpoints (403)
    const adminToken = await loginAdminAs('koderaaz@gmail.com');
    const adminVerify = await callApi({
      method: 'POST',
      url: '/api/auth/admin-verify',
      token: adminToken,
    });
    expect(adminVerify.status).toBe(200);

    const adminOnStudentCourses = await callApi({
      url: '/api/student/courses',
      token: adminToken,
    });
    expect(adminOnStudentCourses.status).toBe(403);

    // 5. Admin settings contains admin_login_email='koderaaz@gmail.com' and contact_email='muhammed.ehmedov94@gmail.com',
    // while public settings NEVER exposes admin_login_email
    const adminSettingsRes = await callApi({
      url: '/api/admin/settings',
      token: adminToken,
    });
    expect(adminSettingsRes.status).toBe(200);
    const adminSettings = (
      adminSettingsRes.body as {
        data: { admin_login_email: string; contact_email: string; email_sender_name: string };
      }
    ).data;
    expect(adminSettings.admin_login_email).toBe('koderaaz@gmail.com');
    expect(adminSettings.contact_email).toBe('muhammed.ehmedov94@gmail.com');
    expect(adminSettings.email_sender_name).toBe('Kodera Academy');

    const publicSettingsRes = await callApi({ url: '/api/public/settings' });
    const publicSettings = (publicSettingsRes.body as { data: Record<string, unknown> }).data;
    expect(publicSettings.contact_email).toBe('muhammed.ehmedov94@gmail.com');
    expect(publicSettings).not.toHaveProperty('admin_login_email');
  });
});
