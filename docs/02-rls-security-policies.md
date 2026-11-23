# Kodera — Faza 2: Autentifikasiya, Avtorizasiya və RLS Təhlükəsizlik Siyasətləri (`02-rls-security-policies.md`)

> **Status:** Faza 2 Dizayn Layihəsi  
> **Əlaqəli SQL Faylı:** [202611230006_security_functions_rls_policies.sql](file:///c:/Users/LENOVO/Desktop/Py_Course/supabase/migrations/202611230006_security_functions_rls_policies.sql)  
> **Əsas Prinsip:** *Zero Trust + Defense-in-Depth* — Frontend marşrut qoruması yalnız istifadəçi rahatlığı (UX) üçündür; əsl təhlükəsizlik **PostgreSQL RLS + Sütun Məhdudiyyətləri + Trigger-lər + Server-side Vercel Functions** səviyyəsində təmin olunur.

---

## 1. Autentifikasiya və Avtorizasiya Modeli (Supabase Auth + RBAC)

### Rollar
- **`student`:** Yeni qeydiyyatdan keçən hər bir istifadəçiyə verilən standart rol.
- **`admin`:** Yalnız server tərəfindən (`service_role` və ya ilkin DB bootstrap proseduru ilə) təyin olunan inzibati rol.

### Qeydiyyat, Təsdiq və Kurs Təyinatının 7 Addımlıq Təhlükəsiz Axını

1. **Qeydiyyat sorğusu (`POST /api/auth/register`):**
   - Server əvvəlcə IP və email əsasında `check_and_record_rate_limit(...)` ilə spam yoxlaması aparır.
   - Bütün sahələr (`full_name`, `email`, `password`, istəyə bağlı `phone`, `learning_goals`) serverdə **Zod** ilə yoxlanılır.
   - `platform_settings.registration_enabled = true` olduğu təsdiqlənir.
   - Supabase Auth üzərindən yeni istifadəçi yaradılır və təsdiq emaili göndərilir.
2. **Atomik DB Trigger (`on_auth_user_created -> handle_new_user()`):**
   - İstifadəçi `auth.users`-a düşdüyü anda PostgreSQL avtomatik olaraq yaradır:
     - `profiles` (`account_status = 'pending'`)
     - `user_roles` (`role = 'student'`)
     - `applications` (`status = 'pending'`, server tərəfindən yaradılmış `KDR-YYYY-XXXXXX` referans kodu)
   - **Kritik təhlükəsizlik qaydası:** Trigger müştəridən (`raw_user_meta_data`) gələn heç bir `role`, `is_admin`, `status` və ya `approved` dəyərini **oxumur və qəbul etmir**. Hücumçu birbaşa Supabase `anon` açarı ilə API çağırışı etsə belə, yalnız `student` + `pending` ala bilər.
3. **Gözləmə Mərhələsi (`PENDING`):**
   - İstifadəçi `/application-status` səhifəsində yalnız **öz** müraciət statusunu və referans kodunu görür.
   - Admin tərəfindən WhatsApp nömrəsi aktiv edilibsə, **"WhatsApp ilə administratora yaz"** düyməsi görünür (`https://wa.me/...`). WhatsApp keçidinin açılması **heç bir halda** müraciəti avtomatik təsdiqləmir.
4. **Admin Nəzərdən Keçirməsi (`POST /api/admin/applications/:id/review`):**
   - Server JWT-ni doğrulayır, DB-də `user_roles` (`role = 'admin'`, `revoked_at IS NULL`) və `profiles.account_status = 'active'` yoxlamasını edir.
   - Admin `APPROVED` və ya `REJECTED` qərarı verir; istəyə bağlı olaraq ayrıca `application_notes` cədvəlinə daxili qeyd yazır.
   - `APPROVED` seçildikdə `applications.status = 'approved'` və `profiles.account_status = 'active'` olur; `REJECTED` seçildikdə `applications.status = 'rejected'` və `profiles.account_status = 'rejected'` olur.
   - Hər qərar `audit_logs` cədvəlinə yazılır.
5. **Kurs Təyinatı — Tam Ayrı Əməliyyat (`POST /api/admin/enrollments`):**
   - Təsdiq edilmiş tələbənin başlanğıcda **0 kursa girişi** var.
   - Admin ayrıca əməliyyatla tələbəyə 1 və ya bir neçə kursu (`enrollments.status = 'active'`) təyin edir və ya sonradan ləğv edir (`status = 'revoked'`).
   - Hər təyinat və ləğv `audit_logs`-a yazılır.
6. **Tələbə Girişi (`/dashboard`):**
   - Tələbə yalnız `account_status = 'active'` + `enrollments.status IN ('active', 'completed')` şərtini ödəyən kursların məhdud modullarına, dərslərinə, məşqlərinə və quiz-lərinə daxil ola bilir.
7. **İlk Admin Hesabının Yaradılması (*Bootstrap*):**
   - İlk admin hesabı heç vaxt ictimai qeydiyyat endpoint-i ilə deyil, Supabase Dashboard / idarə olunan bir dəfəlik SQL əmri ilə yaradılır (`user_roles` → `'admin'`, `profiles.account_status = 'active'`).

---

## 2. Köməkçi Təhlükəsizlik Funksiyaları (`SECURITY DEFINER`)

RLS siyasətlərində sonsuz rekursiya (*infinite recursion*) və `search_path` hücumlarının qarşısını almaq üçün bütün icazə yoxlamaları `SET search_path = ''` ilə mərkəzləşdirilmiş funksiyalarda toplanıb:

| Funksiya | Nəyi Yoxlayır? |
| :--- | :--- |
| `public.is_admin()` | `auth.uid()` üçün aktiv (`revoked_at IS NULL`) `'admin'` rolu **VƏ** `profiles.account_status = 'active'` varmı? (Dondurulmuş admin dərhal səlahiyyətini itirir.) |
| `public.is_active_student()` | `auth.uid()` üçün `profiles.account_status = 'active'` **VƏ** aktiv `'student'` rolu varmı? (`pending`, `rejected`, `suspended`, `archived` hamısı `false` verir.) |
| `public.is_enrolled_in_course(course_id)` | `is_active_student()` doğrudurmu **VƏ** `enrollments` cədvəlində həmin kurs üçün `status IN ('active', 'completed')` qeydi varmı? |
| `public.can_access_module(module_id)` | `is_admin()` **VƏ YA** (`course.is_published` + `module.is_published` + (`module.is_public = true` **VƏ YA** `is_enrolled_in_course(module.course_id)`)) |
| `public.can_access_lesson(lesson_id)` | `is_admin()` **VƏ YA** (`lesson.is_published` + `can_access_module(lesson.module_id)`) |
| `public.can_write_learning_for_lesson(lesson_id)` | Dərs/modul/kurs dərc olunubmu **VƏ** istifadəçi bu kursa aktiv təyin olunmuş (`is_enrolled_in_course`) tələbədirmi? |

> **Vacib Aydınlaşdırma (İctimai vs. Məhdud Kontent):**
> - **İctimai giriş modulları** (`is_public = true` + `is_published = true` + kurs `is_published = true`): bütün internetə açıq olduğu üçün həm `anon`, həm də istənilən daxil olmuş istifadəçi onları oxuya bilər.
> - **Məhdud tələbə materialları** (`is_public = false`), **tələbə paneli**, **irəliləyiş yazmaq** (`lesson_progress`), **məşq/quiz cəhdi yadda saxlamaq** (`exercise_attempts`, `quiz_attempts`): `anon`, `PENDING`, `REJECTED`, `SUSPENDED` və kurs təyin olunmamış `APPROVED` istifadəçilər üçün **100% bloklanır**.

---

## 3. Bütün Cədvəllər Üzrə RLS Siyasət Matrisi (Müsbət və Mənfi Ssenarilər)

*Qeyd: Adminin bütün YAZMA (`INSERT`, `UPDATE`, `DELETE`) əməliyyatları birbaşa brauzerdən deyil, **Vercel Functions (`/api/admin/*`)** üzərindən (`service_role` + server-side JWT/rol yoxlaması + Zod + `audit_logs`) icra olunur. Buna görə brauzer rollarına (`anon`, `authenticated`) inzibati cədvəllərdə yazma icazəsi ümumiyyətlə verilməyib.*

| Cədvəl | `anon` (Ziyarətçi) | `PENDING` / `REJECTED` / `SUSPENDED` | `APPROVED` (Kurssuz) | `APPROVED` (Kurs Təyinli) | `admin` (RLS Oxuma) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supported_locales` | `SELECT` (`is_active=true`) | `SELECT` (`is_active=true`) | `SELECT` (`is_active=true`) | `SELECT` (`is_active=true`) | `SELECT` (hamısı) |
| `profiles` | **BLOK (0 sətir)** | `SELECT` (yalnız özü); `UPDATE` (yalnız təhlükəsiz sahələr, status DƏYİŞMƏZ) | Eyni (yalnız özü; başqa tələbə **BLOK**) | Eyni (yalnız özü; başqa tələbə **BLOK**) | `SELECT` (hamısı) |
| `user_roles` | **BLOK** | `SELECT` (yalnız öz aktiv rolu); yazma **BLOK** | Eyni; yazma **BLOK** | Eyni; yazma **BLOK** | `SELECT` (hamısı) |
| `applications` | **BLOK** | `SELECT` (yalnız `user_id=auth.uid()`); yazma **BLOK** | Eyni (yalnız özü) | Eyni (yalnız özü) | `SELECT` (hamısı) |
| `application_notes` | **BLOK** | **BLOK (0 sətir)** | **BLOK (0 sətir)** | **BLOK (0 sətir)** | `SELECT` (hamısı) |
| `courses` | `SELECT` (`is_published=true`) | `SELECT` (`is_published=true`) | `SELECT` (`is_published=true`) | `SELECT` (`is_published=true`) | `SELECT` (hamısı, draft daxil) |
| `modules` | `SELECT` **yalnız `is_public=true` & published** | **Məhdud modullar BLOK** (yalnız `is_public=true`) | **Məhdud modullar BLOK** (yalnız `is_public=true`) | `SELECT` (`is_public=true` + təyin olunmuş kursun published modulları; başqa kurs **BLOK**) | `SELECT` (hamısı) |
| `lessons` | `SELECT` **yalnız ictimai + published** | **Məhdud dərslər BLOK** | **Məhdud dərslər BLOK** | `SELECT` (ictimai + təyinli kursun published dərsləri; başqa kurs **BLOK**) | `SELECT` (hamısı) |
| `lesson_content_blocks` | `SELECT` yalnız açıq dərs blokları | **Məhdud bloklar BLOK** | **Məhdud bloklar BLOK** | `SELECT` (ictimai + təyinli kursun blokları) | `SELECT` (hamısı) |
| `exercises` | `SELECT` yalnız açıq dərs məşqləri | **Məhdud məşqlər BLOK** | **Məhdud məşqlər BLOK** | `SELECT` (ictimai + təyinli kurs məşqləri) | `SELECT` (hamısı) |
| `exercise_solutions` | **BLOK** | **BLOK** | **BLOK** | **BLOK** | `SELECT` (hamısı) |
| `exercise_test_cases` | `SELECT` yalnız açıq dərs & `is_hidden=false` | **Məhdud & hidden BLOK** | **Məhdud & hidden BLOK** | `SELECT` (təyinli kurs & `is_hidden=false`) | `SELECT` (hamısı) |
| `quizzes` | `SELECT` yalnız açıq dərs quiz-ləri | **Məhdud quiz-lər BLOK** | **Məhdud quiz-lər BLOK** | `SELECT` (təyinli kurs quiz-ləri) | `SELECT` (hamısı) |
| `quiz_questions` | `SELECT` (yalnız `explanation`-sız sütunlar, açıq dərs) | **Məhdud BLOK**; `explanation` **BLOK** | **Məhdud BLOK**; `explanation` **BLOK** | `SELECT` (təyinli kurs; `explanation` **BLOK**) | Server API (`service_role`) |
| `quiz_question_options` | `SELECT` (**`is_correct` BLOK**, açıq dərs) | **Məhdud & `is_correct` BLOK** | **Məhdud & `is_correct` BLOK** | `SELECT` (təyinli kurs; **`is_correct` BLOK**) | Server API (`service_role`) |
| `enrollments` | **BLOK** | `SELECT` (0 sətir); yazma **BLOK** | `SELECT` (0 sətir); yazma **BLOK** | `SELECT` (yalnız özü); yazma **BLOK** | `SELECT` (hamısı) |
| `lesson_progress` | **BLOK** | Oxuma özü (boş); **yazma BLOK** | Oxuma özü (boş); **yazma BLOK** | `SELECT`/`INSERT`/`UPDATE` **yalnız özü & təyinli kurs** | `SELECT` (hamısı) |
| `exercise_attempts` | **BLOK** | **Yazma BLOK** | **Yazma BLOK** | `SELECT` özü; `INSERT` təyinli kurs; `UPDATE`/`DELETE` **BLOK** | `SELECT` (hamısı) |
| `quiz_attempts` | **BLOK** | **Yazma BLOK** | **Yazma BLOK** | `SELECT` özü; birbaşa yazma **BLOK** (yalnız `submit_quiz_attempt` RPC) | `SELECT` (hamısı) |
| `quiz_attempt_answers` | **BLOK** | **Yazma BLOK** | **Yazma BLOK** | `SELECT` özü; birbaşa yazma **BLOK** | `SELECT` (hamısı) |
| `platform_settings` | **Cədvəl BLOK** (yalnız `get_public_platform_settings()` RPC) | **Cədvəl BLOK** (yalnız RPC) | **Cədvəl BLOK** (yalnız RPC) | **Cədvəl BLOK** (yalnız RPC) | `SELECT` (hamısı) |
| `audit_logs` | **BLOK** | **BLOK** | **BLOK** | **BLOK** | `SELECT` (hamısı); `UPDATE`/`DELETE` **HAMI ÜÇÜN BLOK** |
| `rate_limit_events` | **BLOK** | **BLOK** | **BLOK** | **BLOK** | **BLOK** (yalnız `service_role`) |

---

## 4. Konkret Təhlükəsizlik Tədbirləri (Hər Risk Üzrə Həll)

### 1) `SUPABASE_SERVICE_ROLE_KEY` İzolyasiyası və Gizli Açarların Qorunması
- `SUPABASE_SERVICE_ROLE_KEY` yalnız Vercel Server Environment Variables bölməsində saxlanılır və yalnız `api/**` (Vercel Functions) daxilində istifadə olunur.
- Frontend-də yalnız `VITE_SUPABASE_URL` və `VITE_SUPABASE_ANON_KEY` istifadə edilir (`VITE_` prefiksli heç bir secret açar olmayacaq).
- `.env*` faylları `.gitignore`-da bloklanacaq (Faza 3); build zamanı gizli açar sızması yoxlaması (Faza 8) aparılacaq.

### 2) Admin Rolunun Müdafiəsi və Server-Side Avtorizasiya
- Admin rolu `profiles` sütunu deyil, ayrıca `user_roles` cədvəlində saxlanılır və `authenticated` rolunun bu cədvəldə `INSERT`/`UPDATE`/`DELETE` hüququ tam ləğv edilib (`REVOKE`).
- `profiles` cədvəlində isə ikiqat müdafiə var: sütun səviyyəli `GRANT UPDATE (full_name, phone, learning_goals, avatar_url, preferred_locale)` + `trg_profiles_guard_sensitive` trigger-i (`account_status`, `email`, `archived_at` dəyişikliyini rədd edir).
- Hər `/api/admin/*` Vercel Function-ında vahid `requireAdmin(req)` yoxlaması işləyəcək:
  1. `Authorization: Bearer <access_token>` başlığını oxuyur.
  2. Tokeni serverdə `supabaseAdmin.auth.getUser(token)` ilə doğrulayır (saxta JWT-ni rədd edir).
  3. Verilənlər bazasında `user_roles` (`role = 'admin'`, `revoked_at IS NULL`) və `profiles.account_status = 'active'` yoxlayır.
  4. Yoxlama keçməzsə `401 Unauthorized` və ya `403 Forbidden` qaytarır.

### 3) Qeydiyyat Spamına Qarşı Rate Limiting
- Serverless Vercel mühitində yaddaşdaxili (*in-memory*) limit işləmədiyi üçün PostgreSQL-də `rate_limit_events` cədvəli və atomik `check_and_record_rate_limit()` funksiyası yaradılıb:
  - `POST /api/auth/register`: məsələn, 1 IP ünvanından 15 dəqiqədə maksimum 5 cəhd + eyni email üçün ayrıca limit.
  - Şifrə bərpası sorğusu: 15 dəqiqədə maksimum 3 cəhd.
  - Quiz göndərişi / profil yeniləməsi: sui-istifadəyə qarşı ayrıca pəncərə limitləri.
- Əlavə qat kimi Supabase Auth-un daxili rate-limit ayarları da aktiv saxlanılacaq.

### 4) Input Validasiyası, SQL Injection və XSS Müdafiəsi
- **Zod validasiyası:** Hər Vercel API endpoint-i gələn JSON body və query parametrlərini sərt Zod sxemi ilə yoxlayır; naməlum sahələr (`strict()` / strip) atılır, xətalar standart `400 Bad Request` formatında qaytarılır.
- **SQL Injection müdafiəsi:** Heç bir yerdə dinamik string birləşdirməsi ilə SQL sorğusu qurulmur — bütün sorğular parametrləşdirilmiş PostgREST/RPC çağırışları ilə işləyir; bütün `SECURITY DEFINER` funksiyalarında `SET search_path = ''` (və ya `public, extensions`) təyin olunub.
- **XSS müdafiəsi:**
  - React mətn çıxışlarını avtomatik escape edir; `dangerouslySetInnerHTML` istifadə olunmur.
  - Dərs mətnlərində Markdown istifadə olunarsa, xam HTML deaktiv edilmiş təhlükəsiz parser (`react-markdown` + `rehype-sanitize` və ya struktur-əsaslı render) tətbiq ediləcək.
  - Xarici linklərdə yalnız `https://` və `mailto:` protokollarına icazə veriləcək (`javascript:` bloklanır).
  - `vercel.json`-da təhlükəsizlik başlıqları (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`) konfiqurasiya olunacaq.

### 5) Dəyişdirilməz Audit Log (`audit_logs`)
- Bütün kritik inzibati əməliyyatlar (`application.approved`, `application.rejected`, `enrollment.assigned`, `enrollment.revoked`, `student.suspended`, `student.reactivated`, `course.published`, `module.visibility_changed`, `settings.updated`, `role.granted`, `role.revoked`) backend tərəfindən `audit_logs`-a yazılır.
- **Dəyişdirilməzlik:** Nə tələbə, nə də adi admin `audit_logs`-da sətir dəyişə və ya silə bilər — həm RLS `UPDATE`/`DELETE` hüququ vermir, həm də PostgreSQL `trg_audit_logs_immutable` trigger-i istənilən `UPDATE` və ya `DELETE` əməliyyatını sərt xəta (`42501`) ilə dayandırır.
- Şifrələr, JWT tokenlər və gizli açarlar heç vaxt `metadata` sahəsinə yazılmır.

### 6) `/application-status` Səhifəsinin Məxfiliyi
- `/application-status` səhifəsi heç vaxt email və ya referans nömrəsi daxil edərək anonim axtarışa icazə vermir (əks halda kənar şəxslər başqalarının müraciət statusunu və emailini yoxlaya bilərdi).
- Yalnız öz hesabı ilə daxil olmuş istifadəçi `applications` cədvəlindən RLS (`user_id = auth.uid()`) ilə **yalnız öz** statusunu və referans kodunu görür.
- WhatsApp nömrəsi `platform_settings`-də deaktivdirsə, `get_public_platform_settings()` funksiyası nömrəni `NULL` qaytarır və düymə gizlədilir.

### 7) Şifrə Bərpası və Email Təsdiqi Təhlükəsizliyi
- Supabase Auth email təsdiqi (Email Verification) aktiv olacaq; yönləndirmə URL-ləri (`Redirect URLs`) Supabase Dashboard-da yalnız rəsmi Development və Production domenləri ilə məhdudlaşdırılacaq (*Open Redirect* qarşısının alınması).
- "Şifrəni unutdum" (`/forgot-password`) forması verilən emailin bazada olub-olmamasından asılı olmayaraq **həmişə eyni neytral cavabı** göstərəcək ("Əgər bu email sistemdə mövcuddursa, bərpa linki göndərildi") — beləliklə hesab mövcudluğu (*account enumeration*) sızmayacaq.
- Şifrə minimum tələbi (ən azı 8 simvol, zəif şifrə yoxlaması) həm Zod-da, həm Supabase Auth ayarlarında tələb olunacaq.

### 8) Quiz Cavablarının və Məşq Həllərinin Qorunması
- `quiz_question_options.is_correct` və `quiz_questions.explanation` sütunları `anon` və `authenticated` rollarından `REVOKE` edilib — tələbə DevTools ilə belə düzgün cavabı əvvəlcədən oxuya bilmir.
- Quiz balı və keçid statusu yalnız `submit_quiz_attempt(...)` server-side funksiyası tərəfindən hesablanır və `pg_advisory_xact_lock` ilə paralel sorğularla `max_attempts` limitini aşma (*race condition*) hücumuna qarşı qorunur.
- `exercise_solutions` cədvəli tamamilə admin-only izolyasiya edilib.
