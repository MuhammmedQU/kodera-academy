# Kodera Academy — Layihə Statusu (`PROJECT_STATUS.md`)

> **Son yenilənmə:** 2026-11-24  
> **Cari Mərhələ:** Faza 0 – Faza 11 tamamlandı (Avtonom inkişaf mərhələsi yekunlaşdı; xarici Supabase / GitHub / Vercel qoşulması gözləyir)

| Faza | Adı | Status | Hesabat |
| :-: | :--- | :---: | :--- |
| 0 | Kəşfiyyat və Layihə Yoxlaması | Tamamlandı | Faza 0 hesabatı (təsdiqlənib) |
| 1 | Brend (Kodera) və Məhsul Arxitekturası | Tamamlandı | [01-brand-and-product-architecture.md](01-brand-and-product-architecture.md) |
| 2 | Verilənlər Bazası və Təhlükəsizlik Arxitekturası | Tamamlandı | [02-database-architecture.md](02-database-architecture.md), [02-rls-security-policies.md](02-rls-security-policies.md) |
| 3 | Layihə Təməli və Dizayn Sistemi | Tamamlandı | [03-phase-3-foundation-report.md](03-phase-3-foundation-report.md) |
| 4 | Autentifikasiya və Qeydiyyat | Tamamlandı | [04-phase-4-auth-report.md](04-phase-4-auth-report.md) |
| 5 | Admin Paneli | Tamamlandı | [05-phase-5-admin-dashboard-report.md](05-phase-5-admin-dashboard-report.md) |
| 6 | Tələbə Paneli və LMS | Tamamlandı | [06-phase-6-student-lms-report.md](06-phase-6-student-lms-report.md) |
| 7 | İnteraktiv Python Mühiti (Pyodide) | Tamamlandı | [07-phase-7-python-runner-report.md](07-phase-7-python-runner-report.md) |
| 8 | İlk İki Python Modulunun Məzmunu | Tamamlandı | [08-phase-8-python-content-report.md](08-phase-8-python-content-report.md) |
| 9 | İctimai Vebsayt və Marketinq Təcrübəsi | Tamamlandı | [09-phase-9-public-website-report.md](09-phase-9-public-website-report.md) |
| 10 | Təhlükəsizlik və Keyfiyyət Auditi (QA) | Tamamlandı | [10-phase-10-qa-security-report.md](10-phase-10-qa-security-report.md) |
| 11 | Deployment Hazırlığı | **Tamamlandı** | [11-phase-11-deployment-prep-report.md](11-phase-11-deployment-prep-report.md), [11-deployment-guide-and-checklist.md](11-deployment-guide-and-checklist.md) |

## Aktiv Mühit Bloklayıcıları (Xarici Resurslar)
- Real `kodera-dev` və `kodera-prod` Supabase layihə açarları hələ `.env.local`-a əlavə edilməyib (inkişaf lokal təhlükəsiz sandbox + avtomatlaşdırılmış testlərlə davam edir; canlı Supabase RLS yoxlaması açarlar əlavə olunduqda icra ediləcək).
- GitHub private remote URL-i hələ əlavə edilməyib (lokal Git repository aktivdir).
