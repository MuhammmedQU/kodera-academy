import { beforeEach, describe, expect, it } from 'vitest';
import { SEED_IDS } from '@server/content/initialSeed';
import { callApi, createTestSandbox, loginAs } from './testHttp';

describe('Phase 6 — Student Dashboard, Course Isolation, Progress & Quiz Grading Security', () => {
  beforeEach(() => {
    createTestSandbox();
  });

  it('shows student ONLY their assigned course (Python) and blocks unassigned course (SQL)', async () => {
    const token = await loginAs('student@kodera.local');

    const listRes = await callApi({ url: '/api/student/courses', token });
    expect(listRes.status).toBe(200);
    const courses = (listRes.body as { data: Array<{ course: { slug: string } }> }).data;
    expect(courses.map((c) => c.course.slug)).toEqual(['python-esaslari']);

    // Assigned course curriculum succeeds
    const pyRes = await callApi({ url: '/api/student/courses/python-esaslari', token });
    expect(pyRes.status).toBe(200);

    // Unassigned course curriculum returns 403
    const sqlRes = await callApi({ url: '/api/student/courses/sql-verilenler-bazasi', token });
    expect(sqlRes.status).toBe(403);
  });

  it('never leaks quiz answer keys (is_correct) or exercise solutions in lesson payload, and grades strictly server-side', async () => {
    const token = await loginAs('student@kodera.local');

    const lessonRes = await callApi({
      url: '/api/student/courses/python-esaslari/lessons/ilk-python-kodu-print',
      token,
    });
    expect(lessonRes.status).toBe(200);
    const rawJson = JSON.stringify(lessonRes.body);
    expect(rawJson).not.toContain('is_correct');
    expect(rawJson).not.toContain('solution_code');

    // Submit wrong option -> server calculates 0%
    const wrongSubmit = await callApi({
      method: 'POST',
      url: `/api/student/quizzes/${SEED_IDS.QUIZ_PY_1_2}/submit`,
      token,
      body: {
        answers: [
          {
            question_id: SEED_IDS.Q_PY_1_2_1,
            selected_option_ids: [SEED_IDS.OPT_PY_1_2_1B],
          },
        ],
      },
    });
    expect(wrongSubmit.status).toBe(201);
    const wrongData = (wrongSubmit.body as {
      data: { score_percent: number; is_passed: boolean; feedback: Array<{ explanation: string }> };
    }).data;
    expect(wrongData.score_percent).toBe(0);
    expect(wrongData.is_passed).toBe(false);
    expect(wrongData.feedback[0]?.explanation).toBeTruthy();

    // Submit correct option -> server calculates 100%
    const rightSubmit = await callApi({
      method: 'POST',
      url: `/api/student/quizzes/${SEED_IDS.QUIZ_PY_1_2}/submit`,
      token,
      body: {
        answers: [
          {
            question_id: SEED_IDS.Q_PY_1_2_1,
            selected_option_ids: [SEED_IDS.OPT_PY_1_2_1A],
          },
        ],
      },
    });
    expect(rightSubmit.status).toBe(201);
    const rightData = (rightSubmit.body as { data: { score_percent: number; is_passed: boolean } })
      .data;
    expect(rightData.score_percent).toBe(100);
    expect(rightData.is_passed).toBe(true);
  });

  it('tracks lesson completion and blocks progress writes for unassigned courses', async () => {
    const token = await loginAs('student@kodera.local');

    // Complete assigned Python lesson -> 200
    const completeRes = await callApi({
      method: 'PUT',
      url: `/api/student/lessons/${SEED_IDS.LES_PY_1_1}/progress`,
      token,
      body: { status: 'completed' },
    });
    expect(completeRes.status).toBe(200);

    // Attempt to mark unassigned SQL lesson completed -> 403
    const sqlProg = await callApi({
      method: 'PUT',
      url: `/api/student/lessons/${SEED_IDS.LES_SQL_1_1}/progress`,
      token,
      body: { status: 'completed' },
    });
    expect(sqlProg.status).toBe(403);

    // Progress overview reflects 1 completed lesson
    const overview = await callApi({ url: '/api/student/progress', token });
    expect(overview.status).toBe(200);
    const completed = (overview.body as { data: { completed_lessons: unknown[] } }).data
      .completed_lessons;
    expect(completed).toHaveLength(1);
  });
});
