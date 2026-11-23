import type { ServerResponse } from 'node:http';
import {
  exerciseAttemptCreateSchema,
  lessonProgressUpdateSchema,
  profileUpdateSchema,
  quizSubmitSchema,
} from '../../src/shared/validation/schemas.js';
import { requireActiveStudent, requireAuthenticated } from '../lib/auth.js';
import { HttpError, sendJson, type ApiRequest } from '../lib/http.js';
import type { KoderaRepository } from '../lib/repository.js';

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const LESSON_PROGRESS_RE = new RegExp(`^lessons/(${UUID_PATTERN})/progress$`, 'i');
const EXERCISE_ATTEMPT_RE = new RegExp(`^exercises/(${UUID_PATTERN})/attempts$`, 'i');
const QUIZ_SUBMIT_RE = new RegExp(`^quizzes/(${UUID_PATTERN})/submit$`, 'i');

export async function handleStudentRoute(
  req: ApiRequest,
  res: ServerResponse,
  repo: KoderaRepository,
): Promise<void> {
  const subPath = req.pathname.replace(/^\/api\/student\/?/, '').replace(/\/$/, '');

  // PATCH /api/student/profile — strictly ACTIVE users only, rate-limited
  if (req.method === 'PATCH' && subPath === 'profile') {
    const { user } = await requireAuthenticated(req, repo);
    if (user.profile.account_status !== 'active') {
      throw new HttpError(
        403,
        'ACCOUNT_NOT_ACTIVE',
        'Profil məlumatları yalnız aktiv hesablar tərəfindən yenilənə bilər.',
      );
    }
    const allowed = await repo.checkRateLimit(`profile:${user.profile.id}`, 'profile_update', 60, 20);
    if (!allowed) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox tez-tez profil yeniləmə sorğusu göndərirsiniz.');
    }
    const input = profileUpdateSchema.parse(req.body);
    const updated = await repo.updateOwnProfile(user.profile.id, input);
    sendJson(res, 200, updated);
    return;
  }

  // All remaining student LMS routes strictly require an APPROVED + active student account
  const { user, token } = await requireActiveStudent(req, repo);

  // GET /api/student/courses
  if (req.method === 'GET' && subPath === 'courses') {
    const courses = await repo.listStudentCourses(user.profile.id);
    sendJson(res, 200, courses);
    return;
  }

  // GET /api/student/progress
  if (req.method === 'GET' && subPath === 'progress') {
    const overview = await repo.getStudentProgressOverview(user.profile.id);
    sendJson(res, 200, overview);
    return;
  }

  // GET /api/student/courses/:slug
  const courseMatch = subPath.match(/^courses\/([a-z0-9-]+)$/);
  if (req.method === 'GET' && courseMatch) {
    const detail = await repo.getCourseBySlug(courseMatch[1]!, user);
    if (!detail) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Kurs tapılmadı.');
    if (!detail.is_enrolled) {
      throw new HttpError(
        403,
        'COURSE_NOT_ASSIGNED',
        'Bu kurs hesabınıza təyin edilməyib. Yalnız administrator tərəfindən təyin edilən kurslara daxil ola bilərsiniz.',
      );
    }
    sendJson(res, 200, detail);
    return;
  }

  // GET /api/student/courses/:slug/lessons/:lessonSlug
  const lessonMatch = subPath.match(/^courses\/([a-z0-9-]+)\/lessons\/([a-z0-9-]+)$/);
  if (req.method === 'GET' && lessonMatch) {
    const resLesson = await repo.getLessonView(lessonMatch[1]!, lessonMatch[2]!, user);
    if (resLesson.status === 'not_found') {
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    }
    if (resLesson.status === 'forbidden' || !resLesson.payload.is_enrolled) {
      throw new HttpError(403, 'COURSE_NOT_ASSIGNED', 'Bu kurs hesabınıza təyin edilməyib.');
    }
    sendJson(res, 200, resLesson.payload);
    return;
  }

  // PUT /api/student/lessons/:lessonId/progress
  const progMatch = subPath.match(LESSON_PROGRESS_RE);
  if (req.method === 'PUT' && progMatch) {
    const allowed = await repo.checkRateLimit(`progress:${user.profile.id}`, 'lesson_progress', 60, 60);
    if (!allowed) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox tez-tez irəliləyiş sorğusu göndərirsiniz.');
    }
    const input = lessonProgressUpdateSchema.parse(req.body);
    const record = await repo.upsertLessonProgress(user.profile.id, progMatch[1]!, input);
    sendJson(res, 200, record);
    return;
  }

  // POST /api/student/exercises/:exerciseId/attempts
  const exMatch = subPath.match(EXERCISE_ATTEMPT_RE);
  if (req.method === 'POST' && exMatch) {
    const allowed = await repo.checkRateLimit(
      `exercise:${user.profile.id}`,
      'exercise_attempt',
      60,
      30,
    );
    if (!allowed) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox tez-tez cəhd göndərirsiniz.');
    }
    const input = exerciseAttemptCreateSchema.parse(req.body);
    const record = await repo.recordExerciseAttempt(user.profile.id, exMatch[1]!, input);
    sendJson(res, 201, record);
    return;
  }

  // POST /api/student/quizzes/:quizId/submit
  const quizMatch = subPath.match(QUIZ_SUBMIT_RE);
  if (req.method === 'POST' && quizMatch) {
    const allowed = await repo.checkRateLimit(`quiz:${user.profile.id}`, 'quiz_submit', 60, 20);
    if (!allowed) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox sayda quiz göndərişi edildi.');
    }
    const input = quizSubmitSchema.parse(req.body);
    const result = await repo.submitQuizAttempt(user.profile.id, quizMatch[1]!, input, token);
    sendJson(res, 201, result);
    return;
  }

  throw new HttpError(404, 'NOT_FOUND', 'Tələbə endpoint-i tapılmadı.');
}
