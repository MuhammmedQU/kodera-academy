import { expect, test } from '@playwright/test';

test.describe('Kodera Academy — Full End-to-End User, Admin, Student & Security Flows', () => {
  test('Public visitor explores homepage, catalog, free Python Module 1 & 2, and is blocked from Module 3', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Proqramlaşdırmanı sıfırdan/i })).toBeVisible();

    // Navigate to Courses Catalog
    await page.getByRole('link', { name: 'Kurslar', exact: true }).first().click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByText(/Python Proqramlaşdırma/i)).toBeVisible();

    // Open Python course details
    await page.getByRole('link', { name: /Detallara və kurikuluma bax/i }).first().click();
    await expect(page).toHaveURL(/\/courses\/python-esaslari$/);
    await expect(page.getByText('Modul 1: Proqramlaşdırmaya İlk Addım')).toBeVisible();
    await expect(page.getByText('Modul 2: Proqramın Düşünməsi və İstifadəçi ilə Ünsiyyət')).toBeVisible();
    await expect(page.getByText('Təsdiqli tələbələr üçün')).toBeVisible();

    // Read public Lesson 1.1
    await page.goto('/courses/python-esaslari/lessons/proqramlasdirma-nedir');
    await expect(page.getByText(/Proqramlaşdırma əslində nə deməkdir/i)).toBeVisible();

    // Read last public Lesson 2.4 -> shows Registration Invitation Card
    await page.goto('/courses/python-esaslari/lessons/modul-2-yekun-mini-layihe');
    await expect(page.getByText(/Ağıllı Bilet Qiymət Kalkulyatoru/i).first()).toBeVisible();
    await expect(page.getByText(/Pulsuz giriş modullarını tamamladınız/i)).toBeVisible();

    // Direct URL to restricted Module 3 lesson -> blocked, shows registration invitation
    await page.goto('/courses/python-esaslari/lessons/for-dovru-giris');
    await expect(page.getByText(/Qeydiyyat tələb olunan modul/i)).toBeVisible();
    await expect(page.getByText(/for i in range/)).toHaveCount(0);
  });

  test('New student registers -> PENDING status + WhatsApp prefilled link -> blocked from /dashboard and /admin -> Admin approves + assigns Python separately', async ({
    page,
  }) => {
    const uniqueEmail = `e2e.student.${Date.now()}@example.com`;
    const fullName = 'Samir Məmmədov';

    // 1. Register
    await page.goto('/register');
    await page.getByLabel(/Ad və soyad/i).fill(fullName);
    await page.getByLabel(/Email ünvanı/i).fill(uniqueEmail);
    await page.getByLabel(/^Şifrə/i).fill('Kodera2026!');
    await page.getByLabel(/Telefon nömrəsi/i).fill('+994 50 777 88 99');
    await page.getByLabel(/Öyrənmə məqsədiniz/i).fill('Python öyrənmək');
    await page.getByRole('button', { name: /Müraciəti göndər/i }).click();

    // 2. Lands on Application Status as PENDING with KDR reference code & wa.me link
    await expect(page).toHaveURL(/\/application-status$/);
    await expect(page.getByText(/Gözləmədə \(PENDING\)/i)).toBeVisible();
    const refCode = (await page.getByTestId('application-reference-code').textContent())?.trim() || '';
    expect(refCode).toMatch(/^KDR-\d{4}-[2-9A-HJ-NP-Z]{6}$/);

    const waLink = page.getByTestId('whatsapp-contact-link');
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href?.startsWith('https://wa.me/994702045610?text=')).toBe(true);
    const decoded = decodeURIComponent(href ?? '');
    expect(decoded).toContain('Salam! Kodera Academy-də qeydiyyat müraciəti etdim.');
    expect(decoded).toContain(fullName);
    expect(decoded).toContain(uniqueEmail);
    expect(decoded).toContain(refCode);

    // Verify official contact email mailto link in footer
    const mailtoLink = page.locator('footer a[href="mailto:muhammed.ehmedov94@gmail.com"]');
    await expect(mailtoLink).toBeVisible();

    // 3. PENDING student cannot access /dashboard or /admin
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/application-status$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/application-status$/);

    // 4. Logout and login as Admin
    await page.getByRole('button', { name: /Çıxış/i }).click();
    await page.goto('/login');
    await page.getByLabel(/Email ünvanı/i).fill('admin@kodera.local');
    await page.getByLabel(/Şifrə/i).fill('AdminPass123!');
    await page.getByRole('main').getByRole('button', { name: /Daxil ol/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    // Verify Admin Dashboard calculates real database-backed counts (1 newly registered pending student, 0 fake active students/enrollments)
    await expect(page.getByTestId('stat-value-total_registered_users')).toHaveText('1');
    await expect(page.getByTestId('stat-value-pending_applications')).toHaveText('1');
    await expect(page.getByTestId('stat-value-active_students')).toHaveText('0');
    await expect(page.getByTestId('stat-value-active_enrollments')).toHaveText('0');

    // 5. Admin approves the student's application with internal note
    await page.getByRole('link', { name: /Müraciətlər/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/applications$/);
    await page.getByLabel('Müraciət axtarışı').fill(refCode);
    await expect(page.getByText(fullName)).toBeVisible();
    await page.getByRole('button', { name: /Nəzərdən keçir/i }).first().click();
    await page.getByLabel(/Daxili admin qeydi/i).fill('E2E təsdiq qeydi');
    await page.getByRole('button', { name: /Müraciəti təsdiqlə/i }).click();
    await expect(page.getByText(/Müraciət təsdiqləndi/i)).toBeVisible();

    // 6. Admin assigns Python course separately in Enrollments
    await page.getByRole('link', { name: /Kurs təyinatları/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/enrollments$/);
    const studentSelect = page.getByLabel('Aktiv tələbə');
    const studentOption = await studentSelect
      .locator('option', { hasText: uniqueEmail })
      .getAttribute('value');
    expect(studentOption).toBeTruthy();
    await studentSelect.selectOption(studentOption!);

    const courseSelect = page.getByLabel('Kurs');
    const pyOption = await courseSelect
      .locator('option', { hasText: 'Python Proqramlaşdırma' })
      .getAttribute('value');
    expect(pyOption).toBeTruthy();
    await courseSelect.selectOption(pyOption!);
    await page.getByRole('button', { name: /Kursu təyin et/i }).click();
    await expect(page.getByText(/Kurs uğurla təyin edildi/i)).toBeVisible();

    // Verify Admin Overview stats updated after approval & enrollment
    await page.goto('/admin');
    await expect(page.getByTestId('stat-value-pending_applications')).toHaveText('0');
    await expect(page.getByTestId('stat-value-approved_applications')).toHaveText('1');
    await expect(page.getByTestId('stat-value-active_students')).toHaveText('1');
    await expect(page.getByTestId('stat-value-active_enrollments')).toHaveText('1');

    // Verify Admin Settings 3 sections & official contact persistence
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /1\. Akademiya Məlumatları/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /2\. WhatsApp Əlaqə İnteqrasiyası/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /3\. E-poçt və Göndərən Tənzimləmələri/i })).toBeVisible();
    await expect(page.getByTestId('email-provider-status-badge')).toBeVisible();
    await page.getByRole('button', { name: /Tənzimləmələri yadda saxla/i }).click();
    await expect(
      page.getByText(/Platforma, WhatsApp və e-poçt tənzimləmələri yadda saxlanıldı/i),
    ).toBeVisible();

    // 7. Admin verifies Audit Logs recorded the actions
    await page.getByRole('link', { name: /Audit jurnalı/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/audit-logs$/);
    await expect(page.getByText('application.approved').first()).toBeVisible();
    await expect(page.getByText('enrollment.assigned').first()).toBeVisible();
  });

  test('Approved student accesses ONLY assigned course, submits server-graded quiz, completes lesson, and is blocked from unassigned SQL and /admin', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel(/Email ünvanı/i).fill('student@kodera.local');
    await page.getByLabel(/Şifrə/i).fill('StudentPass123!');
    await page.getByRole('main').getByRole('button', { name: /Daxil ol/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Assigned courses page shows Python, NOT SQL
    await page.getByRole('link', { name: /Mənim kurslarım/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/courses$/);
    await expect(page.getByText(/Python Proqramlaşdırma/i).first()).toBeVisible();
    await expect(page.getByText(/SQL və Verilənlər Bazası/i)).toHaveCount(0);

    // Unassigned SQL direct URL is blocked
    await page.goto('/dashboard/courses/sql-verilenler-bazasi');
    await expect(page.getByText(/Bu kurs hesabınıza təyin edilməyib/i)).toBeVisible();

    // Admin route redirects student back to dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Open assigned Python Lesson 1.2 -> submit quiz & mark completed
    await page.goto('/dashboard/courses/python-esaslari/lessons/ilk-python-kodu-print');
    await expect(page.getByText(/1.2 İlk Python proqramın/i)).toBeVisible();

    await page.getByLabel('print("Salam")').check();
    await page.getByRole('button', { name: /Cavabları yoxla/i }).click();
    await expect(page.getByText(/Quiz-dən keçdiniz \(100%\)/i)).toBeVisible();

    await page.getByRole('button', { name: /Dərsi tamamlandı kimi işarələ/i }).click();
    await expect(page.getByText(/Tamamlandı \(geri al\)/i)).toBeVisible();
  });

  test('Mobile (375px), Tablet (768px) & Desktop (1440px) responsive, a11y, 404, and zero console error audit across Public, Student & Admin pages', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => runtimeErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') runtimeErrors.push(`console.error: ${msg.text()}`);
    });

    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
    ] as const;

    const assertAllViewportsClean = async (routePath: string) => {
      await page.goto(routePath, { waitUntil: 'domcontentloaded' });
      await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 });
      await page.waitForTimeout(150);

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const metrics = await page.evaluate(
          () =>
            new Promise<{ overflow: number; nestedInteractive: number }>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  resolve({
                    overflow: document.documentElement.scrollWidth - window.innerWidth,
                    nestedInteractive: document.querySelectorAll('a button, button a').length,
                  });
                }),
              );
            }),
        );
        expect(metrics.overflow, `Horizontal overflow on ${vp.name}:${routePath}`).toBeLessThanOrEqual(2);
        expect(
          metrics.nestedInteractive,
          `Invalid nested <a><button> on ${vp.name}:${routePath}`,
        ).toBe(0);
      }
    };

    // 1. Public pages across Mobile, Tablet, Desktop (10 routes x 3 viewports = 30 checks)
    const publicPaths = [
      '/',
      '/courses',
      '/courses/python-esaslari',
      '/courses/python-esaslari/lessons/proqramlasdirma-nedir',
      '/about',
      '/privacy',
      '/terms',
      '/login',
      '/register',
      '/forgot-password',
    ];
    for (const routePath of publicPaths) {
      await assertAllViewportsClean(routePath);
    }

    // Mobile public menu open + Escape close
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: /Menyunu aç/i }).click();
    await expect(page.getByLabel('Mobil naviqasiya')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Mobil naviqasiya')).toHaveCount(0);

    // 2. Student Dashboard pages across Mobile, Tablet, Desktop + 404 inside /dashboard/*
    await page.goto('/login');
    await page.getByLabel(/Email ünvanı/i).fill('student@kodera.local');
    await page.getByLabel(/Şifrə/i).fill('StudentPass123!');
    await page.getByRole('main').getByRole('button', { name: /Daxil ol/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Xoş gəldiniz/i })).toBeVisible();

    // Verify Mobile Dashboard Drawer has public site link and closes on Escape
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: /Menyunu aç/i }).click();
    await expect(page.getByRole('link', { name: /İctimai sayta keç/i })).toBeVisible();
    await page.keyboard.press('Escape');

    for (const stPath of [
      '/dashboard',
      '/dashboard/courses',
      '/dashboard/courses/python-esaslari',
      '/dashboard/courses/python-esaslari/lessons/ilk-python-kodu-print',
      '/dashboard/progress',
      '/dashboard/profile',
      '/dashboard/settings',
    ]) {
      await assertAllViewportsClean(stPath);
    }

    // Verify 404 inside /dashboard/* renders NotFoundPage (not blank main)
    await page.goto('/dashboard/nonexistent-page');
    await expect(page.getByRole('heading', { name: /Səhifə tapılmadı/i })).toBeVisible();

    // Logout & switch to Admin
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: /Menyunu aç/i }).click();
    await page.getByRole('button', { name: /Hesabdan çıx/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('link', { name: /Daxil ol/i }).first()).toBeVisible();

    // 3. Admin Dashboard pages across Mobile, Tablet, Desktop + 404 inside /admin/*
    await page.goto('/login');
    await page.getByLabel(/Email ünvanı/i).fill('admin@kodera.local');
    await page.getByLabel(/Şifrə/i).fill('AdminPass123!');
    await page.getByRole('main').getByRole('button', { name: /Daxil ol/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    for (const admPath of [
      '/admin',
      '/admin/applications',
      '/admin/students',
      '/admin/enrollments',
      '/admin/courses',
      '/admin/settings',
      '/admin/audit-logs',
    ]) {
      await assertAllViewportsClean(admPath);
    }

    // Verify Admin Course Create modal opens & auto-slug works properly with Azerbaijani diacritics
    await page.goto('/admin/courses');
    await page.getByRole('button', { name: /Yeni kurs yarat/i }).click();
    await page.getByLabel(/Kursun adı/i).fill('Şəbəkə Əsasları');
    await expect(page.getByLabel(/URL Slug/i)).toHaveValue('sebeke-esaslari');
    await page.keyboard.press('Escape');

    // Verify 404 inside /admin/*
    await page.goto('/admin/does-not-exist');
    await expect(page.getByRole('heading', { name: /Səhifə tapılmadı/i })).toBeVisible();

    expect(runtimeErrors, `Uncaught console/page errors: ${runtimeErrors.join('\n')}`).toEqual([]);
  });
});
