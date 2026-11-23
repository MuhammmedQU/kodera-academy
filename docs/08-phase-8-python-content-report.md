# Kodera — Faza 8 Hesabatı: İlk İki Python Modulunun Tədris Məzmunu

> **Tarix:** 2026-11-24  
> **Faza:** Faza 8 — First Python Course Content  
> **Status:** Tamamlandı və real Python 3.12 ilə doğrulandı

## 1. Nə tamamlandı?
Proqramlaşdırmanı heç bilməyən yeni başlayanlar üçün aydın, səmimi və praktik Azərbaycan dilində ilk 2 pulsuz Python modulu (**8 tam dərs, 7 interaktiv məşq, 8 quiz, 70+ strukturlaşdırılmış kontent bloku**) yaradıldı:

### Modul 1: Proqramlaşdırmaya İlk Addım (`is_public = true`)
1. **1.1 Proqramlaşdırma nədir və kompüter bizi necə başa düşür?** — Çay dəmləmək resepti analogiyası, niyə Python, ilk kod nümunəsi, yanlış təsəvvür xəbərdarlığı, quiz, xülasə.
2. **1.2 İlk Python proqramın: `print()` ilə ekrana yazmaq** — Kafe menyusu nümunəsi, dırnaq və kiçik/böyük hərf qaydaları, şərhlər (`#`), 3 klassik xəta, interaktiv məşq, quiz, xülasə.
3. **1.3 Məlumatı yadda saxlamaq: Dəyişənlər (*Variables*)** — Etiketli qutu analogiyası, dəyər yeniləmə, adlandırma qaydaları, tələbə kartı məşqi, 2 suallıq quiz, xülasə.
4. **1.4 Məlumat növləri: Mətn (`str`), Tam ədəd (`int`) və Kəsr (`float`)** — Niyə `"5" + "5"` nəticəsi `"55"` olur, market çeki nümunəsi, `TypeError` xəbərdarlığı, alış-veriş hesabı məşqi, Modul 1 yekun testi.

### Modul 2: Proqramın Düşünməsi və İstifadəçi ilə Ünsiyyət (`is_public = true`)
5. **2.1 İstifadəçidən məlumat almaq: `input()`** — Canlı dialoq nümunəsi, `input()`-un həmişə `str` qaytarması xəbərdarlığı, 2 testli fərdi salamlaşma məşqi, quiz, xülasə.
6. **2.2 Hesablamalar və `int()` / `float()` çevirmələri** — Riyazi operatorlar (`+`, `-`, `*`, `/`), taksi gediş haqqı nümunəsi, `ValueError` xəbərdarlığı, yaş kalkulyatoru məşqi, quiz, xülasə.
7. **2.3 Proqramın qərar verməsi: `if`, `elif` və `else`** — Avtobus kartı balansı və hava temperaturu nümunələri, müqayisə işarələri (`==`, `!=`, `>=`, `<=`), 4 boşluq (*indentation*) qaydası, 3 testli imtahan nəticəsi məşqi, quiz, xülasə.
8. **2.4 Yekun Mini-Layihə: Ağıllı Bilet Qiymət Kalkulyatoru** — Bütün öyrənilənləri birləşdirən, uşaq/böyük/yaşlı tariflərini hesablayan 3 ssenarili tam interaktiv proqram + Modul 2 yekun testi → avtomatik **Qeydiyyat Dəvəti**.

### Verilənlər Bazası Seed Faylı
- `supabase/seeds/01_python_intro_modules.sql` (494 sətir, `ON CONFLICT DO NOTHING` — `kodera-dev` və `kodera-prod`-da miqrasiyalardan sonra bir əmrlə yüklənə bilər).

## 2. Niyə bu cür tətbiq olundu?
- Hər dərs "əvvəl niyə lazımdır → sadə analogiya → addım-addım kod → sətirbəsətir izah → tez-tez edilən xəta → praktiki məşq → bilik yoxlaması → xülasə" pedaqoji ardıcıllığı ilə quruldu.
- Məzmunun tək mənbədən (`server/content/pythonModule1.ts`, `pythonModule2.ts`) həm lokal testlərə, həm də real PostgreSQL seed SQL faylına çevrilməsi uyğunsuzluğu sıfıra endirir.

## 3. Yaradılan və ya dəyişdirilən fayllar
- `server/content/pythonModule1.ts`
- `server/content/pythonModule2.ts`
- `server/content/initialSeed.ts`
- `scripts/generate-python-seed-sql.ts`
- `supabase/seeds/01_python_intro_modules.sql`
- `tests/unit/python-curriculum.test.ts`

## 4. İcra olunan testlər və faktiki nəticələr
| Yoxlama | Nəticə | Detal |
| :--- | :--- | :--- |
| TypeScript strict (`npm run typecheck`) | **KEÇDİ** | 0 xəta |
| Real Python 3.12 kurikulum doğrulaması | **KEÇDİ** | Bütün 7 məşqin nümunə həlli öz `test_cases` dəstinə qarşı `passed` oldu |
| Quiz keyfiyyət yoxlaması | **KEÇDİ** | Bütün 8 quiz-in düzgün cavabları və Azərbaycanca izahları təsdiqləndi |
| Ümumi Vitest paketi (`npm run test`) | **KEÇDİ** | 8 fayl, **31/31 test** |
| Statik təhlükəsizlik (`npm run security:check`) | **KEÇDİ** | 0 pozuntu |

## 5. Aşkar olunan xətalar və həlli
- Seed generator skriptində `console.log` ESLint `no-console` xəbərdarlığı verdi → `process.stdout.write` ilə əvəzləndi.

## 6. Qalan məsələlər
- Layihə sahibi Faza 11 sonrası istədiyi dərsin mətnini, nümunələrini və ya məşqlərini kod dəyişmədən birbaşa Admin Panelin **Kontent Redaktoru**ndan redaktə edə və yenilərini əlavə edə biləcək.

## 7. Növbəti faza (Faza 9)
**Faza 9 — İctimai Vebsayt və Marketinq Təcrübəsi:** Tam Ana Səhifə, Kurslar Kataloqu (`/courses`), Kurs Detalları (`/courses/:slug`), İctimai Dərs Oxuyucu (`/courses/:slug/lessons/:lessonSlug` + Modul 2 sonu Qeydiyyat Dəvəti), Akademiya Haqqında (`/about`), Məxfilik Siyasəti (`/privacy`) və İstifadə Şərtləri (`/terms`).
