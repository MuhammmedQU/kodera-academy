# Kodera Academy — Staging Deployment və Doğrulama Yoxlama Siyahısı (`STAGING_DEPLOYMENT_CHECKLIST.md`)

> **Məqsəd:** Kodera platformasını **yalnız Staging (Vercel Preview + `kodera-dev` Supabase)** mühitində təhlükəsiz şəkildə qurmaq və yoxlamaq.  
> **Qəti Qayda:** Bu sənəd boyu **heç bir Production deploy aparılmır**, `kodera-prod` bazasına toxunulmur və heç bir secret/API açarı Git-ə və ya çata yazılmır.

---

## 1. Lokal Hazırlıq Statusu (Avtomatik Tamamlanıb)

| Hazırlıq Sahəsi | Status | Fayl / Təsdiq |
| :--- | :---: | :--- |
| `PRODUCTION_READINESS.md` nəzərdən keçirildi | **HAZIR** | [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) |
| GitHub Actions CI (`main` + `staging`, build → `security:check` → `npm audit`) | **HAZIR** | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| 7 SQL miqrasiyası Supabase CLI 14-rəqəmli formatda (`YYYYMMDDHHmmss_*.sql`) | **HAZIR** | `supabase/migrations/20261123000001`–`000007` |
| Python seed faylı (162/162 idempotent INSERT, 83/83 etibarlı JSONB) | **HAZIR** | [01_python_intro_modules.sql](../supabase/seeds/01_python_intro_modules.sql) |
| `kodera-dev` Supabase konfiqurasiya və ilk admin bootstrap SQL-i | **HAZIR** | [config.toml](../supabase/config.toml), [promote_first_admin.sql](../supabase/bootstrap/promote_first_admin.sql) |
| Vercel Preview konfiqurasiyası + env şablonu (sıfır secret) | **HAZIR** | [vercel.json](../vercel.json), [.env.staging.example](../.env.staging.example) |
| Avtomatlaşdırılmış Staging API + Header + PostgREST RLS skripti | **HAZIR** | [verify-staging.mjs](../scripts/verify-staging.mjs) (`npm run staging:verify`) |

---

## 2. Xarici Hesab Girişi və ya Açıq İcazə Tələb Edən Addımlar

Aşağıdakı 5 addım xarici hesablarınızı (GitHub, Supabase, Vercel) tələb etdiyi üçün avtomatik icra edilməyib — onları növbə ilə birlikdə icra edəcəyik:

| Addım | Xarici Xidmət | Nə tələb edir? |
| :-: | :--- | :--- |
| **Addım 1** | **GitHub** | Private repository yaratmaq, remote URL qoşmaq, `main` + `staging` budaqlarını push etmək |
| **Addım 2** | **Supabase (`kodera-dev`)** | `kodera-dev` layihəsi yaratmaq, 7 miqrasiya + seed icra etmək, API açarlarını (yalnız Vercel/lokal `.env.local` üçün) götürmək |
| **Addım 3** | **Vercel (Preview ONLY)** | Private repo-nu import etmək, `.env.staging.example` üzrə dəyişənləri **yalnız `Preview`** mühitinə əlavə etmək, `staging` budağından Preview URL almaq |
| **Addım 4** | **Supabase Auth & Admin Bootstrap** | Staging Preview URL-ini Supabase `Site URL` + `Redirect URLs`-ə yazmaq və `promote_first_admin.sql` ilə ilk admini aktivləşdirmək |
| **Addım 5** | **Staging Doğrulama Qapısı** | `npm run staging:verify` + canlı brauzer Auth/Admin/Student/Pyodide testlərini keçmək |

> **Qeyd (Lokal CLI-lər):** Bu kompüterdə `gh`, `supabase`, `vercel` və `psql` qlobal quraşdırılmayıb. Bütün 5 addımı **heç bir əlavə CLI quraşdırmadan** birbaşa GitHub / Supabase / Vercel Web Dashboard-ları vasitəsilə (və ya istəyə görə `npx supabase` / `npx vercel` ilə) rahatlıqla icra edə bilərsiniz.

---

## 3. Addım-Addım Staging Quraşdırma Bələdçisi

### Addım 1 — Private GitHub Repository İnteqrasiyası
1. GitHub hesabınızda (`MuhammmedQU`) yeni **Private** repository yaradın (məs., `kodera-academy`) — *Initialize with README / .gitignore / License seçməyin* (repo boş olsun).
2. Terminalda lokal repoyu qoşun və `main` + `staging` budaqlarını push edin:
   ```powershell
   git remote add origin https://github.com/MuhammmedQU/kodera-academy.git
   git push -u origin main
   git checkout -b staging
   git push -u origin staging
   git checkout main
   ```
3. GitHub → **Actions** bölməsində `Kodera CI — Quality & Security Gate` işinin yaşıl (PASS) olduğunu yoxlayın.

> **Niyə ayrıca `staging` budağı?** Vercel default olaraq `main` budağını *Production*, digər budaqları (`staging`) isə **Preview** kimi deploy edir. `staging` budağı üzərindən işləmək təsadüfən Production-a çıxmağın qarşısını alır.

---

### Addım 2 — `kodera-dev` Supabase Layihəsi, 7 Miqrasiya və Python Seed
1. Supabase Dashboard-da **`kodera-dev`** adlı yeni layihə yaradın (region: Avropa / `eu-central-1` Frankfurt; güclü DB şifrəsi seçin).
2. **Variant A — Supabase SQL Editor (CLI-siz, ən sadə):** Aşağıdakı **7 miqrasiya faylını dəqiq ardıcıllıqla** icra edin:
   - [ ] `1.` `supabase/migrations/20261123000001_extensions_enums_locales.sql`
   - [ ] `2.` `supabase/migrations/20261123000002_identity_roles_applications.sql`
   - [ ] `3.` `supabase/migrations/20261123000003_courses_modules_lessons_content.sql`
   - [ ] `4.` `supabase/migrations/20261123000004_enrollments_progress_attempts.sql`
   - [ ] `5.` `supabase/migrations/20261123000005_settings_audit_ratelimit.sql`
   - [ ] `6.` `supabase/migrations/20261123000006_security_functions_rls_policies.sql`
   - [ ] `7.` `supabase/migrations/20261123000007_audit_security_hardening_and_indexes.sql`
   - [ ] `8.` Seed faylını icra edin: `supabase/seeds/01_python_intro_modules.sql`
3. **Variant B — `npx supabase` CLI ilə (opsional):**
   ```powershell
   npx supabase login
   npx supabase link --project-ref <KODERA_DEV_PROJECT_REF>
   npx supabase db push
   ```
   *(Sonra `supabase/seeds/01_python_intro_modules.sql` faylını SQL Editor-da icra edin.)*
4. **Sürətli SQL təsdiqi** (SQL Editor-da):
   ```sql
   SELECT count(*) AS courses FROM public.courses;        -- Gözlənilən: 2
   SELECT count(*) AS modules FROM public.modules;        -- Gözlənilən: 4
   SELECT count(*) AS lessons FROM public.lessons;        -- Gözlənilən: 10
   SELECT count(*) AS blocks  FROM public.lesson_content_blocks; -- Gözlənilən: 74
   SELECT id, public FROM storage.buckets WHERE id IN ('public-media', 'lesson-media');
   ```

---

### Addım 3 — Vercel Preview Deployment (YALNIZ Staging / Preview)
1. Vercel Dashboard → **Add New Project** → private `kodera-academy` GitHub repository-ni seçin (`Framework Preset: Vite`, `Build Command: npm run build`, `Output Directory: dist`).
2. **VACİB:** Layihə yaratma ekranında və ya **Settings → Environment Variables** bölməsində `.env.staging.example` faylındakı dəyişənləri **YALNIZ `Preview`** (Production deyil!) mühitinə əlavə edin:
   - `VITE_SUPABASE_URL` = `https://<kodera-dev-ref>.supabase.co` *(Preview)*
   - `VITE_SUPABASE_ANON_KEY` = `<kodera-dev-anon-key>` *(Preview)*
   - `VITE_APP_NAME` = `Kodera` *(Preview)*
   - `VITE_APP_URL` = `https://<staging-preview-url>.vercel.app` *(Preview)*
   - `VITE_LOCAL_SANDBOX` = `false` *(Preview)*
   - `SUPABASE_URL` = `https://<kodera-dev-ref>.supabase.co` *(Preview)*
   - `SUPABASE_ANON_KEY` = `<kodera-dev-anon-key>` *(Preview)*
   - `SUPABASE_SERVICE_ROLE_KEY` = `<kodera-dev-service-role-key>` *(Preview, Encrypted — HEÇ VAXT `VITE_` prefiksi ilə yazmayın!)*
   - `APP_URL` = `https://<staging-preview-url>.vercel.app` *(Preview)*
   - `KODERA_LOCAL_SANDBOX` = `false` *(Preview)*
3. **Production Deployment qorunması:** Production mühiti üçün env dəyişənləri hələ boş saxlayın (və ya `Settings → Git → Production Branch` bölməsindən sonra `staging` budağında kiçik boş commit / Redeploy edərək `staging` Preview URL-i alın).
4. **Vercel Preview Toolbar (tövsiyə):** `Settings → Vercel Toolbar` bölməsində Preview üçün toolbar-ı söndürə bilərsiniz ki, sərt CSP konsolda `vercel.live` xəbərdarlığı göstərməsin.

---

### Addım 4 — Supabase Auth URL-ləri və İlk Staging Admin Bootstrap
1. `kodera-dev` Supabase Dashboard → **Authentication → URL Configuration**:
   - **Site URL:** `https://<staging-preview-url>.vercel.app`
   - **Redirect URLs:**
     - `https://<staging-preview-url>.vercel.app/login`
     - `https://<staging-preview-url>.vercel.app/reset-password`
2. **Authentication → Providers → Email:**
   - `Confirm email`: **ON**
   - `Minimum password length`: **8**
   - `Password requirements`: **Letters and digits**
3. **Authentication → Users → Add User:** öz admin emailinizlə istifadəçi yaradın (`Auto Confirm User: ON`).
4. SQL Editor-da [promote_first_admin.sql](../supabase/bootstrap/promote_first_admin.sql) skriptində `ADMIN_EMAIL_HERE` hissəsini öz emailinizlə əvəz edib icra edin.

---

## 4. Tam Staging Doğrulama Yoxlama Siyahısı (Verification Gate)

Staging testinin uğurlu sayılması və `3. READY FOR PRODUCTION DEPLOYMENT` statusuna keçməsi üçün **aşağıdakı bütün maddələr [x] işarələnməlidir**:

### A. Avtomatlaşdırılmış API, Security Header və Canlı RLS Testi
Terminalda (öz staging URL və yalnız `anon` açarınızla — `service_role` tələb olunmur!):
```powershell
$env:STAGING_URL="https://<staging-preview-url>.vercel.app"
$env:STAGING_SUPABASE_URL="https://<kodera-dev-ref>.supabase.co"
$env:STAGING_SUPABASE_ANON_KEY="<kodera-dev-anon-key>"
npm run staging:verify
```
- [ ] `GET /api/health` → `200`, `mode: "supabase"`, `Cache-Control: no-store`
- [ ] `GET /` başlıqları: `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `CSP` (`https://cdn.jsdelivr.net/pyodide/v0.27.5/full/` + `upgrade-insecure-requests`)
- [ ] `GET /api/public/settings` və `GET /api/public/courses` → `200` (Vercel `?__route=` rewrite işləyir, `python-esaslari` və `first_public_lesson_slug` qayıdır)
- [ ] İctimai dərs `1.2` → `200` (`solution_code` və `is_correct` sıfır sızma); Modul 3 → `403`
- [ ] `/api/admin/students` və `/api/student/overview` (anonim) → `401` + `no-store`
- [ ] Pozulmuş JSON → `400` (`INVALID_JSON`)
- [ ] Canlı PostgREST RLS (`anon`): bütün 13 gizli cədvəldə 0 sızma, `quiz_question_options(is_correct)` bloklanıb, `check_and_record_rate_limit` və `review_application_atomic` bloklanıb, ictimai RPC-lər işləyir (`lesson_slug: null` Modul 3 üçün)

### B. Canlı Supabase Auth & E-poçt Axınları
- [ ] Yeni test tələbəsi `/register` üzərindən qeydiyyatdan keçir → real təsdiq e-poçtu gəlir
- [ ] E-poçt təsdiqlənmədən giriş etdikdə aydın "Email təsdiqlənməyib" mesajı görünür
- [ ] "Təsdiq emailini yenidən göndər" işləyir və təsdiq linki istifadəçini `/login`-ə qaytarır
- [ ] Təsdiqlənmiş, lakin admin tərəfindən hələ təsdiqlənməmiş tələbə `/application-status` səhifəsində `PENDING` + `KDR-YYYY-XXXXXX` nömrəsini görür və `/dashboard` / `/admin`-ə buraxılmır
- [ ] `/forgot-password` → real bərpa linki → `/reset-password` → şifrə yenilənir → avtomatik `signOut()` edilir → yeni şifrə ilə giriş işləyir
- [ ] Aktiv tələbə `/dashboard/settings` səhifəsində şifrə dəyişikliyini sınaqdan keçirir (`secure_password_change = true` davranışını qeyd edin; əgər re-auth tələb olunarsa, `KNOWN_ISSUES.md` `LIM-02` üzrə qərar verin)

### C. Admin Paneli & Real PostgreSQL Trigger/RPC Yoxlaması
- [ ] Admin giriş edir → `/admin` statistika kartları və `/admin/students` siyahısı xətasız yüklənir (`PGRST201` yoxdur)
- [ ] Admin `/admin/settings`-də real test WhatsApp nömrəsini aktivləşdirib yadda saxlayır → ictimai/status səhifəsində prefilled `wa.me` linki açılır; söndürdükdə nömrə maskalanır
- [ ] Admin `/admin/applications`-da test tələbəsini təsdiqləyir (`review_application_atomic` + `guard_profile_sensitive_columns` `service_role` ilə xətasız işləyir)
- [ ] Təsdiqlənmiş tələbəyə kurs təyin olunmadan `/dashboard`-da 0 kurs görünür (ayrı axın təsdiqi!)
- [ ] Admin `/admin/enrollments`-da Python kursunu təyin edir → tələbə yalnız Python-u görür, SQL bloklanır
- [ ] Admin tələbəni Suspend → Reactivate edir, özünü suspend etməyə çalışdıqda `403` alır
- [ ] Admin `/admin/courses`-da test kursu/modulu/dərsi/bloku yaradır, redaktə edir və silir (HTTP 409 olmur)
- [ ] `/admin/audit-logs` bütün əməliyyatları dəqiq göstərir; SQL Editor-da `DELETE FROM public.audit_logs` və `TRUNCATE public.audit_logs` icra etdikdə `42501` immutability xətası qaytarır

### D. Tələbə Paneli, Quiz və Canlı Brauzer Pyodide `v0.27.5` Testi
- [ ] Tələbə Modul 3 (`3.1 for dövrü`) dərsini aça bilir (əvvəl anonimə 403 idi)
- [ ] Tələbə Dərs 1.2 quiz-ini göndərir → `submit_quiz_attempt` RPC server-side qiymətləndirir və nəticəni saxlayır
- [ ] Tələbə dərsi "Tamamlandı" işarələyir → `/dashboard` və `/dashboard/progress` faizləri canlı yenilənir
- [ ] **Pyodide Live WASM Smoke Test (Chrome DevTools Console açıq):**
  - [ ] Dərs 1.2 və Dərs 2.4 məşqlərində "Kodu İşlət" kliklənir → `cdn.jsdelivr.net/pyodide/v0.27.5/full/` WASM yüklənir → **0 CSP xətası**, testlər keçir və cəhd bazaya yazılır
  - [ ] `while True: pass` yazıldıqda timeout işləyir, worker bağlanır və növbəti düzgün kod işləyir
  - [ ] `import js` yazıldıqda sandbox bloklayır (`ImportError`)
- [ ] Mobil (375px) və Desktop (1440px) ekranlarda əsas səhifələrdə 0 vizual/konsol xətası

---

## 5. Production-a Keçid Qərarı

Yalnız **Bölmə 4-dəki bütün A, B, C, D maddələri 100% keçdikdən sonra** ayrıca `kodera-prod` Supabase layihəsi və Vercel Production mühiti layihə sahibinin açıq təsdiqi ilə işə salına bilər.
