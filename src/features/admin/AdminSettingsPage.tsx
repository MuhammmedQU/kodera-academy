import { useEffect, useState } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import type { AdminPlatformSettings } from '@shared/types/domain';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
  Textarea,
} from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { buildWhatsAppContactUrl } from '@/lib/whatsapp';

export function AdminSettingsPage() {
  const { refreshSettings } = usePlatformSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    academy_name: 'Kodera',
    academy_tagline: '',
    logo_storage_path: null as string | null,
    contact_email: '',
    whatsapp_phone: '',
    whatsapp_button_enabled: false,
    whatsapp_button_label: 'WhatsApp ilə administratora yaz',
    whatsapp_message_template: '',
    alternative_contact_text: '',
    registration_enabled: true,
    default_public_modules_count: 2,
  });

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<AdminPlatformSettings>('/api/admin/settings', { signal: controller.signal })
      .then((data) => {
        setForm({
          academy_name: data.academy_name,
          academy_tagline: data.academy_tagline,
          logo_storage_path: data.logo_storage_path ?? null,
          contact_email: data.contact_email ?? '',
          whatsapp_phone: data.raw_whatsapp_phone ?? '',
          whatsapp_button_enabled: data.raw_whatsapp_button_enabled,
          whatsapp_button_label: data.whatsapp_button_label,
          whatsapp_message_template: data.whatsapp_message_template,
          alternative_contact_text: data.alternative_contact_text ?? '',
          registration_enabled: data.registration_enabled,
          default_public_modules_count: data.default_public_modules_count,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Tənzimləmələr yüklənmədi.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await apiRequest<AdminPlatformSettings>('/api/admin/settings', {
        method: 'PUT',
        body: {
          academy_name: form.academy_name,
          academy_tagline: form.academy_tagline,
          logo_storage_path: form.logo_storage_path || null,
          contact_email: form.contact_email || null,
          whatsapp_phone: form.whatsapp_phone || null,
          whatsapp_button_enabled: form.whatsapp_button_enabled,
          whatsapp_button_label: form.whatsapp_button_label,
          whatsapp_message_template: form.whatsapp_message_template,
          alternative_contact_text: form.alternative_contact_text || null,
          registration_enabled: form.registration_enabled,
          default_public_modules_count: Number(form.default_public_modules_count),
        },
      });
      await refreshSettings();
      setFeedback('Platforma və WhatsApp tənzimləmələri yadda saxlanıldı.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tənzimləmələr saxlanılmadı.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Platforma tənzimləmələri yüklənir..." />;

  const waPreview = buildWhatsAppContactUrl(
    {
      academy_name: form.academy_name,
      whatsapp_button_enabled: form.whatsapp_button_enabled,
      whatsapp_phone: form.whatsapp_phone || null,
      whatsapp_message_template: form.whatsapp_message_template,
    },
    {
      fullName: 'Aysel Məmmədova',
      email: 'aysel@example.com',
      referenceCode: 'KDR-2026-AB34CD',
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
          Platforma və WhatsApp Tənzimləmələri
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Akademiya məlumatlarını, qeydiyyat açarını və WhatsApp əlaqə düyməsini tək mərkəzdən idarə
          edin.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Akademiya və Qeydiyyat Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Akademiya adı"
                required
                value={form.academy_name}
                onChange={(e) => setForm((p) => ({ ...p, academy_name: e.target.value }))}
              />
              <Input
                label="Rəsmi əlaqə emaili"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
              />
            </div>
            <Input
              label="Sloqan / Qısa təsvir"
              required
              value={form.academy_tagline}
              onChange={(e) => setForm((p) => ({ ...p, academy_tagline: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Standart pulsuz giriş modul sayı"
                type="number"
                min={0}
                max={20}
                hint="Hər kursun modul səviyyəsində ictimai giriş ayrıca idarə olunur."
                value={form.default_public_modules_count}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_public_modules_count: Number(e.target.value) }))
                }
              />
              <label className="flex items-center gap-3 self-center rounded-xl border border-zinc-200 p-3.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.registration_enabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, registration_enabled: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#4338CA]"
                />
                Yeni tələbə qeydiyyatı açıqdır
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              WhatsApp Administrator Əlaqə Düyməsi
            </CardTitle>
            <CardDescription>
              Nömrə boş buraxılsa və ya düymə söndürülsə, WhatsApp düyməsi gizlədilir və telefon
              nömrəsi ictimai API cavablarında göstərilmir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.whatsapp_button_enabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, whatsapp_button_enabled: e.target.checked }))
                }
                className="h-4 w-4 accent-emerald-600"
              />
              Qeydiyyatdan sonra WhatsApp əlaqə düyməsini göstər
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="WhatsApp nömrəsi (beynəlxalq rəqəmlərlə)"
                placeholder="994501234567"
                hint="Yalnız ölkə kodu + nömrə (boşluqsuz və '+' olmadan)."
                value={form.whatsapp_phone}
                onChange={(e) => setForm((p) => ({ ...p, whatsapp_phone: e.target.value }))}
              />
              <Input
                label="Düymə yazısı"
                required
                value={form.whatsapp_button_label}
                onChange={(e) => setForm((p) => ({ ...p, whatsapp_button_label: e.target.value }))}
              />
            </div>

            <Textarea
              label="Hazır mesaj şablonu (Azərbaycan dilində)"
              rows={3}
              hint="İstifadə oluna bilən dəyişənlər: {{academy_name}}, {{full_name}}, {{email}}, {{reference_code}}"
              value={form.whatsapp_message_template}
              onChange={(e) =>
                setForm((p) => ({ ...p, whatsapp_message_template: e.target.value }))
              }
            />

            <Textarea
              label="Alternativ əlaqə mətni (WhatsApp bağlı olduqda göstərilir)"
              rows={2}
              value={form.alternative_contact_text}
              onChange={(e) => setForm((p) => ({ ...p, alternative_contact_text: e.target.value }))}
            />

            {form.whatsapp_button_enabled && !waPreview && (
              <Alert variant="warning" title="WhatsApp düyməsi hələ göstərilməyəcək">
                Düymənin ictimai tərəfdə görünməsi üçün düzgün beynəlxalq nömrə (məs.,{' '}
                <code>994501234567</code>) daxil edilməlidir.
              </Alert>
            )}

            {waPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950">
                <p className="font-semibold">Canlı mesaj önizləməsi:</p>
                <p className="mt-1 leading-relaxed">{waPreview.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={saving}>
            <Save className="h-4 w-4" />
            Tənzimləmələri yadda saxla
          </Button>
        </div>
      </form>
    </div>
  );
}
