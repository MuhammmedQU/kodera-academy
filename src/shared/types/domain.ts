// Shared domain types aligned 1:1 with Kodera PostgreSQL schema (Phase 2)

export type AppRole = 'student' | 'admin';
export type AccountStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'archived';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type EnrollmentStatus = 'active' | 'revoked' | 'completed';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type AttemptStatus = 'passed' | 'failed' | 'error' | 'timeout';
export type ExerciseExecutionMode = 'pyodide_worker' | 'static_review';
export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'code'
  | 'explanation'
  | 'example'
  | 'note'
  | 'warning'
  | 'exercise'
  | 'quiz'
  | 'summary';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  learning_goals: string | null;
  avatar_url: string | null;
  preferred_locale: string;
  account_status: AccountStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  reference_code: string;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  author_id: string | null;
  author_name?: string | null;
  note: string;
  created_at: string;
}

export interface AuthSessionUser {
  profile: Profile;
  roles: AppRole[];
  isAdmin: boolean;
  isActiveStudent: boolean;
  application: Application | null;
}

export interface PublicPlatformSettings {
  academy_name: string;
  academy_tagline: string;
  logo_storage_path: string | null;
  contact_email: string | null;
  whatsapp_button_enabled: boolean;
  whatsapp_phone: string | null;
  whatsapp_button_label: string;
  whatsapp_message_template: string;
  alternative_contact_text: string | null;
  registration_enabled: boolean;
  default_public_modules_count: number;
}

export interface AdminPlatformSettings extends PublicPlatformSettings {
  raw_whatsapp_button_enabled: boolean;
  raw_whatsapp_phone: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface Course {
  id: string;
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  description: string;
  learning_objectives: string[];
  target_audience: string | null;
  programming_language: string;
  difficulty: CourseDifficulty;
  estimated_duration_minutes: number;
  cover_image_path: string | null;
  sort_order: number;
  status: ContentStatus;
  is_published: boolean;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  public_module_count?: number;
  total_module_count?: number;
  total_lesson_count?: number;
  first_public_lesson_slug?: string | null;
}

export interface ModuleItem {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_public: boolean;
  status: ContentStatus;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonItem {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  summary: string | null;
  estimated_minutes: number;
  sort_order: number;
  status: ContentStatus;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurriculumOutlineLesson {
  id: string;
  slug: string | null;
  title: string;
  sort_order: number;
  estimated_minutes: number;
  progress_status?: ProgressStatus;
}

export interface CurriculumOutlineModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_public: boolean;
  can_access: boolean;
  lessons: CurriculumOutlineLesson[];
}

export interface LessonContentBlock {
  id: string;
  lesson_id: string;
  locale: string;
  block_type: ContentBlockType;
  sort_order: number;
  title: string | null;
  content: Record<string, unknown>;
  exercise_id: string | null;
  quiz_id: string | null;
  is_published: boolean;
  exercise?: PublicExercise;
  quiz?: PublicQuiz;
}

export interface ExerciseTestCase {
  id: string;
  exercise_id: string;
  label: string;
  stdin_input: string;
  expected_stdout: string | null;
  assertion_code: string | null;
  is_hidden: boolean;
  sort_order: number;
}

export interface PublicExercise {
  id: string;
  lesson_id: string;
  locale: string;
  title: string;
  instructions: string;
  programming_language: string;
  starter_code: string;
  hints: string[];
  execution_mode: ExerciseExecutionMode;
  time_limit_ms: number;
  max_output_chars: number;
  test_cases: ExerciseTestCase[];
}

export interface PublicQuizOption {
  id: string;
  question_id: string;
  option_text: string;
  sort_order: number;
}

export interface PublicQuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuizQuestionType;
  prompt: string;
  code_snippet: string | null;
  code_language: string | null;
  points: number;
  sort_order: number;
  options: PublicQuizOption[];
}

export interface PublicQuiz {
  id: string;
  lesson_id: string;
  locale: string;
  title: string;
  description: string | null;
  passing_score_percent: number;
  max_attempts: number | null;
  questions: PublicQuizQuestion[];
}

export interface AdminQuizOption extends PublicQuizOption {
  is_correct: boolean;
}

export interface AdminQuizQuestion extends Omit<PublicQuizQuestion, 'options'> {
  explanation: string | null;
  options: AdminQuizOption[];
}

export interface AdminQuiz extends Omit<PublicQuiz, 'questions'> {
  status: ContentStatus;
  questions: AdminQuizQuestion[];
}

export interface QuizSubmissionFeedback {
  question_id: string;
  is_correct: boolean;
  points_awarded: number;
  explanation: string | null;
}

export interface QuizAttemptResult {
  attempt_id: string;
  attempt_number: number;
  earned_points: number;
  total_points: number;
  score_percent: number;
  is_passed: boolean;
  feedback: QuizSubmissionFeedback[];
}

export interface QuizAttemptSummary {
  id: string;
  student_id: string;
  quiz_id: string;
  quiz_title?: string;
  attempt_number: number;
  earned_points: number;
  total_points: number;
  score_percent: number;
  is_passed: boolean;
  submitted_at: string;
}

export interface ExerciseAttemptSummary {
  id: string;
  student_id: string;
  exercise_id: string;
  exercise_title?: string;
  submitted_code: string;
  status: AttemptStatus;
  passed_tests: number;
  total_tests: number;
  stdout: string | null;
  stderr: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  assigned_by: string | null;
  assigned_at: string;
  revoked_by: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  completed_at: string | null;
  course?: Course;
  student_name?: string;
  student_email?: string;
}

export interface LessonProgressRecord {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  status: ProgressStatus;
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string;
}

export interface StudentCourseWithProgress {
  enrollment: Enrollment;
  course: Course;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  next_lesson_slug: string | null;
  next_lesson_title: string | null;
}

export interface LessonViewPayload {
  course: Course;
  module: ModuleItem;
  lesson: LessonItem;
  blocks: LessonContentBlock[];
  prev_lesson: { slug: string | null; title: string; is_locked: boolean } | null;
  next_lesson: { slug: string | null; title: string; is_locked: boolean } | null;
  is_last_public_lesson: boolean;
  is_enrolled: boolean;
  progress_status: ProgressStatus;
  previous_quiz_attempts: Record<string, QuizAttemptSummary[]>;
  previous_exercise_attempts: Record<string, ExerciseAttemptSummary[]>;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email?: string | null;
  actor_role: 'admin' | 'system';
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  pending_applications: number;
  active_students: number;
  suspended_students: number;
  published_courses: number;
  total_courses: number;
  total_lessons: number;
  active_enrollments: number;
  recent_audit_logs: AuditLogEntry[];
}

export interface AdminApplicationView {
  application: Application;
  profile: Profile;
  notes: ApplicationNote[];
}

export interface AdminStudentView {
  profile: Profile;
  roles: AppRole[];
  application: Application | null;
  enrollments: Enrollment[];
  completed_lessons_count: number;
}
