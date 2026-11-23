import { useState } from 'react';
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
import { ApiError } from '@/lib/apiClient';
import { clientEnv } from '@/lib/env';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;

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
      const user = await login(values);
      if (user.isAdmin) {
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      } else if (user.isActiveStudent) {
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
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-[#4338CA]" />
            Daxil ol
          </CardTitle>
          <CardDescription>Qeydiyyatdan keçdiyiniz email və şifrəni daxil edin.</CardDescription>
        </CardHeader>
        <CardContent>
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

          {clientEnv.isLocalSandbox && (
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

          <p className="mt-6 text-center text-sm text-zinc-600">
            Hesabınız yoxdur?{' '}
            <Link to="/register" className="font-semibold text-[#4338CA] hover:underline">
              Qeydiyyat müraciəti et
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
