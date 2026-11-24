import { beforeEach, describe, expect, it } from 'vitest';
import type { AdminDashboardStats } from '@shared/types/domain';
import { SEED_IDS } from '@server/content/initialSeed';
import { callApi, createTestSandbox, loginAdminAs, loginAs } from './testHttp';

describe('Phase 5 — Admin Dashboard, RBAC, Separate Approval/Enrollment & Dynamic Public Modules', () => {
  beforeEach(() => {
    createTestSandbox();
  });

  it('denies every admin endpoint to anonymous and student accounts (HTTP 401/403)', async () => {
    const studentToken = await loginAs('student@kodera.local');
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

  it('starts with 0 fake statistics, separates approval from course assignment, and updates real stats dynamically', async () => {
    const adminToken = await loginAdminAs('koderaaz@gmail.com');

    // 0. Before any real student registers, dashboard statistics MUST show 0 (demo fixtures never contaminate stats!)
    const initialStatsRes = await callApi({ url: '/api/admin/stats', token: adminToken });
    expect(initialStatsRes.status).toBe(200);
    const initialStats = (initialStatsRes.body as { data: AdminDashboardStats }).data;
    expect(initialStats.total_registered_users).toBe(0);
    expect(initialStats.pending_applications).toBe(0);
    expect(initialStats.approved_applications).toBe(0);
    expect(initialStats.rejected_applications).toBe(0);
    expect(initialStats.active_students).toBe(0);
    expect(initialStats.suspended_accounts).toBe(0);
    expect(initialStats.active_enrollments).toBe(0);
    expect(initialStats.completed_lessons).toBe(0);
    expect(initialStats.published_courses).toBe(2);
    expect(initialStats.total_modules).toBe(4);
    expect(initialStats.published_lessons).toBe(10);
    expect(initialStats.recent_audit_logs).toEqual([]);

    // 1. Register a real student applicant
    const regRes = await callApi({
      method: 'POST',
      url: '/api/auth/register',
      ip: '198.51.100.44',
      body: {
        full_name: 'Nərgiz Hüseynova',
        email: 'nergiz.huseynova@gmail.com',
        password: 'Password123!',
        phone: '+994 70 204 56 10',
        learning_goals: 'Python öyrənmək',
      },
    });
    expect(regRes.status).toBe(201);
    const regData = (
      regRes.body as {
        data: { access_token: string; user: { profile: { id: string } } };
      }
    ).data;
    const applicantToken = regData.access_token;
    const applicantId = regData.user.profile.id;

    // Dashboard stats now reflect 1 registered user and 1 pending application
    const afterRegStats = (
      (await callApi({ url: '/api/admin/stats', token: adminToken })).body as {
        data: AdminDashboardStats;
      }
    ).data;
    expect(afterRegStats.total_registered_users).toBe(1);
    expect(afterRegStats.pending_applications).toBe(1);
    expect(afterRegStats.active_students).toBe(0);

    // Find pending application
    const appsRes = await callApi({
      url: '/api/admin/applications?status=pending',
      token: adminToken,
    });
    expect(appsRes.status).toBe(200);
    const apps = (
      appsRes.body as {
        data: Array<{ application: { id: string; user_id: string } }>;
      }
    ).data;
    const pendingApp = apps.find((a) => a.application.user_id === applicantId)!;
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

    // Stats update: 0 pending, 1 approved, 1 active student, still 0 active enrollments
    const afterApproveStats = (
      (await callApi({ url: '/api/admin/stats', token: adminToken })).body as {
        data: AdminDashboardStats;
      }
    ).data;
    expect(afterApproveStats.pending_applications).toBe(0);
    expect(afterApproveStats.approved_applications).toBe(1);
    expect(afterApproveStats.active_students).toBe(1);
    expect(afterApproveStats.active_enrollments).toBe(0);

    // 3. CRITICAL: Approved student STILL cannot read restricted Python lesson before course assignment!
    const restrictedUrl = '/api/public/courses/python-esaslari/lessons/for-dovru-giris';
    expect((await callApi({ url: restrictedUrl, token: applicantToken })).status).toBe(403);

    // 4. Separate operation: Admin assigns Python course
    const assignRes = await callApi({
      method: 'POST',
      url: '/api/admin/enrollments',
      token: adminToken,
      body: {
        student_id: applicantId,
        course_ids: [SEED_IDS.COURSE_PYTHON],
      },
    });
    expect(assignRes.status).toBe(201);
    const enrollmentId = (assignRes.body as { data: Array<{ id: string }> }).data[0]!.id;

    // 5. Now student CAN access Python restricted lesson, but STILL NOT SQL!
    expect((await callApi({ url: restrictedUrl, token: applicantToken })).status).toBe(200);
    expect(
      (
        await callApi({
          url: '/api/public/courses/sql-verilenler-bazasi/lessons/select-sorgusu',
          token: applicantToken,
        })
      ).status,
    ).toBe(403);

    // Student completes a lesson -> completed_lessons and active_enrollments both equal 1
    const progRes = await callApi({
      method: 'PUT',
      url: `/api/student/lessons/${SEED_IDS.LES_PY_1_1}/progress`,
      token: applicantToken,
      body: { status: 'completed' },
    });
    expect(progRes.status).toBe(200);

    const afterEnrollStats = (
      (await callApi({ url: '/api/admin/stats', token: adminToken })).body as {
        data: AdminDashboardStats;
      }
    ).data;
    expect(afterEnrollStats.active_enrollments).toBe(1);
    expect(afterEnrollStats.completed_lessons).toBe(1);

    // 6. Admin revokes Python enrollment -> access immediately cut off & active_enrollments drops to 0
    const revokeRes = await callApi({
      method: 'POST',
      url: `/api/admin/enrollments/${enrollmentId}/revoke`,
      token: adminToken,
      body: { revoke_reason: 'Test ləğvi' },
    });
    expect(revokeRes.status).toBe(200);
    expect((await callApi({ url: restrictedUrl, token: applicantToken })).status).toBe(403);
    const afterRevokeStats = (
      (await callApi({ url: '/api/admin/stats', token: adminToken })).body as {
        data: AdminDashboardStats;
      }
    ).data;
    expect(afterRevokeStats.active_enrollments).toBe(0);

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
    const adminToken = await loginAdminAs('koderaaz@gmail.com');
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
    const adminToken = await loginAdminAs('koderaaz@gmail.com');

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
