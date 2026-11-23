# Kodera — Faza 6 Hesabatı: Tələbə Paneli və LMS

> **Tarix:** 2026-11-24  
> **Faza:** Faza 6 — Student Dashboard & LMS  
> **Status:** Tamamlandı və yoxlanıldı

## 1. Nə tamamlandı?
- **11 Bloklu Strukturlaşdırılmış Dərs Mühiti (`src/features/lessons/`):**
  - `CodeBlock.tsx` — `prism-react-renderer` ilə sintaksis rəngləmə (Python, C++, SQL, JS, HTML, CSS), sətir nömrələri, kopyalama düyməsi, gözlənilən çıxış paneli.
  - `QuizBlock.tsx` — Təkseçimli/çoxseçimli/doğru-yanlış suallar; cavab açarları brauzerə **heç vaxt** göndərilmir; qiymətləndirmə yalnız serverdə (`POST /api/student/quizzes/:id/submit`) aparılır, sonra izah və cəhd tarixçəsi göstərilir.
  - `ExerciseBlock.tsx` — Tapşırıq təlimatı, açılıb-bağlanan ipucları, görünən test halları, kod redaktoru və Pyodide Web Worker icra interfeysi.
  - `LessonContentRenderer.tsx` — Bütün 11 blok növü (`heading`, `paragraph`, `image`, `code`, `explanation`, `example`, `note`, `warning`, `exercise`, `quiz`, `summary`), təhlükəsiz `isSafeUrl` yoxlaması və xam HTML inyeksiyası olmadan inline kod renderi.
  - `RegistrationInvitationCard.tsx` — Pulsuz 2-ci modulun sonunda və ya kilidli modullarda göstərilən şəffaf qeydiyyat dəvəti.
- **Tələbə Paneli (`src/features/student/`, `React.lazy` ilə kod-bölünmüş):**
  - Ümumi baxış (`/dashboard`) — "Qaldığın yerdən davam et", aktiv kurslar və irəliləyiş xülasəsi.
  - Mənim kurslarım (`/dashboard/courses`) — Yalnız administrator tərəfindən təyin olunmuş kurslar.
  - Kurs kurikulumu (`/dashboard/courses/:slug`) və Dərs oxuyucu (`/dashboard/courses/:slug/lessons/:lessonSlug`) — Tamamlama işarəsi (`PUT /api/student/lessons/:id/progress`) və əvvəlki/növbəti dərs naviqasiyası.
  - Öyrənmə irəliləyişi (`/dashboard/progress`), Tələbə profili (`/dashboard/profile`) və Hesab tənzimləmələri (`/dashboard/settings`).

## 2. Niyə bu cür tətbiq olundu?
- Təkrarlanan məntiqin qarşısını almaq üçün ictimai dərslər və tələbə dərsləri vahid `LessonContentRenderer` üzərində quruldu.
- Tələbə yalnız özünə təyin edilmiş kurslara girə bilir; təyin edilməmiş kursun URL-i yazıldıqda server `403 COURSE_NOT_ASSIGNED` qaytarır.

## 3. Yaradılan və ya dəyişdirilən fayllar
- Dərs sistemi: `src/features/lessons/CodeBlock.tsx`, `QuizBlock.tsx`, `ExerciseBlock.tsx`, `RegistrationInvitationCard.tsx`, `LessonContentRenderer.tsx`
- Tələbə paneli: `src/features/student/StudentLayout.tsx`, `StudentOverviewPage.tsx`, `StudentCoursesPage.tsx`, `StudentCourseCurriculumPage.tsx`, `StudentLessonPage.tsx`, `StudentProgressPage.tsx`, `StudentProfilePage.tsx`, `StudentSettingsPage.tsx`
- Python icra təməli: `src/features/python-runner/harness.ts`, `python.worker.ts`, `pythonRunner.ts`
- Marşrutlar: `src/App.tsx`
- Testlər: `tests/integration/api-student-lms.test.ts`, `tests/unit/lesson-renderer.test.tsx`

## 4. İcra olunan testlər və faktiki nəticələr
| Yoxlama | Əmr | Nəticə |
| :--- | :--- | :--- |
| TypeScript strict | `npm run typecheck` | **KEÇDİ** (0 xəta) |
| ESLint | `npm run lint` | **KEÇDİ** (0 xəta) |
| Vitest (Unit + Auth + Admin + Student LMS) | `npm run test` | **KEÇDİ** (6 fayl, **22/22 test**) |
| Statik təhlükəsizlik skaneri | `npm run security:check` | **KEÇDİ** (0 pozuntu) |
| Production build | `npm run build` | **KEÇDİ** |

## 5. Aşkar olunan xətalar və həlli
- `LessonContentRenderer.tsx` şərhində `dangerouslySetInnerHTML` sözü `security-check.mjs` tərəfindən işarələndi → şərh yeniləndi, yoxlama 0 pozuntu ilə keçdi.

## 6. Qalan məsələlər və təhlükəsizlik qeydləri
- İnteqrasiya testləri ilə sübut olundu: dərs API cavabında `is_correct` və `solution_code` mövcud deyil; quiz balı yalnız serverdə hesablanır; təyin edilməmiş SQL kursu üçün həm oxuma, həm progress yazma `403` qaytarır; `javascript:` şəkil URL-i bloklanır.

## 7. Növbəti faza (Faza 7)
**Faza 7 — İnteraktiv Python Öyrənmə Mühiti (Pyodide Web Worker):** Python icra mühitinin dərin sınağı (kod icrası, `input()` simulyasiyası, runtime xətaları, çıxış kəsilməsi, sonsuz döngü `worker.terminate()` vaxt limiti, brauzer cavabvermə qabiliyyəti və brauzerdə görünən test hallarının məhdudiyyətlərinin sənədləşdirilməsi).
