import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Spinner } from '@/components/ui';
import { HomePage } from '@/features/public/HomePage';
import { CoursesPage } from '@/features/public/CoursesPage';
import { CourseDetailPage } from '@/features/public/CourseDetailPage';
import { PublicLessonPage } from '@/features/public/PublicLessonPage';
import { AboutPage } from '@/features/public/AboutPage';
import { PrivacyPolicyPage } from '@/features/public/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/features/public/TermsOfServicePage';
import { NotFoundPage } from '@/features/public/NotFoundPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { ApplicationStatusPage } from '@/features/auth/ApplicationStatusPage';
import { RequireActiveStudent, RequireAdmin } from '@/features/auth/ProtectedRoute';

// Lazy-loaded Student Dashboard routes
const StudentLayout = lazy(() =>
  import('@/features/student/StudentLayout').then((m) => ({ default: m.StudentLayout })),
);
const StudentOverviewPage = lazy(() =>
  import('@/features/student/StudentOverviewPage').then((m) => ({
    default: m.StudentOverviewPage,
  })),
);
const StudentCoursesPage = lazy(() =>
  import('@/features/student/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage })),
);
const StudentCourseCurriculumPage = lazy(() =>
  import('@/features/student/StudentCourseCurriculumPage').then((m) => ({
    default: m.StudentCourseCurriculumPage,
  })),
);
const StudentLessonPage = lazy(() =>
  import('@/features/student/StudentLessonPage').then((m) => ({ default: m.StudentLessonPage })),
);
const StudentProgressPage = lazy(() =>
  import('@/features/student/StudentProgressPage').then((m) => ({
    default: m.StudentProgressPage,
  })),
);
const StudentProfilePage = lazy(() =>
  import('@/features/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })),
);
const StudentSettingsPage = lazy(() =>
  import('@/features/student/StudentSettingsPage').then((m) => ({
    default: m.StudentSettingsPage,
  })),
);

// Lazy-loaded Admin Dashboard routes
const AdminLayout = lazy(() =>
  import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminOverviewPage = lazy(() =>
  import('@/features/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })),
);
const AdminApplicationsPage = lazy(() =>
  import('@/features/admin/AdminApplicationsPage').then((m) => ({
    default: m.AdminApplicationsPage,
  })),
);
const AdminStudentsPage = lazy(() =>
  import('@/features/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage })),
);
const AdminEnrollmentsPage = lazy(() =>
  import('@/features/admin/AdminEnrollmentsPage').then((m) => ({
    default: m.AdminEnrollmentsPage,
  })),
);
const AdminCoursesPage = lazy(() =>
  import('@/features/admin/AdminCoursesPage').then((m) => ({ default: m.AdminCoursesPage })),
);
const AdminCourseModulesPage = lazy(() =>
  import('@/features/admin/AdminCourseModulesPage').then((m) => ({
    default: m.AdminCourseModulesPage,
  })),
);
const AdminModuleLessonsPage = lazy(() =>
  import('@/features/admin/AdminModuleLessonsPage').then((m) => ({
    default: m.AdminModuleLessonsPage,
  })),
);
const AdminLessonEditorPage = lazy(() =>
  import('@/features/admin/AdminLessonEditorPage').then((m) => ({
    default: m.AdminLessonEditorPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import('@/features/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
);
const AdminAuditLogsPage = lazy(() =>
  import('@/features/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })),
);

export function App() {
  return (
    <Suspense fallback={<Spinner fullPage label="Səhifə yüklənir..." />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/courses/:slug/lessons/:lessonSlug" element={<PublicLessonPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/application-status" element={<ApplicationStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <RequireActiveStudent>
              <StudentLayout />
            </RequireActiveStudent>
          }
        >
          <Route index element={<StudentOverviewPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:slug" element={<StudentCourseCurriculumPage />} />
          <Route path="courses/:slug/lessons/:lessonSlug" element={<StudentLessonPage />} />
          <Route path="progress" element={<StudentProgressPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="enrollments" element={<AdminEnrollmentsPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId/modules" element={<AdminCourseModulesPage />} />
          <Route path="modules/:moduleId/lessons" element={<AdminModuleLessonsPage />} />
          <Route path="lessons/:lessonId/editor" element={<AdminLessonEditorPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
