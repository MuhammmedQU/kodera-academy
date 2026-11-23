import type {
  AdminApplicationView,
  AdminDashboardStats,
  AdminPlatformSettings,
  AdminQuiz,
  AdminStudentView,
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
  QuizAttemptResult,
  QuizAttemptSummary,
  StudentCourseWithProgress,
} from '../../src/shared/types/domain';
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

export interface AuditContext {
  actorId: string | null;
  actorRole: 'admin' | 'system';
  ipAddress: string | null;
  userAgent: string | null;
}

export interface KoderaRepository {
  // Rate limiting
  checkRateLimit(
    bucketKey: string,
    action: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<boolean>;

  // Auth & session
  resolveUserByToken(token: string): Promise<AuthSessionUser | null>;
  registerStudent(
    input: RegisterInput,
    meta: { ipAddress: string; userAgent: string },
  ): Promise<{
    access_token?: string;
    requires_email_verification: boolean;
    reference_code: string;
    user?: AuthSessionUser;
  }>;
  loginSandbox?(email: string, password: string): Promise<{ access_token: string; user: AuthSessionUser }>;
  requestPasswordReset(email: string): Promise<void>;

  // Public read
  getPublicSettings(): Promise<PublicPlatformSettings>;
  listPublishedCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string, viewer: AuthSessionUser | null): Promise<{
    course: Course;
    outline: CurriculumOutlineModule[];
    is_enrolled: boolean;
  } | null>;
  getLessonView(
    courseSlug: string,
    lessonSlug: string,
    viewer: AuthSessionUser | null,
  ): Promise<{ status: 'ok'; payload: LessonViewPayload } | { status: 'not_found' } | { status: 'forbidden'; course: Course; moduleTitle: string }>;

  // Student operations
  listStudentCourses(studentId: string): Promise<StudentCourseWithProgress[]>;
  getStudentProgressOverview(studentId: string): Promise<{
    courses: StudentCourseWithProgress[];
    completed_lessons: Array<{
      lesson_id: string;
      lesson_title: string;
      lesson_slug: string;
      course_slug: string;
      course_title: string;
      completed_at: string;
    }>;
    quiz_attempts: QuizAttemptSummary[];
    exercise_attempts: ExerciseAttemptSummary[];
  }>;
  upsertLessonProgress(
    studentId: string,
    lessonId: string,
    input: LessonProgressUpdateInput,
  ): Promise<LessonProgressRecord>;
  recordExerciseAttempt(
    studentId: string,
    exerciseId: string,
    input: ExerciseAttemptCreateInput,
  ): Promise<ExerciseAttemptSummary>;
  submitQuizAttempt(
    studentId: string,
    quizId: string,
    input: QuizSubmitInput,
    accessToken?: string,
  ): Promise<QuizAttemptResult>;
  updateOwnProfile(studentId: string, input: ProfileUpdateInput): Promise<Profile>;

  // Admin operations
  getAdminStats(): Promise<AdminDashboardStats>;
  listApplications(filter?: { status?: string; search?: string }): Promise<AdminApplicationView[]>;
  reviewApplication(
    applicationId: string,
    input: ApplicationReviewInput,
    audit: AuditContext,
  ): Promise<AdminApplicationView>;
  addApplicationNote(
    applicationId: string,
    note: string,
    audit: AuditContext,
  ): Promise<ApplicationNote>;

  listStudents(filter?: { status?: string; search?: string }): Promise<AdminStudentView[]>;
  updateStudentAccountStatus(
    studentId: string,
    accountStatus: 'active' | 'suspended',
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Profile>;

  listEnrollments(filter?: { studentId?: string; courseId?: string }): Promise<Enrollment[]>;
  assignCoursesToStudent(
    studentId: string,
    courseIds: string[],
    audit: AuditContext,
  ): Promise<Enrollment[]>;
  revokeEnrollment(
    enrollmentId: string,
    reason: string | undefined,
    audit: AuditContext,
  ): Promise<Enrollment>;

  // Admin CMS
  listAllCourses(): Promise<Course[]>;
  createCourse(input: CourseUpsertInput, audit: AuditContext): Promise<Course>;
  updateCourse(courseId: string, input: Partial<CourseUpsertInput>, audit: AuditContext): Promise<Course>;
  listCourseModules(courseId: string): Promise<ModuleItem[]>;
  createModule(input: ModuleUpsertInput, audit: AuditContext): Promise<ModuleItem>;
  updateModule(moduleId: string, input: Partial<ModuleUpsertInput>, audit: AuditContext): Promise<ModuleItem>;
  listModuleLessons(moduleId: string): Promise<LessonItem[]>;
  createLesson(input: LessonUpsertInput, audit: AuditContext): Promise<LessonItem>;
  updateLesson(lessonId: string, input: Partial<LessonUpsertInput>, audit: AuditContext): Promise<LessonItem>;
  listLessonBlocksAdmin(lessonId: string): Promise<{
    lesson: LessonItem;
    blocks: LessonContentBlock[];
    exercises: Array<PublicExercise & { solution_code?: string }>;
    quizzes: AdminQuiz[];
  }>;
  createContentBlock(input: ContentBlockUpsertInput, audit: AuditContext): Promise<LessonContentBlock>;
  updateContentBlock(
    blockId: string,
    input: Partial<ContentBlockUpsertInput>,
    audit: AuditContext,
  ): Promise<LessonContentBlock>;
  deleteContentBlock(blockId: string, audit: AuditContext): Promise<void>;
  createExercise(input: ExerciseUpsertInput, audit: AuditContext): Promise<PublicExercise>;
  createQuiz(input: QuizUpsertInput, audit: AuditContext): Promise<AdminQuiz>;

  // Admin settings & audit logs
  getAdminSettings(): Promise<AdminPlatformSettings>;
  updateAdminSettings(
    input: PlatformSettingsUpdateInput,
    audit: AuditContext,
  ): Promise<AdminPlatformSettings>;
  listAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
}
