import type { PublicPlatformSettings } from '@shared/types/domain';

const VALID_WA_DIGITS = /^[1-9][0-9]{7,14}$/;

export interface WhatsAppApplicationContext {
  fullName: string;
  email: string;
  referenceCode: string;
  academyName?: string;
}

/**
 * Builds the official WhatsApp Click-to-Chat URL using admin-configured settings.
 * Returns `null` if WhatsApp contact is disabled or no valid phone number is configured.
 * SECURITY: Opening WhatsApp is strictly a manual contact channel and NEVER approves applications.
 */
export function buildWhatsAppContactUrl(
  settings: Pick<
    PublicPlatformSettings,
    'whatsapp_button_enabled' | 'whatsapp_phone' | 'whatsapp_message_template' | 'academy_name'
  >,
  context: WhatsAppApplicationContext,
): { url: string; message: string } | null {
  if (!settings.whatsapp_button_enabled || !settings.whatsapp_phone) {
    return null;
  }

  const digits = settings.whatsapp_phone.replace(/[^0-9]/g, '');
  if (!VALID_WA_DIGITS.test(digits)) {
    return null;
  }

  const template =
    settings.whatsapp_message_template?.trim() ||
    'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.';

  const message = template
    .replaceAll('{{academy_name}}', context.academyName || settings.academy_name || 'Kodera Academy')
    .replaceAll('{{full_name}}', context.fullName)
    .replaceAll('{{email}}', context.email)
    .replaceAll('{{reference_code}}', context.referenceCode);

  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  return { url, message };
}
