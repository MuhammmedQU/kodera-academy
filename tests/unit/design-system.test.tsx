import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Alert, Badge, BrandLogo, Button, Input } from '@/components/ui';
import { buildWhatsAppContactUrl } from '@/lib/whatsapp';
import { isSafeImageUrl, isSafeUrl, slugifyAz } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { App } from '@/App';
import { SettingsProvider } from '@/app/SettingsContext';
import { AuthProvider } from '@/app/AuthContext';

describe('Phase 3 — Kodera Design System & Foundation', () => {
  it('renders BrandLogo with academy name', () => {
    render(<BrandLogo name="Kodera" />);
    expect(screen.getByText('Kodera')).toBeInTheDocument();
  });

  it('handles Button click and loading state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Başla</Button>);
    await user.click(screen.getByRole('button', { name: 'Başla' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    render(<Button isLoading>Yüklənir</Button>);
    expect(screen.getByRole('button', { name: 'Yüklənir' })).toBeDisabled();
  });

  it('connects Input label and accessible error alert', () => {
    render(<Input label="Email" error="Düzgün email daxil edin." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Düzgün email daxil edin.');
  });

  it('renders Badge and Alert variants cleanly', () => {
    render(
      <>
        <Badge variant="amber">Pulsuz Modul</Badge>
        <Alert variant="warning" title="Diqqət">
          Bu məlumat test üçündür.
        </Alert>
      </>,
    );
    expect(screen.getByText('Pulsuz Modul')).toBeInTheDocument();
    expect(screen.getByText('Diqqət')).toBeInTheDocument();
  });

  it('builds official wa.me URL only when enabled and hides when disabled', () => {
    const disabled = buildWhatsAppContactUrl(
      {
        academy_name: 'Kodera Academy',
        whatsapp_button_enabled: false,
        whatsapp_phone: '994702045610',
        whatsapp_message_template:
          'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
      },
      { fullName: 'Aysel Əliyeva', email: 'aysel@gmail.com', referenceCode: 'KDR-2026-AB34CD' },
    );
    expect(disabled).toBeNull();

    const enabled = buildWhatsAppContactUrl(
      {
        academy_name: 'Kodera Academy',
        whatsapp_button_enabled: true,
        whatsapp_phone: '994702045610',
        whatsapp_message_template:
          'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
      },
      { fullName: 'Aysel Əliyeva', email: 'aysel@gmail.com', referenceCode: 'KDR-2026-AB34CD' },
    );
    expect(enabled).not.toBeNull();
    expect(enabled?.url.startsWith('https://wa.me/994702045610?text=')).toBe(true);
    expect(enabled?.message).toBe(
      'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: Aysel Əliyeva, Email: aysel@gmail.com, Müraciət nömrəsi: KDR-2026-AB34CD. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
    );
  });

  it('blocks unsafe javascript: URLs and permits safe https/relative URLs', () => {
    expect(isSafeUrl('https://vercel.app')).toBe(true);
    expect(isSafeUrl('/courses/python')).toBe(true);
    expect(isSafeUrl('mailto:muhammed.ehmedov94@gmail.com')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('//evil.test')).toBe(false);
    expect(isSafeUrl('/\\evil.test')).toBe(false);

    expect(isSafeImageUrl('https://cdn.jsdelivr.net/img.png')).toBe(true);
    expect(isSafeImageUrl('/media/diagram.png')).toBe(true);
    expect(isSafeImageUrl('mailto:muhammed.ehmedov94@gmail.com')).toBe(false);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);

    // tailwind-merge resolves conflicting utility overrides predictably
    expect(cn('text-zinc-600 p-6', 'text-zinc-200 p-4')).toBe('text-zinc-200 p-4');
    // Azerbaijani slug transliteration
    expect(slugifyAz('Əsas Proqramlaşdırma & Şərtlər')).toBe('esas-proqramlasdirma-sertler');
  });

  it('renders public shell homepage cleanly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { academy_name: 'Kodera' } }),
      }),
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /Proqramlaşdırmanı sıfırdan/i }),
    ).toBeInTheDocument();
  });
});
