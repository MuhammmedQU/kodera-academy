import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, MailCheck, RefreshCw, UserPlus } from 'lucide-react';
import type { z } from 'zod';
import { registerSchema, type RegisterInput } from '@shared/validation/schemas';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { apiRequest, ApiError } from '@/lib/apiClient';

const REGISTER_FORM_RESOLVER = zodResolver(registerSchema);

export function RegisterPage() {
  const { user, isLoading, register: registerAccount } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [verificationState, setVerificationState] = useState<{
    email: string;
    referenceCode?: string;
  } | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.isAdmin) navigate('/admin', { replace: true });
    else if (user.isActiveStudent) navigate('/dashboard', { replace: true });
    else navigate('/application-status', { replace: true });
  }, [user, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof registerSchema>, unknown, RegisterInput>({
    resolver: REGISTER_FORM_RESOLVER,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      learning_goals: '',
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    try {
      const res = await registerAccount(values);
      if (res.requiresEmailVerification) {
        setVerificationState({
          email: values.email,
          referenceCode: res.referenceCode,
        });
        return;
      }
      navigate('/application-status', { replace: true });
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Qeydiyyat zamanı gözlənilməz xəta baş verdi.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!verificationState) return;
    setResending(true);
    setResendMessage(null);
    setResendError(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/resend-verification', {
        method: 'POST',
        body: { email: verificationState.email },
        auth: false,
      });
      setResendMessage(res.message);
    } catch (err) {
      setResendError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Təsdiq linki yenidən göndərilmədi.',
      );
    } finally {
      setResending(false);
    }
  };

  if (!settings.registration_enabled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle as="h1">Qeydiyyat müvəqqəti bağlıdır</CardTitle>
            <CardDescription>
              Hal-hazırda yeni tələbə qəbulu dayandırılıb. Pulsuz giriş dərslərini oxumağa davam edə
              və ya bizimlə əlaqə saxlaya bilərsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.alternative_contact_text && (
              <Alert variant="info">{settings.alternative_contact_text}</Alert>
            )}
            <ButtonLink to="/courses" variant="primary" className="w-full">
              Pulsuz dərslərə bax
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationState) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle as="h1">Email ünvanınızı təsdiqləyin</CardTitle>
            <CardDescription>
              Qeydiyyat müraciətiniz <strong>PENDING (Gözləmədə)</strong> statusu ilə yaradıldı.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success" title="Təsdiq linki göndərildi">
              <strong>{verificationState.email}</strong> ünvanına təsdiq linki göndərdik. Emaili
              təsdiqlədikdən sonra hesabınıza daxil olaraq müraciət statusunuzu və WhatsApp əlaqə
              düyməsini görə bilərsiniz.
            </Alert>
            {verificationState.referenceCode && (
              <div className="rounded-xl border border-zinc-200 bg-[#FAFAF9] p-4 text-sm">
                <span className="text-zinc-500">Müraciət referans nömrəniz:</span>
                <p className="mt-1 font-mono text-base font-bold text-[#18181B]">
                  {verificationState.referenceCode}
                </p>
              </div>
            )}
            {resendMessage && <Alert variant="info">{resendMessage}</Alert>}
            {resendError && <Alert variant="error">{resendError}</Alert>}
            <div className="flex flex-col gap-2.5">
              <ButtonLink to="/login" variant="primary" className="w-full">
                Giriş səhifəsinə keç
              </ButtonLink>
              <Button
                variant="outline"
                className="w-full"
                isLoading={resending}
                onClick={handleResendVerification}
              >
                <RefreshCw className="h-4 w-4" />
                Təsdiq emailini yenidən göndər
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-extrabold text-[#18181B]">
          Qeydiyyat Müraciəti
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {settings.academy_name} akademiyasına qoşulmaq üçün müraciətinizi göndərin. Qeydiyyatdan
          sonra müraciətiniz administrator tərəfindən nəzərdən keçiriləcək.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#4338CA]" />
            Tələbə məlumatları
          </CardTitle>
          <CardDescription>
            İlk versiyada onlayn ödəniş yoxdur — müraciətiniz təsdiqləndikdən sonra administrator
            sizə uyğun kursları hesabınıza təyin edəcək.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <Alert variant="error" className="mb-5">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Ad və soyad"
              placeholder="Məs., Aysel Məmmədova"
              required
              autoComplete="name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label="Email ünvanı"
              type="email"
              placeholder="adiniz@gmail.com"
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Şifrə"
              type="password"
              placeholder="Ən azı 8 simvol, hərf və rəqəm"
              required
              autoComplete="new-password"
              hint="Ən azı 8 simvol, ən azı bir hərf və bir rəqəm daxil edin."
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Telefon nömrəsi (istəyə bağlı)"
              type="tel"
              placeholder="+994 50 123 45 67"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Textarea
              label="Öyrənmə məqsədiniz (istəyə bağlı)"
              placeholder="Məs., Proqramlaşdırmanı sıfırdan Python ilə öyrənmək və layihələr hazırlamaq istəyirəm."
              rows={3}
              error={errors.learning_goals?.message}
              {...register('learning_goals')}
            />

            <div className="rounded-xl border border-zinc-200/80 bg-[#FAFAF9] p-3.5 text-xs leading-relaxed text-zinc-600">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4338CA]" />
                <span>
                  Müraciət göndərildikdə hesabınız <strong>Gözləmədə (PENDING)</strong> statusunda
                  yaradılır. Növbəti addımda referans nömrənizi və administratorla əlaqə seçimini
                  görəcəksiniz.
                </span>
              </p>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
              Müraciəti göndər
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="font-semibold text-[#4338CA] hover:underline">
              Daxil olun
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
