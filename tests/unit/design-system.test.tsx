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
        academy_name: 'Kodera',
        whatsapp_button_enabled: false,
        whatsapp_phone: '994501234567',
        whatsapp_message_template: 'Salam {{full_name}} {{reference_code}}',
      },
      { fullName: 'Aysel Əliyeva', email: 'aysel@example.com', referenceCode: 'KDR-2026-AB34CD' },
    );
    expect(disabled).toBeNull();

    const enabled = buildWhatsAppContactUrl(
      {
        academy_name: 'Kodera',
        whatsapp_button_enabled: true,
        whatsapp_phone: '994501234567',
        whatsapp_message_template:
          'Salam! {{academy_name}} müraciətim: {{full_name}}, {{email}}, {{reference_code}}',
      },
      { fullName: 'Aysel Əliyeva', email: 'aysel@example.com', referenceCode: 'KDR-2026-AB34CD' },
    );
    expect(enabled).not.toBeNull();
    expect(enabled?.url.startsWith('https://wa.me/994501234567?text=')).toBe(true);
    expect(enabled?.message).toContain('Aysel Əliyeva');
    expect(enabled?.message).toContain('KDR-2026-AB34CD');
  });

  it('blocks unsafe javascript: URLs and permits safe https/relative URLs', () => {
    expect(isSafeUrl('https://kodera.academy')).toBe(true);
    expect(isSafeUrl('/courses/python')).toBe(true);
    expect(isSafeUrl('mailto:info@kodera.academy')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('//evil.example.com')).toBe(false);
    expect(isSafeUrl('/\\evil.example.com')).toBe(false);

    expect(isSafeImageUrl('https://cdn.example.com/img.png')).toBe(true);
    expect(isSafeImageUrl('/media/diagram.png')).toBe(true);
    expect(isSafeImageUrl('mailto:info@kodera.academy')).toBe(false);
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
