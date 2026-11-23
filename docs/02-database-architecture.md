# Kodera — Faza 2: Verilənlər Bazası Arxitekturası (`02-database-architecture.md`)

> **Status:** Faza 2 Dizayn Layihəsi (real Supabase layihəsində hələ icra olunmayıb)  
> **Verilənlər Bazası:** PostgreSQL (Supabase PostgreSQL + Supabase Auth + Supabase Storage)  
> **Akademiya:** Kodera (ilkin kurs: Python; çoxkurslu və çoxdilli genişlənməyə hazır)

---

## 1. Memarlıq Prinsipləri və Normallaşdırma Qərarları

Kodera platformasının verilənlər bazası minlərlə tələbə, onlarla kurs (Python, C++, SQL, JavaScript, Web, DSA, Data Science, ML, AI) və gələcək dillər üçün əsas sxemi yenidən yazmadan miqyaslanacaq şəkildə layihələndirilib.

### Əsas Dizayn Qərarları (Sadə İzahla)
1. **Kimlik, Rol, Müraciət və Kurs Girişinin Tam Ayrılması:**
   - `auth.users` — yalnız giriş və şifrə təhlükəsizliyi (Supabase Auth).
   - `profiles` — tələbənin/adminin əsas şəxsi məlumatları və hesab statusu (`account_status`).
   - `user_roles` — rol hüquqları (`student`, `admin`). Rollar qəsdən `profiles` cədvəlində saxlanılmır ki, heç bir istifadəçi profil yeniləməsi ilə özünə `admin` rolu verə bilməsin.
   - `applications` — qeydiyyat müraciətinin qəbul prosesi (`pending`, `approved`, `rejected`).
   - `enrollments` — hansı tələbənin hansı kursa girişi olduğu. **Müraciətin təsdiqi (`APPROVED`) avtomatik olaraq heç bir kursa giriş vermir** — kurs təyinatı ayrıca inzibati əməliyyatdır.
2. **Məxfi Məlumatların Ayrı Cədvəllərdə İzolyasiyası:**
   - Adminin müraciət haqqında daxili qeydləri `applications` cədvəlində deyil, ayrıca **`application_notes`** cədvəlində saxlanılır. Beləliklə, tələbə öz müraciət statusunu oxuyarkən admin qeydlərinin sızma riski sıfıra enir.
   - Məşqlərin hazır həll kodu (`solution_code`) ayrıca **`exercise_solutions`** cədvəlində saxlanılır və yalnız adminlər üçün açıqdır.
3. **Vahid Həqiqət Mənbəyi (*Single Source of Truth*) və Təkrarlanmanın Qarşısının Alınması:**
   - Şəxsi məlumatlar (`full_name`, `email`, `phone`, `learning_goals`) yalnız `profiles` cədvəlində saxlanılır, `applications` cədvəlində təkrarlanmır.
   - `courses`, `modules`, `lessons`, `exercises` və `quizzes` cədvəllərində `is_published` sütunu `GENERATED ALWAYS AS (status = 'published') STORED` kimi hesablanır. Beləliklə, bir obyektin eyni anda həm `archived`, həm də `is_published = true` olması riyazi olaraq mümkün deyil.
   - `lesson_progress` cədvəlində sürətli panel hesablamaları üçün saxlanılan `course_id` sütunu trigger (`sync_lesson_progress_course_id`) tərəfindən `lesson_id → modules.course_id` əsasında avtomatik təyin olunur və heç vaxt uyğunsuz hala düşə bilməz.
4. **Təhlükəsiz Arxivləmə Siyasəti (*Safe Archive over Hard Delete*):**
   - Kurslar, modullar və dərslər üzərində tələbə tarixçəsi varsa, təsadüfi silinmənin qarşısını almaq üçün əsas iyerarxiya xarici açarlarında `ON DELETE RESTRICT` tətbiq olunur; köhnə kontent silinmir, `status = 'archived'` və `archived_at` ilə arxivlənir.
5. **UUID Əsas Açarlar və Zaman Damğaları:**
   - Yüksək tezlikli daxili `rate_limit_events` cədvəli istisna olmaqla, bütün biznes cədvəlləri `uuid PRIMARY KEY DEFAULT gen_random_uuid()` istifadə edir (sıra nömrəsi təxmin etmə / *ID enumeration* riskini azaldır).
   - Bütün zaman sütunları `timestamptz` (UTC) tipindədir; `updated_at` sütunları `set_updated_at()` trigger-i ilə avtomatik yenilənir.

---

## 2. Xüsusi ENUM Tipləri

| ENUM Adı | Dəyərlər | İstifadə Məqsədi |
| :--- | :--- | :--- |
| `app_role` | `'student'`, `'admin'` | İstifadəçi rolları (gələcəkdə `'instructor'` əlavə edilə bilər) |
| `account_status` | `'pending'`, `'active'`, `'rejected'`, `'suspended'`, `'archived'` | İstifadəçi hesabının həyat dövrü |
| `application_status` | `'pending'`, `'approved'`, `'rejected'` | Qeydiyyat müraciətinin qərar statusu |
| `course_difficulty` | `'beginner'`, `'intermediate'`, `'advanced'` | Kurs çətinlik səviyyəsi |
| `content_status` | `'draft'`, `'published'`, `'archived'` | Kurs, modul, dərs, məşq və quiz-in dərc vəziyyəti |
| `content_block_type` | `'heading'`, `'paragraph'`, `'image'`, `'code'`, `'explanation'`, `'example'`, `'note'`, `'warning'`, `'exercise'`, `'quiz'`, `'summary'` | 11 strukturlaşdırılmış dərs kontent bloku növü |
| `exercise_execution_mode` | `'pyodide_worker'`, `'static_review'` | Məşqin icra rejimi (Python üçün brauzer Pyodide Worker; gələcək dillərə açıq) |
| `quiz_question_type` | `'single_choice'`, `'multiple_choice'`, `'true_false'` | Quiz sual tipləri |
| `enrollment_status` | `'active'`, `'revoked'`, `'completed'` | Tələbənin kurs təyinat statusu |
| `progress_status` | `'not_started'`, `'in_progress'`, `'completed'` | Dərs irəliləyiş statusu |
| `attempt_status` | `'passed'`, `'failed'`, `'error'`, `'timeout'` | Məşq icra cəhdinin nəticəsi |

---

## 3. Bütün Cədvəllərin Detallı Təsviri (23 Cədvəl)

### Domen A — Dil Dəstəyi, Kimlik, Rollar və Qeydiyyat Müraciətləri

#### 1) `supported_locales`
- **Məqsəd:** Platformanın və kurs məzmununun dəstəklədiyi dillərin rəsmi kataloqu (ilkin olaraq `'az'` aktiv, `'en'` gələcək genişlənmə üçün hazır).
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `code` | `text` | NOT NULL | `PRIMARY KEY`, `CHECK (code ~ '^[a-z]{2}(-[A-Z]{2})?$')` |
  | `name` | `text` | NOT NULL | `CHECK (char_length(btrim(name)) BETWEEN 2 AND 60)` |
  | `native_name` | `text` | NOT NULL | `CHECK (char_length(btrim(native_name)) BETWEEN 2 AND 60)` |
  | `is_default` | `boolean` | NOT NULL | `DEFAULT false` |
  | `is_active` | `boolean` | NOT NULL | `DEFAULT true` |
  | `created_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **İndekslər:** `uq_supported_locales_single_default` (`UNIQUE (is_default) WHERE is_default = true`) — yalnız 1 əsas dil ola bilər.
- **Əlaqələr:** `profiles.preferred_locale`, `courses.locale`, `lesson_content_blocks.locale`, `exercises.locale`, `quizzes.locale` tərəfindən istinad olunur.

#### 2) `profiles`
- **Məqsəd:** `auth.users` cədvəlindəki hər istifadəçi üçün tətbiq profili (1:1).
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `id` | `uuid` | NOT NULL | `PRIMARY KEY`, `FK -> auth.users(id) ON DELETE CASCADE` |
  | `email` | `text` | NOT NULL | `UNIQUE`, `CHECK (email = lower(btrim(email)) AND position('@' IN email) > 1)` |
  | `full_name` | `text` | NOT NULL | `CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120)` |
  | `phone` | `text` | NULL | `CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-()]{7,25}$')` |
  | `learning_goals` | `text` | NULL | `CHECK (learning_goals IS NULL OR char_length(learning_goals) <= 1000)` |
  | `avatar_url` | `text` | NULL | `CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500)` |
  | `preferred_locale` | `text` | NOT NULL | `DEFAULT 'az'`, `FK -> supported_locales(code)` |
  | `account_status` | `account_status` | NOT NULL | `DEFAULT 'pending'` |
  | `archived_at` | `timestamptz` | NULL | `CHECK ((account_status = 'archived' AND archived_at IS NOT NULL) OR (account_status <> 'archived' AND archived_at IS NULL))` |
  | `created_at` / `updated_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **İndekslər:** `idx_profiles_account_status (account_status)`, `idx_profiles_created_at (created_at DESC)`.
- **Müdafiə:** `trg_profiles_guard_sensitive` trigger-i və sütun səviyyəli `REVOKE/GRANT` tələbənin `account_status`, `email` və `archived_at` sütunlarını dəyişməsini tam bloklayır.

#### 3) `user_roles`
- **Məqsəd:** Tələbə və admin rollarının təhlükəsiz, audit edilə bilən RBAC cədvəli.
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `id` | `uuid` | NOT NULL | `PRIMARY KEY DEFAULT gen_random_uuid()` |
  | `user_id` | `uuid` | NOT NULL | `FK -> profiles(id) ON DELETE CASCADE` |
  | `role` | `app_role` | NOT NULL | `'student'` və ya `'admin'` |
  | `granted_by` | `uuid` | NULL | `FK -> profiles(id) ON DELETE SET NULL` |
  | `granted_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
  | `revoked_by` | `uuid` | NULL | `FK -> profiles(id) ON DELETE SET NULL` |
  | `revoked_at` | `timestamptz` | NULL | `CHECK ((revoked_at IS NULL AND revoked_by IS NULL) OR revoked_at IS NOT NULL)` |
  | `created_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **İndekslər:** `uq_user_roles_active_role` (`UNIQUE (user_id, role) WHERE revoked_at IS NULL`), `idx_user_roles_role_active (role) WHERE revoked_at IS NULL`.
- **Əlaqələr:** `profiles (1) -> (1..N) user_roles`.

#### 4) `applications`
- **Məqsəd:** Qeydiyyat müraciətinin statusunu (`pending`, `approved`, `rejected`) və təhlükəsiz referans nömrəsini saxlayır.
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `id` | `uuid` | NOT NULL | `PRIMARY KEY DEFAULT gen_random_uuid()` |
  | `user_id` | `uuid` | NOT NULL | `FK -> profiles(id) ON DELETE CASCADE` |
  | `reference_code` | `text` | NOT NULL | `UNIQUE`, `DEFAULT generate_application_reference_code()`, `CHECK (reference_code ~ '^KDR-[0-9]{4}-[2-9A-HJ-NP-Z]{6}$')` |
  | `status` | `application_status` | NOT NULL | `DEFAULT 'pending'` |
  | `submitted_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
  | `reviewed_by` | `uuid` | NULL | `FK -> profiles(id) ON DELETE SET NULL` |
  | `reviewed_at` | `timestamptz` | NULL | Statusla uzlaşma `CHECK` (`pending` → NULL; `approved`/`rejected` → NOT NULL) |
  | `rejection_reason` | `text` | NULL | Yalnız `rejected` olduqda doldurula bilər (maks. 500 simvol) |
  | `created_at` / `updated_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **İndekslər:** `uq_applications_one_active_per_user` (`UNIQUE (user_id) WHERE status IN ('pending', 'approved')`), `idx_applications_status_submitted (status, submitted_at DESC)`, `idx_applications_user_id (user_id)`.
- **Niyə `KDR-2026-X7M9Q2` formatı?** Ardıcıl nömrə (`000001`, `000002`) əvəzinə kriptoqrafik təsadüfi simvollar istifadə olunur ki, başqaları referans nömrəsini təxmin edə bilməsin və ümumi tələbə sayı kənardan hesablanmasın.

#### 5) `application_notes`
- **Məqsəd:** Müraciətlər üzrə yalnız adminlərin görə biləcəyi daxili qeydlər (*internal notes*).
- **Sütunlar:** `id` (PK), `application_id` (FK → `applications(id) ON DELETE CASCADE`, NOT NULL), `author_id` (FK → `profiles(id) ON DELETE SET NULL`, NULL), `note` (`text` NOT NULL, 1–2000 simvol), `created_at` (`timestamptz` NOT NULL).
- **İndekslər:** `idx_application_notes_application_id (application_id, created_at DESC)`.

---

### Domen B — Kurslar, Modullar, Dərslər və 11 Kontent Bloku

#### 6) `courses`
- **Məqsəd:** Çoxkurslu kataloq (Python ilk kursdur; C++, SQL, JS, Web, DSA, Data Science, ML, AI kod dəyişmədən əlavə olunur).
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `id` | `uuid` | NOT NULL | `PRIMARY KEY DEFAULT gen_random_uuid()` |
  | `slug` | `text` | NOT NULL | `UNIQUE`, `CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')` |
  | `locale` | `text` | NOT NULL | `DEFAULT 'az'`, `FK -> supported_locales(code)` |
  | `title` | `text` | NOT NULL | 2–160 simvol |
  | `subtitle` | `text` | NULL | Maks. 280 simvol |
  | `description` | `text` | NOT NULL | Min. 10 simvol |
  | `learning_objectives` | `jsonb` | NOT NULL | `DEFAULT '[]'`, `CHECK (jsonb_typeof(...) = 'array')` |
  | `target_audience` | `text` | NULL | Maks. 1000 simvol |
  | `programming_language` | `text` | NOT NULL | `DEFAULT 'python'` |
  | `difficulty` | `course_difficulty` | NOT NULL | `DEFAULT 'beginner'` |
  | `estimated_duration_minutes` | `integer` | NOT NULL | `DEFAULT 0`, `>= 0` |
  | `cover_image_path` | `text` | NULL | Supabase Storage yolu |
  | `sort_order` | `integer` | NOT NULL | `DEFAULT 0`, `>= 0` |
  | `status` | `content_status` | NOT NULL | `DEFAULT 'draft'` |
  | `is_published` | `boolean` | NOT NULL | `GENERATED ALWAYS AS (status = 'published') STORED` |
  | `published_at` / `archived_at` | `timestamptz` | NULL | `archived` statusu ilə uyğunluq `CHECK` |
  | `created_by` / `updated_by` | `uuid` | NULL | `FK -> profiles(id) ON DELETE SET NULL` |
  | `created_at` / `updated_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **İndekslər:** `idx_courses_published_sort (sort_order ASC, created_at DESC) WHERE is_published = true`, `idx_courses_locale_status (locale, status)`.

#### 7) `modules`
- **Məqsəd:** Kurs daxilindəki modullar və **verilənlər bazasından idarə olunan ictimai/məhdud giriş nəzarəti**.
- **Sütunlar:** `id` (PK), `course_id` (FK → `courses(id) ON DELETE RESTRICT`, NOT NULL), `slug` (NOT NULL, URL-safe), `title` (NOT NULL, 2–160 simvol), `description` (NULL, maks. 1000 simvol), `sort_order` (`integer` NOT NULL `>= 0`), **`is_public`** (`boolean` NOT NULL `DEFAULT false`), `status` (`content_status` NOT NULL `DEFAULT 'draft'`), **`is_published`** (`GENERATED ALWAYS AS (status = 'published') STORED`), `archived_at` (NULL), `created_by`/`updated_by` (FK → `profiles`), `created_at`/`updated_at`.
- **Məhdudiyyətlər və İndekslər:** `UNIQUE (course_id, slug)`, `uq_modules_active_sort_order` (`UNIQUE (course_id, sort_order) WHERE status <> 'archived'`), `idx_modules_course_public_published (course_id, sort_order ASC) WHERE is_published = true`.

#### 8) `lessons`
- **Məqsəd:** Modul daxilindəki fərdi dərslər.
- **Sütunlar:** `id` (PK), `module_id` (FK → `modules(id) ON DELETE RESTRICT`, NOT NULL), `slug` (NOT NULL), `title` (NOT NULL, 2–180 simvol), `summary` (NULL, maks. 1000 simvol), `estimated_minutes` (`integer` NOT NULL `DEFAULT 10`, `1..300`), `sort_order` (`integer` NOT NULL `>= 0`), `status` (`content_status` NOT NULL `DEFAULT 'draft'`), `is_published` (`GENERATED ALWAYS AS (status = 'published') STORED`), `published_at`/`archived_at`, `created_by`/`updated_by`, `created_at`/`updated_at`.
- **Məhdudiyyətlər və İndekslər:** `UNIQUE (module_id, slug)`, `uq_lessons_active_sort_order` (`UNIQUE (module_id, sort_order) WHERE status <> 'archived'`), `idx_lessons_module_published_sort (module_id, sort_order ASC) WHERE is_published = true`.

#### 9) `lesson_content_blocks`
- **Məqsəd:** Hər dərsin daxilindəki sıralı, strukturlaşdırılmış 11 növ kontent bloku.
- **Sütunlar:**
  | Sütun | Tip | NULL | Məhdudiyyətlər |
  | :--- | :--- | :---: | :--- |
  | `id` | `uuid` | NOT NULL | `PRIMARY KEY DEFAULT gen_random_uuid()` |
  | `lesson_id` | `uuid` | NOT NULL | `FK -> lessons(id) ON DELETE CASCADE` |
  | `locale` | `text` | NOT NULL | `DEFAULT 'az'`, `FK -> supported_locales(code)` |
  | `block_type` | `content_block_type` | NOT NULL | 11 dəyərdən biri |
  | `sort_order` | `integer` | NOT NULL | `>= 0`; `UNIQUE (lesson_id, locale, sort_order) DEFERRABLE INITIALLY DEFERRED` |
  | `title` | `text` | NULL | Blok başlığı (maks. 180 simvol) |
  | `content` | `jsonb` | NOT NULL | `DEFAULT '{}'`, `CHECK (jsonb_typeof(content) = 'object')` |
  | `exercise_id` | `uuid` | NULL | `FK -> exercises(id) ON DELETE RESTRICT` |
  | `quiz_id` | `uuid` | NULL | `FK -> quizzes(id) ON DELETE RESTRICT` |
  | `is_published` | `boolean` | NOT NULL | `DEFAULT true` |
  | `created_at` / `updated_at` | `timestamptz` | NOT NULL | `DEFAULT now()` |
- **Referensial Bütövlük `CHECK`:**
  - `block_type = 'exercise'` → `exercise_id IS NOT NULL` və `quiz_id IS NULL`
  - `block_type = 'quiz'` → `quiz_id IS NOT NULL` və `exercise_id IS NULL`
  - Digər 9 blok növü → `exercise_id IS NULL` və `quiz_id IS NULL`
- **İndekslər:** `idx_lesson_blocks_lesson_locale_sort (lesson_id, locale, sort_order ASC) WHERE is_published = true`.

---

### Domen C — Məşqlər (Exercises) və Quiz-lər

#### 10) `exercises`
- **Məqsəd:** Dərsə bağlı interaktiv proqramlaşdırma tapşırıqları (Faza 7-də Pyodide Web Worker ilə icra olunacaq).
- **Sütunlar:** `id` (PK), `lesson_id` (FK → `lessons(id) ON DELETE CASCADE`), `locale` (FK → `supported_locales`), `title` (NOT NULL), `instructions` (NOT NULL), `programming_language` (`DEFAULT 'python'`), `starter_code` (`DEFAULT ''`), `hints` (`jsonb` array), `execution_mode` (`exercise_execution_mode`, `DEFAULT 'pyodide_worker'`), `time_limit_ms` (`integer`, `500..15000`, `DEFAULT 3000`), `max_output_chars` (`256..50000`, `DEFAULT 10000`), `sort_order`, `status`, `is_published` (generated), `created_at`, `updated_at`.
- **İndekslər:** `idx_exercises_lesson_locale (lesson_id, locale, sort_order ASC)`.

#### 11) `exercise_solutions`
- **Məqsəd:** Məşqin rəsmi nümunə həlli — yalnız adminlərə açıqdır (tələbə cəhd etmədən hazır cavabı bazadan çəkə bilməz).
- **Sütunlar:** `exercise_id` (PK & FK → `exercises(id) ON DELETE CASCADE`), `solution_code` (NOT NULL), `explanation` (NULL), `updated_by` (FK → `profiles`), `updated_at`.

#### 12) `exercise_test_cases`
- **Məqsəd:** Məşq kodunu yoxlayan avtomatik test halları.
- **Sütunlar:** `id` (PK), `exercise_id` (FK → `exercises(id) ON DELETE CASCADE`), `label` (NOT NULL), `stdin_input` (`DEFAULT ''`), `expected_stdout` (NULL), `assertion_code` (NULL), `is_hidden` (`boolean DEFAULT false`), `sort_order`, `created_at`.
- **Məhdudiyyət:** `CHECK (expected_stdout IS NOT NULL OR assertion_code IS NOT NULL)`.
- **İndeks:** `idx_exercise_test_cases_exercise_sort (exercise_id, sort_order ASC)`.

#### 13) `quizzes`
- **Məqsəd:** Dərs daxilində bilik yoxlama testləri.
- **Sütunlar:** `id` (PK), `lesson_id` (FK → `lessons(id) ON DELETE CASCADE`), `locale` (FK → `supported_locales`), `title` (NOT NULL), `description` (NULL), `passing_score_percent` (`0..100`, `DEFAULT 70`), `max_attempts` (NULL = limitsiz və ya `> 0`), `status`, `is_published` (generated), `created_at`, `updated_at`.
- **İndeks:** `idx_quizzes_lesson_locale (lesson_id, locale)`.

#### 14) `quiz_questions`
- **Məqsəd:** Quiz-ə aid fərdi suallar.
- **Sütunlar:** `id` (PK), `quiz_id` (FK → `quizzes(id) ON DELETE CASCADE`), `question_type` (`single_choice` / `multiple_choice` / `true_false`), `prompt` (NOT NULL), `code_snippet` (NULL), `code_language` (NULL), `explanation` (NULL — *cavab verildikdən sonra server tərəfindən qaytarılır, birbaşa tələbə sorğusuna bağlıdır*), `points` (`> 0`, `DEFAULT 1`), `sort_order`, `created_at`, `updated_at`.
- **İndeks:** `idx_quiz_questions_quiz_sort (quiz_id, sort_order ASC)`.

#### 15) `quiz_question_options`
- **Məqsəd:** Hər sualın cavab variantları.
- **Sütunlar:** `id` (PK), `question_id` (FK → `quiz_questions(id) ON DELETE CASCADE`), `option_text` (NOT NULL), `is_correct` (`boolean DEFAULT false` — **sütun səviyyəsində tələbədən gizlədilib**), `sort_order`, `created_at`.
- **İndeks:** `idx_quiz_question_options_question_sort (question_id, sort_order ASC)`.

---

### Domen D — Kurs Təyinatları, İrəliləyiş və Tələbə Cavabları

#### 16) `enrollments`
- **Məqsəd:** Admin tərəfindən tələbəyə fərdi kurs təyinatları (təsdiqdən tam ayrı).
- **Sütunlar:** `id` (PK), `student_id` (FK → `profiles(id) ON DELETE CASCADE`), `course_id` (FK → `courses(id) ON DELETE RESTRICT`), `status` (`active` / `revoked` / `completed`), `assigned_by` (FK → `profiles`), `assigned_at`, `revoked_by` (FK → `profiles`), `revoked_at`, `revoke_reason`, `completed_at`, `created_at`, `updated_at`.
- **Məhdudiyyətlər:** `UNIQUE (student_id, course_id)`, status-zaman uyğunluğu `CHECK`.
- **İndekslər:** `idx_enrollments_student_active (student_id, status)`, `idx_enrollments_course_active (course_id, status)`.

#### 17) `lesson_progress`
- **Məqsəd:** Tələbənin fərqli kurslar və dərslər üzrə tamamlama statusu.
- **Sütunlar:** `id` (PK), `student_id` (FK → `profiles(id) ON DELETE CASCADE`), `course_id` (FK → `courses(id) ON DELETE RESTRICT`, trigger ilə avtomatik doldurulur), `lesson_id` (FK → `lessons(id) ON DELETE CASCADE`), `status` (`not_started` / `in_progress` / `completed`), `started_at`, `completed_at`, `last_accessed_at`, `created_at`, `updated_at`.
- **Məhdudiyyətlər:** `UNIQUE (student_id, lesson_id)`, `completed` statusu zamanı `completed_at NOT NULL`.
- **İndekslər:** `idx_lesson_progress_student_course_status (student_id, course_id, status)`, `idx_lesson_progress_student_last_accessed (student_id, last_accessed_at DESC)`.

#### 18) `exercise_attempts`
- **Məqsəd:** Tələbənin məşq üzrə göndərdiyi kod cəhdlərinin tarixçəsi (yalnız əlavə olunan — redaktə/silmə qadağandır).
- **Sütunlar:** `id` (PK), `student_id` (FK → `profiles`), `exercise_id` (FK → `exercises`), `submitted_code` (maks. 50 000 simvol), `status` (`passed` / `failed` / `error` / `timeout`), `passed_tests`, `total_tests` (`passed_tests <= total_tests`), `stdout`, `stderr`, `execution_time_ms`, `test_results` (`jsonb` array), `created_at`.
- **İndekslər:** `idx_exercise_attempts_student_exercise (student_id, exercise_id, created_at DESC)`, `idx_exercise_attempts_exercise_status (exercise_id, status)`.

#### 19) `quiz_attempts`
- **Məqsəd:** Tələbənin quiz cəhdləri və server tərəfindən hesablanmış yekun balı.
- **Sütunlar:** `id` (PK), `student_id` (FK → `profiles`), `quiz_id` (FK → `quizzes`), `attempt_number` (`> 0`), `earned_points`, `total_points` (`earned_points <= total_points`), `score_percent` (`numeric(5,2)`, `0..100`), `is_passed` (`boolean`), `submitted_at`, `created_at`.
- **Məhdudiyyət:** `UNIQUE (student_id, quiz_id, attempt_number)`.
- **İndeks:** `idx_quiz_attempts_student_quiz (student_id, quiz_id, submitted_at DESC)`.

#### 20) `quiz_attempt_answers`
- **Məqsəd:** Hər quiz cəhdi daxilində tələbənin sual-sual seçdiyi cavablar.
- **Sütunlar:** `id` (PK), `attempt_id` (FK → `quiz_attempts(id) ON DELETE CASCADE`), `question_id` (FK → `quiz_questions(id) ON DELETE CASCADE`), `selected_option_ids` (`uuid[]` — həm təkseçimli, həm çoxseçimli sualları dəstəkləyir), `is_correct`, `points_awarded`, `created_at`.
- **Məhdudiyyət:** `UNIQUE (attempt_id, question_id)`.
- **İndeks:** `idx_quiz_attempt_answers_attempt_id (attempt_id)`.

---

### Domen E — Platforma & WhatsApp Tənzimləmələri, Audit Log və Rate Limiting

#### 21) `platform_settings`
- **Məqsəd:** Akademiya və WhatsApp parametrləri üçün təksətirli (*singleton*) konfiqurasiya cədvəli.
- **Sütunlar:** `id` (`boolean PRIMARY KEY DEFAULT true CHECK (id = true)` — cədvəldə yalnız 1 sətir olmasını zəmanət edir), `academy_name` (`DEFAULT 'Kodera'`), `academy_tagline`, `logo_storage_path`, `contact_email`, `whatsapp_phone` (yalnız E.164 rəqəmləri, məs. `994501234567`), `whatsapp_button_enabled` (`DEFAULT false`), `whatsapp_button_label` (`DEFAULT 'WhatsApp ilə administratora yaz'`), `whatsapp_message_template` (placeholder-larla: `{{full_name}}`, `{{email}}`, `{{reference_code}}`), `alternative_contact_text`, `registration_enabled` (`DEFAULT true`), `default_public_modules_count` (`DEFAULT 2`), `updated_by` (FK → `profiles`), `created_at`, `updated_at`.
- **İctimai oxuma:** Birbaşa cədvəl oxunması yalnız adminlər üçündür; ictimai sayt `get_public_platform_settings()` RPC-sini çağırır və `whatsapp_button_enabled = false` olduqda telefon nömrəsi `NULL` qaytarılır.

#### 22) `audit_logs`
- **Məqsəd:** Bütün kritik inzibati və təhlükəsizlik əməliyyatlarının **dəyişdirilməz (immutable)** jurnalı.
- **Sütunlar:** `id` (PK), `actor_id` (FK → `profiles(id) ON DELETE SET NULL`), `actor_role` (`'admin'` / `'system'`), `action` (`'entity.verb'` formatı, məs. `'application.approved'`, `'enrollment.assigned'`, `'module.visibility_changed'`), `entity_type`, `entity_id` (NULL ola bilər), `metadata` (`jsonb` — şifrə/token saxlanılmır), `ip_address` (`inet`), `user_agent`, `created_at`.
- **İndekslər:** `(created_at DESC)`, `(entity_type, entity_id, created_at DESC)`, `(actor_id, created_at DESC)`, `(action, created_at DESC)`.
- **Dəyişməzlik:** `trg_audit_logs_immutable` trigger-i istənilən `UPDATE` və `DELETE` cəhdini PostgreSQL səviyyəsində rədd edir.

#### 23) `rate_limit_events`
- **Məqsəd:** Vercel-in *serverless* arxitekturasında əlavə Redis serverinə ehtiyac olmadan qeydiyyat, şifrə bərpası və kritik endpoint-ləri spam-dan qorumaq.
- **Sütunlar:** `id` (`bigint IDENTITY PK`), `bucket_key` (məs. `'register:ip:...'`), `action`, `created_at`.
- **İndekslər:** `idx_rate_limit_lookup (bucket_key, action, created_at DESC)`, `idx_rate_limit_created_at (created_at ASC)`.
- **Giriş:** Yalnız `service_role` tərəfindən `check_and_record_rate_limit(...)` atomik funksiyası ilə idarə olunur.

---

## 4. İctimai və Məhdud Kontent Modeli (Hardcode Olmadan)

İlk iki Python modulunun pulsuz olması **heç bir frontend komponentində sabitlənmir**. Bütün qayda verilənlər bazasından idarə olunur:

1. **Dörd sütunlu idarəetmə:** `modules.is_public`, `courses/modules/lessons.status` (`draft`/`published`/`archived`), `is_published` (avtomatik hesablanan), `sort_order`.
2. **Miras qaydası (*Strict Inheritance*):** Bir dərs ictimai ziyarətçiyə yalnız **dörd şərtin hamısı eyni anda ödənildikdə** açılır:
   - `course.is_published = true`
   - `module.is_published = true`
   - `module.is_public = true`
   - `lesson.is_published = true`
3. **Admin çevikliyi:** Admin gələcəkdə istənilən kursda (məsələn, SQL və ya C++) istənilən modulu bir kliklə `is_public = true` və ya `false` edə bilər; dəyişiklik anında RLS səviyyəsində qüvvəyə minir və `audit_logs`-a yazılır.
4. **Kurs kurikulumu önizləməsi:** `/courses/:slug` səhifəsində ziyarətçiyə kilidli modulların yalnız başlıqları və "Qeydiyyat tələb olunur" nişanı `get_course_curriculum_outline(p_course_slug)` təhlükəsiz RPC-si vasitəsilə göstərilir — məhdud dərslərin heç bir mətni, bloku, məşqi və ya quiz-i ötürülmür.

---

## 5. 11 Kontent Blokunun JSONB Strukturu (`lesson_content_blocks`)

Hər blok `block_type` dəyərinə uyğun aydın `content` JSONB sxeminə malikdir (backend-də Zod ilə yoxlanılır):

| # | `block_type` | `content` JSONB Nümunəsi | Xüsusi FK |
| :-: | :--- | :--- | :--- |
| 1 | `heading` | `{"level": 2, "text": "Dəyişənlər nədir?"}` | — |
| 2 | `paragraph` | `{"text": "Proqramlaşdırmada məlumatı saxlamaq üçün...", "format": "markdown"}` | — |
| 3 | `image` | `{"bucket": "public-media", "storage_path": "python/m1/box.webp", "alt": "Qutu analogiyası", "caption": "Dəyişən etiketli qutu kimidir"}` | — |
| 4 | `code` | `{"language": "python", "filename": "salam.py", "code": "ad = 'Aysel'\nprint('Salam,', ad)", "expected_output": "Salam, Aysel", "highlight_lines": [1]}` | — |
| 5 | `explanation` | `{"text": "Bu kod iki addımda işləyir:", "steps": [{"line": 1, "note": "'Aysel' mətni ad adlı dəyişənə yazılır"}, {"line": 2, "note": "print() ekrana nəticəni çıxarır"}]}` | — |
| 6 | `example` | `{"scenario": "Gündəlik alış-veriş hesabı", "language": "python", "code": "qiymet = 5\nsay = 3\ncem = qiymet * say\nprint(cem)", "walkthrough": "Qiyməti saya vurub cəmi tapırıq."}` | — |
| 7 | `note` | `{"emphasis": "tip", "text": "Dəyişən adlarını mənalı seçmək kodun oxunmasını asanlaşdırır."}` | — |
| 8 | `warning` | `{"text": "Dəyişən adı rəqəmlə başlaya bilməz.", "common_mistake": "1ci_ad = 'Ali' -> SyntaxError"}` | — |
| 9 | `exercise` | `{"display_mode": "inline"}` | `exercise_id` (NOT NULL) |
| 10 | `quiz` | `{"display_mode": "inline"}` | `quiz_id` (NOT NULL) |
| 11 | `summary` | `{"key_takeaways": ["Dəyişən məlumat saxlayır", "print() nəticəni göstərir"], "next_step_hint": "Növbəti dərsdə istifadəçidən məlumat almağı öyrənəcəyik."}` | — |

Bu struktur ilk iki Python modulunun sadə, addım-addım və interaktiv məzmununu heç bir kod dəyişikliyi olmadan Admin Paneldən yaratmağa və sonradan C++, SQL, JS kursları üçün eyni şəkildə tətbiq etməyə imkan verir.

---

## 6. Çoxdilli Genişlənmə (`locale`) və Supabase Storage Strategiyası

### Çoxdilli Kontent Hazırlığı
- Bütün kurslar (`courses.locale`), kontent blokları (`lesson_content_blocks.locale`), məşqlər (`exercises.locale`), quiz-lər (`quizzes.locale`) və istifadəçi seçimləri (`profiles.preferred_locale`) `supported_locales(code)` cədvəlinə bağlıdır (ilkin dəyər: `'az'`).
- Gələcəkdə eyni kursun həm Azərbaycan, həm də İngilis versiyası tələb olunduqda, mövcud bloklar artıq `(lesson_id, locale, sort_order)` açarı ilə çoxdilli işləyir; başlıq/təsvir tərcümələri üçün əlavə `course_translations` / `module_translations` / `lesson_translations` cədvəlləri mövcud sxemi pozmadan əlavə edilə bilər.

### Supabase Storage Bucket Arxitekturası
1. **`public-media` (Public bucket):** Akademiya loqosu, kurs örtük şəkilləri və ictimai modulların şəkilləri. Yalnız `image/jpeg`, `image/png`, `image/webp`, `image/avif` növlərinə icazə verilir (maks. 5 MB).
2. **`lesson-media` (Private bucket):** Məhdud dərslərin diaqramları və şəkilləri. Birbaşa açıq URL-i yoxdur — server tərəfində tələbənin `can_access_lesson()` hüququ yoxlanıldıqdan sonra qısamüddətli imzalanmış URL (*Signed URL*) verilir.

---

## 7. Minlərlə Tələbə üçün Miqyaslanma Qeydləri

- **Sorğu performansı:** Bütün əsas filtr və join sütunları (`student_id`, `course_id`, `module_id`, `lesson_id`, `status`, `created_at`) mürəkkəb və qismən (*partial*) indekslərlə örtülüb.
- **Səhifələmə (Pagination):** Admin cədvəlləri (tələbələr, müraciətlər, audit loglar) limitsiz sorğu yerinə `LIMIT/OFFSET` və ya `created_at` əsaslı kursor səhifələməsi ilə oxunacaq.
- **Təhlükəsiz serverless əlaqə:** Vercel Functions Supabase HTTP/PostgREST və ya Supabase Connection Pooler (Supavisor) üzərindən işləyərək qoşulma limitinin dolmasının qarşısını alır.
