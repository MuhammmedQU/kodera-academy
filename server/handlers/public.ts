import type { ServerResponse } from 'node:http';
import { resolveOptionalUser } from '../lib/auth';
import { HttpError, sendJson, type ApiRequest } from '../lib/http';
import type { KoderaRepository } from '../lib/repository';

export async function handlePublicRoute(
  req: ApiRequest,
  res: ServerResponse,
  repo: KoderaRepository,
): Promise<void> {
  if (req.method !== 'GET') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Bu endpoint yalnız GET sorğularını qəbul edir.');
  }

  const subPath = req.pathname.replace(/^\/api\/public\/?/, '').replace(/\/$/, '');

  // GET /api/public/settings
  if (subPath === 'settings') {
    const settings = await repo.getPublicSettings();
    sendJson(res, 200, settings, 'public, max-age=60, stale-while-revalidate=120');
    return;
  }

  // GET /api/public/courses
  if (subPath === 'courses') {
    const courses = await repo.listPublishedCourses();
    sendJson(res, 200, courses, 'public, max-age=30, stale-while-revalidate=60');
    return;
  }

  // GET /api/public/courses/:slug/lessons/:lessonSlug
  const lessonMatch = subPath.match(/^courses\/([a-z0-9-]+)\/lessons\/([a-z0-9-]+)$/);
  if (lessonMatch) {
    const [, courseSlug, lessonSlug] = lessonMatch;
    const viewer = await resolveOptionalUser(req, repo);
    const result = await repo.getLessonView(courseSlug!, lessonSlug!, viewer);
    if (result.status === 'not_found') {
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    }
    if (result.status === 'forbidden') {
      throw new HttpError(
        403,
        'LESSON_RESTRICTED',
        'Bu dərs yalnız qeydiyyatdan keçib təsdiqlənmiş və bu kursa təyin olunmuş tələbələr üçün açıqdır.',
        {
          course_slug: result.course.slug,
          course_title: result.course.title,
          module_title: result.moduleTitle,
        },
      );
    }
    sendJson(res, 200, result.payload, 'no-store');
    return;
  }

  // GET /api/public/courses/:slug
  const courseMatch = subPath.match(/^courses\/([a-z0-9-]+)$/);
  if (courseMatch) {
    const [, courseSlug] = courseMatch;
    const viewer = await resolveOptionalUser(req, repo);
    const detail = await repo.getCourseBySlug(courseSlug!, viewer);
    if (!detail) {
      throw new HttpError(404, 'COURSE_NOT_FOUND', 'Kurs tapılmadı.');
    }
    sendJson(res, 200, detail, 'no-store');
    return;
  }

  throw new HttpError(404, 'NOT_FOUND', 'İctimai endpoint tapılmadı.');
}
