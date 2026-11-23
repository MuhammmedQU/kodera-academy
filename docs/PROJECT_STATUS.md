# Kodera Academy — Layihə Statusu (`PROJECT_STATUS.md`)

> **Son yenilənmə:** 2026-11-24  
> **Cari Mərhələ:** Faza 5 tamamlandı → Faza 6 icra olunur

| Faza | Adı | Status | Hesabat |
| :-: | :--- | :---: | :--- |
| 0 | Kəşfiyyat və Layihə Yoxlaması | Tamamlandı | Faza 0 hesabatı (təsdiqlənib) |
| 1 | Brend (Kodera) və Məhsul Arxitekturası | Tamamlandı | [01-brand-and-product-architecture.md](01-brand-and-product-architecture.md) |
| 2 | Verilənlər Bazası və Təhlükəsizlik Arxitekturası | Tamamlandı | [02-database-architecture.md](02-database-architecture.md), [02-rls-security-policies.md](02-rls-security-policies.md) |
| 3 | Layihə Təməli və Dizayn Sistemi | Tamamlandı | [03-phase-3-foundation-report.md](03-phase-3-foundation-report.md) |
| 4 | Autentifikasiya və Qeydiyyat | Tamamlandı | [04-phase-4-auth-report.md](04-phase-4-auth-report.md) |
| 5 | Admin Paneli | **Tamamlandı** | [05-phase-5-admin-dashboard-report.md](05-phase-5-admin-dashboard-report.md) |
| 6 | Tələbə Paneli və LMS | İcra olunur | — |
| 7 | İnteraktiv Python Mühiti (Pyodide) | Gözləyir | — |
| 8 | İlk İki Python Modulunun Məzmunu | Gözləyir | — |
| 9 | İctimai Vebsayt və Marketinq Təcrübəsi | Gözləyir | — |
| 10 | Təhlükəsizlik və Keyfiyyət Auditi (QA) | Gözləyir | — |
| 11 | Deployment Hazırlığı | Gözləyir | — |

## Aktiv Mühit Bloklayıcıları (Xarici Resurslar)
- Real `kodera-dev` və `kodera-prod` Supabase layihə açarları hələ `.env.local`-a əlavə edilməyib (inkişaf lokal təhlükəsiz sandbox + avtomatlaşdırılmış testlərlə davam edir; canlı Supabase RLS yoxlaması açarlar əlavə olunduqda icra ediləcək).
- GitHub private remote URL-i hələ əlavə edilməyib (lokal Git repository aktivdir).
