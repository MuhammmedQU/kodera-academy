# Kodera — Faza 2: Verilənlər Bazası və Təhlükəsizlik Test Planı (`02-security-test-plan.md`)

> **Məqsəd:** Bütün verilənlər bazası qaydalarının, RLS siyasətlərinin, rol məhdudiyyətlərinin və biznes axınlarının müsbət və mənfi ssenarilərlə yoxlanılmasını təmin etmək.  
> **İcra Mühiti:** Yalnız **`kodera-dev` (Supabase Development)** layihəsi (Production bazasına heç vaxt test istifadəçisi yazılmır).  
> **Test Alətləri:** Vitest (avtomatlaşdırılmış SQL / Supabase Client / API inteqrasiya testləri) + Playwright (E2E brauzer testləri).

---

## 1. Test Aktorları (Dev Mühitində Yaradılacaq Sınaq Rolları)

| Aktor Kodu | Vəziyyəti | Məqsəd |
| :--- | :--- | :--- |
| `U_ANON` | Qeydiyyatsız ziyarətçi (`anon` key, sessiyasız) | İctimai modulların oxunması və məhdud məzmunun bloklanması |
| `U_PENDING` | Qeydiyyatdan keçmiş, müraciəti `PENDING`, `account_status = 'pending'` | Təsdiqlənməmiş tələbənin bloklanması |
| `U_REJECTED` | Müraciəti `REJECTED`, `account_status = 'rejected'` | Rədd edilmiş istifadəçinin bloklanması |
| `U_SUSPENDED` | Əvvəl təsdiqlənmiş, sonra admin tərəfindən `suspended` edilmiş tələbə | Dondurulmuş hesabın dərhal kəsilməsi |
| `U_APPROVED_NONE` | `APPROVED`, `account_status = 'active'`, lakin **0 kurs təyinatı** | Təsdiqlə kurs təyinatının ayrılığını sübut etmək |
| `U_STUDENT_A` | `APPROVED` + `active` + yalnız **Python** kursu təyin olunub | Təyinli kursa giriş, başqa kursa (məs. SQL) qadağa |
| `U_STUDENT_B` | `APPROVED` + `active` + yalnız **SQL** kursu təyin olunub | Tələbələr arası məlumat izolyasiyası (`U_STUDENT_A` vs `U_STUDENT_B`) |
| `U_ADMIN` | `active` + `user_roles.role = 'admin'` | İnzibati əməliyyatlar, kurs təyinatı, audit log yoxlaması |

---

## 2. Verilənlər Bazası və Təhlükəsizlik Test Ssenariləri (24 Ssenari)

### A. İctimai və Məhdud Kontent Giriş Testləri (RLS)

| Test ID | Ssenari | Aktor | Əməliyyat | Gözlənilən Nəticə | Planlanan Faza |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Anonim istifadəçi ictimai Python modulunu oxuyur | `U_ANON` | `is_public=true` və `published` olan Modul 1 dərsinə və `lesson_content_blocks`-a `SELECT` sorğusu | Uğurlu (`200`), yalnız yayımlanmış ictimai modulun blokları qayıdır | Faza 4 / 6 |
| **SEC-02** | **Anonim istifadəçi məhdud dərsi oxuya bilməməlidir** | `U_ANON` | `is_public=false` olan Modul 3 dərsinin `id` ilə birbaşa `lessons`, `lesson_content_blocks`, `exercises`, `quizzes` sorğusu | **0 sətir** qayıdır (RLS tam bloklayır); heç bir məzmun sızmır | Faza 4 / 6 |
| **SEC-03** | Anonim istifadəçi `draft` və ya `archived` ictimai modulu oxuya bilməməlidir | `U_ANON` | `is_public=true`, lakin `status='draft'` olan dərsə `SELECT` | **0 sətir** qayıdır (`is_published=true` şərti məcburidir) | Faza 5 / 6 |
| **SEC-04** | **PENDING tələbə kurs materiallarına giriş əldə etməməlidir** | `U_PENDING` | Məhdud Modul 3 dərslərinə `SELECT`; `lesson_progress` və `exercise_attempts`-a `INSERT`; `/dashboard` açma cəhdi | DB-də **0 sətir / `42501` icazə xətası**; UI `/application-status`-a yönləndirir | Faza 4 / 6 |
| **SEC-05** | REJECTED tələbə kurs materiallarına giriş əldə etməməlidir | `U_REJECTED` | Məhdud dərslərə `SELECT`, `lesson_progress` yazma, `/dashboard` giriş cəhdi | DB-də **0 sətir / xəta**; yalnız öz `REJECTED` müraciət statusunu görür | Faza 4 / 6 |
| **SEC-06** | **Kurs təyin edilməyən APPROVED tələbə kurs materiallarına giriş əldə etməməlidir** | `U_APPROVED_NONE` | Python Modul 3 dərslərinə `SELECT`, `lesson_progress`-ə `INSERT`, `submit_quiz_attempt` RPC çağırışı | Dərs oxumada **0 sətir**, progress və quiz yazmada **`42501` Forbidden** | Faza 5 / 6 |
| **SEC-07** | Təyin olunmuş kursa giriş var, digər kursa giriş yoxdur | `U_STUDENT_A` | Python (təyinli) və SQL (təyinsiz) məhdud dərslərinə `SELECT` | Python dərsləri uğurla oxunur; SQL dərslərindən **0 sətir** qayıdır | Faza 6 |
| **SEC-08** | Dondurulmuş (`suspended`) tələbənin girişi dərhal kəsilir | `U_SUSPENDED` | Əvvəl təyin olunmuş Python dərsinə `SELECT` və `lesson_progress` yeniləməsi | `is_active_student() = false` olduğu üçün **0 sətir / blok** | Faza 5 / 8 |

### B. Tələbələr Arası İzolyasiya və Şəxsi Məlumatların Mühafizəsi

| Test ID | Ssenari | Aktor | Əməliyyat | Gözlənilən Nəticə | Planlanan Faza |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-09** | **Tələbə başqa tələbənin məlumatlarını oxuya bilməməlidir** | `U_STUDENT_A` | `U_STUDENT_B`-nin `id`-si ilə `profiles`, `applications`, `enrollments`, `lesson_progress`, `exercise_attempts`, `quiz_attempts` sorğusu | Bütün cədvəllərdə **0 sətir** qayıdır | Faza 4 / 6 |
| **SEC-10** | `/application-status` başqa şəxslərin məlumatlarını açıqlamır | `U_ANON` & `U_PENDING` | Başqa istifadəçinin `reference_code` və ya `email`-i ilə `applications` sorğusu | `U_ANON`: **0 sətir**; `U_PENDING`: başqasının koduna görə **0 sətir** | Faza 4 |
| **SEC-11** | Tələbə adminin daxili müraciət qeydlərini oxuya bilməməlidir | `U_PENDING` & `U_STUDENT_A` | `application_notes` cədvəlinə birbaşa `SELECT` | **0 sətir** qayıdır | Faza 5 |

### C. Rol Yüksəltmə (Privilege Escalation) və Özünü Təsdiqləmə Cəhdləri

| Test ID | Ssenari | Aktor | Əməliyyat | Gözlənilən Nəticə | Planlanan Faza |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-12** | Qeydiyyat zamanı `role: "admin"` göndərmə cəhdi | `U_ANON` | Signup metadata-sına `{"role": "admin", "account_status": "active"}` əlavə edərək qeydiyyat | `handle_new_user()` metadata rolunu iqnor edir; yalnız `student` + `pending` yaranır | Faza 4 |
| **SEC-13** | Tələbə öz profilində `account_status = 'active'` yazmağa çalışır | `U_PENDING` | `UPDATE profiles SET account_status = 'active' WHERE id = auth.uid()` | **Rədd edilir (`42501`)** — həm sütun `REVOKE`, həm `trg_profiles_guard_sensitive` bloklayır | Faza 4 / 8 |
| **SEC-14** | Tələbə özünə `admin` rolu əlavə etməyə çalışır | `U_STUDENT_A` | `INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'admin')` | **Rədd edilir (`42501`)** (`REVOKE` + RLS) | Faza 5 / 8 |
| **SEC-15** | Tələbə özünə kurs təyin etməyə çalışır | `U_APPROVED_NONE` | `INSERT INTO enrollments (student_id, course_id, status) VALUES (...)` | **Rədd edilir (`42501`)** (`REVOKE` + RLS) | Faza 5 / 8 |
| **SEC-16** | **Tələbə admin endpoint-lərindən istifadə edə bilməməlidir** | `U_STUDENT_A` | Tələbə JWT tokeni ilə `/api/admin/applications`, `/api/admin/enrollments`, `/api/admin/settings` sorğuları | Bütün endpoint-lər **`403 Forbidden`** qaytarır, bazada heç nə dəyişmir | Faza 5 |

### D. İnzibati Əməliyyatlar, Dinamik İctimai Modullar və WhatsApp

| Test ID | Ssenari | Aktor | Əməliyyat | Gözlənilən Nəticə | Planlanan Faza |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-17** | **Admin kurs təyin edə bilməlidir** (təsdiqdən ayrı) | `U_ADMIN` | 1) Müraciəti `APPROVED` edir; 2) Tələbə hələ dərsə girə bilmir; 3) `POST /api/admin/enrollments` ilə Python təyin edir | Addım 2-də giriş bloklu, Addım 3-dən sonra yalnız Python açılır | Faza 5 / 6 |
| **SEC-18** | **Admin kurs təyinatını ləğv edə bilməlidir** | `U_ADMIN` | `U_STUDENT_A`-nın Python təyinatını `status = 'revoked'` edir; tələbə dərhal Python Modul 3-ü oxumağa çalışır | Tələbənin məhdud dərslərə girişi dərhal kəsilir (**0 sətir**) | Faza 5 / 6 |
| **SEC-19** | **İctimai modulun görünməsi database ayarından idarə olunmalıdır** | `U_ADMIN` & `U_ANON` | Admin Modul 2-də `is_public = false` edir → `U_ANON` oxumağa çalışır; sonra `is_public = true` edir → `U_ANON` yenidən yoxlayır | `false` olduqda `U_ANON` **0 sətir** alır; `true` olduqda dərhal oxuyur (kod dəyişmədən!) | Faza 5 / 6 |
| **SEC-20** | WhatsApp nömrəsi deaktiv olduqda sızmır və klikləmə təsdiq vermir | `U_ADMIN` & `U_PENDING` | Admin `whatsapp_button_enabled = false` edir → `get_public_platform_settings()` çağırılır; aktiv olduqda `wa.me` linki açılır | Deaktiv olduqda `whatsapp_phone = NULL` qayıdır; aktiv olduqda klikləmə `applications.status`-u `PENDING`-dən dəyişmir | Faza 4 / 5 |

### E. Quiz, Məşq, Audit Log və Rate Limiting Testləri

| Test ID | Ssenari | Aktor | Əməliyyat | Gözlənilən Nəticə | Planlanan Faza |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-21** | Tələbə quiz-in düzgün cavabını və saxta balı manipulyasiya edə bilməməlidir | `U_STUDENT_A` | `SELECT is_correct FROM quiz_question_options`; `INSERT INTO quiz_attempts (score_percent = 100)`; `SELECT * FROM exercise_solutions` | Hamısı **`42501` icazə xətası / 0 sətir** ilə rədd edilir; yalnız `submit_quiz_attempt` RPC işləyir | Faza 6 / 8 |
| **SEC-22** | **Audit log kritik əməliyyatları saxlamalı və dəyişdirilə bilməməlidir** | `U_ADMIN` & `U_STUDENT_A` | Admin müraciət təsdiqləyir + kurs təyin edir; sonra həm tələbə, həm də admin `audit_logs` üzərində `UPDATE` / `DELETE` etməyə çalışır | Hər iki əməliyyat `audit_logs`-da dəqiq qeydə alınır; `UPDATE` və `DELETE` **`trg_audit_logs_immutable`** tərəfindən rədd edilir; tələbə `SELECT` edə bilmir | Faza 5 / 8 |
| **SEC-23** | Qeydiyyat spamına qarşı rate limit işləyir | `U_ANON` | Eyni IP-dən qısa pəncərədə limitdən artıq `POST /api/auth/register` sorğusu göndərmək | Limit aşımında **`429 Too Many Requests`** qaytarılır, yeni `auth.users` sətiri yaradılmır | Faza 4 / 8 |
| **SEC-24** | XSS və yanlış input göndərmə cəhdi | `U_ANON` & `U_STUDENT_A` | `full_name`-ə `<script>alert(1)</script>`, yanlış email/telefon və ya həddən artıq uzun mətn göndərmək | Server Zod validasiyası yanlış formatları `400 Bad Request` ilə rədd edir; saxlanan mətnlər React-də təhlükəsiz mətn kimi göstərilir (skript icra olunmur) | Faza 4 / 8 |

---

## 3. Testlərin İcra və Qəbul Meyarları

- **Heç bir test nəticəsi uydurulmayacaq:** Hər fazada yalnız real icra edilmiş testlərin faktiki çıxışı hesabat veriləcək.
- **Keçid meyarı:** Faza 8 (Yekun QA və Təhlükəsizlik Auditi) başa çatmadan və yuxarıdakı **`SEC-01` – `SEC-24`** ssenarilərinin **100%-i real `kodera-dev` bazasında uğurla keçmədən** Faza 9-a (Production Deployment) keçilməyəcək.
- **Təmizləmə qaydası:** Avtomatlaşdırılmış testlər sonunda yaratdığı müvəqqəti test qeydlərini `kodera-dev` mühitində təmizləyəcək (`afterAll` cleanup).
