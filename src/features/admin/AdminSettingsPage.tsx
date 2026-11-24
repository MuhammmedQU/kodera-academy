import { useEffect, useState } from 'react';
import { Building2, Globe, Mail, MessageCircle, Save, ShieldCheck } from 'lucide-react';
import type { AdminPlatformSettings, EmailProviderMode } from '@shared/types/domain';
import {
  Alert,
  Badge,
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

function formatEmailProviderStatus(mode: EmailProviderMode): {
  badge: string;
  variant: 'success' | 'amber' | 'neutral';
  description: string;
} {
  if (mode === 'custom_smtp') {
    return {
      badge: 'Aktiv (Xüsusi SMTP / Transactional Provayder)',
      variant: 'success',
      description:
        'Server mühit dəyişənlərində xüsusi e-poçt provayderi konfiqurasiya olunub. Göndərən adı və rəsmi əlaqə ünvanı aktivdir.',
    };
  }
  if (mode === 'supabase_auth_default') {
    return {
      badge: 'Supabase Auth Standart E-poçt (Xüsusi SMTP qoşulmayıb)',
      variant: 'amber',
      description:
        'Supabase Auth bağlıdır, lakin yüksək həcmli istehsal göndərişi üçün Supabase Dashboard -> Authentication -> SMTP Settings bölməsində rəsmi SMTP provayderi konfiqurasiya edilməlidir.',
    };
  }
  return {
    badge: 'Konfiqurasiya olunmayıb (Lokal Sandbox Rejimi)',
    variant: 'neutral',
    description:
      'Hazırda real e-poçt provayderi qoşulmayıb və heç bir real e-poçt göndərilmir. Canlı göndəriş yalnız Supabase Auth və SMTP açarları konfiqurasiya edildikdən sonra aktivləşir.',
  };
}

export function AdminSettingsPage() {
  const { refreshSettings } = usePlatformSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [emailProviderMode, setEmailProviderMode] = useState<EmailProviderMode>(
    'local_sandbox_unconfigured',
  );

  const [form, setForm] = useState({
    academy_name: 'Kodera Academy',
    academy_tagline: 'Proqramlaşdırmanı sadə, aydın və praktik öyrən',
    logo_storage_path: '',
    website_domain: '',
    admin_login_email: 'koderaaz@gmail.com',
    contact_email: 'muhammed.ehmedov94@gmail.com',
    email_sender_name: 'Kodera Academy',
    whatsapp_phone: '994702045610',
    whatsapp_button_enabled: true,
    whatsapp_button_label: 'WhatsApp ilə administratora yaz',
    whatsapp_message_template:
      'Salam! Kodera Academy-də qeydiyyat müraciəti etdim. Ad: {{full_name}}, Email: {{email}}, Müraciət nömrəsi: {{reference_code}}. Müraciətimin nəzərdən keçirilməsini xahiş edirəm.',
    alternative_contact_text: 'Bizimlə əlaqə saxlamaq üçün rəsmi email ünvanımıza yaza bilərsiniz.',
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
          logo_storage_path: data.logo_storage_path ?? '',
          website_domain: data.website_domain ?? '',
          admin_login_email: data.admin_login_email || 'koderaaz@gmail.com',
          contact_email: data.contact_email ?? 'muhammed.ehmedov94@gmail.com',
          email_sender_name: data.email_sender_name || 'Kodera Academy',
          whatsapp_phone: data.raw_whatsapp_phone ?? '',
          whatsapp_button_enabled: data.raw_whatsapp_button_enabled,
          whatsapp_button_label: data.whatsapp_button_label,
          whatsapp_message_template: data.whatsapp_message_template,
          alternative_contact_text: data.alternative_contact_text ?? '',
          registration_enabled: data.registration_enabled,
          default_public_modules_count: data.default_public_modules_count,
        });
        setEmailProviderMode(data.email_provider_mode ?? 'local_sandbox_unconfigured');
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
      const updated = await apiRequest<AdminPlatformSettings>('/api/admin/settings', {
        method: 'PUT',
        body: {
          academy_name: form.academy_name,
          academy_tagline: form.academy_tagline,
          logo_storage_path: form.logo_storage_path.trim() || null,
          website_domain: form.website_domain.trim() || null,
          admin_login_email: form.admin_login_email.trim().toLowerCase() || 'koderaaz@gmail.com',
          contact_email: form.contact_email.trim() || null,
          email_sender_name: form.email_sender_name.trim() || 'Kodera Academy',
          whatsapp_phone: form.whatsapp_phone.trim() || null,
          whatsapp_button_enabled: form.whatsapp_button_enabled,
          whatsapp_button_label: form.whatsapp_button_label,
          whatsapp_message_template: form.whatsapp_message_template,
          alternative_contact_text: form.alternative_contact_text.trim() || null,
          registration_enabled: form.registration_enabled,
          default_public_modules_count: Number(form.default_public_modules_count),
        },
      });
      setEmailProviderMode(updated.email_provider_mode ?? emailProviderMode);
      await refreshSettings();
      setFeedback('Platforma, WhatsApp və e-poçt tənzimləmələri yadda saxlanıldı.');
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
      fullName: 'Tələbə Adı',
      email: 'telebe@gmail.com',
      referenceCode: 'KDR-2026-AB34CD',
    },
  );

  const emailStatus = formatEmailProviderStatus(emailProviderMode);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">
          Platforma, WhatsApp və E-poçt Tənzimləmələri
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Kodera Academy rəsmi məlumatlarını, gələcək domen konfiqurasiyasını, WhatsApp əlaqə
          düyməsini və e-poçt göndərən parametrlərini idarə edin.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ACADEMY INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4338CA]" />
              1. Akademiya Məlumatları
            </CardTitle>
            <CardDescription>
              Akademiyanın rəsmi adı, əlaqə e-poçtu, gələcək fərdi domeni, loqo yolu və qəbul
              parametrləri.
            </CardDescription>
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
                required
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
                label="Gələcək fərdi vebsayt domeni (istəyə bağlı)"
                placeholder="Hələ alınmayıb (Staging-də Vercel Preview URL istifadə olunur)"
                hint="Fərdi domen alındıqda https:// ilə daxil edin. Boş buraxıldıqda cari APP_URL / Vercel Preview URL istifadə olunur."
                value={form.website_domain}
                onChange={(e) => setForm((p) => ({ ...p, website_domain: e.target.value }))}
              />
              <Input
                label="Loqo saxlama yolu (Supabase Storage / URL)"
                placeholder="public-media/logo.svg (istəyə bağlı)"
                hint="Boş buraxıldıqda standart Kodera brend nişanı göstərilir."
                value={form.logo_storage_path}
                onChange={(e) => setForm((p) => ({ ...p, logo_storage_path: e.target.value }))}
              />
            </div>

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

        {/* 2. WHATSAPP CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              2. WhatsApp Əlaqə İnteqrasiyası
            </CardTitle>
            <CardDescription>
              Tələbə müraciət etdikdən sonra WhatsApp üzərindən administratora əvvəlcədən doldurulmuş
              mesajla yaza bilər. Mesaj avtomatik göndərilmir — tələbə WhatsApp-da Göndər düyməsini
              özü sıxır.
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
                placeholder="994702045610"
                hint="Yalnız ölkə kodu + nömrə (boşluqsuz və '+' olmadan, məs.: 994702045610)."
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
              hint="Dəstəklənən dinamik dəyişənlər: {{full_name}}, {{email}}, {{reference_code}}, {{academy_name}}"
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
                <code>994702045610</code>) daxil edilməlidir.
              </Alert>
            )}

            {waPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-1.5">
                <p className="font-semibold">Canlı mesaj önizləməsi:</p>
                <p className="leading-relaxed">{waPreview.message}</p>
                <p className="font-mono text-[11px] text-emerald-800 break-all">
                  URL: {waPreview.url}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. EMAIL CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#4338CA]" />
              3. E-poçt və Göndərən Tənzimləmələri
            </CardTitle>
            <CardDescription>
              Rəsmi əlaqə ünvanı, göndərən adı (Sender Display Name) və server e-poçt provayderinin
              hazırkı vəziyyəti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Administrator giriş emaili (yalnız autentifikasiya)"
                type="email"
                required
                hint="İctimai əlaqə bölmələrində göstərilmir."
                value={form.admin_login_email}
                onChange={(e) => setForm((p) => ({ ...p, admin_login_email: e.target.value }))}
              />
              <Input
                label="İctimai tələbə əlaqə emaili (mailto: və footer)"
                type="email"
                required
                hint="Saytın əlaqə bölmələrində göstərilən rəsmi ünvan."
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
              />
              <Input
                label="E-poçt göndərən adı (Sender Display Name)"
                required
                value={form.email_sender_name}
                onChange={(e) => setForm((p) => ({ ...p, email_sender_name: e.target.value }))}
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-[#FAFAF9] p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase">
                  E-poçt Provayderinin Konfiqurasiya Statusu
                </span>
                <Badge variant={emailStatus.variant} data-testid="email-provider-status-badge">
                  {emailStatus.badge}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed text-zinc-600">{emailStatus.description}</p>
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Təhlükəsizlik qaydası: SMTP şifrələri və API açarları yalnız server mühit
                  dəyişənlərində saxlanılır və heç vaxt brauzerə göndərilmir.
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Globe className="h-4 w-4 shrink-0 text-[#4338CA]" />
                <span>
                  Cari domen: <strong>{form.website_domain || 'Hələ fərdi domen alınmayıb (Vercel Preview / APP_URL)'}</strong>
                </span>
              </div>
            </div>
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
