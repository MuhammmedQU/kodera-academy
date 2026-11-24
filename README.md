# Kodera — Çoxkurslu Onlayn Proqramlaşdırma Akademiyası (LMS)

**Kodera** — proqramlaşdırmanı sadə, aydın, strukturlaşdırılmış və interaktiv dərslərlə öyrədən, çoxkurslu genişlənməyə hazır müasir təhsil platformasıdır. İlkin kurs **Python** olmaqla yanaşı, arxitektura C++, SQL, JavaScript, Web Development, Data Structures & Algorithms, Data Science, Machine Learning və AI kurslarını kod dəyişmədən Admin Paneldən əlavə etməyə imkan verir.

## Texnologiya Yığını
- **Frontend:** React 19, TypeScript (strict), Vite 6, Tailwind CSS v4, React Router v7
- **Backend:** Vercel Serverless Functions (`api/` + `server/`)
- **Verilənlər Bazası & Auth & Storage:** Supabase PostgreSQL (23 cədvəl + sərt RLS), Supabase Auth, Supabase Storage
- **Validasiya & Formalar:** Zod, React Hook Form
- **İnteraktiv Python İcrası:** Brauzerdə izolyasiya olunmuş Web Worker + Pyodide `v0.27.5` (backend-də tələbə kodu icra olunmur)
- **Testlər:** Vitest (38 unit/inteqrasiya/təhlükəsizlik testi), React Testing Library, Playwright Chrome E2E (4 tam səyahət + 72 viewport yoxlaması)

## Layihə Strukturu
```text
├── api/                       # 5 Vercel Serverless Function giriş nöqtəsi (health, public, auth, student, admin)
├── server/                    # Server-side auth, RBAC, rate-limit, audit log və Supabase/Sandbox repozitoriyaları
├── src/
│   ├── app/                   # Router, AuthProvider, SettingsProvider
│   ├── components/            # Kodera dizayn sistemi UI komponentləri və layout-lar
│   ├── features/              # public, auth, student, admin, lessons, python-runner
│   ├── lib/                   # Supabase client (yalnız anon key), API client, utilitlər
│   └── shared/                # Frontend + Backend ortaq TypeScript tipləri və Zod sxemləri
├── supabase/
│   ├── config.toml            # kodera-dev Supabase CLI konfiqurasiyası
│   ├── migrations/            # 7 ardıcıl PostgreSQL sxem, RLS və sərtləşdirmə miqrasiyası (20261123000001..000007)
│   ├── seeds/                 # İdempotent Python Modul 1–2 tədris məzmunu (01_python_intro_modules.sql)
│   └── bootstrap/             # İlk admin hesabının aktivləşdirilməsi (promote_first_admin.sql)
├── scripts/                   # security-check.mjs, check-env.mjs, verify-staging.mjs, dev-sandbox.mjs
├── tests/                     # Unit, Integration/Security və Playwright E2E testləri
└── docs/                      # Arxitektura, müstəqil audit, təhlükəsizlik və staging/production bələdçiləri
```

## Lokal Başlatma

### 1. Asılılıqların quraşdırılması
```bash
npm install
```

### 2. Mühit dəyişənləri (Real `kodera-dev` Supabase layihəsi ilə)
`.env.example` faylını `.env.local` kimi kopyalayın, `kodera-dev` Supabase layihəsinin dəyərlərini doldurun (heç vaxt `.env.local`-ı Git-ə commit etməyin) və doğruluğunu yoxlayın:
```bash
npm run env:check
npm run dev
```

### 3. Lokal Sandbox Rejimi (Supabase açarları olmadan lokal baxış və E2E test)
```bash
npm run dev:sandbox
```

## Yoxlama, Təhlükəsizlik və Staging Doğrulama Əmrləri
```bash
npm run typecheck       # TypeScript strict yoxlama
npm run lint            # ESLint kod keyfiyyəti yoxlaması
npm run test            # Vitest unit, API, təhlükəsizlik və Python kurikulum testləri (38 test)
npm run test:e2e        # Playwright Chrome E2E və 72-viewport responsiv audit (4 test)
npm run build           # Production Vite build
npm run security:check  # Statik secret-leak, XSS, bundle və .env şablon yoxlaması
npm run env:check       # Lokal .env.local konfiqurasiya doğrulaması (secret çap etmədən)
npm run staging:verify  # Canlı Staging URL + PostgREST anon RLS penetrasiya yoxlaması
```

## Əsas Sənədləşmə
- [GitHub-dan Əvvəl Yekun Hazırlıq Yoxlama Siyahısı](docs/PRE_GITHUB_FINAL_CHECKLIST.md)
- [Müstəqil Yekun Audit Hesabatı](docs/FINAL_AUDIT_REPORT.md)
- [Müstəqil Təhlükəsizlik Auditi Hesabatı](docs/SECURITY_AUDIT_REPORT.md)
- [İstehsal Hazırlığı və Staging Keçid Planı](docs/PRODUCTION_READINESS.md)
- [Staging Deployment və Doğrulama Siyahısı](docs/STAGING_DEPLOYMENT_CHECKLIST.md)
- [Məlum Məsələlər və Bloklayıcılar](docs/KNOWN_ISSUES.md)
- [Layihə Statusu](docs/PROJECT_STATUS.md)
- [İnkişaf Jurnalı](docs/DEVELOPMENT_LOG.md)
