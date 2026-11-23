# Kodera — Faza 7 Hesabatı: İnteraktiv Python Öyrənmə Mühiti (Pyodide Web Worker)

> **Tarix:** 2026-11-24  
> **Faza:** Faza 7 — Interactive Python Learning Environment  
> **Status:** Tamamlandı və yoxlanıldı

## 1. Nə tamamlandı?
- **İzolyasiya Olunmuş Brauzer Python İcra Mühiti (`src/features/python-runner/`):**
  - `harness.ts` — Tələbə kodunu təmiz qlobal ad sahəsində (`safe_globals`) icra edən, `stdout`/`stderr`-i toplayan, Modul 2 üçün `builtins.input()` əmrini əvvəlcədən təyin olunmuş `stdin_input` sətirləri ilə əvəz edən, çıxışı `max_output_chars` həddində kəsən və `expected_stdout` / `assertion_code` test hallarını yoxlayan Python harness.
  - `python.worker.ts` — Pyodide WebAssembly mühitini (`v0.27.5`) yalnız ilk icrada *lazy-load* edən ayrıca Web Worker (Vite tərəfindən ayrıca `python.worker-*.js` faylı kimi build olunur).
  - `pythonRunner.ts` — `PythonWorkerRunner` meneceri: UI əsas axınını (*main thread*) heç vaxt dondurmur, vaxt limiti (`time_limit_ms`, 500–15000 ms) aşdıqda sonsuz döngülü worker-i **`worker.terminate()`** ilə sərt dayandırır və növbəti icrada avtomatik yeni təmiz worker yaradır.
- **Redaktor Təkmilləşdirmələri (`ExerciseBlock.tsx`):**
  - `Tab` düyməsi ilə 4 boşluq (*Python indentation*) dəstəyi.
  - İcra zamanı əl ilə **"Dayandır"** düyməsi.
  - Şəffaf izolyasiya qeydi (tələbə kodu heç vaxt backend-də icra olunmur).

## 2. Niyə bu cür tətbiq olundu?
- **Server təhlükəsizliyi:** İstifadəçinin yazdığı ixtiyari Python kodunun backend-də (Vercel Function-da) icra edilməsi ciddi uzaqdan kod icrası (*RCE*) riski yaradar. Pyodide + Web Worker bütün icranı tələbənin öz brauzerinə izolyasiya edir.
- **Sonsuz döngü müdafiəsi:** `SharedArrayBuffer` / COOP-COEP başlıqları olmadan belə `worker.terminate()` sonsuz `while True:` döngülərini 100% etibarlı dayandırır.

## 3. Yaradılan və ya dəyişdirilən fayllar
- `src/features/python-runner/harness.ts`
- `src/features/python-runner/python.worker.ts`
- `src/features/python-runner/pythonRunner.ts`
- `src/features/lessons/ExerciseBlock.tsx`
- `tests/unit/python-runner.test.tsx`

## 4. İcra olunan testlər və faktiki nəticələr
| Yoxlama | Nəticə | Detal |
| :--- | :--- | :--- |
| TypeScript strict (`npm run typecheck`) | **KEÇDİ** | 0 xəta |
| ESLint (`npm run lint`) | **KEÇDİ** | 0 xəta |
| Real Python 3.12 harness icrası | **KEÇDİ** | `print()`, `input()` simulyasiyası, `assertion_code`, `ZeroDivisionError`, stdout kəsilməsi yoxlanıldı |
| Sonsuz döngü `worker.terminate()` və bərpa | **KEÇDİ** | 500 ms limitdə worker sonlandırıldı (`timeout`), növbəti icrada yeni worker açıldı |
| `ExerciseBlock` UI testi | **KEÇDİ** | Çıxış və test keçid nişanı doğrulandı |
| Ümumi Vitest paketi (`npm run test`) | **KEÇDİ** | 7 fayl, **28/28 test** |
| Statik təhlükəsizlik (`npm run security:check`) | **KEÇDİ** | 0 pozuntu |

## 5. Aşkar olunan xətalar və həlli
- Test faylı əvvəlcə `.ts` uzantısı ilə yaradıldığından JSX `<ExerciseBlock />` parse xətası verdi → `.tsx` uzantısına dəyişdirildi, bütün 28 test uğurla keçdi.

## 6. Məhdudiyyətlərin Şəffaf Sənədləşdirilməsi (Vacib!)
1. **Brauzerdə görünən test halları:** Python kodu brauzer daxilində icra olunduğu üçün görünən test halları (`is_hidden = false`) brauzerə göndərilir və texniki istifadəçi DevTools vasitəsilə onları görə bilər. Buna görə brauzer məşqləri **öyrənmə və dərhal praktika** üçün əladır, lakin yüksək riskli imtahan anti-cheat mexanizmi kimi qəbul edilməməlidir.
2. **İlk yükləmə ölçüsü və CDN asılılığı:** Pyodide WASM faylları ilk işə salmada jsDelivr CDN-dən yüklənir (sonradan brauzer keşində qalır). İnternet zəifdirsə və ya kəsilərsə 25 saniyəlik başlanğıc limiti bitdikdə səliqəli xəta mesajı göstərilir.
3. **İnteraktiv `input()`:** Web Worker daxilində bloklanan terminal pəncərəsi yoxdur; bunun əvəzinə hər test halında əvvəlcədən verilmiş `stdin_input` sətirləri `input()`-a ötürülür.
4. **Canlı Pyodide WASM brauzer yoxlaması:** Faza 7-də Python harness real lokal Python 3.12 ilə, Worker timeout/bərpa mexanizmi isə unit testlə yoxlanıldı; canlı Chromium + CDN Pyodide testi Faza 10 Playwright mərhələsində şəbəkə imkanından asılı olaraq ayrıca sınanacaq.

## 7. Növbəti faza (Faza 8)
**Faza 8 — İlk İki Python Modulunun Məzmunu:** Proqramlaşdırmanı sıfırdan öyrənənlər üçün ən yüksək keyfiyyətli, sadə Azərbaycanca 2 modul (8 tam dərs — hər dərsdə real həyat nümunələri, sətirbəsətir kod izahları, tez-tez edilən xətalar, interaktiv məşqlər, quiz-lər və xülasələr) hazırlanacaq.
