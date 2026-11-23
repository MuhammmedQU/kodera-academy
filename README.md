# Kodera — Çoxkurslu Onlayn Proqramlaşdırma Akademiyası (LMS)

**Kodera** — proqramlaşdırmanı sadə, aydın, strukturlaşdırılmış və interaktiv dərslərlə öyrədən, çoxkurslu genişlənməyə hazır müasir təhsil platformasıdır. İlkin kurs **Python** olmaqla yanaşı, arxitektura C++, SQL, JavaScript, Web Development, Data Structures & Algorithms, Data Science, Machine Learning və AI kurslarını kod dəyişmədən Admin Paneldən əlavə etməyə imkan verir.

## Texnologiya Yığını
- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, React Router v7
- **Backend:** Vercel Serverless Functions (`api/` + `server/`)
- **Verilənlər Bazası & Auth & Storage:** Supabase PostgreSQL (RLS), Supabase Auth, Supabase Storage
- **Validasiya & Formalar:** Zod, React Hook Form
- **İnteraktiv Python İcrası:** Brauzerdə izolyasiya olunmuş Web Worker + Pyodide (backend-də tələbə kodu icra olunmur)
- **Testlər:** Vitest, React Testing Library, Playwright E2E

## Layihə Strukturu
```text
├── api/                 # Vercel Serverless Function giriş nöqtələri (5 domen router)
├── server/              # Server-side auth, RBAC, rate-limit, audit log və handler-lər
├── src/
│   ├── app/             # Router, ErrorBoundary, AuthProvider, SettingsProvider
│   ├── components/      # Dizayn sistemi UI komponentləri və layout-lar
│   ├── features/        # public, auth, student, admin, lessons, python-runner
│   ├── lib/             # Supabase client (yalnız anon key), API client, utilitlər
│   └── shared/          # Frontend + Backend ortaq TypeScript tipləri və Zod sxemləri
├── supabase/migrations/ # Ardıcıl PostgreSQL sxem və RLS miqrasiya faylları
├── tests/               # Unit, Integration/Security və Playwright E2E testləri
└── docs/                # Arxitektura sənədləri, faza hesabatları, status və loglar
```

## Lokal Başlatma

### 1. Asılılıqların quraşdırılması
```bash
npm install
```

### 2. Mühit dəyişənləri (Real Supabase Dev layihəsi ilə)
`.env.example` faylını `.env.local` kimi kopyalayın və `kodera-dev` Supabase layihəsinin dəyərlərini doldurun (heç vaxt `.env.local`-ı Git-ə commit etməyin):
```bash
npm run dev
```

### 3. Lokal Sandbox Rejimi (Supabase açarları olmadan lokal baxış və E2E test)
```bash
npm run dev:sandbox
```

## Yoxlama və Test Əmrləri
```bash
npm run typecheck       # TypeScript strict yoxlama
npm run lint            # ESLint kod keyfiyyəti yoxlaması
npm run test            # Vitest unit və API/təhlükəsizlik testləri
npm run test:e2e        # Playwright E2E brauzer testləri
npm run security:check  # Statik secret-leak & XSS yoxlaması
npm run build           # Production build
```

## Sənədləşmə
- [Layihə Statusu](docs/PROJECT_STATUS.md)
- [İnkişaf Jurnalı](docs/DEVELOPMENT_LOG.md)
- [Məlum Məsələlər və Bloklayıcılar](docs/KNOWN_ISSUES.md)
- [Brend və Məhsul Arxitekturası](docs/01-brand-and-product-architecture.md)
- [Verilənlər Bazası Arxitekturası](docs/02-database-architecture.md)
- [RLS və Təhlükəsizlik Siyasətləri](docs/02-rls-security-policies.md)
