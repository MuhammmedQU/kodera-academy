import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { resetPasswordSchema } from '@shared/validation/schemas';
import type { z } from 'zod';
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
import { getSupabaseClient } from '@/lib/supabase';

type ResetForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetForm) => {
    setServerError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setServerError(
        'Şifrə yeniləməsi yalnız aktiv Supabase Auth bərpa linki vasitəsilə icra olunur.',
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError('Bərpa linki etibarsızdır və ya vaxtı bitib. Yenidən bərpa sorğusu göndərin.');
      return;
    }
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#4338CA]" />
            Yeni şifrə təyin et
          </CardTitle>
          <CardDescription>Hesabınız üçün güclü yeni şifrə seçin.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <Alert variant="success" title="Şifrə yeniləndi">
                Yeni şifrəniz təhlükəsiz şəkildə saxlanıldı. İndi hesabınıza daxil ola bilərsiniz.
              </Alert>
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Daxil ol
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && <Alert variant="error">{serverError}</Alert>}
              <Input
                label="Yeni şifrə"
                type="password"
                required
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Yeni şifrənin təsdiqi"
                type="password"
                required
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                Şifrəni yenilə
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
