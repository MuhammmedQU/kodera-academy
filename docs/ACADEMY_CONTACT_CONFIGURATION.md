# Kodera Academy — Rəsmi Əlaqə, Admin Giriş E-poçtu, WhatsApp və Domen Konfiqurasiyası (`ACADEMY_CONTACT_CONFIGURATION.md`)

> **Tarix:** 2026-11-24  
> **Rəsmi Parametrlər:** `Kodera Academy` • Admin Giriş E-poçtu: `koderaaz@gmail.com` • İctimai Əlaqə E-poçtu: `muhammed.ehmedov94@gmail.com` • WhatsApp: `994702045610`

---

## 1. Təsdiqlənmiş Rəsmi Akademiya və Admin Hesabı Məlumatları

| Parametr | Rəsmi Dəyər | Məqsədi və Görünürlüyü | Saxlandığı Yer |
| :--- | :--- | :--- | :--- |
| **Akademiyanın adı (`academy_name`)** | `Kodera Academy` | İctimai brend və başlıq adı | `public.platform_settings`, `SettingsContext.tsx`, `.env.example`, `.env.staging.example` |
| **Rəsmi Admin Giriş E-poçtu (`admin_login_email`)** | `koderaaz@gmail.com` | **Yalnız `/admin/login` autentifikasiyası üçün** (ictimai əlaqə hissələrində və `GET /api/public/settings` cavabında **HEÇ VAXT** göstərilmir) | `public.platform_settings` (`admin_login_email`), `promote_first_admin.sql`, `ADMIN_LOGIN_EMAIL` |
| **İctimai Tələbə Əlaqə E-poçtu (`contact_email`)** | `muhammed.ehmedov94@gmail.com` | Tələbələrin və ziyarətçilərin akademiya ilə əlaqəsi (`mailto:` linkləri) | `public.platform_settings` (`contact_email`), Footer, Haqqımızda, Məxfilik Siyasəti, Müraciət Statusu |
| **E-poçt göndərən adı (`email_sender_name`)** | `Kodera Academy` | Göndərilən e-poçtların görünən göndərən adı (Sender Display Name) | `public.platform_settings` (`email_sender_name`), `SMTP_SENDER_NAME` |
| **Rəsmi WhatsApp nömrəsi (`whatsapp_phone`)** | `994702045610` | Müraciət sonrası Click-to-Chat əlaqəsi | `public.platform_settings` (Miqrasiya `000008`), `SettingsContext.tsx`, `LocalSandboxRepository` |
| **Fərdi vebsayt domeni (`website_domain`)** | `NULL` *(Hələ alınmayıb)* | Staging-də Vercel Preview URL istifadə olunur | `public.platform_settings` (`website_domain`), `APP_URL`, `VITE_APP_URL` |

> **Vacib Ayrım:** `koderaaz@gmail.com` yalnız administratorun `/admin/login` üzərindən sistemə daxil olması üçündür və ictimai tələbə əlaqə e-poçtu olan `muhammed.ehmedov94@gmail.com` ünvanını əvəz etmir. Köhnə nümunə nömrə (`994501234567`), nümunə e-poçt (`info@kodera.academy`), uydurma domen (`kodera.academy`) və köhnə demo parollar bütün tətbiq kodundan, SQL miqrasiyalarından və testlərdən təmizlənib.

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

## 4. Ayrı Tələbə (`/login`) və Administrator (`/admin/login`) Giriş Arxitekturası və İlk Admin Yüksəltməsi

1. **Tələbə Girişi (`http://127.0.0.1:5173/login` — [LoginPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/LoginPage.tsx)):**
   - Yalnız tələbələr üçündür; səhifədə admin giriş seçimi göstərilmir.
   - Admin hesabı (`koderaaz@gmail.com`) `/login` və ya `POST /api/auth/login` üzərindən daxil olmağa çalışdıqda server və müştəri tərəfindən rədd edilir (`401 INVALID_CREDENTIALS`).
   - Admin hesabı `/dashboard` tələbə panelindən və `/api/student/*` endpoint-lərindən (`403 STUDENT_ACCESS_REQUIRED`) istifadə edə bilməz.
2. **Administrator Girişi (`http://127.0.0.1:5173/admin/login` — [AdminLoginPage.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/AdminLoginPage.tsx)):**
   - Yalnız təsdiqlənmiş administratorlar üçündür.
   - Autentifikasiya olunmamış istifadəçi `/admin` və ya `/admin/*` ünvanına daxil olduqda avtomatik `/admin/login` səhifəsinə yönləndirilir ([ProtectedRoute.tsx](file:///c:/Users/LENOVO/Desktop/Py_Course/src/features/auth/ProtectedRoute.tsx)).
   - Tələbə hesabı `/admin/login`, `POST /api/auth/admin-login`, `POST /api/auth/admin-verify` və ya `/api/admin/*` endpoint-lərinə müraciət etdikdə server tərəfindən rədd edilir (`401`/`403`).
   - Uğurlu admin girişindən sonra birbaşa `/admin` panelinə yönləndirilir.
3. **`koderaaz@gmail.com` İlk Admin Hesabının Təhlükəsiz Bootstrap Prosesi ([promote_first_admin.sql](file:///c:/Users/LENOVO/Desktop/Py_Course/supabase/bootstrap/promote_first_admin.sql)):**
   - Heç bir admin şifrəsi kodda, SQL miqrasiyasında, seed faylında və ya Git tarixçəsində saxlanılmır.
   - `handle_new_user()` qeydiyyat trigger-i `koderaaz@gmail.com` ünvanına avtomatik admin rolu **vermir**.
   - Layihə sahibi Supabase Auth-da `koderaaz@gmail.com` hesabını öz məxfi şifrəsi ilə yaradıb e-poçtu təsdiqlədikdən (`email_confirmed_at IS NOT NULL`) sonra Supabase SQL Editor-da `supabase/bootstrap/promote_first_admin.sql` skriptini icra edir. Skript e-poçt təsdiqini yoxlayır, `student` rolunu və gözləyən müraciət sətrini silir, `admin` rolunu təyin edir və `audit_logs` cədvəlinə `admin.bootstrapped` qeydini yazır.

---

## 5. Gələcək Fərdi Domen Konfiqurasiyası

- Hazırda fərdi domen alınmadığı üçün `website_domain` bazada `NULL` olaraq saxlanılır.
- Staging mərhələsində Vercel Preview URL (`APP_URL` və `VITE_APP_URL`) istifadə olunur.
- Gələcəkdə fərdi domen alındıqda:
  1. Vercel Dashboard-da domeni əlavə edib `APP_URL` və `VITE_APP_URL` dəyişənlərini yeniləyin;
  2. `/admin/settings` → **1. Akademiya Məlumatları → Gələcək fərdi vebsayt domeni** sahəsinə `https://...` ünvanını daxil edib yadda saxlayın.
