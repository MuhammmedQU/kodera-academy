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

## 2026-11-24 — Faza 5: Admin Paneli və Server-Side İdarəetmə
- 11 lazy-loaded Admin səhifəsi (Statistika, Müraciətlər + Daxili Qeydlər, Tələbələr, Kurs Təyinatları, Kurs/Modul/Dərs/11 Blok/Məşq/Quiz CMS, Platforma/WhatsApp Ayarları, Audit Jurnalı) yaradıldı.
- Testlər nəticəsində Zod `.partial()` default xətası aşkarlandı və ayrıca `*PatchSchema` sxemləri ilə düzəldildi.
- `typecheck`, `lint`, `vitest` (18/18 test), `security:check`, `build` tam keçdi.

## 2026-11-24 — Faza 6: Tələbə Paneli və LMS
- 11 kontent blokunu dəstəkləyən `LessonContentRenderer`, `CodeBlock` (Prism syntax highlighting + copy), `QuizBlock` (server-side qiymətləndirmə), `ExerciseBlock` və `RegistrationInvitationCard` yaradıldı.
- Lazy-loaded Tələbə Paneli (`/dashboard`, kurslar, kurikulum, dərs oxuyucu, irəliləyiş, profil, hesab tənzimləmələri) tamamlandı.
- `typecheck`, `lint`, `vitest` (22/22 test), `security:check`, `build` tam keçdi.

## 2026-11-24 — Faza 7: İnteraktiv Python Öyrənmə Mühiti (Pyodide Web Worker)
- `ExerciseBlock` Tab (4 boşluq) və əl ilə Dayandır düyməsi ilə təkmilləşdirildi.
- `PYTHON_RUNNER_HARNESS` real Python 3.12 ilə (`print`, `input`, `assertion_code`, xəta, stdout limiti) və `PythonWorkerRunner` sonsuz döngü `worker.terminate()` testi ilə təsdiqləndi (28/28 test).
- Brauzerdə görünən test hallarının və CDN yükləməsinin məhdudiyyətləri sənədləşdirildi.

## 2026-11-24 — Faza 8: İlk İki Python Modulunun Tədris Məzmunu
- Sıfırdan başlayanlar üçün 2 pulsuz modul (8 dərs, 7 interaktiv məşq, 8 quiz) və idempotent `supabase/seeds/01_python_intro_modules.sql` (494 sətir) hazırlandı.
- Bütün 7 məşqin həlləri real Python 3.12 harness-də 100% keçdi (8 fayl, 31/31 test).

## 2026-11-24 — Faza 9: İctimai Vebsayt və Marketinq Təcrübəsi
- Tam Ana Səhifə, Kurslar Kataloqu, Kurs Detalları, İctimai Dərs Oxuyucu (+ Modul 2 sonu Qeydiyyat Dəvəti), Haqqımızda, Məxfilik və İstifadə Şərtləri tamamlandı.
- `vite.config.ts`-də `manualChunks` əlavə edildi (`TECH-01` həll olundu).
- `typecheck`, `lint` (0 xəta, 0 xəbərdarlıq), `vitest` (31/31 test), `security:check`, `build` tam keçdi.

## 2026-11-24 — Faza 10: Təhlükəsizlik və Keyfiyyət Auditi (QA)
- `security-audit-extended.test.ts` (SQLi, Zod, Prod sandbox bloklama, 6 SQL miqrasiya & 23 cədvəl RLS statik audit) və `tests/e2e/kodera-e2e.spec.ts` (4 real Chrome Playwright axını) yazıldı.
- `PublicLayout.tsx` əlçatanlıq (`<a><button>`), `dev-sandbox.mjs` `DEP0190` və `vitest@5.1.1` yenilənməsi (`npm audit` → **0 vulnerability**) tamamlandı.
- 35/35 Vitest + 4/4 Chrome Playwright E2E + `typecheck` + `lint` + `security:check` + `build` tam keçdi.

## 2026-11-24 — Faza 11: Production Deployment Hazırlığı
- `vercel.json` (SPA rewrites + HSTS/CSP/security headers), `supabase/config.toml`, `.github/workflows/ci.yml` və `docs/11-deployment-guide-and-checklist.md` hazırlandı.
- Xarici/geri dönməz əməliyyatlar (canlı deploy, domen, real email) sahibinin icazəsi üçün saxlanıldı.

## 2026-11-24 — Müstəqil Yekun Audit və İstehsal Hazırlığı Sərtləşdirməsi
- Bütün layihə sıfırdan 3 paralel müstəqil audit qolu (DB/RLS, Backend/Security/Vercel, Frontend/UX/A11y/Python) və canlı 72-viewport Chrome testi ilə yoxlanıldı.
- **SQL & RLS (`202611230007_audit_security_hardening_and_indexes.sql`):** `guard_profile_sensitive_columns()` PostgREST v11+ düzəlişi, `check_and_record_rate_limit()` anon DoS bağlanması, `get_public_platform_settings()` `service_role` icazəsi, 5 `SECURITY DEFINER` `search_path = ''` kilidlənməsi, `submit_quiz_attempt` DB rate limit, `review_application_atomic` RPC, `audit_logs` `BEFORE TRUNCATE`, `REVOKE ALL` minimal grant-lar və 14 yeni indeks əlavə edildi.
- **Vercel & API:** 5 düz `api/*.ts` funksiyası + `vercel.json` `?__route=` rewrite + daraldılmış CSP + Node ESM `.js` importları; `listStudents()` FK `PGRST201` düzəlişi; admin özünü suspend & `PENDING` bypass bloklaması; `assertNoDbError` xam SQL sızmasının qarşısı; `POST /api/auth/logout` və `resend-verification`; 1 MB JSON body limiti; IP validasiyası (`isIP`).
- **Frontend, UX, A11y & Python Runner:** `tailwind-merge`, `<ButtonLink>` (54 iç-içə `<Link><Button>` silindi), Admin CMS `UNIQUE(sort_order)` 409 düzəlişi + tam Edit/Confirm modalları, `DashboardLayout` çıxış redirect yarışı (`justLoggedOut`) düzəlişi, `dist/`-dən dev parolların çıxarılması, Python harness `AssertionError` ayrılması və `import js` bloklaması.
- **Yoxlama:** `typecheck` (0), `lint` (0), `vitest` (38/38), `playwright` Chrome E2E (4/4, 72 viewport = 0 overflow / 0 `a button` / 0 console error), `build`, `security:check` (0 pozuntu), `npm audit` (0 vulnerability).
- **Yekun hesabatlar:** `docs/FINAL_AUDIT_REPORT.md`, `docs/SECURITY_AUDIT_REPORT.md`, `docs/PRODUCTION_READINESS.md`, `docs/KNOWN_ISSUES.md` — Təsnifat: **`2. READY FOR STAGING TESTING`**.
