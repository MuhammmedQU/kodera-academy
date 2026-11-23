-- ============================================================================
-- KODERA LMS — Initial Python Course & First Two Public Modules Seed
-- Generated from server/content/initialSeed.ts (Module 1 & Module 2: 8 lessons)
-- Idempotent (ON CONFLICT DO NOTHING). Run AFTER migrations 0001-0006.
-- ============================================================================

BEGIN;

-- 1. Courses
INSERT INTO public.courses (id, slug, locale, title, subtitle, description, learning_objectives, target_audience, programming_language, difficulty, estimated_duration_minutes, sort_order, status, published_at)
VALUES ('10000000-0000-4000-8000-000000000001', 'python-esaslari', 'az', 'Python Proqramlaşdırma — Sıfırdan Başlanğıc', 'Proqramlaşdırmaya heç vaxt başlamayanlar üçün sadə, praktik və ardıcıl Python kursu', 'Bu kurs proqramlaşdırma təcrübəsi olmayan tələbələr üçün hazırlanıb. İlk iki modul tamamilə pulsuzdur: əsas anlayışları, dəyişənləri, məlumat növlərini, istifadəçi ilə dialoqu və şərtləri real məşqlərlə özünüz yazaraq öyrənəcəksiniz.', '["Proqramlaşdırma düşüncə tərzini sıfırdan, heç bir texniki jarqona boğulmadan qazanmaq","Python sintaksisi, dəyişənlər, məlumat növləri, input() və if/elif/else şərtləri ilə sərbəst işləmək","Brauzerdə izolyasiya olunmuş mühitdə real kod yazıb avtomatik testlərlə yoxlamaq","Dövrlər, siyahılar, funksiyalar və praktiki mini-layihələrlə möhkəm təməl qurmaq"]'::jsonb, 'Məktəblilər, tələbələr və proqramlaşdırmaya sıfırdan başlamaq istəyən hər kəs.', 'python', 'beginner', 600, 1, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.courses (id, slug, locale, title, subtitle, description, learning_objectives, target_audience, programming_language, difficulty, estimated_duration_minutes, sort_order, status, published_at)
VALUES ('10000000-0000-4000-8000-000000000002', 'sql-verilenler-bazasi', 'az', 'SQL və Verilənlər Bazası Əsasları', 'Real layihələrdə məlumatları sorğulamaq, filtrləmək və analiz etmək', 'SQL vasitəsilə cədvəllər, əlaqələr, SELECT/JOIN/GROUP BY sorğuları və verilənlər bazası məntiqini praktik tapşırıqlarla öyrənin.', '["Relasiyalı verilənlər bazalarının necə işlədiyini anlamaq","SELECT, WHERE, ORDER BY, JOIN və aqreqat sorğular yazmaq"]'::jsonb, 'Backend, Data Analytics və proqramlaşdırma öyrənənlər.', 'sql', 'beginner', 420, 2, 'published', now())
ON CONFLICT (id) DO NOTHING;

-- 2. Modules (is_public controlled strictly in DB)
INSERT INTO public.modules (id, course_id, slug, title, description, sort_order, is_public, status)
VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'modul-1-proqramlasdirmaya-ilk-addim', 'Modul 1: Proqramlaşdırmaya İlk Addım', 'Kompüterin təlimatları necə başa düşdüyü, ilk Python kodu (print), dəyişənlər və əsas məlumat növləri (str, int, float).', 1, true, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modules (id, course_id, slug, title, description, sort_order, is_public, status)
VALUES ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'modul-2-proqramin-dusunmesi-ve-unsiyyet', 'Modul 2: Proqramın Düşünməsi və İstifadəçi ilə Ünsiyyət', 'İstifadəçidən məlumat almaq (input), hesablamalar, if/elif/else şərtləri və ilk tam mini-layihə.', 2, true, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modules (id, course_id, slug, title, description, sort_order, is_public, status)
VALUES ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'modul-3-dovrler-ve-tekrarlanan-emeliyyatlar', 'Modul 3: Dövrlər (for və while) ilə Təkrarlanan Əməliyyatlar', 'Kod təkrarından qurtulmaq, for və while dövrləri ilə real məsələləri avtomatlaşdırmaq.', 3, false, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.modules (id, course_id, slug, title, description, sort_order, is_public, status)
VALUES ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'modul-1-sql-giris', 'Modul 1: SQL-ə Giriş və İlk Sorğular', 'Cədvəllər, sətirlər, sütunlar və ilk SELECT sorğusu.', 1, false, 'published')
ON CONFLICT (id) DO NOTHING;

-- 3. Lessons
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'proqramlasdirma-nedir', '1.1 Proqramlaşdırma nədir və kompüter bizi necə başa düşür?', 'Heç bir texniki jarqon olmadan proqramlaşdırmanın mahiyyəti, resept analogiyası və niyə məhz Python-dan başlamağın ən rahat yol olduğu.', 8, 1, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ilk-python-kodu-print', '1.2 İlk Python proqramın: print() ilə ekrana yazmaq', 'Kompüterlə ilk ünsiyyət: print() funksiyası, dırnaq işarələri, ardıcıl sətirlər və başlanğıcda ən çox edilən xətalar.', 12, 2, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'deyisenler-variables', '1.3 Məlumatı yadda saxlamaq: Dəyişənlər (Variables)', 'Dəyişənlər niyə lazımdır? Etiketli qutu analogiyası, dəyişən yaratmaq, dəyərini yeniləmək və düzgün adlandırma qaydaları.', 14, 3, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'melumat-novleri-metn-ve-reqem', '1.4 Məlumat növləri: Mətn (str), Tam ədəd (int) və Kəsr (float)', 'Niyə "5" + "5" nəticəsi "55", amma 5 + 5 nəticəsi 10 olur? Əsas məlumat növləri və fərqli növləri təhlükəsiz birləşdirmək.', 15, 4, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'istifadeciden-melumat-almaq-input', '2.1 İstifadəçidən məlumat almaq: input()', 'Proqramı interaktiv etmək: istifadəçinin adını soruşmaq, cavabı dəyişəndə saxlamaq və fərdi salamlaşma yaratmaq.', 12, 1, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'riyazi-emeliyyatlar-ve-cevirmeler', '2.2 Hesablamalar və int() / float() çevirmələri', 'input() həmişə mətn qaytarır! Onu necə ədədə çeviririk və Python-da toplama, çıxma, vurma, bölmə ilə real kalkulyator yazırıq.', 15, 2, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'qerar-vermek-if-else', '2.3 Proqramın qərar verməsi: if, elif və else', 'Şərtlər, müqayisə işarələri (==, >, <, >=), Python-da 4 boşluq (indentation) qaydası və real imtahan/balans qərarları.', 16, 3, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', 'modul-2-yekun-mini-layihe', '2.4 Yekun Mini-Layihə: Ağıllı Bilet Qiymət Kalkulyatoru', 'Modul 1 və Modul 2-də öyrəndiyiniz bütün bilikləri birləşdirərək ilk tam funksional Python proqramınızı yazın!', 18, 4, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', 'for-dovru-giris', '3.1 for dövrü ilə təkrarlanan işləri avtomatlaşdırmaq', 'Yalnız təsdiqlənmiş və Python kursu təyin olunmuş tələbələr üçün məhdud dərs.', 15, 1, 'published', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lessons (id, module_id, slug, title, summary, estimated_minutes, sort_order, status, published_at)
VALUES ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000004', 'select-sorgusu', '1.1 SELECT sorğusu ilə məlumat oxumaq', 'Yalnız SQL kursu təyin olunmuş tələbələr üçün məhdud dərs.', 12, 1, 'published', now())
ON CONFLICT (id) DO NOTHING;

-- 4. Exercises, Admin-only Reference Solutions & Test Cases
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'az', 'İlk salamlaşma proqramını yaz', 'print() əmrindən istifadə edərək ekrana dəqiq olaraq iki sətir çıxarın: 1-ci sətirdə "Salam, Kodera!", 2-ci sətirdə isə "Python öyrənirəm!" yazılsın.', 'python', '# 1-ci sətir: Salam, Kodera!
print("")

# 2-ci sətir: Python öyrənirəm!
', '["Hər yeni sətir üçün ayrıca print(\"...\") yazmaq kifayətdir.","Böyük/kiçik hərflərə, vergülə və nida işarəsinə diqqət edin."]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000001', 'print("Salam, Kodera!")
print("Python öyrənirəm!")
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Hər iki salamlaşma sətri düzgün çap olunmalıdır', '', 'Salam, Kodera!
Python öyrənirəm!', NULL, false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'az', 'Tələbə kartı dəyişənləri', 'ad adlı dəyişənə "Murad", seher adlı dəyişənə "Bakı" yazın. Sonra print() ilə ekrana "Murad - Bakı" çıxarın.', 'python', '# Dəyişənləri yaradın
ad = ""
seher = ""

# Ekrana çıxarın
', '["ad = \"Murad\" və seher = \"Bakı\" yazaraq iki dəyişən yaradın.","print(ad, \"-\", seher) yazdıqda Python aralarına avtomatik boşluq qoyur."]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000002', 'ad = "Murad"
seher = "Bakı"
print(ad, "-", seher)
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'ad və seher dəyişənləri düzgün təyin edilməli və "Murad - Bakı" çap olunmalıdır', '', 'Murad - Bakı', 'assert ad == "Murad" and seher == "Bakı"', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', 'az', 'Alış-veriş hesabını hesabla', 'defter_qiymeti dəyişəninə 2.5 (kəsr ədəd), say dəyişəninə 4 (tam ədəd) yazın. cemi dəyişənində onların hasilini hesablayın və ekrana "Cəmi: 10.0 AZN" çıxarın.', 'python', 'defter_qiymeti = 2.5
say = 4
# cemi dəyişənini hesablayın və çap edin
', '["Vurma əməliyyatı üçün * işarəsindən istifadə olunur: cemi = defter_qiymeti * say","Mətnlə ədədi yan-yana çap etməyin ən sadə yolu vergüldür: print(\"Cəmi:\", cemi, \"AZN\")"]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000003', 'defter_qiymeti = 2.5
say = 4
cemi = defter_qiymeti * say
print("Cəmi:", cemi, "AZN")
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'cemi 10.0 olmalı və ekrana "Cəmi: 10.0 AZN" çıxmalıdır', '', 'Cəmi: 10.0 AZN', 'assert cemi == 10.0', false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005', 'az', 'Fərdi salamlaşma proqramı', 'input() ilə istifadəçinin adını oxuyub `ad` dəyişəninə yazın. Sonra ekrana "Xoş gəldin, <ad>!" formatında salamlaşma çıxarın (məs., ad "Ləman" olduqda "Xoş gəldin, Ləman!").', 'python', '# İstifadəçidən adı oxuyun
ad = input()

# Aşağıda salamlaşmanı çap edin
', '["input() çağırışında əlavə sual mətni yazmayın ki, çıxış dəqiq uyğun gəlsin.","Mətnləri boşluq olmadan nida işarəsi ilə birləşdirmək üçün: print(\"Xoş gəldin, \" + ad + \"!\")"]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000004', 'ad = input()
print("Xoş gəldin, " + ad + "!")
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 'Ləman daxil edildikdə "Xoş gəldin, Ləman!" çıxmalıdır', 'Ləman', 'Xoş gəldin, Ləman!', NULL, false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000004', 'Orxan daxil edildikdə "Xoş gəldin, Orxan!" çıxmalıdır', 'Orxan', 'Xoş gəldin, Orxan!', NULL, false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000006', 'az', 'Yaş hesablama kalkulyatoru', 'İstifadəçidən doğum ilini `input()` ilə alın, `int()` ilə tam ədədə çevirin və 2026-cı ildəki yaşını (`2026 - dogum_ili`) hesablayıb yalnız rəqəmi çap edin.', 'python', 'dogum_ili = int(input())
# Yaşı hesablayıb çap edin
', '["int(input()) daxil edilən mətni dərhal tam ədədə çevirir.","yas = 2026 - dogum_ili yazın və print(yas) ilə çap edin."]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000005', 'dogum_ili = int(input())
yas = 2026 - dogum_ili
print(yas)
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000005', '2006 daxil edildikdə 20 çıxmalıdır', '2006', '20', NULL, false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000005', '2000 daxil edildikdə 26 çıxmalıdır', '2000', '26', NULL, false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000007', 'az', 'İmtahan nəticəsi yoxlayıcısı', 'İstifadəçidən imtahan balını (`int(input())`) oxuyun. Əgər bal 51 və ya daha yüksəkdirsə (`bal >= 51`), ekrana "Keçdiniz", əks halda "Yenidən cəhd edin" yazdırın.', 'python', 'bal = int(input())

# if və else ilə yoxlayın
', '["Şərtin sonunda iki nöqtə (:) qoymağı unutmayın: if bal >= 51:","if və else altındakı print() sətri 4 boşluq içəridən (Tab ilə) başlamalıdır."]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000006', 'bal = int(input())
if bal >= 51:
    print("Keçdiniz")
else:
    print("Yenidən cəhd edin")
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000006', '75 bal -> "Keçdiniz"', '75', 'Keçdiniz', NULL, false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000006', '51 bal (sərhəd dəyər) -> "Keçdiniz"', '51', 'Keçdiniz', NULL, false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000006', '40 bal -> "Yenidən cəhd edin"', '40', 'Yenidən cəhd edin', NULL, false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercises (id, lesson_id, locale, title, instructions, programming_language, starter_code, hints, execution_mode, time_limit_ms, max_output_chars, status)
VALUES ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000008', 'az', 'Mini-Layihə: Ağıllı Bilet Qiymət Kalkulyatoru', 'Kino zalı üçün bilet proqramı yazın. 1-ci input: yaş (`int`), 2-ci input: bilet sayı (`int`). Qayda: yaş < 12 olarsa 1 bilet 5 AZN; 12 <= yaş < 65 olarsa 10 AZN; yaş >= 65 olarsa 6 AZN. Ümumi məbləği hesablayıb "Ödəniş: <məbləğ> AZN" çap edin.', 'python', 'yas = int(input())
say = int(input())

# 1) Yaşa görə bir biletin qiymətini tapın
# 2) Ümumi məbləği hesablayıb "Ödəniş: <məbləğ> AZN" çap edin
', '["if yas < 12: qiymet = 5 / elif yas < 65: qiymet = 10 / else: qiymet = 6","Sonra cem = qiymet * say hesablayıb print(\"Ödəniş:\", cem, \"AZN\") yazın."]'::jsonb, 'pyodide_worker', 3000, 10000, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_solutions (exercise_id, solution_code) VALUES ('40000000-0000-4000-8000-000000000007', 'yas = int(input())
say = int(input())

if yas < 12:
    qiymet = 5
elif yas < 65:
    qiymet = 10
else:
    qiymet = 6

cem = qiymet * say
print("Ödəniş:", cem, "AZN")
') ON CONFLICT (exercise_id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000007', 'Uşaq (8 yaş, 2 bilet) -> "Ödəniş: 10 AZN"', '8
2', 'Ödəniş: 10 AZN', NULL, false, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000007', 'Gənc/Böyük (25 yaş, 3 bilet) -> "Ödəniş: 30 AZN"', '25
3', 'Ödəniş: 30 AZN', NULL, false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.exercise_test_cases (id, exercise_id, label, stdin_input, expected_stdout, assertion_code, is_hidden, sort_order)
VALUES ('41000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000007', 'Yaşlı (70 yaş, 2 bilet) -> "Ödəniş: 12 AZN"', '70
2', 'Ödəniş: 12 AZN', NULL, false, 3)
ON CONFLICT (id) DO NOTHING;

-- 5. Quizzes, Questions & Options
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'az', '1.1 Anlayış Yoxlaması', 'Proqramlaşdırmanın təməl məntiqini necə qavradığınızı yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000111', '50000000-0000-4000-8000-000000000011', 'single_choice', 'Proqramlaşdırmanı gündəlik həyatda ən yaxşı hansı anlayışa bənzətmək olar?', NULL, NULL, 'Proqram kompüterə addım-addım, dəqiq ardıcıllıqla yerinə yetirməsi üçün verilən təlimatlar siyahısıdır — eynilə yemək resepti kimi.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000111', '51000000-0000-4000-8000-000000000111', 'Addım-addım dəqiq yazılmış yemək reseptinə', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000112', '51000000-0000-4000-8000-000000000111', 'Kompüterin öz-özünə təxmin edib iş görməsinə', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000113', '51000000-0000-4000-8000-000000000111', 'Yalnız yüksək riyaziyyat düsturlarını əzbərləməyə', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'az', '1.2 print() Yoxlama Testi', 'İlk Python əmrinin sintaksisini yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'single_choice', 'Python-da ekrana "Salam" mətnini düzgün çıxaran kod hansıdır?', NULL, NULL, 'Python böyük/kiçik hərflərə həssasdır (kiçik hərflə print yazılır) və mətn mütləq dırnaq işarələri arasında olmalıdır.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'print("Salam")', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000001', 'Print(Salam)', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000003', '51000000-0000-4000-8000-000000000001', 'print(Salam)', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', 'az', '1.3 Dəyişənlər Yoxlama Testi', 'Dəyişən adlandırma və yeniləmə qaydalarını yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000131', '50000000-0000-4000-8000-000000000013', 'single_choice', 'Aşağıdakı dəyişən adlarından hansı Python-da DÜZGÜNDÜR?', NULL, NULL, 'Dəyişən adı rəqəmlə başlaya və içində boşluq daşıya bilməz. Alt xətt (_) ilə sözləri ayırmaq ən düzgün Python üslubudur.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000131', '51000000-0000-4000-8000-000000000131', 'telebe_adi', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000132', '51000000-0000-4000-8000-000000000131', '1ci_telebe', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000133', '51000000-0000-4000-8000-000000000131', 'telebe adi', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000132', '50000000-0000-4000-8000-000000000013', 'single_choice', 'Bu kod ekrana nə çıxaracaq?', 'bal = 10
bal = 25
print(bal)', 'python', 'Eyni dəyişənə yeni dəyər yazdıqda köhnə dəyər silinir və yeni dəyər (25) yadda saxlanılır.', 1, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000134', '51000000-0000-4000-8000-000000000132', '25', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000135', '51000000-0000-4000-8000-000000000132', '10', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000136', '51000000-0000-4000-8000-000000000132', '35', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000004', 'az', '1.4 Modul 1 Yekun Testi', 'Məlumat növləri (str, int, float) arasındakı fərqi yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000141', '50000000-0000-4000-8000-000000000014', 'single_choice', 'Aşağıdakı kodun çıxışı nə olacaq?', 'print("5" + "5")', 'python', '"5" dırnaq içində olduğu üçün rəqəm deyil, mətndir (str). İki mətni + ilə topladıqda Python onları yan-yana birləşdirir: "55".', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000141', '51000000-0000-4000-8000-000000000141', '55', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000142', '51000000-0000-4000-8000-000000000141', '10', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000143', '51000000-0000-4000-8000-000000000141', 'Xəta verər', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000142', '50000000-0000-4000-8000-000000000014', 'single_choice', 'qiymet = 4.99 dəyişəninin məlumat növü hansıdır?', NULL, NULL, 'Onluq nöqtəsi olan ədədlər Python-da float (kəsr ədəd) adlanır.', 1, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000144', '51000000-0000-4000-8000-000000000142', 'float (kəsr ədəd)', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000145', '51000000-0000-4000-8000-000000000142', 'int (tam ədəd)', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000146', '51000000-0000-4000-8000-000000000142', 'str (mətn)', false, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000005', 'az', '2.1 input() Yoxlama Testi', 'input() funksiyasının qaytardığı dəyər haqqında əsas qayda.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000211', '50000000-0000-4000-8000-000000000021', 'single_choice', 'İstifadəçi input() sorğusuna 25 yazdıqda Python onu hansı növdə saxlayır?', 'cavab = input("Yaşınız: ")', 'python', 'İstifadəçi rəqəm yazsa belə, input() funksiyası HƏMİŞƏ mətn (str) qaytarır. Hesablama etmək üçün onu int() və ya float() ilə çevirməliyik.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000211', '51000000-0000-4000-8000-000000000211', 'str (mətn) — "25"', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000212', '51000000-0000-4000-8000-000000000211', 'int (tam ədəd) — 25', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000006', 'az', '2.2 Riyazi Əməliyyatlar Testi', 'Çevirmə və bölmə operatorlarını yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000221', '50000000-0000-4000-8000-000000000022', 'single_choice', 'int("12") + int("8") ifadəsinin nəticəsi nədir?', NULL, NULL, 'int() hər iki mətni tam ədədə çevirir (12 və 8), toplama isə 20 verir.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000221', '51000000-0000-4000-8000-000000000221', '20', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000222', '51000000-0000-4000-8000-000000000221', '128', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000007', 'az', '2.3 if / else Şərtlər Testi', 'Müqayisə operatorları və şərt məntiqini yoxlayın.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000231', '50000000-0000-4000-8000-000000000023', 'single_choice', 'İki dəyərin bərabər olub-olmadığını yoxlamaq üçün if şərtində hansı işarə yazılır?', NULL, NULL, 'Tək = mənimsətmə üçündür (x = 5), qoşa == isə müqayisə üçündür (if x == 5:).', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000231', '51000000-0000-4000-8000-000000000231', '== (qoşa bərabər)', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000232', '51000000-0000-4000-8000-000000000231', '= (tək bərabər)', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quizzes (id, lesson_id, locale, title, description, passing_score_percent, max_attempts, status)
VALUES ('50000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000008', 'az', '2.4 Modul 2 Yekun Yoxlama Testi', 'İlk iki modulun ümumi yekun bilik yoxlaması.', 70, NULL, 'published')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_questions (id, quiz_id, question_type, prompt, code_snippet, code_language, explanation, points, sort_order)
VALUES ('51000000-0000-4000-8000-000000000241', '50000000-0000-4000-8000-000000000024', 'single_choice', 'Aşağıdakı kodda yas = 12 olduqda ekrana nə çıxar?', 'yas = 12
if yas < 12:
    print("Uşaq")
elif yas < 65:
    print("Standart")
else:
    print("Güzəştli")', 'python', '12 < 12 şərti yanlışdır, buna görə Python növbəti elif (12 < 65) şərtinə keçir. O doğru olduğu üçün "Standart" çap olunur.', 1, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000241', '51000000-0000-4000-8000-000000000241', 'Standart', true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000242', '51000000-0000-4000-8000-000000000241', 'Uşaq', false, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quiz_question_options (id, question_id, option_text, is_correct, sort_order)
VALUES ('52000000-0000-4000-8000-000000000243', '51000000-0000-4000-8000-000000000241', 'Güzəştli', false, 3)
ON CONFLICT (id) DO NOTHING;

-- 6. Ordered Lesson Content Blocks
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000001', 'az', 'heading', 1, NULL, '{"level":2,"text":"Proqramlaşdırma əslində nə deməkdir?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000001', 'az', 'paragraph', 2, NULL, '{"text":"Çox insan proqramlaşdırmanı ekran boyu sürətlə axan qəribə yaşıl rəqəmlər kimi təsəvvür edir. Əslində isə proqramlaşdırma çox sadə bir bacarıqdır: kompüterə bir işi hansı ardıcıllıqla görməli olduğunu aydın dildə izah etmək."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000001', 'az', 'example', 3, 'Gündəlik Həyatdan Analogiya: Çay Dəmləmək', '{"scenario":"Təsəvvür edin ki, heç vaxt çay dəmləməmiş bir robot dostunuz var. Ona sadəcə \"çay gətir\" desəniz, nə edəcəyini bilməyəcək. Amma addımları sırayla yazsanız: 1) Çaydana su tök. 2) Suyu qaynat. 3) Dəmliyə çay əlavə et. 4) 5 dəqiqə gözlə. 5) Stəkana süz. Bax bu ardıcıl təlimat siyahısı proqramdır!","walkthrough":"Kompüter çox sürətlidir — saniyədə milyardlarla əməliyyat edə bilir. Amma özü təxmin etmir; yalnız sizin yazdığınız addımları dəqiqliklə icra edir."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000104', '30000000-0000-4000-8000-000000000001', 'az', 'heading', 4, NULL, '{"level":2,"text":"Niyə məhz Python dilindən başlayırıq?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000105', '30000000-0000-4000-8000-000000000001', 'az', 'paragraph', 5, NULL, '{"text":"Kompüterlə danışmaq üçün xüsusi dillər — proqramlaşdırma dilləri yaradılıb. Python dünyada yeni başlayanların ən çox sevdiyi dildir, çünki yazısı insan dilinə çox yaxındır. Eyni zamanda Python sadəcə \"öyrənmə dili\" deyil: veb saytlar, məlumat analitikası, avtomatlaşdırma və süni intellekt sistemləri bu dillə qurulur."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000106', '30000000-0000-4000-8000-000000000001', 'az', 'code', 6, 'İlk Python nümunəsinə baxaq', '{"language":"python","filename":"tanisliq.py","code":"print(\"Xoş gəldin!\")\nprint(\"Bu mənim ilk Python dərsimdir.\")","expected_output":"Xoş gəldin!\nBu mənim ilk Python dərsimdir."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000107', '30000000-0000-4000-8000-000000000001', 'az', 'explanation', 7, 'Bu 2 sətir necə oxunur?', '{"text":"Python kodu həmişə yuxarıdan aşağıya doğru, sətirbəsətir icra edir:","steps":[{"line":1,"note":"1-ci sətirdə `print` əmri ekrana \"Xoş gəldin!\" yazısını çıxarır."},{"line":2,"note":"1-ci sətir bitdikdən sonra 2-ci sətir işləyir və növbəti cümləni aşağı sətirdə göstərir."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000108', '30000000-0000-4000-8000-000000000001', 'az', 'warning', 8, 'Yanlış təsəvvürdən uzaq olun', '{"text":"Proqramlaşdırmanı öyrənmək üçün riyaziyyat dahisi olmaq və ya bütün əmrləri əzbərləmək lazım deyil. Əsas məqsəd məntiqi addım-addım qurmaq və praktika etməkdir. Peşəkar proqramçılar belə tez-tez xəta edir və oxuyaraq düzəldirlər."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000109', '30000000-0000-4000-8000-000000000001', 'az', 'quiz', 9, 'Anlayış yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000011', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000110', '30000000-0000-4000-8000-000000000001', 'az', 'summary', 10, 'Dərs 1.1 Xülasəsi', '{"key_takeaways":["Proqram kompüterə verilən addım-addım dəqiq təlimatlar siyahısıdır.","Python həm sıfırdan öyrənmək üçün ən sadə, həm də real layihələrdə ən güclü dillərdən biridir.","Python kodları yuxarıdan aşağıya doğru ardıcıl icra edir."],"next_step_hint":"Növbəti dərsdə ilk Python kodunuzu özünüz yazacaq və işə salacaqsınız!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000111', '30000000-0000-4000-8000-000000000002', 'az', 'heading', 1, NULL, '{"level":2,"text":"print() əmri niyə lazımdır?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000112', '30000000-0000-4000-8000-000000000002', 'az', 'paragraph', 2, NULL, '{"text":"Bir proqram yazdıqda onun nə etdiyini, hansı nəticəni hesabladığını görmək istəyirik. Bunun üçün Python-da ən ilk öyrənəcəyimiz əmr `print()` funksiyasıdır. İngiliscədən tərcümədə \"çap et\" deməkdir — yəni mötərizənin içində nə yazsanız, onu ekranda göstərir."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000113', '30000000-0000-4000-8000-000000000002', 'az', 'code', 3, 'İlk real kodumuz', '{"language":"python","filename":"salam.py","code":"print(\"Salam, Kodera!\")\nprint(\"Mən bu gün kod yazmağa başladım.\")","expected_output":"Salam, Kodera!\nMən bu gün kod yazmağa başladım."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000114', '30000000-0000-4000-8000-000000000002', 'az', 'explanation', 4, 'Hər detalın mənası', '{"text":"İlk baxışda kiçik görünən simvolların Python-da dəqiq vəzifəsi var:","steps":[{"line":1,"note":"`print` — kiçik hərflərlə yazılan funksiyanın adıdır."},{"line":2,"note":"`(...)` — mötərizələr funksiyaya nəyi göstərməli olduğunu ötürür."},{"line":3,"note":"`\"Salam, Kodera!\"` — qoşa dırnaq işarələri kompüterə deyir ki, içindəki adi mətndir."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000115', '30000000-0000-4000-8000-000000000002', 'az', 'example', 5, 'Real Nümunə: Kafe Menyusu Çapı', '{"scenario":"Kiçik bir kafenin menyusunu ekrana səliqəli çıxarmaq istəyirik:","language":"python","code":"print(\"=== KODERA KAFE ===\")\nprint(\"1. Çay - 2 AZN\")\nprint(\"2. Qəhvə - 4 AZN\")","expected_output":"=== KODERA KAFE ===\n1. Çay - 2 AZN\n2. Qəhvə - 4 AZN","walkthrough":"Hər `print()` əmri yeni sətirdən başlayır, buna görə menyu səliqəli alt-alta görünür."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000116', '30000000-0000-4000-8000-000000000002', 'az', 'note', 6, 'Şərhlər (#) nə üçündür?', '{"text":"Kodun içində `#` işarəsi ilə başlayan sətirləri Python icra etmir. Bunlar özümüz və ya başqaları üçün yazdığımız qeydlərdir (şərhlər / comments)."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000117', '30000000-0000-4000-8000-000000000002', 'az', 'warning', 7, 'Başlanğıcda ən çox edilən 3 xəta', '{"text":"1) `Print(\"Salam\")` — böyük P yazmaq olmaz (`NameError`). 2) `print(Salam)` — mətni dırnaqsız yazmaq olmaz. 3) Dırnağı açıb bağlamağı unutmaq (`SyntaxError`).","common_mistake":"Print(\"Salam\")   # XƏTA: kiçik hərflə print olmalıdır!\nprint(Salam)     # XƏTA: dırnaq işarəsi unudulub!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000118', '30000000-0000-4000-8000-000000000002', 'az', 'exercise', 8, 'Özün sına: İlk Python proqramın', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000001', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000119', '30000000-0000-4000-8000-000000000002', 'az', 'quiz', 9, 'Bilik yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000001', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000120', '30000000-0000-4000-8000-000000000002', 'az', 'summary', 10, 'Dərs 1.2 Xülasəsi', '{"key_takeaways":["`print(\"...\")` əmri mətni ekrana çıxarır.","Mətnlər mütləq qoşa (`\"...\"`) və ya tək (`''...''`) dırnaq içində olmalıdır.","Python böyük və kiçik hərfləri fərqli qəbul edir (`print` düzgündür, `Print` səhvdir)."],"next_step_hint":"Növbəti dərsdə məlumatları yadda saxlamağı — Dəyişənləri öyrənəcəyik."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000121', '30000000-0000-4000-8000-000000000003', 'az', 'heading', 1, NULL, '{"level":2,"text":"Dəyişənlər niyə lazımdır?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000122', '30000000-0000-4000-8000-000000000003', 'az', 'paragraph', 2, NULL, '{"text":"Təsəvvür edin ki, bir proqramda tələbənin adını 10 fərqli yerdə ekrana çıxarmalısınız. Hər dəfə `\"Aysel\"` sözünü əl ilə yazsanız, sabah ad `\"Leyla\"` olduqda 10 yerin hamısını tək-tək dəyişməli olacaqsınız. Proqramlaşdırmada belə məlumatları bir yerdə yadda saxlamaq üçün **dəyişənlər (variables)** istifadə olunur."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000123', '30000000-0000-4000-8000-000000000003', 'az', 'note', 3, 'Sadə analogiya: Etiketli qutu', '{"text":"Dəyişəni üzərində adı yazılmış bir qutu kimi düşünün. Məsələn, qutunun üzərinə `ad` yazırıq və içinə `\"Aysel\"` qoyuruq. Sonra nə vaxt `ad` desək, Python həmin qutunu açır və içindəki `\"Aysel\"` dəyərini gətirir."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000124', '30000000-0000-4000-8000-000000000003', 'az', 'code', 4, 'Dəyişən yaratmaq və istifadə etmək', '{"language":"python","filename":"deyisenler.py","code":"ad = \"Aysel\"\nyas = 19\nprint(\"Tələbə:\", ad)\nprint(\"Yaş:\", yas)","expected_output":"Tələbə: Aysel\nYaş: 19"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000125', '30000000-0000-4000-8000-000000000003', 'az', 'explanation', 5, 'Sətirbəsətir izah', '{"text":"Burada `=` işarəsi riyaziyyatdakı \"bərabərdir\" deyil, \"sağdakı dəyəri soldakı qutuya qoy\" deməkdir:","steps":[{"line":1,"note":"`ad` adlı dəyişən yaradılır və içinə `\"Aysel\"` mətni yazılır."},{"line":2,"note":"`yas` adlı dəyişən yaradılır və içinə `19` ədədi yazılır (rəqəm dırnaqsız yazılır!)."},{"line":3,"note":"`print(\"Tələbə:\", ad)` — diqqət edin, `ad` sözünü dırnaqsız yazırıq ki, Python qutunun içindəki dəyəri göstərsin!"},{"line":4,"note":"Eyni qaydada `yas` dəyişəninin dəyəri (`19`) çap olunur."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000126', '30000000-0000-4000-8000-000000000003', 'az', 'example', 6, 'Dəyişənin dəyərini yeniləmək', '{"scenario":"Oyun oynayarkən xalınız əvvəl 0 olur, sonra 10 xal qazanırsınız:","language":"python","code":"xal = 0\nprint(\"Başlanğıc xal:\", xal)\nxal = 10\nprint(\"Yeni xal:\", xal)","expected_output":"Başlanğıc xal: 0\nYeni xal: 10","walkthrough":"Adının \"dəyişən\" olmasının səbəbi də budur — proqram işlədikcə qutunun içindəki dəyər dəyişə bilər."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000127', '30000000-0000-4000-8000-000000000003', 'az', 'warning', 7, 'Dəyişən adlandırma qaydaları və tez-tez edilən xətalar', '{"text":"Dəyişən adı hərf və ya `_` ilə başlamalıdır; içində boşluq olmamalıdır; mənalı adlar seçin (`x` yerinə `qiymet`). Həmçinin `print(\"ad\")` yazsanız, qutunun içi yox, elə \"ad\" sözünün özü çıxar!","common_mistake":"1ci_ad = \"Ali\"       # XƏTA: rəqəmlə başlaya bilməz\ntelebe adi = \"Ali\"   # XƏTA: boşluq olmaz, telebe_adi yazın"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000128', '30000000-0000-4000-8000-000000000003', 'az', 'exercise', 8, 'Özün sına: Tələbə kartı', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000002', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000129', '30000000-0000-4000-8000-000000000003', 'az', 'quiz', 9, 'Bilik yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000013', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000130', '30000000-0000-4000-8000-000000000003', 'az', 'summary', 10, 'Dərs 1.3 Xülasəsi', '{"key_takeaways":["Dəyişən məlumatı adlandıraraq yadda saxlayan etiketli qutudur.","`=` operatoru sağdakı dəyəri soldakı dəyişənə mənimsədir.","Dəyişən adlarında boşluq əvəzinə alt xətt (`_`) istifadə edin (`telebe_adi`)."],"next_step_hint":"Modul 1-in son dərsində mətn və ədədlər arasındakı vacib fərqi öyrənəcəyik."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000131', '30000000-0000-4000-8000-000000000004', 'az', 'heading', 1, NULL, '{"level":2,"text":"Məlumat növləri niyə önəmlidir?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000132', '30000000-0000-4000-8000-000000000004', 'az', 'paragraph', 2, NULL, '{"text":"Kompüter üçün `\"5\"` (dırnaq içindəki beş) ilə `5` (həqiqi rəqəm beş) tamamilə fərqli şeylərdir. Birincisi sadəcə mətn simvoludur — onunla vurma və ya bölmə etmək olmaz. İkincisi isə riyazi ədəddir. Buna görə Python hər məlumatın **növünü (data type)** yadda saxlayır."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000133', '30000000-0000-4000-8000-000000000004', 'az', 'code', 3, '3 əsas məlumat növü: str, int, float', '{"language":"python","filename":"novler.py","code":"ad = \"Nigar\"      # str (string) -> mətn\nyas = 21          # int (integer) -> tam ədəd\nqiymet = 3.50     # float -> kəsr (onluq) ədəd\n\nprint(5 + 5)      # ədədləri toplayır -> 10\nprint(\"5\" + \"5\")  # mətnləri yan-yana yapışdırır -> 55","expected_output":"10\n55"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000134', '30000000-0000-4000-8000-000000000004', 'az', 'explanation', 4, 'Niyə fərqli nəticələr alındı?', '{"text":"Eyni `+` işarəsi məlumatın növünə görə fərqli davranır:","steps":[{"line":1,"note":"`str` (mətn): həmişə dırnaq içində yazılır (`\"Bakı\"`, `\"2026\"`)."},{"line":2,"note":"`int` (tam ədəd): nöqtəsiz müsbət, mənfi və ya sıfır ədədlər (`0`, `21`, `-5`)."},{"line":3,"note":"`float` (kəsr ədəd): nöqtə ilə yazılan onluq ədədlər (`3.5`, `19.99`). Vergül yox, nöqtə istifadə olunur!"},{"line":5,"note":"İki ədədi `+` ilə topladıqda riyazi toplama (`10`), iki mətni `+` ilə birləşdirdikdə isə bitişdirmə (`\"55\"`) baş verir."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000135', '30000000-0000-4000-8000-000000000004', 'az', 'example', 5, 'Real Nümunə: Market Çeki', '{"scenario":"3 ədəd çörək alırıq, biri 0.65 AZN-dir. Ümumi məbləği hesablayaq:","language":"python","code":"mehsul = \"Çörək\"\nqiymet = 0.65\nsay = 3\ncem = qiymet * say\nprint(mehsul, \"üçün ödəniş:\", cem, \"AZN\")","expected_output":"Çörək üçün ödəniş: 1.95 AZN","walkthrough":"Kəsr ədədi (`float`) tam ədədə (`int`) vurduqda Python avtomatik kəsr nəticə (`1.95`) verir."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000136', '30000000-0000-4000-8000-000000000004', 'az', 'warning', 6, 'Tez-tez edilən xəta: Mətnlə ədədi + ilə toplamaq', '{"text":"Python `\"Yaşım: \" + 20` yazdıqda xəta (`TypeError`) verir, çünki mətnlə ədədi `+` ilə birləşdirə bilmir. Bunun əvəzinə `print(\"Yaşım:\", 20)` yazmaq ən rahat və təmiz üsuldur.","common_mistake":"print(\"Yaşım: \" + 20)   # TypeError!\nprint(\"Yaşım:\", 20)     # DÜZGÜN!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000137', '30000000-0000-4000-8000-000000000004', 'az', 'exercise', 7, 'Modul 1 Praktikası: Alış-veriş hesabı', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000003', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000138', '30000000-0000-4000-8000-000000000004', 'az', 'quiz', 8, 'Modul 1 Yekun Testi', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000014', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('61000000-0000-4000-8000-000000000139', '30000000-0000-4000-8000-000000000004', 'az', 'summary', 9, 'Modul 1 Tamamlandı!', '{"key_takeaways":["Artıq proqramlaşdırmanın məntiqini, `print()` əmrini, dəyişənləri və 3 əsas məlumat növünü (`str`, `int`, `float`) bilirsiniz.","Kəsr ədədlər həmişə nöqtə (`.`) ilə yazılır (`2.5`), mətnlər isə dırnaqla (`\"2.5\"`).","Fərqli növləri yan-yana çap etmək üçün `print()` daxilində vergüldən istifadə edin."],"next_step_hint":"Modul 2-də proqramlarınız canlanacaq: istifadəçidən məlumat alacaq və şərtlərə görə qərar verəcək!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000201', '30000000-0000-4000-8000-000000000005', 'az', 'heading', 1, NULL, '{"level":2,"text":"Proqramı necə canlı və interaktiv edirik?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000202', '30000000-0000-4000-8000-000000000005', 'az', 'paragraph', 2, NULL, '{"text":"İndiyə qədər yazdığımız proqramlarda bütün məlumatı özümüz kodun içinə yazırdıq. Amma real tətbiqlər — məsələn, bankomat, qeydiyyat forması və ya mesaj proqramı — istifadəçidən məlumat alır. Python-da bunu `input()` funksiyası ilə edirik."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000203', '30000000-0000-4000-8000-000000000005', 'az', 'code', 3, 'İstifadəçidən ad soruşmaq', '{"language":"python","filename":"dialoq.py","code":"ad = input(\"Adınız nədir? \")\nprint(\"Salam,\", ad, \"- Kodera-ya xoş gəldin!\")","expected_output":"Adınız nədir? Aysel\nSalam, Aysel - Kodera-ya xoş gəldin!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000204', '30000000-0000-4000-8000-000000000005', 'az', 'explanation', 4, 'Kod işləyərkən nə baş verir?', '{"text":"`input()` çağırılanda proqram dayanır və istifadəçinin cavab yazmasını gözləyir:","steps":[{"line":1,"note":"`input(...)` istifadəçinin yazdığı mətni oxuyur və `ad` adlı dəyişənə saxlayır."},{"line":2,"note":"Sonra `print()` həmin dəyişəndən istifadə edərək fərdi salamlaşma göstərir."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000205', '30000000-0000-4000-8000-000000000005', 'az', 'warning', 5, 'Vacib qayda: input() həmişə mətn qaytarır!', '{"text":"İstifadəçi klaviaturadan `20` yazsa belə, Python bunu ədəd kimi yox, `\"20\"` mətni (`str`) kimi qəbul edir. Növbəti dərsdə onu ədədə çevirməyi öyrənəcəyik.","common_mistake":"yas = input()\nprint(yas + 1)   # TypeError: mətnlə ədəd toplanmır!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000206', '30000000-0000-4000-8000-000000000005', 'az', 'exercise', 6, 'Özün sına: Fərdi salamlaşma', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000004', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000207', '30000000-0000-4000-8000-000000000005', 'az', 'quiz', 7, 'Bilik yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000021', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000208', '30000000-0000-4000-8000-000000000005', 'az', 'summary', 8, 'Dərs 2.1 Xülasəsi', '{"key_takeaways":["`input()` istifadəçidən məlumat oxuyur və dəyişəndə saxlamağa imkan verir.","`input()` nəticəsi həmişə mətn (`str`) növündə olur."],"next_step_hint":"İndi daxil edilən rəqəmlərlə real hesablamalar aparmağı öyrənək!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000209', '30000000-0000-4000-8000-000000000006', 'az', 'heading', 1, NULL, '{"level":2,"text":"Mətni ədədə çevirmək və hesablamalar"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000210', '30000000-0000-4000-8000-000000000006', 'az', 'paragraph', 2, NULL, '{"text":"İstifadəçidən yaş, qiymət və ya məsafə aldıqda onun üzərində toplama, çıxma, vurma və bölmə etmək istəyirik. Bunun üçün `input()`-dan gələn mətni `int()` (tam ədəd) və ya `float()` (kəsr ədəd) funksiyasına ötürürük."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000211', '30000000-0000-4000-8000-000000000006', 'az', 'code', 3, 'Əsas riyazi operatorlar', '{"language":"python","filename":"hesablama.py","code":"a = 15\nb = 4\nprint(\"Toplama:\", a + b)\nprint(\"Çıxma:\", a - b)\nprint(\"Vurma:\", a * b)\nprint(\"Bölmə:\", a / b)","expected_output":"Toplama: 19\nÇıxma: 11\nVurma: 60\nBölmə: 3.75"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000212', '30000000-0000-4000-8000-000000000006', 'az', 'example', 4, 'Real Nümunə: Taksi Gediş Haqqı', '{"scenario":"Açılış qiyməti 2 AZN, hər kilometr isə 0.80 AZN olan taksi hesablayıcısı:","language":"python","code":"km = float(input())\node = 2 + (km * 0.80)\nprint(\"Ödəniş:\", ode, \"AZN\")","expected_output":"Ödəniş: 6.0 AZN   # (km = 5 olduqda)","walkthrough":"`float(input())` istifadəçinin yazdığı `\"5\"` və ya `\"3.5\"` mətnini kəsr ədədə çevirir ki, `0.80`-ə vura bilək."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000213', '30000000-0000-4000-8000-000000000006', 'az', 'warning', 5, 'Tez-tez edilən xəta: Rəqəm olmayan mətni int() etmək', '{"text":"`int(\"salam\")` yazdıqda Python `\"salam\"` sözünü rəqəmə çevirə bilmədiyi üçün `ValueError` verir. Eyni zamanda kəsr ədəd üçün `int(\"3.5\")` yox, `float(\"3.5\")` istifadə olunmalıdır.","common_mistake":"x = int(\"3.5\")    # ValueError!\nx = float(\"3.5\")  # DÜZGÜN -> 3.5"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000214', '30000000-0000-4000-8000-000000000006', 'az', 'exercise', 6, 'Özün sına: Yaş kalkulyatoru', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000005', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000215', '30000000-0000-4000-8000-000000000006', 'az', 'quiz', 7, 'Bilik yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000022', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000216', '30000000-0000-4000-8000-000000000006', 'az', 'summary', 8, 'Dərs 2.2 Xülasəsi', '{"key_takeaways":["Tam ədəd üçün `int(input())`, kəsr ədəd üçün `float(input())` istifadə edin.","Python-da əsas operatorlar `+`, `-`, `*`, `/` işarələridir."],"next_step_hint":"Növbəti dərsdə proqrama şərtlərə əsasən qərar verməyi (`if`/`else`) öyrədəcəyik."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000217', '30000000-0000-4000-8000-000000000007', 'az', 'heading', 1, NULL, '{"level":2,"text":"Proqram necə qərar verir?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000218', '30000000-0000-4000-8000-000000000007', 'az', 'paragraph', 2, NULL, '{"text":"Həyatda hər gün şərtlərə görə qərar veririk: \"Əgər yağış yağırsa, çətir götür; əks halda götürmə\". Və ya \"Əgər avtobus kartında balans 0.50 AZN-dən çoxdursa, keç; yoxsa xəbərdarlıq göstər\". Python-da bu məntiq `if` (əgər), `elif` (yox əgər) və `else` (əks halda) sözləri ilə yazılır."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000219', '30000000-0000-4000-8000-000000000007', 'az', 'code', 3, 'Avtobus kartı balansı yoxlaması', '{"language":"python","filename":"balans.py","code":"balans = 1.20\nif balans >= 0.50:\n    print(\"Keçid uğurludur!\")\nelse:\n    print(\"Balans kifayət etmir.\")","expected_output":"Keçid uğurludur!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000220', '30000000-0000-4000-8000-000000000007', 'az', 'explanation', 4, '3 vacib detalı yadda saxla', '{"text":"`if / else` yazarkən Python-un ən önəmli qaydaları bunlardır:","steps":[{"line":2,"note":"Şərtin sonunda mütləq iki nöqtə (`:`) qoyulur."},{"line":3,"note":"Şərt doğru olduqda işləyəcək kod **4 boşluq içəridən** (indentation / Tab) yazılır."},{"line":4,"note":"Müqayisə işarələri: `==` (bərabərdir), `!=` (fərqlidir), `>` (böyükdür), `<` (kiçikdir), `>=` (böyük və ya bərabər), `<=` (kiçik və ya bərabər)."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000221', '30000000-0000-4000-8000-000000000007', 'az', 'example', 5, 'Birdən çox seçim: if / elif / else', '{"scenario":"Hava temperaturuna görə geyim məsləhəti verən proqram:","language":"python","code":"temp = 18\nif temp >= 25:\n    print(\"Hava istidir, yüngül geyinin.\")\nelif temp >= 15:\n    print(\"Hava mülayimdir.\")\nelse:\n    print(\"Hava soyuqdur, gödəkçə geyinin.\")","expected_output":"Hava mülayimdir.","walkthrough":"Python şərtləri yuxarıdan aşağıya yoxlayır və ilk doğru olan bloku icra edib çıxır."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000222', '30000000-0000-4000-8000-000000000007', 'az', 'warning', 6, 'Ən çox edilən 2 şərt xətası', '{"text":"1) Bərabərliyi yoxlayanda tək `=` yazmaq (`if yas = 18:` səhvdir, `if yas == 18:` düzgündür). 2) `:` işarəsini və ya 4 boşluğu unutmaq (`IndentationError`).","common_mistake":"if bal >= 51\nprint(\"Keçdiniz\")   # XƏTA: : və 4 boşluq yoxdur!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000223', '30000000-0000-4000-8000-000000000007', 'az', 'exercise', 7, 'Özün sına: İmtahan nəticəsi', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000006', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000224', '30000000-0000-4000-8000-000000000007', 'az', 'quiz', 8, 'Bilik yoxlaması', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000023', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000225', '30000000-0000-4000-8000-000000000007', 'az', 'summary', 9, 'Dərs 2.3 Xülasəsi', '{"key_takeaways":["`if`, `elif`, `else` proqramın şərtlərə görə fərqli yollar seçməsini təmin edir.","Müqayisə üçün `==`, böyük-bərabər üçün `>=`, kiçik-bərabər üçün `<=` yazılır.","Şərtin altındakı sətirlər mütləq 4 boşluq (Tab) içəridən başlamalıdır."],"next_step_hint":"İndi bütün öyrəndiklərinizi bir araya gətirib ilk mini-layihənizi yazın!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000226', '30000000-0000-4000-8000-000000000008', 'az', 'heading', 1, NULL, '{"level":2,"text":"İlk real mini-layihənizə hazırsınız!"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000227', '30000000-0000-4000-8000-000000000008', 'az', 'paragraph', 2, NULL, '{"text":"Təbrik edirik! Heç bir başlanğıc bilik olmadan artıq `print()`, dəyişənlər, `str`/`int`/`float`, `input()`, riyazi hesablamalar və `if`/`elif`/`else` şərtlərini mənimsəmisiniz. İndi bunların hamısını bir real tapşırıqda birləşdirəcəyik: **Kino zalı üçün Ağıllı Bilet Qiymət Kalkulyatoru**."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000228', '30000000-0000-4000-8000-000000000008', 'az', 'explanation', 3, 'Məsələni kiçik addımlara bölək', '{"text":"Peşəkar proqramçılar heç vaxt kodu tələsik yazmırlar — əvvəlcə addımları planlaşdırırlar:","steps":[{"line":1,"note":"İstifadəçidən 2 məlumat al: `yas = int(input())` və `say = int(input())`."},{"line":2,"note":"Yaşa görə bir biletin qiymətini müəyyən et: 12-dən kiçik → 5 AZN; 12–64 arası → 10 AZN; 65 və yuxarı → 6 AZN."},{"line":3,"note":"Ümumi məbləği hesabla: `cem = qiymet * say`."},{"line":4,"note":"Nəticəni səliqəli çap et: `print(\"Ödəniş:\", cem, \"AZN\")`."}]}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000229', '30000000-0000-4000-8000-000000000008', 'az', 'note', 4, '3 fərqli testlə yoxlanacaq', '{"text":"Aşağıdakı kodu işə saldıqda sistem proqramınızı avtomatik olaraq uşaq (8 yaş), böyük (25 yaş) və yaşlı (70 yaş) ssenariləri ilə yoxlayacaq."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000230', '30000000-0000-4000-8000-000000000008', 'az', 'exercise', 5, 'Mini-Layihə: Ağıllı Bilet Kalkulyatoru', '{"display_mode":"inline"}'::jsonb, '40000000-0000-4000-8000-000000000007', NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000231', '30000000-0000-4000-8000-000000000008', 'az', 'quiz', 6, 'Modul 2 Yekun Testi', '{"display_mode":"inline"}'::jsonb, NULL, '50000000-0000-4000-8000-000000000024', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('62000000-0000-4000-8000-000000000232', '30000000-0000-4000-8000-000000000008', 'az', 'summary', 7, 'İlk 2 Pulsuz Modulu Uğurla Tamamladınız!', '{"key_takeaways":["Sıfırdan başlayaraq istifadəçi ilə dialoq quran, hesablama aparan və qərar verən tam Python proqramı yazdınız.","Modul 3-dən etibarən for/while dövrləri, siyahılar (lists), funksiyalar və real layihələr sizi gözləyir."],"next_step_hint":"Aşağıdakı qeydiyyat dəvəti vasitəsilə müraciət edərək tam Python kursuna qoşula bilərsiniz."}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('63000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000009', 'az', 'heading', 1, NULL, '{"level":2,"text":"for dövrü niyə lazımdır?"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('63000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000009', 'az', 'code', 2, 'Təkrarlanan əməliyyat', '{"language":"python","filename":"for_loop.py","code":"for i in range(1, 6):\n    print(\"Addım:\", i)","expected_output":"Addım: 1\nAddım: 2\nAddım: 3\nAddım: 4\nAddım: 5"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.lesson_content_blocks (id, lesson_id, locale, block_type, sort_order, title, content, exercise_id, quiz_id, is_published)
VALUES ('63000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000010', 'az', 'code', 1, 'İlk SELECT sorğusu', '{"language":"sql","filename":"query.sql","code":"SELECT full_name, email\nFROM profiles\nWHERE account_status = ''active'';"}'::jsonb, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
