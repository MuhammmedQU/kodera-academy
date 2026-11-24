# Kodera Academy — Müstəqil Təhlükəsizlik Auditi Hesabatı (`SECURITY_AUDIT_REPORT.md`)

> **Audit tarixi:** 2026-11-24  
> **Auditor rolu:** Müstəqil Application Security Engineer & Database Security Auditor  
> **Audit əhatəsi:** PostgreSQL sxem və 7 SQL miqrasiya faylı, RLS siyasətləri, `SECURITY DEFINER` funksiyaları, Vercel Serverless API marşrutları, HTTP/CORS/CSP başlıqları, Auth/RBAC axınları, Zod validasiyası, Frontend XSS/secret-leak və Pyodide Web Worker izolyasiyası.  
> **Yekun təhlükəsizlik qiymətləndirməsi:** **Kod bazası səviyyəsində bütün aşkarlanan Kritik və Yüksək boşluqlar aradan qaldırılıb — Canlı Supabase/Vercel Staging Penetrasiya Yoxlamasına Hazırdır.**

---

## 1. İcra Xülasəsi

Əvvəlki inkişaf hesabatlarına güvənmədən bütün kod bazası və SQL miqrasiyaları sıfırdan müstəqil audit edildi. Audit göstərdi ki, lokal sandbox testlərinin 100% keçməsinə baxmayaraq, **real Supabase PostgreSQL 15/16 + PostgREST v11+ + Vercel mühitində ciddi təhlükəsizlik boşluqları və kritik işləmə xətaları mövcud idi**.

Bütün aşkarlanan kod, SQL, konfiqurasiya və başlıq boşluqları düzəldildi, yeni `supabase/migrations/20261123000007_audit_security_hardening_and_indexes.sql` miqrasiyası əlavə olundu və avtomatlaşdırılmış təhlükəsizlik testləri genişləndirildi.

---

## 2. Verilənlər Bazası və Supabase RLS Auditi

### 2.1 Aşkarlanan və Düzəldilən Kritik / Yüksək SQL Boşluqları

| ID | Risk | Tapıntı (Auditdən əvvəl) | Tətbiq edilən Düzəliş (`202611230007`) |
| :-: | :-: | :--- | :--- |
| **SEC-DB-01** | **KRİTİK** | `check_and_record_rate_limit()` funksiyası `SECURITY DEFINER` idi və PostgreSQL-in default `PUBLIC` icazəsi geri alınmadığı üçün istənilən `anon` istifadəçi PostgREST `/rpc/check_and_record_rate_limit` çağıraraq `rate_limit_events` cədvəlini doldura (DoS) və ya başqa istifadəçilərin açarlarını bloklaya bilərdi | `REVOKE ALL ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO service_role;` tətbiq edildi; `p_window_seconds` (`1..86400`) və `p_max_requests` (`1..10000`) sərhədləri doğrulandı; 24 saatdan köhnə sətirlər avtomatik təmizlənir |
| **SEC-DB-02** | **KRİTİK** | `guard_profile_sensitive_columns()` yalnız `current_user IN ('postgres', 'supabase_admin')` və köhnə `request.jwt.claim.role` yoxlayırdı; PostgREST v11+ konsolidə olunmuş `request.jwt.claims` JSON-u və `service_role` rolu bloklanaraq canlıda admin təsdiq/ləğv əməliyyatlarını sıradan çıxarırdı | `current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin')` və həm `request.jwt.claim.role`, həm də `request.jwt.claims::jsonb ->> 'role'` yoxlaması əlavə edildi |
| **SEC-DB-03** | **KRİTİK** | `get_public_platform_settings()` funksiyasında `GRANT EXECUTE TO service_role` yox idi; `SupabaseRepository` `service_role` ilə çağıranda PostgreSQL icazə xətası (403) verirdi. Eyni zamanda `anon` rolunda `can_write_learning_for_lesson`, `submit_quiz_attempt`, `generate_application_reference_code` və `handle_new_user` icazələri geri alınmamışdı | `service_role` üçün `get_public_platform_settings` və `get_course_curriculum_outline` icazələri verildi; bütün daxili/tələbə RPC-lərindən `PUBLIC` və `anon` icazələri geri alındı |
| **SEC-DB-04** | **YÜKSƏK** | 5 ədəd `SECURITY DEFINER` funksiyasında (`generate_application_reference_code`, `handle_new_user`, `sync_lesson_progress_course_id`, `check_and_record_rate_limit`, `submit_quiz_attempt`) `SET search_path = ''` təyin edilməmişdi (PostgreSQL `search_path` hijacking riski) | Hər 5 funksiya `SET search_path = ''` və tam kvalifikasiya olunmuş `public.*` / `auth.*` / `pg_catalog.*` adları ilə yenidən yaradıldı |
| **SEC-DB-05** | **YÜKSƏK** | `REVOKE ALL ON ALL TABLES IN SCHEMA public` tətbiq edilmədiyi üçün cədvəllərdə artıq `TRUNCATE`/`REFERENCES`/`TRIGGER` icazələri qala bilərdi və `authenticated` istifadəçilər API-ni keçərək birbaşa PostgREST ilə `lesson_progress` və `exercise_attempts` cədvəllərinə limitsiz yazma (spam/DoS) edə bilərdi | Bütün cədvəllərdən `PUBLIC`, `anon`, `authenticated` icazələri tam geri alındı; yalnız minimal `SELECT` (o cümlədən `quiz_questions` və `quiz_question_options` üçün sütun-səviyyəli məhdudiyyət — `is_correct` sütunu gizlədilir) və `profiles` üçün 4 təhlükəsiz sütunda `UPDATE` verildi. `profiles_update_own_safe_fields` RLS siyasəti yalnız `account_status = 'active'` tələbələrlə məhdudlaşdırıldı |
| **SEC-DB-06** | **YÜKSƏK** | `submit_quiz_attempt()` birbaşa PostgREST RPC ilə çağırıldıqda limitsiz cəhd spamına açıq idi, boş cavab massivini (`[]`) qəbul edirdi və `selected_option_ids` daxilində JSON `null` / qeyri-UUID olduqda xəta verə bilərdi | DB-daxili `check_and_record_rate_limit('quiz_rpc:' \|\| v_student_id, 'quiz_submit', 60, 20)` əlavə edildi; boş massiv rədd edilir; JSON `null` və UUID regex yoxlaması əlavə edildi; `coalesce(max(attempt_number), 0) + 1` istifadə olundu |
| **SEC-DB-07** | **YÜKSƏK** | `audit_logs` cədvəlində `TRUNCATE` bloklanmamışdı və `prevent_audit_log_mutation()` trigger-i `ON DELETE SET NULL` FK əməliyyatını bloklayaraq admin istifadəçisinin silinməsini sıradan çıxarırdı | `BEFORE TRUNCATE` trigger (`trg_audit_logs_no_truncate`) əlavə edildi; `prevent_audit_log_mutation()` yalnız bütün digər sütunlar dəyişməz qaldıqda `actor_id -> NULL` FK kaskadına icazə verir |
| **SEC-DB-08** | **ORTA** | `exercise_attempts.test_results` ölçüsü DB səviyyəsində məhdudlaşdırılmamışdı; `reviewApplication` iki ayrı sorğu ilə (qeyri-atomik) icra olunurdu; `auth.users.email` dəyişikliyi `profiles.email` ilə sinxronlaşmırdı | `CHECK (octet_length(test_results::text) <= 50000)` əlavə edildi; atomik `review_application_atomic(...)` RPC (`service_role` only) və `sync_auth_user_email_to_profile()` trigger-i yaradıldı |

---

## 3. Backend API, Autentifikasiya, RBAC və Vercel Təhlükəsizlik Auditi

### 3.1 Aşkarlanan və Düzəldilən API / Server Boşluqları

| ID | Risk | Tapıntı | Tətbiq edilən Düzəliş |
| :-: | :-: | :--- | :--- |
| **SEC-API-01** | **KRİTİK** | `updateStudentAccountStatus()` adminin özünü suspend etməsini, başqa admini suspend etməsini və ya `PENDING`/`REJECTED` müraciətçini birbaşa `active` edərək müraciət təsdiqi prosesini keçməsini bloklamırdı | Hər iki repozitoriyada (`SupabaseRepository` və `LocalSandboxRepository`) özünü dəyişmə (403), adminə toxunma (403) və `pending`/`rejected`/`archived` hesabların birbaşa aktivləşdirilməsi (400) bloklandı |
| **SEC-API-02** | **YÜKSƏK** | `assertNoDbError()` xam PostgreSQL/PostgREST xəta mesajlarını HTTP cavabında müştəriyə sızdıra bilərdi | Xam DB xətaları yalnız server konsoluna yazılır; müştəriyə təhlükəsiz xəta kodları qaytarılır (`PGRST116`/`P0002`→404, `P0001`→400/429, `22P02`/`22023`/`23503`/`23514`→400, `23505`→409, `42501`→403) |
| **SEC-API-03** | **YÜKSƏK** | `getClientIp()` müştərinin saxtalaşdırdığı `X-Forwarded-For` başlığına üstünlük verirdi və etibarsız IP sətirləri PostgreSQL `inet` sütununa yazılarkən `audit_logs` yazılmasını səssizcə sıradan çıxarırdı | `node:net` `isIP()` ilə sərt validasiya əlavə edildi; `x-vercel-forwarded-for` / `x-real-ip` üstün tutulur; `sanitizeIpForDb()` etibarsız IP-ləri `null`-a çevirir və `writeAudit()` xətaları loglayır |
| **SEC-API-04** | **YÜKSƏK** | `readJsonBody()` `req.body` getter xətasını və ya pozulmuş JSON-u tutmurdu (HTTP 500) və payload ölçüsü məhdudlaşdırılmamışdı | 1 MB (`MAX_BODY_BYTES`) limiti və tam `try/catch` əlavə edildi — pozulmuş JSON həmişə HTTP 400 `INVALID_JSON` qaytarır |
| **SEC-API-05** | **YÜKSƏK** | `getRepository()` `LocalSandboxRepository`-ni statik import edirdi, `VERCEL === '1'` yoxlaması yox idi, placeholder `anonKey`-i rədd etmirdi və production-da `APP_URL`-in HTTPS olduğunu doğrulamırdı | Dinamik `await import('../dev/localSandboxRepository.js')` tətbiq edildi; `NODE_ENV === 'production' \|\| VERCEL === '1'` olduqda sandbox tam bloklanır; `https://` `APP_URL` yoxlaması əlavə edildi |
| **SEC-API-06** | **YÜKSƏK** | `registerStudent()` paylaşılan `anon` Supabase client-indən istifadə edirdi (serverless mühitdə GoTrue sessiya qarışması riski) və mövcud hesablar üçün `identities: []` halını ayırd etmirdi | Hər sorğu üçün təcrid olunmuş ephemeral client (`persistSession: false`) yaradılır; `identities: []` neytral şəkildə idarə olunur; `reference_code` yalnız yeni (<60 san) qeydiyyatda qaytarılır |
| **SEC-API-07** | **YÜKSƏK** | `PATCH /api/student/profile` `PENDING`/`REJECTED`/`SUSPENDED` hesablara açıq idi; `PUT /progress`, `/api/admin/*`, `forgot-password` (email üzrə) və `public lesson` üçün rate limit boşluqları var idi; `POST /api/auth/logout` və `POST /api/auth/resend-verification` endpoint-ləri yox idi | `PATCH /api/student/profile` yalnız `active` hesablara icazə verir + rate limit əlavə edildi; `logout` (sessiya ləğvi) və `resend-verification` (IP+email rate limit, neytral cavab) əlavə edildi; bütün 14 UUID marşrutunda sərt UUID regex doğrulaması tətbiq edildi |
| **SEC-API-08** | **YÜKSƏK** | `getLessonView()`, `upsertLessonProgress()` və `recordExerciseAttempt()` nəşr olunmamış məşq/quiz-ləri filtrləmir, `prev_lesson`/`next_lesson` kilidli slug-larını sızdırır və kurs→modul→dərs→məşq tam nəşr zəncirini yoxlamırdı | `is_published = true` + `locale` filtrləri, təhlükəsiz sütun siyahısı (heç vaxt `solution_code` və ya `is_correct` qaytarılmır), kilidli `prev_lesson.slug`/`next_lesson.slug` maskalanması (`null`), tam nəşr zənciri və məşq test sayının üst sərhəd yoxlaması tətbiq edildi |
| **SEC-API-09** | **ORTA** | `vercel.json` CSP başlığında `https://cdn.jsdelivr.net` tam domen açıq idi (istənilən jsDelivr skripti icazəli idi) və `/api/(.*)` hamısı `no-store` idi | CSP dəqiq versiyaya sabitlənib: `https://cdn.jsdelivr.net/pyodide/v0.27.5/full/` + `upgrade-insecure-requests;`; `no-store` yalnız `/api/(auth\|student\|admin)` üçün tətbiq edildi |

---

## 4. Frontend, Python Sandbox və Təchizat Zənciri Təhlükəsizlik Auditi

| Sahə | Status | Yoxlanılmış Faktlar |
| :--- | :-: | :--- |
| **Secret Leak & Production Bundle (`dist/`)** | **KEÇDİ** | `scripts/security-check.mjs` yeniləndi: `src/` daxilində `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_SERVICE_ROLE*`, `dangerouslySetInnerHTML`, `eval()`, `new Function()`, `.innerHTML =` yoxlanılır; `dist/` və bütün qovluqlarda `SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_*` açarları, JWT tokenləri və hardcoded demo parolları yoxlanılır. `LoginPage`-dən dev hesab bloku tam silinib və `LocalSandboxRepository` yalnız proses-daxili ephemeral runtime parolundan istifadə edir → **0 tapıntı** |
| **XSS & URL Sanitization** | **KEÇDİ** | Bütün 11 dərs kontent bloku yalnız React text/JSX ilə render olunur. `isSafeUrl()` və `isSafeImageUrl()` `javascript:`, `data:`, `vbscript:`, protocol-relative `//` və `/\` yollarını bloklayır (unit testlə təsdiqlənib) |
| **Python Web Worker İzolyasiyası** | **KEÇDİ** | Kod ayrıca Web Worker-də icra olunur; `PYTHON_RUNNER_HARNESS` daxilində `import js`, `import pyodide`, `import pyodide_js` qadağan edildi (`ImportError`); timeout zamanı `worker.terminate()` işə düşür və ləğv edilmiş cəhd təmiz bağlanır |
| **Şifrə Bərpa Sessiyasının Təcridi** | **KEÇDİ** | `AuthContext` `PASSWORD_RECOVERY` hadisəsini normal giriş sessiyasına yüksəltmir; `ResetPasswordPage` bərpa tamamlandıqdan sonra `supabase.auth.signOut()` çağırır |
| **Asılılıqlar (`npm audit`)** | **KEÇDİ** | `vite` `^6.4.0`-a yeniləndi, `tailwind-merge` əlavə edildi → `npm audit` nəticəsi: **0 vulnerability (298 paket)** |

---

## 5. Canlı Staging Mühitində Mütləq İcra Edilməli Təhlükəsizlik Testləri

Aşağıdakı yoxlamalar real Supabase və Vercel mühiti qoşulmadığı üçün lokal mühitdə icra edilə **bilməyib** və Production-dan əvvəl Staging-də icra olunmalıdır:

1. **Canlı PostgREST RLS Penetrasiya Testi:** `VITE_SUPABASE_ANON_KEY` + müxtəlif istifadəçi JWT-ləri (`anon`, `PENDING`, `ACTIVE unassigned`, `ACTIVE assigned`, `SUSPENDED`) ilə birbaşa Supabase REST endpoint-lərinə (`profiles`, `enrollments`, `quiz_question_options`, `exercises`, `audit_logs`, `platform_settings`) sorğu göndərib `is_correct`, `solution_code`, digər tələbələrin məlumatlarının və icazəsiz `UPDATE`/`INSERT`/`RPC` əməliyyatlarının PostgreSQL səviyyəsində rədd edildiyini doğrulamaq.
2. **Canlı `check_and_record_rate_limit` və `review_application_atomic` RPC Testi:** `anon` və `authenticated` JWT-ləri ilə bu RPC-lərə çağırışın HTTP 403 / `permission denied` qaytardığını təsdiqləmək.
3. **Canlı `secure_password_change` Yoxlaması:** `supabase/config.toml` daxilində `secure_password_change = true` aktiv olduğu üçün real Supabase Auth-da `StudentSettingsPage` şifrə dəyişikliyinin təsdiq/re-authentication davranışını yoxlamaq.
4. **Canlı Vercel CSP + Pyodide WASM Yoxlaması:** Daraldılmış `https://cdn.jsdelivr.net/pyodide/v0.27.5/full/` CSP başlığı altında Chrome DevTools Console-da sıfır CSP pozuntusu ilə Pyodide WASM yüklənməsini və Python kodunun icrasını təsdiqləmək.
