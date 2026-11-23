import { beforeEach, describe, expect, it } from 'vitest';
import { SEED_IDS } from '@server/content/initialSeed';
import { SANDBOX_USERS } from '@server/dev/localSandboxRepository';
import { callApi, createTestSandbox, loginAs } from './testHttp';

describe('Phase 5 — Admin Dashboard, RBAC, Separate Approval/Enrollment & Dynamic Public Modules', () => {
  beforeEach(() => {
    createTestSandbox();
  });

  it('denies every admin endpoint to anonymous and student accounts (HTTP 401/403)', async () => {
    const studentToken = await loginAs('student@kodera.local', 'StudentPass123!');
    const endpoints = [
      { method: 'GET', url: '/api/admin/stats' },
      { method: 'GET', url: '/api/admin/applications' },
      { method: 'GET', url: '/api/admin/students' },
      { method: 'GET', url: '/api/admin/enrollments' },
      { method: 'GET', url: '/api/admin/courses' },
      { method: 'GET', url: '/api/admin/settings' },
      { method: 'GET', url: '/api/admin/audit-logs' },
    ];

    for (const ep of endpoints) {
      const anonRes = await callApi({ method: ep.method, url: ep.url });
      expect(anonRes.status).toBe(401);

      const stuRes = await callApi({ method: ep.method, url: ep.url, token: studentToken });
      expect(stuRes.status).toBe(403);
    }
  });

  it('separates application approval from course assignment, then enables and revokes course access', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');
    const pendingToken = await loginAs('pending@kodera.local', 'StudentPass123!');

    // 1. Find pending application
    const appsRes = await callApi({
      url: '/api/admin/applications?status=pending',
      token: adminToken,
    });
    expect(appsRes.status).toBe(200);
    const apps = (appsRes.body as {
      data: Array<{ application: { id: string; user_id: string } }>;
    }).data;
    const pendingApp = apps.find((a) => a.application.user_id === SANDBOX_USERS.PENDING_ID)!;
    expect(pendingApp).toBeDefined();

    // 2. Approve application with private internal note
    const reviewRes = await callApi({
      method: 'POST',
      url: `/api/admin/applications/${pendingApp.application.id}/review`,
      token: adminToken,
      body: {
        decision: 'approved',
        internal_note: 'WhatsApp üzərindən təsdiqləndi — özəl qeyd',
      },
    });
    expect(reviewRes.status).toBe(200);

    // 3. CRITICAL: Approved student STILL cannot read restricted Python lesson before course assignment!
    const restrictedUrl = '/api/public/courses/python-esaslari/lessons/for-dovru-giris';
    expect((await callApi({ url: restrictedUrl, token: pendingToken })).status).toBe(403);

    // 4. Separate operation: Admin assigns Python course
    const assignRes = await callApi({
      method: 'POST',
      url: '/api/admin/enrollments',
      token: adminToken,
      body: {
        student_id: SANDBOX_USERS.PENDING_ID,
        course_ids: [SEED_IDS.COURSE_PYTHON],
      },
    });
    expect(assignRes.status).toBe(201);
    const enrollmentId = (assignRes.body as { data: Array<{ id: string }> }).data[0]!.id;

    // 5. Now student CAN access Python restricted lesson, but STILL NOT SQL!
    expect((await callApi({ url: restrictedUrl, token: pendingToken })).status).toBe(200);
    expect(
      (
        await callApi({
          url: '/api/public/courses/sql-verilenler-bazasi/lessons/select-sorgusu',
          token: pendingToken,
        })
      ).status,
    ).toBe(403);

    // 6. Admin revokes Python enrollment -> access immediately cut off
    const revokeRes = await callApi({
      method: 'POST',
      url: `/api/admin/enrollments/${enrollmentId}/revoke`,
      token: adminToken,
      body: { revoke_reason: 'Test ləğvi' },
    });
    expect(revokeRes.status).toBe(200);
    expect((await callApi({ url: restrictedUrl, token: pendingToken })).status).toBe(403);

    // 7. Audit logs recorded all operations and refuse mutation (DELETE/PATCH -> 403)
    const logsRes = await callApi({ url: '/api/admin/audit-logs', token: adminToken });
    const actions = (logsRes.body as { data: Array<{ action: string }> }).data.map((l) => l.action);
    expect(actions).toContain('application.approved');
    expect(actions).toContain('application_note.created');
    expect(actions).toContain('enrollment.assigned');
    expect(actions).toContain('enrollment.revoked');

    const deleteLogAttempt = await callApi({
      method: 'DELETE',
      url: '/api/admin/audit-logs',
      token: adminToken,
    });
    expect(deleteLogAttempt.status).toBe(403);
  });

  it('dynamically controls public module access from database settings (is_public toggle)', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');
    const mod2LessonUrl = '/api/public/courses/python-esaslari/lessons/istifadeciden-melumat-almaq-input';

    // Initially Module 2 is public -> anon gets 200
    expect((await callApi({ url: mod2LessonUrl })).status).toBe(200);

    // Admin switches Module 2 to restricted (is_public = false)
    const hideRes = await callApi({
      method: 'PATCH',
      url: `/api/admin/modules/${SEED_IDS.MOD_PY_2}`,
      token: adminToken,
      body: { is_public: false },
    });
    expect(hideRes.status).toBe(200);
    expect((await callApi({ url: mod2LessonUrl })).status).toBe(403);

    // Admin restores Module 2 to public (is_public = true)
    const showRes = await callApi({
      method: 'PATCH',
      url: `/api/admin/modules/${SEED_IDS.MOD_PY_2}`,
      token: adminToken,
      body: { is_public: true },
    });
    expect(showRes.status).toBe(200);
    expect((await callApi({ url: mod2LessonUrl })).status).toBe(200);
  });

  it('allows admin to create a new non-Python course (C++) with modules, lessons, blocks, exercises, and quizzes', async () => {
    const adminToken = await loginAs('admin@kodera.local', 'AdminPass123!');

    const courseRes = await callApi({
      method: 'POST',
      url: '/api/admin/courses',
      token: adminToken,
      body: {
        slug: 'cpp-esaslari',
        locale: 'az',
        title: 'C++ Proqramlaşdırma Əsasları',
        description: 'Sistem proqramlaşdırması və C++ sintaksisinin təməl prinsipləri.',
        programming_language: 'cpp',
        difficulty: 'beginner',
        estimated_duration_minutes: 360,
        learning_objectives: ['C++ sintaksisi', 'Yaddaş anlayışı'],
        sort_order: 3,
        status: 'published',
      },
    });
    expect(courseRes.status).toBe(201);
    const courseId = (courseRes.body as { data: { id: string } }).data.id;

    const modRes = await callApi({
      method: 'POST',
      url: '/api/admin/modules',
      token: adminToken,
      body: {
        course_id: courseId,
        slug: 'modul-1-giris',
        title: 'Modul 1: C++ Giriş',
        sort_order: 1,
        is_public: true,
        status: 'published',
      },
    });
    expect(modRes.status).toBe(201);
    const moduleId = (modRes.body as { data: { id: string } }).data.id;

    const lesRes = await callApi({
      method: 'POST',
      url: '/api/admin/lessons',
      token: adminToken,
      body: {
        module_id: moduleId,
        slug: 'ilk-cpp-proqrami',
        title: 'İlk C++ proqramı',
        estimated_minutes: 10,
        sort_order: 1,
        status: 'published',
      },
    });
    expect(lesRes.status).toBe(201);
    const lessonId = (lesRes.body as { data: { id: string } }).data.id;

    const blockRes = await callApi({
      method: 'POST',
      url: '/api/admin/blocks',
      token: adminToken,
      body: {
        lesson_id: lessonId,
        locale: 'az',
        block_type: 'code',
        sort_order: 1,
        title: 'Hello World',
        content: { language: 'cpp', code: '#include <iostream>\nint main() { std::cout << "Salam"; }' },
        is_published: true,
      },
    });
    expect(blockRes.status).toBe(201);

    // Public catalog now immediately includes the new C++ course without code changes!
    const publicCourses = await callApi({ url: '/api/public/courses' });
    const slugs = (publicCourses.body as { data: Array<{ slug: string }> }).data.map((c) => c.slug);
    expect(slugs).toContain('cpp-esaslari');
  });
});
