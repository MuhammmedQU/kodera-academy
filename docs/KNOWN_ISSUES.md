# Kodera Academy — Məlum Məsələlər, Həll Edilmiş Tapıntılar və Bloklayıcılar (`KNOWN_ISSUES.md`)

> **Son yenilənmə:** 2026-11-24 (Müstəqil Yekun Audit sonrası)

---

## 1. Xarici Resurs və Staging Bloklayıcıları (Production-dan Əvvəl Məcburi)

| ID | Məsələ | Status | Təsir | Sahibin / DevOps Addımı |
| :---: | :--- | :-: | :--- | :--- |
| **BLK-01** | Canlı `kodera-dev` / `kodera-prod` Supabase layihələri qoşulmayıb | **AÇIQ** | `supabase/migrations/` (`0001`–`0007`) və `supabase/seeds/01_python_intro_modules.sql` real PostgreSQL 15/16 mühitində hələ icra olunmayıb; canlı RLS siyasətləri, real Supabase Auth e-poçt təsdiqi/bərpası və Storage bucket-ləri canlı yoxlanılmayıb | `kodera-dev` Supabase layihəsini yaradıb `.env.local`-a əlavə etmək, bütün 7 miqrasiyanı və seed-i icra etmək, [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) üzrə canlı smoke və RLS testlərini keçmək |
| **BLK-02** | GitHub Private Remote URL qoşulmayıb | **AÇIQ** | Kod yalnız lokal Git `main` budağındadır; `.github/workflows/ci.yml` hələ uzaq repoda işlədilməyib | Private GitHub repository yaradıb `git remote add origin ...` və `git push -u origin main` icra etmək |
| **BLK-03** | Vercel Staging / Preview Deployment hələ icra edilməyib | **AÇIQ** | `vercel.json` rewrite qaydaları (`/api/<domain>/:path*` → `/api/<domain>?__route=:path*`), serverless soyuq başlanğıc (cold start), ESM idxalları və HTTP/CSP başlıqları real Vercel runtime-ında hələ yoxlanılmayıb | Vercel Preview/Staging mühitinə deploy edib bütün API marşrutlarını və təhlükəsizlik başlıqlarını real URL-də test etmək |
| **BLK-04** | Canlı Brauzerdə Pyodide CDN Yüklənməsi (`v0.27.5`) | **AÇIQ** | Python harness real Python 3.12 ilə, Worker timeout/terminasiya isə unit testlə təsdiqlənib, lakin daraldılmış CSP altında `https://cdn.jsdelivr.net/pyodide/v0.27.5/full/` WASM yüklənməsi canlı brauzer smoke-testi gözləyir | Staging URL-də Chrome DevTools açıq halda Python dərsində "Kodu İşlət" düyməsini test etmək və 0 CSP xətası olduğunu təsdiqləmək |

---

## 2. Məlum Arxitektura Məhdudiyyətləri və Qeydlər (Bloklayıcı Deyil)

| ID | Məsələ | Prioritet | İzah / Tövsiyə |
| :---: | :--- | :-: | :--- |
| **LIM-01** | Pyodide brauzer məşqlərində görünən test halları (`visible_test_cases`) | Məhdudiyyət | Öyrənmə məşqləri üçün uyğundur və `solution_code` heç vaxt brauzerə göndərilmir. Gələcəkdə sertifikatlı imtahanlar əlavə olunarsa, ayrıca izolyasiya olunmuş server sandbox (məs. konteyner əsaslı) əlavə edilə bilər |
| **LIM-02** | ~~`supabase/config.toml`-da `secure_password_change = true`~~ | **HƏLL EDİLDİ** | `supabase/config.toml` daxilində `secure_password_change = false` (Supabase Cloud default-u) təyin edildi ki, aktiv sessiyada `StudentSettingsPage` əlavə OTP şablonu olmadan şifrəni yeniləyə bilsin |
| **LIM-03** | ~~Rollup build zamanı `zod@4` `@__PURE__` şərh xəbərdarlığı~~ | **HƏLL EDİLDİ** | `vite.config.ts` `rollupOptions.onwarn` ilə `node_modules` `INVALID_ANNOTATION` xəbərdarlığı təmizləndi → `npm run build` 0 xəbərdarlıqla işləyir |
| **LIM-04** | `LocalSandboxRepository` yalnız lokal inkişaf və test üçündür | Məhdudiyyət | Production (`NODE_ENV=production` və ya `VERCEL=1`) mühitində kod səviyyəsində sərt şəkildə bloklanıb (`getRepository.ts` + inteqrasiya testi) |

---

## 3. Müstəqil Audit Zamanı Həll Edilmiş Məsələlər (Qapalı)

| ID | Əvvəlki Problem | Status | Həll |
| :-: | :--- | :-: | :--- |
| **AUD-01** | Vercel Vite layihəsində Next.js tipli `api/*/[...route].ts` marşrutları və ESM `.js` uzantılarının olmaması | **HƏLL EDİLDİ** | 5 düz funksiya (`api/{health,public,auth,student,admin}.ts`), `vercel.json` `?__route=` rewrite-ları və bütün server nisbi importlarında `.js` uzantıları |
| **AUD-02** | `guard_profile_sensitive_columns()`, `get_public_platform_settings()`, `check_and_record_rate_limit()` və `search_path` SQL boşluqları | **HƏLL EDİLDİ** | `supabase/migrations/20261123000007_audit_security_hardening_and_indexes.sql` |
| **AUD-03** | `SupabaseRepository.listStudents()` 3 qeyri-müəyyən FK səbəbindən PostgREST `PGRST201` çöküşü | **HƏLL EDİLDİ** | Açıq FK disambiguation (`!user_roles_user_id_fkey`, `!applications_user_id_fkey`, `!enrollments_student_id_fkey`) + real `completed_lessons_count` |
| **AUD-04** | Tailwind CSS v4 sinif toqquşmaları (`cn()` `tailwind-merge` olmadan): görünməz hover düymələri və aşağı kontrast | **HƏLL EDİLDİ** | `tailwind-merge` quraşdırıldı (`src/lib/cn.ts`), `Button` `outlineLight` variantı əlavə edildi |
| **AUD-05** | 54 ədəd etibarsız iç-içə `<Link><Button>` WCAG pozuntusu | **HƏLL EDİLDİ** | `<ButtonLink>` yaradıldı və bütün 22 faylda əvəzləndi (72 Chrome viewport yoxlamasında `a button` = 0) |
| **AUD-06** | Admin CMS-də blok/dərs/modul/kurs silindikdən sonra `UNIQUE(sort_order)` HTTP 409 çöküşü və Edit/Confirm əskiklikləri | **HƏLL EDİLDİ** | `Math.max(0, ...) + 1` sort hesablaması, bütün Edit/Delete/Suspend/Revoke/Reactivate modalları və Azərbaycan diakritikalı `slugifyAz` |
| **AUD-07** | Qorunan paneldən çıxış zamanı React Router v7 + React 19 yarış vəziyyəti (`/` əvəzinə `/login` yönləndirməsi) | **HƏLL EDİLDİ** | `AuthContext` `justLoggedOut` + `ProtectedRoute` + `PublicLayout` koordinasiyası (live Chrome E2E ilə təsdiqləndi) |
| **TECH-01** | Production build əsas JS chunk ölçüsü (522 kB) | **HƏLL EDİLDİ** | `React.lazy` + `manualChunks` (`index` 385.7 kB / 112.9 kB gzip) |
| **TECH-02** | `devDependencies` audit xəbərdarlıqları | **HƏLL EDİLDİ** | `vitest@5.1.1` + `vite@^6.4.0` → `npm audit` **0 vulnerability** |
