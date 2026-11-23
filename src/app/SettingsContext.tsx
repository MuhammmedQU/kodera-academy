import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PublicPlatformSettings } from '@shared/types/domain';
import { apiRequest } from '@/lib/apiClient';

const DEFAULT_SETTINGS: PublicPlatformSettings = {
  academy_name: 'Kodera',
  academy_tagline: 'Proqramlaşdırmanı sadə, aydın və praktik öyrən',
  logo_storage_path: null,
  contact_email: 'info@kodera.academy',
  whatsapp_button_enabled: false,
  whatsapp_phone: null,
  whatsapp_button_label: 'WhatsApp ilə administratora yaz',
  whatsapp_message_template:
    'Salam! {{academy_name}} akademiyasında qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
  alternative_contact_text: 'Bizimlə əlaqə saxlamaq üçün rəsmi email ünvanımıza yaza bilərsiniz.',
  registration_enabled: true,
  default_public_modules_count: 2,
};

interface SettingsContextValue {
  settings: PublicPlatformSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicPlatformSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiRequest<PublicPlatformSettings>('/api/public/settings', {
        auth: false,
      });
      if (data && data.academy_name) {
        setSettings(data);
      }
    } catch {
      // Fall back safely to neutral default labels if API is temporarily unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlatformSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
