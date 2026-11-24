# Kodera Academy — Real Məlumatlar, Demo Ayrımı və Rəsmi Конфиqurasiya Hesabatı (`REAL_DATA_IMPLEMENTATION_REPORT.md`)

> **Tarix:** 2026-11-24  
> **Status:** Tamamlandı və Avtomatlaşdırılmış Testlərlə (Vitest 38/38 + Chrome Playwright E2E 4/4) Doğrulandı

---

## 1. İcra Xülasəsi (Nə Dəyişdi?)

Kodera platforması nümayiş (demo) xarakterli saxta statistikalardan və nümunə əlaqə məlumatlarından tamamilə təmizlənərək **real proqramlaşdırma akademiyası** kimi işləyəcək vəziyyətə gətirildi:

1. **Rəsmi Akademiya və Admin Hesabı Məlumatları Tətbiq Edildi:**
   - **Akademiya adı:** `Kodera Academy`
   - **Rəsmi Admin Giriş E-poçtu (`admin_login_email`):** `koderaaz@gmail.com` (yalnız `/admin/login` autentifikasiyası üçün; ictimai səhifələrdə və `GET /api/public/settings` cavabında heç vaxt göstərilmir)
   - **Rəsmi İctimai Tələbə Əlaqə E-poçtu (`contact_email`):** `muhammed.ehmedov94@gmail.com` (`mailto:muhammed.ehmedov94@gmail.com`)
   - **E-poçt göndərən adı (Sender Display Name):** `Kodera Academy`
   - **Rəsmi WhatsApp nömrəsi:** `994702045610` (`https://wa.me/994702045610?text=...`)
   - **Fərdi domen (`website_domain`):** `NULL` (hələ alınmayıb — heç bir uydurma domen yazılmayıb; Staging-də Vercel Preview URL istifadə olunur, gələcək domen `/admin/settings` və `APP_URL` üzərindən tənzimlənir).
2. **Tələbə (`/login`) və Administrator (`/admin/login`) Girişləri Tam Ayrıldı:**
   - `/login` yalnız tələbələr üçündür (admin giriş seçimi göstərilmir; admin hesabları `/login` və `/dashboard`-dan rədd edilir).
   - `/admin/login` ([AdminLoginPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/AdminLoginPage.tsx)) yalnız administratorlar üçündür (`POST /api/auth/admin-login` və `POST /api/auth/admin-verify` + IP/email rate limiting); autentifikasiya olunmamış `/admin` müraciətləri `/admin/login`-ə yönləndirilir, tələbələr isə həm UI, həm API (`401`/`403`), həm də PostgreSQL RLS (`public.is_admin()`) səviyyəsində bloklanır.
   - Bütün kod bazasından və sənədlərdən köhnə hardcoded sandbox parolları tam silindi (`LocalSandboxRepository` yalnız proses-daxili təsadüfi ephemeral runtime parolundan istifadə edir).
2. **Saxta Admin Statistikaları Silindi və 12 Real Göstərici ilə Əvəzləndi:**
   - Əvvəlki `1 gözləyən müraciət, 2 aktiv tələbə, 2 aktiv təyinat, 1 dondurulmuş hesab` kimi nümunə rəqəmlər tam silindi.
   - Yeni PostgreSQL RPC funksiyası (`public.get_admin_dashboard_stats()` — Miqrasiya `20261123000008`) və server endpoint-i (`GET /api/admin/stats`) vasitəsilə bütün 12 göstərici birbaşa verilənlər bazasından hesablanır.
   - Verilənlər bazasında qeydiyyatlı tələbə olmadıqda bütün istifadəçi/müraciət/təyinat/tamamlanmış dərs göstəriciləri **`0`** göstərir.
3. **Demo Hesablar ilə Real Akademiya Məlumatları Sərt Şəkildə Ayrıldı:**
   - Avtomatlaşdırılmış RBAC testləri üçün istifadə olunan `@kodera.local` test hesabları (`DEMO_FIXTURE_USER_IDS`) heç vaxt `getAdminStats()` statistikalarında, `/admin/students` siyahısında, `/admin/applications` müraciətlərində və ya `/admin/enrollments` hesabatlarında göstərilmir.
   - SQL miqrasiyalarında (`000001`–`000008`) və `01_python_intro_modules.sql` seed faylında **0 demo istifadəçi, 0 demo müraciət, 0 demo təyinat və 0 saxta audit qeydi** var.
   - Lokal Sandbox rejimi aktiv olduqda həm ictimai saytda, həm də panellərdə açıq xəbərdarlıq zolağı (`data-testid="sandbox-mode-banner"`) göstərilir.
4. **Admin Tənzimləmələri (`/admin/settings`) 3 Aydın Bölməyə Ayrıldı:**
   - `1. Akademiya Məlumatları` (Ad, Rəsmi e-poçt, Gələcək fərdi domen, Loqo yolu, Sloqan, Qeydiyyat açarı)
   - `2. WhatsApp Əlaqə İnteqrasiyası` (Aktiv/Deaktiv, Nömrə `994702045610`, Düymə yazısı, Azərbaycan dilində mesaj şablonu, Canlı URL önizləməsi)
   - `3. E-poçt və Göndərən Tənzimləmələri` (Rəsmi e-poçt, Göndərən adı `Kodera Academy`, Server e-poçt provayderinin konfiqurasiya statusu — heç bir gizli SMTP şifrəsi və ya API açarı brauzerə qaytarılmır).

---

## 2. Demo Məlumatlar və Real Verilənlər Bazasının Ayrılması Arxitekturası

| Mühit | Mənbə | İstifadəçilər / Müraciətlər / Təyinatlar | Admin Statistikaları (`/admin`) | Vizual İdentifikasiya |
| :--- | :--- | :--- | :--- | :--- |
| **Lokal Sandbox (`npm run dev:sandbox`)** | `LocalSandboxRepository` (Yalnız RAM) | Başlanğıcda **0** qeydiyyatlı tələbə, **0** müraciət, **0** təyinat, **0** audit qeydi (`@kodera.local` test hesabları yalnız təcrid olunmuş auth testləri üçündür və siyahılardan/statistikadan tam çıxarılıb) | Başlanğıcda `0` göstərir; yalnız real qeydiyyat və admin əməliyyatları ilə artır | Yuxarıda açıq sarı `"Lokal Sandbox Rejimi"` zolağı görünür |
| **Development / Staging (`kodera-dev`)** | Supabase PostgreSQL (`SupabaseRepository`) | Yalnız real qeydiyyatdan keçmiş test/staging istifadəçiləri | `public.get_admin_dashboard_stats()` RPC ilə birbaşa `kodera-dev` PostgreSQL-dən hesablanır | Sandbox zolağı yoxdur |
| **Production (`kodera-prod`)** | Supabase PostgreSQL (`SupabaseRepository`) | Yalnız real akademiya tələbələri (demo kod `VERCEL=1` / `NODE_ENV=production` zamanı sərt bloklanır) | Birbaşa `kodera-prod` PostgreSQL-dən hesablanır | Sandbox zolağı yoxdur |

---

## 3. Hansı Funksiyalar Lokalda İşləyir vs Hansılar Xarici Xidmət Tələb Edir?

| Funksiya | Lokalda İşləyir? | Supabase (`kodera-dev`) Tələb Edir? | E-poçt Provayderi (SMTP) Tələb Edir? |
| :--- | :---: | :---: | :---: |
| Rəsmi WhatsApp (`994702045610`) dinamik mesaj və URL kodlaşdırması | **Bəli (Tam)** | Xeyr | Xeyr |
| Rəsmi `mailto:muhammed.ehmedov94@gmail.com` keçidləri və Footer/Haqqımızda/Məxfilik | **Bəli (Tam)** | Xeyr | Xeyr |
| `/admin/settings` 3 bölməli redaktə və yadda saxlama | **Bəli (RAM-da)** | **Qalıcı PostgreSQL saxlama üçün Bəli** | Xeyr |
| `/admin` 12 real göstəricinin `0`-dan başlayıb əməliyyatlarla yenilənməsi | **Bəli (RAM-da)** | **Canlı PostgreSQL `get_admin_dashboard_stats()` üçün Bəli** | Xeyr |
| Qeydiyyat təsdiq e-poçtunun və şifrə bərpa linkinin real poçt qutusuna çatdırılması | **Xeyr (Simulyasiya edilmir)** | **Bəli (Supabase Auth)** | **Bəli (Real çatdırılma üçün SMTP provayderi)** |

> **Dürüstlük Qeydi:** Canlı `kodera-dev` Supabase layihəsi və SMTP e-poçt provayderi hələ qoşulmadığı üçün real PostgreSQL üzərindəki statistik sorğular və real e-poçt çatdırılması yalnız həmin xarici xidmətlər qoşulduqdan sonra canlı təsdiqlənəcək.

---

## 4. Faktiki Test Nəticələri

- `npm run typecheck` → **KEÇDİ** (`0` xəta)
- `npm run lint` → **KEÇDİ** (`0` xəta, `0` xəbərdarlıq)
- `npm run test` → **KEÇDİ** (`9/9` test faylı, `38/38` test — boş baza `0` statistikası və dinamik artım daxil)
- `npm run build` → **KEÇDİ** (`0` xəta, `0` xəbərdarlıq)
- `npm run security:check` → **KEÇDİ** (`0` pozuntu)
- `npm audit` → **KEÇDİ** (`0` boşluq)
- `npm run test:e2e` → **KEÇDİ** (`4/4` real Chrome Playwright E2E + `72` viewport yoxlaması)
