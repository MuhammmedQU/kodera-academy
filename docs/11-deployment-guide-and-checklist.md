# Kodera Academy — Production Deployment Bələdçisi və Hazırlıq Yoxlama Siyahısı

> **Diqqət:** Heç bir canlı Production deploy, ödənişli abunəlik, domen alışı və ya real email göndərişi layihə sahibinin açıq qərarı olmadan avtomatik icra olunmayıb. Bu sənəd platformanı **təhlükəsiz və ardıcıl şəkildə** canlıya çıxarmaq üçün dəqiq təlimatdır.

---

## 1. İki Ayrı Supabase Layihəsinin Yaradılması

1. **Development layihəsi (`kodera-dev`):**
   - Supabase Dashboard-da yeni layihə yaradın (məs., Avropa regionu — Frankfurt `eu-central-1`).
   - **SQL Editor** (və ya `npx supabase link` + `npx supabase db push`) vasitəsilə miqrasiyaları **dəqiq bu ardıcıllıqla** icra edin:
     1. `supabase/migrations/202611230001_extensions_enums_locales.sql`
     2. `supabase/migrations/202611230002_identity_roles_applications.sql`
     3. `supabase/migrations/202611230003_courses_modules_lessons_content.sql`
     4. `supabase/migrations/202611230004_enrollments_progress_attempts.sql`
     5. `supabase/migrations/202611230005_settings_audit_ratelimit.sql`
     6. `supabase/migrations/202611230006_security_functions_rls_policies.sql`
   - İlk 2 pulsuz Python modulunu yükləyin:
     - `supabase/seeds/01_python_intro_modules.sql`
2. **Production layihəsi (`kodera-prod`):**
   - Yalnız `kodera-dev`-də bütün canlı RLS və giriş axınlarını yoxladıqdan sonra eyni 6 miqrasiyanı və `01_python_intro_modules.sql` faylını `kodera-prod`-da icra edin.

---

## 2. İlk Admin Hesabının Təhlükəsiz Yaradılması (Bootstrap)

Heç bir admin parolu kod bazasında saxlanılmır. Həm `kodera-dev`, həm `kodera-prod` üçün bir dəfə:
1. Supabase Dashboard → **Authentication → Users → Add User** bölməsində rəsmi admin emailinizlə (və güclü unikal şifrə ilə) istifadəçi yaradın, `Auto Confirm User` seçin.
2. SQL Editor-da aşağıdakı əmri öz real admin emailinizlə icra edin:
```sql
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'SIZIN_ADMIN_EMAILINIZ@domain.com';
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  UPDATE public.profiles SET account_status = 'active' WHERE id = v_admin_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin') ON CONFLICT DO NOTHING;
  DELETE FROM public.applications WHERE user_id = v_admin_id AND status = 'pending';

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (v_admin_id, 'system', 'role.bootstrapped', 'user_roles', v_admin_id, '{"role":"admin"}'::jsonb);
END $$;
```

---

## 3. Supabase Auth, Redirect URLs və Storage Yoxlaması

- **Authentication → URL Configuration:**
  - **Site URL:** `https://sizin-domenin.az` (və ya Vercel production URL)
  - **Redirect URLs allowlist:**
    - `https://sizin-domenin.az/login`
    - `https://sizin-domenin.az/reset-password`
    - *(Dev layihəsində: `http://localhost:5173/login`, `http://localhost:5173/reset-password`)*
- **Authentication → Providers → Email:**
  - `Confirm email` aktiv edin.
  - Minimum password length: `8` (hərf + rəqəm).
  - Production üçün etibarlı xüsusi SMTP provayderi (məs., Resend / Postmark / SES) qoşun ki, təsdiq və şifrə bərpası emailləri spam-a düşməsin.
- **Storage → Buckets:**
  - `public-media` (`public = true`, maks. 5 MB, yalnız `image/jpeg`, `image/png`, `image/webp`, `image/avif`)
  - `lesson-media` (`public = false`, yalnız server-side imzalanmış URL-lər)

---

## 4. Vercel Deployment və Environment Dəyişənləri

1. Kodu şəxsi (**Private**) GitHub repository-ə push edin:
   ```bash
   git remote add origin https://github.com/<ISTIFADECI>/kodera-academy.git
   git push -u origin main
   ```
2. Vercel Dashboard-da layihəni həmin private GitHub repo-dan import edin (`Framework Preset: Vite`).
3. **Environment Variables** bölməsində dəyişənləri ayırın (**Preview → `kodera-dev`**, **Production → `kodera-prod`**):

| Dəyişən | Sahə | Təhlükəsizlik Səviyyəsi |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Frontend + Build | İctimai (`https://...supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Frontend + Build | İctimai publishable açar (RLS ilə məhdud) |
| `VITE_APP_URL` | Frontend + Build | Canlı domen (`https://...`) |
| `SUPABASE_URL` | Yalnız Server (`api/`) | Server-side |
| `SUPABASE_ANON_KEY` | Yalnız Server (`api/`) | Server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | **YALNIZ SERVER (`api/`)** | **GİZLİ — HEÇ VAXT `VITE_` PREFİKSİ İLƏ YAZMAYIN!** |
| `APP_URL` | Yalnız Server (`api/`) | Canlı domen (`https://...`) |

> **XƏBƏRDARLIQ:** Production mühitində `VITE_LOCAL_SANDBOX` və ya `KODERA_LOCAL_SANDBOX` dəyişənlərini təyin **ETMƏYİN** (kod səviyyəsində də `NODE_ENV === 'production'` zamanı tam bloklanıb).

---

## 5. Ehtiyat Nüsxə (Backup), Recovery və Monitoring

- **Database Backup:** Supabase Pro planında gündəlik avtomatik backup + Point-in-Time Recovery (PITR) aktivləşdirin; Free/ilk mərhələdə hər böyük miqrasiyadan əvvəl `pg_dump` ilə şifrəli lokal/bulud backup çıxarın.
- **Recovery Sınağı:** Rübə bir dəfə backup-ın `kodera-dev` bazasında bərpa olunduğunu yoxlayın.
- **Monitoring:** Vercel Functions loglarını və Supabase Postgres/Auth loglarını həftəlik nəzərdən keçirin; `/api/health` endpoint-inə (məs., UptimeRobot pulsuz monitor) 5 dəqiqəlik uptime yoxlaması qoşun.

---

## 6. Canlıya Çıxış Öncəsi Yekun Yoxlama Siyahısı (Pre-Launch Checklist)

- [ ] `kodera-dev`-də bütün 6 miqrasiya + `01_python_intro_modules.sql` xətasız icra olunub.
- [ ] `kodera-dev`-də [02-security-test-plan.md](02-security-test-plan.md) sənədindəki canlı RLS yoxlamaları (`SEC-01` – `SEC-24`) təsdiqlənib.
- [ ] Admin Panel (`/admin/settings`) vasitəsilə rəsmi **WhatsApp nömrəsi** və **əlaqə emaili** daxil edilib və sınaqdan keçirilib.
- [ ] `vercel.json` təhlükəsizlik başlıqları (HSTS, CSP, X-Frame-Options, nosniff) canlı URL-də `curl -I` ilə təsdiqlənib.
- [ ] Qeydiyyat → `PENDING` → WhatsApp düyməsi → Admin Təsdiq → Ayrıca Python Kurs Təyini → Tələbə Girişi canlıda tam sınaqdan keçirilib.
- [ ] Brauzerdə canlı Pyodide Web Worker ilə Dərs 1.2 və Dərs 2.4 məşqləri işə salınıb.
