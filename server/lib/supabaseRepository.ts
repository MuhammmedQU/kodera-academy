import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
  ExerciseTestCase,
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
} from '../../src/shared/types/domain';
import { HttpError } from './http';
import type { AuditContext, KoderaRepository } from './repository';
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
} from './types';

function assertNoDbError(error: { message: string; code?: string } | null, fallback: string): void {
  if (!error) return;
  if (error.code === '23505') {
    throw new HttpError(409, 'DUPLICATE_RECORD', 'Bu məlumat artıq mövcuddur.');
  }
  if (error.code === '42501') {
    throw new HttpError(403, 'FORBIDDEN', 'Bu əməliyyat üçün icazəniz yoxdur.');
  }
  throw new HttpError(500, 'DATABASE_ERROR', `${fallback}: ${error.message}`);
}

/**
 * Production & Staging repository backed by Supabase PostgreSQL, Auth & Storage.
 * Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server after explicit JWT/RBAC verification.
 */
export class SupabaseRepository implements KoderaRepository {
  private admin: SupabaseClient;
  private anon: SupabaseClient;
  private supabaseUrl: string;
  private anonKey: string;
  private appUrl: string;

  constructor(config: {
    supabaseUrl: string;
    serviceRoleKey: string;
    anonKey: string;
    appUrl: string;
  }) {
    this.supabaseUrl = config.supabaseUrl;
    this.anonKey = config.anonKey;
    this.appUrl = config.appUrl;

    this.admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.anon = createClient(config.supabaseUrl, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private userScopedClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  private async writeAudit(
    audit: AuditContext,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.admin.from('audit_logs').insert({
      actor_id: audit.actorId,
      actor_role: audit.actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: audit.ipAddress,
      user_agent: audit.userAgent,
    });
  }

  async checkRateLimit(
    bucketKey: string,
    action: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<boolean> {
    const { data, error } = await this.admin.rpc('check_and_record_rate_limit', {
      p_bucket_key: bucketKey,
      p_action: action,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });
    if (error) {
      console.error('[RateLimit RPC Error]', error.message);
      return true;
    }
    return Boolean(data);
  }

  async resolveUserByToken(token: string): Promise<AuthSessionUser | null> {
    const { data: authData, error: authErr } = await this.admin.auth.getUser(token);
    if (authErr || !authData.user) return null;

    const userId = authData.user.id;
    const [profileRes, rolesRes, appsRes] = await Promise.all([
      this.admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      this.admin.from('user_roles').select('role').eq('user_id', userId).is('revoked_at', null),
      this.admin
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1),
    ]);

    if (profileRes.error || !profileRes.data) return null;
    const profile = profileRes.data as Profile;
    const roles = ((rolesRes.data ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
    const application = ((appsRes.data ?? [])[0] as Application | undefined) ?? null;

    return {
      profile,
      roles,
      isAdmin: roles.includes('admin') && profile.account_status === 'active',
      isActiveStudent: roles.includes('student') && profile.account_status === 'active',
      application,
    };
  }

  async registerStudent(
    input: RegisterInput,
  ): Promise<{
    access_token?: string;
    requires_email_verification: boolean;
    reference_code: string;
    user?: AuthSessionUser;
  }> {
    const settings = await this.getPublicSettings();
    if (!settings.registration_enabled) {
      throw new HttpError(403, 'REGISTRATION_CLOSED', 'Hazırda yeni qeydiyyat bağlıdır.');
    }

    // Standard Supabase signUp triggers email confirmation & atomic `handle_new_user()` DB trigger
    const { data, error } = await this.anon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${this.appUrl}/login`,
        data: {
          full_name: input.full_name,
          phone: input.phone ?? null,
          learning_goals: input.learning_goals ?? null,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new HttpError(409, 'EMAIL_EXISTS', 'Bu email ünvanı artıq qeydiyyatdadır.');
      }
      throw new HttpError(400, 'REGISTRATION_FAILED', error.message);
    }

    const userId = data.user?.id;
    let refCode = '';
    if (userId) {
      const { data: appRow } = await this.admin
        .from('applications')
        .select('reference_code')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      refCode = (appRow as { reference_code?: string } | null)?.reference_code ?? '';
    }

    const requiresVerification = !data.session;
    const sessionUser = data.session?.access_token
      ? (await this.resolveUserByToken(data.session.access_token)) ?? undefined
      : undefined;

    return {
      access_token: data.session?.access_token,
      requires_email_verification: requiresVerification,
      reference_code: refCode,
      user: sessionUser,
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.anon.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.appUrl}/reset-password`,
    });
  }

  async getPublicSettings(): Promise<PublicPlatformSettings> {
    const { data, error } = await this.admin.rpc('get_public_platform_settings');
    assertNoDbError(error, 'Platforma tənzimləmələri oxunmadı');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new HttpError(500, 'SETTINGS_MISSING', 'Platforma tənzimləmələri tapılmadı.');
    }
    return row as PublicPlatformSettings;
  }

  async listPublishedCourses(): Promise<Course[]> {
    const { data, error } = await this.admin
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Kurslar yüklənmədi');
    const courses = (data ?? []) as Course[];
    if (courses.length === 0) return [];

    const courseIds = courses.map((c) => c.id);
    const { data: modRows } = await this.admin
      .from('modules')
      .select('id, course_id, is_public')
      .in('course_id', courseIds)
      .eq('is_published', true);
    const mods = (modRows ?? []) as Array<{ id: string; course_id: string; is_public: boolean }>;
    const modIds = mods.map((m) => m.id);
    const { data: lessonRows } = modIds.length
      ? await this.admin
          .from('lessons')
          .select('id, module_id')
          .in('module_id', modIds)
          .eq('is_published', true)
      : { data: [] };
    const lessons = (lessonRows ?? []) as Array<{ id: string; module_id: string }>;

    return courses.map((c) => {
      const cMods = mods.filter((m) => m.course_id === c.id);
      const cModIds = new Set(cMods.map((m) => m.id));
      return {
        ...c,
        public_module_count: cMods.filter((m) => m.is_public).length,
        total_module_count: cMods.length,
        total_lesson_count: lessons.filter((l) => cModIds.has(l.module_id)).length,
      };
    });
  }

  private async checkEnrolled(viewer: AuthSessionUser | null, courseId: string): Promise<boolean> {
    if (!viewer || !viewer.isActiveStudent) return false;
    const { data } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', viewer.profile.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    return Boolean(data);
  }

  async getCourseBySlug(slug: string, viewer: AuthSessionUser | null) {
    const query = this.admin.from('courses').select('*').eq('slug', slug);
    if (!viewer?.isAdmin) {
      query.eq('is_published', true);
    }
    const { data: courseRow, error } = await query.maybeSingle();
    assertNoDbError(error, 'Kurs tapılmadı');
    if (!courseRow) return null;
    const course = courseRow as Course;

    const isEnrolled = await this.checkEnrolled(viewer, course.id);
    const modQuery = this.admin
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) modQuery.eq('is_published', true);
    const { data: modData } = await modQuery;
    const mods = (modData ?? []) as ModuleItem[];
    const modIds = mods.map((m) => m.id);

    const lessonQuery = modIds.length
      ? this.admin
          .from('lessons')
          .select('*')
          .in('module_id', modIds)
          .order('sort_order', { ascending: true })
      : null;
    if (lessonQuery && !viewer?.isAdmin) lessonQuery.eq('is_published', true);
    const lessonData = lessonQuery ? (await lessonQuery).data : [];
    const lessons = (lessonData ?? []) as LessonItem[];

    const progressMap = new Map<string, LessonProgressRecord['status']>();
    if (viewer) {
      const { data: progRows } = await this.admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', viewer.profile.id)
        .eq('course_id', course.id);
      for (const r of (progRows ?? []) as Array<{ lesson_id: string; status: LessonProgressRecord['status'] }>) {
        progressMap.set(r.lesson_id, r.status);
      }
    }

    const outline: CurriculumOutlineModule[] = mods.map((m) => {
      const canAccess = Boolean(viewer?.isAdmin || (course.is_published && m.is_published && (m.is_public || isEnrolled)));
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        sort_order: m.sort_order,
        is_public: m.is_public,
        can_access: canAccess,
        lessons: lessons
          .filter((l) => l.module_id === m.id)
          .map((l) => ({
            id: l.id,
            slug: canAccess ? l.slug : null,
            title: l.title,
            sort_order: l.sort_order,
            estimated_minutes: l.estimated_minutes,
            progress_status: progressMap.get(l.id),
          })),
      };
    });

    return {
      course: {
        ...course,
        public_module_count: mods.filter((m) => m.is_public).length,
        total_module_count: mods.length,
        total_lesson_count: lessons.length,
      },
      outline,
      is_enrolled: isEnrolled,
    };
  }

  async getLessonView(courseSlug: string, lessonSlug: string, viewer: AuthSessionUser | null) {
    const courseRes = await this.getCourseBySlug(courseSlug, viewer);
    if (!courseRes) return { status: 'not_found' as const };

    const { course, is_enrolled } = courseRes;
    const modQuery = this.admin
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) modQuery.eq('is_published', true);
    const mods = ((await modQuery).data ?? []) as ModuleItem[];
    const modIds = mods.map((m) => m.id);
    if (modIds.length === 0) return { status: 'not_found' as const };

    const lesQuery = this.admin
      .from('lessons')
      .select('*')
      .in('module_id', modIds)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) lesQuery.eq('is_published', true);
    const allLessons = ((await lesQuery).data ?? []) as LessonItem[];

    const ordered: Array<{ module: ModuleItem; lesson: LessonItem }> = [];
    for (const m of mods) {
      for (const l of allLessons.filter((item) => item.module_id === m.id)) {
        ordered.push({ module: m, lesson: l });
      }
    }

    const idx = ordered.findIndex((o) => o.lesson.slug === lessonSlug);
    if (idx === -1) return { status: 'not_found' as const };
    const current = ordered[idx]!;
    const canAccess = Boolean(viewer?.isAdmin || current.module.is_public || is_enrolled);
    if (!canAccess) {
      return { status: 'forbidden' as const, course, moduleTitle: current.module.title };
    }

    const blockQuery = this.admin
      .from('lesson_content_blocks')
      .select('*')
      .eq('lesson_id', current.lesson.id)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) blockQuery.eq('is_published', true);
    const rawBlocks = ((await blockQuery).data ?? []) as LessonContentBlock[];

    const exerciseIds = rawBlocks.map((b) => b.exercise_id).filter((x): x is string => Boolean(x));
    const quizIds = rawBlocks.map((b) => b.quiz_id).filter((x): x is string => Boolean(x));

    const exerciseMap = new Map<string, PublicExercise>();
    if (exerciseIds.length > 0) {
      const [{ data: exRows }, { data: tcRows }] = await Promise.all([
        this.admin.from('exercises').select('*').in('id', exerciseIds),
        this.admin
          .from('exercise_test_cases')
          .select('*')
          .in('exercise_id', exerciseIds)
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true }),
      ]);
      const tcs = (tcRows ?? []) as ExerciseTestCase[];
      for (const ex of (exRows ?? []) as Array<Omit<PublicExercise, 'test_cases'>>) {
        exerciseMap.set(ex.id, {
          ...ex,
          test_cases: tcs.filter((t) => t.exercise_id === ex.id),
        });
      }
    }

    const quizMap = new Map<string, PublicQuiz>();
    if (quizIds.length > 0) {
      // Explicitly omit explanation and is_correct so answer keys are never returned to clients
      const [{ data: qzRows }, { data: qRows }] = await Promise.all([
        this.admin.from('quizzes').select('*').in('id', quizIds),
        this.admin
          .from('quiz_questions')
          .select('id, quiz_id, question_type, prompt, code_snippet, code_language, points, sort_order')
          .in('quiz_id', quizIds)
          .order('sort_order', { ascending: true }),
      ]);
      const qs = (qRows ?? []) as Array<Omit<PublicQuiz['questions'][number], 'options'>>;
      const qIds = qs.map((q) => q.id);
      const { data: optRows } = qIds.length
        ? await this.admin
            .from('quiz_question_options')
            .select('id, question_id, option_text, sort_order')
            .in('question_id', qIds)
            .order('sort_order', { ascending: true })
        : { data: [] };
      const opts = (optRows ?? []) as PublicQuiz['questions'][number]['options'];

      for (const qz of (qzRows ?? []) as Array<Omit<PublicQuiz, 'questions'>>) {
        quizMap.set(qz.id, {
          ...qz,
          questions: qs
            .filter((q) => q.quiz_id === qz.id)
            .map((q) => ({
              ...q,
              options: opts.filter((o) => o.question_id === q.id),
            })),
        });
      }
    }

    const blocks: LessonContentBlock[] = rawBlocks.map((b) => ({
      ...b,
      exercise: b.exercise_id ? exerciseMap.get(b.exercise_id) : undefined,
      quiz: b.quiz_id ? quizMap.get(b.quiz_id) : undefined,
    }));

    const prevItem = idx > 0 ? ordered[idx - 1]! : null;
    const nextItem = idx + 1 < ordered.length ? ordered[idx + 1]! : null;
    const publicLessons = ordered.filter((o) => o.module.is_public);
    const lastPublic = publicLessons[publicLessons.length - 1];

    let progressStatus: LessonViewPayload['progress_status'] = 'not_started';
    const previousQuizAttempts: Record<string, QuizAttemptSummary[]> = {};
    const previousExerciseAttempts: Record<string, ExerciseAttemptSummary[]> = {};

    if (viewer) {
      const { data: prog } = await this.admin
        .from('lesson_progress')
        .select('status')
        .eq('student_id', viewer.profile.id)
        .eq('lesson_id', current.lesson.id)
        .maybeSingle();
      if (prog) progressStatus = (prog as { status: LessonViewPayload['progress_status'] }).status;

      if (quizIds.length > 0) {
        const { data: qa } = await this.admin
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', viewer.profile.id)
          .in('quiz_id', quizIds)
          .order('submitted_at', { ascending: false });
        for (const row of (qa ?? []) as QuizAttemptSummary[]) {
          const list = previousQuizAttempts[row.quiz_id] ?? [];
          list.push(row);
          previousQuizAttempts[row.quiz_id] = list;
        }
      }

      if (exerciseIds.length > 0) {
        const { data: ea } = await this.admin
          .from('exercise_attempts')
          .select('*')
          .eq('student_id', viewer.profile.id)
          .in('exercise_id', exerciseIds)
          .order('created_at', { ascending: false });
        for (const row of (ea ?? []) as ExerciseAttemptSummary[]) {
          const list = previousExerciseAttempts[row.exercise_id] ?? [];
          list.push(row);
          previousExerciseAttempts[row.exercise_id] = list;
        }
      }
    }

    return {
      status: 'ok' as const,
      payload: {
        course,
        module: current.module,
        lesson: current.lesson,
        blocks,
        prev_lesson: prevItem
          ? {
              slug: prevItem.lesson.slug,
              title: prevItem.lesson.title,
              is_locked: !(viewer?.isAdmin || prevItem.module.is_public || is_enrolled),
            }
          : null,
        next_lesson: nextItem
          ? {
              slug: nextItem.lesson.slug,
              title: nextItem.lesson.title,
              is_locked: !(viewer?.isAdmin || nextItem.module.is_public || is_enrolled),
            }
          : null,
        is_last_public_lesson: Boolean(
          !is_enrolled && lastPublic && lastPublic.lesson.id === current.lesson.id,
        ),
        is_enrolled,
        progress_status: progressStatus,
        previous_quiz_attempts: previousQuizAttempts,
        previous_exercise_attempts: previousExerciseAttempts,
      },
    };
  }

  async listStudentCourses(studentId: string): Promise<StudentCourseWithProgress[]> {
    const { data: enrRows, error } = await this.admin
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', studentId)
      .in('status', ['active', 'completed']);
    assertNoDbError(error, 'Təyin olunmuş kurslar yüklənmədi');

    const rows = (enrRows ?? []) as Array<Enrollment & { courses: Course | null }>;
    const results: StudentCourseWithProgress[] = [];

    for (const row of rows) {
      const course = row.courses;
      if (!course || !course.is_published) continue;

      const { data: modRows } = await this.admin
        .from('modules')
        .select('id, sort_order')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      const modIds = ((modRows ?? []) as Array<{ id: string }>).map((m) => m.id);
      const { data: lesRows } = modIds.length
        ? await this.admin
            .from('lessons')
            .select('id, slug, title, module_id, sort_order')
            .in('module_id', modIds)
            .eq('is_published', true)
            .order('sort_order', { ascending: true })
        : { data: [] };
      const allLessons = (lesRows ?? []) as Array<{
        id: string;
        slug: string;
        title: string;
        module_id: string;
      }>;
      const orderedLessons = modIds.flatMap((mid) => allLessons.filter((l) => l.module_id === mid));

      const { data: progRows } = await this.admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', studentId)
        .eq('course_id', course.id)
        .eq('status', 'completed');
      const completedSet = new Set(
        ((progRows ?? []) as Array<{ lesson_id: string }>).map((p) => p.lesson_id),
      );
      const next = orderedLessons.find((l) => !completedSet.has(l.id)) ?? orderedLessons[0];
      const total = orderedLessons.length;
      const completedCount = orderedLessons.filter((l) => completedSet.has(l.id)).length;

      results.push({
        enrollment: row,
        course,
        total_lessons: total,
        completed_lessons: completedCount,
        progress_percent: total > 0 ? Math.round((completedCount / total) * 100) : 0,
        next_lesson_slug: next?.slug ?? null,
        next_lesson_title: next?.title ?? null,
      });
    }
    return results;
  }

  async getStudentProgressOverview(studentId: string) {
    const courses = await this.listStudentCourses(studentId);
    const [progRes, quizRes, exRes] = await Promise.all([
      this.admin
        .from('lesson_progress')
        .select('lesson_id, completed_at, lessons(title, slug), courses(title, slug)')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }),
      this.admin
        .from('quiz_attempts')
        .select('*, quizzes(title)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false }),
      this.admin
        .from('exercise_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const unwrap = <T,>(v: T | T[] | null | undefined): T | null =>
      Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

    const completedLessons = ((progRes.data ?? []) as unknown as Array<{
      lesson_id: string;
      completed_at: string | null;
      lessons: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
      courses: { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
    }>).map((r) => {
      const les = unwrap(r.lessons);
      const crs = unwrap(r.courses);
      return {
        lesson_id: r.lesson_id,
        lesson_title: les?.title ?? 'Dərs',
        lesson_slug: les?.slug ?? '',
        course_slug: crs?.slug ?? '',
        course_title: crs?.title ?? 'Kurs',
        completed_at: r.completed_at ?? '',
      };
    });

    const quizAttempts = ((quizRes.data ?? []) as unknown as Array<
      QuizAttemptSummary & { quizzes: { title: string } | Array<{ title: string }> | null }
    >).map((r) => ({
      ...r,
      quiz_title: unwrap(r.quizzes)?.title,
    }));

    return {
      courses,
      completed_lessons: completedLessons,
      quiz_attempts: quizAttempts,
      exercise_attempts: (exRes.data ?? []) as ExerciseAttemptSummary[],
    };
  }

  async upsertLessonProgress(
    studentId: string,
    lessonId: string,
    input: LessonProgressUpdateInput,
  ): Promise<LessonProgressRecord> {
    const { data: les } = await this.admin
      .from('lessons')
      .select('id, modules(course_id)')
      .eq('id', lessonId)
      .eq('is_published', true)
      .maybeSingle();
    const courseId = (les as { modules?: { course_id?: string } } | null)?.modules?.course_id;
    if (!courseId) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');

    const { data: enr } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    if (!enr) {
      throw new HttpError(403, 'COURSE_NOT_ASSIGNED', 'Bu kurs hesabınıza təyin olunmayıb.');
    }

    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('lesson_progress')
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          status: input.status,
          completed_at: input.status === 'completed' ? now : null,
          last_accessed_at: now,
        },
        { onConflict: 'student_id,lesson_id' },
      )
      .select('*')
      .single();
    assertNoDbError(error, 'İrəliləyiş yadda saxlanmadı');
    return data as LessonProgressRecord;
  }

  async recordExerciseAttempt(
    studentId: string,
    exerciseId: string,
    input: ExerciseAttemptCreateInput,
  ): Promise<ExerciseAttemptSummary> {
    const { data: ex } = await this.admin
      .from('exercises')
      .select('id, lessons(modules(course_id))')
      .eq('id', exerciseId)
      .maybeSingle();
    const courseId = (ex as { lessons?: { modules?: { course_id?: string } } } | null)?.lessons
      ?.modules?.course_id;
    if (!courseId) throw new HttpError(404, 'EXERCISE_NOT_FOUND', 'Məşq tapılmadı.');

    const { data: enr } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    if (!enr) throw new HttpError(403, 'COURSE_NOT_ASSIGNED', 'Bu kurs hesabınıza təyin olunmayıb.');

    const { data, error } = await this.admin
      .from('exercise_attempts')
      .insert({
        student_id: studentId,
        exercise_id: exerciseId,
        submitted_code: input.submitted_code,
        status: input.status,
        passed_tests: input.passed_tests,
        total_tests: input.total_tests,
        stdout: input.stdout ?? null,
        stderr: input.stderr ?? null,
        execution_time_ms: input.execution_time_ms ?? null,
        test_results: input.test_results,
      })
      .select('*')
      .single();
    assertNoDbError(error, 'Məşq cəhdi yadda saxlanmadı');
    return data as ExerciseAttemptSummary;
  }

  async submitQuizAttempt(
    _studentId: string,
    quizId: string,
    input: QuizSubmitInput,
    accessToken?: string,
  ): Promise<QuizAttemptResult> {
    if (!accessToken) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Sessiya tokeni tələb olunur.');
    }
    const client = this.userScopedClient(accessToken);
    const { data, error } = await client.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_answers: input.answers,
    });
    assertNoDbError(error, 'Quiz göndərilmədi');
    return data as QuizAttemptResult;
  }

  async updateOwnProfile(studentId: string, input: ProfileUpdateInput): Promise<Profile> {
    const { data, error } = await this.admin
      .from('profiles')
      .update({
        full_name: input.full_name,
        phone: input.phone ?? null,
        learning_goals: input.learning_goals ?? null,
        ...(input.preferred_locale ? { preferred_locale: input.preferred_locale } : {}),
      })
      .eq('id', studentId)
      .select('*')
      .single();
    assertNoDbError(error, 'Profil yenilənmədi');
    return data as Profile;
  }

  // --- Admin ---
  async getAdminStats(): Promise<AdminDashboardStats> {
    const [pendingApps, activeStudents, suspendedStudents, courses, lessons, activeEnrollments, logs] =
      await Promise.all([
        this.admin.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        this.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active'),
        this.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'suspended'),
        this.admin.from('courses').select('id, is_published'),
        this.admin.from('lessons').select('id', { count: 'exact', head: true }),
        this.admin.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        this.listAuditLogs(10),
      ]);

    const courseList = (courses.data ?? []) as Array<{ id: string; is_published: boolean }>;
    return {
      pending_applications: pendingApps.count ?? 0,
      active_students: activeStudents.count ?? 0,
      suspended_students: suspendedStudents.count ?? 0,
      published_courses: courseList.filter((c) => c.is_published).length,
      total_courses: courseList.length,
      total_lessons: lessons.count ?? 0,
      active_enrollments: activeEnrollments.count ?? 0,
      recent_audit_logs: logs,
    };
  }

  async listApplications(filter?: { status?: string; search?: string }): Promise<AdminApplicationView[]> {
    const q = this.admin
      .from('applications')
      .select('*, profiles!applications_user_id_fkey(*), application_notes(*)')
      .order('submitted_at', { ascending: false });
    if (filter?.status && filter.status !== 'all') q.eq('status', filter.status);
    const { data, error } = await q;
    assertNoDbError(error, 'Müraciətlər yüklənmədi');

    const term = filter?.search?.trim().toLowerCase();
    return ((data ?? []) as Array<
      Application & { profiles: Profile; application_notes: ApplicationNote[] }
    >)
      .map((row) => ({
        application: row,
        profile: row.profiles,
        notes: row.application_notes ?? [],
      }))
      .filter((item) => {
        if (!term) return true;
        return (
          item.profile.full_name.toLowerCase().includes(term) ||
          item.profile.email.toLowerCase().includes(term) ||
          item.application.reference_code.toLowerCase().includes(term)
        );
      });
  }

  async reviewApplication(
    applicationId: string,
    input: ApplicationReviewInput,
    audit: AuditContext,
  ): Promise<AdminApplicationView> {
    const now = new Date().toISOString();
    const { data: appRow, error } = await this.admin
      .from('applications')
      .update({
        status: input.decision,
        reviewed_by: audit.actorId,
        reviewed_at: now,
        rejection_reason: input.decision === 'rejected' ? input.rejection_reason ?? null : null,
      })
      .eq('id', applicationId)
      .select('*')
      .single();
    assertNoDbError(error, 'Müraciət yenilənmədi');
    const app = appRow as Application;

    const { data: profileRow, error: pErr } = await this.admin
      .from('profiles')
      .update({ account_status: input.decision === 'approved' ? 'active' : 'rejected' })
      .eq('id', app.user_id)
      .select('*')
      .single();
    assertNoDbError(pErr, 'Profil statusu yenilənmədi');

    if (input.internal_note && input.internal_note.trim().length > 0) {
      await this.addApplicationNote(applicationId, input.internal_note.trim(), audit);
    }

    await this.writeAudit(
      audit,
      input.decision === 'approved' ? 'application.approved' : 'application.rejected',
      'application',
      applicationId,
      { student_id: app.user_id, reference_code: app.reference_code, decision: input.decision },
    );

    const { data: notes } = await this.admin
      .from('application_notes')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    return {
      application: app,
      profile: profileRow as Profile,
      notes: (notes ?? []) as ApplicationNote[],
    };
  }

  async addApplicationNote(
    applicationId: string,
    note: string,
    audit: AuditContext,
  ): Promise<ApplicationNote> {
    const { data, error } = await this.admin
      .from('application_notes')
      .insert({ application_id: applicationId, author_id: audit.actorId, note })
      .select('*')
      .single();
    assertNoDbError(error, 'Daxili qeyd əlavə olunmadı');
    await this.writeAudit(audit, 'application_note.created', 'application', applicationId, {
      note_id: (data as ApplicationNote).id,
    });
    return data as ApplicationNote;
  }

  async listStudents(filter?: { status?: string; search?: string }): Promise<AdminStudentView[]> {
    const q = this.admin
      .from('profiles')
      .select('*, user_roles(role, revoked_at), applications(*), enrollments(*, courses(*))')
      .order('created_at', { ascending: false });
    if (filter?.status && filter.status !== 'all') q.eq('account_status', filter.status);
    const { data, error } = await q;
    assertNoDbError(error, 'Tələbələr yüklənmədi');

    const term = filter?.search?.trim().toLowerCase();
    const rows = (data ?? []) as Array<
      Profile & {
        user_roles: Array<{ role: AppRole; revoked_at: string | null }>;
        applications: Application[];
        enrollments: Array<Enrollment & { courses: Course | null }>;
      }
    >;

    return rows
      .filter((r) => r.user_roles.some((ur) => ur.role === 'student' && ur.revoked_at === null))
      .filter((r) =>
        !term
          ? true
          : r.full_name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term),
      )
      .map((r) => ({
        profile: r,
        roles: r.user_roles.filter((ur) => ur.revoked_at === null).map((ur) => ur.role),
        application: r.applications[0] ?? null,
        enrollments: r.enrollments.map((e) => ({ ...e, course: e.courses ?? undefined })),
        completed_lessons_count: 0,
      }));
  }

  async updateStudentAccountStatus(
    studentId: string,
    accountStatus: 'active' | 'suspended',
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Profile> {
    const { data, error } = await this.admin
      .from('profiles')
      .update({ account_status: accountStatus })
      .eq('id', studentId)
      .select('*')
      .single();
    assertNoDbError(error, 'Hesab statusu yenilənmədi');
    await this.writeAudit(
      audit,
      accountStatus === 'suspended' ? 'student.suspended' : 'student.reactivated',
      'profile',
      studentId,
      { reason: reason ?? null },
    );
    return data as Profile;
  }

  async listEnrollments(filter?: { studentId?: string; courseId?: string }): Promise<Enrollment[]> {
    const q = this.admin
      .from('enrollments')
      .select('*, courses(*), profiles!enrollments_student_id_fkey(full_name, email)')
      .order('assigned_at', { ascending: false });
    if (filter?.studentId) q.eq('student_id', filter.studentId);
    if (filter?.courseId) q.eq('course_id', filter.courseId);
    const { data, error } = await q;
    assertNoDbError(error, 'Kurs təyinatları yüklənmədi');
    return ((data ?? []) as Array<
      Enrollment & { courses: Course | null; profiles: { full_name: string; email: string } | null }
    >).map((r) => ({
      ...r,
      course: r.courses ?? undefined,
      student_name: r.profiles?.full_name,
      student_email: r.profiles?.email,
    }));
  }

  async assignCoursesToStudent(
    studentId: string,
    courseIds: string[],
    audit: AuditContext,
  ): Promise<Enrollment[]> {
    const { data: profile } = await this.admin
      .from('profiles')
      .select('account_status')
      .eq('id', studentId)
      .maybeSingle();
    if (!profile || (profile as { account_status: string }).account_status !== 'active') {
      throw new HttpError(400, 'STUDENT_NOT_ACTIVE', 'Yalnız aktiv tələbələrə kurs təyin edilə bilər.');
    }

    const now = new Date().toISOString();
    const payload = courseIds.map((courseId) => ({
      student_id: studentId,
      course_id: courseId,
      status: 'active' as const,
      assigned_by: audit.actorId,
      assigned_at: now,
      revoked_by: null,
      revoked_at: null,
      revoke_reason: null,
    }));
    const { data, error } = await this.admin
      .from('enrollments')
      .upsert(payload, { onConflict: 'student_id,course_id' })
      .select('*');
    assertNoDbError(error, 'Kurs təyinatı alınmadı');

    const rows = (data ?? []) as Enrollment[];
    for (const r of rows) {
      await this.writeAudit(audit, 'enrollment.assigned', 'enrollment', r.id, {
        student_id: studentId,
        course_id: r.course_id,
      });
    }
    return rows;
  }

  async revokeEnrollment(
    enrollmentId: string,
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Enrollment> {
    const { data, error } = await this.admin
      .from('enrollments')
      .update({
        status: 'revoked',
        revoked_by: audit.actorId,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason ?? null,
      })
      .eq('id', enrollmentId)
      .select('*')
      .single();
    assertNoDbError(error, 'Kurs təyinatı ləğv edilmədi');
    const enr = data as Enrollment;
    await this.writeAudit(audit, 'enrollment.revoked', 'enrollment', enrollmentId, {
      student_id: enr.student_id,
      course_id: enr.course_id,
      reason: reason ?? null,
    });
    return enr;
  }

  async listAllCourses(): Promise<Course[]> {
    const { data, error } = await this.admin
      .from('courses')
      .select('*')
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Kurslar yüklənmədi');
    return (data ?? []) as Course[];
  }

  async createCourse(input: CourseUpsertInput, audit: AuditContext): Promise<Course> {
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('courses')
      .insert({
        ...input,
        published_at: input.status === 'published' ? now : null,
        archived_at: input.status === 'archived' ? now : null,
        created_by: audit.actorId,
        updated_by: audit.actorId,
      })
      .select('*')
      .single();
    assertNoDbError(error, 'Kurs yaradılmadı');
    const course = data as Course;
    await this.writeAudit(audit, 'course.created', 'course', course.id, { slug: course.slug });
    return course;
  }

  async updateCourse(
    courseId: string,
    input: Partial<CourseUpsertInput>,
    audit: AuditContext,
  ): Promise<Course> {
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('courses')
      .update({
        ...input,
        ...(input.status === 'archived' ? { archived_at: now } : input.status ? { archived_at: null } : {}),
        ...(input.status === 'published' ? { published_at: now } : {}),
        updated_by: audit.actorId,
      })
      .eq('id', courseId)
      .select('*')
      .single();
    assertNoDbError(error, 'Kurs yenilənmədi');
    await this.writeAudit(audit, 'course.updated', 'course', courseId, { status: input.status });
    return data as Course;
  }

  async listCourseModules(courseId: string): Promise<ModuleItem[]> {
    const { data, error } = await this.admin
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Modullar yüklənmədi');
    return (data ?? []) as ModuleItem[];
  }

  async createModule(input: ModuleUpsertInput, audit: AuditContext): Promise<ModuleItem> {
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('modules')
      .insert({
        ...input,
        archived_at: input.status === 'archived' ? now : null,
        created_by: audit.actorId,
        updated_by: audit.actorId,
      })
      .select('*')
      .single();
    assertNoDbError(error, 'Modul yaradılmadı');
    const mod = data as ModuleItem;
    await this.writeAudit(audit, 'module.created', 'module', mod.id, {
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
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('modules')
      .update({
        ...input,
        ...(input.status === 'archived' ? { archived_at: now } : input.status ? { archived_at: null } : {}),
        updated_by: audit.actorId,
      })
      .eq('id', moduleId)
      .select('*')
      .single();
    assertNoDbError(error, 'Modul yenilənmədi');
    await this.writeAudit(
      audit,
      input.is_public !== undefined ? 'module.visibility_changed' : 'module.updated',
      'module',
      moduleId,
      { is_public: input.is_public, status: input.status },
    );
    return data as ModuleItem;
  }

  async listModuleLessons(moduleId: string): Promise<LessonItem[]> {
    const { data, error } = await this.admin
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Dərslər yüklənmədi');
    return (data ?? []) as LessonItem[];
  }

  async createLesson(input: LessonUpsertInput, audit: AuditContext): Promise<LessonItem> {
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('lessons')
      .insert({
        ...input,
        published_at: input.status === 'published' ? now : null,
        archived_at: input.status === 'archived' ? now : null,
        created_by: audit.actorId,
        updated_by: audit.actorId,
      })
      .select('*')
      .single();
    assertNoDbError(error, 'Dərs yaradılmadı');
    const lesson = data as LessonItem;
    await this.writeAudit(audit, 'lesson.created', 'lesson', lesson.id, { module_id: lesson.module_id });
    return lesson;
  }

  async updateLesson(
    lessonId: string,
    input: Partial<LessonUpsertInput>,
    audit: AuditContext,
  ): Promise<LessonItem> {
    const now = new Date().toISOString();
    const { data, error } = await this.admin
      .from('lessons')
      .update({
        ...input,
        ...(input.status === 'archived' ? { archived_at: now } : input.status ? { archived_at: null } : {}),
        ...(input.status === 'published' ? { published_at: now } : {}),
        updated_by: audit.actorId,
      })
      .eq('id', lessonId)
      .select('*')
      .single();
    assertNoDbError(error, 'Dərs yenilənmədi');
    await this.writeAudit(audit, 'lesson.updated', 'lesson', lessonId, { status: input.status });
    return data as LessonItem;
  }

  async listLessonBlocksAdmin(lessonId: string) {
    const [{ data: lesson }, { data: blocks }, { data: exercises }, { data: quizzes }] =
      await Promise.all([
        this.admin.from('lessons').select('*').eq('id', lessonId).single(),
        this.admin
          .from('lesson_content_blocks')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('sort_order', { ascending: true }),
        this.admin
          .from('exercises')
          .select('*, exercise_test_cases(*), exercise_solutions(solution_code)')
          .eq('lesson_id', lessonId),
        this.admin
          .from('quizzes')
          .select('*, quiz_questions(*, quiz_question_options(*))')
          .eq('lesson_id', lessonId),
      ]);
    if (!lesson) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    return {
      lesson: lesson as LessonItem,
      blocks: (blocks ?? []) as LessonContentBlock[],
      exercises: ((exercises ?? []) as Array<
        PublicExercise & {
          exercise_test_cases?: ExerciseTestCase[];
          exercise_solutions?: { solution_code?: string } | null;
        }
      >).map((e) => ({
        ...e,
        test_cases: e.exercise_test_cases ?? [],
        solution_code: e.exercise_solutions?.solution_code,
      })),
      quizzes: ((quizzes ?? []) as Array<
        AdminQuiz & {
          quiz_questions?: Array<
            AdminQuiz['questions'][number] & {
              quiz_question_options?: AdminQuiz['questions'][number]['options'];
            }
          >;
        }
      >).map((q) => ({
        ...q,
        questions: (q.quiz_questions ?? []).map((qq) => ({
          ...qq,
          options: qq.quiz_question_options ?? [],
        })),
      })),
    };
  }

  async createContentBlock(
    input: ContentBlockUpsertInput,
    audit: AuditContext,
  ): Promise<LessonContentBlock> {
    const { data, error } = await this.admin
      .from('lesson_content_blocks')
      .insert(input)
      .select('*')
      .single();
    assertNoDbError(error, 'Kontent bloku yaradılmadı');
    const block = data as LessonContentBlock;
    await this.writeAudit(audit, 'lesson_block.created', 'lesson_content_block', block.id, {
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
    const { data, error } = await this.admin
      .from('lesson_content_blocks')
      .update(input)
      .eq('id', blockId)
      .select('*')
      .single();
    assertNoDbError(error, 'Kontent bloku yenilənmədi');
    await this.writeAudit(audit, 'lesson_block.updated', 'lesson_content_block', blockId, {});
    return data as LessonContentBlock;
  }

  async deleteContentBlock(blockId: string, audit: AuditContext): Promise<void> {
    const { error } = await this.admin.from('lesson_content_blocks').delete().eq('id', blockId);
    assertNoDbError(error, 'Kontent bloku silinmədi');
    await this.writeAudit(audit, 'lesson_block.deleted', 'lesson_content_block', blockId, {});
  }

  async createExercise(input: ExerciseUpsertInput, audit: AuditContext): Promise<PublicExercise> {
    const { test_cases, solution_code, ...exPayload } = input;
    const { data: exRow, error } = await this.admin
      .from('exercises')
      .insert(exPayload)
      .select('*')
      .single();
    assertNoDbError(error, 'Məşq yaradılmadı');
    const ex = exRow as Omit<PublicExercise, 'test_cases'>;

    if (solution_code) {
      await this.admin.from('exercise_solutions').upsert({
        exercise_id: ex.id,
        solution_code,
        updated_by: audit.actorId,
      });
    }

    let insertedCases: ExerciseTestCase[] = [];
    if (test_cases.length > 0) {
      const { data: tcData, error: tcErr } = await this.admin
        .from('exercise_test_cases')
        .insert(test_cases.map((tc, i) => ({ ...tc, exercise_id: ex.id, sort_order: tc.sort_order || i + 1 })))
        .select('*');
      assertNoDbError(tcErr, 'Məşq test halları əlavə olunmadı');
      insertedCases = (tcData ?? []) as ExerciseTestCase[];
    }

    await this.writeAudit(audit, 'exercise.created', 'exercise', ex.id, { lesson_id: ex.lesson_id });
    return { ...ex, test_cases: insertedCases };
  }

  async createQuiz(input: QuizUpsertInput, audit: AuditContext): Promise<AdminQuiz> {
    const { questions, ...quizPayload } = input;
    const { data: qzRow, error } = await this.admin
      .from('quizzes')
      .insert(quizPayload)
      .select('*')
      .single();
    assertNoDbError(error, 'Quiz yaradılmadı');
    const qz = qzRow as Omit<AdminQuiz, 'questions'>;

    const createdQuestions: AdminQuiz['questions'] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const { options, ...qPayload } = q;
      const { data: qRow, error: qErr } = await this.admin
        .from('quiz_questions')
        .insert({ ...qPayload, quiz_id: qz.id, sort_order: q.sort_order || i + 1 })
        .select('*')
        .single();
      assertNoDbError(qErr, 'Quiz sualı əlavə olunmadı');
      const createdQ = qRow as Omit<AdminQuiz['questions'][number], 'options'>;

      const { data: optRows, error: oErr } = await this.admin
        .from('quiz_question_options')
        .insert(
          options.map((o, oi) => ({
            ...o,
            question_id: createdQ.id,
            sort_order: o.sort_order || oi + 1,
          })),
        )
        .select('*');
      assertNoDbError(oErr, 'Quiz variantları əlavə olunmadı');
      createdQuestions.push({
        ...createdQ,
        options: (optRows ?? []) as AdminQuiz['questions'][number]['options'],
      });
    }

    await this.writeAudit(audit, 'quiz.created', 'quiz', qz.id, { lesson_id: qz.lesson_id });
    return { ...qz, questions: createdQuestions };
  }

  async getAdminSettings(): Promise<AdminPlatformSettings> {
    const { data, error } = await this.admin
      .from('platform_settings')
      .select('*')
      .eq('id', true)
      .single();
    assertNoDbError(error, 'Tənzimləmələr oxunmadı');
    const row = data as PublicPlatformSettings & { updated_by: string | null; updated_at: string };
    const enabled = row.whatsapp_button_enabled && Boolean(row.whatsapp_phone);
    return {
      ...row,
      whatsapp_button_enabled: enabled,
      whatsapp_phone: enabled ? row.whatsapp_phone : null,
      raw_whatsapp_button_enabled: row.whatsapp_button_enabled,
      raw_whatsapp_phone: row.whatsapp_phone,
    };
  }

  async updateAdminSettings(
    input: PlatformSettingsUpdateInput,
    audit: AuditContext,
  ): Promise<AdminPlatformSettings> {
    const { error } = await this.admin
      .from('platform_settings')
      .update({ ...input, updated_by: audit.actorId })
      .eq('id', true);
    assertNoDbError(error, 'Tənzimləmələr yenilənmədi');
    await this.writeAudit(audit, 'settings.updated', 'platform_settings', null, {
      whatsapp_button_enabled: input.whatsapp_button_enabled,
      registration_enabled: input.registration_enabled,
    });
    return this.getAdminSettings();
  }

  async listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const { data, error } = await this.admin
      .from('audit_logs')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(limit);
    assertNoDbError(error, 'Audit logları yüklənmədi');
    return ((data ?? []) as Array<AuditLogEntry & { profiles: { email: string } | null }>).map(
      (r) => ({
        ...r,
        actor_email: r.profiles?.email ?? null,
      }),
    );
  }
}
