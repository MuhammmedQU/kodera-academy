import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginInput } from '@shared/validation/schemas';
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
  Input,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { ApiError } from '@/lib/apiClient';

export function AdminLoginPage() {
  const { user, isLoading, loginAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.isAdmin) {
      const target =
        from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';
      navigate(target, { replace: true });
    }
  }, [user, isLoading, from, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await loginAdmin(values);
      const target =
        from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Administrator girişi zamanı xəta baş verdi.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="mb-6 text-center">
        <Badge variant="brand" className="mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          İnzibati Portal
        </Badge>
        <h1 className="font-display text-3xl font-extrabold text-[#18181B]">
          Administrator Girişi
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Kodera Academy idarəetmə panelinə yalnız səlahiyyətli administrator hesabları daxil ola
          bilər.
        </p>
      </div>

      <Card className="border-zinc-200/90 shadow-sm">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#4338CA]" />
            Admin Panelinə Giriş
          </CardTitle>
          <CardDescription>
            Səlahiyyətli administrator email və şifrənizi daxil edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && !user.isAdmin && (
            <div className="mb-5 space-y-3">
              <Alert variant="error" title="Administrator səlahiyyəti yoxdur">
                Hazırda tələbə hesabı (<strong>{user.profile.email}</strong>) ilə daxil olmusunuz.
                Tələbə hesabları administrator panelinə daxil ola bilməz.
              </Alert>
              <div className="flex flex-wrap gap-2">
                <ButtonLink
                  to={user.isActiveStudent ? '/dashboard' : '/application-status'}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Tələbə panelinə qayıt
                </ButtonLink>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-red-600 hover:bg-red-50"
                  onClick={() => void logout()}
                >
                  Cari hesabdan çıx
                </Button>
              </div>
            </div>
          )}

          {serverError && (
            <Alert variant="error" className="mb-4">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Administrator email ünvanı"
              type="email"
              placeholder="admin@gmail.com"
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

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Admin panelinə daxil ol
            </Button>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-[#4338CA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              İctimai sayta qayıt
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
