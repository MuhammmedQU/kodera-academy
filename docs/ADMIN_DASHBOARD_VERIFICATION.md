# Kodera Academy — Admin Paneli və Real Verilənlər Bazası Statistikalarının Doğrulanması (`ADMIN_DASHBOARD_VERIFICATION.md`)

> **Tarix:** 2026-11-24  
> **Əhatə:** `/admin` (`AdminOverviewPage.tsx`), `/admin/settings` (`AdminSettingsPage.tsx`), `GET /api/admin/stats`, `public.get_admin_dashboard_stats()` RPC (`20261123000008`).

---

## 1. Silinmiş Saxta (Demo) Statistikalar

Əvvəlki lokal sandbox konfiqurasiyasında tətbiq işə düşərkən 5 demo tələbə hesabı (`Aysel Məmmədova`, `Rəşad Əliyev`, `Nigar Həsənova`, `Elvin Quliyev`, `Tural Kərimov`), 5 demo müraciət və 2 demo təyinat birbaşa admin siyahılarına və statistikaya daxil edilirdi. Nəticədə heç kim qeydiyyatdan keçmədiyi halda Admin Paneli:
- `1 gözləyən müraciət`
- `2 aktiv tələbə`
- `2 aktiv kurs təyinatı`
- `1 dondurulmuş hesab`
göstərirdi.

**Tətbiq edilən həll:**
1. `DEMO_FIXTURE_USER_IDS` və `DEMO_FIXTURE_ENROLLMENT_IDS` ([localSandboxRepository.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/server/dev/localSandboxRepository.ts)) `getAdminStats()`, `listApplications()`, `listStudents()` və `listEnrollments()` metodlarından **tamamilə çıxarıldı**.
2. Nəticədə həm lokal mühitdə, həm də yeni qurulmuş real PostgreSQL bazasında heç bir tələbə qeydiyyatdan keçməmişdirsə, bütün istifadəçi, müraciət, təyinat, tamamlanmış dərs və audit jurnalı göstəriciləri **`0`** qaytarır.

---

## 2. 12 Real Statistik Göstəricinin Hesablanma Məntiqi

Bütün göstəricilər server tərəfində ([supabaseRepository.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/server/lib/supabaseRepository.ts) və [20261123000008_official_academy_contact_and_admin_stats.sql](file:///c:/Users/LENOVO/Desktop/Py_Course/supabase/migrations/20261123000008_official_academy_contact_and_admin_stats.sql)) hesablanır. Heç bir həssas statistika brauzerdə xam cədvəllərdən hesablanmır və `SUPABASE_SERVICE_ROLE_KEY` heç vaxt frontend-ə ötürülmür.

| # | Göstərici (Sahə adı) | UI Başlığı | PostgreSQL Hesablanma Məntiqi (`get_admin_dashboard_stats()`) | Boş Bazada Dəyər |
| :-: | :--- | :--- | :--- | :-: |
| 1 | `total_registered_users` | Ümumi qeydiyyatlı istifadəçilər | `public.profiles` cədvəlində `account_status <> 'archived'` olan və aktiv `admin` rolu olmayan bütün qeydiyyatlı hesablar | `0` |
| 2 | `pending_applications` | Gözləyən müraciətlər | `public.applications` cədvəlində `status = 'pending'` olan tələbə müraciətləri | `0` |
| 3 | `approved_applications` | Təsdiqlənmiş müraciətlər | `public.applications` cədvəlində `status = 'approved'` olan tələbə müraciətləri | `0` |
| 4 | `rejected_applications` | Rədd edilmiş müraciətlər | `public.applications` cədvəlində `status = 'rejected'` olan tələbə müraciətləri | `0` |
| 5 | `active_students` | Aktiv tələbələr | `public.profiles` (`account_status = 'active'`) + `public.user_roles` (`role = 'student'`, `revoked_at IS NULL`, qeyri-admin) | `0` |
| 6 | `suspended_accounts` | Dondurulmuş hesablar | `public.profiles` (`account_status = 'suspended'`) olan tələbə hesabları | `0` |
| 7 | `active_enrollments` | Aktiv kurs təyinatları | `public.enrollments` cədvəlində `status = 'active'` olan sətirlər | `0` |
| 8 | `published_courses` | Dərc olunmuş kurslar | `public.courses` cədvəlində `is_published = true` olan kurslar (+ alt yazıda `total_courses`) | `0` *(Seed sonrası: `2`)* |
| 9 | `total_modules` | Ümumi modullar | `public.modules` cədvəlində `status <> 'archived'` olan modullar | `0` *(Seed sonrası: `4`)* |
| 10 | `published_lessons` | Dərc olunmuş dərslər | `public.lessons` cədvəlində `is_published = true` olan dərslər (+ alt yazıda `total_lessons`) | `0` *(Seed sonrası: `10`)* |
| 11 | `completed_lessons` | Tamamlanmış dərslər | `public.lesson_progress` cədvəlində `status = 'completed'` olan sətirlər | `0` |
| 12 | `recent_audit_logs` | Son İnzibati Fəaliyyətlər | `public.audit_logs` cədvəlindən son 10 dəyişməz əməliyyat (`ORDER BY created_at DESC LIMIT 10`) | `[]` |

---

## 3. UI Vəziyyətləri və Dinamik Yenilənmə (`AdminOverviewPage.tsx`)

1. **Yüklənmə Vəziyyəti (Loading State):** Sorğu tamamlanana qədər `<Spinner label="Admin statistikaları verilənlər bazasından yüklənir..." />` göstərilir.
2. **Xəta Vəziyyəti (Error State):** Sorğu uğursuz olduqda saxta rəqəmlər əvəzinə `<Alert variant="error" title="Statistika yüklənmədi">` və **"Yenidən cəhd et"** düyməsi göstərilir.
3. **Boş Audit Jurnalı Vəziyyəti:** `recent_audit_logs.length === 0` olduqda `"Hələ inzibati əməliyyat qeydi yoxdur."` mətni göstərilir.
4. **Dinamik Yenilənmə:**
   - Admin `/admin/applications` (təsdiq/rədd), `/admin/enrollments` (kurs təyini/ləğvi), `/admin/students` (dondurma/aktivləşdirmə) və ya `/admin/courses` səhifələrindən `/admin` səhifəsinə qayıtdıqda `GET /api/admin/stats` yenidən çağırılır (`Cache-Control: no-store`).
   - Əlavə olaraq başlıqdakı **"Yenilə"** düyməsi ilə istənilən an canlı yeniləmə aparıla bilər.

---

## 4. Avtomatlaşdırılmış Doğrulama Sübutları

1. **İnteqrasiya Testi ([api-admin.test.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/tests/integration/api-admin.test.ts)):**
   - Başlanğıcda `total_registered_users = 0`, `pending_applications = 0`, `approved_applications = 0`, `rejected_applications = 0`, `active_students = 0`, `suspended_accounts = 0`, `active_enrollments = 0`, `completed_lessons = 0`, `recent_audit_logs = []` olduğunu təsdiqləyir.
   - Tələbə qeydiyyatından sonra `total_registered_users = 1`, `pending_applications = 1` olur.
   - Təsdiqdən sonra `pending_applications = 0`, `approved_applications = 1`, `active_students = 1`, `active_enrollments = 0` olur.
   - Kurs təyinatından və dərs tamamlamadan sonra `active_enrollments = 1`, `completed_lessons = 1` olur.
   - Təyinat ləğvindən sonra `active_enrollments = 0` olur.
2. **Canlı Chrome Playwright E2E Testi ([kodera-e2e.spec.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/tests/e2e/kodera-e2e.spec.ts)):**
   - Yeni tələbə `/register` ilə qeydiyyatdan keçdikdən sonra Admin `/admin`-ə daxil olur və `stat-value-total_registered_users = 1`, `stat-value-pending_applications = 1`, `stat-value-active_students = 0`, `stat-value-active_enrollments = 0` görür.
   - Admin müraciəti təsdiqləyib Python kursunu təyin etdikdən sonra `/admin` səhifəsində `stat-value-pending_applications = 0`, `stat-value-approved_applications = 1`, `stat-value-active_students = 1`, `stat-value-active_enrollments = 1` dəyərlərinin canlı yeniləndiyini təsdiqləyir.
   - `/admin/settings` səhifəsində hər 3 bölmənin (`1. Akademiya Məlumatları`, `2. WhatsApp Əlaqə İnteqrasiyası`, `3. E-poçt və Göndərən Tənzimləmələri`) və `email-provider-status-badge` statusunun düzgün işlədiyini təsdiqləyir.
