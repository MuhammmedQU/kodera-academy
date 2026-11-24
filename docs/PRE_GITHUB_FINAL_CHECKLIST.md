# Kodera Academy — GitHub və İlk Xarici Quraşdırmadan Əvvəl Yekun Yoxlama Siyahısı (`PRE_GITHUB_FINAL_CHECKLIST.md`)

> **Hazırlanma tarixi:** 2026-11-24  
> **Cari Status:** **Lokal Hazırlıq 100% Tamamlandı — İlk Private GitHub Repository və `kodera-dev` Supabase Quraşdırmasına Tam Hazırdır (`READY FOR STAGING TESTING`)**  
> **Təhlükəsizlik Təsdiqi:** Heç bir GitHub repository yaradılmayıb, kod heç bir uzaq (remote) serverə push edilməyib, Production-a qoşulmayıb və heç bir gizli açar/parol kod bazasına daxil edilməyib.

---

## 1. Lokal Hazırlıq və Təmizlik Auditi (Tamamlanmış 10 Sahə)

### 1.1 Tam Layihə Yoxlaması və Müvəqqəti Dev Xəbərdarlıqlarının Təmizlənməsi
- [x] **Giriş səhifəsi (`src/features/auth/LoginPage.tsx`):** Müvəqqəti sarı dev qutusu (*"Lokal Sandbox Test Hesabları (yalnız dev rejimi)"*) və daxilindəki test parol düymələri tamamilə silindi. `src/` qovluğunda heç bir test/sandbox parolu yoxdur.
- [x] **Sıfır Build Xəbərdarlığı (`vite.config.ts`):** `node_modules/zod` daxilindəki `@__PURE__` şərh xəbərdarlığı `rollupOptions.onwarn` filtri ilə təmizləndi — `npm run build` artıq **0 xəta və 0 xəbərdarlıq** ilə tamamlanır.
- [x] **SQL Miqrasiya Başlıqları (`supabase/migrations/20261123000001`–`000006`):** Köhnə `-- Phase 2 Draft` və `(Draft Reference)` qeydləri təmizləndi, bütün 7 miqrasiya vahid istehsal standartına gətirildi.
- [x] **Tələbə Hesab Tənzimləmələri (`src/features/student/StudentSettingsPage.tsx`):** Çıxış düyməsi `navigate('/', { replace: true })` ilə standartlaşdırıldı.

### 1.2 Bütün Səhifələr, Düymələr, Formalar, Keçidlər və Funksiyalar
Real Google Chrome üzərində Playwright E2E və **72 viewport yoxlaması** (24 marşrut × 3 ekran ölçüsü: Mobil `375×812`, Planşet `768×1024`, Desktop `1440×900`) ilə təsdiqləndi:
- [x] **İctimai Vebsayt (12 marşrut):** Ana səhifə (`/`), Kurslar kataloqu (`/courses`), Kurs detalları (`/courses/:slug`), İctimai dərs oxuyucu (`/courses/:slug/lessons/:lessonSlug`), Haqqımızda (`/about`), Məxfilik siyasəti (`/privacy`), İstifadə şərtləri (`/terms`), Giriş (`/login`), Qeydiyyat (`/register`), Şifrəni unutdum (`/forgot-password`), Şifrə yeniləmə (`/reset-password`), Müraciət statusu (`/application-status`) və 404 (`*`).
- [x] **Tələbə Paneli (8 marşrut):** Ümumi baxış (`/dashboard`), Kurslarım (`/dashboard/courses`), Kurs kurikulumu (`/dashboard/courses/:slug`), İnteraktiv dərs oxuyucu (`/dashboard/courses/:slug/lessons/:lessonSlug`), İrəliləyiş (`/dashboard/progress`), Profil (`/dashboard/profile`), Hesab tənzimləmələri (`/dashboard/settings`) və daxili 404 (`/dashboard/*`).
- [x] **Admin Paneli (11 marşrut):** Statistik icmal (`/admin`), Müraciətlər (`/admin/applications`), Tələbələr (`/admin/students`), Kurs təyinatları (`/admin/enrollments`), Kurslar (`/admin/courses`), Modullar (`/admin/courses/:courseId/modules`), Dərslər (`/admin/modules/:moduleId/lessons`), 11-bloklu Dərs redaktoru (`/admin/lessons/:lessonId/editor`), Platforma və WhatsApp ayarları (`/admin/settings`), Audit jurnalı (`/admin/audit-logs`) və daxili 404 (`/admin/*`).
- [x] **Keyfiyyət Metrikaları:** `0px` üfüqi daşma (`scrollWidth <= innerWidth + 2`), `0` ədəd iç-içə `<a><button>` WCAG pozuntusu, `0` ədəd `console.error` və `pageerror`.

### 1.3 Supabase İnteqrasiyası Hazırlığı (Dürüst Status Ayrımı)
- [x] **Frontend (`src/lib/env.ts`, `src/lib/supabase.ts`):** Yalnız `VITE_SUPABASE_URL` və `VITE_SUPABASE_ANON_KEY` oxunur; bütün placeholder dəyərlər (`YOUR-DEV-PROJECT`, `YOUR-KODERA-DEV-REF`, `your-supabase-*`) və təsadüfən daxil edilən `sb_secret_*` açarları avtomatik rədd edilir.
- [x] **Backend (`server/lib/getRepository.ts`, `server/lib/supabaseRepository.ts`):** `SUPABASE_URL` (və ya `VITE_SUPABASE_URL`), `SUPABASE_ANON_KEY` (və ya `VITE_SUPABASE_ANON_KEY`) və `SUPABASE_SERVICE_ROLE_KEY` doğrulanır; `NODE_ENV=production` və ya `VERCEL=1` olduqda `LocalSandboxRepository` sərt bloklanır və dinamik `import()` sayəsində production bundle-a düşmür.
- [x] **Supabase Auth Konfiqurasiyası (`supabase/config.toml`):** `project_id = "kodera-dev"`, `enable_confirmations = true`, `double_confirm_changes = true`, `secure_password_change = false` (Supabase Cloud default-u ilə uyğunlaşdırıldı ki, `StudentSettingsPage` əlavə OTP şablonu tələb etmədən işləsin).
- [x] **Avtomatik `.env.local` Yoxlayıcısı (`scripts/check-env.mjs`):** `npm run env:check` əmri heç bir açarı ekrana çap etmədən `.env.local` faylının düzgünlüyünü yoxlayır.
- [x] **Canlı Staging & RLS Yoxlayıcısı (`scripts/verify-staging.mjs`):** `npm run staging:verify` əmri canlı Staging URL-ni və 13 gizli cədvəl üzrə PostgREST `anon` RLS siyasətlərini avtomatik test edir.

> **Dürüstlük Qeydi:** Canlı `kodera-dev` Supabase layihəsi hələ qoşulmadığı üçün real PostgreSQL miqrasiya icrası, real Supabase Auth e-poçt göndərişi (təsdiq və şifrə bərpası), real PostgREST RLS sorğuları və Supabase Storage imzalı URL-lər yalnız siz `kodera-dev` layihəsini qoşduqdan sonra canlı təsdiqlənəcək.

### 1.4 Gizli Açarların (Secrets) Qorunması və `.env` Şablonları
- [x] **`.gitignore`:** `.env`, `.env.*`, `dist/`, `node_modules/`, `.vercel/`, `.supabase/`, `playwright-report/`, `test-results/` tam bloklanıb; yalnız `!.env.example` və `!.env.staging.example` şablonlarına icazə verilir.
- [x] **`.env.example` və `.env.staging.example`:** Yalnız təhlükəsiz placeholder dəyərlər saxlayır (`https://YOUR-DEV-PROJECT.supabase.co`, `https://YOUR-KODERA-DEV-REF.supabase.co`).
- [x] **Avtomatik Qoruma (`scripts/security-check.mjs`):** `src/`, `dist/`, `.env.example` və `.env.staging.example` daxilində `SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_*`, JWT tokenləri (`eyJhbGciOi...`), real `.supabase.co` domenləri, `dangerouslySetInnerHTML`, `eval()`, `innerHTML` və test parollarını (`AdminPass123!`, `StudentPass123!`) avtomatik yoxlayır → **0 pozuntu**.

### 1.5 SQL Miqrasiyaları, Seed Faylı və İlk Admin Skripti
Bütün SQL faylları UTF-8 (BOM-suz), balanslaşdırılmış dırnaqlar/`$$` blokları və Supabase CLI 14-rəqəmli adlandırma standartı (`YYYYMMDDHHmmss_*.sql`) üzrə doğrulanıb:
1. [20261123000001_extensions_enums_locales.sql](../supabase/migrations/20261123000001_extensions_enums_locales.sql) (99 sətir) — `pgcrypto`, 11 ENUM, `supported_locales` (`az`, `en`), `set_updated_at()`
2. [20261123000002_identity_roles_applications.sql](../supabase/migrations/20261123000002_identity_roles_applications.sql) (238 sətir) — `profiles`, `user_roles`, `applications` (`KDR-YYYY-XXXXXX`), `application_notes`, `handle_new_user()`
3. [20261123000003_courses_modules_lessons_content.sql](../supabase/migrations/20261123000003_courses_modules_lessons_content.sql) (271 sətir) — `courses`, `modules`, `lessons`, `exercises`, `exercise_solutions`, `exercise_test_cases`, `quizzes`, `quiz_questions`, `quiz_question_options`, `lesson_content_blocks`
4. [20261123000004_enrollments_progress_attempts.sql](../supabase/migrations/20261123000004_enrollments_progress_attempts.sql) (161 sətir) — `enrollments`, `lesson_progress`, `exercise_attempts`, `quiz_attempts`, `quiz_attempt_answers`
5. [20261123000005_settings_audit_ratelimit.sql](../supabase/migrations/20261123000005_settings_audit_ratelimit.sql) (141 sətir) — `platform_settings`, dəyişməz `audit_logs`, `rate_limit_events`, `check_and_record_rate_limit()`
6. [20261123000006_security_functions_rls_policies.sql](../supabase/migrations/20261123000006_security_functions_rls_policies.sql) (692 sətir) — RBAC funksiyaları, `get_public_platform_settings()`, `get_course_curriculum_outline()`, `submit_quiz_attempt()`, 23 cədvəl RLS və Storage bucket-ləri (`public-media`, `lesson-media`)
7. [20261123000007_audit_security_hardening_and_indexes.sql](../supabase/migrations/20261123000007_audit_security_hardening_and_indexes.sql) (680 sətir) — PostgREST v11+ `service_role` guard düzəlişi, `search_path = ''` kilidlənməsi, `review_application_atomic()`, `prevent_audit_log_truncate()`, `REVOKE ALL` minimal grant-lar və 14 yeni FK/sorğu indeksi
8. [20261123000008_official_academy_contact_and_admin_stats.sql](../supabase/migrations/20261123000008_official_academy_contact_and_admin_stats.sql) (249 sətir) — Rəsmi `Kodera Academy` əlaqə parametrləri (`994702045610`, `muhammed.ehmedov94@gmail.com`, `email_sender_name`, `website_domain`) və 12 göstəricili `get_admin_dashboard_stats()` RPC
- **Seed Faylı:** [01_python_intro_modules.sql](../supabase/seeds/01_python_intro_modules.sql) (562 sətir, 162/162 idempotent `ON CONFLICT DO NOTHING`, 83/83 etibarlı JSONB; bütün 7 Python məşq həlli real Python 3.12-də 100% testdən keçib)
- **İlk Admin Skripti:** [promote_first_admin.sql](../supabase/bootstrap/promote_first_admin.sql) (qoruyucu `ADMIN_EMAIL_HERE` yoxlaması + idempotent admin rolu + audit log qeydi)

### 1.6 Son İcra Olunmuş Test və Yoxlama Nəticələri
| Yoxlama Əmri | Nəticə | Detal |
| :--- | :---: | :--- |
| `npm run env:check` | **KEÇDİ (0)** | Lokal env yoxlayıcısı hazır və işləkdir |
| `npm run typecheck` | **KEÇDİ (0)** | `tsc -b --noEmit` — 0 TypeScript xətası |
| `npm run lint` | **KEÇDİ (0)** | `eslint .` — 0 xəta, 0 xəbərdarlıq |
| `npm run test` | **KEÇDİ (38/38)** | 9/9 test faylı, 38/38 unit, inteqrasiya, təhlükəsizlik və Python 3.12 testi |
| `npm run build` | **KEÇDİ (0)** | **0 xəta, 0 xəbərdarlıq** (`index` 386.12 kB / 112.97 kB gzip, CSS 43.79 kB / 8.25 kB gzip) |
| `npm run security:check` | **KEÇDİ (0)** | `src/`, `dist/` və `.env*.example` üzrə 0 təhlükəsizlik pozuntusu |
| `npm audit` | **KEÇDİ (0)** | `found 0 vulnerabilities` (298 paket) |
| `npm run test:e2e` | **KEÇDİ (4/4)** | Real Chrome Playwright: 4 tam istifadəçi səyahəti + 72 viewport yoxlaması (48.5s) |

---

## 2. Sizdən (Layihə Sahibindən) Tələb Olunan Növbəti Addımlar

Lokal hazırlıq 100% bitdiyi üçün növbəti mərhələdə sizin xarici hesablarınızla yalnız aşağıdakı addımlar icra ediləcək:

### Mərhələ 1 — Private GitHub Repository Yaradılması və Push
1. GitHub hesabınızda (`MuhammmedQU`) yeni **Private** repository yaradın (məs. `kodera-academy`, boş — README/gitignore seçmədən).
2. Lokal `main` və `staging` budaqlarını push edin:
   ```powershell
   git remote add origin https://github.com/MuhammmedQU/kodera-academy.git
   git push -u origin main
   git checkout -b staging
   git push -u origin staging
   git checkout main
   ```
3. GitHub → **Actions** bölməsində `Kodera CI — Quality & Security Gate` pipeline-ının yaşıl keçdiyini təsdiqləyin.

### Mərhələ 2 — `kodera-dev` Supabase Layihəsinin Qurulması
1. Supabase Dashboard-da **`kodera-dev`** layihəsini yaradın.
2. SQL Editor-da `supabase/migrations/20261123000001`–`000007` fayllarını ardıcıllıqla, ardınca `supabase/seeds/01_python_intro_modules.sql` faylını icra edin.
3. `.env.example` faylını lokalda `.env.local` kimi kopyalayıb `kodera-dev` URL və açarlarını (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_LOCAL_SANDBOX=false`, `KODERA_LOCAL_SANDBOX=false`) daxil edin və yoxlayın:
   ```powershell
   npm run env:check
   ```
4. İlk admin istifadəçinizi yaradıb SQL Editor-da `supabase/bootstrap/promote_first_admin.sql` skriptini öz emailinizlə icra edin.

### Mərhələ 3 — Vercel Preview (Staging) Deployment və Doğrulama
1. Vercel Dashboard-da private GitHub repo-nu import edin və `.env.staging.example` dəyişənlərini **yalnız `Preview`** mühitinə əlavə edin (Production-a deyil!).
2. `staging` budağının Preview URL-ini `kodera-dev` Supabase **Authentication → URL Configuration** (`Site URL` + `/login` və `/reset-password` Redirect URLs) bölməsinə əlavə edin.
3. Avtomatik Staging və canlı RLS testini işə salın:
   ```powershell
   $env:STAGING_URL="https://<staging-preview-url>.vercel.app"
   $env:STAGING_SUPABASE_URL="https://<kodera-dev-ref>.supabase.co"
   $env:STAGING_SUPABASE_ANON_KEY="<kodera-dev-anon-key>"
   npm run staging:verify
   ```
4. [STAGING_DEPLOYMENT_CHECKLIST.md](STAGING_DEPLOYMENT_CHECKLIST.md) Bölmə 4-dəki canlı e-poçt, Admin təsdiq/təyinat və brauzerdə Pyodide `v0.27.5` WASM testlərini tamamlayın.
