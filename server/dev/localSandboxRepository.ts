import crypto from 'node:crypto';
import type {
  AdminApplicationView,
  AdminDashboardStats,
  AdminPlatformSettings,
  AdminQuiz,
  AdminStudentView,
  AppRole,
  Application,
  ApplicationNote,
  AuditLogEntry,
  AuthSessionUser,
  Course,
  CurriculumOutlineModule,
  Enrollment,
  ExerciseAttemptSummary,
  LessonContentBlock,
  LessonItem,
  LessonProgressRecord,
  LessonViewPayload,
  ModuleItem,
  Profile,
  PublicExercise,
  PublicPlatformSettings,
  PublicQuiz,
  QuizAttemptResult,
  QuizAttemptSummary,
  StudentCourseWithProgress,
} from '../../src/shared/types/domain.js';
import { buildInitialSeedContent, SEED_IDS, type SeedExercise } from '../content/initialSeed.js';
import { HttpError } from '../lib/http.js';
import type { AuditContext, KoderaRepository } from '../lib/repository.js';
import type {
  ApplicationReviewInput,
  ContentBlockUpsertInput,
  CourseUpsertInput,
  ExerciseAttemptCreateInput,
  ExerciseUpsertInput,
  LessonProgressUpdateInput,
  LessonUpsertInput,
  ModuleUpsertInput,
  PlatformSettingsUpdateInput,
  ProfileUpdateInput,
  QuizSubmitInput,
  QuizUpsertInput,
  RegisterInput,
} from '../lib/types.js';

function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, s, 32).toString('hex');
  return `${s}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function generateReferenceCode(existing: Set<string>): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const year = new Date().getUTCFullYear();
  for (let attempt = 0; attempt < 25; attempt++) {
    const bytes = crypto.randomBytes(6);
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += alphabet[(bytes[i] ?? 0) % alphabet.length];
    }
    const code = `KDR-${year}-${suffix}`;
    if (!existing.has(code)) return code;
  }
  throw new Error('Could not generate unique reference code');
}

function stripQuizForStudent(quiz: AdminQuiz): PublicQuiz {
  return {
    id: quiz.id,
    lesson_id: quiz.lesson_id,
    locale: quiz.locale,
    title: quiz.title,
    description: quiz.description,
    passing_score_percent: quiz.passing_score_percent,
    max_attempts: quiz.max_attempts,
    questions: quiz.questions
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((q) => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_type: q.question_type,
        prompt: q.prompt,
        code_snippet: q.code_snippet,
        code_language: q.code_language,
        points: q.points,
        sort_order: q.sort_order,
        options: q.options
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((o) => ({
            id: o.id,
            question_id: o.question_id,
            option_text: o.option_text,
            sort_order: o.sort_order,
          })),
      })),
  };
}

function stripExerciseForStudent(ex: SeedExercise): PublicExercise {
  return {
    id: ex.id,
    lesson_id: ex.lesson_id,
    locale: ex.locale,
    title: ex.title,
    instructions: ex.instructions,
    programming_language: ex.programming_language,
    starter_code: ex.starter_code,
    hints: ex.hints,
    execution_mode: ex.execution_mode,
    time_limit_ms: ex.time_limit_ms,
    max_output_chars: ex.max_output_chars,
    test_cases: ex.test_cases.filter((tc) => !tc.is_hidden),
  };
}

export const SANDBOX_USERS = {
  ADMIN_ID: '90000000-0000-4000-8000-000000000001',
  STUDENT_PY_ID: '90000000-0000-4000-8000-000000000002',
  STUDENT_NONE_ID: '90000000-0000-4000-8000-000000000003',
  PENDING_ID: '90000000-0000-4000-8000-000000000004',
  REJECTED_ID: '90000000-0000-4000-8000-000000000005',
  SUSPENDED_ID: '90000000-0000-4000-8000-000000000006',
} as const;

interface StoredAuthUser {
  id: string;
  email: string;
  passwordHash: string;
}

/**
 * Dev/Test-ONLY in-memory repository implementing the exact business rules,
 * RBAC guards, RLS-equivalent filters, rate limits, and immutable audit logs
 * of the Kodera PostgreSQL schema.
 *
 * SECURITY: Strictly prohibited in NODE_ENV === 'production'.
 */
export class LocalSandboxRepository implements KoderaRepository {
  private authUsers = new Map<string, StoredAuthUser>();
  private sessions = new Map<string, string>(); // token -> userId
  private profiles = new Map<string, Profile>();
  private roles = new Map<string, Set<AppRole>>();
  private applications = new Map<string, Application>();
  private applicationNotes = new Map<string, ApplicationNote[]>();

  private courses = new Map<string, Course>();
  private modules = new Map<string, ModuleItem>();
  private lessons = new Map<string, LessonItem>();
  private blocks = new Map<string, LessonContentBlock>();
  private exercises = new Map<string, SeedExercise>();
  private quizzes = new Map<string, AdminQuiz>();

  private enrollments = new Map<string, Enrollment>();
  private lessonProgress = new Map<string, LessonProgressRecord>();
  private exerciseAttempts: ExerciseAttemptSummary[] = [];
  private quizAttempts: QuizAttemptSummary[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private rateLimits: Array<{ bucketKey: string; action: string; ts: number }> = [];

  private settings: AdminPlatformSettings;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('LocalSandboxRepository MUST NEVER be instantiated in production.');
    }

    const now = '2026-11-23T12:00:00.000Z';
    this.settings = {
      academy_name: 'Kodera',
      academy_tagline: 'Proqramlaşdırmanı sadə, aydın və praktik öyrən',
      logo_storage_path: null,
      contact_email: 'info@kodera.academy',
      whatsapp_button_enabled: true,
      whatsapp_phone: '994501234567',
      raw_whatsapp_button_enabled: true,
      raw_whatsapp_phone: '994501234567',
      whatsapp_button_label: 'WhatsApp ilə administratora yaz',
      whatsapp_message_template:
        'Salam! {{academy_name}} akademiyasında qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
      alternative_contact_text: 'Bizimlə əlaqə saxlamaq üçün rəsmi email ünvanımıza yaza bilərsiniz.',
      registration_enabled: true,
      default_public_modules_count: 2,
      updated_by: SANDBOX_USERS.ADMIN_ID,
      updated_at: now,
    };

    this.seedDefaults();
  }

  private seedDefaults(): void {
    const now = '2026-11-23T12:00:00.000Z';
    const seed = buildInitialSeedContent();
    seed.courses.forEach((c) => this.courses.set(c.id, c));
    seed.modules.forEach((m) => this.modules.set(m.id, m));
    seed.lessons.forEach((l) => this.lessons.set(l.id, l));
    seed.blocks.forEach((b) => this.blocks.set(b.id, b));
    seed.exercises.forEach((e) => this.exercises.set(e.id, e));
    seed.quizzes.forEach((q) => this.quizzes.set(q.id, q));

    // Sandbox test accounts (local dev & automated tests ONLY)
    const accounts: Array<{
      id: string;
      email: string;
      password: string;
      full_name: string;
      status: Profile['account_status'];
      roles: AppRole[];
      appStatus?: Application['status'];
      refCode?: string;
      rejectionReason?: string;
    }> = [
      {
        id: SANDBOX_USERS.ADMIN_ID,
        email: 'admin@kodera.local',
        password: 'AdminPass123!',
        full_name: 'Kodera Administrator',
        status: 'active',
        roles: ['admin'],
      },
      {
        id: SANDBOX_USERS.STUDENT_PY_ID,
        email: 'student@kodera.local',
        password: 'StudentPass123!',
        full_name: 'Aysel Məmmədova',
        status: 'active',
        roles: ['student'],
        appStatus: 'approved',
        refCode: 'KDR-2026-STU001',
      },
      {
        id: SANDBOX_USERS.STUDENT_NONE_ID,
        email: 'approved-nocourse@kodera.local',
        password: 'StudentPass123!',
        full_name: 'Rəşad Əliyev',
        status: 'active',
        roles: ['student'],
        appStatus: 'approved',
        refCode: 'KDR-2026-STU002',
      },
      {
        id: SANDBOX_USERS.PENDING_ID,
        email: 'pending@kodera.local',
        password: 'StudentPass123!',
        full_name: 'Nigar Həsənova',
        status: 'pending',
        roles: ['student'],
        appStatus: 'pending',
        refCode: 'KDR-2026-PND001',
      },
      {
        id: SANDBOX_USERS.REJECTED_ID,
        email: 'rejected@kodera.local',
        password: 'StudentPass123!',
        full_name: 'Elvin Quliyev',
        status: 'rejected',
        roles: ['student'],
        appStatus: 'rejected',
        refCode: 'KDR-2026-REJ001',
        rejectionReason: 'Hal-hazırda qrup yerləri doludur, növbəti qəbulda müraciət edə bilərsiniz.',
      },
      {
        id: SANDBOX_USERS.SUSPENDED_ID,
        email: 'suspended@kodera.local',
        password: 'StudentPass123!',
        full_name: 'Tural Kərimov',
        status: 'suspended',
        roles: ['student'],
        appStatus: 'approved',
        refCode: 'KDR-2026-SUS001',
      },
    ];

    for (const acc of accounts) {
      this.authUsers.set(acc.id, {
        id: acc.id,
        email: acc.email,
        passwordHash: hashPassword(acc.password),
      });
      this.profiles.set(acc.id, {
        id: acc.id,
        email: acc.email,
        full_name: acc.full_name,
        phone: '+994501112233',
        learning_goals: 'Python öyrənmək və layihələr hazırlamaq',
        avatar_url: null,
        preferred_locale: 'az',
        account_status: acc.status,
        archived_at: null,
        created_at: now,
        updated_at: now,
      });
      this.roles.set(acc.id, new Set(acc.roles));

      if (acc.appStatus && acc.refCode) {
        const appId = crypto.randomUUID();
        this.applications.set(appId, {
          id: appId,
          user_id: acc.id,
          reference_code: acc.refCode,
          status: acc.appStatus,
          submitted_at: now,
          reviewed_by: acc.appStatus === 'pending' ? null : SANDBOX_USERS.ADMIN_ID,
          reviewed_at: acc.appStatus === 'pending' ? null : now,
          rejection_reason: acc.rejectionReason ?? null,
          created_at: now,
          updated_at: now,
        });
      }
    }

    // Assign Python ONLY to STUDENT_PY_ID and SUSPENDED_ID (STUDENT_NONE_ID intentionally has 0 courses!)
    const enrollPy: Enrollment = {
      id: '70000000-0000-4000-8000-000000000001',
      student_id: SANDBOX_USERS.STUDENT_PY_ID,
      course_id: SEED_IDS.COURSE_PYTHON,
      status: 'active',
      assigned_by: SANDBOX_USERS.ADMIN_ID,
      assigned_at: now,
      revoked_by: null,
      revoked_at: null,
      revoke_reason: null,
      completed_at: null,
    };
    const enrollSuspended: Enrollment = {
      id: '70000000-0000-4000-8000-000000000002',
      student_id: SANDBOX_USERS.SUSPENDED_ID,
      course_id: SEED_IDS.COURSE_PYTHON,
      status: 'active',
      assigned_by: SANDBOX_USERS.ADMIN_ID,
      assigned_at: now,
      revoked_by: null,
      revoked_at: null,
      revoke_reason: null,
      completed_at: null,
    };
    this.enrollments.set(enrollPy.id, enrollPy);
    this.enrollments.set(enrollSuspended.id, enrollSuspended);
  }

  private recordAudit(
    audit: AuditContext,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, unknown> = {},
  ): void {
    const actor = audit.actorId ? this.profiles.get(audit.actorId) : undefined;
    const entry: AuditLogEntry = Object.freeze({
      id: crypto.randomUUID(),
      actor_id: audit.actorId,
      actor_email: actor?.email ?? null,
      actor_role: audit.actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: audit.ipAddress,
      user_agent: audit.userAgent,
      created_at: new Date().toISOString(),
    });
    this.auditLogs.unshift(entry);
  }

  private buildSessionUser(userId: string): AuthSessionUser | null {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    const userRoles = Array.from(this.roles.get(userId) ?? []);
    const isAdmin = userRoles.includes('admin') && profile.account_status === 'active';
    const isActiveStudent = userRoles.includes('student') && profile.account_status === 'active';
    const apps = Array.from(this.applications.values())
      .filter((a) => a.user_id === userId)
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

    return {
      profile,
      roles: userRoles,
      isAdmin,
      isActiveStudent,
      application: apps[0] ?? null,
    };
  }

  private isEnrolled(viewer: AuthSessionUser | null, courseId: string): boolean {
    if (!viewer || !viewer.isActiveStudent) return false;
    return Array.from(this.enrollments.values()).some(
      (e) =>
        e.student_id === viewer.profile.id &&
        e.course_id === courseId &&
        (e.status === 'active' || e.status === 'completed'),
    );
  }

  private canAccessModule(viewer: AuthSessionUser | null, mod: ModuleItem, course: Course): boolean {
    if (viewer?.isAdmin) return true;
    if (!course.is_published || !mod.is_published) return false;
    return mod.is_public || this.isEnrolled(viewer, course.id);
  }

  private enrichCourseCounts(course: Course): Course {
    const mods = Array.from(this.modules.values())
      .filter((m) => m.course_id === course.id && m.is_published)
      .sort((a, b) => a.sort_order - b.sort_order);
    const modIds = new Set(mods.map((m) => m.id));
    const lessons = Array.from(this.lessons.values())
      .filter((l) => modIds.has(l.module_id) && l.is_published)
      .sort((a, b) => a.sort_order - b.sort_order);
    let firstPublicLessonSlug: string | null = null;
    for (const m of mods) {
      if (!m.is_public) continue;
      const firstLesson = lessons.find((l) => l.module_id === m.id);
      if (firstLesson) {
        firstPublicLessonSlug = firstLesson.slug;
        break;
      }
    }
    return {
      ...course,
      public_module_count: mods.filter((m) => m.is_public).length,
      total_module_count: mods.length,
      total_lesson_count: lessons.length,
      first_public_lesson_slug: firstPublicLessonSlug,
    };
  }

  // --- Rate Limit ---
  async checkRateLimit(
    bucketKey: string,
    action: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<boolean> {
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000;
    this.rateLimits = this.rateLimits.filter((r) => r.ts >= cutoff);
    const count = this.rateLimits.filter(
      (r) => r.bucketKey === bucketKey && r.action === action,
    ).length;
    if (count >= maxRequests) return false;
    this.rateLimits.push({ bucketKey, action, ts: now });
    return true;
  }

  // --- Auth ---
  async resolveUserByToken(token: string): Promise<AuthSessionUser | null> {
    const userId = this.sessions.get(token);
    if (!userId) return null;
    return this.buildSessionUser(userId);
  }

  async registerStudent(input: RegisterInput): Promise<{
    access_token?: string;
    requires_email_verification: boolean;
    reference_code: string;
    user?: AuthSessionUser;
  }> {
    if (!this.settings.registration_enabled) {
      throw new HttpError(403, 'REGISTRATION_CLOSED', 'Hazırda yeni qeydiyyat müvəqqəti bağlıdır.');
    }

    const emailLower = input.email.toLowerCase();
    for (const u of this.authUsers.values()) {
      if (u.email === emailLower) {
        throw new HttpError(
          409,
          'EMAIL_EXISTS',
          'Bu email ünvanı ilə artıq qeydiyyat mövcuddur. Giriş səhifəsindən daxil ola bilərsiniz.',
        );
      }
    }

    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    this.authUsers.set(userId, {
      id: userId,
      email: emailLower,
      passwordHash: hashPassword(input.password),
    });

    // Always force role = 'student' and account_status = 'pending' (never trust client metadata)
    this.profiles.set(userId, {
      id: userId,
      email: emailLower,
      full_name: input.full_name,
      phone: input.phone ?? null,
      learning_goals: input.learning_goals ?? null,
      avatar_url: null,
      preferred_locale: 'az',
      account_status: 'pending',
      archived_at: null,
      created_at: now,
      updated_at: now,
    });
    this.roles.set(userId, new Set(['student']));

    const existingCodes = new Set(Array.from(this.applications.values()).map((a) => a.reference_code));
    const refCode = generateReferenceCode(existingCodes);
    const appId = crypto.randomUUID();
    this.applications.set(appId, {
      id: appId,
      user_id: userId,
      reference_code: refCode,
      status: 'pending',
      submitted_at: now,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    });

    const token = `sbx_${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, userId);
    const user = this.buildSessionUser(userId)!;

    return {
      access_token: token,
      requires_email_verification: false,
      reference_code: refCode,
      user,
    };
  }

  async loginSandbox(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: AuthSessionUser }> {
    const emailLower = email.trim().toLowerCase();
    const found = Array.from(this.authUsers.values()).find((u) => u.email === emailLower);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email və ya şifrə yanlışdır.');
    }
    const token = `sbx_${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, found.id);
    const user = this.buildSessionUser(found.id);
    if (!user) {
      throw new HttpError(500, 'PROFILE_MISSING', 'İstifadəçi profili tapılmadı.');
    }
    return { access_token: token, user };
  }

  async logoutSandbox(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async requestPasswordReset(_email: string): Promise<void> {
    // Intentionally no-op returning uniform response to prevent account enumeration
  }

  async resendVerificationEmail(_email: string): Promise<void> {
    // Intentionally no-op in local sandbox
  }

  // --- Public Read ---
  async getPublicSettings(): Promise<PublicPlatformSettings> {
    const enabled = this.settings.raw_whatsapp_button_enabled && Boolean(this.settings.raw_whatsapp_phone);
    return {
      academy_name: this.settings.academy_name,
      academy_tagline: this.settings.academy_tagline,
      logo_storage_path: this.settings.logo_storage_path,
      contact_email: this.settings.contact_email,
      whatsapp_button_enabled: enabled,
      whatsapp_phone: enabled ? this.settings.raw_whatsapp_phone : null,
      whatsapp_button_label: this.settings.whatsapp_button_label,
      whatsapp_message_template: this.settings.whatsapp_message_template,
      alternative_contact_text: this.settings.alternative_contact_text,
      registration_enabled: this.settings.registration_enabled,
      default_public_modules_count: this.settings.default_public_modules_count,
    };
  }

  async listPublishedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter((c) => c.is_published)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => this.enrichCourseCounts(c));
  }

  async getCourseBySlug(
    slug: string,
    viewer: AuthSessionUser | null,
  ): Promise<{ course: Course; outline: CurriculumOutlineModule[]; is_enrolled: boolean } | null> {
    const course = Array.from(this.courses.values()).find(
      (c) => c.slug === slug && (c.is_published || viewer?.isAdmin),
    );
    if (!course) return null;

    const isEnrolled = this.isEnrolled(viewer, course.id);
    const mods = Array.from(this.modules.values())
      .filter((m) => m.course_id === course.id && (m.is_published || viewer?.isAdmin))
      .sort((a, b) => a.sort_order - b.sort_order);

    const outline: CurriculumOutlineModule[] = mods.map((m) => {
      const canAccess = this.canAccessModule(viewer, m, course);
      const lessons = Array.from(this.lessons.values())
        .filter((l) => l.module_id === m.id && (l.is_published || viewer?.isAdmin))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => {
          const prog = viewer
            ? this.lessonProgress.get(`${viewer.profile.id}:${l.id}`)?.status
            : undefined;
          return {
            id: l.id,
            slug: canAccess ? l.slug : null,
            title: l.title,
            sort_order: l.sort_order,
            estimated_minutes: l.estimated_minutes,
            progress_status: prog,
          };
        });

      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        sort_order: m.sort_order,
        is_public: m.is_public,
        can_access: canAccess,
        lessons,
      };
    });

    return {
      course: this.enrichCourseCounts(course),
      outline,
      is_enrolled: isEnrolled,
    };
  }

  async getLessonView(
    courseSlug: string,
    lessonSlug: string,
    viewer: AuthSessionUser | null,
  ): Promise<
    | { status: 'ok'; payload: LessonViewPayload }
    | { status: 'not_found' }
    | { status: 'forbidden'; course: Course; moduleTitle: string }
  > {
    const course = Array.from(this.courses.values()).find(
      (c) => c.slug === courseSlug && (c.is_published || viewer?.isAdmin),
    );
    if (!course) return { status: 'not_found' };

    const courseModules = Array.from(this.modules.values())
      .filter((m) => m.course_id === course.id && (m.is_published || viewer?.isAdmin))
      .sort((a, b) => a.sort_order - b.sort_order);

    const orderedLessons: Array<{ module: ModuleItem; lesson: LessonItem }> = [];
    for (const m of courseModules) {
      const mLessons = Array.from(this.lessons.values())
        .filter((l) => l.module_id === m.id && (l.is_published || viewer?.isAdmin))
        .sort((a, b) => a.sort_order - b.sort_order);
      for (const l of mLessons) {
        orderedLessons.push({ module: m, lesson: l });
      }
    }

    const idx = orderedLessons.findIndex((item) => item.lesson.slug === lessonSlug);
    if (idx === -1) return { status: 'not_found' };

    const current = orderedLessons[idx]!;
    if (!this.canAccessModule(viewer, current.module, course)) {
      return { status: 'forbidden', course, moduleTitle: current.module.title };
    }

    const blocks = Array.from(this.blocks.values())
      .filter((b) => b.lesson_id === current.lesson.id && (b.is_published || viewer?.isAdmin))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => {
        const enriched: LessonContentBlock = { ...b };
        if (b.block_type === 'exercise' && b.exercise_id) {
          const ex = this.exercises.get(b.exercise_id);
          if (ex) enriched.exercise = stripExerciseForStudent(ex);
        }
        if (b.block_type === 'quiz' && b.quiz_id) {
          const q = this.quizzes.get(b.quiz_id);
          if (q) enriched.quiz = stripQuizForStudent(q);
        }
        return enriched;
      });

    const prevItem = idx > 0 ? orderedLessons[idx - 1]! : null;
    const nextItem = idx + 1 < orderedLessons.length ? orderedLessons[idx + 1]! : null;
    const isEnrolled = this.isEnrolled(viewer, course.id);

    const publicLessons = orderedLessons.filter((item) => item.module.is_public);
    const lastPublicLesson = publicLessons[publicLessons.length - 1];
    const isLastPublicLesson = Boolean(
      !isEnrolled && lastPublicLesson && lastPublicLesson.lesson.id === current.lesson.id,
    );

    const progStatus =
      (viewer && this.lessonProgress.get(`${viewer.profile.id}:${current.lesson.id}`)?.status) ||
      'not_started';

    const previousQuizAttempts: Record<string, QuizAttemptSummary[]> = {};
    const previousExerciseAttempts: Record<string, ExerciseAttemptSummary[]> = {};
    if (viewer) {
      for (const b of blocks) {
        if (b.quiz_id) {
          previousQuizAttempts[b.quiz_id] = this.quizAttempts.filter(
            (a) => a.student_id === viewer.profile.id && a.quiz_id === b.quiz_id,
          );
        }
        if (b.exercise_id) {
          previousExerciseAttempts[b.exercise_id] = this.exerciseAttempts.filter(
            (a) => a.student_id === viewer.profile.id && a.exercise_id === b.exercise_id,
          );
        }
      }
    }

    return {
      status: 'ok',
      payload: {
        course: this.enrichCourseCounts(course),
        module: current.module,
        lesson: current.lesson,
        blocks,
        prev_lesson: prevItem
          ? (() => {
              const locked = !this.canAccessModule(viewer, prevItem.module, course);
              return {
                slug: locked ? null : prevItem.lesson.slug,
                title: prevItem.lesson.title,
                is_locked: locked,
              };
            })()
          : null,
        next_lesson: nextItem
          ? (() => {
              const locked = !this.canAccessModule(viewer, nextItem.module, course);
              return {
                slug: locked ? null : nextItem.lesson.slug,
                title: nextItem.lesson.title,
                is_locked: locked,
              };
            })()
          : null,
        is_last_public_lesson: isLastPublicLesson,
        is_enrolled: isEnrolled,
        progress_status: progStatus,
        previous_quiz_attempts: previousQuizAttempts,
        previous_exercise_attempts: previousExerciseAttempts,
      },
    };
  }

  // --- Student ---
  async listStudentCourses(studentId: string): Promise<StudentCourseWithProgress[]> {
    const activeEnrollments = Array.from(this.enrollments.values()).filter(
      (e) => e.student_id === studentId && (e.status === 'active' || e.status === 'completed'),
    );

    const results: StudentCourseWithProgress[] = [];
    for (const enr of activeEnrollments) {
      const course = this.courses.get(enr.course_id);
      if (!course || !course.is_published) continue;
      const mods = Array.from(this.modules.values())
        .filter((m) => m.course_id === course.id && m.is_published)
        .sort((a, b) => a.sort_order - b.sort_order);

      const orderedLessons: LessonItem[] = [];
      for (const m of mods) {
        orderedLessons.push(
          ...Array.from(this.lessons.values())
            .filter((l) => l.module_id === m.id && l.is_published)
            .sort((a, b) => a.sort_order - b.sort_order),
        );
      }

      const completed = orderedLessons.filter(
        (l) => this.lessonProgress.get(`${studentId}:${l.id}`)?.status === 'completed',
      );
      const next =
        orderedLessons.find(
          (l) => this.lessonProgress.get(`${studentId}:${l.id}`)?.status !== 'completed',
        ) ?? orderedLessons[0];

      const total = orderedLessons.length;
      const percent = total > 0 ? Math.round((completed.length / total) * 100) : 0;

      results.push({
        enrollment: enr,
        course: this.enrichCourseCounts(course),
        total_lessons: total,
        completed_lessons: completed.length,
        progress_percent: percent,
        next_lesson_slug: next?.slug ?? null,
        next_lesson_title: next?.title ?? null,
      });
    }
    return results;
  }

  async getStudentProgressOverview(studentId: string) {
    const courses = await this.listStudentCourses(studentId);
    const completedLessons = Array.from(this.lessonProgress.values())
      .filter((p) => p.student_id === studentId && p.status === 'completed' && p.completed_at)
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      .map((p) => {
        const lesson = this.lessons.get(p.lesson_id);
        const course = this.courses.get(p.course_id);
        return {
          lesson_id: p.lesson_id,
          lesson_title: lesson?.title ?? 'Dərs',
          lesson_slug: lesson?.slug ?? '',
          course_slug: course?.slug ?? '',
          course_title: course?.title ?? 'Kurs',
          completed_at: p.completed_at!,
        };
      });

    const quizAttempts = this.quizAttempts
      .filter((q) => q.student_id === studentId)
      .map((q) => ({ ...q, quiz_title: this.quizzes.get(q.quiz_id)?.title }));
    const exerciseAttempts = this.exerciseAttempts
      .filter((e) => e.student_id === studentId)
      .map((e) => ({ ...e, exercise_title: this.exercises.get(e.exercise_id)?.title }));

    return {
      courses,
      completed_lessons: completedLessons,
      quiz_attempts: quizAttempts,
      exercise_attempts: exerciseAttempts,
    };
  }

  async upsertLessonProgress(
    studentId: string,
    lessonId: string,
    input: LessonProgressUpdateInput,
  ): Promise<LessonProgressRecord> {
    const viewer = this.buildSessionUser(studentId);
    const lesson = this.lessons.get(lessonId);
    if (!lesson || !lesson.is_published) {
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    }
    const mod = this.modules.get(lesson.module_id);
    const course = mod ? this.courses.get(mod.course_id) : undefined;
    if (!mod || !mod.is_published || !course || !course.is_published) {
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    }
    if (!this.isEnrolled(viewer, mod.course_id)) {
      throw new HttpError(
        403,
        'COURSE_NOT_ASSIGNED',
        'İrəliləyişi qeyd etmək üçün bu kurs hesabınıza təyin olunmalıdır.',
      );
    }

    const now = new Date().toISOString();
    const key = `${studentId}:${lessonId}`;
    const existing = this.lessonProgress.get(key);
    const record: LessonProgressRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      student_id: studentId,
      course_id: mod.course_id,
      lesson_id: lessonId,
      status: input.status,
      started_at: existing?.started_at ?? now,
      completed_at: input.status === 'completed' ? existing?.completed_at ?? now : null,
      last_accessed_at: now,
    };
    this.lessonProgress.set(key, record);
    return record;
  }

  async recordExerciseAttempt(
    studentId: string,
    exerciseId: string,
    input: ExerciseAttemptCreateInput,
  ): Promise<ExerciseAttemptSummary> {
    const viewer = this.buildSessionUser(studentId);
    const ex = this.exercises.get(exerciseId);
    if (!ex) throw new HttpError(404, 'EXERCISE_NOT_FOUND', 'Məşq tapılmadı.');
    const lesson = this.lessons.get(ex.lesson_id);
    const mod = lesson ? this.modules.get(lesson.module_id) : undefined;
    const course = mod ? this.courses.get(mod.course_id) : undefined;
    if (!lesson || !lesson.is_published || !mod || !mod.is_published || !course || !course.is_published) {
      throw new HttpError(404, 'EXERCISE_NOT_FOUND', 'Məşq tapılmadı.');
    }
    if (!this.isEnrolled(viewer, mod.course_id)) {
      throw new HttpError(
        403,
        'COURSE_NOT_ASSIGNED',
        'Məşq nəticəsini yadda saxlamaq üçün kursa təyin olunmuş aktiv tələbə olmalısınız.',
      );
    }

    const visibleTests = ex.test_cases.filter((tc) => !tc.is_hidden).length;
    const boundedTotal = Math.min(input.total_tests, visibleTests);
    const boundedPassed = Math.min(input.passed_tests, boundedTotal);

    const attempt: ExerciseAttemptSummary = {
      id: crypto.randomUUID(),
      student_id: studentId,
      exercise_id: exerciseId,
      exercise_title: ex.title,
      submitted_code: input.submitted_code,
      status: input.status,
      passed_tests: boundedPassed,
      total_tests: boundedTotal,
      stdout: input.stdout ?? null,
      stderr: input.stderr ?? null,
      execution_time_ms: input.execution_time_ms ?? null,
      created_at: new Date().toISOString(),
    };
    this.exerciseAttempts.unshift(attempt);
    return attempt;
  }

  async submitQuizAttempt(
    studentId: string,
    quizId: string,
    input: QuizSubmitInput,
  ): Promise<QuizAttemptResult> {
    const viewer = this.buildSessionUser(studentId);
    const quiz = this.quizzes.get(quizId);
    if (!quiz || quiz.status !== 'published') {
      throw new HttpError(404, 'QUIZ_NOT_FOUND', 'Quiz tapılmadı.');
    }
    const lesson = this.lessons.get(quiz.lesson_id);
    const mod = lesson ? this.modules.get(lesson.module_id) : undefined;
    if (!mod || !this.isEnrolled(viewer, mod.course_id)) {
      throw new HttpError(
        403,
        'COURSE_NOT_ASSIGNED',
        'Quiz göndərmək üçün bu kurs hesabınıza təyin olunmalıdır.',
      );
    }

    const prevAttempts = this.quizAttempts.filter(
      (a) => a.student_id === studentId && a.quiz_id === quizId,
    );
    if (quiz.max_attempts !== null && prevAttempts.length >= quiz.max_attempts) {
      throw new HttpError(400, 'MAX_ATTEMPTS_REACHED', 'Maksimum cəhd sayına çatmısınız.');
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const feedback: QuizAttemptResult['feedback'] = [];

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const userAns = input.answers.find((a) => a.question_id === q.id);
      const validOptIds = new Set(q.options.map((o) => o.id));
      const selected = Array.from(
        new Set((userAns?.selected_option_ids ?? []).filter((id) => validOptIds.has(id))),
      ).sort();
      const correct = q.options
        .filter((o) => o.is_correct)
        .map((o) => o.id)
        .sort();
      const isCorrect =
        correct.length > 0 &&
        selected.length === correct.length &&
        selected.every((id, i) => id === correct[i]);
      const pts = isCorrect ? q.points : 0;
      earnedPoints += pts;
      feedback.push({
        question_id: q.id,
        is_correct: isCorrect,
        points_awarded: pts,
        explanation: q.explanation,
      });
    }

    const scorePercent =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
    const isPassed = scorePercent >= quiz.passing_score_percent;
    const attemptNumber = prevAttempts.length + 1;
    const attemptId = crypto.randomUUID();

    this.quizAttempts.unshift({
      id: attemptId,
      student_id: studentId,
      quiz_id: quizId,
      attempt_number: attemptNumber,
      earned_points: earnedPoints,
      total_points: totalPoints,
      score_percent: scorePercent,
      is_passed: isPassed,
      submitted_at: new Date().toISOString(),
    });

    return {
      attempt_id: attemptId,
      attempt_number: attemptNumber,
      earned_points: earnedPoints,
      total_points: totalPoints,
      score_percent: scorePercent,
      is_passed: isPassed,
      feedback,
    };
  }

  async updateOwnProfile(studentId: string, input: ProfileUpdateInput): Promise<Profile> {
    const existing = this.profiles.get(studentId);
    if (!existing) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profil tapılmadı.');
    // SECURITY: Only explicitly permitted personal fields are updated. account_status/email/roles untouched.
    const updated: Profile = {
      ...existing,
      full_name: input.full_name,
      phone: input.phone ?? null,
      learning_goals: input.learning_goals ?? null,
      preferred_locale: input.preferred_locale ?? existing.preferred_locale,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(studentId, updated);
    return updated;
  }

  // --- Admin ---
  async getAdminStats(): Promise<AdminDashboardStats> {
    const apps = Array.from(this.applications.values());
    const profiles = Array.from(this.profiles.values());
    const courses = Array.from(this.courses.values());
    const studentProfiles = profiles.filter((p) => this.roles.get(p.id)?.has('student'));

    return {
      pending_applications: apps.filter((a) => a.status === 'pending').length,
      active_students: studentProfiles.filter((p) => p.account_status === 'active').length,
      suspended_students: studentProfiles.filter((p) => p.account_status === 'suspended').length,
      published_courses: courses.filter((c) => c.is_published).length,
      total_courses: courses.length,
      total_lessons: this.lessons.size,
      active_enrollments: Array.from(this.enrollments.values()).filter((e) => e.status === 'active')
        .length,
      recent_audit_logs: this.auditLogs.slice(0, 10),
    };
  }

  async listApplications(filter?: { status?: string; search?: string }): Promise<AdminApplicationView[]> {
    const q = filter?.search?.trim().toLowerCase();
    return Array.from(this.applications.values())
      .filter((a) => (!filter?.status || filter.status === 'all' ? true : a.status === filter.status))
      .map((a) => ({
        application: a,
        profile: this.profiles.get(a.user_id)!,
        notes: this.applicationNotes.get(a.id) ?? [],
      }))
      .filter((item) => {
        if (!item.profile) return false;
        if (!q) return true;
        return (
          item.profile.full_name.toLowerCase().includes(q) ||
          item.profile.email.toLowerCase().includes(q) ||
          item.application.reference_code.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.application.submitted_at.localeCompare(a.application.submitted_at));
  }

  async reviewApplication(
    applicationId: string,
    input: ApplicationReviewInput,
    audit: AuditContext,
  ): Promise<AdminApplicationView> {
    const app = this.applications.get(applicationId);
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Müraciət tapılmadı.');
    const profile = this.profiles.get(app.user_id);
    if (!profile) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'İstifadəçi profili tapılmadı.');

    const now = new Date().toISOString();
    const updatedApp: Application = {
      ...app,
      status: input.decision,
      reviewed_by: audit.actorId,
      reviewed_at: now,
      rejection_reason: input.decision === 'rejected' ? input.rejection_reason ?? null : null,
      updated_at: now,
    };
    this.applications.set(applicationId, updatedApp);

    // IMPORTANT: Approving sets account_status='active' ONLY; it does NOT assign any course!
    const updatedProfile: Profile = {
      ...profile,
      account_status: input.decision === 'approved' ? 'active' : 'rejected',
      updated_at: now,
    };
    this.profiles.set(profile.id, updatedProfile);

    if (input.internal_note && input.internal_note.trim().length > 0) {
      await this.addApplicationNote(applicationId, input.internal_note.trim(), audit);
    }

    this.recordAudit(
      audit,
      input.decision === 'approved' ? 'application.approved' : 'application.rejected',
      'application',
      applicationId,
      {
        student_id: profile.id,
        reference_code: app.reference_code,
        decision: input.decision,
      },
    );

    return {
      application: updatedApp,
      profile: updatedProfile,
      notes: this.applicationNotes.get(applicationId) ?? [],
    };
  }

  async addApplicationNote(
    applicationId: string,
    note: string,
    audit: AuditContext,
  ): Promise<ApplicationNote> {
    if (!this.applications.has(applicationId)) {
      throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'Müraciət tapılmadı.');
    }
    const author = audit.actorId ? this.profiles.get(audit.actorId) : undefined;
    const item: ApplicationNote = {
      id: crypto.randomUUID(),
      application_id: applicationId,
      author_id: audit.actorId,
      author_name: author?.full_name ?? 'Admin',
      note,
      created_at: new Date().toISOString(),
    };
    const list = this.applicationNotes.get(applicationId) ?? [];
    list.unshift(item);
    this.applicationNotes.set(applicationId, list);

    this.recordAudit(audit, 'application_note.created', 'application', applicationId, {
      note_id: item.id,
    });
    return item;
  }

  async listStudents(filter?: { status?: string; search?: string }): Promise<AdminStudentView[]> {
    const q = filter?.search?.trim().toLowerCase();
    return Array.from(this.profiles.values())
      .filter((p) => this.roles.get(p.id)?.has('student'))
      .filter((p) =>
        !filter?.status || filter.status === 'all' ? true : p.account_status === filter.status,
      )
      .filter((p) => {
        if (!q) return true;
        return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
      })
      .map((p) => {
        const app = Array.from(this.applications.values()).find((a) => a.user_id === p.id) ?? null;
        const enrollments = Array.from(this.enrollments.values())
          .filter((e) => e.student_id === p.id)
          .map((e) => ({ ...e, course: this.courses.get(e.course_id) }));
        const completedCount = Array.from(this.lessonProgress.values()).filter(
          (lp) => lp.student_id === p.id && lp.status === 'completed',
        ).length;
        return {
          profile: p,
          roles: Array.from(this.roles.get(p.id) ?? []),
          application: app,
          enrollments,
          completed_lessons_count: completedCount,
        };
      })
      .sort((a, b) => b.profile.created_at.localeCompare(a.profile.created_at));
  }

  async updateStudentAccountStatus(
    studentId: string,
    accountStatus: 'active' | 'suspended',
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Profile> {
    if (studentId === audit.actorId) {
      throw new HttpError(
        403,
        'SELF_MODIFICATION_FORBIDDEN',
        'Öz administrator hesabınızın statusunu dəyişə bilməzsiniz.',
      );
    }
    const profile = this.profiles.get(studentId);
    if (!profile) throw new HttpError(404, 'STUDENT_NOT_FOUND', 'Tələbə tapılmadı.');
    const targetRoles = this.roles.get(studentId);
    if (targetRoles?.has('admin')) {
      throw new HttpError(403, 'ADMIN_PROTECTED', 'Administrator hesabları bu bölmədən dondurula bilməz.');
    }
    if (!targetRoles?.has('student')) {
      throw new HttpError(400, 'NOT_A_STUDENT', 'Yalnız tələbə hesablarının statusu dəyişdirilə bilər.');
    }
    if (profile.account_status !== 'active' && profile.account_status !== 'suspended') {
      throw new HttpError(
        400,
        'APPROVAL_WORKFLOW_REQUIRED',
        'Gözləmədə, rədd edilmiş və ya arxivlənmiş hesablar yalnız müraciət təsdiqi axını ilə aktivləşdirilə bilər.',
      );
    }
    const updated: Profile = {
      ...profile,
      account_status: accountStatus,
      archived_at: null,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(studentId, updated);
    this.recordAudit(
      audit,
      accountStatus === 'suspended' ? 'student.suspended' : 'student.reactivated',
      'profile',
      studentId,
      { reason: reason ?? null },
    );
    return updated;
  }

  async listEnrollments(filter?: { studentId?: string; courseId?: string }): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter((e) => (!filter?.studentId ? true : e.student_id === filter.studentId))
      .filter((e) => (!filter?.courseId ? true : e.course_id === filter.courseId))
      .map((e) => {
        const p = this.profiles.get(e.student_id);
        return {
          ...e,
          course: this.courses.get(e.course_id),
          student_name: p?.full_name,
          student_email: p?.email,
        };
      })
      .sort((a, b) => b.assigned_at.localeCompare(a.assigned_at));
  }

  async assignCoursesToStudent(
    studentId: string,
    courseIds: string[],
    audit: AuditContext,
  ): Promise<Enrollment[]> {
    const profile = this.profiles.get(studentId);
    if (!profile) throw new HttpError(404, 'STUDENT_NOT_FOUND', 'Tələbə tapılmadı.');
    if (profile.account_status !== 'active' || !this.roles.get(studentId)?.has('student')) {
      throw new HttpError(
        400,
        'STUDENT_NOT_ACTIVE',
        'Yalnız təsdiqlənmiş və aktiv tələbələrə kurs təyin edilə bilər.',
      );
    }

    const now = new Date().toISOString();
    const assigned: Enrollment[] = [];
    for (const courseId of Array.from(new Set(courseIds))) {
      if (!this.courses.has(courseId)) {
        throw new HttpError(404, 'COURSE_NOT_FOUND', `Kurs tapılmadı (${courseId}).`);
      }
      const existing = Array.from(this.enrollments.values()).find(
        (e) => e.student_id === studentId && e.course_id === courseId,
      );
      const record: Enrollment = existing
        ? {
            ...existing,
            status: 'active',
            assigned_by: audit.actorId,
            assigned_at: now,
            revoked_by: null,
            revoked_at: null,
            revoke_reason: null,
          }
        : {
            id: crypto.randomUUID(),
            student_id: studentId,
            course_id: courseId,
            status: 'active',
            assigned_by: audit.actorId,
            assigned_at: now,
            revoked_by: null,
            revoked_at: null,
            revoke_reason: null,
            completed_at: null,
          };
      this.enrollments.set(record.id, record);
      assigned.push({ ...record, course: this.courses.get(courseId) });

      this.recordAudit(audit, 'enrollment.assigned', 'enrollment', record.id, {
        student_id: studentId,
        course_id: courseId,
      });
    }
    return assigned;
  }

  async revokeEnrollment(
    enrollmentId: string,
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Enrollment> {
    const existing = this.enrollments.get(enrollmentId);
    if (!existing) throw new HttpError(404, 'ENROLLMENT_NOT_FOUND', 'Kurs təyinatı tapılmadı.');
    const now = new Date().toISOString();
    const updated: Enrollment = {
      ...existing,
      status: 'revoked',
      revoked_by: audit.actorId,
      revoked_at: now,
      revoke_reason: reason ?? null,
    };
    this.enrollments.set(enrollmentId, updated);
    this.recordAudit(audit, 'enrollment.revoked', 'enrollment', enrollmentId, {
      student_id: existing.student_id,
      course_id: existing.course_id,
      reason: reason ?? null,
    });
    return updated;
  }

  // --- Admin CMS ---
  async listAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => this.enrichCourseCounts(c));
  }

  async createCourse(input: CourseUpsertInput, audit: AuditContext): Promise<Course> {
    if (Array.from(this.courses.values()).some((c) => c.slug === input.slug)) {
      throw new HttpError(409, 'SLUG_EXISTS', 'Bu slug artıq başqa kursda istifadə olunur.');
    }
    const now = new Date().toISOString();
    const course: Course = {
      id: crypto.randomUUID(),
      slug: input.slug,
      locale: input.locale,
      title: input.title,
      subtitle: input.subtitle ?? null,
      description: input.description,
      learning_objectives: input.learning_objectives,
      target_audience: input.target_audience ?? null,
      programming_language: input.programming_language,
      difficulty: input.difficulty,
      estimated_duration_minutes: input.estimated_duration_minutes,
      cover_image_path: input.cover_image_path ?? null,
      sort_order: input.sort_order,
      status: input.status,
      is_published: input.status === 'published',
      published_at: input.status === 'published' ? now : null,
      archived_at: input.status === 'archived' ? now : null,
      created_at: now,
      updated_at: now,
    };
    this.courses.set(course.id, course);
    this.recordAudit(audit, 'course.created', 'course', course.id, { slug: course.slug });
    return course;
  }

  async updateCourse(
    courseId: string,
    input: Partial<CourseUpsertInput>,
    audit: AuditContext,
  ): Promise<Course> {
    const existing = this.courses.get(courseId);
    if (!existing) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Kurs tapılmadı.');
    const now = new Date().toISOString();
    const nextStatus = input.status ?? existing.status;
    const updated: Course = {
      ...existing,
      ...input,
      status: nextStatus,
      is_published: nextStatus === 'published',
      published_at:
        nextStatus === 'published' ? existing.published_at ?? now : existing.published_at,
      archived_at: nextStatus === 'archived' ? existing.archived_at ?? now : null,
      updated_at: now,
    };
    this.courses.set(courseId, updated);
    this.recordAudit(audit, 'course.updated', 'course', courseId, { status: nextStatus });
    return updated;
  }

  async listCourseModules(courseId: string): Promise<ModuleItem[]> {
    return Array.from(this.modules.values())
      .filter((m) => m.course_id === courseId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async createModule(input: ModuleUpsertInput, audit: AuditContext): Promise<ModuleItem> {
    if (!this.courses.has(input.course_id)) {
      throw new HttpError(404, 'COURSE_NOT_FOUND', 'Kurs tapılmadı.');
    }
    const now = new Date().toISOString();
    const mod: ModuleItem = {
      id: crypto.randomUUID(),
      course_id: input.course_id,
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      sort_order: input.sort_order,
      is_public: input.is_public,
      status: input.status,
      is_published: input.status === 'published',
      created_at: now,
      updated_at: now,
    };
    this.modules.set(mod.id, mod);
    this.recordAudit(audit, 'module.created', 'module', mod.id, {
      course_id: mod.course_id,
      is_public: mod.is_public,
    });
    return mod;
  }

  async updateModule(
    moduleId: string,
    input: Partial<ModuleUpsertInput>,
    audit: AuditContext,
  ): Promise<ModuleItem> {
    const existing = this.modules.get(moduleId);
    if (!existing) throw new HttpError(404, 'MODULE_NOT_FOUND', 'Modul tapılmadı.');
    const nextStatus = input.status ?? existing.status;
    const updated: ModuleItem = {
      ...existing,
      ...input,
      status: nextStatus,
      is_published: nextStatus === 'published',
      updated_at: new Date().toISOString(),
    };
    this.modules.set(moduleId, updated);
    const action =
      input.is_public !== undefined && input.is_public !== existing.is_public
        ? 'module.visibility_changed'
        : 'module.updated';
    this.recordAudit(audit, action, 'module', moduleId, {
      is_public: updated.is_public,
      status: updated.status,
    });
    return updated;
  }

  async listModuleLessons(moduleId: string): Promise<LessonItem[]> {
    return Array.from(this.lessons.values())
      .filter((l) => l.module_id === moduleId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async createLesson(input: LessonUpsertInput, audit: AuditContext): Promise<LessonItem> {
    if (!this.modules.has(input.module_id)) {
      throw new HttpError(404, 'MODULE_NOT_FOUND', 'Modul tapılmadı.');
    }
    const now = new Date().toISOString();
    const lesson: LessonItem = {
      id: crypto.randomUUID(),
      module_id: input.module_id,
      slug: input.slug,
      title: input.title,
      summary: input.summary ?? null,
      estimated_minutes: input.estimated_minutes,
      sort_order: input.sort_order,
      status: input.status,
      is_published: input.status === 'published',
      created_at: now,
      updated_at: now,
    };
    this.lessons.set(lesson.id, lesson);
    this.recordAudit(audit, 'lesson.created', 'lesson', lesson.id, { module_id: lesson.module_id });
    return lesson;
  }

  async updateLesson(
    lessonId: string,
    input: Partial<LessonUpsertInput>,
    audit: AuditContext,
  ): Promise<LessonItem> {
    const existing = this.lessons.get(lessonId);
    if (!existing) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    const nextStatus = input.status ?? existing.status;
    const updated: LessonItem = {
      ...existing,
      ...input,
      status: nextStatus,
      is_published: nextStatus === 'published',
      updated_at: new Date().toISOString(),
    };
    this.lessons.set(lessonId, updated);
    this.recordAudit(audit, 'lesson.updated', 'lesson', lessonId, { status: updated.status });
    return updated;
  }

  async listLessonBlocksAdmin(lessonId: string) {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    const blocks = Array.from(this.blocks.values())
      .filter((b) => b.lesson_id === lessonId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const exercises = Array.from(this.exercises.values()).filter((e) => e.lesson_id === lessonId);
    const quizzes = Array.from(this.quizzes.values()).filter((q) => q.lesson_id === lessonId);
    return { lesson, blocks, exercises, quizzes };
  }

  async createContentBlock(
    input: ContentBlockUpsertInput,
    audit: AuditContext,
  ): Promise<LessonContentBlock> {
    if (!this.lessons.has(input.lesson_id)) {
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    }
    const block: LessonContentBlock = {
      id: crypto.randomUUID(),
      lesson_id: input.lesson_id,
      locale: input.locale,
      block_type: input.block_type,
      sort_order: input.sort_order,
      title: input.title ?? null,
      content: input.content,
      exercise_id: input.exercise_id ?? null,
      quiz_id: input.quiz_id ?? null,
      is_published: input.is_published,
    };
    this.blocks.set(block.id, block);
    this.recordAudit(audit, 'lesson_block.created', 'lesson_content_block', block.id, {
      lesson_id: block.lesson_id,
      block_type: block.block_type,
    });
    return block;
  }

  async updateContentBlock(
    blockId: string,
    input: Partial<ContentBlockUpsertInput>,
    audit: AuditContext,
  ): Promise<LessonContentBlock> {
    const existing = this.blocks.get(blockId);
    if (!existing) throw new HttpError(404, 'BLOCK_NOT_FOUND', 'Blok tapılmadı.');
    const updated: LessonContentBlock = {
      ...existing,
      ...input,
      title: input.title !== undefined ? input.title ?? null : existing.title,
    };
    this.blocks.set(blockId, updated);
    this.recordAudit(audit, 'lesson_block.updated', 'lesson_content_block', blockId, {});
    return updated;
  }

  async deleteContentBlock(blockId: string, audit: AuditContext): Promise<void> {
    const existing = this.blocks.get(blockId);
    if (!existing) throw new HttpError(404, 'BLOCK_NOT_FOUND', 'Blok tapılmadı.');
    this.blocks.delete(blockId);
    this.recordAudit(audit, 'lesson_block.deleted', 'lesson_content_block', blockId, {
      lesson_id: existing.lesson_id,
    });
  }

  async createExercise(input: ExerciseUpsertInput, audit: AuditContext): Promise<PublicExercise> {
    const id = crypto.randomUUID();
    const exercise: SeedExercise = {
      id,
      lesson_id: input.lesson_id,
      locale: input.locale,
      title: input.title,
      instructions: input.instructions,
      programming_language: input.programming_language,
      starter_code: input.starter_code,
      solution_code: input.solution_code ?? '',
      hints: input.hints,
      execution_mode: input.execution_mode,
      time_limit_ms: input.time_limit_ms,
      max_output_chars: input.max_output_chars,
      test_cases: input.test_cases.map((tc, i) => ({
        id: crypto.randomUUID(),
        exercise_id: id,
        label: tc.label,
        stdin_input: tc.stdin_input,
        expected_stdout: tc.expected_stdout ?? null,
        assertion_code: tc.assertion_code ?? null,
        is_hidden: tc.is_hidden,
        sort_order: tc.sort_order || i + 1,
      })),
    };
    this.exercises.set(id, exercise);
    this.recordAudit(audit, 'exercise.created', 'exercise', id, { lesson_id: input.lesson_id });
    return stripExerciseForStudent(exercise);
  }

  async createQuiz(input: QuizUpsertInput, audit: AuditContext): Promise<AdminQuiz> {
    const quizId = crypto.randomUUID();
    const quiz: AdminQuiz = {
      id: quizId,
      lesson_id: input.lesson_id,
      locale: input.locale,
      title: input.title,
      description: input.description ?? null,
      passing_score_percent: input.passing_score_percent,
      max_attempts: input.max_attempts ?? null,
      status: input.status,
      questions: input.questions.map((q, qi) => {
        const qId = crypto.randomUUID();
        return {
          id: qId,
          quiz_id: quizId,
          question_type: q.question_type,
          prompt: q.prompt,
          code_snippet: q.code_snippet ?? null,
          code_language: q.code_language ?? null,
          explanation: q.explanation ?? null,
          points: q.points,
          sort_order: q.sort_order || qi + 1,
          options: q.options.map((o, oi) => ({
            id: crypto.randomUUID(),
            question_id: qId,
            option_text: o.option_text,
            is_correct: o.is_correct,
            sort_order: o.sort_order || oi + 1,
          })),
        };
      }),
    };
    this.quizzes.set(quizId, quiz);
    this.recordAudit(audit, 'quiz.created', 'quiz', quizId, { lesson_id: input.lesson_id });
    return quiz;
  }

  // --- Admin Settings & Audit Logs ---
  async getAdminSettings(): Promise<AdminPlatformSettings> {
    return { ...this.settings };
  }

  async updateAdminSettings(
    input: PlatformSettingsUpdateInput,
    audit: AuditContext,
  ): Promise<AdminPlatformSettings> {
    const enabled = input.whatsapp_button_enabled && Boolean(input.whatsapp_phone);
    this.settings = {
      academy_name: input.academy_name,
      academy_tagline: input.academy_tagline,
      logo_storage_path: input.logo_storage_path ?? null,
      contact_email: input.contact_email ?? null,
      whatsapp_button_enabled: enabled,
      whatsapp_phone: enabled ? input.whatsapp_phone ?? null : null,
      raw_whatsapp_button_enabled: input.whatsapp_button_enabled,
      raw_whatsapp_phone: input.whatsapp_phone ?? null,
      whatsapp_button_label: input.whatsapp_button_label,
      whatsapp_message_template: input.whatsapp_message_template,
      alternative_contact_text: input.alternative_contact_text ?? null,
      registration_enabled: input.registration_enabled,
      default_public_modules_count: input.default_public_modules_count,
      updated_by: audit.actorId,
      updated_at: new Date().toISOString(),
    };
    this.recordAudit(audit, 'settings.updated', 'platform_settings', null, {
      whatsapp_button_enabled: input.whatsapp_button_enabled,
      registration_enabled: input.registration_enabled,
    });
    return { ...this.settings };
  }

  async listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    return this.auditLogs.slice(0, limit);
  }
}
