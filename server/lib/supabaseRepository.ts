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
} from '../../src/shared/types/domain.js';
import { HttpError, sanitizeIpForDb } from './http.js';
import type { AuditContext, KoderaRepository } from './repository.js';
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
} from './types.js';

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

function assertNoDbError(
  error: { message: string; code?: string; details?: string } | null,
  fallback: string,
): void {
  if (!error) return;
  if (error.code === '23505') {
    throw new HttpError(409, 'DUPLICATE_RECORD', 'Bu məlumat artıq mövcuddur.');
  }
  if (error.code === '42501') {
    throw new HttpError(403, 'FORBIDDEN', 'Bu əməliyyat üçün icazəniz yoxdur.');
  }
  if (error.code === 'PGRST116' || error.code === 'P0002') {
    throw new HttpError(404, 'NOT_FOUND', 'Axtarılan məlumat tapılmadı.');
  }
  if (error.code === 'P0001') {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit')) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox tez-tez sorğu göndərirsiniz.');
    }
    if (msg.includes('maximum quiz attempts')) {
      throw new HttpError(400, 'MAX_ATTEMPTS_REACHED', 'Bu quiz üçün maksimum cəhd limitinə çatmısınız.');
    }
    throw new HttpError(400, 'OPERATION_NOT_ALLOWED', fallback);
  }
  if (
    error.code === '22P02' ||
    error.code === '22023' ||
    error.code === '23503' ||
    error.code === '23514'
  ) {
    throw new HttpError(400, 'INVALID_INPUT', 'Göndərilən məlumatlar və ya ID formatı düzgün deyil.');
  }

  // Never leak raw PostgreSQL / PostgREST messages to HTTP clients
  console.error('[Kodera DB Error]', error.code, error.message, error.details);
  throw new HttpError(500, 'DATABASE_ERROR', fallback);
}

/**
 * Production & Staging repository backed by Supabase PostgreSQL, Auth & Storage.
 * Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server after explicit JWT/RBAC verification.
 */
export class SupabaseRepository implements KoderaRepository {
  private admin: SupabaseClient;
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
  }

  /** Fresh ephemeral anon client per auth operation so no GoTrue session state persists across requests. */
  private createEphemeralAnonClient(): SupabaseClient {
    return createClient(this.supabaseUrl, this.anonKey, {
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
    const safeIp = sanitizeIpForDb(audit.ipAddress);
    const { error } = await this.admin.from('audit_logs').insert({
      actor_id: audit.actorId,
      actor_role: audit.actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: safeIp,
      user_agent: audit.userAgent ? audit.userAgent.slice(0, 500) : null,
    });
    if (error) {
      console.error('[Kodera Audit Write Error]', action, entityType, error.code, error.message);
    }
  }

  async checkRateLimit(
    bucketKey: string,
    action: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<boolean> {
    const safeBucket = bucketKey.trim().slice(0, 200);
    const safeAction = action.trim().slice(0, 60);
    const { data, error } = await this.admin.rpc('check_and_record_rate_limit', {
      p_bucket_key: safeBucket,
      p_action: safeAction,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });
    if (error) {
      console.error('[RateLimit RPC Error]', error.code, error.message);
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

    const ephemeralAnon = this.createEphemeralAnonClient();
    const { data, error } = await ephemeralAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${this.appUrl}/login?verified=1`,
        data: {
          full_name: input.full_name,
          phone: input.phone ?? null,
          learning_goals: input.learning_goals ?? null,
        },
      },
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already been registered')) {
        throw new HttpError(409, 'EMAIL_EXISTS', 'Bu email ünvanı artıq qeydiyyatdadır.');
      }
      if (lower.includes('rate limit') || error.status === 429) {
        throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox sayda qeydiyyat sorğusu göndərildi. Bir az sonra cəhd edin.');
      }
      console.error('[Kodera SignUp Error]', error.status, error.message);
      throw new HttpError(400, 'REGISTRATION_FAILED', 'Qeydiyyat zamanı xəta baş verdi. Məlumatları yoxlayıb yenidən cəhd edin.');
    }

    // Supabase returns obfuscated user with empty identities array for already-confirmed emails
    const identities = (data.user as { identities?: unknown[] } | null)?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      return {
        requires_email_verification: true,
        reference_code: '',
      };
    }

    const userId = data.user?.id;
    let refCode = '';
    if (userId) {
      const { data: appRow } = await this.admin
        .from('applications')
        .select('reference_code, submitted_at')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Only reveal reference_code on fresh signups (< 60s old) to prevent unauthenticated harvesting
      const row = appRow as { reference_code?: string; submitted_at?: string } | null;
      if (row?.reference_code && row.submitted_at) {
        const ageMs = Date.now() - new Date(row.submitted_at).getTime();
        if (ageMs >= -5000 && ageMs <= 60_000) {
          refCode = row.reference_code;
        }
      }
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
    const ephemeralAnon = this.createEphemeralAnonClient();
    const { error } = await ephemeralAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.appUrl}/reset-password`,
    });
    if (error) {
      console.error('[Kodera PasswordReset Error]', error.status, error.message);
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const ephemeralAnon = this.createEphemeralAnonClient();
    const { error } = await ephemeralAnon.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${this.appUrl}/login?verified=1` },
    });
    if (error) {
      console.error('[Kodera ResendVerification Error]', error.status, error.message);
    }
  }

  async getPublicSettings(): Promise<PublicPlatformSettings> {
    const { data, error } = await this.admin.rpc('get_public_platform_settings');
    assertNoDbError(error, 'Platforma tənzimləmələri oxunmadı.');
    const row = (Array.isArray(data) ? data[0] : data) as PublicPlatformSettings | undefined;
    if (!row) {
      throw new HttpError(500, 'SETTINGS_MISSING', 'Platforma tənzimləmələri tapılmadı.');
    }
    return {
      ...row,
      email_sender_name: row.email_sender_name ?? 'Kodera Academy',
      website_domain: row.website_domain ?? null,
    };
  }

  private async enrichCoursesWithCounts(
    courses: Course[],
    publishedOnly: boolean,
  ): Promise<Course[]> {
    if (courses.length === 0) return [];
    const courseIds = courses.map((c) => c.id);

    const modQuery = this.admin
      .from('modules')
      .select('id, course_id, is_public, is_published, sort_order')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true });
    if (publishedOnly) modQuery.eq('is_published', true);
    const { data: modRows, error: modErr } = await modQuery;
    assertNoDbError(modErr, 'Kurs modulları yüklənmədi.');

    const mods = (modRows ?? []) as Array<{
      id: string;
      course_id: string;
      is_public: boolean;
      is_published: boolean;
      sort_order: number;
    }>;
    const modIds = mods.map((m) => m.id);

    let lessons: Array<{ id: string; module_id: string; slug: string; is_published: boolean; sort_order: number }> = [];
    if (modIds.length > 0) {
      const lesQuery = this.admin
        .from('lessons')
        .select('id, module_id, slug, is_published, sort_order')
        .in('module_id', modIds)
        .order('sort_order', { ascending: true });
      if (publishedOnly) lesQuery.eq('is_published', true);
      const { data: lessonRows, error: lesErr } = await lesQuery;
      assertNoDbError(lesErr, 'Kurs dərsləri yüklənmədi.');
      lessons = (lessonRows ?? []) as typeof lessons;
    }

    return courses.map((c) => {
      const cMods = mods.filter((m) => m.course_id === c.id);
      const cModIds = new Set(cMods.map((m) => m.id));
      const cLessons = lessons.filter((l) => cModIds.has(l.module_id));
      const publicPublishedMods = cMods.filter((m) => m.is_public && m.is_published);
      let firstPublicLessonSlug: string | null = null;
      for (const pm of publicPublishedMods) {
        const firstLes = cLessons.find((l) => l.module_id === pm.id && l.is_published);
        if (firstLes) {
          firstPublicLessonSlug = firstLes.slug;
          break;
        }
      }
      return {
        ...c,
        public_module_count: cMods.filter((m) => m.is_public).length,
        total_module_count: cMods.length,
        total_lesson_count: cLessons.length,
        first_public_lesson_slug: firstPublicLessonSlug,
      };
    });
  }

  async listPublishedCourses(): Promise<Course[]> {
    const { data, error } = await this.admin
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Kurslar yüklənmədi.');
    return this.enrichCoursesWithCounts((data ?? []) as Course[], true);
  }

  private async checkEnrolled(viewer: AuthSessionUser | null, courseId: string): Promise<boolean> {
    if (!viewer || !viewer.isActiveStudent) return false;
    const { data, error } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', viewer.profile.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    assertNoDbError(error, 'Kurs təyinatı yoxlanmadı.');
    return Boolean(data);
  }

  async getCourseBySlug(slug: string, viewer: AuthSessionUser | null) {
    const query = this.admin.from('courses').select('*').eq('slug', slug);
    if (!viewer?.isAdmin) {
      query.eq('is_published', true);
    }
    const { data: courseRow, error } = await query.maybeSingle();
    assertNoDbError(error, 'Kurs tapılmadı.');
    if (!courseRow) return null;
    const course = courseRow as Course;

    const isEnrolled = await this.checkEnrolled(viewer, course.id);
    const modQuery = this.admin
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) modQuery.eq('is_published', true);
    const { data: modData, error: modErr } = await modQuery;
    assertNoDbError(modErr, 'Modullar yüklənmədi.');
    const mods = (modData ?? []) as ModuleItem[];
    const modIds = mods.map((m) => m.id);

    let lessons: LessonItem[] = [];
    if (modIds.length > 0) {
      const lessonQuery = this.admin
        .from('lessons')
        .select('*')
        .in('module_id', modIds)
        .order('sort_order', { ascending: true });
      if (!viewer?.isAdmin) lessonQuery.eq('is_published', true);
      const { data: lessonData, error: lesErr } = await lessonQuery;
      assertNoDbError(lesErr, 'Dərslər yüklənmədi.');
      lessons = (lessonData ?? []) as LessonItem[];
    }

    const progressMap = new Map<string, LessonProgressRecord['status']>();
    if (viewer) {
      const { data: progRows, error: progErr } = await this.admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', viewer.profile.id)
        .eq('course_id', course.id);
      assertNoDbError(progErr, 'Dərs irəliləyişi yüklənmədi.');
      for (const r of (progRows ?? []) as Array<{ lesson_id: string; status: LessonProgressRecord['status'] }>) {
        progressMap.set(r.lesson_id, r.status);
      }
    }

    const outline: CurriculumOutlineModule[] = mods.map((m) => {
      const canAccess = Boolean(
        viewer?.isAdmin || (course.is_published && m.is_published && (m.is_public || isEnrolled)),
      );
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

    const firstPublicMod = mods.find((m) => m.is_public && m.is_published);
    const firstPublicLesson = firstPublicMod
      ? lessons.find((l) => l.module_id === firstPublicMod.id && l.is_published)
      : undefined;

    return {
      course: {
        ...course,
        public_module_count: mods.filter((m) => m.is_public).length,
        total_module_count: mods.length,
        total_lesson_count: lessons.length,
        first_public_lesson_slug: firstPublicLesson?.slug ?? null,
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
    const { data: modData, error: modErr } = await modQuery;
    assertNoDbError(modErr, 'Modullar yüklənmədi.');
    const mods = (modData ?? []) as ModuleItem[];
    const modIds = mods.map((m) => m.id);
    if (modIds.length === 0) return { status: 'not_found' as const };

    const lesQuery = this.admin
      .from('lessons')
      .select('*')
      .in('module_id', modIds)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) lesQuery.eq('is_published', true);
    const { data: allLesData, error: lesErr } = await lesQuery;
    assertNoDbError(lesErr, 'Dərslər yüklənmədi.');
    const allLessons = (allLesData ?? []) as LessonItem[];

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
      .eq('locale', course.locale)
      .order('sort_order', { ascending: true });
    if (!viewer?.isAdmin) blockQuery.eq('is_published', true);
    const { data: blockData, error: blockErr } = await blockQuery;
    assertNoDbError(blockErr, 'Dərs kontenti yüklənmədi.');
    const rawBlocks = (blockData ?? []) as LessonContentBlock[];

    const exerciseIds = rawBlocks.map((b) => b.exercise_id).filter((x): x is string => Boolean(x));
    const quizIds = rawBlocks.map((b) => b.quiz_id).filter((x): x is string => Boolean(x));

    const exerciseMap = new Map<string, PublicExercise>();
    if (exerciseIds.length > 0) {
      // Explicit public column list + publish filter for non-admins (never expose draft/archived or solutions)
      const exQuery = this.admin
        .from('exercises')
        .select(
          'id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars',
        )
        .in('id', exerciseIds);
      if (!viewer?.isAdmin) exQuery.eq('is_published', true);

      const [exRes, tcRes] = await Promise.all([
        exQuery,
        this.admin
          .from('exercise_test_cases')
          .select('id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order')
          .in('exercise_id', exerciseIds)
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true }),
      ]);
      assertNoDbError(exRes.error, 'Məşqlər yüklənmədi.');
      assertNoDbError(tcRes.error, 'Məşq testləri yüklənmədi.');
      const tcs = (tcRes.data ?? []) as ExerciseTestCase[];
      for (const ex of (exRes.data ?? []) as Array<Omit<PublicExercise, 'test_cases'>>) {
        exerciseMap.set(ex.id, {
          ...ex,
          test_cases: tcs.filter((t) => t.exercise_id === ex.id),
        });
      }
    }

    const quizMap = new Map<string, PublicQuiz>();
    if (quizIds.length > 0) {
      // Explicitly omit explanation and is_correct + filter is_published for non-admins
      const qzQuery = this.admin
        .from('quizzes')
        .select('id, lesson_id, locale, title, description, passing_score_percent, max_attempts')
        .in('id', quizIds);
      if (!viewer?.isAdmin) qzQuery.eq('is_published', true);

      const [qzRes, qRes] = await Promise.all([
        qzQuery,
        this.admin
          .from('quiz_questions')
          .select('id, quiz_id, question_type, prompt, code_snippet, code_language, points, sort_order')
          .in('quiz_id', quizIds)
          .order('sort_order', { ascending: true }),
      ]);
      assertNoDbError(qzRes.error, 'Quizlər yüklənmədi.');
      assertNoDbError(qRes.error, 'Quiz sualları yüklənmədi.');
      const qs = (qRes.data ?? []) as Array<Omit<PublicQuiz['questions'][number], 'options'>>;
      const qIds = qs.map((q) => q.id);
      let opts: PublicQuiz['questions'][number]['options'] = [];
      if (qIds.length > 0) {
        const { data: optRows, error: optErr } = await this.admin
          .from('quiz_question_options')
          .select('id, question_id, option_text, sort_order')
          .in('question_id', qIds)
          .order('sort_order', { ascending: true });
        assertNoDbError(optErr, 'Quiz variantları yüklənmədi.');
        opts = (optRows ?? []) as PublicQuiz['questions'][number]['options'];
      }

      for (const qz of (qzRes.data ?? []) as Array<Omit<PublicQuiz, 'questions'>>) {
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

    const blocks: LessonContentBlock[] = rawBlocks
      .map((b) => ({
        ...b,
        exercise: b.exercise_id ? exerciseMap.get(b.exercise_id) : undefined,
        quiz: b.quiz_id ? quizMap.get(b.quiz_id) : undefined,
      }))
      // Drop blocks pointing to unpublished exercises/quizzes for non-admins
      .filter((b) => {
        if (viewer?.isAdmin) return true;
        if (b.block_type === 'exercise' && !b.exercise) return false;
        if (b.block_type === 'quiz' && !b.quiz) return false;
        return true;
      });

    const prevItem = idx > 0 ? ordered[idx - 1]! : null;
    const nextItem = idx + 1 < ordered.length ? ordered[idx + 1]! : null;
    const publicLessons = ordered.filter((o) => o.module.is_public);
    const lastPublic = publicLessons[publicLessons.length - 1];

    let progressStatus: LessonViewPayload['progress_status'] = 'not_started';
    const previousQuizAttempts: Record<string, QuizAttemptSummary[]> = {};
    const previousExerciseAttempts: Record<string, ExerciseAttemptSummary[]> = {};

    if (viewer) {
      const { data: prog, error: progErr } = await this.admin
        .from('lesson_progress')
        .select('status')
        .eq('student_id', viewer.profile.id)
        .eq('lesson_id', current.lesson.id)
        .maybeSingle();
      assertNoDbError(progErr, 'İrəliləyiş oxunmadı.');
      if (prog) progressStatus = (prog as { status: LessonViewPayload['progress_status'] }).status;

      if (quizIds.length > 0) {
        const { data: qa, error: qaErr } = await this.admin
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', viewer.profile.id)
          .in('quiz_id', quizIds)
          .order('submitted_at', { ascending: false });
        assertNoDbError(qaErr, 'Quiz cəhdləri oxunmadı.');
        for (const row of (qa ?? []) as QuizAttemptSummary[]) {
          const list = previousQuizAttempts[row.quiz_id] ?? [];
          list.push(row);
          previousQuizAttempts[row.quiz_id] = list;
        }
      }

      if (exerciseIds.length > 0) {
        const { data: ea, error: eaErr } = await this.admin
          .from('exercise_attempts')
          .select('*')
          .eq('student_id', viewer.profile.id)
          .in('exercise_id', exerciseIds)
          .order('created_at', { ascending: false });
        assertNoDbError(eaErr, 'Məşq cəhdləri oxunmadı.');
        for (const row of (ea ?? []) as ExerciseAttemptSummary[]) {
          const list = previousExerciseAttempts[row.exercise_id] ?? [];
          list.push(row);
          previousExerciseAttempts[row.exercise_id] = list;
        }
      }
    }

    const prevLocked = prevItem
      ? !(viewer?.isAdmin || prevItem.module.is_public || is_enrolled)
      : false;
    const nextLocked = nextItem
      ? !(viewer?.isAdmin || nextItem.module.is_public || is_enrolled)
      : false;

    return {
      status: 'ok' as const,
      payload: {
        course,
        module: current.module,
        lesson: current.lesson,
        blocks,
        prev_lesson: prevItem
          ? {
              slug: prevLocked ? null : prevItem.lesson.slug,
              title: prevItem.lesson.title,
              is_locked: prevLocked,
            }
          : null,
        next_lesson: nextItem
          ? {
              slug: nextLocked ? null : nextItem.lesson.slug,
              title: nextItem.lesson.title,
              is_locked: nextLocked,
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
    assertNoDbError(error, 'Təyin olunmuş kurslar yüklənmədi.');

    const rows = (enrRows ?? []) as Array<Enrollment & { courses: Course | Course[] | null }>;
    const results: StudentCourseWithProgress[] = [];

    for (const row of rows) {
      const course = unwrap(row.courses);
      if (!course || !course.is_published) continue;
      const { courses: _omitCourse, ...cleanEnrollment } = row;
      void _omitCourse;

      const { data: modRows, error: modErr } = await this.admin
        .from('modules')
        .select('id, sort_order')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      assertNoDbError(modErr, 'Kurs modulları yüklənmədi.');
      const modIds = ((modRows ?? []) as Array<{ id: string }>).map((m) => m.id);

      let allLessons: Array<{ id: string; slug: string; title: string; module_id: string }> = [];
      if (modIds.length > 0) {
        const { data: lesRows, error: lesErr } = await this.admin
          .from('lessons')
          .select('id, slug, title, module_id, sort_order')
          .in('module_id', modIds)
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        assertNoDbError(lesErr, 'Kurs dərsləri yüklənmədi.');
        allLessons = (lesRows ?? []) as typeof allLessons;
      }
      const orderedLessons = modIds.flatMap((mid) => allLessons.filter((l) => l.module_id === mid));

      const { data: progRows, error: progErr } = await this.admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', studentId)
        .eq('course_id', course.id)
        .eq('status', 'completed');
      assertNoDbError(progErr, 'Dərs irəliləyişi yüklənmədi.');
      const completedSet = new Set(
        ((progRows ?? []) as Array<{ lesson_id: string }>).map((p) => p.lesson_id),
      );
      const next = orderedLessons.find((l) => !completedSet.has(l.id)) ?? orderedLessons[0];
      const total = orderedLessons.length;
      const completedCount = orderedLessons.filter((l) => completedSet.has(l.id)).length;

      results.push({
        enrollment: cleanEnrollment,
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
        .select('*, exercises(title)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    assertNoDbError(progRes.error, 'Tamamlanmış dərslər yüklənmədi.');
    assertNoDbError(quizRes.error, 'Quiz cəhdləri yüklənmədi.');
    assertNoDbError(exRes.error, 'Məşq cəhdləri yüklənmədi.');

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
    >).map(({ quizzes, ...rest }) => ({
      ...rest,
      quiz_title: unwrap(quizzes)?.title,
    }));

    const exerciseAttempts = ((exRes.data ?? []) as unknown as Array<
      ExerciseAttemptSummary & { exercises: { title: string } | Array<{ title: string }> | null }
    >).map(({ exercises, ...rest }) => ({
      ...rest,
      exercise_title: unwrap(exercises)?.title,
    }));

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
    const { data: les, error: lesErr } = await this.admin
      .from('lessons')
      .select('id, is_published, modules(id, is_published, course_id, courses(id, is_published))')
      .eq('id', lessonId)
      .eq('is_published', true)
      .maybeSingle();
    assertNoDbError(lesErr, 'Dərs yoxlanmadı.');

    const mod = unwrap(
      (les as {
        modules?:
          | { is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }
          | Array<{ is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }>
          | null;
      } | null)?.modules,
    );
    const crs = unwrap(mod?.courses);
    const courseId = mod?.is_published && crs?.is_published ? mod.course_id : undefined;
    if (!courseId) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');

    const { data: enr, error: enrErr } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    assertNoDbError(enrErr, 'Kurs təyinatı yoxlanmadı.');
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
    assertNoDbError(error, 'İrəliləyiş yadda saxlanmadı.');
    return data as LessonProgressRecord;
  }

  async recordExerciseAttempt(
    studentId: string,
    exerciseId: string,
    input: ExerciseAttemptCreateInput,
  ): Promise<ExerciseAttemptSummary> {
    const { data: ex, error: exErr } = await this.admin
      .from('exercises')
      .select(
        'id, is_published, lessons(id, is_published, modules(id, is_published, course_id, courses(id, is_published)))',
      )
      .eq('id', exerciseId)
      .eq('is_published', true)
      .maybeSingle();
    assertNoDbError(exErr, 'Məşq yoxlanmadı.');

    const les = unwrap(
      (ex as {
        lessons?:
          | {
              is_published?: boolean;
              modules?:
                | { is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }
                | Array<{ is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }>
                | null;
            }
          | Array<{
              is_published?: boolean;
              modules?:
                | { is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }
                | Array<{ is_published?: boolean; course_id?: string; courses?: { is_published?: boolean } | Array<{ is_published?: boolean }> | null }>
                | null;
            }>
          | null;
      } | null)?.lessons,
    );
    const mod = unwrap(les?.modules);
    const crs = unwrap(mod?.courses);
    const courseId =
      les?.is_published && mod?.is_published && crs?.is_published ? mod.course_id : undefined;
    if (!courseId) throw new HttpError(404, 'EXERCISE_NOT_FOUND', 'Məşq tapılmadı.');

    const { data: enr, error: enrErr } = await this.admin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    assertNoDbError(enrErr, 'Kurs təyinatı yoxlanmadı.');
    if (!enr) throw new HttpError(403, 'COURSE_NOT_ASSIGNED', 'Bu kurs hesabınıza təyin olunmayıb.');

    // Bound reported test counts to actual visible test case count for this exercise
    const { count: visibleTestCount, error: countErr } = await this.admin
      .from('exercise_test_cases')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', exerciseId)
      .eq('is_hidden', false);
    assertNoDbError(countErr, 'Məşq test sayı yoxlanmadı.');
    const maxTests = visibleTestCount ?? 0;
    const boundedTotal = Math.min(input.total_tests, maxTests);
    const boundedPassed = Math.min(input.passed_tests, boundedTotal);

    const { data, error } = await this.admin
      .from('exercise_attempts')
      .insert({
        student_id: studentId,
        exercise_id: exerciseId,
        submitted_code: input.submitted_code,
        status: input.status,
        passed_tests: boundedPassed,
        total_tests: boundedTotal,
        stdout: input.stdout ?? null,
        stderr: input.stderr ?? null,
        execution_time_ms: input.execution_time_ms ?? null,
        test_results: input.test_results,
      })
      .select('*')
      .single();
    assertNoDbError(error, 'Məşq cəhdi yadda saxlanmadı.');
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
    assertNoDbError(error, 'Quiz göndərilmədi.');
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
    assertNoDbError(error, 'Profil yenilənmədi.');
    return data as Profile;
  }

  // --- Admin ---
  async getAdminStats(): Promise<AdminDashboardStats> {
    const [rpcRes, logs] = await Promise.all([
      this.admin.rpc('get_admin_dashboard_stats'),
      this.listAuditLogs(10),
    ]);

    if (!rpcRes.error && rpcRes.data && typeof rpcRes.data === 'object') {
      const s = rpcRes.data as Partial<AdminDashboardStats>;
      const suspended = Number(s.suspended_accounts ?? s.suspended_students ?? 0);
      return {
        total_registered_users: Number(s.total_registered_users ?? 0),
        pending_applications: Number(s.pending_applications ?? 0),
        approved_applications: Number(s.approved_applications ?? 0),
        rejected_applications: Number(s.rejected_applications ?? 0),
        active_students: Number(s.active_students ?? 0),
        suspended_accounts: suspended,
        suspended_students: suspended,
        active_enrollments: Number(s.active_enrollments ?? 0),
        published_courses: Number(s.published_courses ?? 0),
        total_courses: Number(s.total_courses ?? 0),
        total_modules: Number(s.total_modules ?? 0),
        published_lessons: Number(s.published_lessons ?? 0),
        total_lessons: Number(s.total_lessons ?? 0),
        completed_lessons: Number(s.completed_lessons ?? 0),
        recent_audit_logs: logs,
      };
    }

    // Fallback direct parallel table queries if Migration 0008 RPC is not yet installed
    const [
      appsRes,
      rolesRes,
      coursesRes,
      modulesRes,
      lessonsRes,
      activeEnrollmentsRes,
      completedLessonsRes,
    ] = await Promise.all([
      this.admin.from('applications').select('user_id, status'),
      this.admin
        .from('user_roles')
        .select('user_id, role, profiles!user_roles_user_id_fkey(account_status)')
        .is('revoked_at', null),
      this.admin.from('courses').select('id, status, is_published'),
      this.admin.from('modules').select('id', { count: 'exact', head: true }).neq('status', 'archived'),
      this.admin.from('lessons').select('id, status, is_published'),
      this.admin.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      this.admin
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
    ]);

    assertNoDbError(appsRes.error, 'Statistika yüklənmədi.');
    assertNoDbError(rolesRes.error, 'Tələbə statistikası yüklənmədi.');
    assertNoDbError(coursesRes.error, 'Kurs statistikası yüklənmədi.');
    assertNoDbError(modulesRes.error, 'Modul statistikası yüklənmədi.');
    assertNoDbError(lessonsRes.error, 'Dərs statistikası yüklənmədi.');
    assertNoDbError(activeEnrollmentsRes.error, 'Təyinat statistikası yüklənmədi.');
    assertNoDbError(completedLessonsRes.error, 'Tamamlanmış dərs statistikası yüklənmədi.');

    const roleRows = (rolesRes.data ?? []) as Array<{
      user_id: string;
      role: string;
      profiles: { account_status: string } | Array<{ account_status: string }> | null;
    }>;
    const adminIds = new Set(roleRows.filter((r) => r.role === 'admin').map((r) => r.user_id));
    const studentMap = new Map<string, string>();
    for (const r of roleRows) {
      if (r.role === 'student' && !adminIds.has(r.user_id)) {
        const st = unwrap(r.profiles)?.account_status ?? 'pending';
        studentMap.set(r.user_id, st);
      }
    }

    let totalRegisteredUsers = 0;
    let activeStudentsCount = 0;
    let suspendedCount = 0;
    for (const st of studentMap.values()) {
      if (st !== 'archived') totalRegisteredUsers += 1;
      if (st === 'active') activeStudentsCount += 1;
      else if (st === 'suspended') suspendedCount += 1;
    }

    const appRows = ((appsRes.data ?? []) as Array<{ user_id: string; status: string }>).filter(
      (a) => !adminIds.has(a.user_id),
    );
    const courseList = (coursesRes.data ?? []) as Array<{
      id: string;
      status: string;
      is_published: boolean;
    }>;
    const lessonList = (lessonsRes.data ?? []) as Array<{
      id: string;
      status: string;
      is_published: boolean;
    }>;

    return {
      total_registered_users: totalRegisteredUsers,
      pending_applications: appRows.filter((a) => a.status === 'pending').length,
      approved_applications: appRows.filter((a) => a.status === 'approved').length,
      rejected_applications: appRows.filter((a) => a.status === 'rejected').length,
      active_students: activeStudentsCount,
      suspended_accounts: suspendedCount,
      suspended_students: suspendedCount,
      active_enrollments: activeEnrollmentsRes.count ?? 0,
      published_courses: courseList.filter((c) => c.is_published).length,
      total_courses: courseList.filter((c) => c.status !== 'archived').length,
      total_modules: modulesRes.count ?? 0,
      published_lessons: lessonList.filter((l) => l.is_published).length,
      total_lessons: lessonList.filter((l) => l.status !== 'archived').length,
      completed_lessons: completedLessonsRes.count ?? 0,
      recent_audit_logs: logs,
    };
  }

  async listApplications(filter?: { status?: string; search?: string }): Promise<AdminApplicationView[]> {
    const q = this.admin
      .from('applications')
      .select(
        '*, profiles!applications_user_id_fkey(*), application_notes(*, author:profiles!application_notes_author_id_fkey(full_name))',
      )
      .order('submitted_at', { ascending: false });
    if (filter?.status && filter.status !== 'all') q.eq('status', filter.status);
    const { data, error } = await q;
    assertNoDbError(error, 'Müraciətlər yüklənmədi.');

    const term = filter?.search?.trim().toLowerCase();
    return ((data ?? []) as unknown as Array<
      Application & {
        profiles: Profile | Profile[] | null;
        application_notes: Array<
          ApplicationNote & { author?: { full_name?: string } | Array<{ full_name?: string }> | null }
        >;
      }
    >)
      .map(({ profiles, application_notes, ...cleanApp }): AdminApplicationView | null => {
        const profile = unwrap(profiles);
        if (!profile) return null;
        const notes = (application_notes ?? [])
          .map(({ author, ...cleanNote }) => ({
            ...cleanNote,
            author_name: unwrap(author)?.full_name ?? null,
          }))
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return {
          application: cleanApp,
          profile,
          notes,
        };
      })
      .filter((item): item is AdminApplicationView => item !== null)
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
    const { data: rpcData, error } = await this.admin.rpc('review_application_atomic', {
      p_application_id: applicationId,
      p_decision: input.decision,
      p_reviewed_by: audit.actorId,
      p_rejection_reason: input.decision === 'rejected' ? input.rejection_reason ?? null : null,
      p_internal_note: input.internal_note?.trim() || null,
    });
    assertNoDbError(error, 'Müraciət yenilənmədi.');

    const parsed = rpcData as { application: Application; profile: Profile };

    await this.writeAudit(
      audit,
      input.decision === 'approved' ? 'application.approved' : 'application.rejected',
      'application',
      applicationId,
      {
        student_id: parsed.application.user_id,
        reference_code: parsed.application.reference_code,
        decision: input.decision,
      },
    );

    const { data: notes, error: notesErr } = await this.admin
      .from('application_notes')
      .select('*, author:profiles!application_notes_author_id_fkey(full_name)')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });
    assertNoDbError(notesErr, 'Müraciət qeydləri yüklənmədi.');

    const cleanNotes = ((notes ?? []) as unknown as Array<
      ApplicationNote & { author?: { full_name?: string } | Array<{ full_name?: string }> | null }
    >).map(({ author, ...cleanNote }) => ({
      ...cleanNote,
      author_name: unwrap(author)?.full_name ?? null,
    }));

    return {
      application: parsed.application,
      profile: parsed.profile,
      notes: cleanNotes,
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
      .select('*, author:profiles!application_notes_author_id_fkey(full_name)')
      .single();
    assertNoDbError(error, 'Daxili qeyd əlavə olunmadı.');
    const row = data as unknown as ApplicationNote & {
      author?: { full_name?: string } | Array<{ full_name?: string }> | null;
    };
    const { author, ...cleanNote } = row;
    await this.writeAudit(audit, 'application_note.created', 'application', applicationId, {
      note_id: cleanNote.id,
    });
    return {
      ...cleanNote,
      author_name: unwrap(author)?.full_name ?? null,
    };
  }

  async listStudents(filter?: { status?: string; search?: string }): Promise<AdminStudentView[]> {
    // Explicitly disambiguate all 3 FKs to profiles so PostgREST never throws PGRST201
    const q = this.admin
      .from('profiles')
      .select(
        '*, user_roles!user_roles_user_id_fkey(role, revoked_at), applications!applications_user_id_fkey(*), enrollments!enrollments_student_id_fkey(*, courses(*))',
      )
      .order('created_at', { ascending: false });
    if (filter?.status && filter.status !== 'all') q.eq('account_status', filter.status);
    const { data, error } = await q;
    assertNoDbError(error, 'Tələbələr yüklənmədi.');

    const term = filter?.search?.trim().toLowerCase();
    const rows = (data ?? []) as unknown as Array<
      Profile & {
        user_roles: Array<{ role: AppRole; revoked_at: string | null }>;
        applications: Application[];
        enrollments: Array<Enrollment & { courses: Course | Course[] | null }>;
      }
    >;

    const filtered = rows
      .filter((r) => (r.user_roles ?? []).some((ur) => ur.role === 'student' && ur.revoked_at === null))
      .filter((r) =>
        !term
          ? true
          : r.full_name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term),
      );

    // Aggregate real completed lesson counts per student
    const studentIds = filtered.map((r) => r.id);
    const completedCounts = new Map<string, number>();
    if (studentIds.length > 0) {
      const { data: progRows, error: progErr } = await this.admin
        .from('lesson_progress')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('status', 'completed');
      assertNoDbError(progErr, 'Tələbə irəliləyişi yüklənmədi.');
      for (const p of (progRows ?? []) as Array<{ student_id: string }>) {
        completedCounts.set(p.student_id, (completedCounts.get(p.student_id) ?? 0) + 1);
      }
    }

    return filtered.map(({ user_roles, applications, enrollments, ...cleanProfile }) => {
      const sortedApps = [...(applications ?? [])].sort((a, b) =>
        b.submitted_at.localeCompare(a.submitted_at),
      );
      return {
        profile: cleanProfile,
        roles: (user_roles ?? []).filter((ur) => ur.revoked_at === null).map((ur) => ur.role),
        application: sortedApps[0] ?? null,
        enrollments: (enrollments ?? []).map(({ courses, ...cleanEnr }) => ({
          ...cleanEnr,
          course: unwrap(courses) ?? undefined,
        })),
        completed_lessons_count: completedCounts.get(cleanProfile.id) ?? 0,
      };
    });
  }

  async updateStudentAccountStatus(
    studentId: string,
    accountStatus: 'active' | 'suspended',
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Profile> {
    if (studentId === audit.actorId) {
      throw new HttpError(403, 'SELF_MODIFICATION_FORBIDDEN', 'Öz administrator hesabınızın statusunu dəyişə bilməzsiniz.');
    }

    const [profileRes, rolesRes] = await Promise.all([
      this.admin.from('profiles').select('id, account_status').eq('id', studentId).maybeSingle(),
      this.admin.from('user_roles').select('role').eq('user_id', studentId).is('revoked_at', null),
    ]);
    assertNoDbError(profileRes.error, 'Tələbə profili yoxlanmadı.');
    assertNoDbError(rolesRes.error, 'İstifadəçi rolları yoxlanmadı.');
    if (!profileRes.data) {
      throw new HttpError(404, 'STUDENT_NOT_FOUND', 'Tələbə tapılmadı.');
    }

    const activeRoles = ((rolesRes.data ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
    if (activeRoles.includes('admin')) {
      throw new HttpError(403, 'ADMIN_PROTECTED', 'Administrator hesabları bu bölmədən dondurula bilməz.');
    }
    if (!activeRoles.includes('student')) {
      throw new HttpError(400, 'NOT_A_STUDENT', 'Yalnız tələbə hesablarının statusu dəyişdirilə bilər.');
    }

    const currentStatus = (profileRes.data as { account_status: string }).account_status;
    if (currentStatus !== 'active' && currentStatus !== 'suspended') {
      throw new HttpError(
        400,
        'APPROVAL_WORKFLOW_REQUIRED',
        'Gözləmədə, rədd edilmiş və ya arxivlənmiş hesablar yalnız müraciət təsdiqi axını ilə aktivləşdirilə bilər.',
      );
    }

    const { data, error } = await this.admin
      .from('profiles')
      .update({ account_status: accountStatus, archived_at: null })
      .eq('id', studentId)
      .select('*')
      .single();
    assertNoDbError(error, 'Hesab statusu yenilənmədi.');
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
    assertNoDbError(error, 'Kurs təyinatları yüklənmədi.');
    return ((data ?? []) as unknown as Array<
      Enrollment & {
        courses: Course | Course[] | null;
        profiles: { full_name: string; email: string } | Array<{ full_name: string; email: string }> | null;
      }
    >).map(({ courses, profiles, ...cleanEnr }) => {
      const prof = unwrap(profiles);
      return {
        ...cleanEnr,
        course: unwrap(courses) ?? undefined,
        student_name: prof?.full_name,
        student_email: prof?.email,
      };
    });
  }

  async assignCoursesToStudent(
    studentId: string,
    courseIds: string[],
    audit: AuditContext,
  ): Promise<Enrollment[]> {
    const uniqueCourseIds = Array.from(new Set(courseIds));
    const [profileRes, rolesRes] = await Promise.all([
      this.admin.from('profiles').select('account_status').eq('id', studentId).maybeSingle(),
      this.admin.from('user_roles').select('role').eq('user_id', studentId).is('revoked_at', null),
    ]);
    assertNoDbError(profileRes.error, 'Tələbə profili yoxlanmadı.');
    assertNoDbError(rolesRes.error, 'Tələbə rolu yoxlanmadı.');

    const activeRoles = ((rolesRes.data ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
    if (
      !profileRes.data ||
      (profileRes.data as { account_status: string }).account_status !== 'active' ||
      !activeRoles.includes('student')
    ) {
      throw new HttpError(400, 'STUDENT_NOT_ACTIVE', 'Yalnız aktiv tələbələrə kurs təyin edilə bilər.');
    }

    const now = new Date().toISOString();
    const payload = uniqueCourseIds.map((courseId) => ({
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
    assertNoDbError(error, 'Kurs təyinatı alınmadı.');

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
    assertNoDbError(error, 'Kurs təyinatı ləğv edilmədi.');
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
    assertNoDbError(error, 'Kurslar yüklənmədi.');
    return this.enrichCoursesWithCounts((data ?? []) as Course[], false);
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
    assertNoDbError(error, 'Kurs yaradılmadı.');
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
        ...(input.status === 'archived'
          ? { archived_at: now }
          : input.status
            ? { archived_at: null }
            : {}),
        ...(input.status === 'published' ? { published_at: now } : {}),
        updated_by: audit.actorId,
      })
      .eq('id', courseId)
      .select('*')
      .single();
    assertNoDbError(error, 'Kurs yenilənmədi.');
    await this.writeAudit(audit, 'course.updated', 'course', courseId, { status: input.status });
    return data as Course;
  }

  async listCourseModules(courseId: string): Promise<ModuleItem[]> {
    const { data, error } = await this.admin
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    assertNoDbError(error, 'Modullar yüklənmədi.');
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
    assertNoDbError(error, 'Modul yaradılmadı.');
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
        ...(input.status === 'archived'
          ? { archived_at: now }
          : input.status
            ? { archived_at: null }
            : {}),
        updated_by: audit.actorId,
      })
      .eq('id', moduleId)
      .select('*')
      .single();
    assertNoDbError(error, 'Modul yenilənmədi.');
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
    assertNoDbError(error, 'Dərslər yüklənmədi.');
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
    assertNoDbError(error, 'Dərs yaradılmadı.');
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
        ...(input.status === 'archived'
          ? { archived_at: now }
          : input.status
            ? { archived_at: null }
            : {}),
        ...(input.status === 'published' ? { published_at: now } : {}),
        updated_by: audit.actorId,
      })
      .eq('id', lessonId)
      .select('*')
      .single();
    assertNoDbError(error, 'Dərs yenilənmədi.');
    await this.writeAudit(audit, 'lesson.updated', 'lesson', lessonId, { status: input.status });
    return data as LessonItem;
  }

  async listLessonBlocksAdmin(lessonId: string) {
    const [lessonRes, blocksRes, exercisesRes, quizzesRes] = await Promise.all([
      this.admin.from('lessons').select('*').eq('id', lessonId).maybeSingle(),
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

    assertNoDbError(lessonRes.error, 'Dərs tapılmadı.');
    if (!lessonRes.data) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Dərs tapılmadı.');
    assertNoDbError(blocksRes.error, 'Dərs blokları yüklənmədi.');
    assertNoDbError(exercisesRes.error, 'Məşqlər yüklənmədi.');
    assertNoDbError(quizzesRes.error, 'Quizlər yüklənmədi.');

    return {
      lesson: lessonRes.data as LessonItem,
      blocks: (blocksRes.data ?? []) as LessonContentBlock[],
      exercises: ((exercisesRes.data ?? []) as unknown as Array<
        PublicExercise & {
          exercise_test_cases?: ExerciseTestCase[];
          exercise_solutions?: { solution_code?: string } | Array<{ solution_code?: string }> | null;
        }
      >).map(({ exercise_test_cases, exercise_solutions, ...cleanEx }) => ({
        ...cleanEx,
        test_cases: [...(exercise_test_cases ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        solution_code: unwrap(exercise_solutions)?.solution_code,
      })),
      quizzes: ((quizzesRes.data ?? []) as unknown as Array<
        AdminQuiz & {
          quiz_questions?: Array<
            AdminQuiz['questions'][number] & {
              quiz_question_options?: AdminQuiz['questions'][number]['options'];
            }
          >;
        }
      >).map(({ quiz_questions, ...cleanQz }) => ({
        ...cleanQz,
        questions: [...(quiz_questions ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(({ quiz_question_options, ...cleanQ }) => ({
            ...cleanQ,
            options: [...(quiz_question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
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
    assertNoDbError(error, 'Kontent bloku yaradılmadı.');
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
    assertNoDbError(error, 'Kontent bloku yenilənmədi.');
    await this.writeAudit(audit, 'lesson_block.updated', 'lesson_content_block', blockId, {});
    return data as LessonContentBlock;
  }

  async deleteContentBlock(blockId: string, audit: AuditContext): Promise<void> {
    const { data, error } = await this.admin
      .from('lesson_content_blocks')
      .delete()
      .eq('id', blockId)
      .select('id');
    assertNoDbError(error, 'Kontent bloku silinmədi.');
    if (!data || data.length === 0) {
      throw new HttpError(404, 'BLOCK_NOT_FOUND', 'Kontent bloku tapılmadı.');
    }
    await this.writeAudit(audit, 'lesson_block.deleted', 'lesson_content_block', blockId, {});
  }

  async createExercise(input: ExerciseUpsertInput, audit: AuditContext): Promise<PublicExercise> {
    const { test_cases, solution_code, ...exPayload } = input;
    const { data: exRow, error } = await this.admin
      .from('exercises')
      .insert(exPayload)
      .select('*')
      .single();
    assertNoDbError(error, 'Məşq yaradılmadı.');
    const ex = exRow as Omit<PublicExercise, 'test_cases'>;

    if (solution_code) {
      const { error: solErr } = await this.admin.from('exercise_solutions').upsert({
        exercise_id: ex.id,
        solution_code,
        updated_by: audit.actorId,
      });
      assertNoDbError(solErr, 'Məşq nümunə həlli saxlanmadı.');
    }

    let insertedCases: ExerciseTestCase[] = [];
    if (test_cases.length > 0) {
      const { data: tcData, error: tcErr } = await this.admin
        .from('exercise_test_cases')
        .insert(
          test_cases.map((tc, i) => ({
            ...tc,
            exercise_id: ex.id,
            sort_order: tc.sort_order ?? i + 1,
          })),
        )
        .select('*');
      assertNoDbError(tcErr, 'Məşq test halları əlavə olunmadı.');
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
    assertNoDbError(error, 'Quiz yaradılmadı.');
    const qz = qzRow as Omit<AdminQuiz, 'questions'>;

    const createdQuestions: AdminQuiz['questions'] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const { options, ...qPayload } = q;
      const { data: qRow, error: qErr } = await this.admin
        .from('quiz_questions')
        .insert({ ...qPayload, quiz_id: qz.id, sort_order: q.sort_order ?? i + 1 })
        .select('*')
        .single();
      assertNoDbError(qErr, 'Quiz sualı əlavə olunmadı.');
      const createdQ = qRow as Omit<AdminQuiz['questions'][number], 'options'>;

      const { data: optRows, error: oErr } = await this.admin
        .from('quiz_question_options')
        .insert(
          options.map((o, oi) => ({
            ...o,
            question_id: createdQ.id,
            sort_order: o.sort_order ?? oi + 1,
          })),
        )
        .select('*');
      assertNoDbError(oErr, 'Quiz variantları əlavə olunmadı.');
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
    assertNoDbError(error, 'Tənzimləmələr oxunmadı.');
    const { id: _omitId, ...row } = data as PublicPlatformSettings & {
      id: boolean;
      email_sender_name?: string;
      website_domain?: string | null;
      updated_by: string | null;
      updated_at: string;
    };
    void _omitId;
    const enabled = row.whatsapp_button_enabled && Boolean(row.whatsapp_phone);
    const hasCustomSmtp =
      Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) ||
      Boolean(process.env.RESEND_API_KEY?.trim()) ||
      Boolean(process.env.POSTMARK_SERVER_TOKEN?.trim());

    return {
      ...row,
      email_sender_name: row.email_sender_name ?? 'Kodera Academy',
      website_domain: row.website_domain ?? null,
      whatsapp_button_enabled: enabled,
      whatsapp_phone: enabled ? row.whatsapp_phone : null,
      raw_whatsapp_button_enabled: row.whatsapp_button_enabled,
      raw_whatsapp_phone: row.whatsapp_phone,
      email_provider_configured: hasCustomSmtp,
      email_provider_mode: hasCustomSmtp ? 'custom_smtp' : 'supabase_auth_default',
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
    assertNoDbError(error, 'Tənzimləmələr yenilənmədi.');
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
    assertNoDbError(error, 'Audit logları yüklənmədi.');
    return ((data ?? []) as unknown as Array<
      AuditLogEntry & { profiles: { email: string } | Array<{ email: string }> | null }
    >).map(({ profiles, ...cleanLog }) => ({
      ...cleanLog,
      actor_email: unwrap(profiles)?.email ?? null,
    }));
  }
}
