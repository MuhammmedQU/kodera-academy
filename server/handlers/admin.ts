import type { ServerResponse } from 'node:http';
import {
  applicationNoteSchema,
  applicationReviewSchema,
  assignEnrollmentSchema,
  contentBlockPatchSchema,
  contentBlockUpsertSchema,
  coursePatchSchema,
  courseUpsertSchema,
  exerciseUpsertSchema,
  lessonPatchSchema,
  lessonUpsertSchema,
  modulePatchSchema,
  moduleUpsertSchema,
  platformSettingsUpdateSchema,
  quizUpsertSchema,
  revokeEnrollmentSchema,
  studentAccountStatusSchema,
} from '../../src/shared/validation/schemas.js';
import { requireAdmin } from '../lib/auth.js';
import { HttpError, sendJson, type ApiRequest } from '../lib/http.js';
import type { KoderaRepository } from '../lib/repository.js';

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const APP_REVIEW_RE = new RegExp(`^applications/(${UUID_PATTERN})/review$`, 'i');
const APP_NOTES_RE = new RegExp(`^applications/(${UUID_PATTERN})/notes$`, 'i');
const STUDENT_STATUS_RE = new RegExp(`^students/(${UUID_PATTERN})/status$`, 'i');
const ENROLLMENT_REVOKE_RE = new RegExp(`^enrollments/(${UUID_PATTERN})/revoke$`, 'i');
const COURSE_MODULES_RE = new RegExp(`^courses/(${UUID_PATTERN})/modules$`, 'i');
const COURSE_BY_ID_RE = new RegExp(`^courses/(${UUID_PATTERN})$`, 'i');
const MODULE_LESSONS_RE = new RegExp(`^modules/(${UUID_PATTERN})/lessons$`, 'i');
const MODULE_BY_ID_RE = new RegExp(`^modules/(${UUID_PATTERN})$`, 'i');
const LESSON_EDITOR_RE = new RegExp(`^lessons/(${UUID_PATTERN})/editor$`, 'i');
const LESSON_BY_ID_RE = new RegExp(`^lessons/(${UUID_PATTERN})$`, 'i');
const BLOCK_BY_ID_RE = new RegExp(`^blocks/(${UUID_PATTERN})$`, 'i');

export async function handleAdminRoute(
  req: ApiRequest,
  res: ServerResponse,
  repo: KoderaRepository,
): Promise<void> {
  // CRITICAL SECURITY GATE: Every single /api/admin/* request is server-verified
  // against Supabase JWT + PostgreSQL user_roles(role='admin') + account_status='active'.
  const { audit } = await requireAdmin(req, repo);

  const allowed = await repo.checkRateLimit(
    `admin:${audit.actorId ?? req.ip}`,
    'admin_api',
    60,
    180,
  );
  if (!allowed) {
    throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox tez-tez admin sorğusu göndərirsiniz.');
  }

  const subPath = req.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  // GET /api/admin/stats
  if (req.method === 'GET' && subPath === 'stats') {
    const stats = await repo.getAdminStats();
    sendJson(res, 200, stats);
    return;
  }

  // --- APPLICATIONS ---
  if (req.method === 'GET' && subPath === 'applications') {
    const list = await repo.listApplications({
      status: req.query.get('status') ?? undefined,
      search: req.query.get('search') ?? undefined,
    });
    sendJson(res, 200, list);
    return;
  }

  const reviewMatch = subPath.match(APP_REVIEW_RE);
  if (req.method === 'POST' && reviewMatch) {
    const input = applicationReviewSchema.parse(req.body);
    const updated = await repo.reviewApplication(reviewMatch[1]!, input, audit);
    sendJson(res, 200, updated);
    return;
  }

  const noteMatch = subPath.match(APP_NOTES_RE);
  if (req.method === 'POST' && noteMatch) {
    const input = applicationNoteSchema.parse(req.body);
    const note = await repo.addApplicationNote(noteMatch[1]!, input.note, audit);
    sendJson(res, 201, note);
    return;
  }

  // --- STUDENTS ---
  if (req.method === 'GET' && subPath === 'students') {
    const students = await repo.listStudents({
      status: req.query.get('status') ?? undefined,
      search: req.query.get('search') ?? undefined,
    });
    sendJson(res, 200, students);
    return;
  }

  const studentStatusMatch = subPath.match(STUDENT_STATUS_RE);
  if (req.method === 'PATCH' && studentStatusMatch) {
    const input = studentAccountStatusSchema.parse(req.body);
    const updated = await repo.updateStudentAccountStatus(
      studentStatusMatch[1]!,
      input.account_status,
      input.reason,
      audit,
    );
    sendJson(res, 200, updated);
    return;
  }

  // --- ENROLLMENTS (SEPARATE FROM APPROVAL) ---
  if (req.method === 'GET' && subPath === 'enrollments') {
    const list = await repo.listEnrollments({
      studentId: req.query.get('student_id') ?? undefined,
      courseId: req.query.get('course_id') ?? undefined,
    });
    sendJson(res, 200, list);
    return;
  }

  if (req.method === 'POST' && subPath === 'enrollments') {
    const input = assignEnrollmentSchema.parse(req.body);
    const assigned = await repo.assignCoursesToStudent(input.student_id, input.course_ids, audit);
    sendJson(res, 201, assigned);
    return;
  }

  const revokeMatch = subPath.match(ENROLLMENT_REVOKE_RE);
  if (req.method === 'POST' && revokeMatch) {
    const input = revokeEnrollmentSchema.parse(req.body ?? {});
    const updated = await repo.revokeEnrollment(revokeMatch[1]!, input.revoke_reason, audit);
    sendJson(res, 200, updated);
    return;
  }

  // --- COURSES CMS ---
  if (req.method === 'GET' && subPath === 'courses') {
    const courses = await repo.listAllCourses();
    sendJson(res, 200, courses);
    return;
  }

  if (req.method === 'POST' && subPath === 'courses') {
    const input = courseUpsertSchema.parse(req.body);
    const course = await repo.createCourse(input, audit);
    sendJson(res, 201, course);
    return;
  }

  const courseModulesMatch = subPath.match(COURSE_MODULES_RE);
  if (req.method === 'GET' && courseModulesMatch) {
    const modules = await repo.listCourseModules(courseModulesMatch[1]!);
    sendJson(res, 200, modules);
    return;
  }

  const courseByIdMatch = subPath.match(COURSE_BY_ID_RE);
  if (req.method === 'PATCH' && courseByIdMatch) {
    const input = coursePatchSchema.parse(req.body);
    const updated = await repo.updateCourse(courseByIdMatch[1]!, input, audit);
    sendJson(res, 200, updated);
    return;
  }

  // --- MODULES CMS ---
  if (req.method === 'POST' && subPath === 'modules') {
    const input = moduleUpsertSchema.parse(req.body);
    const mod = await repo.createModule(input, audit);
    sendJson(res, 201, mod);
    return;
  }

  const moduleLessonsMatch = subPath.match(MODULE_LESSONS_RE);
  if (req.method === 'GET' && moduleLessonsMatch) {
    const lessons = await repo.listModuleLessons(moduleLessonsMatch[1]!);
    sendJson(res, 200, lessons);
    return;
  }

  const moduleByIdMatch = subPath.match(MODULE_BY_ID_RE);
  if (req.method === 'PATCH' && moduleByIdMatch) {
    const input = modulePatchSchema.parse(req.body);
    const updated = await repo.updateModule(moduleByIdMatch[1]!, input, audit);
    sendJson(res, 200, updated);
    return;
  }

  // --- LESSONS, BLOCKS, EXERCISES, QUIZZES CMS ---
  if (req.method === 'POST' && subPath === 'lessons') {
    const input = lessonUpsertSchema.parse(req.body);
    const lesson = await repo.createLesson(input, audit);
    sendJson(res, 201, lesson);
    return;
  }

  const lessonEditorMatch = subPath.match(LESSON_EDITOR_RE);
  if (req.method === 'GET' && lessonEditorMatch) {
    const editorData = await repo.listLessonBlocksAdmin(lessonEditorMatch[1]!);
    sendJson(res, 200, editorData);
    return;
  }

  const lessonByIdMatch = subPath.match(LESSON_BY_ID_RE);
  if (req.method === 'PATCH' && lessonByIdMatch) {
    const input = lessonPatchSchema.parse(req.body);
    const updated = await repo.updateLesson(lessonByIdMatch[1]!, input, audit);
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === 'POST' && subPath === 'blocks') {
    const input = contentBlockUpsertSchema.parse(req.body);
    const block = await repo.createContentBlock(input, audit);
    sendJson(res, 201, block);
    return;
  }

  const blockByIdMatch = subPath.match(BLOCK_BY_ID_RE);
  if (req.method === 'PATCH' && blockByIdMatch) {
    const input = contentBlockPatchSchema.parse(req.body);
    const updated = await repo.updateContentBlock(blockByIdMatch[1]!, input, audit);
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === 'DELETE' && blockByIdMatch) {
    await repo.deleteContentBlock(blockByIdMatch[1]!, audit);
    sendJson(res, 200, { deleted: true });
    return;
  }

  if (req.method === 'POST' && subPath === 'exercises') {
    const input = exerciseUpsertSchema.parse(req.body);
    const ex = await repo.createExercise(input, audit);
    sendJson(res, 201, ex);
    return;
  }

  if (req.method === 'POST' && subPath === 'quizzes') {
    const input = quizUpsertSchema.parse(req.body);
    const qz = await repo.createQuiz(input, audit);
    sendJson(res, 201, qz);
    return;
  }

  // --- PLATFORM & WHATSAPP SETTINGS ---
  if (req.method === 'GET' && subPath === 'settings') {
    const settings = await repo.getAdminSettings();
    sendJson(res, 200, settings);
    return;
  }

  if (req.method === 'PUT' && subPath === 'settings') {
    const input = platformSettingsUpdateSchema.parse(req.body);
    const updated = await repo.updateAdminSettings(input, audit);
    sendJson(res, 200, updated);
    return;
  }

  // --- IMMUTABLE AUDIT LOGS (READ-ONLY) ---
  if (req.method === 'GET' && subPath === 'audit-logs') {
    const limitParam = Number(req.query.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 250) : 100;
    const logs = await repo.listAuditLogs(limit);
    sendJson(res, 200, logs);
    return;
  }

  // Explicitly refuse any attempt to mutate audit logs via API
  if (subPath.startsWith('audit-logs') && req.method !== 'GET') {
    throw new HttpError(
      403,
      'AUDIT_LOGS_IMMUTABLE',
      'Audit log qeydləri dəyişdirilə və ya silinə bilməz.',
    );
  }

  throw new HttpError(404, 'NOT_FOUND', 'Admin endpoint tapılmadı.');
}
