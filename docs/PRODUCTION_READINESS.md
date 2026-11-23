# Kodera Academy — İstehsal Hazırlığı və Staging Keçid Planı (`PRODUCTION_READINESS.md`)

> **Qiymətləndirmə tarixi:** 2026-11-24  
> **Cari Status:** **`2. READY FOR STAGING TESTING`**  
> **Hədəf Status:** `3. READY FOR PRODUCTION DEPLOYMENT` (aşağıdakı Staging Qapısı tamamlandıqdan sonra)

---

## 1. Hazırlıq Matrisi

| Sahə | Kod Bazası Hazırlığı | Canlı Mühit Doğrulaması | Qeyd |
| :--- | :-: | :-: | :--- |
| **Frontend Arxitektura & UI/UX** | **HAZIR** | Staging-də smoke test | 72 Chrome viewport yoxlaması (375/768/1440px), 0 overflow, 0 WCAG iç-içə düymə, 0 console error |
| **Backend API & Vercel Functions** | **HAZIR** | **Staging-də məcburi** | 5 düz funksiya (`api/*.ts`), `vercel.json` `?__route=` rewrite-ları, Node ESM `.js` importları |
| **PostgreSQL Sxem, RLS & İndekslər** | **HAZIR** | **Staging-də məcburi** | 7 SQL miqrasiyası (`0001`–`0007`), 23 cədvəl RLS, 14 yeni performans indeksi, `[db.seed]` |
| **Autentifikasiya & E-poçt Axınları** | **HAZIR** | **Staging-də məcburi** | Real Supabase Auth təsdiq/bərpa linkləri və `secure_password_change` yoxlanılmalıdır |
| **İnteraktiv Python (Pyodide)** | **HAZIR** | **Staging-də məcburi** | Harness real Python 3.12 ilə keçdi; daraldılmış CSP altında canlı CDN WASM yüklənməsi yoxlanılmalıdır |
| **Təhlükəsizlik & Asılılıqlar** | **HAZIR** | **Staging-də RLS testi** | `security:check` 0 pozuntu, `npm audit` 0 boşluq, production sandbox sərt bloklanıb |
| **Performans & Bundle** | **HAZIR** | Staging-də Lighthouse | Əsas JS 112.94 kB gzip, CSS 8.25 kB gzip, Admin/Student panelləri `React.lazy` ilə ayrılıb |
| **CI/CD & Git** | **HAZIR** | GitHub remote gözləyir | `.github/workflows/ci.yml` hazırdır; private remote URL əlavə edilməlidir |

---

## 2. Mühit Dəyişənləri İnventarı (Vercel & `.env.local`)

> **TƏHLÜKƏSİZLİK QAYDASI:** Heç bir secret dəyəri repozitoriyaya, frontend koduna və ya çat mesajlarına yazılmamalıdır.

| Dəyişən | Sahə | Tələb | Təsvir |
| :--- | :---: | :---: | :--- |
| `VITE_SUPABASE_URL` | Frontend + Server | Məcburi | `kodera-dev` (Staging) və ya `kodera-prod` (Production) layihə URL-i |
| `VITE_SUPABASE_ANON_KEY` | Frontend + Server | Məcburi | Yalnız ictimai `anon` / publishable açar |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yalnız Server** | Məcburi | Heç vaxt `VITE_` prefiksi verilməməlidir! Yalnız Vercel Environment Variables-da (Encrypted) |
| `APP_URL` | **Yalnız Server** | Production-da məcburi | Dəqiq `https://...` domen (məs. `https://kodera.academy`) — localhost production-da rədd edilir |
| `VITE_APP_NAME` | Frontend | Opsional | Default: `Kodera` |
| `KODERA_LOCAL_SANDBOX` / `VITE_LOCAL_SANDBOX` | **Yalnız Lokal Dev** | Production-da qadağandır | Production/Vercel mühitində `getRepository.ts` sandbox-u avtomatik rədd edir |

---

## 3. Staging-dən Production-a Keçid Qapısı (Məcburi 7 Addım)

Layihəni **`2. READY FOR STAGING TESTING`** mərhələsindən **`3. READY FOR PRODUCTION DEPLOYMENT`** mərhələsinə çıxarmaq üçün aşağıdakı 7 addım ardıcıllıqla icra edilməlidir:

### Addım 1 — Private GitHub Repo & CI Doğrulaması
1. Private GitHub repository yaradın, lokal `main` budağını qoşun (`git remote add origin ... && git push -u origin main`).
2. `.github/workflows/ci.yml` pipeline-ının yaşıl keçdiyini təsdiqləyin.

### Addım 2 — `kodera-dev` (Staging) Supabase Miqrasiya & Seed
1. `kodera-dev` Supabase layihəsi yaradın (`supabase/migrations/202611230001`–`0007` ardıcıllıqla icra edin).
2. `supabase/seeds/01_python_intro_modules.sql` faylını icra edin (idempotent).
3. Supabase Auth > URL Configuration bölməsində `Site URL` və `Redirect URLs` (`/reset-password`, `/login`) dəyərlərini staging domenə uyğunlaşdırın.
4. İlk admin hesabını yaradıb `public.user_roles` cədvəlində `role = 'admin'`, `public.profiles` cədvəlində `account_status = 'active'` təyin edin.

### Addım 3 — Vercel Staging (Preview) Deployment & API Rewrite Testi
1. Vercel-də layihəni bağlayın, `kodera-dev` mühit dəyişənlərini (Preview/Staging) əlavə edin.
2. Deploy sonrası yoxlayın:
   - `GET /api/health` → `200 OK` (`mode: "supabase"`)
   - `GET /api/public/settings` → `200 OK` (`Cache-Control` mövcuddur, WhatsApp ayarları düzgündür)
   - `GET /api/public/courses` → `200 OK` (Python + SQL kursları, `first_public_lesson_slug` doludur)
   - `GET /api/admin/students` (token olmadan) → `401 UNAUTHORIZED`
   - Cavab başlıqları: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.

### Addım 4 — Canlı Supabase Auth & E-poçt Yoxlaması
1. Yeni test tələbəsi ilə qeydiyyatdan keçin → real təsdiq e-poçtunun gəldiyini, linkin işlədiyini və `"Təsdiq emailini yenidən göndər"` funksiyasının işlədiyini yoxlayın.
2. `ForgotPasswordPage` → real bərpa linki → `ResetPasswordPage` ilə şifrəni yeniləyin; yeniləmədən sonra sessiyanın bağlandığını (`signOut`) və yeni şifrə ilə girişin işlədiyini təsdiqləyin.
3. Aktiv tələbə kimi `StudentSettingsPage`-də şifrə dəyişikliyini test edin (`secure_password_change = true` davranışını yoxlayın — bax: `KNOWN_ISSUES.md` `LIM-02`).

### Addım 5 — Canlı PostgREST RLS Penetrasiya Yoxlaması
1. `anon` açarı ilə birbaşa PostgREST üzərindən `profiles`, `applications`, `enrollments`, `audit_logs`, `rate_limit_events` oxumağın və `/rpc/check_and_record_rate_limit` / `/rpc/review_application_atomic` çağırmağın bloklandığını təsdiqləyin.
2. Aktiv tələbə JWT-si ilə `quiz_question_options` cədvəlində `is_correct` sütununun seçilməsinin bloklandığını və başqa tələbənin profilinin görünmədiyini təsdiqləyin.
3. Admin panelində tələbə müraciətini təsdiq edib (`review_application_atomic`), sonra Python kursunu təyin edin, sonra tələbəni suspend/reactivate edin (`guard_profile_sensitive_columns` `service_role` işləməsini təsdiqləyin).

### Addım 6 — Canlı Brauzerdə Pyodide `v0.27.5` Smoke Testi
1. Staging URL-də Chrome DevTools Console açıq halda Python dərsini açın (`1.2 İlk Python proqramın`).
2. Düzgün kod yazın → "Kodu İşlət" → WASM yüklənməsinin və testlərin keçməsinin 0 CSP xətası ilə işlədiyini doğrulayın.
3. `while True: pass` ilə timeout terminasiyasını və `import js` ilə sandbox bloklamasını yoxlayın.

### Addım 7 — Production (`kodera-prod`) Keçidi
1. Yuxarıdakı 6 addım 100% keçdikdən sonra ayrıca `kodera-prod` Supabase layihəsi yaradın, `0001`–`0007` miqrasiyalarını və seed-i icra edin.
2. `kodera-prod`-da günlük avtomatik ehtiyat nüsxəni (PITR/Daily Backups), custom SMTP (SPF/DKIM/DMARC), Vercel Production env-lərini və xəta/uptime monitorinqini aktivləşdirin.

---

## 4. Performans və Miqyaslanma Xülasəsi

- **Production Bundle (`vite build`):**
  - `dist/assets/index-*.js`: `385.95 kB` (`112.94 kB` gzip)
  - `dist/assets/index-*.css`: `43.79 kB` (`8.25 kB` gzip)
  - `dist/assets/vendor-react-*.js`: `51.60 kB` (`18.14 kB` gzip)
  - `dist/assets/vendor-prism-*.js`: `86.06 kB` (`26.76 kB` gzip)
  - `dist/assets/vendor-forms-*.js`: `131.28 kB` (`39.99 kB` gzip)
  - `dist/assets/vendor-supabase-*.js`: `230.49 kB` (`60.05 kB` gzip)
  - `dist/assets/python.worker-*.js`: `6.57 kB` (ayrı Web Worker)
  - Bütün 17 Tələbə və Admin səhifəsi `React.lazy` ilə ayrıca yüklənir (`1.5 kB`–`15.6 kB`).
- **PostgreSQL İndeksləməsi:** `202611230007` miqrasiyası ilə 14 çatışmayan FK və hot-query indeksi əlavə edildi, 2 artıq indeks təmizləndi — çoxkurslu miqyaslanma (Python, C++, SQL, JS, AI və s.) üçün tam hazırdır.
