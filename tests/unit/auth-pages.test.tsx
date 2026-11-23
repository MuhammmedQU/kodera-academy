import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { SettingsProvider } from '@/app/SettingsContext';
import { AuthProvider } from '@/app/AuthContext';

describe('Phase 4 — Registration Form Validation UI', () => {
  it('shows Azerbaijani validation errors when submitting invalid registration inputs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            data: {
              academy_name: 'Kodera',
              academy_tagline: 'Sadə öyrən',
              registration_enabled: true,
              whatsapp_button_enabled: false,
              whatsapp_phone: null,
              whatsapp_button_label: 'WhatsApp ilə administratora yaz',
              whatsapp_message_template: 'Salam {{full_name}}',
              default_public_modules_count: 2,
            },
          }),
      }),
    );

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SettingsProvider>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    const submitBtn = await screen.findByRole('button', { name: /Müraciəti göndər/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/Ad və soyad ən azı 2 simvoldan ibarət olmalıdır/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Düzgün email ünvanı daxil edin/i)).toBeInTheDocument();
    expect(screen.getByText(/Şifrə ən azı 8 simvoldan ibarət olmalıdır/i)).toBeInTheDocument();
  });
});
