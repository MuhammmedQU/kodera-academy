# Kodera Academy — Rəsmi Əlaqə, WhatsApp, E-poçt və Domen Konfiqurasiyası (`ACADEMY_CONTACT_CONFIGURATION.md`)

> **Tarix:** 2026-11-24  
> **Rəsmi Parametrlər:** `Kodera Academy` • WhatsApp: `994702045610` • E-poçt: `muhammed.ehmedov94@gmail.com`

---

## 1. Təsdiqlənmiş Rəsmi Akademiya Məlumatları

| Parametr | Rəsmi Dəyər | Saxlandığı Yer |
| :--- | :--- | :--- |
| **Akademiyanın adı (`academy_name`)** | `Kodera Academy` | `public.platform_settings`, `SettingsContext.tsx`, `.env.example`, `.env.staging.example` |
| **Rəsmi WhatsApp nömrəsi (`whatsapp_phone`)** | `994702045610` | `public.platform_settings` (Miqrasiya `000008`), `SettingsContext.tsx`, `LocalSandboxRepository` |
| **Rəsmi əlaqə e-poçtu (`contact_email`)** | `muhammed.ehmedov94@gmail.com` | `public.platform_settings`, Footer, Haqqımızda, Məxfilik Siyasəti, Müraciət Statusu |
| **E-poçt göndərən adı (`email_sender_name`)** | `Kodera Academy` | `public.platform_settings` (`email_sender_name`), `SMTP_SENDER_NAME` |
| **Fərdi vebsayt domeni (`website_domain`)** | `NULL` *(Hələ alınmayıb)* | `public.platform_settings` (`website_domain`), `APP_URL`, `VITE_APP_URL` |

> **Vacib:** Köhnə nümunə nömrə (`994501234567`), nümunə e-poçt (`info@kodera.academy`) və uydurma domen (`kodera.academy`) bütün tətbiq kodundan, SQL miqrasiyalarından və testlərdən təmizlənib.

---

## 2. WhatsApp Click-to-Chat İnteqrasiyası

- **Fayl:** [whatsapp.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/src/lib/whatsapp.ts) və [ApplicationStatusPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/ApplicationStatusPage.tsx)
- **URL Formatı:**
  ```text
  https://wa.me/994702045610?text=ENCODED_MESSAGE
  ```
- **Standart Azərbaycan dilində mesaj şablonu:**
  ```text
  Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.
  ```
- **Təhlükəsizlik və Davranış Qaydaları:**
  1. Nömrə yalnız rəqəmlərdən ibarətdir (`994702045610` — boşluq və `+` işarəsi yoxdur, `^[1-9][0-9]{7,14}$` regex-i ilə yoxlanılır).
  2. Tələbənin adı (`{{full_name}}`), e-poçtu (`{{email}}`) və unikal müraciət nömrəsi (`{{reference_code}}`, məs. `KDR-2026-XXXXXX`) dinamik yerləşdirilir və `encodeURIComponent()` ilə URL-kodlaşdırılır.
  3. **Avtomatik mesaj göndərilmir:** Düymə yalnız WhatsApp pəncərəsini hazır mətnlə açır; tələbə WhatsApp-da **Göndər (Send)** düyməsini özü sıxır.
  4. **Nömrənin Məxfiliyi:** Administrator `/admin/settings` səhifəsində WhatsApp düyməsini söndürdükdə (`whatsapp_button_enabled = false`), `get_public_platform_settings()` RPC funksiyası `whatsapp_phone` dəyərini `NULL` olaraq maskalayır.

---

## 3. Rəsmi E-poçt və Gələcək SMTP İnteqrasiyası

- **İctimai `mailto:` Keçidləri:**
  - **Footer ([PublicLayout.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/components/layout/PublicLayout.tsx)):** `<a href="mailto:muhammed.ehmedov94@gmail.com">muhammed.ehmedov94@gmail.com</a>`
  - **Akademiya Haqqında ([AboutPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/public/AboutPage.tsx)):** Rəsmi əlaqə `mailto:` linki
  - **Məxfilik Siyasəti ([PrivacyPolicyPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/public/PrivacyPolicyPage.tsx)):** Maddə 5 rəsmi `mailto:` linki
  - **Müraciət Statusu ([ApplicationStatusPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/ApplicationStatusPage.tsx)):** Alternativ əlaqə, dondurulmuş/arxivlənmiş/rədd edilmiş hesab bildirişlərində `mailto:` linki
- **E-poçt Provayderi Statusu (`/admin/settings`):**
  - Server ([supabaseRepository.ts](file:///c:/Users/LENOVO/Desktop/Py_Course/server/lib/supabaseRepository.ts)) mühit dəyişənlərini yoxlayaraq yalnız təhlükəsiz status qaytarır (`email_provider_mode`):
    - `local_sandbox_unconfigured` — Lokal Sandbox rejimi (real e-poçt göndərilmir)
    - `supabase_auth_default` — Supabase Auth qoşulub, lakin xüsusi SMTP hələ konfiqurasiya edilməyib
    - `custom_smtp` — Xüsusi SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) və ya transactional provayder (`RESEND_API_KEY`, `POSTMARK_SERVER_TOKEN`) konfiqurasiya olunub
  - **Heç bir SMTP şifrəsi və ya API açarı kodda saxlanılmır və brauzerə göndərilmir.**

---

## 4. Gələcək Fərdi Domen Konfiqurasiyası

- Hazırda fərdi domen alınmadığı üçün `website_domain` bazada `NULL` olaraq saxlanılır.
- Staging mərhələsində Vercel Preview URL (`APP_URL` və `VITE_APP_URL`) istifadə olunur.
- Gələcəkdə fərdi domen alındıqda:
  1. Vercel Dashboard-da domeni əlavə edib `APP_URL` və `VITE_APP_URL` dəyişənlərini yeniləyin;
  2. `/admin/settings` → **1. Akademiya Məlumatları → Gələcək fərdi vebsayt domeni** sahəsinə `https://...` ünvanını daxil edib yadda saxlayın.
