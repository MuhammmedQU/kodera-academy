import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { loginSchema, type LoginInput } from '@shared/validation/schemas';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { ApiError } from '@/lib/apiClient';
import { clientEnv } from '@/lib/env';

function parseAuthRedirectNotice(search: string, hash: string): {
  type: 'success' | 'error';
  message: string;
} | null {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
  const error = hashParams.get('error') || searchParams.get('error');

  if (errorCode === 'otp_expired' || error === 'access_denied') {
    return {
      type: 'error',
      message: 'Email təsdiq linkinin vaxtı bitib və ya etibarsızdır. Yenidən giriş və ya təsdiq linki istəyin.',
    };
  }
  if (error) {
    return {
      type: 'error',
      message: 'Autentifikasiya bağlantısı emal olunmadı. Zəhmət olmasa yenidən cəhd edin.',
    };
  }
  if (searchParams.get('verified') === '1' || hashParams.get('type') === 'signup') {
    return {
      type: 'success',
      message: 'Email ünvanınız uğurla təsdiqləndi! Hesabınıza daxil ola bilərsiniz.',
    };
  }
  return null;
}

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;
  const redirectNotice = parseAuthRedirectNotice(location.search, location.hash);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.isAdmin) {
      navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
    } else if (user.isActiveStudent) {
      navigate(from?.startsWith('/dashboard') ? from : '/dashboard', { replace: true });
    } else {
      navigate('/application-status', { replace: true });
    }
  }, [user, isLoading, from, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const signedIn = await login(values);
      if (signedIn.isAdmin) {
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      } else if (signedIn.isActiveStudent) {
        navigate(from?.startsWith('/dashboard') ? from : '/dashboard', { replace: true });
      } else {
        navigate('/application-status', { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Giriş zamanı xəta baş verdi.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-extrabold text-[#18181B]">Hesaba Giriş</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Kurslarınıza və ya müraciət statusunuza baxmaq üçün daxil olun.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-[#4338CA]" />
            Daxil ol
          </CardTitle>
          <CardDescription>Qeydiyyatdan keçdiyiniz email və şifrəni daxil edin.</CardDescription>
        </CardHeader>
        <CardContent>
          {redirectNotice && (
            <Alert variant={redirectNotice.type} className="mb-4">
              {redirectNotice.message}
            </Alert>
          )}
          {serverError && (
            <Alert variant="error" className="mb-4">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email ünvanı"
              type="email"
              placeholder="adiniz@example.com"
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1.5">
              <Input
                label="Şifrə"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#4338CA] hover:underline"
                >
                  Şifrəni unutmusunuz?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
              Daxil ol
            </Button>
          </form>

          {import.meta.env.DEV && clientEnv.isLocalSandbox && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
              <p className="font-semibold">Lokal Sandbox Test Hesabları (yalnız dev rejimi):</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'admin@kodera.local');
                    setValue('password', 'AdminPass123!');
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 font-medium text-[#18181B] shadow-2xs hover:bg-zinc-50"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'student@kodera.local');
                    setValue('password', 'StudentPass123!');
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 font-medium text-[#18181B] shadow-2xs hover:bg-zinc-50"
                >
                  Tələbə (Python)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'pending@kodera.local');
                    setValue('password', 'StudentPass123!');
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 font-medium text-[#18181B] shadow-2xs hover:bg-zinc-50"
                >
                  Pending
                </button>
              </div>
            </div>
          )}

          {settings.registration_enabled && (
            <p className="mt-6 text-center text-sm text-zinc-600">
              Hesabınız yoxdur?{' '}
              <Link to="/register" className="font-semibold text-[#4338CA] hover:underline">
                Qeydiyyat müraciəti et
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
