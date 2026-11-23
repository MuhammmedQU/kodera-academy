import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Spinner } from '@/components/ui';
import { HomePage } from '@/features/public/HomePage';
import { NotFoundPage } from '@/features/public/NotFoundPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { ApplicationStatusPage } from '@/features/auth/ApplicationStatusPage';
import { RequireAdmin } from '@/features/auth/ProtectedRoute';

// Lazy-loaded Admin routes (code-split away from public/student bundle)
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
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/application-status" element={<ApplicationStatusPage />} />
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
        </Route>
      </Routes>
    </Suspense>
  );
}
