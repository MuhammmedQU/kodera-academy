import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  LayoutDashboard,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { formatApplicationStatusAz, formatDateAz } from '@/lib/formatters';
import { buildWhatsAppContactUrl } from '@/lib/whatsapp';

export function ApplicationStatusPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { settings } = usePlatformSettings();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return <Spinner fullPage label="Müraciət statusu yüklənir..." />;
  }

  // SECURITY: Never allow unauthenticated email/reference-code lookup of other users' applications
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle as="h1">Müraciət statusunu görmək üçün daxil olun</CardTitle>
            <CardDescription>
              Şəxsi məlumatlarınızın məxfiliyini qorumaq üçün müraciət statusu yalnız hesabınıza
              daxil olduqdan sonra göstərilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/login" variant="primary" className="flex-1">
              Hesaba daxil ol
            </ButtonLink>
            {settings.registration_enabled && (
              <ButtonLink to="/register" variant="outline" className="flex-1">
                Yeni müraciət et
              </ButtonLink>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, application } = user;
  const accountStatus = profile.account_status;
  const appStatus = application?.status ?? null;

  const whatsapp =
    application && accountStatus === 'pending'
      ? buildWhatsAppContactUrl(settings, {
          fullName: profile.full_name,
          email: profile.email,
          referenceCode: application.reference_code,
          academyName: settings.academy_name,
        })
      : null;

  const handleCopyCode = async () => {
    if (!application) return;
    try {
      await navigator.clipboard.writeText(application.reference_code);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#18181B]">Müraciət Statusu</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Salam, <strong>{profile.full_name}</strong> ({profile.email})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
          <RefreshCw className="h-4 w-4" />
          Statusu yenilə
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle as="h2">Cari vəziyyət</CardTitle>
            {user.isAdmin ? (
              <Badge variant="brand">
                <ShieldCheck className="h-3.5 w-3.5" />
                Administrator hesabı
              </Badge>
            ) : accountStatus === 'suspended' ? (
              <Badge variant="danger">
                <Ban className="h-3.5 w-3.5" />
                Hesab dondurulub
              </Badge>
            ) : accountStatus === 'archived' ? (
              <Badge variant="neutral">
                <Archive className="h-3.5 w-3.5" />
                Hesab arxivlənib
              </Badge>
            ) : appStatus === 'approved' || accountStatus === 'active' ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {formatApplicationStatusAz('approved')}
              </Badge>
            ) : appStatus === 'rejected' ? (
              <Badge variant="danger">
                <XCircle className="h-3.5 w-3.5" />
                {formatApplicationStatusAz('rejected')}
              </Badge>
            ) : (
              <Badge variant="amber">
                <Clock className="h-3.5 w-3.5" />
                {formatApplicationStatusAz('pending')}
              </Badge>
            )}
          </div>
          {application && (
            <CardDescription>
              Göndərilmə tarixi: {formatDateAz(application.submitted_at)}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {application && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-[#FAFAF9] p-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase">
                  Müraciət Referans Nömrəsi
                </p>
                <p
                  data-testid="application-reference-code"
                  className="mt-0.5 font-mono text-lg font-bold text-[#18181B]"
                >
                  {application.reference_code}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </Button>
            </div>
          )}

          {/* ADMIN */}
          {user.isAdmin && (
            <div className="space-y-4">
              <Alert variant="info" title="Administrator hesabı ilə daxil olmusunuz">
                Administrator hesabları üçün qeydiyyat müraciəti tələb olunmur. Tələbə
                müraciətlərini idarə etmək üçün Admin Panelinə keçə bilərsiniz.
              </Alert>
              <ButtonLink to="/admin" variant="secondary" size="lg" className="w-full">
                <ShieldCheck className="h-4 w-4" />
                Admin Panelinə keç
              </ButtonLink>
            </div>
          )}

          {/* SUSPENDED */}
          {!user.isAdmin && accountStatus === 'suspended' && (
            <Alert variant="error" title="Hesabınız müvəqqəti dondurulub">
              Hesabınıza giriş administrator tərəfindən dayandırılıb. Əlavə məlumat üçün rəsmi əlaqə
              kanalı ({settings.contact_email || 'akademiya rəhbərliyi'}) ilə əlaqə saxlayın.
            </Alert>
          )}

          {/* ARCHIVED */}
          {!user.isAdmin && accountStatus === 'archived' && (
            <Alert variant="warning" title="Hesabınız arxivlənib">
              Bu hesab arxiv statusundadır. Hesabın yenidən aktivləşdirilməsi üçün rəsmi əlaqə
              kanalı ({settings.contact_email || 'akademiya rəhbərliyi'}) ilə əlaqə saxlayın.
            </Alert>
          )}

          {/* PENDING */}
          {!user.isAdmin && accountStatus === 'pending' && (appStatus === 'pending' || !appStatus) && (
            <div className="space-y-4">
              <Alert variant="warning" title="Müraciətiniz administrator təsdiqini gözləyir">
                Hesabınız yaradıldı, lakin tam kurs materiallarına giriş yalnız administrator
                təsdiqindən və kurs təyinatından sonra açılır. Bu müddətdə ilk iki pulsuz Python
                modulunu oxumağa davam edə bilərsiniz.
              </Alert>

              {whatsapp ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <h3 className="font-display text-base font-bold text-emerald-950">
                    Administratorla birbaşa əlaqə
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-emerald-900">
                    Müraciətinizin nəzərdən keçirilməsi üçün aşağıdakı düymə ilə WhatsApp-ı açın.
                    Adınız, emailiniz və referans nömrəniz mesaja avtomatik əlavə olunub — sadəcə
                    WhatsApp-da <strong>Göndər</strong> düyməsini sıxın.
                  </p>
                  <div className="mt-4">
                    <a
                      href={whatsapp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="whatsapp-contact-link"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      {settings.whatsapp_button_label}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-emerald-800">
                    Qeyd: WhatsApp mesajını açmaq müraciəti avtomatik təsdiqləmir; təsdiq və kurs
                    təyinatı administrator tərəfindən ayrıca icra olunur.
                  </p>
                </div>
              ) : (
                <Alert variant="info" title="Əlaqə məlumatı">
                  {settings.alternative_contact_text ||
                    'Müraciətiniz növbə ilə yoxlanılır. Suallarınız üçün rəsmi emailimizə yaza bilərsiniz.'}
                  {settings.contact_email && (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="mt-1 block font-semibold text-[#4338CA] hover:underline"
                    >
                      {settings.contact_email}
                    </a>
                  )}
                </Alert>
              )}
            </div>
          )}

          {/* APPROVED */}
          {!user.isAdmin && accountStatus === 'active' && (
            <div className="space-y-4">
              <Alert variant="success" title="Təbrik edirik! Müraciətiniz təsdiqləndi">
                Hesabınız aktivdir. Administrator tərəfindən sizə təyin edilmiş kursları Tələbə
                Panelində görə və dərslərə başlaya bilərsiniz.
              </Alert>
              <ButtonLink to="/dashboard" variant="primary" size="lg" className="w-full">
                <LayoutDashboard className="h-4 w-4" />
                Tələbə Panelinə keç
              </ButtonLink>
            </div>
          )}

          {/* REJECTED */}
          {!user.isAdmin &&
            appStatus === 'rejected' &&
            accountStatus !== 'suspended' &&
            accountStatus !== 'archived' && (
              <Alert variant="error" title="Müraciətiniz təsdiqlənmədi">
                <p>Təəssüf ki, hazırkı qeydiyyat müraciətiniz təsdiqlənmədi.</p>
                {application?.rejection_reason && (
                  <p className="mt-2 font-medium">Səbəb: {application.rejection_reason}</p>
                )}
                {settings.contact_email && (
                  <p className="mt-2 text-xs">
                    Əlavə sualınız varsa:{' '}
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="font-semibold underline"
                    >
                      {settings.contact_email}
                    </a>
                  </p>
                )}
              </Alert>
            )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-zinc-100 pt-4 text-sm">
            <Link to="/courses" className="font-semibold text-[#4338CA] hover:underline">
              ← Pulsuz dərslərə bax
            </Link>
            {user.isAdmin && (
              <Link to="/admin" className="font-semibold text-[#18181B] hover:underline">
                Admin Panelinə keç →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
