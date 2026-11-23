# Kodera Academy — Məlum Məsələlər və Bloklayıcılar (`KNOWN_ISSUES.md`)

> **Son yenilənmə:** 2026-11-24 (Faza 11 sonrası)

## 1. Xarici Resurs / Mühit Bloklayıcıları
| ID | Məsələ | Təsir | Həll / Sahibin Addımı |
| :---: | :--- | :---: | :--- |
| **BLK-01** | Canlı `kodera-dev` Supabase layihəsi hələ qoşulmayıb | Real PostgreSQL mühitində `supabase/migrations/` (0001–0006), `supabase/seeds/01_python_intro_modules.sql`, canlı RLS siyasətləri, real Supabase Auth e-poçt göndərişi və Supabase Storage (`public-media`, `lesson-media`) imzalı URL-ləri hələ canlı test edilməyib | Layihə sahibi `kodera-dev` Supabase layihəsini yaradıb `.env.local` faylına mühit dəyişənlərini daxil etdikdən sonra [11-deployment-guide-and-checklist.md](11-deployment-guide-and-checklist.md) üzrə tətbiq edib test edəcək |
| **BLK-02** | GitHub Private Remote URL qoşulmayıb | Kod yalnız lokal Git repository-də saxlanılır; GitHub Actions CI (`.github/workflows/ci.yml`) hələ uzaq repoda işə salınmayıb | Layihə sahibi private GitHub repo yaradıb `git remote add origin ...` və `git push -u origin main` icra edəcək |
| **BLK-03** | Production Deployment (`kodera-prod` + Vercel) | Qaydalar üzrə açıq icazə olmadan canlı deploy aparılmır | Faza 11 checklist-i tamamlandıqdan sonra layihə sahibinin təsdiqi ilə icra ediləcək |

## 2. Texniki Qeydlər (Açıq)
| ID | Məsələ | Prioritet | Plan |
| :---: | :--- | :---: | :--- |
| **TECH-01** | ~~Production build əsas JS chunk ölçüsü 522 kB~~ | **HƏLL EDİLDİ** | Faza 9-da `React.lazy` + `vite.config.ts` `manualChunks` tətbiq edildi |
| **TECH-02** | ~~`devDependencies`-də `vitest` 3.x transitiv xəbərdarlığı~~ | **HƏLL EDİLDİ** | Faza 10-da `vitest@5.1.1`-ə yeniləndi → `npm audit` 0 vulnerability |
| **LIM-01** | Brauzerdə Pyodide icrası zamanı görünən test halları DevTools-da görünə bilər | Məhdudiyyət | Öyrənmə məşqləri üçün uyğundur; gələcəkdə imtahanlar üçün ayrıca izolyasiya olunmuş server sandbox əlavə oluna bilər |
| **LIM-02** | Canlı `cdn.jsdelivr.net` üzərindən Pyodide WASM yüklənməsi real brauzerdə smoke-test edilməlidir | Yoxlama | Python harness real Python 3.12 ilə, Worker timeout/terminasiya isə unit testlə yoxlanılıb; `npm run dev:sandbox` və ya Vercel Preview-də bir dəfə canlı brauzer "Kodu İşlət" smoke-testi aparılmalıdır |
