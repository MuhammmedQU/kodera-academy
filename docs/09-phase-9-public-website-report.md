# Kodera — Faza 9 Hesabatı: İctimai Vebsayt və Marketinq Təcrübəsi

> **Tarix:** 2026-11-24  
> **Faza:** Faza 9 — Public Website & Marketing Experience  
> **Status:** Tamamlandı və yoxlanıldı

## 1. Nə tamamlandı?
- **Ana Səhifə (`/` — `HomePage.tsx`):** Kodera dəyər təklifi, interaktiv Python kod önizləməsi, "Niyə Kodera?" 4 pedaqoji prinsip, verilənlər bazasından gələn aktiv kurslar, çoxkurslu yol xəritəsi (Python, SQL, C++, JS, Web, DSA, Data Science, ML, AI), şəffaf 4 addımlıq qəbul prosesi və şişirtməsiz CTA-lar.
- **Kurs Kataloqu (`/courses` — `CoursesPage.tsx`):** Axtarış/filtr, dil və çətinlik nişanları, modul/dərs sayları və "İlk 2 modul pulsuz" göstəricisi.
- **Kurs Detalları (`/courses/:slug` — `CourseDetailPage.tsx`):** Kurs təsviri, öyrənmə məqsədləri, hədəf auditoriya, verilənlər bazasından idarə olunan kurikulum (`Pulsuz / İctimai` vs `Təsdiqli tələbələr üçün`) və Qeydiyyat Dəvəti.
- **İctimai Dərs Oxuyucu (`/courses/:slug/lessons/:lessonSlug` — `PublicLessonPage.tsx`):** Yalnız `is_public = true` və `published` dərsləri açır, bütün 11 kontent blokunu və Pyodide interaktiv məşqlərini işlədir; 2-ci modulun son dərsində (`is_last_public_lesson`) və ya kilidli dərsə birbaşa keçiddə (`403 LESSON_RESTRICTED`) **`RegistrationInvitationCard`** göstərir.
- **Akademiya Haqqında (`/about`), Məxfilik Siyasəti (`/privacy`), İstifadə Şərtləri (`/terms`).**
- **Bundle Optimizasiyası (`vite.config.ts`):** `manualChunks` (`vendor-react`, `vendor-supabase`, `vendor-forms`, `vendor-prism`) əlavə edilərək əsas JS chunk ölçüsü 500 kB-dan aşağı salındı (`TECH-01` bağlandı).

## 2. Niyə bu cür tətbiq olundu?
- Ziyarətçi qeydiyyatdan keçmədən əvvəl 2 tam Python modulunun real tədris keyfiyyətini görür; heç bir saxta "1 aya senior ol" vədi verilmir, əvəzində dürüst və aydın qəbul prosesi təqdim olunur.
- Bütün pulsuz/məhdud nişanlar frontend-də hardcode edilmir — birbaşa `/api/public/courses/*` (verilənlər bazası `modules.is_public`) cavabından oxunur.

## 3. Yaradılan və ya dəyişdirilən fayllar
- `src/features/public/HomePage.tsx`, `CoursesPage.tsx`, `CourseDetailPage.tsx`, `PublicLessonPage.tsx`, `AboutPage.tsx`, `PrivacyPolicyPage.tsx`, `TermsOfServicePage.tsx`
- `src/App.tsx`, `vite.config.ts`

## 4. İcra olunan testlər və faktiki nəticələr
| Yoxlama | Əmr | Nəticə |
| :--- | :--- | :--- |
| TypeScript strict | `npm run typecheck` | **KEÇDİ** (0 xəta) |
| ESLint | `npm run lint` | **KEÇDİ** (0 xəta, 0 xəbərdarlıq) |
| Vitest paketi | `npm run test` | **KEÇDİ** (8 fayl, **31/31 test**) |
| Statik təhlükəsizlik skaneri | `npm run security:check` | **KEÇDİ** (0 pozuntu) |
| Production build (`manualChunks`) | `npm run build` | **KEÇDİ** |

## 5. Aşkar olunan xətalar və həlli
- `HomePage` unit testində qismən `fetch` mock-una qarşı `Array.isArray(data)` müdafiəsi əlavə edildi.

## 6. Növbəti faza (Faza 10)
**Faza 10 — Təhlükəsizlik və Keyfiyyət Auditi (QA):** Genişləndirilmiş təhlükəsizlik testləri (XSS, SQLi, RBAC, enrollment izolyasiyası, quiz/audit/rate-limit), real Chromium **Playwright E2E testləri** (ictimai axın, qeydiyyat + WhatsApp, admin təsdiq + ayrıca kurs təyini, tələbə paneli, mobil responsive yoxlama), `npm audit` və tam production build yoxlaması.
