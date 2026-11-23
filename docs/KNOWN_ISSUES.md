# Kodera Academy — Məlum Məsələlər və Bloklayıcılar (`KNOWN_ISSUES.md`)

> **Son yenilənmə:** 2026-11-23 (Faza 3 sonrası)

## 1. Xarici Resurs / Mühit Bloklayıcıları
| ID | Məsələ | Təsir | Həll / Sahibin Addımı |
| :---: | :--- | :---: | :--- |
| **BLK-01** | Canlı `kodera-dev` Supabase layihəsi hələ qoşulmayıb | Real PostgreSQL mühitində `supabase/migrations/` icrası və canlı RLS testləri gözləyir | Layihə sahibi `kodera-dev` Supabase layihəsini yaradıb `.env.local` faylına mühit dəyişənlərini daxil etdikdən sonra miqrasiyalar icra olunacaq |
| **BLK-02** | GitHub Private Remote URL qoşulmayıb | Kod yalnız lokal Git repository-də saxlanılır | Layihə sahibi private GitHub repo yaradıb `git remote add origin ...` icra edəcək |
| **BLK-03** | Production Deployment (`kodera-prod` + Vercel) | Qaydalar üzrə açıq icazə olmadan canlı deploy aparılmır | Faza 11 checklist-i tamamlandıqdan sonra layihə sahibinin təsdiqi ilə icra ediləcək |

## 2. Texniki Qeydlər (Açıq)
| ID | Məsələ | Prioritet | Plan |
| :---: | :--- | :---: | :--- |
| **TECH-01** | Production build əsas JS chunk ölçüsü 522 kB (React + Supabase + router bir chunk-da) | Aşağı | Faza 5–6-da `React.lazy` marşrut bölməsi və `manualChunks` tətbiq ediləcək |
| **TECH-02** | `devDependencies`-də `vitest` 3.x transitiv `@vitest/mocker` dev xəbərdarlığı (prod bundle-a daxil deyil) | Aşağı | Faza 10 QA auditində `vitest` yenilənməsi sınaqdan keçiriləcək |
