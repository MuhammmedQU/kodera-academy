# Kodera Academy — İnkişaf Jurnalı (`DEVELOPMENT_LOG.md`)

## 2026-11-23 — Faza 0, 1, 2 (Təsdiqlənmiş Təməl)
- Faza 0: Boş iş qovluğu, Node 24 / npm 11 / Git / Python mühiti yoxlanıldı, texnologiya yığını və ayrı Supabase Dev/Prod strategiyası təsdiqləndi.
- Faza 1: **Kodera** brendi, palitra (`#18181B`, `#4338CA`, `#F59E0B`, `#FAFAF9`, `#FFFFFF`) və 3 sahəlik məhsul strukturu təsdiqləndi.
- Faza 2: 23 cədvəllik PostgreSQL sxemi, Mermaid ER diaqramları, RLS siyasətləri, 6 ardıcıl SQL miqrasiya faylı və 24 ssenarilik təhlükəsizlik test planı yaradıldı.

## 2026-11-23 — Faza 3: Layihə Təməli və Dizayn Sistemi
- React 19 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + React Router v7 quruldu.
- Kodera dizayn sistemi (12 UI komponenti + `PublicLayout` + `DashboardLayout`) və ortaq domain/Zod sxemləri yaradıldı.
- `@vercel/node` (93 artıq paket və dev boşluqları) silindi, `zod@latest`-ə yüksəldildi → `npm audit --omit=dev` 0 vulnerability.
- `typecheck`, `lint`, `vitest` (7/7), `security:check`, `build` tam keçdi.
- Lokal Git repository (`main`) yaradıldı.

## 2026-11-23 — Faza 4: Autentifikasiya, Qeydiyyat və Server API Təməli
- 5 Vercel Serverless Function router (`api/`) + `SupabaseRepository` + dev-only `LocalSandboxRepository` + Zod/RBAC/RateLimit server qatı quruldu.
- Qeydiyyat (`PENDING` + `KDR-YYYY-XXXXXX`), Giriş, Şifrə bərpası, Qorunan marşrutlar, `/application-status` və admin-tənzimlənən WhatsApp klik-to-chat düyməsi yaradıldı.
- `typecheck`, `lint`, `vitest` (14/14 test, o cümlədən 6 təhlükəsizlik inteqrasiya testi), `security:check`, `build` tam keçdi.
